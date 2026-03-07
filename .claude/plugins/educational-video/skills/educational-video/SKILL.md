# Skill: Educational Video Creator with Voiceover

## When to Activate

Trigger this skill when the user says anything like:
- "create a video", "make me a video", "I want to make a video"
- "make educational video", "convert to narrated video"
- "video from this blog", "video from this article", "video from this tutorial"
- "make a video about...", "create a video about..."
- "turn this into a video"
- "convert my slides to video", "make a video from my PowerPoint", "video from my pptx"

## Pipeline Directory

All commands run from: `D:\2ps-workspace\blog-video-pipeline`

---

## Phase 0 — Setup Check

Run these checks automatically at the start of every session. Guide the user through any failure before continuing.

### Check 1: Node.js

```bash
node --version
```

If command not found, guide the user:

> Node.js isn't installed yet. Here's how to get it:
> 1. Go to https://nodejs.org and click "Download Node.js (LTS)"
> 2. Run the installer — click Next through all steps
> 3. Close and reopen your terminal
> 4. Type `node --version` to confirm it worked

### Check 2: npm packages

Check if `D:\2ps-workspace\blog-video-pipeline\node_modules` exists. If missing:

```bash
cd D:/2ps-workspace/blog-video-pipeline && npm install
```

Tell the user: `"Installing dependencies... (one-time, takes ~1 minute)"`

### Check 3: ElevenLabs API key

Read `D:\2ps-workspace\blog-video-pipeline\.env`. Check for `ELEVENLABS_API_KEY` with a real value.

If missing or a placeholder, guide the user:

> You need an ElevenLabs API key for voice narration:
> 1. Go to https://elevenlabs.io and create a free account
> 2. Click your avatar (top right) → Profile
> 3. Scroll to "API Keys" → click "Create API Key"
> 4. Copy the key and add this line to your `.env` file:
>    `ELEVENLABS_API_KEY=your_key_here`
>
> The free tier gives you 10,000 characters/month (~2-3 videos).

### Check 4: Voice ID

Read `.env` for `ELEVENLABS_VOICE_ID`. If missing or empty:

```bash
cd D:/2ps-workspace/blog-video-pipeline && npx tsx scripts/list-voices.ts
```

Show the voice list and ask:

> Which voice would you like for narration? Pick one from the list above.

Then write the chosen voice ID to `.env` as `ELEVENLABS_VOICE_ID=<id>`.

**If all 4 checks pass, skip Phase 0 output entirely — don't mention it.**

---

## Phase 1 — Source Content

Ask the user:

> What's your source content? You can:
> 1. **Paste text** — paste an article, tutorial, blog post, or outline here
> 2. **Share a URL** — I'll fetch the page
> 3. **Give a file path** — I'll read the file
> 4. **PowerPoint / PPTX** — give me the file path and I'll read the slides
> 5. **Describe a topic** — tell me what the video should cover

Then:
- URL → use WebFetch
- File path (.txt/.md/.json) → use Read tool
- PPTX path → Phase 1b
- Pasted text or topic → proceed directly

### Phase 1b — PPTX to Images

1. Check if LibreOffice is installed: `soffice --version`

   - **LibreOffice found:**
     ```bash
     mkdir -p D:/2ps-workspace/blog-video-pipeline/temp/pptx-slides
     soffice --headless --convert-to png --outdir D:/2ps-workspace/blog-video-pipeline/temp/pptx-slides/ "<pptx-path>"
     ```

   - **LibreOffice not found:** use PowerShell (requires Microsoft Office):
     ```bash
     powershell -ExecutionPolicy Bypass -File "D:/2ps-workspace/blog-video-pipeline/scripts/pptx-to-images.ps1" -PptxPath "<pptx-path>" -OutDir "D:/2ps-workspace/blog-video-pipeline/temp/pptx-slides"
     ```

   - **Neither available**, guide the user:
     > To convert PowerPoint slides, you need either LibreOffice (free) or Microsoft Office.
     > - LibreOffice: https://www.libreoffice.org/download/libreoffice/ → install → restart terminal
     > - Or export manually from PowerPoint: File → Export → Change File Type → PNG

2. Read each exported PNG with the Read tool (Claude can see slide content visually).

3. Extract from each slide: title, body text, bullets, diagrams, tables, speaker notes.

4. **IMPORTANT — use image slides, not component slides.** The exported PNGs become the actual video frames. Generate `image`-type slides in video-script.json that reference each PNG directly. Do NOT redraw the content using concept/diagram/code components. Example slide:

```json
{
  "id": "slide-01",
  "type": "image",
  "section": "Introduction",
  "narration": "...",
  "imagePath": "temp/pptx-slides/Slide1.png"
}
```

LibreOffice names files `<original-filename>-<N>.png`; PowerShell COM names them `Slide1.png`, `Slide2.png`, etc. Check the output directory first to confirm the naming pattern.

5. Proceed to Phase 2 with the extracted narration content.

---

## Phase 2 — Preferences

Ask both questions at once:

> Two quick questions:
>
> 1. **Narration language** — what language should the narrator speak?
>    (e.g. Vietnamese, English, Japanese, Korean — default: Vietnamese)
>
> 2. **Background theme** — light or dark? (default: light)

Voice: reuse `ELEVENLABS_VOICE_ID` from `.env` silently. Only prompt if absent (Phase 0 handles it).

Write `D:\2ps-workspace\blog-video-pipeline\video.config.json`:

```json
{
  "narration": {
    "language": "<chosen-language-code>",
    "voiceId": "",
    "modelId": "eleven_v3",
    "voiceSettings": { "stability": 0.6, "similarityBoost": 0.8, "style": 0.2 }
  },
  "theme": "<light-or-dark>",
  "scriptPath": "content/video-script.json",
  "outputPath": "output",
  "audioDir": "public/audio"
}
```

Leave `voiceId` empty — `generate-audio.ts` falls back to `ELEVENLABS_VOICE_ID` from `.env`.

---

## Phase 3 — Script Generation

Tell the user:

> Planning your video...

Generate `D:\2ps-workspace\blog-video-pipeline\content\video-script.json` using:
- Schema: `references/video-script-schema.json`
- Examples: `references/slide-examples.json`

**Script rules:**
- 15–30 slides total for a 5–15 min video
- First slide: `title` type. Last slide: `outro` type.
- Group into 3–8 named sections; use `section-header` slides to open each
- Slide IDs: `slide-01`, `slide-02`, ... zero-padded
- Every slide must have a non-empty `narration` field
- Narration in the language chosen in Phase 2 — 2–4 conversational sentences per slide
- Code blocks: ≤ 15 lines. Flow nodes: 3–5. Diagram: max 3 rows × 4 cols.

**For PPTX source:** map original slides to 1–2 video slides each. Preserve structure; rewrite narration to be educational and conversational.

---

## Phase 4 — Preview and Script Review

Show a human-readable summary:

```
Here's your video plan:

Title: "[video title]"
[N] slides | [M] sections | ~[X] min estimated

Sections:
  1. [Section name]
     - slide-01: title — "[title text]"
     - slide-02: concept — "[heading]" ([N] bullets)
     - slide-03: code — "[heading]" ([language])
  2. [Section name]
     - slide-04: section-header — "[heading]"
     - slide-05: diagram — "[heading]"
     ...
```

Then read and print `content/video-script.json` in full so the user can review every slide's narration and content inline.

After printing:

```
You can:
- Say "looks good" to start generating the video
- Ask me to change anything (sections, tone, narration, slide order)
- Edit content/video-script.json directly and say "done" when ready
```

**Loop:** apply any requested changes and re-show the preview until user confirms.

---

## Phase 5 — Audio Generation

Tell the user:

> Generating voice narration for [N] slides... (~30–90 seconds)

```bash
cd D:/2ps-workspace/blog-video-pipeline && rm -rf public/audio/*.mp3 public/audio/*.json && npx tsx scripts/generate-audio.ts > audio-gen.log 2>&1
```

After completion, read `audio-gen.log`:
- Find the `Done! Total duration:` line → show duration
- On error, find `Error` / `failed` lines → explain in plain English:
  - `401` → "Your ElevenLabs API key is invalid or expired. Check `.env`."
  - `429` / `quota` → "You've hit your ElevenLabs monthly character limit."
  - voice ID error → "The voice ID isn't recognized. Run `npx tsx scripts/list-voices.ts` to pick a valid one."

---

## Phase 6 — Video Render

Tell the user:

> Rendering your video... (~1–3 minutes)

Generate a URL-friendly slug from the video title (lowercase, hyphens):

```bash
cd D:/2ps-workspace/blog-video-pipeline && npx remotion render EducationalVideo output/<slug>.mp4 > render.log 2>&1
```

Read `render.log` on completion. On error, show the relevant lines in plain English.

---

## Phase 7 — Done

```
Your video is ready!

File:     D:\2ps-workspace\blog-video-pipeline\output\<slug>.mp4
Duration: ~[X] minutes
Slides:   [N]
```

List any slides skipped due to empty narration.

---

## Slide Type Reference

| Type | When to Use |
|------|-------------|
| `title` | Opening slide (1 per video) |
| `section-header` | Opens each major section; `stageNumber` increments |
| `concept` | Key ideas with 2–5 bullets; optional `highlight` quote |
| `code` | Code examples — keep ≤ 15 lines; include `caption` |
| `diagram` | Architecture / component relationships (grid layout) |
| `flow` | Sequential steps or timelines (3–5 nodes) |
| `table` | Comparisons or feature matrices (3–6 rows) |
| `outro` | Closing slide (1 per video) |
| `image` | Full-screen PNG from PPTX export; requires `imagePath` field |

Diagram node colors: `"blue"`, `"green"`, `"orange"`, `"purple"`, `"red"`

## Quality Checklist (verify before audio)

- [ ] All slide IDs unique, format `slide-XX`
- [ ] Every slide has non-empty `narration`
- [ ] First = `title`, last = `outro`
- [ ] Section headers have incrementing `stageNumber`
- [ ] Code blocks ≤ 15 lines
- [ ] Diagram nodes have valid `row`/`col` positions
- [ ] Table rows match header column count
- [ ] Flow nodes: 3–5 entries

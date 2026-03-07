# Skill: Educational Video Creator with Voiceover

## When to Activate

Trigger this skill when the user says anything like:
- "create a video", "make me a video", "I want to make a video"
- "make educational video", "convert to narrated video"
- "video from this blog", "video from this article", "video from this tutorial"
- "make a video about...", "create a video about..."
- "turn this into a video"
- "convert my slides to video", "make a video from my PowerPoint", "video from my pptx"

---

## Phase 0 — Setup Check

### Step 0a — Resolve PIPELINE_DIR

Every command in this skill uses `$PIPELINE_DIR`. Resolve it once at the start, in this order:

1. **Env var set?** Check if `EDUCATIONAL_VIDEO_PIPELINE` is in the environment → use it.

2. **Current directory is the pipeline?** Check if `remotion.config.ts` exists in the current working directory → use `.` (current dir).

3. **Saved config?** Read `~/.claude/plugins/educational-video/config.json` if it exists → use the `pipelineDir` value.

4. **Search common locations:**
   - `~/educational-video-pipeline`
   - `~/Documents/educational-video-pipeline`
   - `~/Downloads/educational-video-pipeline`
   - `~/Desktop/educational-video-pipeline`
   Check each for `remotion.config.ts`.

5. **Ask the user:**
   > Where did you install the educational video pipeline? Please paste the full folder path.
   > (It's the folder containing `remotion.config.ts` and `package.json`)

6. **Save for next time:** once resolved, write to `~/.claude/plugins/educational-video/config.json`:
   ```json
   { "pipelineDir": "<resolved-path>" }
   ```

All subsequent commands use `$PIPELINE_DIR` as the resolved absolute path.

---

### Step 0b — Environment Checks

Run these in order. Stop and guide the user on first failure.

**Check 1: Node.js**
```bash
node --version
```
If not found:
> Node.js isn't installed yet:
> 1. Go to https://nodejs.org → click "Download Node.js (LTS)"
> 2. Run the installer, click Next through all steps
> 3. Reopen your terminal and run `node --version` to confirm

**Check 2: npm packages**

Check if `$PIPELINE_DIR/node_modules` exists. If missing:
```bash
cd "$PIPELINE_DIR" && npm install
```
Tell the user: `"Installing dependencies... (one-time, ~1 minute)"`

**Check 3: ElevenLabs API key**

Read `$PIPELINE_DIR/.env`. Check for `ELEVENLABS_API_KEY` with a real value (not empty/placeholder).

If missing:
> You need an ElevenLabs API key for voice narration:
> 1. Go to https://elevenlabs.io → create a free account
> 2. Click your avatar → Profile → API Keys → Create API Key
> 3. Add this line to `$PIPELINE_DIR/.env`:
>    `ELEVENLABS_API_KEY=your_key_here`
>
> Free tier: 10,000 characters/month (~2–3 videos)

**Check 4: Voice ID**

Read `$PIPELINE_DIR/.env` for `ELEVENLABS_VOICE_ID`. If missing or empty:
```bash
cd "$PIPELINE_DIR" && npx tsx scripts/list-voices.ts
```
Show the list and ask the user to pick one. Write the chosen ID to `.env` as `ELEVENLABS_VOICE_ID=<id>`.

**If all checks pass, skip Step 0b output entirely — don't mention it.**

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
- Pasted text or topic → proceed directly to Phase 2

### Phase 1b — PPTX to Images

1. Check if LibreOffice is installed: `soffice --version`

   - **LibreOffice found:**
     ```bash
     mkdir -p "$PIPELINE_DIR/public/pptx-slides"
     soffice --headless --convert-to png --outdir "$PIPELINE_DIR/public/pptx-slides/" "<pptx-path>"
     ```
     Note: LibreOffice does NOT extract speaker notes. Skip the notes check below.

   - **LibreOffice not found:** use PowerShell (requires Microsoft Office):
     ```bash
     powershell -ExecutionPolicy Bypass -File "$PIPELINE_DIR/scripts/pptx-to-images.ps1" -PptxPath "<pptx-path>" -OutDir "$PIPELINE_DIR/public/pptx-slides"
     ```
     This also exports `slide-notes.json` with speaker notes per slide.

   - **Neither available:**
     > To convert PowerPoint slides, you need LibreOffice (free) or Microsoft Office.
     > - LibreOffice: https://www.libreoffice.org/download/libreoffice/ → install → restart terminal
     > - Or export manually from PowerPoint: File → Export → Change File Type → PNG → save into `$PIPELINE_DIR/public/pptx-slides/`

2. List exported files to confirm exact filenames and extension case:
   ```bash
   ls "$PIPELINE_DIR/public/pptx-slides/"
   ```

3. **Check for speaker notes** (PowerShell COM only):

   If `$PIPELINE_DIR/public/pptx-slides/slide-notes.json` exists, read it and count slides with non-empty notes.

   - **Notes found on any slides** — ask the user:
     > I found speaker notes on [X] of [N] slides. Would you like me to use them as the narration?
     > - **Yes** — use existing notes; only generate narration for slides without notes
     > - **No** — generate fresh narration for all slides from the visual content

   - **No notes found** — generate narration from visuals for all slides.

   Store the choice as `USE_EXISTING_NOTES`.

4. Read each exported PNG with the Read tool. Extract: title, body text, bullets, visible diagrams.

5. **IMPORTANT — use `image`-type slides, not component slides.** The PNGs are the video frames. Do NOT redraw content using concept/diagram/code components.

   Set `narration` per slide:
   - `USE_EXISTING_NOTES=yes` and slide has notes → use note text verbatim
   - Otherwise → write 2–4 conversational sentences from the visual content

   `imagePath` is **relative to `public/`** (Remotion's static asset root):
   ```json
   {
     "id": "slide-01",
     "type": "image",
     "section": "Introduction",
     "narration": "...",
     "imagePath": "pptx-slides/Slide1.PNG"
   }
   ```
   Use the **exact filename and extension case** from step 2.
   LibreOffice: `<filename>-<N>.png` | PowerShell COM: `Slide1.PNG`, `Slide2.PNG`, ...

6. Proceed to Phase 2.

---

## Phase 2 — Preferences

Ask both at once:

> Two quick questions:
> 1. **Narration language** — e.g. Vietnamese, English, Japanese (default: Vietnamese)
> 2. **Background theme** — light or dark? (default: light; applies to component slides only)

Voice: reuse `ELEVENLABS_VOICE_ID` from `.env` silently. Only prompt if absent (Phase 0 handles it).

Write `$PIPELINE_DIR/video.config.json`:
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

Tell the user: `"Planning your video..."`

Generate `$PIPELINE_DIR/content/video-script.json` using:
- Schema: `references/video-script-schema.json`
- Examples: `references/slide-examples.json`

**Rules (text/URL/topic source):**
- 15–30 slides for a 5–15 min video
- First: `title`, last: `outro`
- 3–8 sections; `section-header` opens each
- Slide IDs: `slide-01`, `slide-02`, ... zero-padded
- Every slide: non-empty `narration`, 2–4 sentences in the chosen language
- Code: ≤15 lines | Flow: 3–5 nodes | Diagram: ≤3 rows × 4 cols

**Rules (PPTX source):**
- One `image` slide per original slide (split dense ones into 2 if needed)
- Add `title` slide at start and `outro` at end
- `imagePath` must match the exact exported filename

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
     - slide-02: concept — "[heading]"
     - slide-03: image — pptx-slides/Slide3.PNG
  2. [Section name]
     ...
```

Then read and print `$PIPELINE_DIR/content/video-script.json` in full so the user can review every slide's narration and content inline.

```
You can:
- Say "looks good" to generate the video
- Ask me to change anything (sections, tone, narration, order)
- Edit content/video-script.json directly and say "done" when ready
```

**Loop:** apply changes and re-show preview until the user confirms.

---

## Phase 5 — Audio Generation

Tell the user: `"Generating voice narration for [N] slides... (~30–90 seconds)"`

Run in **background**:
```bash
cd "$PIPELINE_DIR" && rm -rf public/audio/*.mp3 public/audio/*.json && npx tsx scripts/generate-audio.ts > audio-gen.log 2>&1
```

Poll `$PIPELINE_DIR/audio-gen.log` every 10–15 seconds:
```bash
grep -E "Generating:|slide-[0-9]+" "$PIPELINE_DIR/audio-gen.log" | tail -3
```

On completion (detect `Done! Total duration:`), show the duration.
On error lines (`Error` / `failed` / HTTP 4xx):
- `401` → "ElevenLabs API key is invalid or expired. Check `.env`."
- `429` / `quota` → "Monthly character limit reached."
- voice ID error → "Voice ID not recognized. Run `npx tsx scripts/list-voices.ts`."

---

## Phase 6 — Video Render

Tell the user: `"Rendering your video... (~1–3 minutes)"`

Derive a URL-friendly slug from the video title. Run in **background**:
```bash
cd "$PIPELINE_DIR" && npx remotion render EducationalVideo output/<slug>.mp4 > render.log 2>&1
```

Poll `$PIPELINE_DIR/render.log` every 15 seconds:
```bash
grep -E "Frame|Rendering|error" "$PIPELINE_DIR/render.log" | tail -3
```

On completion (detect `Rendered` or `Done`), confirm success. On error, show relevant lines in plain English.

---

## Phase 7 — Done

```
Your video is ready!

File:     $PIPELINE_DIR/output/<slug>.mp4
Duration: ~[X] minutes
Slides:   [N]
```

List any slides skipped due to empty narration.

**If the source was a PPTX file**, offer to write narration back as slide notes:

> Would you like me to add the narration script to your PowerPoint file as speaker notes?
> (Existing notes are preserved — narration is appended after them with a divider.)

If yes:
```bash
powershell -ExecutionPolicy Bypass -File "$PIPELINE_DIR/scripts/pptx-add-notes.ps1" -PptxPath "<original-pptx-path>" -ScriptPath "$PIPELINE_DIR/content/video-script.json"
```

The script backs up the original as `<file>.pptx.bak` first. Tell the user:
> Done! Narration added to [N] slides in [file.pptx]. Backup saved as [file.pptx.bak].

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
- [ ] Image slides: `imagePath` matches an actual file in `public/pptx-slides/`

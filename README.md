# Educational Video Pipeline

Turn any article, blog post, URL, or PowerPoint into a narrated MP4 video — just tell Claude what you want.

**Output:** 1080p video with animated slides, syntax-highlighted code, diagrams, and AI voiceover (ElevenLabs).

---

## Requirements

- [Node.js LTS](https://nodejs.org) — the runtime
- [Claude Code](https://claude.ai/code) — your conversational interface (`npm i -g @anthropic-ai/claude-code`)
- [ElevenLabs account](https://elevenlabs.io) — AI voice narration (free tier: 10k chars/month)

---

## Setup (one time)

### 1. Clone and install

```bash
git clone https://github.com/nmnhut-it/educational-video-pipeline.git
cd educational-video-pipeline
npm install
```

### 2. Add your API key

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Open `.env` and add your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_key_here
```

> Get your key at [elevenlabs.io](https://elevenlabs.io) → avatar → Profile → API Keys → Create API Key

### 3. Install the Claude skill

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse -Force .claude\plugins\educational-video "$env:USERPROFILE\.claude\plugins\educational-video"
```

**Windows (Command Prompt):**
```cmd
xcopy /E /I /Y .claude\plugins\educational-video "%USERPROFILE%\.claude\plugins\educational-video"
```

**macOS / Linux:**
```bash
mkdir -p ~/.claude/plugins && cp -r .claude/plugins/educational-video ~/.claude/plugins/
```

That's it. Claude handles the rest — finding the pipeline, selecting voices, writing scripts, generating audio, and rendering.

---

## Make a video

Open Claude Code from **any directory** and say:

> "Make me a video about [topic]"
> "Create a video from this article: [URL]"
> "Make a video from my PowerPoint: [path/to/file.pptx]"

Claude will:
1. Find your pipeline installation automatically
2. Check your setup (Node.js, API key, voice)
3. Read your source content
4. Ask two questions: narration language + light/dark theme
5. Generate a structured slide script (15–30 slides)
6. Show you a preview — make changes or approve
7. Generate ElevenLabs voice narration (with live progress)
8. Render the final MP4 (with live progress)

**Output:** `output/<video-title>.mp4`

---

## Features

### 9 slide types
| Type | Description |
|------|-------------|
| `title` | Opening slide with title + subtitle |
| `section-header` | Section divider with stage number |
| `concept` | Bullet points with optional highlight quote |
| `code` | Syntax-highlighted code block |
| `diagram` | Box-and-arrow architecture diagram |
| `flow` | Horizontal step-by-step flow |
| `table` | Comparison table |
| `image` | Full-screen image (used for PPTX slides) |
| `outro` | Closing slide with evolution summary |

### PowerPoint / PPTX support
- Converts each slide to a PNG image — your original design is preserved
- Extracts speaker notes and offers to use them as narration
- After the video is done, offers to write the AI narration back into the PPTX as slide notes
- Requires [LibreOffice](https://www.libreoffice.org) (free) or Microsoft Office

### Smart setup wizard
- Claude finds your pipeline installation automatically (env var, current dir, saved config, common locations)
- Walks you through Node.js, API keys, and voice selection on first run
- Saves your pipeline path so it never asks again

### Script preview and editing
- Before generating audio, Claude shows a full slide-by-slide breakdown
- Shows the complete `video-script.json` inline for review
- You can request changes in plain language or edit the JSON directly

### Live progress during generation
- Audio generation polls the log every 10–15s and shows which slide is being processed
- Video render polls every 15s and shows frame progress

---

## Manual usage (advanced)

```bash
# Preview in Remotion Studio (browser)
npm run dev

# Generate audio only
npm run generate-audio

# Render video
npx remotion render EducationalVideo output/my-video.mp4
```

Edit `content/video-script.json` directly. Schema and examples are in:
`.claude/plugins/educational-video/skills/educational-video/references/`

---

## Tech stack

[Remotion](https://remotion.dev) · [ElevenLabs](https://elevenlabs.io) · [Claude Code](https://claude.ai/code) · TypeScript · React 18

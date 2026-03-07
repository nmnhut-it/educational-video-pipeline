# Educational Video Pipeline

Turn any article, blog post, URL, or PowerPoint into a narrated MP4 video — just tell Claude what you want.

**Output:** 1080p video with animated slides, code blocks, diagrams, and AI voiceover (ElevenLabs).

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

Create a `.env` file in the project folder with your ElevenLabs API key:

```
ELEVENLABS_API_KEY=your_key_here
```

> Get your key at [elevenlabs.io](https://elevenlabs.io) → avatar → Profile → API Keys → Create API Key

### 3. Install the Claude skill

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse -Force .claude\plugins\educational-video "$env:USERPROFILE\.claude\plugins\educational-video"
```

**macOS / Linux:**
```bash
mkdir -p ~/.claude/plugins && cp -r .claude/plugins/educational-video ~/.claude/plugins/
```

That's it. Claude handles everything else — voice selection, script writing, audio generation, and rendering.

---

## Make a video

Open Claude Code from **any directory** and say:

> "Make me a video about [topic]"
> "Create a video from this article: [URL]"
> "Make a video from my PowerPoint: [path/to/file.pptx]"

Claude will ask two quick questions (language + theme), show you a preview of the slide plan, let you make changes, then generate and render the video automatically.

**Output:** `output/<video-title>.mp4`

---

## Manual usage (advanced)

If you prefer to work directly:

```bash
# Edit the slide script
# content/video-script.json — see .claude/plugins/educational-video/skills/educational-video/references/ for schema and examples

# Generate audio
npm run generate-audio

# Render
npx remotion render EducationalVideo output/my-video.mp4

# Preview in browser
npm run dev
```

---

## PowerPoint support

Claude will export your PPTX to images and use them as video frames (your original slide design is preserved). Requires [LibreOffice](https://www.libreoffice.org) (free) or Microsoft Office.

---

## Tech stack

[Remotion](https://remotion.dev) · [ElevenLabs](https://elevenlabs.io) · [Claude Code](https://claude.ai/code) · TypeScript · React 18

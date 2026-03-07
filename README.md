# Educational Video Pipeline

Turn any article, blog post, URL, or PowerPoint into a narrated MP4 video — driven by a conversational Claude Code skill.

**What it produces:** a 1080p video with animated slides, syntax-highlighted code blocks, diagrams, and ElevenLabs voiceover narration — rendered by [Remotion](https://remotion.dev).

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Node.js LTS](https://nodejs.org) | Run the pipeline | nodejs.org |
| [Claude Code](https://claude.ai/code) | Conversational skill interface | `npm i -g @anthropic-ai/claude-code` |
| [ElevenLabs account](https://elevenlabs.io) | Voice narration | Free tier: 10k chars/month |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/nmnhut-it/educational-video-pipeline.git
cd educational-video-pipeline
npm install
```

### 2. Configure API keys

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

**Getting your ElevenLabs API key:**
1. Log in at [elevenlabs.io](https://elevenlabs.io)
2. Click your avatar → Profile → API Keys
3. Click "Create API Key" and copy it

**Getting a voice ID:**
```bash
npx tsx scripts/list-voices.ts
```
Pick a voice name from the list — copy its ID into `.env`.

### 3. Install the Claude Code skill (global)

Copy the plugin to your Claude config directory so the skill is available from any session:

**Windows:**
```
xcopy /E /I .claude\plugins\educational-video "%USERPROFILE%\.claude\plugins\educational-video"
```

**macOS / Linux:**
```bash
cp -r .claude/plugins/educational-video ~/.claude/plugins/educational-video
```

---

## Usage

Open Claude Code in any directory and say:

> "Make me a video about [topic]"
> "Create a video from this article: [URL]"
> "Make a video from my PowerPoint: [path/to/file.pptx]"

Claude will guide you through the rest — no technical knowledge needed.

### What Claude does automatically:
1. Checks your setup (Node.js, API keys, voice)
2. Reads your source content (URL, file, PPTX, or pasted text)
3. Asks: narration language + light/dark theme
4. Generates a structured slide script (15–30 slides)
5. Shows you a preview — you can request changes
6. Generates ElevenLabs voice narration
7. Renders the final MP4

Output: `output/<video-title>.mp4`

---

## Manual Usage (without Claude skill)

### 1. Write your script

Edit `content/video-script.json`. See `video-script-schema.json` for the full schema and `.claude/plugins/educational-video/skills/educational-video/references/slide-examples.json` for examples of each slide type.

**Supported slide types:** `title`, `section-header`, `concept`, `code`, `diagram`, `flow`, `table`, `image`, `outro`

### 2. Configure the video

Edit `video.config.json`:

```json
{
  "narration": {
    "language": "en",
    "voiceId": "",
    "modelId": "eleven_v3",
    "voiceSettings": { "stability": 0.6, "similarityBoost": 0.8, "style": 0.2 }
  },
  "theme": "light",
  "scriptPath": "content/video-script.json",
  "outputPath": "output",
  "audioDir": "public/audio"
}
```

### 3. Generate audio

```bash
npm run generate-audio
```

### 4. Render video

```bash
npx remotion render EducationalVideo output/my-video.mp4
```

### Preview in browser

```bash
npm run dev
```

Opens Remotion Studio at `http://localhost:3000`.

---

## PowerPoint / PPTX Support

If you have a `.pptx` file, Claude will convert each slide to a PNG image and use those directly as video frames (your original slide design is preserved — no redrawing).

**Requirements:** either [LibreOffice](https://www.libreoffice.org) (free) or Microsoft Office.

Manual export:
```bash
# LibreOffice
soffice --headless --convert-to png --outdir temp/pptx-slides/ your-file.pptx

# Microsoft Office (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/pptx-to-images.ps1 -PptxPath your-file.pptx -OutDir temp/pptx-slides
```

---

## Slide Types

| Type | Description |
|------|-------------|
| `title` | Opening slide with title + subtitle |
| `section-header` | Section divider with stage number |
| `concept` | Bulleted key points with optional highlight |
| `code` | Syntax-highlighted code block |
| `diagram` | Box-and-arrow architecture diagram |
| `flow` | Horizontal step-by-step flow |
| `table` | Comparison table |
| `image` | Full-screen PNG (for PPTX slides) |
| `outro` | Closing slide with evolution summary |

---

## Project Structure

```
educational-video-pipeline/
├── src/
│   ├── compositions/      # Main Remotion composition
│   ├── slides/            # One component per slide type
│   ├── components/        # Shared UI (AnimatedText, CodeBlock, etc.)
│   ├── types.ts           # TypeScript types for all slides
│   └── constants.ts       # Colors, fonts, layout, timing
├── scripts/
│   ├── generate-audio.ts  # ElevenLabs narration generator
│   ├── list-voices.ts     # List available ElevenLabs voices
│   └── pptx-to-images.ps1 # PowerShell PPTX → PNG exporter
├── content/
│   └── video-script.json  # Your video script (edit this)
├── .claude/plugins/       # Claude Code skill definition
├── video.config.json      # Per-video settings
└── .env                   # API keys (never committed)
```

---

## Tech Stack

- **[Remotion](https://remotion.dev)** — React-based video rendering
- **[ElevenLabs](https://elevenlabs.io)** — AI voice narration with character-level timestamps
- **[Claude Code](https://claude.ai/code)** — Conversational orchestration skill
- TypeScript, React 18

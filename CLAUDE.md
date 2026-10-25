# Educational Video Pipeline — Claude Context

This file gives Claude Code context for working on this project. Read it at the start of any session before making changes.

---

## What This Is

A Remotion pipeline that renders narrated 1080p MP4 educational videos from a JSON slide script. Narration comes from a pluggable text-to-speech engine (`scripts/tts/`): ElevenLabs (cloud), Piper (offline), or any OpenAI-compatible speech server such as VieNeu-TTS or Kokoro-FastAPI (local). It is packaged as a Claude Code skill so non-technical users can invoke the full pipeline conversationally.

**Pipeline flow:**
`content/video-script.json` → `scripts/validate-script.ts` → `scripts/generate-audio.ts` (TTS provider) → `npx remotion render` → `output/<slug>.mp4`

---

## Key Files

| File | Role |
|------|------|
| `src/types.ts` | All TypeScript types: `SlideData` union, `VideoScript`, `AudioManifest`, `VideoConfig` |
| `src/constants.ts` | Design tokens: colors, fonts, font sizes, layout, timing (FPS, padding frames) |
| `src/config-loader.ts` | Reads `video.config.json`, merges with defaults. All Node scripts use this. |
| `src/timing.ts` | Frames per slide (audio length + tail, or per-type default). The one copy used by `Root.tsx` and `EducationalVideo.tsx`. |
| `src/script-validator.ts` | Pure checks on a `VideoScript` (ids, tables, diagram edges, image paths, label lengths). CLI: `scripts/validate-script.ts`. |
| `src/Root.tsx` | Remotion entry point. Loads `video-script.json` and optional audio manifest, passes both as props; `calculateMetadata` sets the length from the props. |
| `src/compositions/EducationalVideo.tsx` | Top-level composition. Maps slides → components, handles audio sync and section fade transitions. Takes `script` + `audioManifest` as props. |
| `src/slides/` | One component per slide type (8 components + ImageSlide) |
| `src/components/` | Shared UI: `AnimatedText`, `AudioTrack`, `BoxDiagram`, `CodeBlock`, `FlowChart`, `ProgressBar`, `SlideLayout`; `svg-text.ts` shrinks SVG labels to fit their box |
| `scripts/generate-audio.ts` | Speaks each slide with the configured TTS provider, saves per-slide MP3 + timing JSON + `manifest.json`. Reuses unchanged slides (hash cache); `--force` redoes all. |
| `scripts/tts/` | TTS engines: `provider.ts` (interface), `elevenlabs.ts`, `openai-compatible.ts` (POST /v1/audio/speech servers), `piper.ts` (offline CLI), `index.ts` (picks one from `narration.provider`), `retry.ts` (backoff on 429/5xx), `remotion-ffmpeg.ts` (duration + WAV→MP3 via Remotion's bundled ffmpeg) |
| `scripts/validate-script.ts` | Validates the script before audio; exits 1 on errors |
| `scripts/list-voices.ts` | Lists the configured provider's voices for setup |
| `scripts/pptx-to-images.ps1` | PowerShell COM: exports PPTX slides as PNGs + `slide-notes.json` with speaker notes |
| `scripts/pptx-add-notes.ps1` | PowerShell COM: appends narration from `video-script.json` back into PPTX slide notes |
| `content/video-script.json` | The active slide script. Edit this to change the video content. |
| `video.config.json` | Per-video settings: language, voice engine + voice, theme, paths. The skill edits only language and theme. |
| `models/` | Downloaded local voice models (Piper voices in `models/piper/`). Gitignored. |
| `.env` | Provider keys, e.g. `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Never committed. |
| `tests/` | `node:test` suites run with `npm test`: timing, validator, audio cache (fake provider), OpenAI-compatible provider (fake local server), Piper (real run, skipped if Piper or the voice is not installed) |
| `.claude/plugins/educational-video/` | The Claude Code skill definition (SKILL.md, schema, examples) |

---

## Slide Types

9 slide types, all defined as discriminated union members in `src/types.ts`:

| Type constant | JSON `type` value | Key fields |
|---|---|---|
| `SlideType.TITLE` | `"title"` | `title`, `subtitle` |
| `SlideType.SECTION_HEADER` | `"section-header"` | `stageNumber`, `heading`, `tagline` |
| `SlideType.CONCEPT` | `"concept"` | `heading`, `bullets[]`, optional `highlight`, optional `flow[]` |
| `SlideType.CODE` | `"code"` | `heading`, `language`, `code`, optional `caption` |
| `SlideType.DIAGRAM` | `"diagram"` | `heading`, `nodes[]`, `edges[]` |
| `SlideType.FLOW` | `"flow"` | `heading`, `nodes[]`, optional `summary` |
| `SlideType.TABLE` | `"table"` | `heading`, `headers[]`, `rows[][]` |
| `SlideType.OUTRO` | `"outro"` | `title`, `message`, `evolutionLine` |
| `SlideType.IMAGE` | `"image"` | `imagePath` (relative to `public/`) |

When adding a new slide type:
1. Add enum value to `SlideType` in `src/types.ts`
2. Add interface extending `SlideBase`
3. Add to `SlideData` union
4. Create `src/slides/NewSlide.tsx`
5. Add `case SlideType.NEW` in `EducationalVideo.tsx` `SlideRenderer`
6. Add default duration in `DEFAULT_DURATIONS` in `src/timing.ts`
7. Add any content checks in `checkSlideContent()` in `src/script-validator.ts`, and the type to the skill's `references/video-script-schema.json`

---

## Critical Constraints

**Remotion static assets must be under `public/`.**
Any image referenced in a composition must be accessed via `staticFile('path/relative/to/public')`. A bare relative path silently 404s (the component renders but the image is blank). This is why `ImageSlide.tsx` uses `staticFile(data.imagePath)` and why PPTX exports go to `public/pptx-slides/`.

**Audio manifest drives timing.**
`src/timing.ts` computes slide durations from `public/audio/manifest.json` (generated by `generate-audio.ts`). Each duration is the MP3's real length, measured with Remotion's bundled ffprobe, so it works for engines that send no timestamps. Slides with no audio entry (or empty narration) fall back to `DEFAULT_DURATIONS` and get no `<Audio>` tag. Always re-run `generate-audio.ts` after changing narration text; it only re-buys the slides that changed.

**The theme is picked when the bundle is built.**
`src/constants.ts` imports `video.config.json` directly (the Remotion bundle runs in a browser and cannot use `fs`) and exports `COLORS` for the chosen theme. Components must use `COLORS`, never `LIGHT_COLORS`/`DARK_COLORS` or literal colours.

**`video.config.json` holds per-video and per-machine settings.**
`config-loader.ts` reads it and fills defaults for any missing fields. Node scripts should always go through `loadVideoConfig()`, never read `video.config.json` directly. (The one exception is `constants.ts`, see above.)

**TTS rate limiting.**
Each provider sets `requestDelayMs`, the pause between slides: 1500ms for ElevenLabs (do not reduce without testing), 0 for local engines. `TTS_RATE_LIMIT_DELAY_MS` overrides it (e.g. a hosted OpenAI-compatible server). 429 and 5xx responses are retried with backoff in `scripts/tts/retry.ts`.

**Piper takes its text on stdin with `PYTHONUTF8=1`.** Passed as an argument after `--`, Piper speaks the `--` too; without UTF-8 mode, Windows Python reads stdin in the ANSI code page and garbles Vietnamese.

**ElevenLabs `output_format` is a query parameter.** Sending it in the JSON body is silently ignored.

---

## Common Tasks

### Add a new slide type
See "Slide Types" section above — 7 steps.

### Change the color theme
Pick light or dark with `"theme"` in `video.config.json`. To change the colours themselves, edit `LIGHT_COLORS` / `DARK_COLORS` in `src/constants.ts`; `COLORS` is resolved from them when the bundle is built.

### Change font sizes
Edit `FONT_SIZES` in `src/constants.ts`. All sizes are in pixels for a 1920×1080 canvas. Current scale is 1.5× larger than typical presentation fonts for readability.

### Change slide timing (no audio)
Edit `DEFAULT_DURATIONS` in `src/timing.ts`. Units are frames at 30 FPS (e.g. 180 = 6 seconds).

### Add a voice engine (TTS provider)
1. Add a value to `TtsProviderId` in `src/types.ts`
2. Write `scripts/tts/<name>.ts` implementing `TtsProvider` (`requestDelayMs`, `cacheKey`, `synthesize` → MP3 bytes, `listVoices`); throw `TtsSetupError` for missing setup and `httpErrorFrom()` errors for HTTP failures so retries work. WAV-only engines can use `convertToMp3()` from `remotion-ffmpeg.ts`.
3. Add a `case` in `createTtsProvider()` in `scripts/tts/index.ts`; if it needs settings, add a section to `NarrationConfig` (`src/types.ts`), its defaults and merge in `src/config-loader.ts`
4. Set `"provider": "<name>"` under `narration` in `video.config.json`

A server that already speaks the OpenAI speech API needs no code: use `openai-compatible` with its `baseUrl`.

### Validate and test
```bash
npm run validate     # check content/video-script.json
npm test             # unit tests (node:test via tsx)
npm run typecheck
```

### Preview without audio
```bash
npm run dev
```
Opens Remotion Studio at `http://localhost:3000`. Slides use default durations.

### Run audio generation
```bash
npm run generate-audio
# output: public/audio/slide-XX.mp3, slide-XX-timing.json, manifest.json
# unchanged slides are reused; `npm run generate-audio -- --force` regenerates all
```

### Render video
```bash
npx remotion render EducationalVideo output/my-video.mp4
```

---

## Skill Architecture

The Claude Code skill lives in `.claude/plugins/educational-video/`. It is also installed globally at `~/.claude/plugins/educational-video/` so Claude can invoke the pipeline from any directory.

**Key design decisions in SKILL.md:**
- `$PIPELINE_DIR` is resolved dynamically at runtime (env var → cwd check → saved config → search → ask user). Never hardcode paths in the skill.
- After resolving `$PIPELINE_DIR`, its path is saved to `~/.claude/plugins/educational-video/config.json` for future sessions.
- Audio and render steps run in background with log polling every 10–15s to show progress.
- PPTX source uses `image`-type slides pointing to `public/pptx-slides/` — Claude never redraws PPTX content with Remotion components.
- Speaker notes from PPTX are offered as narration source (skips AI generation for those slides).
- After video is done, Claude offers to write narration back into the PPTX as slide notes (via `pptx-add-notes.ps1`).

**When updating the skill**, always sync the global copy:
```bash
# Windows
Copy-Item -Recurse -Force .claude\plugins\educational-video "$env:USERPROFILE\.claude\plugins\educational-video"

# macOS / Linux
cp -r .claude/plugins/educational-video ~/.claude/plugins/educational-video
```

---

## Known Issues and Gotchas

- **Extension case on Windows:** PowerShell COM exports `Slide1.PNG` (uppercase). pdftoppm exports lowercase `slide-1.png`. `validate-script.ts` checks the exact case; Windows itself does not.
- **LibreOffice `--convert-to png` exports only the first slide.** Convert to PDF, then rasterise with `pdftoppm` (the skill does this).
- **Windows PowerShell 5.1 reads BOM-less UTF-8 as ANSI.** Every `Get-Content` of a JSON file in the `.ps1` scripts needs `-Encoding UTF8`, or Vietnamese text is garbled.
- **PPTX notes placeholder index:** Notes body is placeholder type 2, not index 1. Always filter by `PlaceholderFormat.Type -eq 2`, not by array index — the order is not guaranteed.
- **`content/video-script.json` is gitignored by convention** but currently committed as an example. Do not commit machine-specific or work-in-progress scripts to main.
- **`public/pptx-slides/` is gitignored.** Users must re-export their PPTX on each clone. This is intentional — PPTX images can be large.
- **Remotion re-renders on every save.** When editing `video-script.json` during `npm run dev`, changes appear live. Audio won't sync in preview mode.

---

## File Conventions

- Slide components: `src/slides/<TypeName>Slide.tsx` — props interface named `<TypeName>SlideProps`
- All slide components receive `{ data, slideIndex, totalSlides }` — use `SlideLayout` as the wrapper
- No hard-coded colors or sizes in components — always import from `constants.ts`
- `generate-audio.ts` writes logs to stdout; redirect to `audio-gen.log` when running from the skill

/**
 * Narration audio generator for the educational video pipeline.
 * Speaks each slide's narration with the TTS engine set in
 * video.config.json → narration.provider (see scripts/tts/).
 *
 * Usage: npx tsx scripts/generate-audio.ts [--force]
 * Requires: the provider's setup — an API key in .env (ElevenLabs), a running
 * server (openai-compatible), or piper-tts + a downloaded voice (piper)
 *
 * Output: <audioDir>/slide-XX.mp3 + slide-XX-timing.json + manifest.json
 * Slide length comes from the MP3 itself (ffprobe), not from the engine.
 *
 * Caching: each timing file stores a hash of the text + provider settings.
 * A slide whose hash still matches (and whose MP3 exists) is reused, so
 * re-running after editing two slides only pays for those two.
 * --force regenerates every slide.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import type { VideoScript, AudioManifest, SlideAudioTiming } from "../src/types";
import { loadVideoConfig } from "../src/config-loader";
import { createTtsProvider, TtsSetupError } from "./tts";
import type { TtsProvider } from "./tts";
import { measureAudioDurationMs } from "./tts/remotion-ffmpeg";
import { sleep, withRetry } from "./tts/retry";

const FORCE_FLAG = "--force";
const MANIFEST_FILENAME = "manifest.json";
const MS_PER_SECOND = 1000;

/** Env var that overrides the provider's pause between slides (e.g. a higher-tier API plan) */
const DELAY_OVERRIDE_ENV = "TTS_RATE_LIMIT_DELAY_MS";

async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  const config = loadVideoConfig(projectRoot);
  const provider = createTtsProvider(config.narration, projectRoot);
  const force = process.argv.includes(FORCE_FLAG);

  const scriptPath = path.resolve(projectRoot, config.scriptPath);
  const script: VideoScript = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  const audioDir = path.resolve(projectRoot, config.audioDir);
  fs.mkdirSync(audioDir, { recursive: true });

  console.log(`Generating audio for ${script.slides.length} slides...`);
  console.log(`  Provider: ${provider.id} | Lang: ${config.narration.language}`);

  const slideTimings: SlideAudioTiming[] = [];
  for (const slide of script.slides) {
    slideTimings.push(await processSlide(provider, slide.id, slide.narration, audioDir, force));
  }

  const manifest = buildManifest(provider, config.narration.voiceId, slideTimings);
  const manifestPath = path.join(audioDir, MANIFEST_FILENAME);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nDone! Total duration: ${formatSeconds(manifest.totalDurationMs)}`);
  console.log(`Manifest: ${manifestPath}`);
}

/** Returns the slide's timing: skipped, reused from cache, or freshly generated */
export async function processSlide(
  provider: TtsProvider,
  slideId: string,
  narration: string,
  audioDir: string,
  force: boolean
): Promise<SlideAudioTiming> {
  if (!narration.trim()) {
    console.log(`Skipping ${slideId} (no narration)`);
    return { slideId, durationMs: 0 };
  }

  const sourceHash = hashSpeechSource(provider, narration);
  const cached = force ? undefined : readCachedTiming(audioDir, slideId, sourceHash);
  if (cached) {
    console.log(`Reusing: ${slideId} (unchanged) ${formatSeconds(cached.durationMs)}`);
    return cached;
  }

  console.log(`Generating: ${slideId}...`);
  const timing = await generateSlideAudio(provider, slideId, narration, sourceHash, audioDir);
  await sleep(requestDelayMs(provider));
  return timing;
}

function requestDelayMs(provider: TtsProvider): number {
  const override = process.env[DELAY_OVERRIDE_ENV];
  return override === undefined ? provider.requestDelayMs : Number(override);
}

/** Hash of the text plus every provider setting that changes the sound */
function hashSpeechSource(provider: TtsProvider, text: string): string {
  return crypto.createHash("sha256").update(provider.cacheKey()).update("\n").update(text).digest("hex");
}

/** Previous timing for this slide, only if it was made from the same inputs */
function readCachedTiming(
  audioDir: string,
  slideId: string,
  sourceHash: string
): SlideAudioTiming | undefined {
  const timingPath = path.join(audioDir, `${slideId}-timing.json`);
  const audioPath = path.join(audioDir, `${slideId}.mp3`);
  if (!fs.existsSync(timingPath) || !fs.existsSync(audioPath)) return undefined;
  try {
    const timing: SlideAudioTiming = JSON.parse(fs.readFileSync(timingPath, "utf-8"));
    return timing.sourceHash === sourceHash && timing.durationMs > 0 ? timing : undefined;
  } catch {
    return undefined;
  }
}

async function generateSlideAudio(
  provider: TtsProvider,
  slideId: string,
  text: string,
  sourceHash: string,
  outputDir: string
): Promise<SlideAudioTiming> {
  const result = await withRetry(slideId, () => provider.synthesize(text));

  const audioPath = path.join(outputDir, `${slideId}.mp3`);
  fs.writeFileSync(audioPath, result.audio);
  const durationMs = measureAudioDurationMs(audioPath);

  const timing: SlideAudioTiming = { slideId, durationMs, sourceHash, characters: result.characters };
  const timingPath = path.join(outputDir, `${slideId}-timing.json`);
  fs.writeFileSync(timingPath, JSON.stringify(timing, null, 2));

  console.log(`  ${slideId}: ${formatSeconds(durationMs)}`);
  return timing;
}

function buildManifest(
  provider: TtsProvider,
  voiceId: string,
  slideTimings: SlideAudioTiming[]
): AudioManifest {
  const totalDurationMs = slideTimings.reduce((sum, s) => sum + s.durationMs, 0);

  return {
    generatedAt: new Date().toISOString(),
    provider: provider.id,
    voiceId,
    totalDurationMs,
    slides: slideTimings,
  };
}

function formatSeconds(ms: number): string {
  return `${(ms / MS_PER_SECOND).toFixed(1)}s`;
}

// Run only from the command line; tests import processSlide without side effects
if (require.main === module) {
  main().catch((error) => {
    if (error instanceof TtsSetupError) {
      console.error(error.message);
    } else {
      console.error("Audio generation failed:", error);
    }
    process.exit(1);
  });
}

/**
 * ElevenLabs audio generator for educational video pipeline.
 * Generates per-slide MP3 files with character-level timestamps.
 * Reads voice/path settings from video.config.json (falls back to defaults).
 *
 * Usage: npx tsx scripts/generate-audio.ts
 * Requires: ELEVENLABS_API_KEY in .env
 *
 * Output: <audioDir>/slide-XX.mp3 + timing JSON + manifest.json
 */

import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import type { VideoScript, AudioManifest, SlideAudioTiming } from "../src/types";
import { loadVideoConfig } from "../src/config-loader";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const OUTPUT_FORMAT = "mp3_44100_128";

/** Delay between API calls to avoid rate limiting */
const RATE_LIMIT_DELAY_MS = 1500;

interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  const config = loadVideoConfig(projectRoot);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    console.error("Set ELEVENLABS_API_KEY in .env");
    process.exit(1);
  }

  /** Voice ID: config > env > error */
  const voiceId = config.narration.voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    console.error("Set voiceId in video.config.json or ELEVENLABS_VOICE_ID in .env");
    process.exit(1);
  }

  const scriptPath = path.resolve(projectRoot, config.scriptPath);
  const script: VideoScript = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));

  const audioDir = path.resolve(projectRoot, config.audioDir);
  fs.mkdirSync(audioDir, { recursive: true });

  const modelId = config.narration.modelId;
  const { stability, similarityBoost, style } = config.narration.voiceSettings;

  console.log(`Generating audio for ${script.slides.length} slides...`);
  console.log(`  Voice: ${voiceId} | Model: ${modelId} | Lang: ${config.narration.language}`);

  const slideTimings: SlideAudioTiming[] = [];

  for (const slide of script.slides) {
    if (!slide.narration.trim()) {
      console.log(`Skipping ${slide.id} (no narration)`);
      slideTimings.push({ slideId: slide.id, durationMs: 0 });
      continue;
    }

    console.log(`Generating: ${slide.id}...`);
    const timing = await generateSlideAudio(
      apiKey,
      voiceId,
      modelId,
      { stability, similarity_boost: similarityBoost, style },
      slide.id,
      slide.narration,
      audioDir
    );
    slideTimings.push(timing);

    await sleep(RATE_LIMIT_DELAY_MS);
  }

  const manifest = buildManifest(voiceId, slideTimings);
  const manifestPath = path.join(audioDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nDone! Total duration: ${(manifest.totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`Manifest: ${manifestPath}`);
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
}

async function generateSlideAudio(
  apiKey: string,
  voiceId: string,
  modelId: string,
  voiceSettings: VoiceSettings,
  slideId: string,
  text: string,
  outputDir: string
): Promise<SlideAudioTiming> {
  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/with-timestamps`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      output_format: OUTPUT_FORMAT,
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error for ${slideId}: ${response.status} ${errorText}`);
  }

  const data: ElevenLabsTimestampResponse = await response.json();

  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const audioPath = path.join(outputDir, `${slideId}.mp3`);
  fs.writeFileSync(audioPath, audioBuffer);

  const characters = data.alignment.characters.map((char, i) => ({
    character: char,
    startMs: Math.round(data.alignment.character_start_times_seconds[i] * 1000),
    endMs: Math.round(data.alignment.character_end_times_seconds[i] * 1000),
  }));

  const durationMs = characters.length > 0
    ? characters[characters.length - 1].endMs
    : 0;

  const timingPath = path.join(outputDir, `${slideId}-timing.json`);
  fs.writeFileSync(timingPath, JSON.stringify({ slideId, durationMs, characters }, null, 2));

  console.log(`  ${slideId}: ${(durationMs / 1000).toFixed(1)}s`);

  return { slideId, durationMs, characters };
}

function buildManifest(
  voiceId: string,
  slideTimings: SlideAudioTiming[]
): AudioManifest {
  const totalDurationMs = slideTimings.reduce((sum, s) => sum + s.durationMs, 0);

  return {
    generatedAt: new Date().toISOString(),
    voiceId,
    totalDurationMs,
    slides: slideTimings,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error("Audio generation failed:", error);
  process.exit(1);
});

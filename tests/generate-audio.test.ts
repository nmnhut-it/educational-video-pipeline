/**
 * Audio cache: unchanged slides are reused, edited slides are re-spoken, and the
 * slide length is measured from the MP3 (works for engines with no timestamps).
 * Uses a fake TtsProvider that returns a real 1-second MP3 made by Remotion's ffmpeg.
 */
import { test, before, after } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { processSlide } from "../scripts/generate-audio";
import type { TtsProvider } from "../scripts/tts";
import { runFfmpeg } from "../scripts/tts/remotion-ffmpeg";
import { TtsProviderId } from "../src/types";

const ONE_SECOND_MS = 1000;
const DURATION_TOLERANCE_MS = 100;
let mp3: Buffer;
let audioDir: string;

before(() => {
  audioDir = fs.mkdtempSync(path.join(os.tmpdir(), "evp-audio-"));
  const sine = path.join(audioDir, "sine.mp3");
  runFfmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", "sine=duration=1", sine]);
  mp3 = fs.readFileSync(sine);
});

after(() => fs.rmSync(audioDir, { recursive: true, force: true }));

/** Fake engine: counts calls, never sends character timestamps */
function fakeProvider(voice: string): TtsProvider & { calls: number } {
  return {
    id: TtsProviderId.ELEVENLABS,
    requestDelayMs: 0,
    calls: 0,
    cacheKey: () => voice,
    async synthesize() {
      this.calls++;
      return { audio: mp3 };
    },
    async listVoices() {
      return [];
    },
  };
}

test("measures duration from the file and reuses unchanged slides", async () => {
  const provider = fakeProvider("voice-a");
  const first = await processSlide(provider, "slide-01", "Xin chào", audioDir, false);
  assert.ok(Math.abs(first.durationMs - ONE_SECOND_MS) < DURATION_TOLERANCE_MS, `got ${first.durationMs}ms`);
  assert.equal(provider.calls, 1);

  const again = await processSlide(provider, "slide-01", "Xin chào", audioDir, false);
  assert.equal(provider.calls, 1, "same text + voice must not be paid for twice");
  assert.equal(again.sourceHash, first.sourceHash);
});

test("edited text, a different voice, or --force regenerate", async () => {
  const provider = fakeProvider("voice-a");
  await processSlide(provider, "slide-02", "Một", audioDir, false);
  await processSlide(provider, "slide-02", "Hai", audioDir, false);
  await processSlide(provider, "slide-02", "Hai", audioDir, true);
  assert.equal(provider.calls, 3);

  const otherVoice = fakeProvider("voice-b");
  await processSlide(otherVoice, "slide-02", "Hai", audioDir, false);
  assert.equal(otherVoice.calls, 1);
});

test("empty narration is skipped with zero duration", async () => {
  const provider = fakeProvider("voice-a");
  const timing = await processSlide(provider, "slide-03", "   ", audioDir, false);
  assert.equal(timing.durationMs, 0);
  assert.equal(provider.calls, 0);
});

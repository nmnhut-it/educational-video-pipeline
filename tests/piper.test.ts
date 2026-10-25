/**
 * Piper provider. Setup errors are checked everywhere; the real synthesis test runs
 * only where piper-tts and the vi_VN-vais1000-medium voice are installed
 * (models/piper), and is reported as skipped otherwise.
 */
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createTtsProvider, TtsSetupError } from "../scripts/tts";
import { measureAudioDurationMs } from "../scripts/tts/remotion-ffmpeg";
import { loadVideoConfig } from "../src/config-loader";
import { TtsProviderId } from "../src/types";
import type { NarrationConfig } from "../src/types";

const PROJECT_ROOT = process.cwd();
const VOICE = "vi_VN-vais1000-medium";
const MP3_FRAME_SYNC = 0xff;
const SHORT_TEXT = "Xin chào các bạn.";
const LONG_TEXT = "Xin chào các bạn. Hôm nay chúng ta sẽ tìm hiểu cách các mô hình ngôn ngữ gọi công cụ.";

function narration(piper: Partial<NarrationConfig["piper"]>, voiceId = VOICE): NarrationConfig {
  const base = loadVideoConfig(PROJECT_ROOT).narration;
  return { ...base, provider: TtsProviderId.PIPER, voiceId, piper: { ...base.piper, ...piper } };
}

function piperInstalled(): boolean {
  const config = narration({});
  try {
    execFileSync(config.piper.python, ["-c", "import piper"], { stdio: "ignore" });
  } catch {
    return false;
  }
  return fs.existsSync(path.resolve(PROJECT_ROOT, config.piper.dataDir, `${VOICE}.onnx`));
}

test("a voice that is not downloaded is a setup error", async () => {
  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "piper-empty-"));
  try {
    const provider = createTtsProvider(narration({ dataDir: emptyDir }), PROJECT_ROOT);
    await assert.rejects(provider.synthesize("Hi"), TtsSetupError);
    await assert.rejects(provider.listVoices(), TtsSetupError);
  } finally {
    fs.rmSync(emptyDir, { recursive: true, force: true });
  }
});

test("speaks Vietnamese offline into an MP3", { skip: !piperInstalled() && "piper-tts or the voice is not installed" }, async () => {
  const provider = createTtsProvider(narration({}), PROJECT_ROOT);
  const voices = await provider.listVoices();
  assert.ok(voices.some((v) => v.id === VOICE));

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "piper-out-"));
  try {
    const durations = [];
    for (const [i, text] of [SHORT_TEXT, LONG_TEXT].entries()) {
      const { audio } = await provider.synthesize(text);
      assert.ok(audio[0] === MP3_FRAME_SYNC || audio.subarray(0, 3).toString() === "ID3", "output must be MP3");
      const file = path.join(workDir, `${i}.mp3`);
      fs.writeFileSync(file, audio);
      durations.push(measureAudioDurationMs(file));
    }
    // A longer sentence must take longer to say: proves the text reached Piper intact
    assert.ok(durations[1] > durations[0] * 2, `durations ${durations.join(", ")}ms`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
});

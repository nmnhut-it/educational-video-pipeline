/** Slide timing: audio length wins, defaults otherwise; Root and composition share one function */
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { computeSlideDurations, computeTotalFrames, getDefaultDuration } from "../src/timing";
import { TIMING, VIDEO } from "../src/constants";
import { SlideType, TtsProviderId } from "../src/types";
import type { AudioManifest, SlideData } from "../src/types";

const image = (id: string): SlideData => ({ id, type: SlideType.IMAGE, section: "s", narration: "x", imagePath: "a.png" });

test("image slides get their own default, so a PPTX deck is not cut short", () => {
  const slides = [image("slide-01"), image("slide-02")];
  assert.equal(computeTotalFrames(slides), 2 * getDefaultDuration(SlideType.IMAGE));
  assert.deepEqual(computeSlideDurations(slides), [270, 270]);
});

test("audio duration plus tail padding replaces the default", () => {
  const manifest: AudioManifest = {
    generatedAt: "", provider: TtsProviderId.ELEVENLABS, voiceId: "", totalDurationMs: 2000,
    slides: [{ slideId: "slide-01", durationMs: 2000 }, { slideId: "slide-02", durationMs: 0 }],
  };
  const [withAudio, silent] = computeSlideDurations([image("slide-01"), image("slide-02")], manifest);
  assert.equal(withAudio, 2 * VIDEO.FPS + TIMING.AUDIO_TAIL_PADDING_FRAMES);
  assert.equal(silent, getDefaultDuration(SlideType.IMAGE), "a silent slide falls back to the default");
});

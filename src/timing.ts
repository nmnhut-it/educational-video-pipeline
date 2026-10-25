/**
 * Slide timing: how many frames each slide lasts.
 * One source of truth for both Root.tsx (total composition length) and
 * EducationalVideo.tsx (where each <Sequence> starts). Before this file the
 * two kept separate copies that disagreed on image slides, so the last
 * slides of a PPTX deck were cut off in preview.
 */

import { TIMING, VIDEO } from "./constants";
import { SlideType } from "./types";
import type { AudioManifest, SlideAudioTiming, SlideData } from "./types";

/** Default frame durations by slide type, used when a slide has no audio */
const DEFAULT_DURATIONS: Record<SlideType, number> = {
  [SlideType.TITLE]: 180,
  [SlideType.SECTION_HEADER]: 120,
  [SlideType.CONCEPT]: 210,
  [SlideType.CODE]: 300,
  [SlideType.DIAGRAM]: 300,
  [SlideType.FLOW]: 300,
  [SlideType.TABLE]: 240,
  [SlideType.OUTRO]: 210,
  [SlideType.IMAGE]: 270,
};

const MS_PER_SECOND = 1000;

/** Default duration in frames for a slide type (no audio) */
export function getDefaultDuration(type: SlideType): number {
  return DEFAULT_DURATIONS[type] ?? TIMING.DEFAULT_SLIDE_FRAMES;
}

/** Audio entry for a slide, only if it has real narration audio */
export function findSlideAudio(
  slideId: string,
  manifest?: AudioManifest
): SlideAudioTiming | undefined {
  const info = manifest?.slides.find((s) => s.slideId === slideId);
  return info && info.durationMs > 0 ? info : undefined;
}

/** Frame duration per slide: audio length + tail padding, or the type default */
export function computeSlideDurations(
  slides: SlideData[],
  manifest?: AudioManifest
): number[] {
  return slides.map((slide) => {
    const audio = findSlideAudio(slide.id, manifest);
    if (!audio) return getDefaultDuration(slide.type);
    const audioFrames = Math.ceil((audio.durationMs / MS_PER_SECOND) * VIDEO.FPS);
    return audioFrames + TIMING.AUDIO_TAIL_PADDING_FRAMES;
  });
}

/** Total composition length in frames */
export function computeTotalFrames(
  slides: SlideData[],
  manifest?: AudioManifest
): number {
  return computeSlideDurations(slides, manifest).reduce((sum, d) => sum + d, 0);
}

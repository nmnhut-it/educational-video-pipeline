import React from "react";
import {
  Sequence,
  useCurrentFrame,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { TitleSlide } from "../slides/TitleSlide";
import { SectionHeaderSlide } from "../slides/SectionHeaderSlide";
import { ConceptSlide } from "../slides/ConceptSlide";
import { CodeSlide } from "../slides/CodeSlide";
import { DiagramSlide } from "../slides/DiagramSlide";
import { TableSlide } from "../slides/TableSlide";
import { FlowSlide } from "../slides/FlowSlide";
import { OutroSlide } from "../slides/OutroSlide";
import { ImageSlide } from "../slides/ImageSlide";
import { AudioTrack } from "../components/AudioTrack";
import { SlideType } from "../types";
import type {
  SlideData,
  VideoScript,
  AudioManifest,
} from "../types";
import { VIDEO, TIMING, COLORS } from "../constants";
import videoScript from "../../content/video-script.json";

/**
 * Top-level composition that assembles all slides with audio sync.
 * Renders any VideoScript — not coupled to a specific topic.
 */

interface EducationalVideoProps {
  audioManifest?: AudioManifest;
}

export const EducationalVideo: React.FC<EducationalVideoProps> = ({ audioManifest }) => {
  const script = videoScript as VideoScript;
  const slides = script.slides;
  const slideDurations = computeSlideDurations(slides, audioManifest);
  const totalSlides = slides.length;
  const hasAudio = !!audioManifest;

  let frameOffset = 0;

  return (
    <AbsoluteFill>
      {slides.map((slide, index) => {
        const duration = slideDurations[index];
        const currentOffset = frameOffset;
        frameOffset += duration;

        const isNewSection =
          index === 0 || slide.section !== slides[index - 1].section;

        return (
          <Sequence
            key={slide.id}
            from={currentOffset}
            durationInFrames={duration}
            name={slide.id}
          >
            {isNewSection && index > 0 && <FadeIn />}
            <SlideRenderer
              slide={slide}
              slideIndex={index}
              totalSlides={totalSlides}
            />
            {hasAudio && (
              <AudioTrack src={`audio/${slide.id}.mp3`} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** Renders the correct component based on slide type */
const SlideRenderer: React.FC<{
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
}> = ({ slide, slideIndex, totalSlides }) => {
  const props = { slideIndex, totalSlides };

  switch (slide.type) {
    case SlideType.TITLE:
      return <TitleSlide data={slide} {...props} />;
    case SlideType.SECTION_HEADER:
      return <SectionHeaderSlide data={slide} {...props} />;
    case SlideType.CONCEPT:
      return <ConceptSlide data={slide} {...props} />;
    case SlideType.CODE:
      return <CodeSlide data={slide} {...props} />;
    case SlideType.DIAGRAM:
      return <DiagramSlide data={slide} {...props} />;
    case SlideType.FLOW:
      return <FlowSlide data={slide} {...props} />;
    case SlideType.TABLE:
      return <TableSlide data={slide} {...props} />;
    case SlideType.OUTRO:
      return <OutroSlide data={slide} {...props} />;
    case SlideType.IMAGE:
      return <ImageSlide data={slide} {...props} />;
    default:
      return null;
  }
};

/** Cross-fade overlay for section transitions */
const FadeIn: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, TIMING.SECTION_FADE_FRAMES],
    [1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.BG_PRIMARY,
        opacity,
        zIndex: 20,
      }}
    />
  );
};

/** Computes frame duration per slide from audio or defaults */
function computeSlideDurations(
  slides: SlideData[],
  manifest?: AudioManifest
): number[] {
  return slides.map((slide) => {
    if (manifest) {
      const audioInfo = manifest.slides.find((s) => s.slideId === slide.id);
      if (audioInfo && audioInfo.durationMs > 0) {
        const audioFrames = Math.ceil(
          (audioInfo.durationMs / 1000) * VIDEO.FPS
        );
        return audioFrames + TIMING.AUDIO_TAIL_PADDING_FRAMES;
      }
    }
    return getDefaultDuration(slide.type);
  });
}

/** Default frame durations by slide type (no audio) */
function getDefaultDuration(type: SlideType): number {
  const defaults: Record<SlideType, number> = {
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
  return defaults[type];
}

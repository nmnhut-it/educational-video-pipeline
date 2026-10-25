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
import { TIMING, COLORS } from "../constants";
import { computeSlideDurations, findSlideAudio } from "../timing";

/**
 * Top-level composition that assembles all slides with audio sync.
 * Renders any VideoScript — not coupled to a specific topic.
 */

/** A type alias (not an interface) so Remotion accepts it as composition props */
export type EducationalVideoProps = {
  script: VideoScript;
  audioManifest?: AudioManifest;
};

export const EducationalVideo: React.FC<EducationalVideoProps> = ({
  script,
  audioManifest,
}) => {
  const slides = script.slides;
  const slideDurations = computeSlideDurations(slides, audioManifest);
  const totalSlides = slides.length;

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
            {/* Slides with empty narration have no MP3; a missing file fails the render */}
            {findSlideAudio(slide.id, audioManifest) && (
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

/** Fades in from the theme background at the start of each new section */
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

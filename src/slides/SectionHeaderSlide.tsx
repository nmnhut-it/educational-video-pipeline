import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import { SectionHeaderSlideData } from "../types";

interface SectionHeaderSlideProps {
  data: SectionHeaderSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Stage header with large number, heading, and tagline */
export const SectionHeaderSlide: React.FC<SectionHeaderSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60, mass: 0.8 },
  });
  const scale = interpolate(numberScale, [0, 1], [0.5, 1]);
  const numberOpacity = interpolate(numberScale, [0, 1], [0, 0.15]);

  return (
    <SlideLayout
      slideIndex={slideIndex}
      totalSlides={totalSlides}
      backgroundColor={COLORS.BG_SECONDARY}
    >
      <div style={{ textAlign: "center", position: "relative" }}>
        {/* Large background stage number */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: `translateX(-50%) scale(${scale})`,
            fontSize: FONT_SIZES.STAGE_NUMBER,
            fontFamily: FONTS.HEADING,
            fontWeight: 900,
            color: COLORS.ACCENT_BLUE,
            opacity: numberOpacity,
            userSelect: "none",
          }}
        >
          {data.stageNumber}
        </div>

        <AnimatedText delay={5}>
          <p
            style={{
              fontSize: FONT_SIZES.BODY,
              color: COLORS.ACCENT_BLUE,
              fontFamily: FONTS.CODE,
              fontWeight: 600,
              margin: "0 0 16px 0",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Stage {data.stageNumber}
          </p>
        </AnimatedText>

        <AnimatedText delay={12}>
          <h2
            style={{
              fontSize: FONT_SIZES.SECTION_HEADER,
              fontFamily: FONTS.HEADING,
              fontWeight: 700,
              margin: "0 0 24px 0",
              color: COLORS.TEXT_PRIMARY,
            }}
          >
            {data.heading}
          </h2>
        </AnimatedText>

        <AnimatedText delay={20}>
          <p
            style={{
              fontSize: FONT_SIZES.SECTION_TAGLINE,
              color: COLORS.TEXT_SECONDARY,
              fontFamily: FONTS.BODY,
              margin: 0,
            }}
          >
            {data.tagline}
          </p>
        </AnimatedText>
      </div>
    </SlideLayout>
  );
};

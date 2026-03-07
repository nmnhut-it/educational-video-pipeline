import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import { OutroSlideData } from "../types";

interface OutroSlideProps {
  data: OutroSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Closing slide with summary message and evolution line */
export const OutroSlide: React.FC<OutroSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineWidth = spring({
    frame: frame - 25,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const lineWidthPx = interpolate(lineWidth, [0, 1], [0, 300]);

  return (
    <SlideLayout
      slideIndex={slideIndex}
      totalSlides={totalSlides}
      backgroundColor={COLORS.BG_SECONDARY}
    >
      <div style={{ textAlign: "center" }}>
        <AnimatedText delay={0}>
          <h2
            style={{
              fontSize: FONT_SIZES.SECTION_HEADER,
              fontFamily: FONTS.HEADING,
              fontWeight: 700,
              margin: "0 0 32px 0",
              color: COLORS.TEXT_PRIMARY,
            }}
          >
            {data.title}
          </h2>
        </AnimatedText>

        <AnimatedText delay={10}>
          <p
            style={{
              fontSize: FONT_SIZES.BODY,
              fontFamily: FONTS.BODY,
              color: COLORS.TEXT_SECONDARY,
              lineHeight: 1.8,
              margin: "0 0 40px 0",
              maxWidth: 900,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {data.message}
          </p>
        </AnimatedText>

        <div
          style={{
            width: lineWidthPx,
            height: 3,
            backgroundColor: COLORS.ACCENT_BLUE,
            margin: "0 auto 40px auto",
            borderRadius: 2,
          }}
        />

        <AnimatedText delay={30}>
          <p
            style={{
              fontSize: FONT_SIZES.CAPTION,
              fontFamily: FONTS.CODE,
              color: COLORS.TEXT_MUTED,
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: 1000,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {data.evolutionLine}
          </p>
        </AnimatedText>
      </div>
    </SlideLayout>
  );
};

import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import { TitleSlideData } from "../types";

interface TitleSlideProps {
  data: TitleSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Opening title slide with large heading + subtitle + accent line */
export const TitleSlide: React.FC<TitleSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineWidth = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const lineWidthPx = interpolate(lineWidth, [0, 1], [0, 200]);

  return (
    <SlideLayout slideIndex={slideIndex} totalSlides={totalSlides}>
      <div style={{ textAlign: "center" }}>
        <AnimatedText delay={0}>
          <h1
            style={{
              fontSize: FONT_SIZES.TITLE,
              fontFamily: FONTS.HEADING,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              color: COLORS.TEXT_PRIMARY,
            }}
          >
            {data.title}
          </h1>
        </AnimatedText>

        <div
          style={{
            width: lineWidthPx,
            height: 4,
            backgroundColor: COLORS.ACCENT_BLUE,
            margin: "32px auto",
            borderRadius: 2,
          }}
        />

        <AnimatedText delay={15}>
          <p
            style={{
              fontSize: FONT_SIZES.SUBTITLE,
              color: COLORS.TEXT_SECONDARY,
              fontFamily: FONTS.BODY,
              margin: 0,
            }}
          >
            {data.subtitle}
          </p>
        </AnimatedText>
      </div>
    </SlideLayout>
  );
};

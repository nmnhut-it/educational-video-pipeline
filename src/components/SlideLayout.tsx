import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, LAYOUT } from "../constants";
import { ProgressBar } from "./ProgressBar";

interface SlideLayoutProps {
  children: React.ReactNode;
  /** Current slide index (0-based) for progress bar */
  slideIndex: number;
  /** Total number of slides for progress bar */
  totalSlides: number;
  /** Optional background color override */
  backgroundColor?: string;
}

/** Themed wrapper with padding and progress bar for all slides */
export const SlideLayout: React.FC<SlideLayoutProps> = ({
  children,
  slideIndex,
  totalSlides,
  backgroundColor = COLORS.BG_PRIMARY,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: FONTS.BODY,
        color: COLORS.TEXT_PRIMARY,
        overflow: "hidden",
      }}
    >
      <ProgressBar slideIndex={slideIndex} totalSlides={totalSlides} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `${LAYOUT.PADDING_Y}px ${LAYOUT.PADDING_X}px`,
          height: "100%",
          boxSizing: "border-box",
          maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

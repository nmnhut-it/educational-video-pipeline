import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { ProgressBar } from "../components/ProgressBar";
import { ImageSlideData } from "../types";
import { COLORS } from "../constants";

interface ImageSlideProps {
  data: ImageSlideData;
  slideIndex: number;
  totalSlides: number;
}

/**
 * Full-screen image slide for PPTX-sourced videos.
 * Displays the original slide PNG with a progress bar overlay.
 * Input: imagePath relative to public/ (e.g. "pptx-slides/Slide1.PNG")
 * Assets must live under public/ so Remotion's dev server and renderer can serve them.
 */
export const ImageSlide: React.FC<ImageSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.IMAGE_BACKDROP }}>
      <img
        src={staticFile(data.imagePath)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <ProgressBar slideIndex={slideIndex} totalSlides={totalSlides} />
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill } from "remotion";
import { ProgressBar } from "../components/ProgressBar";
import { ImageSlideData } from "../types";

interface ImageSlideProps {
  data: ImageSlideData;
  slideIndex: number;
  totalSlides: number;
}

/**
 * Full-screen image slide for PPTX-sourced videos.
 * Displays the original slide PNG with a progress bar overlay.
 * Input: imagePath relative to project root (e.g. "temp/pptx-slides/slide-01.png")
 */
export const ImageSlide: React.FC<ImageSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <img
        src={data.imagePath}
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

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, LAYOUT, VIDEO } from "../constants";

interface ProgressBarProps {
  slideIndex: number;
  totalSlides: number;
}

/**
 * Thin accent-colored bar at the top showing video progress.
 * Inside a <Sequence>, useVideoConfig().durationInFrames is the slide's own length.
 * No CSS transitions: Remotion renders frame by frame, so they would only flicker.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  slideIndex,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const baseProgress = slideIndex / totalSlides;
  const slideProgress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1 / totalSlides],
    { extrapolateRight: "clamp" }
  );
  const totalProgress = baseProgress + slideProgress;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: VIDEO.WIDTH,
        height: LAYOUT.PROGRESS_BAR_HEIGHT,
        backgroundColor: COLORS.BG_TERTIARY,
        zIndex: 10,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${totalProgress * 100}%`,
          backgroundColor: COLORS.ACCENT_BLUE,
        }}
      />
    </div>
  );
};

import React from "react";
import { Audio, staticFile } from "remotion";

interface AudioTrackProps {
  /** Filename relative to public/ directory (e.g. "audio/slide-01.mp3") */
  src: string;
  /** Volume level 0-1 */
  volume?: number;
}

/** Wrapper around Remotion's Audio component for per-slide narration */
export const AudioTrack: React.FC<AudioTrackProps> = ({
  src,
  volume = 1,
}) => {
  return <Audio src={staticFile(src)} volume={volume} />;
};

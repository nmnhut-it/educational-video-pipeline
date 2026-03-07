import { Composition } from "remotion";
import { EducationalVideo } from "./compositions/EducationalVideo";
import { VIDEO, TIMING } from "./constants";
import { SlideType } from "./types";
import type { VideoScript, AudioManifest } from "./types";
import videoScript from "../content/video-script.json";

/** Try to load audio manifest if it exists */
let audioManifest: AudioManifest | undefined;
try {
  audioManifest = require("../public/audio/manifest.json") as AudioManifest;
} catch {
  audioManifest = undefined;
}

/** Compute total frames from manifest or default durations */
function computeTotalFrames(
  script: VideoScript,
  manifest?: AudioManifest
): number {
  const DEFAULT_DURATIONS: Record<string, number> = {
    [SlideType.TITLE]: 180,
    [SlideType.SECTION_HEADER]: 120,
    [SlideType.CONCEPT]: 210,
    [SlideType.CODE]: 300,
    [SlideType.DIAGRAM]: 300,
    [SlideType.FLOW]: 300,
    [SlideType.TABLE]: 240,
    [SlideType.OUTRO]: 210,
  };

  return script.slides.reduce((total, slide) => {
    if (manifest) {
      const info = manifest.slides.find((s) => s.slideId === slide.id);
      if (info && info.durationMs > 0) {
        const frames = Math.ceil((info.durationMs / 1000) * VIDEO.FPS);
        return total + frames + TIMING.AUDIO_TAIL_PADDING_FRAMES;
      }
    }
    return total + (DEFAULT_DURATIONS[slide.type] || 200);
  }, 0);
}

/** Remotion entry point — registers all compositions */
export const RemotionRoot: React.FC = () => {
  const script = videoScript as VideoScript;
  const totalFrames = computeTotalFrames(script, audioManifest);

  return (
    <>
      <Composition
        id="EducationalVideo"
        component={EducationalVideo}
        durationInFrames={totalFrames}
        fps={VIDEO.FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
        defaultProps={{ audioManifest }}
      />
    </>
  );
};

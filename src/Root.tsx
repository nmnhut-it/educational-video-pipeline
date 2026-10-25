import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { EducationalVideo } from "./compositions/EducationalVideo";
import type { EducationalVideoProps } from "./compositions/EducationalVideo";
import { VIDEO } from "./constants";
import { computeTotalFrames } from "./timing";
import type { VideoScript, AudioManifest } from "./types";
import videoScript from "../content/video-script.json";

/** Try to load audio manifest if it exists */
let audioManifest: AudioManifest | undefined;
try {
  audioManifest = require("../public/audio/manifest.json") as AudioManifest;
} catch {
  audioManifest = undefined;
}

/** Length comes from the props actually rendered, so `--props` overrides stay in sync */
const calculateMetadata: CalculateMetadataFunction<EducationalVideoProps> = ({
  props,
}) => ({
  durationInFrames: computeTotalFrames(props.script.slides, props.audioManifest),
});

/** Remotion entry point — registers all compositions */
export const RemotionRoot: React.FC = () => {
  const script = videoScript as VideoScript;

  return (
    <>
      <Composition
        id="EducationalVideo"
        component={EducationalVideo}
        durationInFrames={computeTotalFrames(script.slides, audioManifest)}
        fps={VIDEO.FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
        defaultProps={{ script, audioManifest }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};

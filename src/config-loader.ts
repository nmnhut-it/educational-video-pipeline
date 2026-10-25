/**
 * Loads video.config.json with sensible defaults.
 * When no config file exists, returns the original hardcoded values
 * so the pipeline works unchanged for existing projects.
 */

import * as fs from "fs";
import * as path from "path";
import { TtsProviderId } from "./types";
import type { VideoConfig } from "./types";

const CONFIG_FILENAME = "video.config.json";

const DEFAULT_CONFIG: VideoConfig = {
  narration: {
    provider: TtsProviderId.ELEVENLABS,
    language: "vi",
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
    modelId: "eleven_v3",
    voiceSettings: {
      stability: 0.6,
      similarityBoost: 0.8,
      style: 0.2,
    },
  },
  theme: "light",
  scriptPath: "content/video-script.json",
  outputPath: "output",
  audioDir: "public/audio",
};

/** Load config from project root, merging with defaults */
export function loadVideoConfig(projectRoot?: string): VideoConfig {
  const root = projectRoot ?? path.resolve(__dirname, "..");
  const configPath = path.join(root, CONFIG_FILENAME);

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return mergeConfig(DEFAULT_CONFIG, raw);
}

/** Deep-merge user config over defaults (one level of nesting) */
function mergeConfig(
  defaults: VideoConfig,
  overrides: Partial<VideoConfig>
): VideoConfig {
  return {
    ...defaults,
    ...overrides,
    narration: {
      ...defaults.narration,
      ...overrides.narration,
      voiceSettings: {
        ...defaults.narration.voiceSettings,
        ...overrides.narration?.voiceSettings,
      },
    },
  };
}

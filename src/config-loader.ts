/**
 * Loads video.config.json with sensible defaults.
 * When no config file exists, returns the original hardcoded values
 * so the pipeline works unchanged for existing projects.
 */

import * as fs from "fs";
import * as path from "path";
import { TtsProviderId } from "./types";
import type { NarrationConfig, VideoConfig } from "./types";

/** What a video.config.json may contain: any field, at any depth, can be left out */
export type VideoConfigOverrides = Partial<Omit<VideoConfig, "narration">> & {
  narration?: Partial<Omit<NarrationConfig, "voiceSettings" | "openaiCompatible" | "piper">> & {
    voiceSettings?: Partial<NarrationConfig["voiceSettings"]>;
    openaiCompatible?: Partial<NarrationConfig["openaiCompatible"]>;
    piper?: Partial<NarrationConfig["piper"]>;
  };
};

const CONFIG_FILENAME = "video.config.json";

const DEFAULT_CONFIG: VideoConfig = {
  narration: {
    provider: TtsProviderId.ELEVENLABS,
    language: "vi",
    // Empty: each provider has its own fallback (ElevenLabs reads ELEVENLABS_VOICE_ID)
    voiceId: "",
    modelId: "eleven_v3",
    voiceSettings: {
      stability: 0.6,
      similarityBoost: 0.8,
      style: 0.2,
    },
    openaiCompatible: {
      baseUrl: "http://localhost:8000/v1",
      model: "tts-1",
      apiKeyEnv: "TTS_API_KEY",
      speed: 1.0,
    },
    piper: {
      python: "python",
      dataDir: "models/piper",
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
    return mergeConfig(DEFAULT_CONFIG, {});
  }

  const raw: VideoConfigOverrides = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return mergeConfig(DEFAULT_CONFIG, raw);
}

/** Deep-merge user config over defaults (narration and its per-provider sections) */
export function mergeConfig(
  defaults: VideoConfig,
  overrides: VideoConfigOverrides
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
      openaiCompatible: {
        ...defaults.narration.openaiCompatible,
        ...overrides.narration?.openaiCompatible,
      },
      piper: {
        ...defaults.narration.piper,
        ...overrides.narration?.piper,
      },
    },
  };
}

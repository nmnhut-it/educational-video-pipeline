/**
 * Picks the text-to-speech engine named by `narration.provider` in video.config.json.
 * Input: the narration config and the project root (for relative paths such as
 * Piper's voice folder). Output: a ready TtsProvider, or a TtsSetupError that
 * explains what is missing. Engines live next to this file.
 */

import { TtsProviderId } from "../../src/types";
import type { NarrationConfig } from "../../src/types";
import { ElevenLabsProvider } from "./elevenlabs";
import { OpenAiCompatibleProvider } from "./openai-compatible";
import { PiperProvider } from "./piper";
import { TtsSetupError } from "./provider";
import type { TtsProvider } from "./provider";

export function createTtsProvider(narration: NarrationConfig, projectRoot: string): TtsProvider {
  switch (narration.provider) {
    case TtsProviderId.ELEVENLABS:
      return ElevenLabsProvider.fromConfig(narration);
    case TtsProviderId.OPENAI_COMPATIBLE:
      return OpenAiCompatibleProvider.fromConfig(narration);
    case TtsProviderId.PIPER:
      return PiperProvider.fromConfig(narration, projectRoot);
    default: {
      const known = Object.values(TtsProviderId).join(", ");
      throw new TtsSetupError(`Unknown narration.provider "${narration.provider}". Known: ${known}`);
    }
  }
}

export { TtsSetupError } from "./provider";
export type { TtsProvider, SynthesisResult, VoiceInfo, CharacterTiming } from "./provider";

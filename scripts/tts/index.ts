/**
 * Picks the text-to-speech engine named by `narration.provider` in video.config.json.
 * Input: the narration config. Output: a ready TtsProvider, or a TtsSetupError
 * that explains what is missing. Engines live next to this file.
 */

import { TtsProviderId } from "../../src/types";
import type { NarrationConfig } from "../../src/types";
import { ElevenLabsProvider } from "./elevenlabs";
import { TtsSetupError } from "./provider";
import type { TtsProvider } from "./provider";

export function createTtsProvider(narration: NarrationConfig): TtsProvider {
  switch (narration.provider) {
    case TtsProviderId.ELEVENLABS:
      return ElevenLabsProvider.fromConfig(narration);
    default: {
      const known = Object.values(TtsProviderId).join(", ");
      throw new TtsSetupError(`Unknown narration.provider "${narration.provider}". Known: ${known}`);
    }
  }
}

export { TtsSetupError } from "./provider";
export type { TtsProvider, SynthesisResult, VoiceInfo, CharacterTiming } from "./provider";

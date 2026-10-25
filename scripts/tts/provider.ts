/**
 * The contract every text-to-speech engine implements.
 * generate-audio.ts and list-voices.ts only talk to this interface; the
 * concrete engine is picked by `narration.provider` in video.config.json
 * (see createTtsProvider in ./index.ts).
 *
 * To add an engine: add a value to TtsProviderId (src/types.ts), write a
 * class implementing TtsProvider in this folder, and add a case in ./index.ts.
 */

import type { TtsProviderId } from "../../src/types";

/** One character's place in the audio, if the engine reports it */
export interface CharacterTiming {
  character: string;
  startMs: number;
  endMs: number;
}

/** Output of one synthesis call */
export interface SynthesisResult {
  /** MP3 bytes. The video loads public/audio/<slideId>.mp3, so engines must return MP3. */
  audio: Buffer;
  /** Character timestamps; optional because many engines do not send them */
  characters?: CharacterTiming[];
}

/** A voice the user can pick */
export interface VoiceInfo {
  id: string;
  name: string;
  /** Free-text details: gender, accent, language, category */
  details: string;
}

export interface TtsProvider {
  readonly id: TtsProviderId;
  /** Pause between slides, to stay under a cloud API's rate limit; 0 for local engines */
  readonly requestDelayMs: number;
  /**
   * Every setting that changes how the audio sounds (voice, model, style...),
   * as a stable string. Goes into the per-slide cache hash; must not contain secrets.
   */
  cacheKey(): string;
  /** Speak one slide's narration */
  synthesize(text: string): Promise<SynthesisResult>;
  /** Voices available to this account / install */
  listVoices(): Promise<VoiceInfo[]>;
}

/** Bad or missing setup (API key, voice). The message is shown to the user as-is. */
export class TtsSetupError extends Error {}

/**
 * ElevenLabs text-to-speech provider.
 * Calls POST /v1/text-to-speech/{voiceId}/with-timestamps (MP3 + character timings)
 * and GET /v1/voices. Needs ELEVENLABS_API_KEY; the voice comes from
 * narration.voiceId or ELEVENLABS_VOICE_ID.
 */

import { TtsProviderId } from "../../src/types";
import type { NarrationConfig } from "../../src/types";
import { httpErrorFrom } from "./retry";
import { TtsSetupError } from "./provider";
import type { CharacterTiming, SynthesisResult, TtsProvider, VoiceInfo } from "./provider";

const BASE_URL = "https://api.elevenlabs.io/v1";
/** Sent as a query parameter: the API ignores output_format in the JSON body */
const OUTPUT_FORMAT = "mp3_44100_128";
const API_KEY_PLACEHOLDER = "your_api_key_here";
const MS_PER_SECOND = 1000;

interface TimestampResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

interface VoicesResponse {
  voices: Array<{ voice_id: string; name: string; category: string; labels?: Record<string, string> }>;
}

export class ElevenLabsProvider implements TtsProvider {
  readonly id = TtsProviderId.ELEVENLABS;

  private constructor(
    private readonly apiKey: string,
    private readonly voiceId: string,
    private readonly narration: NarrationConfig
  ) {}

  /** Reads the key from the environment; a voice is only required for synthesis */
  static fromConfig(narration: NarrationConfig): ElevenLabsProvider {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === API_KEY_PLACEHOLDER) {
      throw new TtsSetupError("Set ELEVENLABS_API_KEY in .env");
    }
    const voiceId = narration.voiceId || process.env.ELEVENLABS_VOICE_ID || "";
    return new ElevenLabsProvider(apiKey, voiceId, narration);
  }

  cacheKey(): string {
    const { modelId, voiceSettings } = this.narration;
    return JSON.stringify({ provider: this.id, voiceId: this.voiceId, modelId, voiceSettings, OUTPUT_FORMAT });
  }

  async synthesize(text: string): Promise<SynthesisResult> {
    if (!this.voiceId) {
      throw new TtsSetupError("Set voiceId in video.config.json or ELEVENLABS_VOICE_ID in .env");
    }
    const { modelId, voiceSettings } = this.narration;
    const url = `${BASE_URL}/text-to-speech/${this.voiceId}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarityBoost,
          style: voiceSettings.style,
        },
      }),
    });
    if (!response.ok) throw await httpErrorFrom(response, "ElevenLabs API error");

    const data = (await response.json()) as TimestampResponse;
    return { audio: Buffer.from(data.audio_base64, "base64"), characters: toCharacterTimings(data) };
  }

  async listVoices(): Promise<VoiceInfo[]> {
    const response = await fetch(`${BASE_URL}/voices`, { headers: { "xi-api-key": this.apiKey } });
    if (!response.ok) throw await httpErrorFrom(response, "ElevenLabs API error");
    const data = (await response.json()) as VoicesResponse;
    return data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      details: [`category=${v.category}`, ...Object.entries(v.labels ?? {}).map(([k, val]) => `${k}=${val}`)].join(", "),
    }));
  }
}

function toCharacterTimings(data: TimestampResponse): CharacterTiming[] {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = data.alignment;
  return characters.map((character, i) => ({
    character,
    startMs: Math.round(starts[i] * MS_PER_SECOND),
    endMs: Math.round(ends[i] * MS_PER_SECOND),
  }));
}

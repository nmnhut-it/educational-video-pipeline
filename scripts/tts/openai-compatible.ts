/**
 * Provider for any text-to-speech server that speaks the OpenAI speech API:
 * POST {baseUrl}/audio/speech with { model, input, voice, response_format, speed },
 * answering with raw audio bytes. Works with local servers — VieNeu-TTS
 * (Vietnamese, `python -m apps.openai_speech`, port 8000), Kokoro-FastAPI (port 8880),
 * LocalAI — and with OpenAI itself (set apiKeyEnv to OPENAI_API_KEY).
 * Settings: narration.openaiCompatible in video.config.json; voice = narration.voiceId.
 */

import { TtsProviderId } from "../../src/types";
import type { NarrationConfig, OpenAiCompatibleConfig } from "../../src/types";
import { httpErrorFrom } from "./retry";
import { TtsSetupError } from "./provider";
import type { SynthesisResult, TtsProvider, VoiceInfo } from "./provider";

const SPEECH_PATH = "/audio/speech";
/** Not in the OpenAI spec; Kokoro-FastAPI and some other local servers offer it */
const VOICES_PATH = "/audio/voices";
const RESPONSE_FORMAT = "mp3";
const HTTP_NOT_FOUND = 404;

/** Voice lists differ between servers: plain names, or objects with an id / name */
type VoiceEntry = string | { id?: string; voice_id?: string; name?: string };
type VoicesResponse = VoiceEntry[] | { voices?: VoiceEntry[]; data?: VoiceEntry[] };

export class OpenAiCompatibleProvider implements TtsProvider {
  readonly id = TtsProviderId.OPENAI_COMPATIBLE;
  /** Local servers have no rate limit; set TTS_RATE_LIMIT_DELAY_MS for a hosted one */
  readonly requestDelayMs = 0;

  private constructor(
    private readonly settings: OpenAiCompatibleConfig,
    private readonly voice: string,
    private readonly apiKey: string | undefined
  ) {}

  static fromConfig(narration: NarrationConfig): OpenAiCompatibleProvider {
    const settings = { ...narration.openaiCompatible, baseUrl: narration.openaiCompatible.baseUrl.replace(/\/+$/, "") };
    return new OpenAiCompatibleProvider(settings, narration.voiceId, process.env[settings.apiKeyEnv]);
  }

  cacheKey(): string {
    const { baseUrl, model, speed } = this.settings;
    return JSON.stringify({ provider: this.id, baseUrl, model, speed, voice: this.voice, RESPONSE_FORMAT });
  }

  async synthesize(text: string): Promise<SynthesisResult> {
    if (!this.voice) {
      throw new TtsSetupError("Set narration.voiceId in video.config.json to one of the server's voices (npm run list-voices)");
    }
    const { model, speed } = this.settings;
    const response = await this.request(SPEECH_PATH, {
      method: "POST",
      headers: { ...this.authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text, voice: this.voice, response_format: RESPONSE_FORMAT, speed }),
    });
    if (!response.ok) throw await httpErrorFrom(response, "TTS server error");
    return { audio: Buffer.from(await response.arrayBuffer()) };
  }

  async listVoices(): Promise<VoiceInfo[]> {
    const response = await this.request(VOICES_PATH, { headers: this.authHeader() });
    if (response.status === HTTP_NOT_FOUND) {
      throw new TtsSetupError(
        `${this.settings.baseUrl} does not list voices. Look up a voice name in the server's docs and set narration.voiceId.`
      );
    }
    if (!response.ok) throw await httpErrorFrom(response, "TTS server error");
    return toVoiceInfos((await response.json()) as VoicesResponse);
  }

  private authHeader(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  /** fetch with a setup hint when nothing is listening at baseUrl */
  private async request(apiPath: string, init: RequestInit): Promise<Response> {
    const url = `${this.settings.baseUrl}${apiPath}`;
    try {
      return await fetch(url, init);
    } catch (error) {
      const cause = (error as Error & { cause?: { code?: string } }).cause;
      if (cause?.code === "ECONNREFUSED") {
        throw new TtsSetupError(`No TTS server at ${this.settings.baseUrl}. Start it (e.g. VieNeu-TTS: uv run python -m apps.openai_speech) or fix narration.openaiCompatible.baseUrl.`);
      }
      throw error;
    }
  }
}

function toVoiceInfos(data: VoicesResponse): VoiceInfo[] {
  const entries = Array.isArray(data) ? data : data.voices ?? data.data ?? [];
  return entries.map((entry) => {
    if (typeof entry === "string") return { id: entry, name: entry, details: "" };
    const id = entry.id ?? entry.voice_id ?? entry.name ?? "";
    return { id, name: entry.name ?? id, details: "" };
  });
}

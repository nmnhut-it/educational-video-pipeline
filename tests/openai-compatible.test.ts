/**
 * OpenAI-compatible provider against a fake local speech server (node:http).
 * Checks the request the server receives, the API-key header, voice-list parsing,
 * and the setup hints for "no server running" and "server cannot list voices".
 */
import { test, before, after } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { createTtsProvider, TtsSetupError } from "../scripts/tts";
import { mergeConfig, loadVideoConfig } from "../src/config-loader";
import { TtsProviderId } from "../src/types";
import type { NarrationConfig } from "../src/types";

const FAKE_MP3 = Buffer.from("ID3-fake-mp3-bytes");
const API_KEY_ENV = "TEST_TTS_API_KEY";
const PROJECT_ROOT = process.cwd();
let server: http.Server;
let baseUrl: string;
let lastRequest: { url?: string; auth?: string; body: Record<string, unknown> } | undefined;

before(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      lastRequest = { url: req.url, auth: req.headers.authorization, body: raw ? JSON.parse(raw) : {} };
      if (req.url === "/v1/audio/speech") return void res.end(FAKE_MP3);
      if (req.url === "/v1/audio/voices") return void res.end(JSON.stringify({ voices: ["vi_mai", { id: "vi_nam", name: "Nam" }] }));
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});

after(() => server.close());

function narration(overrides: Partial<NarrationConfig["openaiCompatible"]>, voiceId = "vi_mai"): NarrationConfig {
  const base = loadVideoConfig(PROJECT_ROOT).narration;
  return { ...base, provider: TtsProviderId.OPENAI_COMPATIBLE, voiceId, openaiCompatible: { ...base.openaiCompatible, ...overrides } };
}

test("sends model, text, voice, mp3 format and speed; returns the audio bytes", async () => {
  const provider = createTtsProvider(narration({ baseUrl: baseUrl + "/", model: "vieneu", speed: 1.1 }), PROJECT_ROOT);
  const result = await provider.synthesize("Xin chào");
  assert.deepEqual(result.audio, FAKE_MP3);
  assert.equal(lastRequest?.url, "/v1/audio/speech", "trailing slash in baseUrl is dropped");
  assert.deepEqual(lastRequest?.body, { model: "vieneu", input: "Xin chào", voice: "vi_mai", response_format: "mp3", speed: 1.1 });
  assert.equal(lastRequest?.auth, undefined, "no key configured, no header");
});

test("sends the API key from the configured env var", async () => {
  process.env[API_KEY_ENV] = "secret-123";
  try {
    const provider = createTtsProvider(narration({ baseUrl, apiKeyEnv: API_KEY_ENV }), PROJECT_ROOT);
    await provider.synthesize("Hi");
    assert.equal(lastRequest?.auth, "Bearer secret-123");
    assert.ok(!provider.cacheKey().includes("secret-123"), "the key must not end up in the cache hash");
  } finally {
    delete process.env[API_KEY_ENV];
  }
});

test("lists voices given as names or objects", async () => {
  const voices = await createTtsProvider(narration({ baseUrl }), PROJECT_ROOT).listVoices();
  assert.deepEqual(voices.map((v) => [v.id, v.name]), [["vi_mai", "vi_mai"], ["vi_nam", "Nam"]]);
});

test("a server without a voice list gives a setup hint", async () => {
  const provider = createTtsProvider(narration({ baseUrl: baseUrl + "/other" }), PROJECT_ROOT);
  await assert.rejects(provider.listVoices(), TtsSetupError);
});

test("no server running gives a setup hint instead of a raw network error", async () => {
  const closed = http.createServer();
  await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
  const port = (closed.address() as AddressInfo).port;
  await new Promise<void>((resolve) => closed.close(() => resolve()));
  const provider = createTtsProvider(narration({ baseUrl: `http://127.0.0.1:${port}/v1` }), PROJECT_ROOT);
  await assert.rejects(provider.synthesize("Hi"), (e: Error) => e instanceof TtsSetupError && /No TTS server/.test(e.message));
});

test("an empty voice is a setup error", async () => {
  const provider = createTtsProvider(narration({ baseUrl }, ""), PROJECT_ROOT);
  await assert.rejects(provider.synthesize("Hi"), TtsSetupError);
});

test("config merge keeps defaults for provider fields the file leaves out", () => {
  const defaults = loadVideoConfig(PROJECT_ROOT);
  const merged = mergeConfig(defaults, { narration: { provider: TtsProviderId.PIPER, piper: { dataDir: "voices" } } });
  assert.equal(merged.narration.piper.dataDir, "voices");
  assert.equal(merged.narration.piper.python, defaults.narration.piper.python);
  assert.equal(merged.narration.openaiCompatible.baseUrl, defaults.narration.openaiCompatible.baseUrl);
  assert.equal(merged.narration.voiceSettings.stability, defaults.narration.voiceSettings.stability);
});

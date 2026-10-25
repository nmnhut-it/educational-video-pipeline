/**
 * Piper provider: fully offline text-to-speech on CPU (https://github.com/OHF-Voice/piper1-gpl).
 * Runs `python -m piper -m <voice> --data-dir <dataDir> -f out.wav` with the text on
 * stdin, then converts the WAV to MP3 with Remotion's bundled ffmpeg.
 * Text goes through stdin (not argv) because Piper keeps a `--` separator as part of
 * the spoken text; PYTHONUTF8=1 makes Windows Python read stdin as UTF-8.
 * Setup: `pip install piper-tts`, then download a voice into dataDir, e.g.
 *   python -m piper.download_voices --download-dir models/piper vi_VN-vais1000-medium
 * Settings: narration.piper in video.config.json; voice = narration.voiceId.
 */

import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { TtsProviderId } from "../../src/types";
import type { NarrationConfig, PiperConfig } from "../../src/types";
import { convertToMp3 } from "./remotion-ffmpeg";
import { TtsSetupError } from "./provider";
import type { SynthesisResult, TtsProvider, VoiceInfo } from "./provider";

const execFileAsync = promisify(execFile);
const MODEL_EXTENSION = ".onnx";
const INSTALL_HINT = "Install Piper with: pip install piper-tts";
const DOWNLOAD_HINT = "python -m piper.download_voices --download-dir <dataDir> vi_VN-vais1000-medium";
/** Piper prints this when the Python package is missing */
const MISSING_MODULE_MARKER = "No module named piper";
/** Forces UTF-8 stdin on Windows, where Python otherwise uses the ANSI code page */
const PYTHON_UTF8_ENV = { PYTHONUTF8: "1" };
const LINE_BREAKS = /\s*[\r\n]+\s*/g;

export class PiperProvider implements TtsProvider {
  readonly id = TtsProviderId.PIPER;
  readonly requestDelayMs = 0;

  private constructor(
    private readonly settings: PiperConfig,
    private readonly dataDir: string,
    private readonly voice: string
  ) {}

  /** dataDir in the config is relative to the project root */
  static fromConfig(narration: NarrationConfig, projectRoot: string): PiperProvider {
    const dataDir = path.resolve(projectRoot, narration.piper.dataDir);
    return new PiperProvider(narration.piper, dataDir, narration.voiceId);
  }

  cacheKey(): string {
    return JSON.stringify({ provider: this.id, voice: this.voice });
  }

  async synthesize(text: string): Promise<SynthesisResult> {
    this.assertVoiceInstalled();
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "piper-"));
    try {
      const wavPath = path.join(workDir, "speech.wav");
      const mp3Path = path.join(workDir, "speech.mp3");
      // One utterance per slide: Piper may treat each input line separately
      const input = text.replace(LINE_BREAKS, " ").trim();
      await this.runPiper(["-m", this.voice, "--data-dir", this.dataDir, "-f", wavPath], input);
      await convertToMp3(wavPath, mp3Path);
      return { audio: fs.readFileSync(mp3Path) };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  async listVoices(): Promise<VoiceInfo[]> {
    const voices = this.installedVoices();
    if (voices.length === 0) {
      throw new TtsSetupError(`No Piper voices in ${this.dataDir}. Download one: ${DOWNLOAD_HINT}`);
    }
    return voices.map((name) => ({ id: name, name, details: path.join(this.dataDir, name + MODEL_EXTENSION) }));
  }

  /** Voice names (file names without .onnx) in dataDir */
  private installedVoices(): string[] {
    if (!fs.existsSync(this.dataDir)) return [];
    return fs.readdirSync(this.dataDir)
      .filter((f) => f.endsWith(MODEL_EXTENSION))
      .map((f) => f.slice(0, -MODEL_EXTENSION.length));
  }

  private assertVoiceInstalled(): void {
    if (!this.voice) {
      throw new TtsSetupError(`Set narration.voiceId to a Piper voice, e.g. vi_VN-vais1000-medium (download: ${DOWNLOAD_HINT})`);
    }
    if (!this.installedVoices().includes(this.voice)) {
      throw new TtsSetupError(`Piper voice "${this.voice}" is not in ${this.dataDir}. Download it: ${DOWNLOAD_HINT}`);
    }
  }

  /** Runs `<python> -m piper <args>` with `input` on stdin; "not installed" becomes a setup hint */
  private async runPiper(args: string[], input: string): Promise<void> {
    try {
      const child = execFileAsync(this.settings.python, ["-m", "piper", ...args], {
        windowsHide: true,
        env: { ...process.env, ...PYTHON_UTF8_ENV },
      });
      child.child.stdin?.end(input, "utf-8");
      await child;
    } catch (error) {
      const failure = error as NodeJS.ErrnoException & { stderr?: string };
      if (failure.code === "ENOENT") {
        throw new TtsSetupError(`Python not found at "${this.settings.python}" (narration.piper.python). ${INSTALL_HINT}`);
      }
      if (failure.stderr?.includes(MISSING_MODULE_MARKER)) throw new TtsSetupError(INSTALL_HINT);
      throw new Error(`Piper failed: ${failure.stderr?.trim() || failure.message}`);
    }
  }
}

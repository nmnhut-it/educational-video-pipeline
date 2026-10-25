/**
 * Audio helpers built on the ffmpeg / ffprobe that ship inside Remotion
 * (`remotion ffmpeg`, `remotion ffprobe`), so nothing extra has to be installed.
 * - measureAudioDurationMs: real length of a file, for any TTS engine (also catches
 *   trailing silence that character timestamps leave out)
 * - convertToMp3: engines that only write WAV (Piper) are converted, because the
 *   video loads public/audio/<slideId>.mp3
 */

import { execFile, execFileSync } from "child_process";
import * as path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const MS_PER_SECOND = 1000;
const REMOTION_CLI = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");
const FFPROBE_ARGS = ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0"];
/** 44.1 kHz, 128 kbps: the same MP3 format the ElevenLabs provider asks for */
const MP3_ARGS = ["-ar", "44100", "-b:a", "128k"];

/** Duration of an audio file in milliseconds */
export function measureAudioDurationMs(filePath: string): number {
  const output = execFileSync(process.execPath, [REMOTION_CLI, "ffprobe", ...FFPROBE_ARGS, filePath], {
    encoding: "utf-8",
  });
  const seconds = Number.parseFloat(output.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Could not read audio duration of ${filePath} (ffprobe said: ${output.trim()})`);
  }
  return Math.round(seconds * MS_PER_SECOND);
}

/** Converts any audio file ffmpeg can read into an MP3 at `outputPath` */
export async function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync(process.execPath, [
    REMOTION_CLI, "ffmpeg", "-y", "-v", "error", "-i", inputPath, ...MP3_ARGS, outputPath,
  ]);
}

/** Runs Remotion's bundled ffmpeg with the given arguments (used by tests to make fixtures) */
export function runFfmpeg(args: string[]): void {
  execFileSync(process.execPath, [REMOTION_CLI, "ffmpeg", ...args]);
}

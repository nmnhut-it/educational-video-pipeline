/**
 * Measures an audio file's real length with the ffprobe bundled in Remotion
 * (`remotion ffprobe`), so slide timing works for any TTS engine, including ones
 * that send no character timestamps. It also catches the trailing silence that
 * character timestamps leave out.
 * Input: absolute file path. Output: duration in milliseconds.
 */

import { execFileSync } from "child_process";
import * as path from "path";

const MS_PER_SECOND = 1000;
const REMOTION_CLI = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");
const FFPROBE_ARGS = ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0"];

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

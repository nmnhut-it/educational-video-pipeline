/**
 * Lists the voices of the TTS engine set in video.config.json → narration.provider,
 * to help choose the right voice ID.
 * Usage: npx tsx scripts/list-voices.ts
 */

import "dotenv/config";
import * as path from "path";
import { loadVideoConfig } from "../src/config-loader";
import { createTtsProvider, TtsSetupError } from "./tts";

async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  const config = loadVideoConfig(projectRoot);
  const provider = createTtsProvider(config.narration, projectRoot);
  const voices = await provider.listVoices();

  console.log(`Found ${voices.length} ${provider.id} voices:\n`);
  for (const voice of voices) {
    console.log(`  ${voice.name} (${voice.id})`);
    console.log(`    ${voice.details}`);
    console.log();
  }
}

main().catch((error) => {
  console.error(error instanceof TtsSetupError ? error.message : error);
  process.exit(1);
});

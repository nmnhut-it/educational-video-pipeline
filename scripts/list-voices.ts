/**
 * Lists available ElevenLabs voices to help choose the right voice ID.
 * Usage: npx tsx scripts/list-voices.ts
 */

import "dotenv/config";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    console.error("Set ELEVENLABS_API_KEY in .env");
    process.exit(1);
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const voices = data.voices as Array<{
    voice_id: string;
    name: string;
    labels: Record<string, string>;
    category: string;
  }>;

  console.log(`Found ${voices.length} voices:\n`);
  for (const voice of voices) {
    const labels = Object.entries(voice.labels || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`  ${voice.name} (${voice.voice_id})`);
    console.log(`    Category: ${voice.category} | ${labels}`);
    console.log();
  }
}

main().catch(console.error);

/**
 * Validates content/video-script.json (or the configured scriptPath) before audio
 * generation. Prints errors and warnings; exits 1 if there is any error.
 *
 * Usage: npx tsx scripts/validate-script.ts
 * Rules: src/script-validator.ts
 */

import * as fs from "fs";
import * as path from "path";
import { loadVideoConfig } from "../src/config-loader";
import { Severity, validateScript } from "../src/script-validator";
import type { VideoScript } from "../src/types";

const PUBLIC_DIR = "public";

/** Exact-case check: on Windows fs.existsSync("Slide1.png") also matches Slide1.PNG */
function existsWithExactCase(root: string, relativePath: string): boolean {
  let dir = root;
  for (const part of relativePath.split(/[\\/]/).filter(Boolean)) {
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

function main(): void {
  const projectRoot = path.resolve(__dirname, "..");
  const config = loadVideoConfig(projectRoot);
  const scriptPath = path.resolve(projectRoot, config.scriptPath);
  const script: VideoScript = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  const publicDir = path.join(projectRoot, PUBLIC_DIR);

  const issues = validateScript(script, (p) => existsWithExactCase(publicDir, p));
  for (const i of issues) {
    console.log(`${i.severity.toUpperCase()} ${i.slideId}: ${i.message}`);
  }
  const errors = issues.filter((i) => i.severity === Severity.ERROR).length;
  console.log(`\n${script.slides.length} slides, ${errors} errors, ${issues.length - errors} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

main();

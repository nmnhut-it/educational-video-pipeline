/**
 * Helpers for text inside SVG shapes. SVG <text> never wraps, so a long
 * label spills over its box and into its neighbours. fitFontSize() shrinks
 * the font until the label fits the box width (down to a floor).
 * Used by FlowChart.tsx, BoxDiagram.tsx and the script validator.
 */

/** Average glyph width as a share of font size; 0.6 covers Consolas and Courier New */
const MONO_CHAR_WIDTH_RATIO = 0.6;

/** Never shrink below this share of the requested size — stays readable at 1080p */
const MIN_FONT_SCALE = 0.6;

/** Estimated rendered width of `text` in a monospace font */
export function estimateTextWidth(text: string, fontSize: number): number {
  return [...text].length * fontSize * MONO_CHAR_WIDTH_RATIO;
}

/** Largest font size up to `baseSize` that fits `text` within `maxWidth` */
export function fitFontSize(text: string, maxWidth: number, baseSize: number): number {
  const width = estimateTextWidth(text, baseSize);
  if (width <= maxWidth) return baseSize;
  const scaled = baseSize * (maxWidth / width);
  return Math.max(scaled, baseSize * MIN_FONT_SCALE);
}

/** True if `text` still overflows `maxWidth` after shrinking to the smallest allowed size */
export function overflowsAtMinSize(text: string, maxWidth: number, baseSize: number): boolean {
  return estimateTextWidth(text, baseSize * MIN_FONT_SCALE) > maxWidth;
}

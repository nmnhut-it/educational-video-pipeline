/** Video resolution and frame rate */
export const VIDEO = {
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 30,
} as const;

import type { ThemeId } from "./types";

/** Color palette keys shared by light and dark themes */
export interface ThemeColors {
  BG_PRIMARY: string;
  BG_SECONDARY: string;
  BG_TERTIARY: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  ACCENT_BLUE: string;
  ACCENT_GREEN: string;
  ACCENT_ORANGE: string;
  ACCENT_RED: string;
  ACCENT_PURPLE: string;
  BORDER: string;
  CODE_BG: string;
}

/** Light theme colors (default) */
export const COLORS: ThemeColors = {
  BG_PRIMARY: "#ffffff",
  BG_SECONDARY: "#f6f8fa",
  BG_TERTIARY: "#eaeef2",
  TEXT_PRIMARY: "#1f2328",
  TEXT_SECONDARY: "#59636e",
  TEXT_MUTED: "#8b949e",
  ACCENT_BLUE: "#0969da",
  ACCENT_GREEN: "#1a7f37",
  ACCENT_ORANGE: "#bf8700",
  ACCENT_RED: "#d1242f",
  ACCENT_PURPLE: "#8250df",
  BORDER: "#d1d9e0",
  CODE_BG: "#f6f8fa",
};

/** Dark theme colors */
export const DARK_COLORS: ThemeColors = {
  BG_PRIMARY: "#0d1117",
  BG_SECONDARY: "#161b22",
  BG_TERTIARY: "#21262d",
  TEXT_PRIMARY: "#e6edf3",
  TEXT_SECONDARY: "#8b949e",
  TEXT_MUTED: "#6e7681",
  ACCENT_BLUE: "#58a6ff",
  ACCENT_GREEN: "#3fb950",
  ACCENT_ORANGE: "#d29922",
  ACCENT_RED: "#f85149",
  ACCENT_PURPLE: "#bc8cff",
  BORDER: "#30363d",
  CODE_BG: "#161b22",
};

/** Resolve theme colors by ID; defaults to light */
export function getThemeColors(theme: ThemeId = "light"): ThemeColors {
  return theme === "dark" ? DARK_COLORS : COLORS;
}

/** Font families */
export const FONTS = {
  CODE: "'Consolas', 'Courier New', monospace",
  HEADING: "'Consolas', 'Segoe UI', sans-serif",
  BODY: "'Consolas', 'Segoe UI', sans-serif",
} as const;

/** Slide padding and layout */
export const LAYOUT = {
  /** Horizontal padding inside slides */
  PADDING_X: 100,
  /** Vertical padding inside slides */
  PADDING_Y: 70,
  /** Progress bar height in pixels */
  PROGRESS_BAR_HEIGHT: 5,
  /** Max width for content area */
  CONTENT_MAX_WIDTH: 1720,
} as const;

/** Timing defaults in frames (at 30fps) */
export const TIMING = {
  /** Default slide duration when no audio available */
  DEFAULT_SLIDE_FRAMES: 150,
  /** Fade transition duration between major sections */
  SECTION_FADE_FRAMES: 15,
  /** Delay before bullet items appear (staggered) */
  BULLET_STAGGER_FRAMES: 8,
  /** Code line reveal stagger */
  CODE_LINE_STAGGER_FRAMES: 4,
  /** Padding frames added after audio ends */
  AUDIO_TAIL_PADDING_FRAMES: 15,
} as const;

/** Font sizes in pixels — 1.5x scale for readability */
export const FONT_SIZES = {
  TITLE: 114,
  SUBTITLE: 63,
  SECTION_HEADER: 102,
  SECTION_TAGLINE: 57,
  HEADING: 81,
  BODY: 54,
  CODE: 48,
  CAPTION: 48,
  TABLE_HEADER: 54,
  TABLE_CELL: 51,
  STAGE_NUMBER: 210,
  /** Chart/diagram label sizes */
  CHART_LABEL: 33,
  CHART_SUBLABEL: 27,
} as const;

/** Video resolution and frame rate */
export const VIDEO = {
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 30,
} as const;

import type { ThemeId, VideoConfig } from "./types";
import videoConfig from "../video.config.json";

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
  /** Text drawn on top of an accent-filled shape (e.g. an active flow node) */
  TEXT_ON_ACCENT: string;
  /** Secondary text on top of an accent-filled shape */
  TEXT_ON_ACCENT_MUTED: string;
  /** Letterbox colour behind full-screen images */
  IMAGE_BACKDROP: string;
}

/** Light theme colors (default) */
export const LIGHT_COLORS: ThemeColors = {
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
  TEXT_ON_ACCENT: "#ffffff",
  TEXT_ON_ACCENT_MUTED: "rgba(255,255,255,0.7)",
  IMAGE_BACKDROP: "#000000",
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
  TEXT_ON_ACCENT: "#0d1117",
  TEXT_ON_ACCENT_MUTED: "rgba(13,17,23,0.7)",
  IMAGE_BACKDROP: "#000000",
};

/** Resolve theme colors by ID; defaults to light */
export function getThemeColors(theme: ThemeId = "light"): ThemeColors {
  return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * Active palette, chosen from `theme` in video.config.json when the bundle is built.
 * The Remotion bundle runs in a browser, so it imports the JSON instead of
 * calling the fs-based loadVideoConfig(). Every component imports this.
 */
export const COLORS: ThemeColors = getThemeColors(
  (videoConfig as Partial<VideoConfig>).theme
);

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

/** Box sizes for SVG charts; the script validator uses them to flag labels too long to fit */
export const CHART_LAYOUT = {
  FLOW_NODE_WIDTH: 280,
  FLOW_TEXT_INSET_X: 14,
  DIAGRAM_BOX_WIDTH: 320,
  DIAGRAM_TEXT_INSET_X: 16,
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

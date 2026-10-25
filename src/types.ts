/** Slide type determines which component renders the slide */
export enum SlideType {
  TITLE = "title",
  SECTION_HEADER = "section-header",
  CONCEPT = "concept",
  CODE = "code",
  DIAGRAM = "diagram",
  FLOW = "flow",
  TABLE = "table",
  OUTRO = "outro",
  /** Full-screen image slide — used when source is a PPTX/image export */
  IMAGE = "image",
}

/** Base fields shared by all slides */
interface SlideBase {
  id: string;
  type: SlideType;
  /** Section name for progress tracking and transitions */
  section: string;
  /** Narration text for this slide, in the language set in video.config.json */
  narration: string;
}

export interface TitleSlideData extends SlideBase {
  type: SlideType.TITLE;
  title: string;
  subtitle: string;
}

export interface SectionHeaderSlideData extends SlideBase {
  type: SlideType.SECTION_HEADER;
  /** Section number displayed as "Stage X" */
  stageNumber: number;
  heading: string;
  tagline: string;
}

export interface ConceptSlideData extends SlideBase {
  type: SlideType.CONCEPT;
  heading: string;
  bullets: string[];
  /** Optional highlighted quote */
  highlight?: string;
  /** Optional visual: inline flow diagram to show alongside bullets */
  flow?: FlowNode[];
}

export interface CodeSlideData extends SlideBase {
  type: SlideType.CODE;
  heading: string;
  language: string;
  code: string;
  /** Optional caption below the code block */
  caption?: string;
}

/** Node in a flowchart/architecture diagram */
export interface DiagramNode {
  id: string;
  label: string;
  /** Optional sub-labels inside the box */
  sublabels?: string[];
  /** Row position (top=0, middle=1, bottom=2) */
  row: number;
  /** Column position within the row */
  col: number;
  /** Accent color key from COLORS */
  color?: "blue" | "green" | "orange" | "purple" | "red";
}

/** Arrow connecting two diagram nodes */
export interface DiagramEdge {
  from: string;
  to: string;
  /** Optional label on the arrow */
  label?: string;
}

export interface DiagramSlideData extends SlideBase {
  type: SlideType.DIAGRAM;
  heading: string;
  /** Structured nodes for SVG rendering */
  nodes: DiagramNode[];
  /** Connections between nodes */
  edges: DiagramEdge[];
  /** Legacy ASCII fallback */
  diagramLines?: string[];
}

/** Node in a horizontal flow/timeline */
export interface FlowNode {
  label: string;
  /** Optional short description below the label */
  description?: string;
  /** Whether this node is highlighted as the "current" focus */
  active?: boolean;
}

export interface FlowSlideData extends SlideBase {
  type: SlideType.FLOW;
  heading: string;
  /** Ordered flow nodes connected by arrows */
  nodes: FlowNode[];
  /** Optional summary line below the flow */
  summary?: string;
}

export interface TableSlideData extends SlideBase {
  type: SlideType.TABLE;
  heading: string;
  headers: string[];
  rows: string[][];
}

export interface OutroSlideData extends SlideBase {
  type: SlideType.OUTRO;
  title: string;
  message: string;
  /** Evolution summary line */
  evolutionLine: string;
}

/** Full-screen image slide — displays a PNG/JPG file with a progress bar overlay */
export interface ImageSlideData extends SlideBase {
  type: SlideType.IMAGE;
  /** Path relative to public/ — Remotion's staticFile() resolves it. E.g. "pptx-slides/Slide1.PNG" */
  imagePath: string;
}

/** Union of all slide data types */
export type SlideData =
  | TitleSlideData
  | SectionHeaderSlideData
  | ConceptSlideData
  | CodeSlideData
  | DiagramSlideData
  | FlowSlideData
  | TableSlideData
  | OutroSlideData
  | ImageSlideData;

/** Full video script containing all slides */
export interface VideoScript {
  title: string;
  slides: SlideData[];
}

/** Supported theme identifiers */
export type ThemeId = "light" | "dark";

/** Text-to-speech engines that scripts/tts/ can drive. Add one value per provider file. */
export enum TtsProviderId {
  /** ElevenLabs cloud API */
  ELEVENLABS = "elevenlabs",
  /** Any server with POST /v1/audio/speech: VieNeu-TTS, Kokoro-FastAPI, LocalAI, OpenAI */
  OPENAI_COMPATIBLE = "openai-compatible",
  /** Piper, fully offline on CPU (pip install piper-tts) */
  PIPER = "piper",
}

/** Settings for TtsProviderId.OPENAI_COMPATIBLE */
export interface OpenAiCompatibleConfig {
  /** Server base URL including /v1, e.g. http://localhost:8000/v1 for VieNeu-TTS */
  baseUrl: string;
  /** Model name sent to the server ("tts-1" is accepted or ignored by most local servers) */
  model: string;
  /** Name of the .env variable holding the API key; local servers usually need none */
  apiKeyEnv: string;
  /** Speaking speed, 1.0 = normal */
  speed: number;
}

/** Settings for TtsProviderId.PIPER */
export interface PiperConfig {
  /** Python executable that has piper-tts installed */
  python: string;
  /** Folder with downloaded voices (*.onnx + *.onnx.json), relative to the project root */
  dataDir: string;
}

/** Narration settings for audio generation */
export interface NarrationConfig {
  /** Which text-to-speech engine to use (default: elevenlabs) */
  provider: TtsProviderId;
  /** Language code (e.g., "vi", "en") */
  language: string;
  /** Voice in the chosen provider: ElevenLabs voice ID, server voice name, or Piper voice name */
  voiceId: string;
  /** ElevenLabs model ID (other providers keep their model in their own section) */
  modelId: string;
  /** ElevenLabs voice settings (other providers ignore them) */
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
  };
  /** Used when provider is "openai-compatible" */
  openaiCompatible: OpenAiCompatibleConfig;
  /** Used when provider is "piper" */
  piper: PiperConfig;
}

/** Per-video configuration loaded from video.config.json */
export interface VideoConfig {
  /** Narration language and voice settings */
  narration: NarrationConfig;
  /** Color theme */
  theme: ThemeId;
  /** Path to video-script.json relative to project root */
  scriptPath: string;
  /** Output directory for rendered video */
  outputPath: string;
  /** Audio output directory relative to project root */
  audioDir: string;
}

/** Per-slide audio timing written by generate-audio.ts */
export interface SlideAudioTiming {
  slideId: string;
  durationMs: number;
  /** sha256 of the text + voice settings; generate-audio.ts reuses the MP3 while it matches */
  sourceHash?: string;
  /** Character-level timestamps for animated text sync */
  characters?: Array<{
    character: string;
    startMs: number;
    endMs: number;
  }>;
}

/** Audio manifest aggregating all slide timings */
export interface AudioManifest {
  generatedAt: string;
  /** TTS engine that made the audio */
  provider: TtsProviderId;
  /** voiceId from video.config.json; empty when the provider took it from .env */
  voiceId: string;
  totalDurationMs: number;
  slides: SlideAudioTiming[];
}

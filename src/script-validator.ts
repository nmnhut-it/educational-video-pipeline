/**
 * Checks a video script before audio is generated (audio costs ElevenLabs credits).
 * Pure logic: file lookups go through the `fileExists` callback so tests need no disk.
 * CLI wrapper: scripts/validate-script.ts. Rules mirror the skill's quality checklist.
 *
 * Errors break the render or the layout (bad image path, ragged table, edge to a
 * missing node). Warnings are style limits (too many flow nodes, long code, labels
 * that will not fit their box).
 */

import { CHART_LAYOUT, FONT_SIZES } from "./constants";
import { overflowsAtMinSize } from "./components/svg-text";
import { SlideType } from "./types";
import type { DiagramSlideData, FlowNode, SlideData, VideoScript } from "./types";

export enum Severity {
  ERROR = "error",
  WARNING = "warning",
}

export interface ValidationIssue {
  severity: Severity;
  slideId: string;
  message: string;
}

/** Returns true if a path relative to public/ exists with this exact letter case */
export type FileExists = (publicRelativePath: string) => boolean;

const SLIDE_ID_PATTERN = /^slide-\d{2,}$/;
const SCRIPT_LEVEL_ID = "(script)";
export const LIMITS = {
  MAX_CODE_LINES: 15,
  MIN_FLOW_NODES: 3,
  MAX_FLOW_NODES: 5,
  MAX_DIAGRAM_ROWS: 3,
  MAX_DIAGRAM_COLS: 4,
} as const;

const FLOW_TEXT_WIDTH = CHART_LAYOUT.FLOW_NODE_WIDTH - CHART_LAYOUT.FLOW_TEXT_INSET_X * 2;
const DIAGRAM_TEXT_WIDTH = CHART_LAYOUT.DIAGRAM_BOX_WIDTH - CHART_LAYOUT.DIAGRAM_TEXT_INSET_X * 2;
const KNOWN_TYPES = new Set<string>(Object.values(SlideType));

/** All issues in the script, in slide order */
export function validateScript(script: VideoScript, fileExists: FileExists): ValidationIssue[] {
  if (!Array.isArray(script.slides) || script.slides.length === 0) {
    return [issue(Severity.ERROR, SCRIPT_LEVEL_ID, "script has no slides")];
  }
  return [
    ...checkIds(script.slides),
    ...checkOrder(script.slides),
    ...script.slides.flatMap((slide) => checkSlide(slide, fileExists)),
  ];
}

function issue(severity: Severity, slideId: string, message: string): ValidationIssue {
  return { severity, slideId, message };
}

/** IDs must be unique and look like slide-01; audio files are named after them */
function checkIds(slides: SlideData[]): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const slide of slides) {
    if (!SLIDE_ID_PATTERN.test(slide.id ?? "")) {
      issues.push(issue(Severity.ERROR, String(slide.id), "id must look like slide-01"));
    }
    if (seen.has(slide.id)) issues.push(issue(Severity.ERROR, slide.id, "duplicate id"));
    seen.add(slide.id);
  }
  return issues;
}

/** Title first, outro last, section numbers counting up */
function checkOrder(slides: SlideData[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const first = slides[0];
  const last = slides[slides.length - 1];
  if (first.type !== SlideType.TITLE && first.type !== SlideType.IMAGE) {
    issues.push(issue(Severity.WARNING, first.id, "first slide is usually a title slide"));
  }
  if (last.type !== SlideType.OUTRO && last.type !== SlideType.IMAGE) {
    issues.push(issue(Severity.WARNING, last.id, "last slide is usually an outro slide"));
  }
  let previousStage = 0;
  for (const slide of slides) {
    if (slide.type !== SlideType.SECTION_HEADER) continue;
    if (slide.stageNumber !== previousStage + 1) {
      issues.push(issue(Severity.WARNING, slide.id, `stageNumber ${slide.stageNumber}, expected ${previousStage + 1}`));
    }
    previousStage = slide.stageNumber;
  }
  return issues;
}

function checkSlide(slide: SlideData, fileExists: FileExists): ValidationIssue[] {
  if (!KNOWN_TYPES.has(slide.type)) {
    return [issue(Severity.ERROR, slide.id, `unknown type "${slide.type}"`)];
  }
  const issues: ValidationIssue[] = [];
  if (!slide.narration?.trim()) {
    issues.push(issue(Severity.WARNING, slide.id, "empty narration: slide will be silent"));
  }
  return [...issues, ...checkSlideContent(slide, fileExists)];
}

/** Type-specific checks */
function checkSlideContent(slide: SlideData, fileExists: FileExists): ValidationIssue[] {
  switch (slide.type) {
    case SlideType.TABLE:
      return slide.rows
        .map((row, i) => ({ row, i }))
        .filter(({ row }) => row.length !== slide.headers.length)
        .map(({ row, i }) => issue(Severity.ERROR, slide.id,
          `row ${i + 1} has ${row.length} cells, headers have ${slide.headers.length}`));
    case SlideType.CODE: {
      const lines = slide.code.split("\n").length;
      return lines > LIMITS.MAX_CODE_LINES
        ? [issue(Severity.WARNING, slide.id, `${lines} code lines (max ${LIMITS.MAX_CODE_LINES}); bottom lines may be cut off`)]
        : [];
    }
    case SlideType.FLOW:
      return checkFlowNodes(slide.id, slide.nodes);
    case SlideType.CONCEPT:
      return slide.flow?.length ? checkFlowNodes(slide.id, slide.flow) : [];
    case SlideType.DIAGRAM:
      return checkDiagram(slide);
    case SlideType.IMAGE:
      return fileExists(slide.imagePath)
        ? []
        : [issue(Severity.ERROR, slide.id, `image not found under public/: ${slide.imagePath} (check letter case)`)];
    default:
      return [];
  }
}

function checkFlowNodes(slideId: string, nodes: FlowNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (nodes.length < LIMITS.MIN_FLOW_NODES || nodes.length > LIMITS.MAX_FLOW_NODES) {
    issues.push(issue(Severity.WARNING, slideId,
      `${nodes.length} flow nodes (use ${LIMITS.MIN_FLOW_NODES}-${LIMITS.MAX_FLOW_NODES})`));
  }
  for (const node of nodes) {
    if (overflowsAtMinSize(node.label, FLOW_TEXT_WIDTH, FONT_SIZES.CHART_LABEL)) {
      issues.push(issue(Severity.WARNING, slideId, `flow label too long to fit: "${node.label}"`));
    }
    if (node.description && overflowsAtMinSize(node.description, FLOW_TEXT_WIDTH, FONT_SIZES.CHART_SUBLABEL)) {
      issues.push(issue(Severity.WARNING, slideId, `flow description too long to fit: "${node.description}"`));
    }
  }
  return issues;
}

function checkDiagram(slide: DiagramSlideData): ValidationIssue[] {
  const nodes = slide.nodes ?? [];
  if (nodes.length === 0) {
    return slide.diagramLines?.length ? [] : [issue(Severity.ERROR, slide.id, "diagram has no nodes")];
  }
  const ids = new Set(nodes.map((n) => n.id));
  const cells = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const node of nodes) {
    const cell = `${node.row},${node.col}`;
    if (cells.has(cell)) issues.push(issue(Severity.ERROR, slide.id, `two nodes share row ${node.row}, col ${node.col}`));
    cells.add(cell);
    if (node.row >= LIMITS.MAX_DIAGRAM_ROWS || node.col >= LIMITS.MAX_DIAGRAM_COLS) {
      issues.push(issue(Severity.WARNING, slide.id, `node "${node.id}" is outside the ${LIMITS.MAX_DIAGRAM_ROWS}x${LIMITS.MAX_DIAGRAM_COLS} grid`));
    }
    const texts = [node.label, ...(node.sublabels ?? [])];
    if (texts.some((t, i) => overflowsAtMinSize(t, DIAGRAM_TEXT_WIDTH, i === 0 ? FONT_SIZES.CHART_LABEL : FONT_SIZES.CHART_SUBLABEL))) {
      issues.push(issue(Severity.WARNING, slide.id, `text in node "${node.id}" too long to fit`));
    }
  }
  for (const edge of slide.edges ?? []) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      issues.push(issue(Severity.ERROR, slide.id, `edge ${edge.from} -> ${edge.to} points at a missing node`));
    }
  }
  return issues;
}

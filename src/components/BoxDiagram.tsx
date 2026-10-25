import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { CHART_LAYOUT, COLORS, FONTS, FONT_SIZES } from "../constants";
import type { DiagramNode, DiagramEdge } from "../types";
import { estimateTextWidth, fitFontSize } from "./svg-text";

interface BoxDiagramProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const BOX_W = CHART_LAYOUT.DIAGRAM_BOX_WIDTH;
/** Height of a box with a label and no sub-labels; each sub-label adds one line */
const BOX_BASE_H = 72;
const SUBLABEL_LINE_H = 34;
const COL_GAP = 50;
const ROW_GAP = 110;
const PADDING_X = 50;
const PADDING_Y = 40;
const LABEL_BASELINE = 42;
const SUBLABEL_BASELINE = 74;
const ARROW_HEAD = 10;
/** Edge labels sit this far along the arrow, so fanned-out labels spread apart */
const EDGE_LABEL_POSITION = 0.6;
/** Padding of the background box that hides the arrow behind an edge label */
const EDGE_LABEL_PAD_X = 8;
const EDGE_LABEL_HEIGHT_RATIO = 1.3;

const ACCENT_MAP: Record<NonNullable<DiagramNode["color"]>, string> = {
  blue: COLORS.ACCENT_BLUE,
  green: COLORS.ACCENT_GREEN,
  orange: COLORS.ACCENT_ORANGE,
  purple: COLORS.ACCENT_PURPLE,
  red: COLORS.ACCENT_RED,
};

/** Placed box in SVG coordinates */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * SVG architecture diagram with boxes, sub-labels, and connecting arrows.
 * Each row is as tall as its tallest box, so sub-labels never spill out of
 * the canvas. Arrows leave from the side that faces the target box.
 */
export const BoxDiagram: React.FC<BoxDiagramProps> = ({ nodes, edges }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { boxes, width, height } = layoutBoxes(nodes);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: 1600 }}>
      {edges.map((edge, i) => (
        <AnimatedEdge key={`edge-${i}`} edge={edge} boxes={boxes} frame={frame} fps={fps} index={i} />
      ))}
      {nodes.map((node, i) => (
        <AnimatedNode key={node.id} node={node} box={boxes.get(node.id)!} frame={frame} fps={fps} index={i} />
      ))}
    </svg>
  );
};

/** Grid layout: column width is fixed, row height fits the most sub-labels in that row */
function layoutBoxes(nodes: DiagramNode[]): { boxes: Map<string, Box>; width: number; height: number } {
  const rowCount = Math.max(...nodes.map((n) => n.row)) + 1;
  const colCount = Math.max(...nodes.map((n) => n.col)) + 1;
  const rowHeights = Array.from({ length: rowCount }, (_, row) => {
    const counts = nodes.filter((n) => n.row === row).map((n) => n.sublabels?.length ?? 0);
    return BOX_BASE_H + Math.max(0, ...counts) * SUBLABEL_LINE_H;
  });
  const rowTops: number[] = [];
  rowHeights.reduce((top, h, row) => {
    rowTops[row] = top;
    return top + h + ROW_GAP;
  }, PADDING_Y);

  const boxes = new Map<string, Box>();
  nodes.forEach((node) => {
    const x = PADDING_X + node.col * (BOX_W + COL_GAP);
    boxes.set(node.id, { x, y: rowTops[node.row], w: BOX_W, h: rowHeights[node.row], row: node.row });
  });

  const width = PADDING_X * 2 + colCount * BOX_W + (colCount - 1) * COL_GAP;
  const height = PADDING_Y * 2 + rowHeights.reduce((s, h) => s + h, 0) + (rowCount - 1) * ROW_GAP;
  return { boxes, width, height };
}

/** Start and end points of an arrow, on the facing sides of the two boxes */
function edgeAnchors(from: Box, to: Box): { start: Point; end: Point } {
  const fromCx = from.x + from.w / 2;
  const toCx = to.x + to.w / 2;
  if (to.row > from.row) {
    return { start: { x: fromCx, y: from.y + from.h }, end: { x: toCx, y: to.y } };
  }
  if (to.row < from.row) {
    return { start: { x: fromCx, y: from.y }, end: { x: toCx, y: to.y + to.h } };
  }
  const midY = from.y + from.h / 2;
  const goesRight = to.x > from.x;
  return {
    start: { x: goesRight ? from.x + from.w : from.x, y: midY },
    end: { x: goesRight ? to.x : to.x + to.w, y: midY },
  };
}

/** Triangle points for an arrow head whose tip is at `tip`, pointing away from `tail` */
function arrowHeadPoints(tail: Point, tip: Point): string {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const back = (offset: number): Point => ({
    x: tip.x - ARROW_HEAD * Math.cos(angle + offset),
    y: tip.y - ARROW_HEAD * Math.sin(angle + offset),
  });
  const left = back(Math.PI / 6);
  const right = back(-Math.PI / 6);
  return `${left.x},${left.y} ${tip.x},${tip.y} ${right.x},${right.y}`;
}

const AnimatedNode: React.FC<{
  node: DiagramNode;
  box: Box;
  frame: number;
  fps: number;
  index: number;
}> = ({ node, box, frame, fps, index }) => {
  const delay = 3 + index * 4;
  const progress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 80 } });
  const accent = ACCENT_MAP[node.color ?? "blue"] ?? COLORS.ACCENT_BLUE;
  const cx = box.x + box.w / 2;
  const textWidth = box.w - CHART_LAYOUT.DIAGRAM_TEXT_INSET_X * 2;

  return (
    <g opacity={progress} transform={`translate(0, ${(1 - progress) * 12})`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12}
        fill={COLORS.BG_SECONDARY} stroke={accent} strokeWidth={2.5} />
      <text x={cx} y={box.y + LABEL_BASELINE} textAnchor="middle" fill={accent}
        fontFamily={FONTS.CODE} fontWeight={700}
        fontSize={fitFontSize(node.label, textWidth, FONT_SIZES.CHART_LABEL)}>
        {node.label}
      </text>
      {node.sublabels?.map((sub, si) => (
        <text key={si} x={cx} y={box.y + SUBLABEL_BASELINE + si * SUBLABEL_LINE_H}
          textAnchor="middle" fill={COLORS.TEXT_SECONDARY} fontFamily={FONTS.BODY}
          fontSize={fitFontSize(sub, textWidth, FONT_SIZES.CHART_SUBLABEL)}>
          {sub}
        </text>
      ))}
    </g>
  );
};

const AnimatedEdge: React.FC<{
  edge: DiagramEdge;
  boxes: Map<string, Box>;
  frame: number;
  fps: number;
  index: number;
}> = ({ edge, boxes, frame, fps, index }) => {
  const from = boxes.get(edge.from);
  const to = boxes.get(edge.to);
  if (!from || !to) return null;

  const delay = 8 + index * 3;
  const progress = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } });
  const { start, end } = edgeAnchors(from, to);
  const labelX = start.x + (end.x - start.x) * EDGE_LABEL_POSITION;
  const labelY = start.y + (end.y - start.y) * EDGE_LABEL_POSITION;

  return (
    <g opacity={progress}>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={COLORS.ACCENT_BLUE} strokeWidth={2.5} strokeDasharray="8,4" />
      <polygon points={arrowHeadPoints(start, end)} fill={COLORS.ACCENT_BLUE} />
      {edge.label && <EdgeLabel text={edge.label} x={labelX} y={labelY} />}
    </g>
  );
};

/** Edge label centred on (x, y) over a background box, so the arrow does not cross the text */
const EdgeLabel: React.FC<{ text: string; x: number; y: number }> = ({ text, x, y }) => {
  const fontSize = FONT_SIZES.CHART_SUBLABEL;
  const width = estimateTextWidth(text, fontSize) + EDGE_LABEL_PAD_X * 2;
  const height = fontSize * EDGE_LABEL_HEIGHT_RATIO;
  return (
    <>
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={4} fill={COLORS.BG_PRIMARY} />
      <text x={x} y={y} fill={COLORS.TEXT_MUTED} fontFamily={FONTS.CODE}
        fontSize={fontSize} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </>
  );
};

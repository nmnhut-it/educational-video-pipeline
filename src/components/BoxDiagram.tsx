import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import type { DiagramNode, DiagramEdge } from "../types";

interface BoxDiagramProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const BOX_W = 320;
const BOX_H = 120;
const SUBLABEL_LINE_H = 34;
const COL_GAP = 50;
const ROW_GAP = 110;
const PADDING_X = 50;
const PADDING_Y = 40;

const ACCENT_MAP: Record<string, string> = {
  blue: COLORS.ACCENT_BLUE,
  green: COLORS.ACCENT_GREEN,
  orange: COLORS.ACCENT_ORANGE,
  purple: COLORS.ACCENT_PURPLE,
  red: COLORS.ACCENT_RED,
};

/** SVG architecture diagram with boxes, sub-labels, and connecting arrows */
export const BoxDiagram: React.FC<BoxDiagramProps> = ({ nodes, edges }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxRow = Math.max(...nodes.map((n) => n.row));
  const maxCol = Math.max(...nodes.map((n) => n.col));

  const svgW = PADDING_X * 2 + (maxCol + 1) * BOX_W + maxCol * COL_GAP;
  const svgH = PADDING_Y * 2 + (maxRow + 1) * BOX_H + maxRow * ROW_GAP;

  const positions = new Map<string, { cx: number; cy: number }>();
  nodes.forEach((node) => {
    const cx = PADDING_X + node.col * (BOX_W + COL_GAP) + BOX_W / 2;
    const cy = PADDING_Y + node.row * (BOX_H + ROW_GAP) + BOX_H / 2;
    positions.set(node.id, { cx, cy });
  });

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: 1600 }}>
      {edges.map((edge, i) => (
        <AnimatedEdge
          key={`edge-${i}`}
          edge={edge}
          positions={positions}
          frame={frame}
          fps={fps}
          index={i}
        />
      ))}
      {nodes.map((node, i) => (
        <AnimatedNode
          key={node.id}
          node={node}
          frame={frame}
          fps={fps}
          index={i}
          position={positions.get(node.id)!}
        />
      ))}
    </svg>
  );
};

const AnimatedNode: React.FC<{
  node: DiagramNode;
  frame: number;
  fps: number;
  index: number;
  position: { cx: number; cy: number };
}> = ({ node, frame, fps, index, position }) => {
  const delay = 3 + index * 4;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const accent = ACCENT_MAP[node.color || "blue"] || COLORS.ACCENT_BLUE;
  const x = position.cx - BOX_W / 2;
  const y = position.cy - BOX_H / 2;
  const sublabelCount = node.sublabels?.length || 0;
  const boxH = BOX_H + sublabelCount * SUBLABEL_LINE_H;

  return (
    <g opacity={progress} transform={`translate(0, ${(1 - progress) * 12})`}>
      <rect
        x={x} y={y}
        width={BOX_W} height={boxH}
        rx={12}
        fill={COLORS.BG_SECONDARY}
        stroke={accent}
        strokeWidth={2.5}
      />
      <text
        x={position.cx}
        y={y + 42}
        textAnchor="middle"
        fill={accent}
        fontFamily={FONTS.CODE}
        fontSize={FONT_SIZES.CHART_LABEL}
        fontWeight={700}
      >
        {node.label}
      </text>
      {node.sublabels?.map((sub, si) => (
        <text
          key={si}
          x={position.cx}
          y={y + 74 + si * SUBLABEL_LINE_H}
          textAnchor="middle"
          fill={COLORS.TEXT_SECONDARY}
          fontFamily={FONTS.BODY}
          fontSize={FONT_SIZES.CHART_SUBLABEL}
        >
          {sub}
        </text>
      ))}
    </g>
  );
};

const AnimatedEdge: React.FC<{
  edge: DiagramEdge;
  positions: Map<string, { cx: number; cy: number }>;
  frame: number;
  fps: number;
  index: number;
}> = ({ edge, positions, frame, fps, index }) => {
  const from = positions.get(edge.from);
  const to = positions.get(edge.to);
  if (!from || !to) return null;

  const delay = 8 + index * 3;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const y1 = from.cy + BOX_H / 2;
  const y2 = to.cy - BOX_H / 2;

  return (
    <g opacity={progress}>
      <line
        x1={from.cx} y1={y1 + 2}
        x2={to.cx} y2={y2 - 10}
        stroke={COLORS.ACCENT_BLUE}
        strokeWidth={2.5}
        strokeDasharray="8,4"
      />
      <polygon
        points={`${to.cx - 6},${y2 - 10} ${to.cx},${y2} ${to.cx + 6},${y2 - 10}`}
        fill={COLORS.ACCENT_BLUE}
      />
      {edge.label && (
        <text
          x={(from.cx + to.cx) / 2 + 10}
          y={(y1 + y2) / 2}
          fill={COLORS.TEXT_MUTED}
          fontFamily={FONTS.CODE}
          fontSize={FONT_SIZES.CHART_SUBLABEL}
          textAnchor="start"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
};

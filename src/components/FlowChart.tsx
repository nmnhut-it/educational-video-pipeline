import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import type { FlowNode } from "../types";

interface FlowChartProps {
  nodes: FlowNode[];
  /** Optional summary text below the flow */
  summary?: string;
}

const NODE_WIDTH = 280;
const NODE_HEIGHT = 100;
const NODE_GAP = 30;
const ARROW_WIDTH = 40;

/** Horizontal flow diagram with animated nodes and connecting arrows */
export const FlowChart: React.FC<FlowChartProps> = ({ nodes, summary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalWidth =
    nodes.length * NODE_WIDTH + (nodes.length - 1) * (NODE_GAP + ARROW_WIDTH);
  const svgWidth = Math.max(totalWidth + 60, 800);
  const svgHeight = nodes[0]?.description ? 160 : 120;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ maxWidth: 1600 }}
      >
        {nodes.map((node, i) => (
          <FlowNode
            key={i}
            node={node}
            index={i}
            x={30 + i * (NODE_WIDTH + NODE_GAP + ARROW_WIDTH)}
            y={15}
            isLast={i === nodes.length - 1}
            frame={frame}
            fps={fps}
          />
        ))}
      </svg>
      {summary && (
        <p
          style={{
            marginTop: 20,
            fontSize: FONT_SIZES.CAPTION,
            color: COLORS.TEXT_SECONDARY,
            fontFamily: FONTS.CODE,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {summary}
        </p>
      )}
    </div>
  );
};

const FlowNode: React.FC<{
  node: FlowNode;
  index: number;
  x: number;
  y: number;
  isLast: boolean;
  frame: number;
  fps: number;
}> = ({ node, index, x, y, isLast, frame, fps }) => {
  const delay = index * 5;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const nodeColor = node.active ? COLORS.ACCENT_BLUE : COLORS.BG_TERTIARY;
  const borderColor = node.active ? COLORS.ACCENT_BLUE : COLORS.BORDER;
  const textColor = node.active ? "#ffffff" : COLORS.TEXT_PRIMARY;

  return (
    <g opacity={progress}>
      <rect
        x={x} y={y}
        width={NODE_WIDTH} height={NODE_HEIGHT}
        rx={10}
        fill={nodeColor}
        stroke={borderColor}
        strokeWidth={2.5}
      />
      <text
        x={x + NODE_WIDTH / 2}
        y={y + NODE_HEIGHT / 2 + (node.description ? -6 : 7)}
        textAnchor="middle"
        fill={textColor}
        fontFamily={FONTS.CODE}
        fontSize={FONT_SIZES.CHART_LABEL}
        fontWeight={700}
      >
        {node.label}
      </text>
      {node.description && (
        <text
          x={x + NODE_WIDTH / 2}
          y={y + NODE_HEIGHT / 2 + 18}
          textAnchor="middle"
          fill={node.active ? "rgba(255,255,255,0.7)" : COLORS.TEXT_SECONDARY}
          fontFamily={FONTS.BODY}
          fontSize={FONT_SIZES.CHART_SUBLABEL}
        >
          {node.description}
        </text>
      )}
      {!isLast && (
        <FlowArrow
          x1={x + NODE_WIDTH}
          x2={x + NODE_WIDTH + NODE_GAP + ARROW_WIDTH}
          y={y + NODE_HEIGHT / 2}
          frame={frame}
          delay={delay + 3}
          fps={fps}
        />
      )}
    </g>
  );
};

const FlowArrow: React.FC<{
  x1: number;
  x2: number;
  y: number;
  frame: number;
  delay: number;
  fps: number;
}> = ({ x1, x2, y, frame, delay, fps }) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  return (
    <g opacity={progress}>
      <line
        x1={x1 + 4} y1={y}
        x2={x2 - 10} y2={y}
        stroke={COLORS.ACCENT_BLUE}
        strokeWidth={2.5}
      />
      <polygon
        points={`${x2 - 10},${y - 6} ${x2},${y} ${x2 - 10},${y + 6}`}
        fill={COLORS.ACCENT_BLUE}
      />
    </g>
  );
};

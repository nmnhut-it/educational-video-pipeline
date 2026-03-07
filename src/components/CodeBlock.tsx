import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONTS, FONT_SIZES, TIMING } from "../constants";

interface CodeBlockProps {
  code: string;
  language: string;
  /** Optional caption displayed below the code */
  caption?: string;
}

/**
 * Syntax-highlighted code block with line-by-line reveal.
 * Uses inline styling instead of react-syntax-highlighter
 * for Remotion compatibility (no DOM-dependent highlighting).
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  caption,
}) => {
  const frame = useCurrentFrame();
  const lines = code.split("\n");

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          backgroundColor: COLORS.CODE_BG,
          border: `1px solid ${COLORS.BORDER}`,
          borderRadius: 12,
          padding: "28px 32px",
          overflow: "hidden",
        }}
      >
        <LanguageBadge language={language} />
        <pre
          style={{
            margin: 0,
            fontFamily: FONTS.CODE,
            fontSize: FONT_SIZES.CODE,
            lineHeight: 1.6,
            color: COLORS.TEXT_PRIMARY,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {lines.map((line, i) => (
            <CodeLine key={i} line={line} index={i} frame={frame} />
          ))}
        </pre>
      </div>
      {caption && <Caption text={caption} />}
    </div>
  );
};

const CodeLine: React.FC<{
  line: string;
  index: number;
  frame: number;
}> = ({ line, index, frame }) => {
  const delay = index * TIMING.CODE_LINE_STAGGER_FRAMES;
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity }}>
      {highlightLine(line)}
      {"\n"}
    </div>
  );
};

const LanguageBadge: React.FC<{ language: string }> = ({ language }) => (
  <div
    style={{
      display: "inline-block",
      backgroundColor: COLORS.BG_TERTIARY,
      color: COLORS.TEXT_SECONDARY,
      fontSize: 28,
      padding: "8px 16px",
      borderRadius: 6,
      marginBottom: 16,
      fontFamily: FONTS.CODE,
    }}
  >
    {language}
  </div>
);

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      marginTop: 12,
      fontSize: FONT_SIZES.CAPTION,
      color: COLORS.TEXT_SECONDARY,
      textAlign: "center",
      fontStyle: "italic",
    }}
  >
    {text}
  </div>
);

/** Basic keyword highlighting for common languages */
function highlightLine(line: string): React.ReactNode {
  const keywords =
    /\b(function|const|let|var|return|if|else|for|while|import|from|export|class|interface|type|enum|async|await|def|self|true|false|null|undefined|new|this|try|catch|throw)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*$|#.*$)/g;

  const parts: Array<{ text: string; color: string; start: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = keywords.exec(line)) !== null) {
    parts.push({
      text: match[0],
      color: COLORS.ACCENT_RED,
      start: match.index,
    });
  }
  while ((match = strings.exec(line)) !== null) {
    parts.push({
      text: match[0],
      color: COLORS.ACCENT_GREEN,
      start: match.index,
    });
  }
  while ((match = comments.exec(line)) !== null) {
    parts.push({
      text: match[0],
      color: COLORS.TEXT_MUTED,
      start: match.index,
    });
  }

  if (parts.length === 0) {
    return <span>{line}</span>;
  }

  parts.sort((a, b) => a.start - b.start);
  return buildHighlightedSpans(line, parts);
}

function buildHighlightedSpans(
  line: string,
  parts: Array<{ text: string; color: string; start: number }>
): React.ReactNode {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const part of parts) {
    if (part.start < lastIndex) continue;
    if (part.start > lastIndex) {
      result.push(
        <span key={`plain-${lastIndex}`}>
          {line.slice(lastIndex, part.start)}
        </span>
      );
    }
    result.push(
      <span key={`hl-${part.start}`} style={{ color: part.color }}>
        {part.text}
      </span>
    );
    lastIndex = part.start + part.text.length;
  }

  if (lastIndex < line.length) {
    result.push(
      <span key={`end-${lastIndex}`}>{line.slice(lastIndex)}</span>
    );
  }

  return <>{result}</>;
}

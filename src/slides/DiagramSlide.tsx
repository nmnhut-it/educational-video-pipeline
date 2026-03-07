import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { BoxDiagram } from "../components/BoxDiagram";
import { COLORS, FONTS, FONT_SIZES } from "../constants";
import { DiagramSlideData } from "../types";

interface DiagramSlideProps {
  data: DiagramSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Slide with SVG architecture diagram (falls back to ASCII if no nodes) */
export const DiagramSlide: React.FC<DiagramSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  const hasStructuredDiagram = data.nodes && data.nodes.length > 0;

  return (
    <SlideLayout slideIndex={slideIndex} totalSlides={totalSlides}>
      <AnimatedText delay={0}>
        <h2
          style={{
            fontSize: FONT_SIZES.HEADING,
            fontFamily: FONTS.HEADING,
            fontWeight: 700,
            margin: "0 0 32px 0",
          }}
        >
          {data.heading}
        </h2>
      </AnimatedText>

      <AnimatedText delay={8}>
        {hasStructuredDiagram ? (
          <BoxDiagram nodes={data.nodes} edges={data.edges} />
        ) : (
          <AsciiDiagramBlock lines={data.diagramLines || []} />
        )}
      </AnimatedText>
    </SlideLayout>
  );
};

const DIAGRAM_LINE_STAGGER = 3;

/** Fallback ASCII art diagram */
const AsciiDiagramBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        backgroundColor: COLORS.BG_SECONDARY,
        border: `1px solid ${COLORS.BORDER}`,
        borderRadius: 12,
        padding: "32px 40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <pre
        style={{
          margin: 0,
          fontFamily: FONTS.CODE,
          fontSize: FONT_SIZES.CODE,
          lineHeight: 1.4,
          color: COLORS.ACCENT_BLUE,
        }}
      >
        {lines.map((line, i) => {
          const delay = 12 + i * DIAGRAM_LINE_STAGGER;
          const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={i} style={{ opacity }}>
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
};

import React from "react";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { FlowChart } from "../components/FlowChart";
import { COLORS, FONTS, FONT_SIZES, TIMING } from "../constants";
import { ConceptSlideData } from "../types";

interface ConceptSlideProps {
  data: ConceptSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Text slide with heading, bullets, optional highlight and optional flow */
export const ConceptSlide: React.FC<ConceptSlideProps> = ({
  data,
  slideIndex,
  totalSlides,
}) => {
  return (
    <SlideLayout slideIndex={slideIndex} totalSlides={totalSlides}>
      <AnimatedText delay={0}>
        <h2
          style={{
            fontSize: FONT_SIZES.HEADING,
            fontFamily: FONTS.HEADING,
            fontWeight: 700,
            margin: "0 0 32px 0",
            color: COLORS.TEXT_PRIMARY,
          }}
        >
          {data.heading}
        </h2>
      </AnimatedText>

      <BulletList bullets={data.bullets} />

      {data.flow && data.flow.length > 0 && (
        <AnimatedText delay={25}>
          <div style={{ marginTop: 32 }}>
            <FlowChart nodes={data.flow} />
          </div>
        </AnimatedText>
      )}

      {data.highlight && <HighlightQuote text={data.highlight} />}
    </SlideLayout>
  );
};

const BulletList: React.FC<{ bullets: string[] }> = ({ bullets }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {bullets.map((bullet, i) => (
      <AnimatedText
        key={i}
        delay={8 + i * TIMING.BULLET_STAGGER_FRAMES}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <span
            style={{
              color: COLORS.ACCENT_BLUE,
              fontSize: FONT_SIZES.BODY,
              lineHeight: 1.6,
              flexShrink: 0,
            }}
          >
            ▸
          </span>
          <span
            style={{
              fontSize: FONT_SIZES.BODY,
              fontFamily: FONTS.BODY,
              lineHeight: 1.6,
              color: COLORS.TEXT_PRIMARY,
            }}
          >
            {bullet}
          </span>
        </div>
      </AnimatedText>
    ))}
  </div>
);

const HighlightQuote: React.FC<{ text: string }> = ({ text }) => (
  <AnimatedText delay={30}>
    <div
      style={{
        marginTop: 28,
        padding: "16px 24px",
        borderLeft: `4px solid ${COLORS.ACCENT_BLUE}`,
        backgroundColor: COLORS.BG_SECONDARY,
        borderRadius: "0 8px 8px 0",
      }}
    >
      <p
        style={{
          fontSize: FONT_SIZES.BODY,
          fontFamily: FONTS.BODY,
          color: COLORS.ACCENT_BLUE,
          fontStyle: "italic",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  </AnimatedText>
);

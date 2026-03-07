import React from "react";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { CodeBlock } from "../components/CodeBlock";
import { FONTS, FONT_SIZES } from "../constants";
import { CodeSlideData } from "../types";

interface CodeSlideProps {
  data: CodeSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Slide with heading and syntax-highlighted code block */
export const CodeSlide: React.FC<CodeSlideProps> = ({
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
          }}
        >
          {data.heading}
        </h2>
      </AnimatedText>

      <AnimatedText delay={8}>
        <CodeBlock
          code={data.code}
          language={data.language}
          caption={data.caption}
        />
      </AnimatedText>
    </SlideLayout>
  );
};

import React from "react";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { FlowChart } from "../components/FlowChart";
import { FONTS, FONT_SIZES } from "../constants";
import { FlowSlideData } from "../types";

interface FlowSlideProps {
  data: FlowSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Slide with heading and horizontal flow/timeline diagram */
export const FlowSlide: React.FC<FlowSlideProps> = ({
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
            margin: "0 0 40px 0",
          }}
        >
          {data.heading}
        </h2>
      </AnimatedText>

      <AnimatedText delay={6}>
        <FlowChart nodes={data.nodes} summary={data.summary} />
      </AnimatedText>
    </SlideLayout>
  );
};

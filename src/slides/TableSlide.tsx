import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SlideLayout } from "../components/SlideLayout";
import { AnimatedText } from "../components/AnimatedText";
import { COLORS, FONTS, FONT_SIZES, TIMING } from "../constants";
import { TableSlideData } from "../types";

interface TableSlideProps {
  data: TableSlideData;
  slideIndex: number;
  totalSlides: number;
}

/** Slide with heading and animated comparison table */
export const TableSlide: React.FC<TableSlideProps> = ({
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

      <AnimatedTable headers={data.headers} rows={data.rows} />
    </SlideLayout>
  );
};

const AnimatedTable: React.FC<{
  headers: string[];
  rows: string[][];
}> = ({ headers, rows }) => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame - 8, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        border: `1px solid ${COLORS.BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: FONTS.BODY,
        }}
      >
        <thead>
          <tr style={{ opacity: headerOpacity }}>
            {headers.map((header, i) => (
              <th
                key={i}
                style={{
                  padding: "16px 24px",
                  textAlign: "left",
                  fontSize: FONT_SIZES.TABLE_HEADER,
                  fontWeight: 600,
                  color: COLORS.ACCENT_BLUE,
                  backgroundColor: COLORS.BG_SECONDARY,
                  borderBottom: `2px solid ${COLORS.BORDER}`,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const rowDelay =
              15 + rowIdx * TIMING.BULLET_STAGGER_FRAMES;
            const rowOpacity = interpolate(
              frame - rowDelay,
              [0, 10],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );

            return (
              <tr
                key={rowIdx}
                style={{
                  opacity: rowOpacity,
                  backgroundColor:
                    rowIdx % 2 === 0
                      ? COLORS.BG_PRIMARY
                      : COLORS.BG_SECONDARY,
                }}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    style={{
                      padding: "14px 24px",
                      fontSize: FONT_SIZES.TABLE_CELL,
                      color: COLORS.TEXT_PRIMARY,
                      borderBottom: `1px solid ${COLORS.BORDER}`,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

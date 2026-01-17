import { describe, expect, it } from "vitest";
import { computeLayout, getSheetMetrics } from "./layout";

describe("layout math", () => {
  it("computes a centered grid with correct tile size", () => {
    const metrics = getSheetMetrics(false);
    const layout = computeLayout({
      sheetWidthPx: metrics.widthPx,
      sheetHeightPx: metrics.heightPx,
      rows: 2,
      columns: 2,
      spacingMm: 0,
      marginMm: 0,
      pxPerMm: metrics.pxPerMm,
      tileAspect: 2 / 3,
    });
    expect(layout.tileRects).toHaveLength(4);
    expect(layout.tileWidth).toBeCloseTo(1000);
    expect(layout.tileHeight).toBeCloseTo(1500);
    expect(layout.guideLines).toHaveLength(2);
  });

  it("converts spacing in mm to pixels", () => {
    const metrics = getSheetMetrics(false);
    const layout = computeLayout({
      sheetWidthPx: metrics.widthPx,
      sheetHeightPx: metrics.heightPx,
      rows: 1,
      columns: 2,
      spacingMm: 1,
      marginMm: 0,
      pxPerMm: metrics.pxPerMm,
      tileAspect: 2 / 3,
    });
    expect(layout.spacingPx).toBeCloseTo(metrics.pxPerMm);
  });
});

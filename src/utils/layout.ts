export type Orientation = "portrait" | "landscape";

export interface SheetMetrics {
  widthPx: number;
  heightPx: number;
  pxPerMm: number;
}

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LayoutInput {
  sheetWidthPx: number;
  sheetHeightPx: number;
  rows: number;
  columns: number;
  spacingMm: number;
  marginMm: number;
  pxPerMm: number;
  tileAspect: number;
}

export interface LayoutResult {
  tileRects: TileRect[];
  tileWidth: number;
  tileHeight: number;
  cellWidth: number;
  cellHeight: number;
  spacingPx: number;
  marginPx: number;
  guideLines: GuideLine[];
}

const BASE_LONG_EDGE_PX = 3000;
const BASE_SHORT_EDGE_PX = 2000;
const BASE_LONG_EDGE_MM = 150;

export function getSheetMetrics(rotatePaper: boolean): SheetMetrics {
  const widthPx = rotatePaper ? BASE_LONG_EDGE_PX : BASE_SHORT_EDGE_PX;
  const heightPx = rotatePaper ? BASE_SHORT_EDGE_PX : BASE_LONG_EDGE_PX;
  const pxPerMm = BASE_LONG_EDGE_PX / BASE_LONG_EDGE_MM;
  return { widthPx, heightPx, pxPerMm };
}

export function computeLayout({
  sheetWidthPx,
  sheetHeightPx,
  rows,
  columns,
  spacingMm,
  marginMm,
  pxPerMm,
  tileAspect,
}: LayoutInput): LayoutResult {
  const spacingPx = Math.max(0, spacingMm) * pxPerMm;
  const marginPx = Math.max(0, marginMm) * pxPerMm;
  const usableWidth = Math.max(
    1,
    sheetWidthPx - marginPx * 2 - (columns - 1) * spacingPx,
  );
  const usableHeight = Math.max(
    1,
    sheetHeightPx - marginPx * 2 - (rows - 1) * spacingPx,
  );

  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;

  const tileWidth = Math.min(cellWidth, cellHeight * tileAspect);
  const tileHeight = tileWidth / tileAspect;

  const tileRects: TileRect[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const cellX = marginPx + col * (cellWidth + spacingPx);
      const cellY = marginPx + row * (cellHeight + spacingPx);
      const tileX = cellX + (cellWidth - tileWidth) / 2;
      const tileY = cellY + (cellHeight - tileHeight) / 2;
      tileRects.push({
        x: tileX,
        y: tileY,
        width: tileWidth,
        height: tileHeight,
      });
    }
  }

  const guideLines: GuideLine[] = [];
  if (rows > 1) {
    for (let row = 1; row < rows; row += 1) {
      const lineY =
        marginPx + row * cellHeight + (row - 1) * spacingPx + spacingPx / 2;
      guideLines.push({
        x1: marginPx,
        x2: sheetWidthPx - marginPx,
        y1: lineY,
        y2: lineY,
      });
    }
  }

  if (columns > 1) {
    for (let col = 1; col < columns; col += 1) {
      const lineX =
        marginPx + col * cellWidth + (col - 1) * spacingPx + spacingPx / 2;
      guideLines.push({
        x1: lineX,
        x2: lineX,
        y1: marginPx,
        y2: sheetHeightPx - marginPx,
      });
    }
  }

  return {
    tileRects,
    tileWidth,
    tileHeight,
    cellWidth,
    cellHeight,
    spacingPx,
    marginPx,
    guideLines,
  };
}

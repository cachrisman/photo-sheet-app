import { useEffect, useRef } from "react";
import type { LayoutResult } from "../utils/layout";
import type { Rect } from "../utils/crop";
import { renderSheet } from "../utils/renderer";

interface SheetPreviewProps {
  image: ImageBitmap;
  cropRect: Rect;
  layout: LayoutResult;
  sheetWidth: number;
  sheetHeight: number;
  zoom: number;
  cutGuides: boolean;
}

export default function SheetPreview({
  image,
  cropRect,
  layout,
  sheetWidth,
  sheetHeight,
  zoom,
  cutGuides,
}: SheetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = sheetWidth;
    canvas.height = sheetHeight;
    renderSheet({ canvas, image, cropRect, layout, cutGuides });
  }, [image, cropRect, layout, sheetWidth, sheetHeight, cutGuides]);

  return (
    <canvas
      ref={canvasRef}
      className="preview-canvas"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
    />
  );
}

import type { LayoutResult } from "./layout";
import type { Rect } from "./crop";

export interface RenderInput {
  canvas: HTMLCanvasElement;
  image: ImageBitmap;
  cropRect: Rect;
  layout: LayoutResult;
  cutGuides: boolean;
}

export function renderSheet({
  canvas,
  image,
  cropRect,
  layout,
  cutGuides,
}: RenderInput): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const sheetWidth = canvas.width;
  const sheetHeight = canvas.height;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sheetWidth, sheetHeight);

  layout.tileRects.forEach((rect) => {
    ctx.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
  });

  if (cutGuides) {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1;
    layout.guideLines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
  }

  ctx.restore();
}

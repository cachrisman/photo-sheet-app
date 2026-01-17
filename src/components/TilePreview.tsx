import { useEffect, useRef } from "react";
import type { Rect } from "../utils/crop";

interface TilePreviewProps {
  image: ImageBitmap;
  cropRect: Rect;
  aspect: number;
  showOverlay: boolean;
  mode: "friend" | "german";
}

function drawIdOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(20, 24, 35, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
  const headMinY = y + height * (1 - 0.78);
  const headMaxY = y + height * (1 - 0.62);
  ctx.fillRect(x, headMinY, width, headMaxY - headMinY);

  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
  const eyeStart = y + height * 0.38;
  const eyeEnd = y + height * 0.45;
  ctx.fillRect(x, eyeStart, width, eyeEnd - eyeStart);

  ctx.strokeStyle = "rgba(20, 24, 35, 0.4)";
  const centerX = x + width / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(centerX, y + height);
  ctx.stroke();

  ctx.fillStyle = "rgba(20, 24, 35, 0.08)";
  const tolerance = width * 0.08;
  ctx.fillRect(centerX - tolerance, y, tolerance * 2, height);
  ctx.restore();
}

export default function TilePreview({
  image,
  cropRect,
  aspect,
  showOverlay,
  mode,
}: TilePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const width = 220;
    const height = Math.round(width / aspect);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      width,
      height,
    );
    if (mode === "german" && showOverlay) {
      drawIdOverlay(ctx, 0, 0, width, height);
    }
  }, [image, cropRect, aspect, mode, showOverlay]);

  return <canvas ref={canvasRef} className="tile-preview" />;
}

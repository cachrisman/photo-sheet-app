import { useEffect, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { Rect, Mode } from "../utils/crop";
import { moveCrop, zoomCrop } from "../utils/crop";

interface CropEditorProps {
  open: boolean;
  image: ImageBitmap;
  cropRect: Rect;
  aspect: number;
  mode: Mode;
  showOverlay: boolean;
  onChange: (crop: Rect) => void;
  onReset: () => void;
  onClose: () => void;
}

interface CropView {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  scale: number;
}

function drawIdOverlay(
  ctx: CanvasRenderingContext2D,
  view: CropView,
) {
  const { boxX, boxY, boxWidth, boxHeight } = view;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = "rgba(37, 99, 235, 0.18)";
  const headMinY = boxY + boxHeight * (1 - 0.78);
  const headMaxY = boxY + boxHeight * (1 - 0.62);
  ctx.fillRect(boxX, headMinY, boxWidth, headMaxY - headMinY);

  ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
  const eyeStart = boxY + boxHeight * 0.38;
  const eyeEnd = boxY + boxHeight * 0.45;
  ctx.fillRect(boxX, eyeStart, boxWidth, eyeEnd - eyeStart);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  const centerX = boxX + boxWidth / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, boxY);
  ctx.lineTo(centerX, boxY + boxHeight);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  const tolerance = boxWidth * 0.08;
  ctx.fillRect(centerX - tolerance, boxY, tolerance * 2, boxHeight);
  ctx.restore();
}

export default function CropEditor({
  open,
  image,
  cropRect,
  aspect,
  mode,
  showOverlay,
  onChange,
  onReset,
  onClose,
}: CropEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<CropView | null>(null);
  const pointerMap = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStart = useRef<{ x: number; y: number; rect: Rect } | null>(null);
  const pinchStart = useRef<{
    distance: number;
    rect: Rect;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setCanvasSize({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      });
    });
    observer.observe(canvas);
    setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = canvasSize.width * window.devicePixelRatio;
    canvas.height = canvasSize.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = "#0f1119";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const boxMaxWidth = canvasSize.width * 0.8;
    const boxMaxHeight = canvasSize.height * 0.8;
    let boxWidth = boxMaxWidth;
    let boxHeight = boxWidth / aspect;
    if (boxHeight > boxMaxHeight) {
      boxHeight = boxMaxHeight;
      boxWidth = boxHeight * aspect;
    }
    const boxX = (canvasSize.width - boxWidth) / 2;
    const boxY = (canvasSize.height - boxHeight) / 2;
    const scale = boxWidth / cropRect.width;
    viewRef.current = { boxX, boxY, boxWidth, boxHeight, scale };

    const imageX = boxX - cropRect.x * scale;
    const imageY = boxY - cropRect.y * scale;
    ctx.drawImage(
      image,
      imageX,
      imageY,
      image.width * scale,
      image.height * scale,
    );

    ctx.save();
    ctx.fillStyle = "rgba(15, 17, 25, 0.55)";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    if (mode === "german" && showOverlay) {
      drawIdOverlay(ctx, { boxX, boxY, boxWidth, boxHeight, scale });
    }
  }, [open, cropRect, aspect, mode, showOverlay, canvasSize, image]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.setPointerCapture(event.pointerId);
    pointerMap.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointerMap.current.size === 1) {
      dragStart.current = { x: event.clientX, y: event.clientY, rect: cropRect };
      pinchStart.current = null;
    } else if (pointerMap.current.size === 2) {
      const points = Array.from(pointerMap.current.values());
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      pinchStart.current = { distance, rect: cropRect };
      dragStart.current = null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!viewRef.current) {
      return;
    }
    if (!pointerMap.current.has(event.pointerId)) {
      return;
    }
    pointerMap.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointerMap.current.size === 2 && pinchStart.current) {
      const points = Array.from(pointerMap.current.values());
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const ratio = distance / pinchStart.current.distance;
      const nextRect = zoomCrop(
        pinchStart.current.rect,
        ratio,
        image.width,
        image.height,
        aspect,
      );
      onChange(nextRect);
      return;
    }
    if (dragStart.current) {
      const deltaX = -(event.clientX - dragStart.current.x) / viewRef.current.scale;
      const deltaY = -(event.clientY - dragStart.current.y) / viewRef.current.scale;
      const nextRect = moveCrop(
        dragStart.current.rect,
        deltaX,
        deltaY,
        image.width,
        image.height,
      );
      onChange(nextRect);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.releasePointerCapture(event.pointerId);
    pointerMap.current.delete(event.pointerId);
    if (pointerMap.current.size < 2) {
      pinchStart.current = null;
    }
    if (pointerMap.current.size === 0) {
      dragStart.current = null;
    }
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
    const nextRect = zoomCrop(
      cropRect,
      zoomFactor,
      image.width,
      image.height,
      aspect,
    );
    onChange(nextRect);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="status-row">
          <span className="badge">Drag to move</span>
          <span className="badge">Pinch or wheel to zoom</span>
        </div>
        <canvas
          ref={canvasRef}
          className="crop-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        />
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onReset}>
            Reset to auto-crop
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

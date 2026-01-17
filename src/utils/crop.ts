import type { Orientation } from "./layout";

export type Mode = "friend" | "german";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  eyesY?: number;
  score?: number;
}

export interface AutoCropOptions {
  mode: Mode;
  aspect: number;
}

const FRIEND_HEAD_RATIO = 0.6;
const GERMAN_HEAD_RATIO = 0.7;

export function getTargetAspect(mode: Mode, orientation: Orientation): number {
  if (mode === "german") {
    return 35 / 45;
  }
  return orientation === "portrait" ? 2 / 3 : 3 / 2;
}

export function clampRect(
  rect: Rect,
  imageWidth: number,
  imageHeight: number,
): Rect {
  const width = Math.min(rect.width, imageWidth);
  const height = Math.min(rect.height, imageHeight);
  const x = Math.min(Math.max(0, rect.x), imageWidth - width);
  const y = Math.min(Math.max(0, rect.y), imageHeight - height);
  return { x, y, width, height };
}

export function centerCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Rect {
  const imageAspect = imageWidth / imageHeight;
  let width = imageWidth;
  let height = imageHeight;
  if (imageAspect > aspect) {
    width = imageHeight * aspect;
  } else {
    height = imageWidth / aspect;
  }
  const x = (imageWidth - width) / 2;
  const y = (imageHeight - height) / 2;
  return { x, y, width, height };
}

export function autoCropFromFace(
  imageWidth: number,
  imageHeight: number,
  face: FaceBox | undefined,
  { mode, aspect }: AutoCropOptions,
): Rect {
  if (!face) {
    return centerCrop(imageWidth, imageHeight, aspect);
  }

  const targetHeadRatio = mode === "german" ? GERMAN_HEAD_RATIO : FRIEND_HEAD_RATIO;
  const faceHeight = face.height;
  let cropHeight = faceHeight / targetHeadRatio;
  let cropWidth = cropHeight * aspect;

  const maxScale = Math.min(imageWidth / cropWidth, imageHeight / cropHeight, 1);
  cropWidth *= maxScale;
  cropHeight *= maxScale;

  const faceCenterX = face.centerX;
  const eyesY = face.eyesY ?? face.y + face.height * 0.35;
  const eyeTargetRatio = mode === "german" ? 0.4 : 0.38;
  const cropX = faceCenterX - cropWidth / 2;
  const cropY = eyesY - cropHeight * eyeTargetRatio;

  return clampRect(
    { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
    imageWidth,
    imageHeight,
  );
}

export function zoomCrop(
  rect: Rect,
  zoomFactor: number,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Rect {
  const clampedZoom = Math.min(Math.max(zoomFactor, 0.4), 2);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  let newWidth = rect.width / clampedZoom;
  let newHeight = newWidth / aspect;

  const minWidth = Math.max(40, imageWidth * 0.1);
  if (newWidth < minWidth) {
    newWidth = minWidth;
    newHeight = newWidth / aspect;
  }

  if (newWidth > imageWidth || newHeight > imageHeight) {
    newWidth = Math.min(imageWidth, imageHeight * aspect);
    newHeight = newWidth / aspect;
  }

  return clampRect(
    {
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight,
    },
    imageWidth,
    imageHeight,
  );
}

export function moveCrop(
  rect: Rect,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number,
): Rect {
  return clampRect(
    {
      x: rect.x + deltaX,
      y: rect.y + deltaY,
      width: rect.width,
      height: rect.height,
    },
    imageWidth,
    imageHeight,
  );
}

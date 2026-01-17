import exifr from "exifr";
import heic2any from "heic2any";

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  url: string;
  mimeType: string;
}

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

async function toCanvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to generate image blob."));
        return;
      }
      resolve(blob);
    }, mimeType);
  });
}

function drawOrientedImage(
  bitmap: ImageBitmap,
  orientation: number,
): HTMLCanvasElement {
  const { width, height } = bitmap;
  const swapSides = [5, 6, 7, 8].includes(orientation);
  const canvas = document.createElement("canvas");
  canvas.width = swapSides ? height : width;
  canvas.height = swapSides ? width : height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable.");
  }

  switch (orientation) {
    case 2:
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.translate(height, 0);
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.translate(height, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 7:
      ctx.translate(height, width);
      ctx.rotate(Math.PI / 2);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.translate(0, width);
      ctx.rotate(-Math.PI / 2);
      break;
    default:
      break;
  }

  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  let workingBlob: Blob = file;
  let mimeType = file.type || "image/jpeg";

  if (isHeic(file)) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
    });
    workingBlob = Array.isArray(converted) ? converted[0] : converted;
    mimeType = "image/jpeg";
  }

  const orientation = (await exifr.orientation(workingBlob)) ?? 1;
  const bitmap = await createImageBitmap(workingBlob);
  const canvas = drawOrientedImage(bitmap, orientation);
  bitmap.close();
  const normalizedBlob = await toCanvasBlob(canvas, mimeType);
  const normalizedBitmap = await createImageBitmap(normalizedBlob);
  const url = URL.createObjectURL(normalizedBlob);

  return {
    bitmap: normalizedBitmap,
    width: canvas.width,
    height: canvas.height,
    url,
    mimeType,
  };
}

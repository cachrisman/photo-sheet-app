import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";
import type { FaceBox } from "./crop";

let detectorPromise: Promise<FaceDetector> | null = null;

async function getDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
      );
      return FaceDetector.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-assets/face_detector.tflite",
        },
        runningMode: "IMAGE",
      });
    })();
  }
  return detectorPromise;
}

function getEyeY(keypoints: { x: number; y: number; name?: string }[]): number | undefined {
  const left = keypoints.find((point) => point.name === "LEFT_EYE");
  const right = keypoints.find((point) => point.name === "RIGHT_EYE");
  if (left && right) {
    return (left.y + right.y) / 2;
  }
  return undefined;
}

export async function detectFaces(bitmap: ImageBitmap): Promise<FaceBox[]> {
  const detector = await getDetector();
  const result = detector.detect(bitmap);
  const faces = result.detections ?? [];
  return faces.map((detection, index) => {
    const { originX, originY, width, height } = detection.boundingBox;
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;
    const eyesY = getEyeY(detection.keypoints ?? []);
    return {
      id: `face-${index}`,
      x: originX,
      y: originY,
      width,
      height,
      centerX,
      centerY,
      eyesY,
      score: detection.categories?.[0]?.score,
    };
  });
}

export function selectBestFace(
  faces: FaceBox[],
  imageWidth: number,
  imageHeight: number,
): FaceBox | undefined {
  if (!faces.length) {
    return undefined;
  }
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  return [...faces].sort((a, b) => {
    const areaScoreA = a.width * a.height;
    const areaScoreB = b.width * b.height;
    const distA = Math.hypot(a.centerX - centerX, a.centerY - centerY);
    const distB = Math.hypot(b.centerX - centerX, b.centerY - centerY);
    const scoreA = areaScoreA - distA * 50;
    const scoreB = areaScoreB - distB * 50;
    return scoreB - scoreA;
  })[0];
}

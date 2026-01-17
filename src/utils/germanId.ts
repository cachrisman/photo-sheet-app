import type { FaceBox, Rect } from "./crop";

export interface IdWarningResult {
  warnings: string[];
  checksUnavailable: boolean;
}

export function getGermanIdWarnings(
  face: FaceBox | undefined,
  crop: Rect,
  tileHeightPx: number,
): IdWarningResult {
  const warnings: string[] = [];
  if (!face) {
    return {
      warnings: ["No face detected, biometric checks unavailable."],
      checksUnavailable: true,
    };
  }

  const headRatio = face.height / crop.height;
  if (headRatio < 0.62) {
    warnings.push("Head too small (target ~70%).");
  }
  if (headRatio > 0.78) {
    warnings.push("Head too large (target ~70%).");
  }

  if (face.eyesY !== undefined) {
    const eyesRatio = (face.eyesY - crop.y) / crop.height;
    if (eyesRatio < 0.35) {
      warnings.push("Eyes too high.");
    } else if (eyesRatio > 0.5) {
      warnings.push("Eyes too low.");
    } else if (eyesRatio < 0.38 || eyesRatio > 0.45) {
      warnings.push("Eyes outside preferred band.");
    }
  }

  const faceCenterOffset = Math.abs(face.centerX - (crop.x + crop.width / 2));
  if (faceCenterOffset / crop.width > 0.08) {
    warnings.push("Face off-center.");
  }

  if (tileHeightPx < 500) {
    warnings.push("Low resolution for ID print (tile height under 500px).");
  }

  return { warnings, checksUnavailable: false };
}

export const germanIdChecklist = [
  "Neutral expression, mouth closed.",
  "Even lighting, no shadows on face.",
  "No head covering or tinted glasses.",
  "Plain, light-colored background.",
];

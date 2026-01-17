import type { Mode } from "./utils/crop";
import type { Orientation } from "./utils/layout";

export interface AppSettings {
  mode: Mode;
  rows: number;
  columns: number;
  orientation: Orientation;
  rotatePaper: boolean;
  safeMarginEnabled: boolean;
  safeMarginMm: number;
  spacingMm: number;
  cutGuides: boolean;
  quality: number;
  showIdOverlay: boolean;
}

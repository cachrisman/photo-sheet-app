import { describe, expect, it } from "vitest";
import { autoCropFromFace, getTargetAspect, zoomCrop } from "./crop";

describe("crop invariants", () => {
  it("enforces aspect ratio for friend mode", () => {
    const aspect = getTargetAspect("friend", "portrait");
    const crop = autoCropFromFace(1200, 1800, undefined, {
      mode: "friend",
      aspect,
    });
    expect(crop.width / crop.height).toBeCloseTo(aspect, 4);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
  });

  it("keeps zoomed crop inside image bounds", () => {
    const aspect = getTargetAspect("friend", "portrait");
    const crop = autoCropFromFace(1000, 1500, undefined, {
      mode: "friend",
      aspect,
    });
    const zoomed = zoomCrop(crop, 2, 1000, 1500, aspect);
    expect(zoomed.x).toBeGreaterThanOrEqual(0);
    expect(zoomed.y).toBeGreaterThanOrEqual(0);
    expect(zoomed.x + zoomed.width).toBeLessThanOrEqual(1000);
    expect(zoomed.y + zoomed.height).toBeLessThanOrEqual(1500);
  });

  it("locks German ID to 35x45 ratio", () => {
    const aspect = getTargetAspect("german", "portrait");
    expect(aspect).toBeCloseTo(35 / 45, 4);
  });
});

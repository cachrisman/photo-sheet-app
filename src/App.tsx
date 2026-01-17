import { useEffect, useMemo, useState } from "react";
import UploadArea from "./components/UploadArea";
import ControlsPanel from "./components/ControlsPanel";
import FacePicker from "./components/FacePicker";
import TilePreview from "./components/TilePreview";
import SheetPreview from "./components/SheetPreview";
import CropEditor from "./components/CropEditor";
import type { AppSettings } from "./types";
import type { FaceBox, Rect } from "./utils/crop";
import { autoCropFromFace, getTargetAspect } from "./utils/crop";
import { loadImageFile, type LoadedImage } from "./utils/imageLoader";
import { detectFaces, selectBestFace } from "./utils/faceDetection";
import { computeLayout, getSheetMetrics } from "./utils/layout";
import { germanIdChecklist, getGermanIdWarnings } from "./utils/germanId";

const SETTINGS_KEY = "photo-sheet-settings";

const defaultSettings: AppSettings = {
  mode: "friend",
  rows: 5,
  columns: 2,
  orientation: "portrait",
  rotatePaper: false,
  safeMarginEnabled: false,
  safeMarginMm: 2,
  spacingMm: 1,
  cutGuides: true,
  quality: 0.9,
  showIdOverlay: true,
};

function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const merged = { ...defaultSettings, ...parsed };
    if (merged.mode === "german") {
      merged.orientation = "portrait";
    }
    merged.rows = Math.min(10, Math.max(1, merged.rows));
    merged.columns = Math.min(4, Math.max(1, merged.columns));
    merged.spacingMm = Math.max(0, merged.spacingMm);
    merged.safeMarginMm = Math.max(0, merged.safeMarginMm);
    merged.quality = Math.min(1, Math.max(0.6, merged.quality));
    return merged;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [selectedFaceId, setSelectedFaceId] = useState<string | undefined>();
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [autoCropRect, setAutoCropRect] = useState<Rect | null>(null);
  const [faceStatus, setFaceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [previewZoom, setPreviewZoom] = useState(1);
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }
      image?.bitmap.close();
    };
  }, [image]);

  useEffect(() => {
    if (settings.mode === "german" && settings.orientation !== "portrait") {
      setSettings((prev) => ({ ...prev, orientation: "portrait" }));
    }
  }, [settings.mode, settings.orientation]);

  const aspect = getTargetAspect(settings.mode, settings.orientation);
  const sheetMetrics = getSheetMetrics(settings.rotatePaper);
  const layout = useMemo(() => {
    const marginMm = settings.safeMarginEnabled ? settings.safeMarginMm : 0;
    return computeLayout({
      sheetWidthPx: sheetMetrics.widthPx,
      sheetHeightPx: sheetMetrics.heightPx,
      rows: settings.rows,
      columns: settings.columns,
      spacingMm: settings.spacingMm,
      marginMm,
      pxPerMm: sheetMetrics.pxPerMm,
      tileAspect: aspect,
    });
  }, [
    settings.rows,
    settings.columns,
    settings.spacingMm,
    settings.safeMarginEnabled,
    settings.safeMarginMm,
    sheetMetrics.widthPx,
    sheetMetrics.heightPx,
    sheetMetrics.pxPerMm,
    aspect,
  ]);

  useEffect(() => {
    if (!image) {
      return;
    }
    const selectedFace = faces.find((face) => face.id === selectedFaceId);
    const nextCrop = autoCropFromFace(image.width, image.height, selectedFace, {
      mode: settings.mode,
      aspect,
    });
    setCropRect(nextCrop);
    setAutoCropRect(nextCrop);
  }, [image, selectedFaceId, settings.mode, aspect, faces]);

  const handleFileSelected = async (file: File) => {
    try {
      setFaceStatus("loading");
      setStatusMessage("Processing image...");
      setFaces([]);
      setSelectedFaceId(undefined);
      const loaded = await loadImageFile(file);
      setImage(loaded);
      try {
        const detectedFaces = await detectFaces(loaded.bitmap);
        setFaces(detectedFaces);
        const best = selectBestFace(detectedFaces, loaded.width, loaded.height);
        setSelectedFaceId(best?.id);
        setFaceStatus("ready");
        setStatusMessage(
          detectedFaces.length ? null : "No face detected. Using centered crop.",
        );
      } catch (error) {
        setFaceStatus("error");
        setFaces([]);
        setSelectedFaceId(undefined);
        setStatusMessage("Face detection failed, using centered crop.");
        console.error(error);
      }
    } catch (error) {
      setFaceStatus("error");
      setStatusMessage("Face detection failed, using centered crop.");
      console.error(error);
    }
  };

  const handleModeChange = (mode: AppSettings["mode"]) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      orientation: mode === "german" ? "portrait" : prev.orientation,
      spacingMm: mode === "german" ? 0 : 1,
      cutGuides: mode !== "german",
      showIdOverlay: mode === "german" ? true : prev.showIdOverlay,
    }));
  };

  const updateSettings = (next: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  };

  const selectedFace = faces.find((face) => face.id === selectedFaceId);
  const idWarnings =
    settings.mode === "german" && cropRect
      ? getGermanIdWarnings(selectedFace, cropRect, layout.tileHeight)
      : null;

  const handleDownload = async () => {
    if (!image || !cropRect) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = sheetMetrics.widthPx;
    canvas.height = sheetMetrics.heightPx;
    const { renderSheet } = await import("./utils/renderer");
    renderSheet({
      canvas,
      image: image.bitmap,
      cropRect,
      layout,
      cutGuides: settings.cutGuides,
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((nextBlob) => resolve(nextBlob), "image/jpeg", settings.quality),
    );
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const orientationLabel =
      settings.mode === "german"
        ? "35x45"
        : settings.orientation === "portrait"
          ? "2x3"
          : "3x2";
    link.href = url;
    link.download = `${settings.mode === "friend" ? "friendbook" : "germanid"}_${settings.rows}x${settings.columns}_${orientationLabel}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app">
      <header className="header">
        <h1>Photo Print Sheet</h1>
        <p>
          Upload one photo, choose a layout, and download a print-ready JPG for DM,
          Rossmann, or any 2:3 kiosk.
        </p>
      </header>

      <div className="layout">
        <div className="card">
          <div className="section-title">Upload</div>
          <UploadArea onFileSelected={handleFileSelected} />
          {statusMessage ? <div className="warning">{statusMessage}</div> : null}
          <ControlsPanel
            settings={settings}
            onUpdate={updateSettings}
            onModeChange={handleModeChange}
          />
        </div>

        <div className="preview-wrap">
          <div className="card">
            <div className="section-title">Auto-crop & Face</div>
            {image ? (
              <>
                <div className="status-row">
                  {faceStatus === "loading" ? (
                    <span className="badge">Detecting faces...</span>
                  ) : null}
                  {faces.length > 1 ? (
                    <span className="badge">Tap a face to choose</span>
                  ) : null}
                  {settings.mode === "german" ? (
                    <span className="badge">German ID overlay</span>
                  ) : null}
                </div>
                <FacePicker
                  imageUrl={image.url}
                  imageWidth={image.width}
                  imageHeight={image.height}
                  faces={faces}
                  selectedFaceId={selectedFaceId}
                  onSelectFace={setSelectedFaceId}
                />
                {cropRect ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setCropEditorOpen(true)}
                    >
                      Adjust crop
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="inline-note">Upload a photo to see face detection.</div>
            )}
          </div>

          {image && cropRect ? (
            <div className="card">
              <div className="section-title">Tile preview</div>
              <TilePreview
                image={image.bitmap}
                cropRect={cropRect}
                aspect={aspect}
                showOverlay={settings.showIdOverlay}
                mode={settings.mode}
              />
              {idWarnings ? (
                <>
                  {idWarnings.warnings.map((warning) => (
                    <div key={warning} className="warning">
                      {warning}
                    </div>
                  ))}
                  <ul className="checklist">
                    {germanIdChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="card">
            <div className="section-title">Final sheet</div>
            {image && cropRect ? (
              <>
                <div className="sheet-container">
                  <SheetPreview
                    image={image.bitmap}
                    cropRect={cropRect}
                    layout={layout}
                    sheetWidth={sheetMetrics.widthPx}
                    sheetHeight={sheetMetrics.heightPx}
                    zoom={previewZoom}
                    cutGuides={settings.cutGuides}
                  />
                </div>
                <div className="zoom-row">
                  <label htmlFor="zoom">Preview zoom</label>
                  <input
                    id="zoom"
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={previewZoom}
                    onChange={(event) => setPreviewZoom(Number(event.target.value))}
                  />
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleDownload}
                  >
                    Download JPG
                  </button>
                </div>
              </>
            ) : (
              <div className="inline-note">Preview appears after upload.</div>
            )}
          </div>
        </div>
      </div>

      {image && cropRect ? (
        <CropEditor
          open={cropEditorOpen}
          image={image.bitmap}
          cropRect={cropRect}
          aspect={aspect}
          mode={settings.mode}
          showOverlay={settings.showIdOverlay}
          onChange={setCropRect}
          onReset={() => autoCropRect && setCropRect(autoCropRect)}
          onClose={() => setCropEditorOpen(false)}
        />
      ) : null}
    </main>
  );
}

import type { AppSettings } from "../types";

interface ControlsPanelProps {
  settings: AppSettings;
  onUpdate: (next: Partial<AppSettings>) => void;
  onModeChange: (mode: AppSettings["mode"]) => void;
}

export default function ControlsPanel({
  settings,
  onUpdate,
  onModeChange,
}: ControlsPanelProps) {
  const isGerman = settings.mode === "german";

  return (
    <div className="card">
      <div className="section-title">Mode & Grid</div>
      <div className="control-row">
        <div className="field">
          <label htmlFor="mode">Mode</label>
          <select
            id="mode"
            value={settings.mode}
            onChange={(event) => onModeChange(event.target.value as AppSettings["mode"])}
          >
            <option value="friend">Friend Book</option>
            <option value="german">German ID</option>
          </select>
        </div>
        <div className="control-grid">
          <div className="field">
            <label htmlFor="rows">Rows (1–10)</label>
            <input
              id="rows"
              type="number"
              min={1}
              max={10}
              value={settings.rows}
              onChange={(event) =>
                onUpdate({ rows: Math.min(10, Math.max(1, Number(event.target.value))) })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="cols">Columns (1–4)</label>
            <input
              id="cols"
              type="number"
              min={1}
              max={4}
              value={settings.columns}
              onChange={(event) =>
                onUpdate({
                  columns: Math.min(4, Math.max(1, Number(event.target.value))),
                })
              }
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="orientation">Tile orientation</label>
          <select
            id="orientation"
            value={settings.orientation}
            onChange={(event) =>
              onUpdate({ orientation: event.target.value as AppSettings["orientation"] })
            }
            disabled={isGerman}
          >
            <option value="portrait">Portrait (2:3)</option>
            <option value="landscape">Landscape (3:2)</option>
          </select>
          {isGerman ? (
            <div className="inline-note">
              German ID tiles are fixed to 35×45mm portrait.
            </div>
          ) : null}
        </div>
      </div>

      <div className="section-title">Layout options</div>
      <div className="control-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.safeMarginEnabled}
            onChange={(event) => onUpdate({ safeMarginEnabled: event.target.checked })}
          />
          Safe margin
        </label>
        {settings.safeMarginEnabled ? (
          <div className="field">
            <label htmlFor="margin">Margin (mm)</label>
            <input
              id="margin"
              type="number"
              min={0}
              step={0.5}
              value={settings.safeMarginMm}
              onChange={(event) => onUpdate({ safeMarginMm: Number(event.target.value) })}
            />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="spacing">Tile spacing (mm)</label>
          <input
            id="spacing"
            type="number"
            min={0}
            step={0.5}
            value={settings.spacingMm}
            onChange={(event) => onUpdate({ spacingMm: Number(event.target.value) })}
          />
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.cutGuides}
            onChange={(event) => onUpdate({ cutGuides: event.target.checked })}
          />
          Cut guides
        </label>
      </div>

      <div className="section-title">Output</div>
      <div className="control-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.rotatePaper}
            onChange={(event) => onUpdate({ rotatePaper: event.target.checked })}
          />
          Rotate paper 90°
        </label>
        <div className="field">
          <label htmlFor="quality">JPG quality ({settings.quality.toFixed(2)})</label>
          <input
            id="quality"
            type="range"
            min={0.6}
            max={1}
            step={0.01}
            value={settings.quality}
            onChange={(event) => onUpdate({ quality: Number(event.target.value) })}
          />
        </div>
        {isGerman ? (
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showIdOverlay}
              onChange={(event) => onUpdate({ showIdOverlay: event.target.checked })}
            />
            Show biometric overlay
          </label>
        ) : null}
      </div>
    </div>
  );
}

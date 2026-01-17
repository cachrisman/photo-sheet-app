# Photo Print Sheet

Client-side-only tool that turns one photo into a print-ready JPG sheet with a
user-defined grid. Designed for quick DM / Rossmann kiosk printing and German ID
photo guidance.

## Features
- Upload one image (JPG, PNG, HEIC).
- Friend Book and German ID modes with sensible defaults.
- Adjustable rows, columns, spacing, safe margins, and cut guides.
- Face-aware auto-crop with manual adjustment.
- Download a single 2:3 or 3:2 JPG ready for kiosks.

## Run locally
1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Run tests:
   - `npm run test`

## Deploy
- Static hosting:
  - `npm run build`
  - Upload the `dist` folder to any static host.
- Vercel:
  - Import the repo and use the default Vite settings.

## Printing instructions (DM / Rossmann)
- Print as 10×15 or 13×19 (2:3 ratio).
- Disable auto-crop, auto-enhancement, or "optimization" options.
- Print at 100% size; do not fit or stretch.

## German ID warnings & limitations
- The app provides warnings only and never blocks export.
- Face detection runs locally in the browser using MediaPipe (model loads from
  CDN).
- The tool does NOT verify background quality, lighting, or expression.
- Always compare with official requirements if unsure.

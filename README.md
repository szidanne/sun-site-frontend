Thought for a second


# Solar Sunspot Explorer

Interactive 3D visualization of daily solar sunspot activity, powered by the Helioviewer API.

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/szidanne/sun-site-frontend.git
npm install
```

### 2. Fetch Sunspot Data

Before you fetch, remove any old snapshot:

```bash
rm -f src/scripts/hv-events.json
```

Then run the fetch script:

```bash
node src/scripts/fetchEvents.js
```

This will:

1. Pull **Sunspot** (`SS`) events from the Helioviewer API v2
2. Extract only the keys you care about (`date`, `lat`, `lon`, `sizeRad`)
3. Write a pretty‑printed JSON array to `src/scripts/hv-events.json`

Once complete, it will be imported in the data file:

```bash
src/data/sunEvents.json
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔍 Project Structure

```
.
├── public/
│   └── textures/            # Sun maps, spot masks, etc.
├── src/
│   ├── components/
│   │   ├── CanvasControls.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SunCanvas.tsx
│   │   ├── TimelineSlider.tsx
│   │   └── DateIndicator.tsx
│   ├── data/
│   │   └── sunEvents.json   # Fetched sunspot data
│   ├── hooks/
│   │   └── useSunScene.ts   # To populate the canvas
│   ├── scripts/
│   │   ├── fetchEvents.js   # Node script to pull from Helioviewer
│   │   └── hv-events.json   # Raw output (auto‑deleted & regenerated)
│   └── utils/
│   │   ├── computeAngularRadius.ts   # Helper for sunspots sizing
│       └── geoMath.ts       # Lat/Lon → XYZ conversion
├── package.json
└── README.md
```

---

## 📖 How to Use

* **Spin Toggle** (top‑left): play/pause the Sun’s rotation.
* **Timeline** (bottom): drag or autoplay through available dates.
* **Date Indicator** (next to the slider): shows the selected date.
* **Orbit Controls** (top‑right): rotate, zoom, and pan the camera.

---

## ℹ️ Data Source

Data is fetched from the [Helioviewer API v2](https://api.helioviewer.org/). All sunspot event metadata (position, size, timestamps) is provided by NASA/SDO.

---

# FilmDot — Filmmaker's AI Toolkit & Storyboard Studio

FilmDot is a browser-based, offline-first production workspace designed for film directors, cinematographers, and screenwriters. It translates screenplay text into structured cinematic shot sequences, connects moodboard reference images, offers a stylus-friendly storyboard drawing canvas, and tracks on-set takes and wrap checklists.

---

## ✨ Features

- **AI Screenplay Breakdown**: Direct screenplay analysis powered by Google Gemini (Gemini 2.5/3.8 Flash models via `@google/genai`). Generates framing, camera movements, prime/zoom lens presets, lighting styles, color temperatures, descriptions, and character rosters.
- **Node-Based Shot Flow**: Interactive visual sequencing powered by `@xyflow/react` with persistent drag-and-drop positioning, automatic connector edges, and image moodboard attachments.
- **Stylus Storyboard Canvas**: Full HTML5 vector drawing canvas powered by Fabric.js with pressure smoothing, opacity-controlled reference underlays, undo history (`Ctrl+Z`), and multi-revision snapshots.
- **On-Set Production Tracker**: Take counter, shot completion milestones, and pre-production checklists stored locally via Dexie IndexedDB.
- **Offline PWA Capabilities**: Works fully offline on sets, studios, or remote locations with automatic local storage synchronization and standalone app installation.
- **Configurable API Settings**: Users can provide their own free Google Gemini API key via a built-in Settings modal stored locally in browser `localStorage`, with automatic fallback to environment variables.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) version 18 or higher
- npm or pnpm

### 1. Installation
Clone or extract the repository, then install project dependencies:
```bash
npm install
```

### 2. Configure Your Gemini API Key (Optional)
You can configure your Google Gemini API key in two ways:

1. **In-App (Recommended)**: Click the **Settings** gear icon in the FilmDot interface and paste your key. It is saved directly to your browser's `localStorage` and never shared with third parties.
2. **Environment File**: Create a `.env` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey)).*

### 3. Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + Vite 8 |
| Node Graph | `@xyflow/react` (React Flow) |
| Storyboard Drawing | Fabric.js v7 |
| Offline Storage | Dexie.js (IndexedDB wrapper) |
| AI Model Engine | `@google/genai` (Google Gemini) |
| Icons & Styling | Lucide React + Tailwind CSS |
| Linter & Quality | Oxlint |

---

## 📄 License

This project is licensed under the terms of the MIT License.

Copyright (c) 2026 FilmDot Contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

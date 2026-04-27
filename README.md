# E-Optimise

A VS Code extension that analyzes, visualizes, and optimizes your code using AI (Gemini/OpenAI).

## Features

- **Visualise Function** — Generate a Mermaid flowchart of your selected code
- **Get Big-O Notation** — Time & space complexity analysis with suggestions
- **Optimise Function** — Get optimized code with complexity comparison
- **Analyze Entire File** — Right-click in editor → "E-Optimise: Analyze Entire File"
- **Copy buttons** — Copy code or analysis results to clipboard
- **Status bar progress** — See analysis status in VS Code status bar
- **Syntax highlighted** code panels in the webview

All features work with AI (Gemini) and fall back to local heuristics when offline.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY
npm install
npm start
```

Backend runs on `http://localhost:3001`.

### 2. Extension

```bash
cd extension/e-optimise
npm install
# Press F5 in VS Code to launch with extension loaded
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | **Required** for AI features |
| `AI_PROVIDER` | `gemini` | `gemini`, `openai`, or `local`/`free` |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `OPENAI_API_KEY` | — | Needed if `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `AI_TIMEOUT` | `15000` | Backend API timeout (ms) |
| `PORT` | `3001` | Backend port |

## Usage

1. Open any code file in VS Code
2. Select a function/code block
3. Right-click → **E-Optimise: Analyze & Optimize Code**
4. Or use **E-Optimise: Analyze Entire File** for whole-file analysis
5. Results open in a side panel with copy buttons

## Tech Stack

- **Extension:** VS Code API (TypeScript)
- **Backend:** Node.js, Express 5
- **AI:** Google Gemini API (primary), OpenAI (optional)
- **Fallback:** Local heuristic analysis (no API needed)
- **Visualization:** Mermaid.js

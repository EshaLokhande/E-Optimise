# E-Optimise

A VS Code extension that analyzes, visualizes, and optimizes selected code using AI (Gemini).

## Features

**Visualise Function** — Generate a Mermaid flowchart of your selected code to understand its logic visually.

**Get Big-O Notation** — Analyze time and space complexity with explanations and improvement suggestions.

**Optimise Function** — Get optimized code with a comparison of complexity before/after.

## How It Works

1. Select a function/code block in VS Code
2. Right-click → **E-Optimise: Analyze & Optimize Code**
3. Choose an action from the quick pick menu
4. Results appear in a side panel

The extension sends your code to a local backend server, which uses the Gemini API for AI-powered analysis. A local fallback is used when the API is unavailable.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env  # Add your GEMINI_API_KEY
npm install
npm start
```

The backend runs on `http://localhost:3001`.

### 2. Extension

Open the `extension/e-optimise/` folder in VS Code, run `npm install`, then press F5 to launch a new VS Code window with the extension loaded.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: gemini-2.5-flash) |
| `AI_PROVIDER` | No | Set to `gemini` (default), `openai`, or `local` |
| `OPENAI_API_KEY` | For OpenAI | Only needed if AI_PROVIDER=openai |

## Tech Stack

- **Frontend:** VS Code Extension (TypeScript)
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Visualization:** Mermaid.js

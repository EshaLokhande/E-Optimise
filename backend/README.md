# E-Optimise Backend

Express 5 server providing AI-powered code analysis for the E-Optimise VS Code extension.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Simple health check |
| GET | `/api/health` | Detailed health (provider, model, key status) |
| POST | `/api/complexity` | Analyze time & space complexity |
| POST | `/api/visualise` | Generate Mermaid flowchart |
| POST | `/api/optimise` | Suggest optimized code |

All POST endpoints accept `{ code: string, language?: string }`.

## Running

```bash
cp .env.example ../.env  # or symlink
npm install
npm start
```

Requires `GEMINI_API_KEY` in `.env` (or set `AI_PROVIDER=free` for local-only).

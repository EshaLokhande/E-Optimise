const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware: allow cross-origin requests and JSON request bodies.
app.use(cors());
app.use(express.json());

// Quick endpoint to verify that backend is alive.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'E OPTIMISE server running!' });
});

// Analyze code time/space complexity using AI.
app.post('/api/complexity', async (req, res) => {
  const { code, language } = req.body;
  // Reject empty input early.
  if (!code) return res.status(400).json({ error: 'No code provided' });
  try {
    const result = await analyzeComplexity(code, language || 'javascript');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate a Mermaid flowchart description for the input code.
app.post('/api/visualise', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  try {
    const result = await generateDiagram(code, language || 'javascript');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest optimized code and explain improvements.
app.post('/api/optimise', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  try {
    const result = await optimizeCode(code, language || 'javascript');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shared OpenAI helper used by all API routes.

async function callOpenAI(systemPrompt, userPrompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing!');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    // Include upstream error payload so API clients can debug quickly.
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI API error');
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Unexpected OpenAI API response format');
  }
  return data.choices[0].message.content;
}

async function analyzeComplexity(code, language) {
  // We force strict JSON so the frontend can parse safely.
  const system = `You are an algorithm expert. Analyze code complexity.
Return ONLY valid JSON, no markdown:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "explanation": "one sentence",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;
  const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
  try { return JSON.parse(raw); }
  catch { throw new Error('AI returned invalid response'); }
}

async function generateDiagram(code, language) {
  // Mermaid text is returned as JSON, not rendered server-side.
  const system = `You are a code visualization expert.
Return ONLY valid JSON, no markdown:
{
  "mermaidCode": "flowchart TD\n  A[Start] --> B[End]",
  "explanation": "one sentence"
}`;
  const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
  try { return JSON.parse(raw); }
  catch { throw new Error('AI returned invalid response'); }
}

async function optimizeCode(code, language) {
  // Ask the model for both code output and complexity comparison.
  const system = `You are a code optimization expert.
Return ONLY valid JSON, no markdown:
{
  "optimisedCode": "the improved code",
  "improvements": ["improvement 1", "improvement 2"],
  "complexityBefore": "O(...)",
  "complexityAfter": "O(...)"
}`;
  const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
  try { return JSON.parse(raw); }
  catch { throw new Error('AI returned invalid response'); }
}

// Start HTTP server and print useful local URLs.
app.listen(PORT, () => {
  console.log('E OPTIMISE backend running');
  console.log(`http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
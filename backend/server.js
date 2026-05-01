const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });
const { saveAnalysis, getRecentAnalyses } = require('./database');

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
    saveAnalysis(code, language, 'complexity', result);
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
     saveAnalysis(code, language, 'visualise', result);
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
     saveAnalysis(code, language, 'optimise', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shared OpenAI helper used by all API routes.

async function callOpenAI(systemPrompt, userPrompt) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'free' || provider === 'local' || provider === 'fallback') {
    throw new Error('LOCAL_FALLBACK_ONLY');
  }

  if (provider === 'gemini') {
    return callGemini(systemPrompt, userPrompt);
  }

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

async function callGemini(systemPrompt, userPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing!');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) {
    throw new Error('Unexpected Gemini API response format');
  }

  return text;
}

function parseModelJson(raw) {
  const text = String(raw || '').trim();

  // Gemini/OpenAI may wrap JSON in markdown fences even when asked not to.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : text;

  try {
    return JSON.parse(candidate);
  } catch {
    // Fallback: extract first JSON object if extra text slips in.
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        throw new Error('MODEL_JSON_PARSE_FAILED');
      }
    }
    throw new Error('MODEL_JSON_PARSE_FAILED');
  }
}

async function analyzeComplexity(code, language) {
  if (useLocalFallback()) {
    return localComplexityAnalysis(code, language);
  }

  // We force strict JSON so the frontend can parse safely.
  const system = `You are an algorithm expert. Analyze code complexity.
Return ONLY valid JSON, no markdown:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "explanation": "one sentence",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;
  try {
    const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
    return parseModelJson(raw);
  } catch (error) {
    throw new Error(`AI returned invalid response: ${error.message || String(error)}`);
  }
}

async function generateDiagram(code, language) {
  if (useLocalFallback()) {
    return localDiagram(code, language);
  }

  // Mermaid text is returned as JSON, not rendered server-side.
  const system = `You are a code visualization expert.
Return ONLY valid JSON, no markdown:
{
  "mermaidCode": "flowchart TD\n  A[Start] --> B[End]",
  "explanation": "one sentence"
}`;
  try {
    const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
    return parseModelJson(raw);
  } catch (error) {
    throw new Error(`AI returned invalid response: ${error.message || String(error)}`);
  }
}

async function optimizeCode(code, language) {
  if (useLocalFallback()) {
    return localOptimization(code, language);
  }

  // Ask the model for both code output and complexity comparison.
  const system = `You are a code optimization expert.
Return ONLY valid JSON, no markdown:
{
  "optimisedCode": "the improved code",
  "improvements": ["improvement 1", "improvement 2"],
  "complexityBefore": "O(...)",
  "complexityAfter": "O(...)"
}`;
  try {
    const raw = await callOpenAI(system, `Language: ${language}\nCode:\n${code}`);
    return parseModelJson(raw);
  } catch (error) {
    const message = String(error?.message || error || '');

    // Retry once with a more compact instruction when model JSON is malformed.
    if (message.includes('MODEL_JSON_PARSE_FAILED')) {
      try {
        const retrySystem = `You are a code optimization expert.
Return ONLY minified valid JSON (single line), no markdown, no backticks.
Use escaped newlines (\\n) inside code strings.
Required keys: optimisedCode, improvements, complexityBefore, complexityAfter.`;
        const retryRaw = await callOpenAI(retrySystem, `Language: ${language}\nCode:\n${code}`);
        return parseModelJson(retryRaw);
      } catch (retryError) {
        throw new Error(`AI returned invalid response after retry: ${retryError?.message || String(retryError)}`);
      }
    }
    throw new Error(`AI returned invalid response: ${error.message || String(error)}`);
  }
}

function useLocalFallback() {
  // Explicit opt-in only: default mode is real AI responses.
  const mode = String(process.env.RESULT_MODE || 'real').toLowerCase();
  return mode === 'local';
}

function shouldFallback(error) {
  const message = String(error?.message || error || '');
  const lowered = message.toLowerCase();
  return (
    lowered.includes('insufficient_quota') ||
    lowered.includes('local_fallback_only') ||
    lowered.includes('openai_api_key missing') ||
    lowered.includes('gemini_api_key missing') ||
    lowered.includes('fetch failed') ||
    lowered.includes('econnreset') ||
    lowered.includes('etimedout') ||
    lowered.includes('enotfound') ||
    lowered.includes('socket hang up') ||
    lowered.includes('too many requests') ||
    lowered.includes('api error 429')
  );
}

function localComplexityAnalysis(code, language) {
  const loopMatches = code.match(/\b(for|while|do)\b/g) || [];
  const recursion = /function\s+([a-zA-Z_$][\w$]*)[\s\S]*\b\1\s*\(/.test(code);
  const nestedLoops = /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/.test(code);
  const usesSort = /\.sort\s*\(/.test(code);
  const usesMapFilterReduce = /\.(map|filter|reduce)\s*\(/.test(code);

  let timeComplexity = 'O(1)';
  if (nestedLoops) timeComplexity = 'O(n^2)';
  else if (usesSort) timeComplexity = 'O(n log n)';
  else if (loopMatches.length > 0 || usesMapFilterReduce || recursion) timeComplexity = 'O(n)';

  let spaceComplexity = /\b(new\s+(Array|Map|Set)|\[[^\]]*\]|\{[^}]*\})/.test(code) ? 'O(n)' : 'O(1)';
  if (recursion && spaceComplexity === 'O(1)') {
    spaceComplexity = 'O(n)';
  }

  const suggestions = [];
  if (nestedLoops) suggestions.push('Consider reducing nested loops by using a hash map or set.');
  if (usesSort) suggestions.push('If full ordering is not needed, avoid sorting to reduce runtime.');
  if (!nestedLoops && !usesSort && loopMatches.length <= 1) suggestions.push('Current implementation is already efficient for typical inputs.');

  return {
    timeComplexity,
    spaceComplexity,
    explanation: `Local heuristic analysis for ${language} code.`,
    suggestions
  };
}

function localDiagram(code) {
  const hasLoop = /\b(for|while|do)\b/.test(code);
  const hasCondition = /\bif\b/.test(code);
  const steps = [
    'flowchart TD',
    '  A[Start] --> B[Read Input]'
  ];

  if (hasCondition) {
    steps.push('  B --> C{Condition?}');
    if (hasLoop) {
      steps.push('  C -->|Yes| D[Loop Body]');
      steps.push('  D --> C');
      steps.push('  C -->|No| E[Return Result]');
    } else {
      steps.push('  C -->|Yes| D[Execute Block]');
      steps.push('  C -->|No| E[Skip Block]');
      steps.push('  D --> F[Return Result]');
      steps.push('  E --> F');
    }
  } else if (hasLoop) {
    steps.push('  B --> C[Initialize Loop]');
    steps.push('  C --> D[Process Item]');
    steps.push('  D --> C');
    steps.push('  C --> E[Return Result]');
  } else {
    steps.push('  B --> C[Execute Statements]');
    steps.push('  C --> D[Return Result]');
  }

  const lastNode = hasCondition ? (hasLoop ? 'E' : 'F') : (hasLoop ? 'E' : 'D');
  steps.push(`  ${lastNode} --> Z[End]`);

  return {
    mermaidCode: steps.join('\n'),
    explanation: 'Local fallback diagram generated using static code patterns.'
  };
}

function localOptimization(code) {
  const complexity = localComplexityAnalysis(code, 'javascript');
  const improvements = [...complexity.suggestions];
  if (improvements.length === 0) {
    improvements.push('No major optimization needed based on local heuristic checks.');
  }

  return {
    optimisedCode: code,
    improvements,
    complexityBefore: complexity.timeComplexity,
    complexityAfter: complexity.timeComplexity
  };
}

app.get('/api/history', (req, res) => {
  const analyses = getRecentAnalyses();
  res.json(analyses);
});


// Start HTTP server and print useful local URLs.
app.listen(PORT, () => {
  console.log('E OPTIMISE backend running');
  console.log(`http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
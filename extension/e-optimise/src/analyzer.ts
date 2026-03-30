import * as https from 'https';
import * as http from 'http';

// Shared shape used by the extension UI.
// Not every field is filled by every endpoint.
export interface CodeAnalysis {
    bigO: string;
    timeComplexity: string;
    spaceComplexity: string;
    patterns: string[];
    suggestions: string[];
    visualization: string;
    mermaidCode?: string;
    optimisedCode?: string;
    improvements?: string[];
}

// Generic HTTP helper for backend endpoints.
// Flow: selected code -> local backend -> OpenAI -> JSON response back to extension.
async function callBackend(endpoint: string, code: string, language: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ code, language });

        // Local backend settings.
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        // Send POST request and collect streamed response chunks.
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    reject(new Error('Invalid response from server'));
                }
            });
        });

        // Usually means backend is not running or port is blocked.
        req.on('error', () => {
            reject(new Error('Cannot connect to backend. Is server.js running?'));
        });

        req.write(data);
        req.end();
    });
}

export async function analyzeCode(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
    // /api/complexity returns time/space complexity and suggestions.
    const result = await callBackend('/api/complexity', code, language);
    return {
        // Keep bigO for backward compatibility with older UI formatting.
        bigO: result.timeComplexity || 'O(n)',
        timeComplexity: result.timeComplexity || 'O(n)',
        spaceComplexity: result.spaceComplexity || 'O(1)',
        patterns: [],
        suggestions: result.suggestions || [],
        visualization: result.explanation || ''
    };
}

export async function generateDiagram(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
    // /api/visualise returns Mermaid graph + human explanation.
    const result = await callBackend('/api/visualise', code, language);
    return {
        bigO: '',
        timeComplexity: '',
        spaceComplexity: '',
        patterns: [],
        suggestions: [],
        visualization: result.explanation || '',
        mermaidCode: result.mermaidCode || ''
    };
}

export async function optimizeCode(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
    // /api/optimise returns suggested improvements and optimized code.
    const result = await callBackend('/api/optimise', code, language);
    return {
        bigO: '',
        timeComplexity: '',
        spaceComplexity: '',
        patterns: [],
        suggestions: result.improvements || [],
        visualization: '',
        optimisedCode: result.optimisedCode || ''
    };
}

export function generateOptimizationCode(code: string): string {
    // Placeholder: currently returns original input unchanged.
    return code;
}

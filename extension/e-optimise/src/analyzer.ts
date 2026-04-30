import * as http from 'http';

// Shared shape used by the extension UI.
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

const BACKEND_TIMEOUT = parseInt(process.env?.E_OPTIMISE_TIMEOUT || '20000', 10);

// Generic HTTP helper for backend endpoints with timeout handling.
async function callBackend(endpoint: string, code: string, language: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ code, language });

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

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    const statusCode = res.statusCode || 500;

                    if (statusCode >= 400) {
                        reject(new Error(parsed.error || `Backend error ${statusCode}`));
                        return;
                    }

                    if (parsed.error) {
                        reject(new Error(parsed.error));
                        return;
                    }

                    resolve(parsed);
                } catch {
                    const statusCode = res.statusCode || 500;
                    if (statusCode >= 400) {
                        reject(new Error(`Backend error ${statusCode}: ${body}`));
                        return;
                    }
                    reject(new Error('Invalid response from server'));
                }
            });
        });

        req.setTimeout(BACKEND_TIMEOUT, () => {
            req.destroy();
            reject(new Error('Backend request timed out. Is the server running (port 3001)?'));
        });

        req.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error('Cannot connect to backend. Start server: cd backend && npm start'));
            } else {
                reject(new Error(`Connection error: ${err.message}`));
            }
        });

        req.write(data);
        req.end();
    });
}

export async function analyzeCode(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
    const result = await callBackend('/api/complexity', code, language);
    return {
        bigO: result.timeComplexity || 'O(n)',
        timeComplexity: result.timeComplexity || 'O(n)',
        spaceComplexity: result.spaceComplexity || 'O(1)',
        patterns: [],
        suggestions: result.suggestions || [],
        visualization: result.explanation || ''
    };
}

export async function generateDiagram(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
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
    return code;
}

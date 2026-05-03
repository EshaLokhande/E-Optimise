"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCode = analyzeCode;
exports.generateDiagram = generateDiagram;
exports.optimizeCode = optimizeCode;
exports.generateOptimizationCode = generateOptimizationCode;
exports.fetchAnalysisHistory = fetchAnalysisHistory;
const http = __importStar(require("http"));
const BACKEND_TIMEOUT = parseInt(process.env?.E_OPTIMISE_TIMEOUT || '20000', 10);
// Generic HTTP helper for backend endpoints with timeout handling.
async function callBackend(endpoint, code, language) {
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
                }
                catch {
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
        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error('Cannot connect to backend. Start server: cd backend && npm start'));
            }
            else {
                reject(new Error(`Connection error: ${err.message}`));
            }
        });
        req.write(data);
        req.end();
    });
}
async function analyzeCode(code, language = 'javascript') {
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
async function generateDiagram(code, language = 'javascript') {
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
async function optimizeCode(code, language = 'javascript') {
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
function generateOptimizationCode(code) {
    return code;
}
async function fetchAnalysisHistory(limit = 20) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3001/api/analyses?limit=${limit}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (!Array.isArray(parsed)) {
                        reject(new Error('Invalid history response from server'));
                        return;
                    }
                    resolve(parsed);
                }
                catch {
                    reject(new Error('Invalid response from server'));
                }
            });
        });
        req.setTimeout(BACKEND_TIMEOUT, () => {
            req.destroy();
            reject(new Error('Backend request timed out. Is the server running (port 3001)?'));
        });
        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error('Cannot connect to backend. Start server: cd backend && npm start'));
            }
            else {
                reject(new Error(`Connection error: ${err.message}`));
            }
        });
    });
}
//# sourceMappingURL=analyzer.js.map
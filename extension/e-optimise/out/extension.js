"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = o;
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const analyzer_1 = require("./analyzer");
function activate(context) {
    // Register the command declared in package.json.
    let disposable = vscode.commands.registerCommand('e-optimise.helloWorld', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No editor active!');
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select a function first!');
            return;
        }
        const language = editor.document.languageId;
        const choice = await vscode.window.showQuickPick([
            { label: '$(lightbulb) Visualise Function', description: 'Generate a Mermaid flowchart of the selected code' },
            { label: '$(symbol-ruler) Get Big-O Notation', description: 'Analyze time & space complexity' },
            { label: '$(tools) Optimise Function', description: 'Get suggestions and improved code' }
        ], { placeHolder: 'What do you want to do?' });
        if (!choice)
            return;
        vscode.window.showInformationMessage('\u23f3 Analysing with AI...');
        try {
            if (choice.label === '$(lightbulb) Visualise Function') {
                const result = await (0, analyzer_1.generateDiagram)(selectedText, language);
                showPanel(selectedText, result.visualization, result.mermaidCode || '', 'Visualization');
            }
            if (choice.label === '$(symbol-ruler) Get Big-O Notation') {
                const result = await (0, analyzer_1.analyzeCode)(selectedText, language);
                const analysis = [
                    `\u23f1\ufe0f Time Complexity: ${result.timeComplexity}`,
                    `\ud83d\udcbe Space Complexity: ${result.spaceComplexity}`,
                    ``,
                    `\ud83d\udcd6 Explanation: ${result.visualization}`,
                    ``,
                    `\ud83d\udca1 Suggestions:`,
                    ...result.suggestions.map(s => `  \u2022 ${s}`)
                ].join('\n');
                showPanel(selectedText, analysis, '', 'Big-O Analysis');
            }
            if (choice.label === '$(tools) Optimise Function') {
                const result = await (0, analyzer_1.optimizeCode)(selectedText, language);
                const analysis = [
                    `\ud83d\udca1 Improvements:`,
                    ...result.suggestions.map(s => `  \u2022 ${s}`),
                    ``,
                    `\u2728 Optimised Code:`,
                    result.optimisedCode || 'No optimisation needed!'
                ].join('\n');
                showPanel(selectedText, analysis, '', 'Optimisation');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
function showPanel(original, analysis, mermaidCode, title) {
    const panel = vscode.window.createWebviewPanel('e-optimise-analysis', `E-Optimise: ${title}`, vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = getWebviewContent(original, analysis, mermaidCode, title);
}
function getWebviewContent(code, analysis, mermaidCode, title) {
    return `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<style>
			body { font-family: sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
			h1 { color: #4ec9b0; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
			h2 { color: #9cdcfe; margin-top: 20px; }
			.code { background: #252526; border-left: 3px solid #007acc; padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
			.analysis { background: #2d2d30; padding: 15px; border-radius: 4px; white-space: pre-wrap; }
		</style>
		<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
	</head>
	<body>
		<h1>\u26a1 ${title}</h1>
		<h2>Your Code:</h2>
		<div class="code">${escapeHtml(code)}</div>
		<h2>Analysis:</h2>
		<div class="analysis">${escapeHtml(analysis)}</div>
		${mermaidCode ? `<h2>Diagram:</h2><div class="mermaid">${mermaidCode}</div>` : ''}
		<script>mermaid.initialize({startOnLoad:true, theme:'dark'});</script>
	</body>
	</html>`;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map

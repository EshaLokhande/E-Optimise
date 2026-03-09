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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const analyzer_1 = require("./analyzer");
function activate(context) {
    let disposable = vscode.commands.registerCommand('e-optimise.helloWorld', async () => {
        // Get selected text from editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No editor active. Select code first!');
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('No code selected. Select a function or code block first!');
            return;
        }
        // Show menu with 3 options
        const choice = await vscode.window.showQuickPick(['⚡ Visualise Function', '📊 Get Big-O Notation', '🔧 Optimise Function'], { placeHolder: 'What do you want to do with this function?' });
        if (!choice)
            return;
        // Analyze the code
        const analysis = (0, analyzer_1.analyzeCode)(selectedText);
        if (choice === '⚡ Visualise Function') {
            const steps = [
                `📍 Visualization: ${analysis.visualization}`,
                `⏱️ Time Complexity: ${analysis.bigO}`,
                `💾 Space Complexity: ${analysis.spaceComplexity}`,
                '',
                'Patterns detected:',
                analysis.patterns.length > 0 ? analysis.patterns.map(p => `  • ${p}`).join('\n') : '  • No specific patterns',
                '',
                'Suggestions:',
                analysis.suggestions.length > 0 ? analysis.suggestions.map(s => `  • ${s}`).join('\n') : '  • Code looks good!'
            ].join('\n');
            vscode.window.showInformationMessage(`${analysis.bigO} complexity detected`);
            showPanel(selectedText, steps, 'Visualization');
        }
        if (choice === '📊 Get Big-O Notation') {
            const result = [
                `⏱️ Time Complexity: ${analysis.bigO}`,
                `💾 Space Complexity: ${analysis.spaceComplexity}`,
                '',
                'Patterns Found:',
                analysis.patterns.length > 0 ? analysis.patterns.map(p => `  • ${p}`).join('\n') : '  • Linear execution',
                '',
                'Visualization:',
                `  ${analysis.visualization}`
            ].join('\n');
            vscode.window.showInformationMessage(`Big-O: ${analysis.bigO}`);
            showPanel(selectedText, result, 'Big-O Analysis');
        }
        if (choice === '🔧 Optimise Function') {
            const optimized = (0, analyzer_1.generateOptimizationCode)(selectedText);
            const result = [
                `Current Complexity: ${analysis.bigO}`,
                `Space Complexity: ${analysis.spaceComplexity}`,
                '',
                'Optimization Suggestions:',
                analysis.suggestions.length > 0 ? analysis.suggestions.map(s => `  • ${s}`).join('\n') : '  • Code is already optimal!',
                '',
                'Optimized Pattern:',
                optimized
            ].join('\n');
            vscode.window.showInformationMessage('Check panel for optimization suggestions');
            showPanel(selectedText, result, 'Optimization Suggestions');
        }
    });
    context.subscriptions.push(disposable);
}
function showPanel(original, analysis, title) {
    const panel = vscode.window.createWebviewPanel('e-optimise-analysis', `E-Optimise: ${title}`, vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = getWebviewContent(original, analysis, title);
}
function getWebviewContent(code, analysis, title) {
    return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
					padding: 20px;
					background: #1e1e1e;
					color: #d4d4d4;
					line-height: 1.6;
				}
				h1 {
					color: #4ec9b0;
					border-bottom: 2px solid #007acc;
					padding-bottom: 10px;
				}
				h2 {
					color: #9cdcfe;
					margin-top: 20px;
				}
				.code {
					background: #252526;
					border-left: 3px solid #007acc;
					padding: 12px;
					margin: 10px 0;
					border-radius: 4px;
					font-family: 'Courier New', monospace;
					overflow-x: auto;
					font-size: 12px;
				}
				.analysis {
					background: #2d2d30;
					padding: 15px;
					border-radius: 4px;
					margin: 15px 0;
				}
				.success { color: #4ec9b0; }
				.warning { color: #ce9178; }
				.info { color: #569cd6; }
			</style>
		</head>
		<body>
			<h1>${title}</h1>
			
			<h2>Your Code:</h2>
			<div class="code">${escapeHtml(code)}</div>
			
			<h2>Analysis:</h2>
			<div class="analysis">
				${escapeHtml(analysis).replace(/\n/g, '<br>')}
			</div>
		</body>
		</html>
	`;
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
;
//# sourceMappingURL=extension.js.map
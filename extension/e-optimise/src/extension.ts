import * as vscode from 'vscode';
import { analyzeCode, generateDiagram, optimizeCode } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
	// Register the command declared in package.json.
	// This callback runs when user chooses "E-Optimise: Analyze & Optimize Code".
	let disposable = vscode.commands.registerCommand('e-optimise.helloWorld', async () => {
		// Read current editor and currently selected code.
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

		// Pass editor language to backend so prompts can be language-aware.
		const language = editor.document.languageId;

		// Ask user which action they want for the selected code.
		const choice = await vscode.window.showQuickPick(
			['⚡ Visualise Function', '📊 Get Big-O Notation', '🔧 Optimise Function'],
			{ placeHolder: 'What do you want to do?' }
		);

		if (!choice) return;

		// Show loading message
		vscode.window.showInformationMessage('⏳ Analysing with AI...');

		try {
			if (choice === '⚡ Visualise Function') {
				// Request Mermaid diagram + explanation from backend.
				const result = await generateDiagram(selectedText, language);
				showPanel(selectedText, result.visualization, result.mermaidCode || '', 'Visualization');
			}

			if (choice === '📊 Get Big-O Notation') {
				// Request complexity analysis and shape it into readable text.
				const result = await analyzeCode(selectedText, language);
				const analysis = [
					`⏱️ Time Complexity: ${result.timeComplexity}`,
					`💾 Space Complexity: ${result.spaceComplexity}`,
					``,
					`📖 Explanation: ${result.visualization}`,
					``,
					`💡 Suggestions:`,
					...result.suggestions.map(s => `  • ${s}`)
				].join('\n');
				showPanel(selectedText, analysis, '', 'Big-O Analysis');
			}

			if (choice === '🔧 Optimise Function') {
				// Request optimization suggestions and possible improved code.
				const result = await optimizeCode(selectedText, language);
				const analysis = [
					`💡 Improvements:`,
					...result.suggestions.map(s => `  • ${s}`),
					``,
					`✨ Optimised Code:`,
					result.optimisedCode || 'No optimisation needed!'
				].join('\n');
				showPanel(selectedText, analysis, '', 'Optimisation');
			}

		} catch (error: any) {
			// Surface backend/network/model errors in VS Code UI.
			vscode.window.showErrorMessage(`Error: ${error.message}`);
		}
	});

	context.subscriptions.push(disposable);
}

function showPanel(original: string, analysis: string, mermaidCode: string, title: string) {
	// Open webview beside the current editor.
	const panel = vscode.window.createWebviewPanel(
		'e-optimise-analysis',
		`E-Optimise: ${title}`,
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);
	// Inject HTML content with escaped code/analysis.
	panel.webview.html = getWebviewContent(original, analysis, mermaidCode, title);
}

function getWebviewContent(code: string, analysis: string, mermaidCode: string, title: string): string {
	// Mermaid library renders flowchart text returned by backend.
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
		<h1>⚡ ${title}</h1>
		<h2>Your Code:</h2>
		<div class="code">${escapeHtml(code)}</div>
		<h2>Analysis:</h2>
		<div class="analysis">${escapeHtml(analysis)}</div>
		${mermaidCode ? `<h2>Diagram:</h2><div class="mermaid">${mermaidCode}</div>` : ''}
		<script>mermaid.initialize({startOnLoad:true, theme:'dark'});</script>
	</body>
	</html>`;
}

function escapeHtml(text: string): string {
	// Prevent HTML/script injection when showing user-selected code.
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function deactivate() { }

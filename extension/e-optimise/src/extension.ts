import * as vscode from 'vscode';
import { analyzeCode, generateOptimizationCode } from './analyzer';

export function activate(context: vscode.ExtensionContext) {

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
		const choice = await vscode.window.showQuickPick(
			['⚡ Visualise Function', '📊 Get Big-O Notation', '🔧 Optimise Function'],
			{ placeHolder: 'What do you want to do with this function?' }
		);

		if (!choice) return;

		// Analyze the code
		const analysis = analyzeCode(selectedText);

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
			const optimized = generateOptimizationCode(selectedText);
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

function showPanel(original: string, analysis: string, title: string) {
	const panel = vscode.window.createWebviewPanel(
		'e-optimise-analysis',
		`E-Optimise: ${title}`,
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	panel.webview.html = getWebviewContent(original, analysis, title);
}

function getWebviewContent(code: string, analysis: string, title: string): string {
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

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function deactivate() { };
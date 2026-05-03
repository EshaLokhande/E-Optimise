import * as vscode from 'vscode';
import { analyzeCode, fetchAnalysisHistory, generateDiagram, optimizeCode } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
	// Command: analyze selected code
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
		await handleAnalysis(selectedText, language);
	});

	// Command: analyze entire file
	let fileDisposable = vscode.commands.registerCommand('e-optimise.analyzeFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No editor active!');
			return;
		}

		const fullText = editor.document.getText();
		const language = editor.document.languageId;
		const lineCount = editor.document.lineCount;

		await handleAnalysis(fullText, language, {
			metrics: `Lines: ${lineCount} | Language: ${language}`
		});
	});

	let historyDisposable = vscode.commands.registerCommand('e-optimise.viewHistory', async () => {
		try {
			const records = await fetchAnalysisHistory(20);
			showHistoryPanel(records);
		} catch (error: any) {
			vscode.window.showErrorMessage(`E-Optimise Error: ${error.message}`);
		}
	});

	context.subscriptions.push(disposable, fileDisposable, historyDisposable);
}

async function handleAnalysis(
	code: string,
	language: string,
	extra?: { metrics?: string }
) {
	const choice = await vscode.window.showQuickPick(
		[
			{ label: '$(lightbulb) Visualise Function', description: 'Generate a Mermaid flowchart of the selected code' },
			{ label: '$(symbol-ruler) Get Big-O Notation', description: 'Analyze time & space complexity' },
			{ label: '$(tools) Optimise Function', description: 'Get suggestions and improved code' },
			{ label: '$(history) View Analysis History', description: 'View recent analyses stored in SQLite' }
		],
		{ placeHolder: 'What do you want to do?' }
	);

	if (!choice) return;

	// Show progress in the VS Code status bar
	const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusItem.text = '$(sync~spin) E-Optimise: Analysing...';
	statusItem.tooltip = 'Analysing code with AI';
	statusItem.show();

	try {
		if (choice.label === '$(lightbulb) Visualise Function') {
			const result = await generateDiagram(code, language);
			showPanel(code, result.visualization, result.mermaidCode || '', 'Visualization', extra);
		}

		if (choice.label === '$(symbol-ruler) Get Big-O Notation') {
			const result = await analyzeCode(code, language);
			const analysis = [
				`\u23f1\ufe0f Time Complexity: ${result.timeComplexity}`,
				`\ud83d\udcbe Space Complexity: ${result.spaceComplexity}`,
				``,
				`\ud83d\udcd6 Explanation: ${result.visualization}`,
				``,
				`\ud83d\udca1 Suggestions:`,
				...result.suggestions.map(s => `  \u2022 ${s}`)
			].join('\n');
			showPanel(code, analysis, '', 'Big-O Analysis', extra);
		}

		if (choice.label === '$(tools) Optimise Function') {
			const result = await optimizeCode(code, language);
			const analysis = [
				`\ud83d\udca1 Improvements:`,
				...result.suggestions.map(s => `  \u2022 ${s}`),
				``,
				`\u2728 Optimised Code:`,
				result.optimisedCode || 'No optimisation needed!'
			].join('\n');
			showPanel(code, analysis, '', 'Optimisation', extra);
		}

		if (choice.label === '$(history) View Analysis History') {
			const records = await fetchAnalysisHistory(20);
			showHistoryPanel(records);
		}

	} catch (error: any) {
		vscode.window.showErrorMessage(`E-Optimise Error: ${error.message}`);
	} finally {
		statusItem.dispose();
	}
}

function showHistoryPanel(records: Array<{ id: number; type: string; language: string; created_at: string; result: string; code: string }>) {
	const panel = vscode.window.createWebviewPanel(
		'e-optimise-history',
		'E-Optimise: Analysis History',
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	const rows = records.map((r) => {
		let preview = '';
		try {
			const parsed = JSON.parse(r.result);
			preview = JSON.stringify(parsed).slice(0, 180);
		} catch {
			preview = String(r.result).slice(0, 180);
		}
		return `
		<tr>
			<td>${r.id}</td>
			<td>${escapeHtml(r.type)}</td>
			<td>${escapeHtml(r.language)}</td>
			<td>${escapeHtml(r.created_at)}</td>
			<td><pre>${escapeHtml(preview)}</pre></td>
		</tr>`;
	}).join('');

	panel.webview.html = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #d4d4d4; background: #1e1e1e; }
			table { width: 100%; border-collapse: collapse; }
			th, td { border: 1px solid #333; padding: 8px; text-align: left; vertical-align: top; }
			th { background: #2d2d30; }
			pre { margin: 0; white-space: pre-wrap; font-size: 12px; }
		</style>
	</head>
	<body>
		<h2>Recent Analyses (${records.length})</h2>
		<table>
			<thead>
				<tr><th>ID</th><th>Type</th><th>Language</th><th>Created</th><th>Result Preview</th></tr>
			</thead>
			<tbody>${rows || '<tr><td colspan="5">No saved analyses found.</td></tr>'}</tbody>
		</table>
	</body>
	</html>`;
}

function showPanel(
	original: string,
	analysis: string,
	mermaidCode: string,
	title: string,
	extra?: { metrics?: string }
) {
	const panel = vscode.window.createWebviewPanel(
		'e-optimise-analysis',
		`E-Optimise: ${title}`,
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);
	panel.webview.html = getWebviewContent(original, analysis, mermaidCode, title, extra);

	// Handle messages from webview (copy button)
	panel.webview.onDidReceiveMessage(
		message => {
			if (message.command === 'copy') {
				vscode.env.clipboard.writeText(message.text);
				vscode.window.showInformationMessage('Copied to clipboard!');
			}
		},
		undefined,
		[]
	);
}

function getWebviewContent(
	code: string,
	analysis: string,
	mermaidCode: string,
	title: string,
	extra?: { metrics?: string }
): string {
	const escapedCode = escapeHtml(code);
	const escapedAnalysis = escapeHtml(analysis);
	const metricsHtml = extra?.metrics
		? `<div class="metrics">${escapeHtml(extra.metrics)}</div>`
		: '';

	return `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src https://cdn.jsdelivr.net; img-src data:;">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; line-height: 1.6; }
			h1 { color: #4ec9b0; border-bottom: 2px solid #007acc; padding-bottom: 10px; display: flex; align-items: center; gap: 8px; }
			h2 { color: #9cdcfe; margin-top: 24px; display: flex; align-items: center; gap: 6px; }
			.metrics { background: #2d2d30; padding: 8px 14px; border-radius: 4px; font-size: 13px; color: #888; margin-bottom: 16px; }
			.code { background: #252526; border-left: 4px solid #569cd6; padding: 16px; border-radius: 4px; font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; font-size: 13px; white-space: pre-wrap; overflow-x: auto; }
			.analysis { background: #2d2d30; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 14px; }
			.toolbar { display: flex; gap: 8px; margin: 12px 0; }
			.toolbar button { background: #0e639c; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 12px; }
			.toolbar button:hover { background: #1177bb; }
			.loading { display: none; text-align: center; padding: 40px; }
			.loading .spinner { border: 3px solid #333; border-top: 3px solid #4ec9b0; border-radius: 50%; width: 32px; height: 32px; margin: 0 auto 12px; }
			@keyframes spin { to { transform: rotate(360deg); } }
			.section { margin-bottom: 20px; }
		</style>
	</head>
	<body>
		<div class="loading" id="loading">
			<div class="spinner" style="animation: spin 1s linear infinite;"></div>
			<p>Analysing code...</p>
		</div>
		<div id="content">
			<h1>\u26a1 ${escapeHtml(title)}</h1>
			${metricsHtml}
			<div class="section">
				<h2>\ud83d\udcc4 Your Code</h2>
				<div class="toolbar">
					<button onclick="copyCode()">\ud83d\udccb Copy Code</button>
				</div>
				<div class="code">${escapedCode}</div>
			</div>
			<div class="section">
				<h2>\ud83d\udd0d Analysis</h2>
				<div class="toolbar">
					<button onclick="copyAnalysis()">\ud83d\udccb Copy Analysis</button>
				</div>
				<div class="analysis">${escapedAnalysis}</div>
			</div>
			${mermaidCode ? `<div class="section">
				<h2>\ud83d\udcca Diagram</h2>
				<div class="mermaid">${escapeHtml(mermaidCode)}</div>
			</div>` : ''}
		</div>
		<script>
			const vscode = acquireVsCodeApi();
			function copyCode() {
				vscode.postMessage({ command: 'copy', text: ${JSON.stringify(code)} });
			}
			function copyAnalysis() {
				vscode.postMessage({ command: 'copy', text: ${JSON.stringify(analysis)} });
			}
		</script>
		<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
		<script>
			mermaid.initialize({ startOnLoad: true, theme: 'dark' });
		</script>
	</body>
	</html>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function deactivate() { }

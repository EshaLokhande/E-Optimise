const vscode = require('vscode'); //// We import VS Code's built-in tools

// activate() runs when your extension starts
// context = information about your extension
function activate(context) {
	// (This is like saying "when someone orders this item, do THIS")
    // First part  → the command's unique ID
    // Second part → what to DO when command runs
	let disposable = vscode.commands.registerCommand('eoptimise.start', function () {
		// showInformationMessage shows a popup at the bottom of VS Code    
		vscode.window.showInformationMessage('E-optimise is working');
	});
	context.subscriptions.push(disposable);
}
// deactivate() runs when VS Code closes your extension
function deactivate() {}

// This exports our functions so VS Code can find and run them
module.exports = { activate, deactivate };
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import OpenAI from "openai"


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsrag" is now active!');
	
	const userApiKey = vscode.workspace.getConfiguration('vsrag').get('openaiApiKey');
    if (!userApiKey) {
        promptForApiKey();
    }
	const openai = new OpenAI({
		apiKey: userApiKey,
	}
	);


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsrag.insertTextFromLLM', async function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const currentPosition = editor.selection.active;
			const userPrompt = await vscode.window.showInputBox({ prompt: 'Enter your prompt for the LLM' });
			if (!userPrompt){
				return;
			}

			try {
				const response = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							'role': 'system', 
							'content': 
							` 
							Respond to the following user code-related questions with direct 
							and concise answers. Do not include any introductory phrases, 
							commentary, or additional explanations.
							
							Example:
							User: write a function that generates the fibonacci sequence
							Response: 
							def fibonacci(num):
								fib_seq = [0, 1]
								for i in range(2, num):
									fib_seq.append(fib_seq[i-1] + fib_seq[i-2])
								return fib_seq
							
							Example:
							User: Check if the string date includes 2023
							Response: date.includes('2023')
							
							Example:
							User: Convert a nums into a comma-separated string.
							Response: ','.join(map(str, nums))` 
						}, 
						{
							'role': 'user',
							'content': userPrompt
						}
					],
				});

				editor.edit(editBuilder => {
					editBuilder.insert(currentPosition, response.choices[0].message.content);
				});
			} catch (error) {
				console.error('Error calling OpenAI:', error['message']);
				vscode.window.showErrorMessage('Failed to call OpenAI API.');
				vscode.window.showErrorMessage(userApiKey);
			}
		}
	});
	
	context.subscriptions.push(disposable);
}

function promptForApiKey() {
	vscode.window.showInputBox({
	prompt: "Enter your OpenAI API Key",
	placeHolder: "API Key",
	ignoreFocusOut: true
	}).then(apiKey => {
	if (apiKey) {
	// Save the API key in the global state or settings
	vscode.workspace.getConfiguration().update('vsrag.openaiApiKey', apiKey, true);
	vscode.window.showInformationMessage("API Key saved! You can change it in the settings.");
	}
	});
	}
// This method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from 'vscode';
import { GraphPanel } from '../panel/GraphPanel';
import { getClient } from '../utils/lspClientApi';

export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('impact.showImportGraph', async () => {
      const panel = GraphPanel.show(context);
      // Ask server for mock graph (Stage 03)
      try {
        const client = getClient();
        const data = await client.sendRequest('impact/getImportGraph', { language: 'python', maxFiles: 50 });
        panel.postMessage({ type: 'render:graph', payload: data });
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to get import graph: ${err}`);
      }
    })
  );
}

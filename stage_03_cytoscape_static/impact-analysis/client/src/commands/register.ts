import { commands, ExtensionContext, window, OutputChannel } from 'vscode';
import { GraphPanel } from '../panel/GraphPanel';
import { getClient } from '../utils/lspClientApi';


export function registerCommands(context: ExtensionContext, output: OutputChannel) {
  const out = output!;

  context.subscriptions.push(
    commands.registerCommand('impact.showImportGraph', async () => {
      const panel = GraphPanel.show(context, out);
      // Ask server for mock graph (Stage 03)
      try {
        const client = getClient();
        const t0 = Date.now();
        const data = await client.sendRequest('impact/getImportGraph', { language: 'python', maxFiles: 50 });
        const dt = Date.now() - t0;

        await panel.whenReady?.();
        panel.postMessage({ type: 'render:graph', payload: data });
      } catch (err) {
        window.showErrorMessage(`Failed to get import graph: ${err}`);
      }
    })
  );

context.subscriptions.push(
  commands.registerCommand('impact.exportGraphPng', async () => {
    const panel = GraphPanel.current ?? GraphPanel.show(context, out);
    await panel.whenReady?.();
    panel.postMessage({ type: 'export:png' });
  }),
  commands.registerCommand('impact.exportGraphSvg', async () => {
    const panel = GraphPanel.current ?? GraphPanel.show(context, out);
    await panel.whenReady?.();
    panel.postMessage({ type: 'export:svg' });
  }),
);



}

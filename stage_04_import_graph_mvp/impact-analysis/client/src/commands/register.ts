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
        const params = { language: 'auto', maxFiles: 400 };
        console.log(`Requesting import graph from server..., params: ${JSON.stringify(params)}`);
        const graph = await client.sendRequest('impact/getImportGraph', params);
        const dt = Date.now() - t0;
        console.log(`Received import graph from server in ${dt} ms`);
        await panel.whenReady?.();
        panel.postMessage({ type: 'render:graph', payload: graph });
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

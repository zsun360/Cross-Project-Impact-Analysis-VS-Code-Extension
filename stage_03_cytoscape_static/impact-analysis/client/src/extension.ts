/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  window,
  ExtensionContext,
  commands,
  OutputChannel,
  WebviewPanel,
  ViewColumn,
  Uri,
  ExtensionMode
} from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

import * as fs from 'fs';

import { setClient } from './utils/lspClientApi';
import { registerCommands } from './commands/register';

let client: LanguageClient;
let output: OutputChannel;

export async function activate(context: ExtensionContext) {
  const isDev = context.extensionMode === ExtensionMode.Development;

  const build = context.extension?.packageJSON?.version ?? 'dev';

  output = window.createOutputChannel("Impact");

  // The server is implemented in node
  const serverModule = Uri.joinPath(
  context.extensionUri, '..', 'server', 'out', 'server.js'
).fsPath;

// 加一个存在性检查
  if (!fs.existsSync(serverModule)) {
    output.appendLine(`Server entry not found: ${serverModule}`);
    window.showErrorMessage(`Server entry not found: ${serverModule}`);
    return;
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "plaintext" }],
    initializationOptions: { debug: isDev, build },
    synchronize: {},
  };

  // Start the client. This will also launch the server
  client = new LanguageClient(
    "impactAnalysisServer",
    "Impact Analysis Server",
    serverOptions,
    clientOptions
  );
  
  // Start the client and expose it to Webview commands
  await client.start();
  setClient(client);
  context.subscriptions.push(client);

  // Register the impact.ping commands to ping LSP Server
  context.subscriptions.push(
    commands.registerCommand("impact.ping", async() => {
      try {
        const res = await client?.sendRequest("impact/ping");
        output.appendLine(`[impact/ping] ${JSON.stringify(res)}`);
        window.showInformationMessage("[impact/ping] sent. See Output: Impact");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.appendLine(`[impact/ping][error] ${message}`);
        window.showErrorMessage("Ping failed. See Output: Impact");
      }
    })
  );

  // Register the impact.openGraphView commands to open the Webview
  context.subscriptions.push(
    commands.registerCommand("impact.openGraphView", async () => {
      ImpactGraphPanel.createOrShow(context);
    })
  );
  // Register UI commands (e.g., Impact: Show Import Graph)
  registerCommands(context, output);

  // Optional: show ready info
  window.setStatusBarMessage('Impact Analysis: ready', 3000);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

// —— a Simple Webview implementation(in fact, it's not easy... ) ——
class ImpactGraphPanel {
  public static currentPanel: ImpactGraphPanel | undefined;
  private constructor(
    private readonly panel: WebviewPanel,
    private readonly context: ExtensionContext
  ) {
    this.panel.onDidDispose(() => (ImpactGraphPanel.currentPanel = undefined));
    this.render();
  }

  static createOrShow(context: ExtensionContext) {
    if (ImpactGraphPanel.currentPanel) {
      ImpactGraphPanel.currentPanel.panel.reveal();
      return;
    }
    const panel = window.createWebviewPanel(
      "impactGraph",
      "Impact Graph",
      ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    ImpactGraphPanel.currentPanel = new ImpactGraphPanel(panel, context);
  }

  private render() {
    const webview = this.panel.webview;
    const nonce = getNonce();
    this.panel.webview.html = /* html */ `
<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Impact Graph</title>
<style>
body { font-family: ui-sans-serif, system-ui; padding: 12px; }
.card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
#root { height: 300px; display: grid; place-items: center; color: #555; }
</style>
</head>
<body>
<div class="card">
<h2>Impact Graph (Hello Webview)</h2>
<div id="root">Webview is alive. Ping your server and plug graph later.</div>
<button id="btn">Send Ping</button>
<pre id="log"></pre>
</div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const btn = document.getElementById('btn');
const log = document.getElementById('log');
btn.addEventListener('click', () => {
vscode.postMessage({ type: 'ping' });
});
window.addEventListener('message', (event) => {
const msg = event.data;
if (msg?.type === 'pong') {
log.textContent = JSON.stringify(msg.payload, null, 2);
}
});
</script>
</body>
</html>`;

    // 处理 Webview -> Extension 的消息
    webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "ping") {
        const res = await client?.sendRequest("impact/ping");
        this.panel.webview.postMessage({ type: "pong", payload: res });
      }
    });
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

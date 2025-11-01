import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Webview host with message bridge

/**
+ * GraphPanel (Stage 03) — patch A
+ * - Keeps ready-handshake
+ * - Adds safe 'openInEditor' handling: only open when id resolves to an existing local file
+ * - Soft info message for demo nodes (mock data without real files)
+*/

export class GraphPanel {
  public static current: GraphPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private _readyResolve!: () => void;
  private _readyPromise: Promise<void>;
  private output: vscode.OutputChannel;

  static show(context: vscode.ExtensionContext, output: vscode.OutputChannel) {
    const column = vscode.ViewColumn.Beside;
    if (GraphPanel.current) {
      GraphPanel.current.panel.reveal(column);
      return GraphPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      'impactGraph',
      'Impact — Import Graph',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // (Optional) narrow this to the webview folder if you like:
        // Use context.extensionUri with Uri.joinPath — not extensionPath 
        // Modern & cross-platform: extensionUri is the canonical root. Uri.joinPath handles separators and URI schemes correctly (Windows/Unix, remote, virtual FS).
        // Future-proof: extensionPath is the old string API; it’s kept for compatibility but the recommended pattern is URI-based.
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview')]
      }
    );

    GraphPanel.current = new GraphPanel(panel, context, output);
    return GraphPanel.current;
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, output: vscode.OutputChannel) {
    this.panel = panel;
    this.output = output;
    this._readyPromise = new Promise<void>(res => (this._readyResolve = res));
  
    const base = vscode.Uri.joinPath(
      context.extensionUri, 'src', 'webview');

    const htmlPath   = vscode.Uri.joinPath(base, 'graph.html'); 

      // 加一个存在性检查
      if (!fs.existsSync(htmlPath.fsPath)) {
        vscode.window.showErrorMessage(`HTML entry not found: ${htmlPath}`);
        return;
      }

    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

    const cytoPath   = vscode.Uri.joinPath(base, 'vendor', 'cytoscape.min.js');
    const graphJsPath = vscode.Uri.joinPath(base, 'graph.js');

    const cytoJsUri  = this.panel.webview.asWebviewUri(cytoPath);
    const graphJsUri = this.panel.webview.asWebviewUri(graphJsPath);

    html = html
      .replace(/\{\{cspSource\}\}/g, this.panel.webview.cspSource)
      .replace(/\{\{cytoJsUri\}\}/g, String(cytoJsUri))
      .replace(/\{\{graphJsUri\}\}/g, String(graphJsUri))
      ;

    this.panel.webview.html = html;

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(async (msg) => {
     switch(msg?.type) {
      case 'ready':
        this._readyResolve();
        this.output.appendLine('[GraphPanel] Webview is ready.');
        break;  
      case 'drill':
        this.output.appendLine(`[GraphPanel] Drill request for id: ${msg?.payload?.id ?? ''}`);
        vscode.window.showInformationMessage(`Drill: ${msg?.payload?.id ?? ''}`);
        break;
      case 'openInEditor':
        if (msg?.payload?.id) {
            const fileUri = vscode.Uri.file(msg.payload.id);
            const fsPath =fileUri.fsPath;
            if (fsPath && path.isAbsolute(fsPath) && fs.existsSync(fsPath)) {
              try {
                const uri = vscode.Uri.file(fsPath);;
                const doc = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(doc, { preview: true });
              } catch (err) {
                this.output.appendLine(`[openInEditor:error] : ${fsPath}. Error: ${err}`);
                vscode.window.showErrorMessage(`Failed to open file: ${fsPath}`);
              }
            } else {
            // Demo-friendly: do not throw, just inform gently.
              this.output.appendLine(`[openInEditor:skip] Not a real file path or does not exist: ${fileUri}`);
              vscode.window.showInformationMessage('Demo node (no local file to open)');
            }
        }
        break;
      case 'log':
        if (msg?.payload?.message) {
          this.output.appendLine(`[Webview] ${msg.payload.message}`);
        }
        break;
     }
    }, null, this.disposables);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  async whenReady() {
    await this._readyPromise;
  }

  postMessage(message: any) {
    this.panel.webview.postMessage(message);
  }

  dispose() {
    GraphPanel.current = undefined;
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

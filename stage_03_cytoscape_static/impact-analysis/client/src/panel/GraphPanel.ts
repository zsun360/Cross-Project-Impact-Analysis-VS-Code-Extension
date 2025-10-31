import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Webview host with message bridge
export class GraphPanel {
  public static current: GraphPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private _readyResolve!: () => void;
  private _readyPromise: Promise<void>;

  static show(context: vscode.ExtensionContext) {
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

    GraphPanel.current = new GraphPanel(panel, context);
    return GraphPanel.current;
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
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
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg?.type === 'ready') {
        this._readyResolve();
      } else if (msg?.type === 'drill') {
        console.log('[webview:drill]', msg.payload);
        vscode.window.showInformationMessage(`Drill: ${msg?.payload?.id ?? ''}`);
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

import { commands, ExtensionContext, window, OutputChannel, workspace, RelativePattern, Uri, FileSystemWatcher } from 'vscode';
import * as path from 'path';

import { Methods, RunStage05Params, RunStage05Result } from '../protocol';
import { getClient } from '../utils/lspClientApi';
import { GraphPanel } from '../panel/GraphPanel';
import { GraphModel } from '../types/graph';


export function registerCommands(context: ExtensionContext, output: OutputChannel) {
  const out = output!;

  context.subscriptions.push(
    commands.registerCommand('impact.runStage05Analysis', async () => {
      const client = getClient();

      const folder = workspace.workspaceFolders?.[0];
      if (!folder) { return window.showErrorMessage('No workspace opened.'); }
      const root = folder.uri.fsPath ?? '';
      const maxFiles = workspace.getConfiguration('impact')?.get<number>('maxFiles', 200);

      // 1) 打开/获取 Webview
      const panel = GraphPanel.current ?? GraphPanel.show(context, out);
      await panel.whenReady?.();

      // 2) 内联一个“分析→渲染”的函数（之后命令和文件监听都用它）
      const analyzeAndRender = async () => {
        try {
          const params: RunStage05Params = { root, maxFiles };
          const res = await client.sendRequest<RunStage05Result>(Methods.RunStage05Analysis, params);
          // res.modules/graph 的具体字段按你 server 返回为准，这里取你之前显示的统计
          // 假设 client 端已有一个 toGraphModel(res)
          const graphModel = toGraphModel(res, root);
          const payload = toWebviewPayload(graphModel);
          panel.postMessage({ type: 'render:graph', payload });
          window.setStatusBarMessage(`Stage05: parsed ${graphModel.stats.parsed} files, edges=${graphModel.edges.length}`, 1500);
        } catch (err) {
          window.showErrorMessage(`Stage05 analysis failed: ${String(err)}`);
        }
      };

      // 3) 先跑一次（你点击命令时）
      await analyzeAndRender();

      // 4) 注册文件监听（仅本工作区、忽略 node_modules/.git/dist，扩展：ts/js/py）
      //    只注册一次：挂在 panel 的 disposables 上，面板关掉就自动释放

      let watcher: FileSystemWatcher | undefined;
      if (!watcher) {
        if (folder) {
          const pattern = new RelativePattern(folder, '**/*.{ts,tsx,js,jsx,py}');
          watcher = workspace.createFileSystemWatcher(pattern, false, false, false);

          const shouldIgnore = (uri: Uri) => {
            const p = uri.fsPath.replace(/\\/g, '/').toLowerCase();
            return p.includes('/node_modules/') || p.includes('/.git/') || p.includes('/dist/') || p.includes('/out/');
          };

          const debounced = debounce(async (uri?: Uri) => {
            if (uri && shouldIgnore(uri)) { return; }
            await analyzeAndRender();
          }, 800);

          watcher.onDidCreate(debounced);
          watcher.onDidChange(debounced);
          watcher.onDidDelete(debounced);

          context.subscriptions.push(watcher);

        }
      }
    }
    )
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

/** 将 server 返回的 modules 汇总成文件级依赖图 */
function toGraphModel(res: RunStage05Result, root: string): GraphModel {
  const files = new Set<string>();
  const edges = new Set<string>(); // 用 "src|dst" 去重

  const normalize = (abs: string) =>
    path.relative(root, abs).replace(/\\/g, '/'); // Windows → POSIX

  // 建一个可快速查找的文件集合（绝对路径 & 相对路径）
  const known = new Set<string>();
  for (const m of res.modules) {
    known.add(m.file);
    known.add(normalize(m.file));
    files.add(normalize(m.file));
  }

  // 简单解析 import 路径 → 目标文件（支持 .ts/.js/.py 与 /index）
  const tryResolve = (fromAbs: string, spec: string): string | null => {
    if (!spec || spec.startsWith('node:') || spec.startsWith('http')) { return null; }
    if (!spec.startsWith('.') && !spec.startsWith('/')) { return null; } // 先忽略包名
    const fromDir = path.dirname(fromAbs);

    const candidates = [
      path.resolve(fromDir, spec),
      path.resolve(fromDir, spec + '.ts'),
      path.resolve(fromDir, spec + '.tsx'),
      path.resolve(fromDir, spec + '.js'),
      path.resolve(fromDir, spec + '.jsx'),
      path.resolve(fromDir, spec + '.py'),
      path.resolve(fromDir, spec, 'index.ts'),
      path.resolve(fromDir, spec, 'index.js'),
      path.resolve(fromDir, spec, '__init__.py')
    ];

    for (const c of candidates) {
      const rel = normalize(c);
      if (known.has(rel)) { return rel; }
    }
    return null;
  };

  for (const m of res.modules) {
    const src = normalize(m.file);
    for (const im of m.imports ?? []) {
      const tgt = tryResolve(m.file, im.source);
      if (!tgt) { continue; }
      const key = `${src}|${tgt}`;
      if (!edges.has(key)) { edges.add(key); }
      files.add(src);
      files.add(tgt);
    }
  }

  const nodeArr = Array.from(files).map(id => ({ id }));
  const edgeArr = Array.from(edges).map(k => {
    const [source, target] = k.split('|');
    return { source, target };
  });

  return {
    nodes: nodeArr,
    edges: edgeArr,
    stats: {
      files: nodeArr.length,
      edges: edgeArr.length,
      parsed: res.stats.parsed,
      cached: res.stats.cached,
      timeMs: res.stats.timeMs
    }
  };
}

// 把我们内部的 GraphModel → webview 需要的 payload
function toWebviewPayload(graph: GraphModel) {
  return {
    nodes: graph.nodes.map(n => ({ id: n.id, label: n.id })),     // graph.js 用到 label
    edges: graph.edges.map(e => ({ source: e.source, target: e.target })),
    meta: {
      stats: {
        files: graph.stats.files,
        edges: graph.stats.edges,
        scanned: graph.stats.parsed   // graph.js 期望有 scanned 字段
      }
    }
  };
}

// 强类型防抖（无 any、跨 Node/浏览器）
function debounce<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  ms = 400
) {
  let h: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args): void => {
    if (h) { clearTimeout(h); }
    h = setTimeout(() => { fn(...args); }, ms);
  };

  debounced.cancel = (): void => {
    if (h) { clearTimeout(h); }
    h = undefined;
  };

  debounced.flush = (...args: Args): R => {
    if (h) { clearTimeout(h); h = undefined; }
    return fn(...args);
  };

  return debounced as ((...args: Args) => void) & {
    cancel(): void;
    flush(...args: Args): R;
  };
}

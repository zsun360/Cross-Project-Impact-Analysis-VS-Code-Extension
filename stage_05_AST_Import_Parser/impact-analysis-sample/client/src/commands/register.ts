import { commands, ExtensionContext, window, OutputChannel, workspace, ProgressLocation } from 'vscode';
import * as path from 'path';

import { Methods, RunStage05Params, RunStage05Result } from '../protocol';
import { getClient } from '../utils/lspClientApi';
import { GraphPanel } from '../panel/GraphPanel';
import { GraphModel } from '../types/graph';


export function registerCommands(context: ExtensionContext, output: OutputChannel) {
  const out = output!;

context.subscriptions.push(
    commands.registerCommand('impact.runStage05Analysis', async () => {
      const folder = workspace.workspaceFolders?.[0];
      if (!folder) {return window.showErrorMessage('No workspace open.');}
      const root = folder.uri.fsPath;
      const maxFiles = workspace.getConfiguration('impact').get<number>('maxFiles', 200);

      await window.withProgress(
        { location: ProgressLocation.Notification, title: 'Running Stage05 analysis...' },
        async () => {
          const client = getClient();
          const params: RunStage05Params = { root, maxFiles };
          const res = await client.sendRequest<RunStage05Result>(Methods.RunStage05Analysis, params);

          // 1) AST 结果 → GraphModel
          const graph = toGraphModel(res, root);

          // 2) 打开/获取 Webview，并发送“render”消息
          const panel = GraphPanel.show(context, out);
          panel.postMessage({ type: 'render', graph });

          // 3) 同时保留右上角提示
          window.showInformationMessage(
            `Stage05: parsed ${res.stats.parsed} (+${res.stats.cached} cached) in ${res.stats.timeMs} ms; edges=${graph.edges.length}`
          );
        }
      );
    }));


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
    if (!spec || spec.startsWith('node:') || spec.startsWith('http')) {return null;}
    if (!spec.startsWith('.') && !spec.startsWith('/')) {return null;} // 先忽略包名
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
      if (known.has(rel)) {return rel;}
    }
    return null;
  };

  for (const m of res.modules) {
    const src = normalize(m.file);
    for (const im of m.imports ?? []) {
      const tgt = tryResolve(m.file, im.source);
      if (!tgt) {continue;}
      const key = `${src}|${tgt}`;
      if (!edges.has(key)) {edges.add(key);}
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

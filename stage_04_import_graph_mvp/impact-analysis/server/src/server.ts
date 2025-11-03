/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Stage 04 - Live Import Graph (minimal-intrusive)
 * - Adds 'impact/getImportGraph' request to build a real import graph from workspace files.
 * - Supports language: 'auto' | 'python' | 'js' | 'ts'
 *   - 'auto' scans both Python (*.py) and JS/TS (*.js,*.jsx,*.ts,*.tsx)
 *   - Python parser: regex-based for "import X" and "from X import Y" (naive)
 *   - JS/TS parser: regex-based for ES imports and require(); resolves only relative paths
 *
 * Notes:
 * - Keeps mock fallback to ensure non-breaking behavior.
 * - Nodes are file-level; node id is workspace-relative POSIX path for stable webview rendering.
 */

import {
  createConnection,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { fileURLToPath } from 'url';

// -----------------------------------------------------------------------------
// LSP Boilerplate
// -----------------------------------------------------------------------------

const connection = createConnection(ProposedFeatures.all);
// new TextDocuments<TextDocument>(TextDocument)
const documents = new TextDocuments<TextDocument>(TextDocument);

let workspaceRootFsPath: string | undefined = undefined;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  // Capture workspace root for scanning
  if (params.rootUri) {
    try {
      workspaceRootFsPath = fileURLToPath(params.rootUri);
    } catch (err) {
      workspaceRootFsPath = params.rootPath ?? process.cwd();
    }
  } else {
    workspaceRootFsPath = params.rootPath ?? process.cwd();
  }

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Add any other capabilities as needed
    }
  };
  return result;
});

connection.onInitialized(() => {
  connection.console.log('[impact] server initialized. workspaceRoot=' + (workspaceRootFsPath ?? 'N/A'));
});

// (Optional) wire up documents if you later want validations
documents.listen(connection);
connection.listen();

// -----------------------------------------------------------------------------
// Types & Helpers
// -----------------------------------------------------------------------------

type LanguageMode = 'auto' | 'python' | 'js' | 'ts';

interface GetImportGraphParams {
  language?: LanguageMode;
  maxFiles?: number;
}

interface GraphNode {
  id: string;               // workspace-relative POSIX path
  label: string;            // same as id (file path), displayed in webview
  type: 'file';
  group?: string;           // parent dir (for easy grouping)
}

interface GraphEdge {
  source: string;           // node id (source file)
  target: string;           // node id (target file)
  type: 'import';
}

interface ImportGraph {
  kind: 'import-graph';
  language: LanguageMode | string;
  rootUri?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: {
    generatedAt: number;
    stats: { files: number; edges: number; scanned: number };
    notes?: string[];
  };
}

/** Normalize to workspace-relative POSIX path */
function toRelPosix(root: string, abs: string): string {
  return path.relative(root, abs).split(path.sep).join('/');
}

function defaultRoot(): string {
  return workspaceRootFsPath ?? process.cwd();
}

// -----------------------------------------------------------------------------
// Core: buildImportGraph (Stage 04)
// -----------------------------------------------------------------------------

async function buildImportGraph(opts: { language?: LanguageMode; maxFiles?: number }): Promise<ImportGraph> {
  const root = defaultRoot();
  const language: LanguageMode = opts.language ?? 'auto';
  const maxFiles = Math.max(10, Math.min(5000, opts.maxFiles ?? 400));

  // Determine patterns
  const wantPy = language === 'python' || language === 'auto';
  const wantJsTs = language === 'js' || language === 'ts' || language === 'auto';

  const patterns: string[] = [];
  if (wantPy) {patterns.push('**/*.py');}
  if (wantJsTs) {patterns.push('**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx');}

  // Glob scan (ignore common bulky dirs)
  const entries = await fg(patterns, {
    cwd: root,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/out/**',
      '**/build/**',
      '**/.venv/**',
      '**/__pycache__/**'
    ],
    dot: false,
    unique: true,
  });

  const scanned = entries.length;
  const files = entries.slice(0, maxFiles);

  // Simple file index for basename -> abs list (helps python top-level name mapping)
  const baseIndex = new Map<string, string[]>();
  for (const abs of files) {
    const base = path.basename(abs);
    const noExt = base.replace(path.extname(base), '');
    const arr = baseIndex.get(noExt) ?? [];
    arr.push(abs);
    baseIndex.set(noExt, arr);
  }

  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const addNode = (abs: string) => {
    const id = toRelPosix(root, abs);
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        id,
        label: id,
        type: 'file',
        group: path.dirname(id) === '.' ? '' : path.dirname(id)
      });
    }
    return id;
  };

  const tryResolveRelative = (fromAbs: string, spec: string, exts: string[]): string | undefined => {
    // spec may omit extension, may be directory w/ index file
    const base = path.resolve(path.dirname(fromAbs), spec);
    const candidates: string[] = [base];
    for (const e of exts) {candidates.push(base + e);}
    for (const e of exts) {candidates.push(path.join(base, 'index' + e));}
    // Python package dir (__init__.py)
    candidates.push(path.join(base, '__init__.py'));

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {return c;}
    }
    return undefined;
  };

  // Naive Python "module name" -> file heuristic
  const mapPythonModuleToFile = (moduleName: string): string | undefined => {
    const top = moduleName.split('.')[0];
    const cands = baseIndex.get(top);
    return cands?.[0];
  };

  // Regexes
  const pyRe = /^\s*(?:from\s+([.\w/]+)\s+import|import\s+([.\w, ]+))/gm;
  const jsImportFromRe = /import\s+(?:[\s\S]+?)\s+from\s+['"](.+?)['"]/g;
  const jsImportBareRe = /import\s+['"](.+?)['"]/g;
  const jsRequireRe = /require\s*\(\s*['"](.+?)['"]\s*\)/g;

  for (const abs of files) {
    let content = '';
    try {
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const id = addNode(abs);
    const ext = path.extname(abs).toLowerCase();

    // Python
    if (ext === '.py' && wantPy) {
      let m: RegExpExecArray | null;
      while ((m = pyRe.exec(content))) {
        const mod = (m[1] || m[2] || '').trim();
        if (!mod) {continue;}

        // Handle multi imports like: import os, sys
        const first = mod.split(/[,\s]+/)[0];
        if (!first) {continue;}

        if (first.startsWith('.')) {
          /*
          // relative import: convert dotted segments to path segments (very naive)
          const asPath = first.replace(/\./g, '/');
          const found = tryResolveRelative(abs, asPath, ['.py']);
          if (found) {
            const tid = addNode(found);
            edges.push({ source: id, target: tid, type: 'import' });
          }
            */
          // Count leading dots, e.g. '.pkg' => 1 dot, '..utils' => 2 dots
          const m = first.match(/^(\.+)(.*)$/);
          const dots = m ? m[1].length : 1;
          const rest = m ? m[2] : '';
          // Calculate upward traversal: one dot means same level, so use (dots-1) '../'
          const up = dots > 1 ? '../'.repeat(dots - 1) : './';
          const restPath = rest.replace(/\./g, '/'); // "pkg.sub" -> "pkg/sub"
          const spec = up + restPath;                // Combine relative path segments

          const found = tryResolveRelative(abs, spec, ['.py']);
          if (found) {
            const tid = addNode(found);
            edges.push({ source: id, target: tid, type: 'import' });
          }
        } else {
          // absolute import: map top-level name to a file in workspace (heuristic)
          const mapped = mapPythonModuleToFile(first);
          if (mapped) {
            const tid = addNode(mapped);
            edges.push({ source: id, target: tid, type: 'import' });
          }
        }
      }
      continue;
    }

    // JS/TS
    if ((ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') && wantJsTs) {
      const run = (re: RegExp) => {
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
          const spec = (m[1] || '').trim();
          if (!spec) {continue;}
          if (spec.startsWith('.') || spec.startsWith('/')) {
            const found = tryResolveRelative(abs, spec, ['.ts', '.tsx', '.js', '.jsx']);
            if (found) {
              const tid = addNode(found);
              edges.push({ source: id, target: tid, type: 'import' });
            }
          } else {
            // external package -> skip in Stage 04
          }
        }
      };
      run(jsImportFromRe);
      run(jsImportBareRe);
      run(jsRequireRe);
      continue;
    }

    // other file types: ignore
  }

  const nodes = Array.from(nodesMap.values());
  const graph: ImportGraph = {
    kind: 'import-graph',
    language,
    rootUri: workspaceRootFsPath ? `file://${workspaceRootFsPath}` : undefined,
    nodes,
    edges,
    meta: {
      generatedAt: Date.now(),
      stats: { files: nodes.length, edges: edges.length, scanned },
      notes: [
        'Stage04 regex-based import extraction (naive).',
        'JS/TS: only resolves relative specs; external packages skipped.',
        'Python: absolute module mapping is heuristic by top-level name; relative imports map to files if resolvable.',
      ],
    }
  };

  return graph;
}

// -----------------------------------------------------------------------------
// Request Handler: impact/getImportGraph
// -----------------------------------------------------------------------------

connection.onRequest('impact/getImportGraph', async (params: GetImportGraphParams) => {
  try {
    const graph = await buildImportGraph({
      language: params?.language ?? 'auto',
      maxFiles: params?.maxFiles ?? 400,
    });
    connection.console.log(`[impact/getImportGraph] live graph: ${JSON.stringify(graph.meta)}`);
    return graph;
  } catch (err: unknown) {
    connection.console.error('[impact/getImportGraph] error -> fallback to mock: ' + String(err));
    // Fallback: safe empty graph (or keep your previous mock content here)
    const mock: ImportGraph = {
      kind: 'import-graph',
      language: params?.language ?? 'auto',
      rootUri: workspaceRootFsPath ? `file://${workspaceRootFsPath}` : undefined,
      nodes: [],
      edges: [],
      meta: {
        generatedAt: Date.now(),
        stats: { files: 0, edges: 0, scanned: 0 },
        notes: ['Fallback mock due to error.'],
      }
    };
    return mock;
  }
});

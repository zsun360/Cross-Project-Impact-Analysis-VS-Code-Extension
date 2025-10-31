/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */


import {
  createConnection,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  InitializedParams,
    TextDocuments,
  TextDocumentSyncKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// existing singletons (you probably already have these)
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);
const documents  = new TextDocuments<TextDocument>(TextDocument);

let DEBUG = false;
let BUILD = 'dev';

/*
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
*/

connection.onInitialize((params: InitializeParams): InitializeResult => {
  DEBUG = !!(params.initializationOptions)?.debug;
  BUILD = (params.initializationOptions)?.build ?? BUILD;
  console.info("Impact analysis server initialized with params: " + JSON.stringify(params));

  const result: InitializeResult = {
    capabilities: {
      // Leave this empty for now; additional content can be gradually added as needed later.
      textDocumentSync: TextDocumentSyncKind.Incremental
    }
  };

  return result;
});

// Add a custom request impact/ping
connection.onRequest('impact/ping', async () => {

  const base = { ok: true, ts: new Date().toISOString(), build: BUILD };

  // In debug mode, return extra debug info.
  if (DEBUG) {
    return {
      ...base,
      debug: {
        marker: 'ping@' + BUILD,
        pid: process.pid,
        cwd: process.cwd()
      }
    };
  }

  // Return clean data in non-development mode.
  return base;
});

// ✅ add this handler ON THE SAME connection
connection.onRequest('impact/getImportGraph', async (_params: any) => {
  const graph = {
    kind: 'import-graph',
    language: 'python',
    nodes: [
      { id: 'app/__init__.py', label: 'app/__init__.py', type: 'file', group: 'app' },
      { id: 'app/main.py', label: 'app/main.py', type: 'file', group: 'app' },
      { id: 'app/utils.py', label: 'app/utils.py', type: 'file', group: 'app' },
      { id: 'app/config.py', label: 'app/config.py', type: 'file', group: 'app' },
      { id: 'pkg/mathlib/stats.py', label: 'pkg/mathlib/stats.py', type: 'file', group: 'pkg.mathlib' },
      { id: 'pkg/io/csvio.py', label: 'pkg/io/csvio.py', type: 'file', group: 'pkg.io' }
    ],
    edges: [
      { source: 'app/main.py', target: 'app/utils.py', type: 'import' },
      { source: 'app/main.py', target: 'app/config.py', type: 'import' },
      { source: 'app/utils.py', target: 'pkg/mathlib/stats.py', type: 'import' },
      { source: 'app/utils.py', target: 'pkg/io/csvio.py', type: 'import' }
    ],
    meta: { generatedAt: Date.now(), stats: { files: 6, edges: 4 } }
  };
  connection.console.log('[impact/getImportGraph] served mock graph');
  return graph;
});

connection.onInitialized((_p: InitializedParams) => {
  connection.window.showInformationMessage('Impact server initialized.');
  connection.console.log('[impact] onInitialized fired (build v1)');
});

// existing boilerplate
documents.listen(connection);
// Listen on the connection
connection.listen();

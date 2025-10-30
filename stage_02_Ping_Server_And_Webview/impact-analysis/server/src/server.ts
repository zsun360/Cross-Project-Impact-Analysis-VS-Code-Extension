/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */


import {
  createConnection,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  InitializedParams
} from 'vscode-languageserver/node';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

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

connection.onInitialized((_p: InitializedParams) => {
  connection.window.showInformationMessage('Impact server initialized.');
  connection.console.log('[impact] onInitialized fired (build v1)');
});

// Listen on the connection
connection.listen();

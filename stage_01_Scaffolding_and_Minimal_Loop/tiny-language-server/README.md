# tiny-language-server README

🌀 Stage 0 – Implement the Minimal Working Loop

Establish the smallest end-to-end communication loop between the VS Code extension (client) and the Language Server (server). This stage focuses on setting up the technical foundation for later feature development and ensuring both sides can communicate reliably through the LSP protocol.

## Tasks

- Scaffold a new VS Code extension using yo code (choose the “New Language Server” template or create an empty extension and add LSP support manually).

- Set up a basic LSP client–server connection using the vscode-languageclient and vscode-languageserver libraries.

- Define a simple custom request, for example:

```
    // clientconnection.sendRequest('impact/ping', { text: 'hello' });
   // serverconnection.onRequest('impact/ping', async (params) => ({ ok: params?.text === 'hello' }));`
```

Register a command in the Command Palette (e.g., Impact: Ping Server) and print the server response in the Output channel.

Verify that running the command results in `{Ok: true }` appearing in the output.

## Acceptance Criteria:

The extension can launch and successfully start both client and server processes.

The “Impact: Ping Server” command triggers a request and receives a valid response.

{ ok: true } appears in the VS Code output panel, confirming that the minimal feedback loop is functioning.

## Outcome:

A verified minimal working loop that proves the extension and language server can communicate properly — serving as the foundation for subsequent stages of development.

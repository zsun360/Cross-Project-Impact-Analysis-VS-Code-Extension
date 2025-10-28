# AI Agent Instructions for LSP Sample Project

## Project Overview
This is a sample VS Code language server extension demonstrating the Language Server Protocol (LSP) implementation. The project is structured as a client-server architecture for providing language features in VS Code.

## Key Architecture Components
- **Client (`/client/src/extension.ts`)**: VS Code extension entry point that establishes connection with language server
- **Server (`/server/src/server.ts`)**: Language server implementation providing completions and diagnostics
- **Communication**: Uses Node.js IPC (Inter-Process Communication) via the LSP protocol

## Core Functionality
1. **Language Features**:
   - Completions: Triggered by 'j' or 't' to suggest JavaScript/TypeScript
   - Diagnostics: Analyzes text for uppercase words and reports them as problems
   - Document synchronization: Incremental updates with `TextDocumentSyncKind.Incremental`

2. **Configuration**:
   - Settings managed via `ExampleSettings` interface in server
   - Key setting: `maxNumberOfProblems` (default: 1000)
   - Server trace levels: "off" | "messages" | "verbose"

## Development Workflow
1. **Build Process**:
   ```
   npm install              # Install dependencies for both client/server
   npm run compile         # Build the extension
   npm run watch          # Watch mode for development
   ```

2. **Testing**:
   - E2E tests located in `client/src/test/`
   - Run "Launch Client" configuration from Debug view (F5)
   - Test in Extension Development Host with plaintext files

## Common Patterns
1. **Server Capability Registration**:
   ```typescript
   // See server.ts - Always register capabilities in onInitialize
   const result: InitializeResult = {
     capabilities: {
       textDocumentSync: TextDocumentSyncKind.Incremental,
       completionProvider: {
         resolveProvider: true
       }
     }
   };
   ```

2. **Client-Server Communication**:
   - Use `connection.onInitialize()` for capability setup
   - Register for configuration changes in `connection.onInitialized()`
   - Handle workspace folder changes when supported

## Integration Points
- Activates on plaintext files (`onLanguage:plaintext`)
- Watches for `.clientrc` file changes in workspace
- Uses `vscode-languageserver` and `vscode-languageclient` packages

## Project Structure Conventions
- Keep client/server code strictly separated
- Server-side logic goes in `server/src/`
- Client-side extension code in `client/src/`
- Tests co-located with client code in `client/src/test/`
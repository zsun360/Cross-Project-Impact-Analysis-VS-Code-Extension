# Stage 04 — Live Import Graph (MVP)

**Goal:**  
Transform the mock static JSON graph from Stage 03 into a **real, auto-generated import graph** that visualizes file-level dependencies across Python, JavaScript, and TypeScript projects.

---

## 🌐 Overview

Stage 04 introduces the first *live data pipeline* between the Language Server and the Webview:

| Component | Responsibility |
|------------|----------------|
| **Server (LSP)** | Scans workspace files with `fast-glob`, extracts import relations using lightweight regex rules, and returns a normalized JSON graph. |
| **Client (VS Code extension)** | Sends a `impact/getImportGraph` request and forwards the result to the Webview. |
| **Webview (Cytoscape)** | Dynamically renders the returned graph, updates statistics, and adapts UI to Stage 04 layout. |

> ✅ No more mock data — the graph you see now truly reflects the imports in your workspace.

---

##  Key Features

1. **Real Dependency Extraction**
   - Scans all `.py`, `.js`, `.jsx`, `.ts`, `.tsx` files.
   - Ignores `node_modules`, `.git`, `dist`, `out`, etc.
   - Uses simple but effective regex patterns for `import` / `from ... import ...` / `require(...)`.
   - Resolves relative imports (`./`, `../`) and basic top-level module names.

2. **Multi-Language Support**
   - `language: 'auto'` mode analyzes Python, JavaScript, and TypeScript together.
   - Can be limited to `'python'`, `'js'`, or `'ts'` for debugging.

3. **Non-Breaking Integration**
   - Keeps the same `impact/getImportGraph` request interface.
   - Retains mock fallback for safety.
   - Works on Windows, macOS, and Linux (paths normalized to POSIX `/`).

4. **Enhanced Webview UI**
   - Title bar updated to **“Stage 04 — Import Graph (Live)”**.
   - Real-time statistics (`files`, `edges`, `scanned`) displayed beside the title.
   - Listens for `render-graph` messages and renders the graph dynamically.

---

## ⚙️ Implementation Summary

### (`/stage_04_import_graph_mvp`)

**Install dependencies**
```bash
npm install
```

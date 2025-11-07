# Stage 05 — Drilldown Symbol Graph (Interactive Prototype)

### 🎯 Goal
Provide an interactive, AST-based symbol graph for JavaScript/TypeScript (Stage 05)  
with real-time updates, keyboard interaction, and export capability.

---

### 🧩 Key Features
- **AST Parser (ts-morph)**  
  Generates accurate import/export graphs instead of regex-based parsing.  
- **Incremental Refresh (FileSystemWatcher)**  
  Automatically re-analyzes and re-renders the graph when any `.ts`, `.js`, or `.py` file changes.  
- **Cytoscape Webview Rendering**  
  Interactive zoom/pan, smooth wheel scaling, and dark-theme adaptive styles.  
- **Ctrl + Click Drill-Down**  
  Highlights a node’s neighborhood and triggers `openInEditor` to jump to source.  
- **R → Relayout**  
  Press `R` anytime to re-run the COSE layout and refit the view.  
- **Export Graph as PNG**  
  Runs inside Webview and sends a `savePNG` message back to extension host.  

---

### 🧠 Architecture Overview
- **Client → Server:** `RunStage05Analysis` (LSP Request)  
- **Server → Client:** AST Graph (JSON)  
- **Client → Webview:** `render:graph` (Message)  
- **Webview:** `graph.js` handles render, events, export, layout.  

---

### 🚀 Usage
1. Run `Impact: Run Stage 05 Analysis` from Command Palette.  
2. Modify imports in `ts_demo` or `py_demo`.  
3. Graph auto-refreshes within ≈ 0.5 s (FileSystemWatcher).  
4. **Ctrl + Click** node → highlight + jump to source.  
5. **R key** → re-layout the graph.  
6. **Export as PNG** → command palette or button.  

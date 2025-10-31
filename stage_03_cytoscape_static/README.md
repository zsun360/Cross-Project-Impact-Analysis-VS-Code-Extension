# Stage 03 — Cytoscape Static Graph (Mock Data)

> 🎯 Goal: Build the first visual graph in VS Code Webview using Cytoscape.js.  
> This is the *turning point* from plain Webview to interactive visualization.

---

## 🌍 What You’ll Build
- A **Cytoscape-based static dependency graph** rendered in the Webview panel.
- A **message channel** between the extension and the Webview (`postMessage` & `onDidReceiveMessage`).
- A **command** `Impact: Show Import Graph` that opens the panel and shows a mock graph.

---

## 🧠 Why It Matters
This stage teaches the essential bridge between **VS Code** and **the browser world** inside Webview.

Once you understand:
1. How the command triggers Webview creation,  
2. How data (even fake data) flows from LSP → Client → Webview,  
then you can inject *real analysis results* later (Stage 04).

---

## 🪜 Learning Objectives
| # | Objective | Description |
|---|------------|-------------|
| 1 | Webview basics | Create HTML/JS page with Cytoscape |
| 2 | Message channel | From VS Code → Webview and back |
| 3 | Graph rendering | Render mock nodes/edges with layout |
| 4 | Node interaction | Click node → send event to Extension |
| 5 | Data shape | Understand the unified `Graph JSON` schema |

---

## ⚙️ Quick Start

1. **Install dependencies**
   ```bash
   cd stage_03_cytoscape_static
   npm install
   ```

2. **Launch in VS Code**
   - Press `F5` to start the “Extension Development Host”.
   - In the Command Palette (`Ctrl+Shift+P`), run:
     ```bash
     Impact: Show Import Graph
     ```

3. **Expected Result**
   - A new panel appears with a small mock graph (5–8 nodes).
   - Clicking a node prints a `[drill] <id>` log in the console and a toast popup.

---

## 🧩 Code Structure
```bash
client/
 ├─ commands/register.ts        # Register command + fetch mock graph
 ├─ panel/GraphPanel.ts         # Webview host & bridge (postMessage handler)
 ├─ utils/lspClientApi.ts       # Client getter/setter for LanguageClient
 └─ webview/
     ├─ graph.html              # HTML wrapper for Cytoscape
     └─ graph.js                # Graph rendering + drill event callback

server/
 └─ server.ts           # Mock LSP handler for `impact/getImportGraph`

docs/
 ├─ Graph_JSON_Schema.md        # Data format reference
 ├─ Cytoscape_Layout_CheatSheet.md  # Layout/Style quick ref

samples/
 └─ mock_import_graph.json      # 8-node sample dataset
```

---

## ✅ Checkpoints
- [x] Webview panel opens successfully  
- [x] Cytoscape renders mock graph  
- [x] Node click logs `[drill] id` event  
- [x] No console or runtime errors  

---

## 📘 Docs & Learning Materials
| File | Description |
|------|--------------|
| [Graph_JSON_Schema.md](./docs/Graph_JSON_Schema.md) | JSON schema for import-graph format |
| [Cytoscape_Layout_CheatSheet.md](./docs/Cytoscape_Layout_CheatSheet.md) | Quick layout & styling guide |
| [mock_import_graph.json](./samples/mock_import_graph.json) | Example dataset used by mock LSP handler |

---

## 🧭 Next Step
➡ **Stage 04 — Import Graph MVP**  
Replace mock data with *real dependency analysis* (Python / TS / JS).  
[Open next stage](../stage_04_import_graph_mvp/README.md)

---

## 🪄 Tips
- Check **Output → Language Server Example** or **Developer Tools → Console** for logs.  
- Layout can be changed in `graph.js`:
  ```js
  layout: { name: 'cose', animate: false }
  ```
- Node styles are customizable via Cytoscape selectors.  

---

## 🖼️ Preview
*(replace with your real screenshot later)*  

---

## 📚 References
- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [VS Code Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)

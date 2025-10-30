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

   - Clicking a node prints a drill log in the Extension Host console.

---

## 🧩 Code Structure
   ```bash
client/
 ├─ panel/GraphPanel.ts       # Registers and controls Webview
 ├─ webview/graph.html        # Static HTML template
 └─ webview/graph.js          # Cytoscape initialization + message listener
server/
 └─ features/graph.ts         # Mock “impact/getImportGraph” handler
docs/
 └─ screenshot_overview.png   # Optional preview image
   ```

---

## 🧱 Data Example (Mock Graph JSON)
   ```json
{
  "kind": "import-graph",
  "language": "python",
  "nodes": [
    { "id": "a.py", "label": "a.py", "type": "file" },
    { "id": "b.py", "label": "b.py", "type": "file" }
  ],
  "edges": [
    { "source": "a.py", "target": "b.py", "type": "import" }
  ]
}
   ```

---

## ✅ Checkpoints

- -  [ ] Webview panel opens correctly
    
- -  [ ] Cytoscape graph renders mock data
    
- -  [ ] Clicking a node logs “drill event”

- -  [ ] No errors in Extension Host console

---

## 🧭 Next Step

➡ **Stage 04 — Import Graph MVP**
You’ll replace mock data with real dependency analysis (Python / TS / JS).
[Open next stage](../stage_04_import_graph_mvp/README.md)

---

## 🪄 Tips

   - If you don’t see the panel, check  `Output → Language Server Example` or `Developer Tools → Console`.

   - You can edit colors/layout easily in `graph.js`:
   ```js
   layout: { name: 'cose' },
   style: [
     { selector: 'node', style: { 'background-color': '#007acc' } },
     { selector: 'edge', style: { 'width': 2, 'line-color': '#aaa' } }
   ]
   ```

---

## 🖼️ Preview

*(replace with your real screenshot later)*

---

## 🏷️ Metadata
| Field | Value |
| --- | --- |
| Stage | 03  |
| Focus | Webview + Cytoscape static rendering |
| Estimated time | 1–2 days |
| Version tag | `v0.3.0-static` |

---

## 📚 Reference

- [Cytoscape.js Documentation](https://js.cytoscape.org/)

- [VS Code Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)

---
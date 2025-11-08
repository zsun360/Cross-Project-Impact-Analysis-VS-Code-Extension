# Stage 06 — Multi-Language AST Import Graph

### 🎯 Goal
Enable unified multi-language (JS / TS / Python) AST-based import graph visualization in VS Code webview with accurate edges, colored nodes by language, and interactive tooltips.

---

## 🚀 New Features in Stage 06
| Feature | Description |
|----------|--------------|
| **AST Parsing Integration** | Replaced regex parser with full AST parsing for JS, TS, and Python. |
| **Unified ImportEntry Schema** | All languages emit the same `ImportEntry` (`source`, `specifiers`, `resolved`). |
| **Cross-Language Normalization** | Relative → absolute path resolution unified across parsers. |
| **GraphModel Upgrade** | Added `stats` (`files`, `edges`, `parsed`, `cached`, `timeMs`) for frontend display. |
| **Visual Enhancement** | Colored nodes by language (`TS blue`, `JS yellow`, `PY green`). |
| **Tooltip System** | Lightweight tooltip shows full file path on hover. |
| **Metrics Header** | `files : 12  edges : 7  parsed : 12` replaces old undefined “scanned”. |

---

## 📂 Directory Structure
```
impact-analysis/
 ├── client/
 │   ├── src/webview/graph.html     # Styled webview with toolbar + colors + tooltip
 │   └── src/commands/register.ts   # toGraphModel + runStage05Analyze
 ├── server/
 │   ├── src/parse_ts.ts            # TS AST imports via ts-morph
 │   ├── src/parse_py.ts            # Python AST imports via py_imports.py
 │   ├── scripts/py_imports.py      # Python AST walker → JSON
 │   └── src/types/ir.ts            # Unified ImportEntry / ModuleIR / GraphModel
```

---

## 🧠 How to Run
1. **Launch extension**
   ```bash
   npm install
   ```
   Press `F5` → Extension Development Host.
2. **Open test workspace**
   ```
   ./stage04-test-workspace
   ```
3. **Run Command**
   ```
   Ctrl + Shift + P → “Run Impact Analysis”
   ```
4. **Enjoy**
   - Webview → Import Graph
   - Hover → Tooltip (full path)
   - Colors → Language type
   - Header → `files/edges/parsed`

---


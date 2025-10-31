# Cross-Project Impact Analyzer for VS Code

> Analyze the ripple effect of code changes across large-scale projects — visualize dependencies, assess risks, and improve code quality.

## 🔍 Overview

In large codebases, even a small change in one function or module can trigger unexpected side effects across the project.  
This VS Code extension helps developers **identify the full impact of code changes**, **visualize dependency graphs**, and **evaluate risk levels** — all directly within the IDE.

## ✨ Core Features

- 🧩 **Change Impact Analysis** — Detect which functions, files, or modules are affected by a given modification.
- 🔗 **Dependency Graph Visualization** — Interactive, zoomable graph of function and module relationships (powered by D3.js / Cytoscape).
- ⚙️ **Cross-Project & Multi-Module Support** — Handles monorepos, microservices, or multi-language workspaces.
- 🧠 **Risk Evaluation** — Quantifies potential impact using complexity, dependency spread, and commit history.
- 🕵️ **Git Integration** — Automatically links commits and diffs to affected symbols.
- 📄 **Exportable Reports** — Generate detailed HTML/PDF summaries for team reviews.

## 🏗️ Architecture

The system follows a client–server model based on the Language Server Protocol (LSP).

## 🚀 Getting Started

1. Clone this repository.
2. Run `npm install` in both `extension/` and `server/` directories.
3. Press `F5` in VS Code to launch the extension in a new window.

### Commands

- `Impact: Build Index` — Analyze workspace files and build dependency index.
- `Impact: Analyze Selection` — Run impact analysis for selected function.
- `Impact: Show Graph` — Visualize dependency graph.
- `Impact: Export Report` — Generate PDF summary.

## 🧩 Technical Highlights

- **AST-based analysis** — Parses code structure instead of regex scanning.
- **Custom LSP integration** — Enables scalable, non-blocking analysis.
- **Cross-language support** — Built to extend from JS/TS to Python and Java.
- **Graph database model** — Efficient dependency traversal and querying.
- **Risk scoring engine** — Combines code complexity, dependency breadth, and commit churn.
- **Optimized Webview visualization** — Large graphs rendered with progressive layout.

## 👤 Author

**Zhenshuo Sun**  
📍 Based in Thunder Bay, Ontario, Canada  
💼 Software Engineering Student @ Lakehead University  
🌐 Focus: Full-Stack + Cloud + AI-Assisted Developer Tools  
📧 Contact: [ zsun360@outlook.com or zsun30@lakeheadu.ca ]


# Cross-Project Impact Analysis — Learning Map

> 🧭 A step-by-step VS Code extension project that grows from a basic Language Server setup to full-featured code impact visualization.

---

## 🚀 Quick Start
- Recommended learning order: **Stage 01 → Stage 02 → Stage 03**
- Each stage is *self-contained* with its own README, runnable sample, and screenshots.

---

## 🗺️ Learning Map

### Stage 01 — Scaffolding & Baseline (LSP Sample Setup)
- **Goal:** Set up Microsoft’s official LSP sample locally and understand the Client–Server architecture.  
- **What you’ll learn:** How to run, debug, and inspect LSP communications.  
- **Open tutorial:** [`stage_01_scaffolding/README.md`](./stage_01_scaffolding/README.md)  
- **Try the code:** `stage_01_scaffolding/`  
- **Release tag:** `v0.1.0-scaffold`  
- **Preview:** *(add screenshot later)*  

---

### Stage 02 — Ping Server & Webview (Minimum Working Path)
- **Goal:** Establish a minimal end-to-end communication path: Client ↔ Server ↔ Webview.  
- **What you’ll learn:** Custom LSP requests, message channels, and creating a Webview.  
- **Open tutorial:** [`stage_02_ping_server_and_webview/README.md`](./stage_02_ping_server_and_webview/README.md)  
- **Try the code:** `stage_02_ping_server_and_webview/`  
- **Release tag:** `v0.2.0-ping-webview`  
- **Preview:** *(add screenshot later)*  

---

### Stage 03 — Cytoscape Static Graph (Mock Data)
- **Goal:** Render a static dependency graph using Cytoscape in the Webview.  
- **What you’ll learn:** Webview–LSP data flow, Cytoscape basics, and event callbacks.  
- **Open tutorial:** [`stage_03_cytoscape_static/README.md`](./stage_03_cytoscape_static/README.md)  
- **Try the code:** `stage_03_cytoscape_static/`  
- **Release tag:** `v0.3.0-static`  
- **Preview:** *(add screenshot later)*  

---

## 📦 Repository Layout
```
stage_01_scaffolding/
stage_02_ping_server_and_webview/
stage_03_cytoscape_static/
shared/
```
Each stage can run independently inside VS Code.

---

## 🧭 Versioning & Navigation
- Each milestone is tagged for reproducibility:  
  `v0.1.0-scaffold`, `v0.2.0-ping-webview`, `v0.3.0-static`  
- To explore a specific version:
  ```bash
  git checkout tags/v0.2.0-ping-webview
  ```

---

## 🧩 Project Vision
This project demonstrates how a **Language Server + Webview** architecture can evolve into a **cross-project code impact analysis tool**.  
Future stages (04–05) will introduce real dependency parsing, symbol graphs, and drill-down visualization.

---

## 🏷️ Metadata
| Field | Value |
| --- | --- |
| Repository | Cross-Project Impact Analysis VS Code Extension |
| Author | Zhenshuo Sun (zsun360) |
| Category | AI + Developer Tools |
| Language | TypeScript / Node.js |
| License | MIT |

---

## 📚 References
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol Spec](https://microsoft.github.io/language-server-protocol/)
- [Cytoscape.js](https://js.cytoscape.org/)

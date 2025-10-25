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

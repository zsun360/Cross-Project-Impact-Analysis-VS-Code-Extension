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

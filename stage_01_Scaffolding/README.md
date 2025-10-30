# Stage 01 — Scaffolding & Baseline (LSP Sample Setup)

> 🎯 Goal: Set up and run Microsoft’s official **Language Server Protocol (LSP) Sample** extension locally.  
> This is the *foundation stage* — before we modify or add any new functionality.

---

## 🌍 What You’ll Build
- A working **VS Code Language Server extension** cloned or generated from Microsoft’s LSP sample.
- A **two-process architecture**: Client (extension host) + Server (language server).
- The ability to **run and debug** the sample extension locally.

---

## 🧠 Why It Matters
Before customizing or building features, you must understand:
1. How a Language Server communicates with the VS Code Client.  
2. How messages like *diagnostics* or *hover info* flow between them.  
3. How to debug both sides inside the same VS Code workspace.  

This stage ensures your foundation is solid before you start building analysis features.

---

## 🪜 Learning Objectives
| # | Objective | Description |
|---|------------|-------------|
| 1 | LSP Architecture | Understand the role of Client and Server processes |
| 2 | Scaffolding Setup | Clone or generate Microsoft’s LSP Sample |
| 3 | Debug Config | Run and attach both client and server under F5 |
| 4 | Diagnostics | Verify basic “validation” logic works |
| 5 | Logging | Locate Output → “Language Server Example” channel |

---

## ⚙️ Quick Start
1. **Clone Microsoft’s LSP Sample**
   ```bash
   git clone https://github.com/microsoft/vscode-extension-samples.git
   cd vscode-extension-samples/lsp-sample
   npm install
   ```

2. **Launch in VS Code**
   - Open the folder `lsp-sample` in VS Code.
   - Press **F5** to start the “Extension Development Host”.

3. **Test the Language Server**
   - Create a new `.plaintext` file.
   - Type random words — the LSP should underline some diagnostics.
   - Open `View → Output → Language Server Example` to see server logs.

---

## 🧩 Code Structure
```bash
client/
 ├─ src/extension.ts      # Entry point for the client extension
 └─ package.json          # Defines contributions and activation events
server/
 ├─ src/server.ts         # Core LSP server logic
 ├─ tsconfig.json         # TypeScript configuration
 └─ package.json          # Server-side dependencies
.vscode/
 └─ launch.json           # Debugging configurations (Client + Server)
```

---

## ✅ Checkpoints
- [x] LSP extension launches successfully  
- [x] “Language Server Example” output channel appears  
- [x] Diagnostics show up on sample text  
- [x] No runtime errors in either process  

---

## 🧭 Next Step
➡ **Stage 02 — Ping Server & Webview**  
We’ll add our first *custom LSP command* and open a Webview panel.  
[Open next stage](../stage_02_ping_server_and_webview/README.md)

---

## 🪄 Tips
- You can safely experiment with logs — they’re printed via `connection.console.log`.
- Keep this stage **unchanged**; it’s your clean baseline for debugging later.

---

## 🖼️ Preview
*(replace with your own screenshot of the Extension Host running the sample)*

---

## 🏷️ Metadata
| Field | Value |
| --- | --- |
| Stage | 01 |
| Focus | Scaffolding + LSP Sample |
| Estimated time | 0.5–1 day |
| Version tag | `v0.1.0-scaffold` |

---

## 📚 Reference
- [Microsoft LSP Sample Repository](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample)
- [VS Code Language Server Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)

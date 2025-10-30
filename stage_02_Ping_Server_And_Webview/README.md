# Stage 02 — Ping Server & Webview (Minimum Working Path)

> 🎯 Goal: Connect the **client and server** with a custom “ping” message,  
> and open a **Webview panel** inside VS Code — the first visible UI component of our extension.

---

## 🌍 What You’ll Build
- A **custom LSP command** (`impact/ping`) that tests the client–server channel.  
- A **minimal Webview panel** (HTML + JS) displayed from the command palette.  
- Verified data flow: VS Code command → Server response → Webview.

---

## 🧠 Why It Matters
This stage establishes the **minimum viable communication path** between three worlds:
1. The VS Code Extension (client)  
2. The LSP Server (backend logic)  
3. The Webview (frontend visualization)

Once this “ping” works end-to-end, you can later send *graph data* instead of simple messages.

---

## 🪜 Learning Objectives
| # | Objective | Description |
|---|------------|-------------|
| 1 | Custom Request | Define and handle a new LSP request (`impact/ping`) |
| 2 | Message Channel | Send JSON payload from Client → Server → Client |
| 3 | Webview Setup | Create a basic HTML panel |
| 4 | Command Registration | Expose `Impact: Open Panel` |
| 5 | Debugging | Observe Output channel logs and Webview console messages |

---

## ⚙️ Quick Start
1. **Run the Extension**
   ```bash
   cd stage_02_ping_server_and_webview
   npm install
   ```
   Press **F5** in VS Code to launch the *Extension Development Host*.

2. **Trigger the Command**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run:  
     ```
     Impact: Open Panel
     ```
   - The Webview opens and shows a “Ping successful” message.

3. **Expected Output**
   - Output panel (`Language Server Example`) logs:  
     ```
     [impact/ping] {"ok":true}
     ```
   - Webview displays a static HTML message or console log.

---

## 🧩 Code Structure (to be continued)
```bash
client/
 ├─ xxxxxxxx      # Register “Impact: Open Panel”
 ├─ yyyyyyyy        # Controls Webview lifecycle
 └─ zzzzzzzz         # Minimal HTML page for Webview
server/
 ├─ xxxxxx          # Handle `impact/ping` request
 └─ yyyyyy                 # Shared types (optional)
docs/
 └─ screenshot_ping.png       # Optional preview image
```

---

## ✅ Checkpoints
- [x] Command appears in Command Palette  
- [x] Webview opens successfully  
- [x] Server logs `[impact/ping] {"ok":true}`  
- [x] No console errors  

---

## 🧭 Next Step
➡ **Stage 03 — Cytoscape Static Graph**  
We’ll embed Cytoscape.js and visualize a mock dependency graph.  
[Open next stage](../stage_03_cytoscape_static/README.md)

---

## 🪄 Tips
- If you don’t see the “Language Server Example” channel, check `View → Output`.
- Keep logs concise and structured (`[impact/ping] {ok:true}` format).
- Webview JS console logs appear under *Developer Tools → Console*.

---

## 🖼️ Preview
*(replace with your screenshot of the “Ping successful” Webview)*

---

## 🏷️ Metadata
| Field | Value |
| --- | --- |
| Stage | 02 |
| Focus | Custom LSP command + Webview |
| Estimated time | 1–1.5 days |
| Version tag | `v0.2.0-ping-webview` |

---

## 📚 Reference
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Language Server Custom Requests](https://microsoft.github.io/language-server-protocol/specifications/specification-current/#requestMessage)

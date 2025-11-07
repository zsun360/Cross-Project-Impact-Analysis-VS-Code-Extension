# Testing Guide — Stage 04

### Test Workspace
Use `stage04-test-workspace` containing:
- `py_demo/` (Python relative/absolute imports)
- `js_demo/` (import + require + index.js)
- `ts_demo/` (import + index.ts)

### Expected Behavior
- Graph nodes ≈ 12
- Graph edges ≈ 9
- Title bar shows “Stage 04 — Import Graph (Live)”
- Output log shows live stats (no fallback)

### Manual Validation Steps
1. Open the folder in VS Code Extension Development Host.
2. Run command: **Impact: Show Import Graph**.
3. Confirm:
   - Python imports → connect `main.py → utils.py → *.py`.
   - JS imports → connect `index.js → util.js / lib/common.js / *.js`.
   - TS imports → connect `main.ts → helper.ts / *.ts`.
4. Right-click nodes: message “Demo node (no local file to open)” (expected in Stage 04).

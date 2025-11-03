# Graph JSON Schema (Stage 04)

All components exchange dependency data using the following structure.

```json
{
  "kind": "import-graph",
  "language": "auto",
  "rootUri": "file:///workspace",
  "nodes": [
    { "id": "py_demo/main.py", "label": "py_demo/main.py", "type": "file", "group": "py_demo" }
  ],
  "edges": [
    { "source": "py_demo/main.py", "target": "py_demo/utils.py", "type": "import" }
  ],
  "meta": {
    "generatedAt": 1762127076886,
    "stats": { "files": 12, "edges": 9, "scanned": 12 },
    "notes": [
      "Stage04 regex-based import extraction (naive).",
      "JS/TS: only resolves relative specs; external packages skipped.",
      "Python: absolute module mapping is heuristic by top-level name; relative imports map to files if resolvable."
    ]
  }
}
```

### Field Description

| Key | Type | Description |
|------|------|-------------|
| `nodes[]` | object | Each scanned file represented as a graph node. |
| `edges[]` | object | Each import relationship as a directed edge. |
| `meta.stats.files` | number | Total nodes in graph. |
| `meta.stats.edges` | number | Total import edges. |
| `meta.stats.scanned` | number | Files scanned before limits. |

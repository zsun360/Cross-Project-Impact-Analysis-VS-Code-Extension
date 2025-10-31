# Graph JSON Schema (MVP)

This is the minimal schema used by Stage 03 to render a static dependency graph.

```json
{
  "kind": "import-graph",
  "language": "python | typescript | javascript | unknown",
  "rootUri": "file:///optional",
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "type": "file",
      "group": "optional.namespace"
    }
  ],
  "edges": [{ "source": "string", "target": "string", "type": "import" }],
  "meta": {
    "generatedAt": 0,
    "stats": { "files": 0, "edges": 0 }
  }
}
```

- **nodes[].id** must be unique. Use file path or module name.
- **edges[].type** is `import` for Stage 03.
- **group** can be used to color/cluster by folder or package.

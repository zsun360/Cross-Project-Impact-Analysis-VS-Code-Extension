# Cytoscape.js Layout Cheat Sheet (MVP)

| Layout         | When to use                          | Key options                                   |
| -------------- | ------------------------------------ | --------------------------------------------- |
| `cose`         | General force-directed, good default | `animate`, `nodeRepulsion`, `idealEdgeLength` |
| `breadthfirst` | Tree/levels (e.g., by folder depth)  | `directed`, `spacingFactor`                   |
| `grid`         | Small demos/testing                  | `rows`, `cols`, `fit`                         |
| `concentric`   | Emphasize centrality/degree          | `minNodeSpacing`, `levelWidth`                |

### Recommended defaults (Stage 03)

```js
const layout = { name: "cose", animate: false };
```

### Styling snippets

```js
style: [
  { selector: "node", style: { label: "data(label)", "font-size": 10 } },
  { selector: "edge", style: { width: 2, "curve-style": "straight" } },
  { selector: 'node[type = "file"]', style: { shape: "round-rectangle" } },
];
```

### Performance tips

- Keep initial graphs small (<= 20 nodes) for Stage 03.
- Disable animation for steadier FPS.

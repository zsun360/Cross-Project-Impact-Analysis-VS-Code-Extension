(function () {
  const vscode = acquireVsCodeApi();
  const fb = document.getElementById("fb");

  function log(msg) {
    if (fb) fb.textContent = String(msg);
  }

  vscode.postMessage({ type: "ready" });

  function toElements(graph) {
    const nodes = (graph.nodes || []).map((n) => ({
      data: { id: n.id, label: n.label, type: n.type, group: n.group },
    }));
    const edges = (graph.edges || []).map((e) => ({
      data: {
        id: e.source + "->" + e.target,
        source: e.source,
        target: e.target,
        type: e.type,
      },
    }));
    return nodes.concat(edges);
  }

  function render(graph) {
    if (typeof cytoscape === "undefined") {
      log("cytoscape not loaded");
      return;
    }
    const cy = cytoscape({
      container: document.getElementById("cy"),
      elements: toElements(graph),
      layout: { name: "cose", animate: false },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#007acc",
            color: "#fff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 10,
            width: "label",
            height: "label",
            padding: 10,
            shape: "round-rectangle",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#aaa",
            "target-arrow-color": "#aaa",
            "curve-style": "straight",
            "target-arrow-shape": "triangle",
          },
        },
      ],
    });
    cy.nodes().on("tap", (evt) => {
      const id = evt.target.id();
      vscode.postMessage({ type: "drill", payload: { id } });
      console.log("[drill]", id);
    });
    log("");
  }

  window.addEventListener("message", (event) => {
    const { type, payload } = event.data || {};
    if (type === "render:graph") {
      render(payload);
    }
  });

  setTimeout(() => {
    if (fb && fb.textContent && fb.textContent.includes("loading")) {
      render({
        nodes: [
          { id: "a", label: "a", type: "file" },
          { id: "b", label: "b", type: "file" },
        ],
        edges: [{ source: "a", target: "b", type: "import" }],
      });
      log("fallback demo rendered");
    }
  }, 1500);
})();

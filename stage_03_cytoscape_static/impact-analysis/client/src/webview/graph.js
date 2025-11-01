(function () {
  const vscode = acquireVsCodeApi();
  const state = { cy: null };

  function post(type, payload) {
    vscode.postMessage({ type, payload });
  }
  function log(message) {
    post("log", { message });
  }

  const palette = {
    app: "#1f77b4",
    "pkg.io": "#2ca02c",
    "pkg.mathlib": "#9467bd",
    default: "#007acc",
  };

  function colorFor(group) {
    return palette[group] || palette.default;
  }

  function toElements(graph) {
    const nodes = (graph.nodes || []).map((n) => ({
      data: { id: n.id, label: n.label, type: n.type, group: n.group },
      classes: n.group ? `g-${n.group.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "",
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

  function applyStyles(cy) {
    const baseStyles = [
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
      { selector: ".faded", style: { opacity: 0.15 } },
      {
        selector: ".highlighted",
        style: {
          "line-color": "#ff9800",
          "target-arrow-color": "#ff9800",
          width: 3,
        },
      },
    ];

    cy.style(baseStyles);

    const groups = new Set(
      cy
        .nodes()
        .map((n) => n.data("group"))
        .filter(Boolean)
    );
    groups.forEach((g) => {
      cy.style()
        .selector(`node[group = "${g}"]`)
        .style("background-color", colorFor(g))
        .update();
    });
  }

  function fit(cy) {
    cy.fit(undefined, 30);
  }

  function render(graph) {
    const t0 = performance.now();
    const container = document.getElementById("cy");
    state.cy?.destroy();

    const cy = (state.cy = cytoscape({
      container,
      elements: toElements(graph),
      layout: { name: "cose", animate: false },
      style: [],
    }));

    applyStyles(cy);
    cy.on("layoutstop", () => fit(cy));
    fit(cy);

    cy.on("tap", "node", (evt) => {
      const e = evt.originalEvent;
      const n = evt.target;
      if (e && (e.ctrlKey || e.metaKey)) {
        const neighborhood = n.closedNeighborhood();
        cy.elements().addClass("faded");
        neighborhood.removeClass("faded");
        neighborhood.filter("edge").addClass("highlighted");
        log(`highlight ${n.id()}`);
      } else {
        post("drill", { id: n.id() });
        cy.elements().removeClass("faded highlighted");
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "r") {
        cy.layout({ name: "cose", animate: false }).run();
      }
    });

    cy.on("cxttap", "node", (evt) => {
      const id = evt.target.id();
      post("openInEditor", { id });
    });

    let to = null;
    window.addEventListener("resize", () => {
      if (to) cancelAnimationFrame(to);
      to = requestAnimationFrame(() => fit(cy));
    });

    const t1 = performance.now();
    log(
      `[webview] rendered nodes=${graph?.nodes?.length || 0}, edges=${
        graph?.edges?.length || 0
      } in ${(t1 - t0).toFixed(1)} ms`
    );
  }

  window.addEventListener("message", (event) => {
    const { type, payload } = event.data || {};
    if (type === "render:graph") render(payload);
  });

  post("ready");
})();

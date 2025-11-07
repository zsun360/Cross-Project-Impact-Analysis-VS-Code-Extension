/* eslint-env browser */
/* global cytoscape */

// webview/bridge.js
(function () {
  function ensureCy() {
    if (window.cy && typeof window.cy.add === "function") {
      return window.cy;
    }
    const el = document.getElementById("cy"); // 确认容器 id 对齐
    if (!el || typeof cytoscape !== "function") {
      return null;
    }
    window.cy = cytoscape({
      container: el,
      layout: { name: "cose" },
      wheelSensitivity: 0.2,
    });
    return window.cy;
  }

  // 接收 extension 端发来的 { type:'render', graph }
  window.addEventListener("message", (event) => {
    const msg = event.data || {};
    if (msg.type !== "render" || !msg.graph) {
      return;
    }

    // 1) 优先调用 graph.js 提供的渲染入口
    if (typeof window.renderFromAst === "function") {
      try {
        window.renderFromAst(msg.graph);
        return;
      } catch (e) {
        console.error("[bridge] renderFromAst failed", e);
      }
    }

    // 2) 兜底：确保有 cytoscape 实例后直接重画
    const cy = ensureCy();
    if (!cy) {
      return;
    }

    const g = msg.graph;
    const elements = [
      ...g.nodes.map((n) => ({ data: { id: n.id, label: n.id } })),
      ...g.edges.map((e) => ({
        data: {
          id: e.source + ">" + e.target,
          source: e.source,
          target: e.target,
        },
      })),
    ];

    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: "cose", animate: true, animationDuration: 300 }).run();

    const badge = document.getElementById("impact-badge");
    if (badge) {
      badge.textContent =
        `Stage 05 — files:${g.stats.files} edges:${g.stats.edges} ` +
        `parsed:${g.stats.parsed} in ${g.stats.timeMs}ms`;
    }
  });
})();

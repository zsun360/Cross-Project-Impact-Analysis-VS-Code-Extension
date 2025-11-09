/* global cytoscape, acquireVsCodeApi */
(function () {
  // ---------- VS Code bridge ----------
  const vscode =
    typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi()
      : { postMessage() {} };
  const post = (type, payload) => {
    try {
      vscode.postMessage({ type, payload });
    } catch {
      /* empty */
    }
  };
  const log = (msg) => post("log", { message: String(msg) });

  // ---------- runtime ----------
  const state = {
    cy: null,
    inited: false,
    viewStack: [], // [{ kind: 'project' | 'symbol', elements, meta }]
    viewMode: "project", // 'project' | 'symbol'
  };

  const titleEl = document.getElementById("impact-title");
  const metaEl = document.getElementById("impact-meta");

  // ---------- init once ----------

  function ensureInstance() {
    if (state.inited && state.cy) {
      return state.cy;
    }

    const container = document.getElementById("cy");
    if (!container || typeof cytoscape !== "function") {
      console.error("[graph] container or cytoscape missing");
      return null;
    }
    container.innerHTML = ""; // 清空旧图
    const cy = cytoscape({
      container,
      wheelSensitivity: 0.15,
      style: [
        // base styles
        {
          selector: "node",
          style: {
            "background-color": "#1e88e5",
            width: 28,
            height: 18,
            label: "data(label)",
            color: "#fff",
            "font-size": 10,
            "text-valign": "center",
            "text-halign": "center",
            "text-outline-width": 2,
            "text-outline-color": "#1565c0",
            shape: "round-rectangle",
          },
        },
        {
          selector: 'node[lang = "ts"]',
          style: {
            "background-color": "#4FC3F7",
          },
        },
        {
          selector: 'node[lang = "js"]',
          style: {
            "background-color": "#FFEE58",
          },
        },
        {
          selector: 'node[lang = "py"]',
          style: {
            "background-color": "#81C784",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#90caf9",
            "target-arrow-color": "#90caf9",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        // highlight styles (split for node / edge)
        {
          selector: "node.hl",
          style: {
            "background-color": "#ffd54f",
            "text-outline-color": "#ffb300",
            "border-width": 2,
            "border-color": "#ffca28",
            // 注意：不改 width/height，避免把节点压扁
          },
        },
        {
          selector: "edge.hl",
          style: {
            "line-color": "#ffca28",
            "target-arrow-color": "#ffca28",
            width: 3,
          },
        },
        // dim styles
        {
          selector: ".dim",
          style: { opacity: 0.25 },
        },
      ],
    });

    // 深色背景
    cy.container().style.background = "#0f111a";

    // ---------- highlight helpers ----------
    let lastNeighborhood = null;
    let lastNode = null;

    function clearHighlight() {
      const eles = state.cy?.elements();
      if (eles) {
        eles.removeClass("hl");
        eles.removeClass("dim");
      }
      lastNeighborhood = null;
      lastNode = null;
    }

    function highlightNeighborhood(n) {
      clearHighlight();
      if (!n) {
        return;
      }
      const nb = n.closedNeighborhood();
      nb.nodes().addClass("hl");
      nb.edges().addClass("hl");
      // 其它全部淡化
      cy.elements().difference(nb).addClass("dim");
      lastNeighborhood = nb;
      lastNode = n;
    }

    // 屏蔽原生右键菜单
    cy.container().addEventListener("contextmenu", (e) => e.preventDefault());

    // 左键：Ctrl/⌘ 高亮切换；普通点击走 drill
    cy.on("tap", "node", (evt) => {
      const e = evt.originalEvent;
      const isCtrl = !!(e && (e.ctrlKey || e.metaKey));
      const n = evt.target;

      if (isCtrl) {
        if (lastNode && lastNode.id() === n.id()) {
          clearHighlight();
        } else {
          highlightNeighborhood(n);
        }
        return;
      }

      // 根据数据决定行为：symbol 节点 → openSymbol；否则 → drill

      const file = n.data("file");
      const loc = n.data("loc");
      const isSymbol = n.hasClass("symbol-node");
      const isSymbolRoot = n.hasClass("symbol-root");

      // 符号视图里的节点（包括 root）→ 打开文件（有 loc 就定位，没有就到文件头）
      if (file && (loc || isSymbol || isSymbolRoot)) {
        const safeLoc = loc || { line: 1, column: 0 };
        post("openSymbol", { file, loc: safeLoc });
        return;
      }

      // 项目级文件节点 → drill
      const path = n.data("path");
      if (path) {
        post("drill", { id: path });
      }
    });

    // 点击空白 & Esc 还原
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        clearHighlight();
      }
    });

    // 小工具：重新跑一次布局并自适应视野
    function runLayout() {
      const t0 = performance.now();
      const layout = cy.layout({ name: "cose", animate: false });
      layout.on("layoutstop", () => {
        cy.resize();
        cy.fit(undefined, 32);
        cy.center();
        log(`[metrics] relayout=${(performance.now() - t0).toFixed(1)} ms`);
      });
      layout.run();
    }

    // 键盘：按 R 重新布局（不区分大小写）
    window.addEventListener("keydown", (e) => {
      // 检测用户是否正在输入框中打字。如果是，就直接返回，不执行其他逻辑（如自定义快捷键）。这可以防止干扰用户的正常输入行为。
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") {
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        try {
          runLayout();
        } catch {
          /* empty */
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        clearHighlight();
      }
    });

    // add custom tooltip
    const tooltip = createTooltip();

    // 鼠标移入节点：显示 tooltip
    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      const path = node.data("path");
      if (!path) {
        return;
      }

      const e = event.originalEvent;
      if (!e) {
        return;
      }

      tooltip.show(path, e.clientX, e.clientY);
    });

    // 在节点上移动：更新位置
    cy.on("mousemove", "node", (event) => {
      const e = event.originalEvent;
      if (!e) {
        return;
      }

      tooltip.move(e.clientX, e.clientY);
    });

    // 移出节点：隐藏 tooltip
    cy.on("mouseout", "node", () => {
      tooltip.hide();
    });

    // 视图缩放或拖动画布时隐藏 tooltip（避免残留）
    cy.on("pan zoom", () => {
      tooltip.hide();
    });

    // export for DevTools
    window.cy = cy;
    state.cy = cy;
    window.relayout = runLayout;
    state.inited = true;
    return cy;
  }

  function setHeaderForProject(graph) {
    if (!titleEl || !metaEl) {
      return;
    }
    titleEl.textContent =
      "Cross-Project Impact Analysis — Interactive Visualization";

    const files = graph.files?.length ?? 0;
    const edges = graph.edges?.length ?? 0;
    const parsed = graph.parsed ?? files;
    metaEl.textContent = `  files: ${files}   edges: ${edges}   parsed: ${parsed}`;
  }

  function setHeaderForSymbol(result) {
    if (!titleEl || !metaEl) {
      return;
    }
    const fileName =
      (result?.file || "").split(/[\\/]/).pop() || result?.file || "";
    const count = (result?.nodes || []).length;
    titleEl.textContent = `Symbols in ${fileName}`;
    metaEl.textContent = `  symbols: ${count}`;
  }

  // ---------- data mapping ----------
  function buildProjectElements(graph) {
    const nodes = (graph?.nodes ?? []).map((n) => ({
      group: "nodes",
      data: {
        id: n.id,
        label: n.label || n.id,
        path: n.path || n.id, // 换成 path
        lang: n.lang,
      },
    }));
    const edges = (graph?.edges ?? []).map((e) => ({
      group: "edges",
      data: {
        id: e.id || `${e.source}>${e.target}`,
        source: e.source,
        target: e.target,
      },
    }));
    return [...nodes, ...edges];
  }

  // ---------- render ----------
  function renderFromAst(graph) {
    const cy = ensureInstance();
    if (!cy) {
      // console.log("[view] renderFromAst: no cy");
      return;
    }

    const t0 = performance.now();
    const elements = buildProjectElements(graph);

    console.log("[view] renderFromAst: elements.length =", elements?.length);

    // 做一个浅拷贝快照，避免后续修改污染
    const snapshot = elements.map((e) => ({
      ...e,
      data: { ...e.data },
      position: e.position ? { ...e.position } : undefined,
    }));

    state.viewMode = "project";
    state.viewStack = [
      { kind: "project", elements: snapshot, meta: { graph } },
    ]; // 每次重新 render 项目图，就把栈重置成「仅有顶层」

    setHeaderForProject(graph); // 🔑 顶部显示类似: "AST_Import_Parser files: ..."

    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
      // 清理任何残留高亮/淡化
      cy.elements().removeClass("hl").removeClass("dim");
    });

    console.log(
      "[view] renderFromAst: cy elements after add =",
      cy.elements().length
    );

    // 布局 + 视野
    const tLayoutStart = performance.now();
    const layout = cy.layout({ name: "cose", animate: false });
    layout.on("layoutstop", () => {
      const tLayoutEnd = performance.now();
      cy.resize();
      cy.fit(undefined, 32);
      cy.center();
      log(`[metrics] layout=${(tLayoutEnd - tLayoutStart).toFixed(1)} ms`);
    });
    layout.run();

    removeBackButtonIfAny();

    const t1 = performance.now();
    log(
      `[metrics] render(total)=${(t1 - t0).toFixed(1)} ms nodes=${
        cy.nodes().length
      } edges=${cy.edges().length}`
    );
  }

  function renderSymbolGraph(result) {
    console.log(
      "[view] renderSymbolGraph called with",
      (result?.nodes || []).length,
      "nodes"
    );

    const cy = ensureInstance();
    if (!cy) {
      return;
    }

    const t0 = performance.now();
    const elements = buildSymbolElements(result);

    const snapshot = elements.map((e) => ({
      ...e,
      data: { ...e.data },
      position: e.position ? { ...e.position } : undefined,
    }));

    state.viewMode = "symbol";
    // 压栈（在项目图之上）
    state.viewStack.push({
      kind: "symbol",
      elements: snapshot,
      meta: { result },
    });

    console.log(
      "[view] renderSymbolGraph -> push symbol, stack:",
      state.viewStack.map((v) => v.kind)
    );

    setHeaderForSymbol(result); // 🔑 顶部显示: "Symbols in main.ts  symbols: 1"

    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
      cy.elements().removeClass("hl").removeClass("dim");
    });

    const layout = cy.layout({
      name: "breadthfirst",
      animate: false,
      directed: true,
      spacingFactor: 1.2,
    });
    layout.on("layoutstop", () => {
      cy.resize();
      cy.fit(undefined, 32);
      cy.center();
    });
    layout.run();

    ensureBackButton(); // add back button in symbol view

    const t1 = performance.now();
    log(
      `[metrics] render(symbol)=${(t1 - t0).toFixed(1)} ms nodes=${
        cy.nodes().length
      } edges=${cy.edges().length}`
    );
  }

  function buildSymbolElements(result) {
    const file = result.file || "";
    const fileId = file;
    const nodes = [];
    const edges = [];

    // root 文件节点
    nodes.push({
      group: "nodes",
      data: {
        id: fileId,
        label: file.split(/[\\/]/).pop() || file || "Current File",
        file,
      },
      classes: "file-root symbol-root",
    });

    // 符号节点
    (result.nodes || []).forEach((s) => {
      const id = s.id || `${s.kind}:${s.name}`;
      nodes.push({
        group: "nodes",
        data: {
          id,
          label: s.name || id,
          kind: s.kind,
          file,
          loc: s.loc || null, // 关键：让 ensureInstance 的点击逻辑识别为符号节点
        },
        classes: "symbol-node",
      });

      edges.push({
        group: "edges",
        data: {
          id: `${fileId}->${id}`,
          source: fileId,
          target: id,
          kind: "decl",
        },
      });
    });

    // 预留传入 edges（将来做引用/调用关系时用）
    (result.edges || []).forEach((e) => {
      edges.push({
        group: "edges",
        data: {
          id: e.id || `${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
          kind: e.kind || "ref",
        },
      });
    });

    return [...nodes, ...edges];
  }

  // ---------- export ----------
  function exportPNG() {
    const cy = ensureInstance();
    if (!cy) {
      return;
    }
    const dataUrl = cy.png({
      full: true,
      scale: 2,
      bg: getComputedStyle(document.body).backgroundColor,
    });
    post("savePNG", { dataUrl, suggested: "impact-graph.png" });
    post("export:result", { kind: "png", dataUrl }); // 兼容另一条回传协议
  }

  // ---------- message pump ----------
  window.addEventListener("message", (e) => {
    const { type, payload } = e.data || {};
    if (!type) {
      return;
    }

    if (type === "render:graph" && payload) {
      renderFromAst(payload);
      return;
    }
    if (type === "symbolGraph:render" && payload) {
      renderSymbolGraph(payload);
      return;
    }

    if (type === "render") {
      return;
    } // 旧路径忽略
    if (type === "exportPNG" || type === "export:png") {
      exportPNG();
      return;
    }
  });

  function createTooltip() {
    const el = document.createElement("div");
    el.className = "impact-tooltip";
    document.body.appendChild(el);

    let visible = false;

    function show(text, x, y) {
      if (!text) {
        return;
      }
      el.textContent = text;
      el.style.left = `${x + 12}px`;
      el.style.top = `${y + 12}px`;
      if (!visible) {
        el.style.display = "block";
        visible = true;
      }
    }

    function move(x, y) {
      if (!visible) {
        return;
      }
      el.style.left = `${x + 12}px`;
      el.style.top = `${y + 12}px`;
    }

    function hide() {
      if (!visible) {
        return;
      }
      el.style.display = "none";
      visible = false;
    }

    return { show, move, hide };
  }

  function ensureBackButton() {
    let btn = document.getElementById("impact-back-btn");
    if (btn) {
      return;
    } // 已经有就不重复加

    btn = document.createElement("button");
    btn.id = "impact-back-btn";
    btn.textContent = "← Back";
    btn.style.position = "absolute";
    btn.style.top = "6px";
    btn.style.left = "8px";
    btn.style.zIndex = "9999";
    btn.style.padding = "2px 10px";
    btn.style.borderRadius = "6px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.background = "#222";
    btn.style.color = "#fff";
    btn.style.opacity = "0.9";

    btn.onclick = () => {
      console.log(
        "[back] clicked, stack before:",
        state.viewStack.map((v) => v.kind)
      );

      if (!state.viewStack || state.viewStack.length <= 1) {
        console.log("[back] nothing to pop");
        return;
      }

      const popped = state.viewStack.pop();
      const prev = state.viewStack[state.viewStack.length - 1];

      console.log(
        "[back] popped: %o prev: %o stack now: %o",
        popped?.kind,
        prev?.kind,
        state.viewStack.map((v) => v.kind)
      );

      if (!prev) {
        btn.remove();
        return;
      }

      // 如果上一层是 project，直接用 meta.graph 全量重渲染
      if (prev.kind === "project" && prev.meta?.graph) {
        renderFromAst(prev.meta.graph);
        // renderFromAst 里会：
        //   - 重置 viewStack = [{ kind:'project', ... }]
        //   - 更新 header
        //   - 清除 Back 按钮（removeBackButtonIfAny）
        return;
      }

      // 如果未来要支持多级 symbol 栈，再走通用恢复逻辑
      if (prev.elements) {
        const cy = ensureInstance();
        if (!cy) {
          return;
        }

        cy.batch(() => {
          cy.elements().remove();
          cy.add(prev.elements);
          cy.elements().removeClass("hl").removeClass("dim");
        });

        cy.resize();
        cy.fit(undefined, 32);
        cy.center();

        if (prev.kind === "symbol" && prev.meta?.result) {
          setHeaderForSymbol(prev.meta.result);
        }

        if (state.viewStack.length === 1) {
          btn.remove();
        }
      } else {
        console.log("[back] prev has no elements/meta, nothing to restore");
        if (state.viewStack.length === 1) {
          btn.remove();
        }
      }
    };

    document.body.appendChild(btn);
  }

  function removeBackButtonIfAny() {
    const btn = document.getElementById("impact-back-btn");
    if (btn) {
      btn.remove();
      console.log("[ui] removed back button");
    }
  }

  // ready
  ensureInstance();
  post("ready");
})();

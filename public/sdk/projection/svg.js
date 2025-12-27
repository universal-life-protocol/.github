function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildState(events) {
  const nodes = new Map();
  const edges = new Map();

  events.forEach((evt, index) => {
    if (evt.type === "node.add" && evt.payload) {
      const id = evt.payload.id || evt.id;
      const x = num(evt.payload.x, 0);
      const y = num(evt.payload.y, 0);
      if (!nodes.has(id)) {
        nodes.set(id, { id, x, y, selected: false, history: [{ x, y }] });
      }
    }
    if (evt.type === "node.move" && evt.payload) {
      const id = evt.payload.id;
      if (!id) return;
      const node = nodes.get(id) || { id, x: 0, y: 0, selected: false, history: [] };
      node.x = num(evt.payload.x, node.x);
      node.y = num(evt.payload.y, node.y);
      node.history.push({ x: node.x, y: node.y });
      nodes.set(id, node);
    }
    if (evt.type === "node.select" && evt.payload) {
      const id = evt.payload.id;
      if (!id) return;
      const node = nodes.get(id) || { id, x: 0, y: 0, selected: false, history: [] };
      node.selected = true;
      node.selectedAt = index;
      nodes.set(id, node);
    }
    if (evt.type === "edge.add" && evt.payload) {
      const id = evt.payload.id || evt.id;
      const from = evt.payload.from;
      const to = evt.payload.to;
      const x1 = num(evt.payload.x1, 0);
      const y1 = num(evt.payload.y1, 0);
      const x2 = num(evt.payload.x2, 0);
      const y2 = num(evt.payload.y2, 0);
      edges.set(id, { id, from, to, x1, y1, x2, y2, removed: false, createdAt: index });
    }
    if (evt.type === "edge.remove" && evt.payload) {
      const id = evt.payload.id;
      if (!id) return;
      const edge = edges.get(id);
      if (edge) {
        edge.removed = true;
        edge.removedAt = index;
      }
    }
  });

  return { nodes, edges };
}

function svgScript() {
  return `<![CDATA[
    function vgNodeSelect(id) {
      if (window.vgSelectHandler) {
        window.vgSelectHandler(id);
      } else {
        window.dispatchEvent(new CustomEvent('vg-node-select', { detail: { id } }));
      }
    }
    function vgEdgeSelect(id) {
      if (window.vgEdgeSelectHandler) {
        window.vgEdgeSelectHandler(id);
      } else {
        window.dispatchEvent(new CustomEvent('vg-edge-select', { detail: { id } }));
      }
    }
  ]]>`;
}

function renderSvg(events, options = {}) {
  const width = options.width ?? 900;
  const height = options.height ?? 480;
  const background = options.background ?? "#fffdf7";
  const animate = options.animate ?? false;
  const stepMs = options.stepMs ?? 200;

  const { nodes, edges } = buildState(events);
  const shapes = [];

  edges.forEach((edge) => {
    let x1 = edge.x1;
    let y1 = edge.y1;
    let x2 = edge.x2;
    let y2 = edge.y2;
    if (edge.from && nodes.has(edge.from)) {
      const from = nodes.get(edge.from);
      x1 = from.x;
      y1 = from.y;
    }
    if (edge.to && nodes.has(edge.to)) {
      const to = nodes.get(edge.to);
      x2 = to.x;
      y2 = to.y;
    }
    const classes = edge.removed ? "edge removed" : "edge";
    const removedAttr = edge.removed ? ` data-removed="true"` : "";
    const base = `<line data-edge-id="${edge.id}" class="${classes}"${removedAttr} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2c1f16" stroke-width="1" onclick="vgEdgeSelect('${edge.id}')" />`;
    if (!animate || !edge.removed || edge.removedAt === undefined) {
      shapes.push(base);
      return;
    }
    const begin = `${edge.removedAt * stepMs}ms`;
    shapes.push(
      `<line data-edge-id="${edge.id}" class="${classes}"${removedAttr} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2c1f16" stroke-width="1" onclick="vgEdgeSelect('${edge.id}')">` +
        `<animate attributeName="opacity" begin="${begin}" dur="${stepMs}ms" values="1;0.2" fill="freeze" />` +
      `</line>`
    );
  });

  nodes.forEach((node) => {
    const classes = node.selected ? "node selected" : "node";
    const base = `<rect data-node-id="${node.id}" class="${classes}" x="${node.x - 4}" y="${node.y - 4}" width="8" height="8" fill="#2c1f16" onclick="vgNodeSelect('${node.id}')" />`;
    if (!animate || (node.history.length < 2 && node.selectedAt === undefined)) {
      shapes.push(base);
      return;
    }
    const valuesX = node.history.map((p) => p.x - 4).join(";");
    const valuesY = node.history.map((p) => p.y - 4).join(";");
    const dur = `${(node.history.length - 1) * stepMs}ms`;
    const selectBegin = node.selectedAt !== undefined ? `${node.selectedAt * stepMs}ms` : "0ms";
    shapes.push(
      `<rect data-node-id="${node.id}" class="${classes}" x="${node.x - 4}" y="${node.y - 4}" width="8" height="8" fill="#2c1f16" onclick="vgNodeSelect('${node.id}')">` +
        (node.history.length > 1 ? `<animate attributeName="x" dur="${dur}" values="${valuesX}" fill="freeze" />` : "") +
        (node.history.length > 1 ? `<animate attributeName="y" dur="${dur}" values="${valuesY}" fill="freeze" />` : "") +
        (node.selectedAt !== undefined ? `<animate attributeName="stroke" begin="${selectBegin}" dur="${stepMs}ms" values="#2c1f16;#a24b2d" fill="freeze" />` : "") +
      `</rect>`
    );
  });

  events.forEach((evt) => {
    if (evt.type === "cursor.move" && evt.payload) {
      const x = num(evt.payload.x, 0);
      const y = num(evt.payload.y, 0);
      shapes.push(`<circle cx="${x}" cy="${y}" r="3" fill="#a24b2d" opacity="0.6" />`);
    }
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${background}" />`,
    `<style>
      .node { cursor: pointer; }
      .node.selected { stroke: #a24b2d; stroke-width: 2; }
      .edge { cursor: pointer; }
      .edge.removed { opacity: 0.2; stroke-dasharray: 4 4; }
    </style>`,
    `<script type="application/ecmascript">${svgScript()}</script>`,
    shapes.join(""),
    `</svg>`,
  ].join("");
}

module.exports = { renderSvg };

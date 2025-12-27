export type SvgObjOptions = {
  texture?: string;
};

type ParsedShape = {
  kind: "rect" | "line";
  id: string;
  classes: string[];
  attrs: Record<string, string>;
};

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseShapes(svg: string): ParsedShape[] {
  const shapes: ParsedShape[] = [];
  const rectRe = /<rect\b[^>]*>/g;
  const lineRe = /<line\b[^>]*>/g;

  const collect = (re: RegExp, kind: "rect" | "line") => {
    let match: RegExpExecArray | null;
    while ((match = re.exec(svg))) {
      const raw = match[0];
      const attrs = parseAttrs(raw);
      const classes = (attrs.class || "").split(/\s+/).filter(Boolean);
      const id = attrs["data-node-id"] || attrs["data-edge-id"] || `shape_${shapes.length}`;
      shapes.push({ kind, id, classes, attrs });
    }
  };

  collect(rectRe, "rect");
  collect(lineRe, "line");

  return shapes;
}

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [0.17, 0.12, 0.09];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function materialFor(classes: string[]): { name: string; rgba: [number, number, number, number] } {
  const isNode = classes.includes("node");
  const isEdge = classes.includes("edge");
  const isSelected = classes.includes("selected");
  const isRemoved = classes.includes("removed");
  const base = "#2c1f16";
  const accent = "#a24b2d";

  if (isNode && isSelected) {
    const [r, g, b] = hexToRgb(accent);
    return { name: "node_selected", rgba: [r, g, b, 1] };
  }
  if (isEdge && isRemoved) {
    const [r, g, b] = hexToRgb(base);
    return { name: "edge_removed", rgba: [r, g, b, 0.2] };
  }
  if (isEdge) {
    const [r, g, b] = hexToRgb(base);
    return { name: "edge_default", rgba: [r, g, b, 1] };
  }
  const [r, g, b] = hexToRgb(base);
  return { name: "node_default", rgba: [r, g, b, 1] };
}

export function svgToObj(svg: string, options: SvgObjOptions = {}) {
  const shapes = parseShapes(svg);
  const obj: string[] = [];
  const mtl: string[] = [];
  const materials = new Map<string, { rgb: [number, number, number]; alpha: number }>();

  let vertexIndex = 1;
  shapes.forEach((shape) => {
    const { name, rgba } = materialFor(shape.classes);
    if (!materials.has(name)) {
      materials.set(name, { rgb: [rgba[0], rgba[1], rgba[2]], alpha: rgba[3] });
    }

    obj.push(`o ${shape.kind}_${shape.id}`);
    obj.push(`usemtl ${name}`);

    if (shape.kind === "rect") {
      const x = toNumber(shape.attrs.x, 0);
      const y = toNumber(shape.attrs.y, 0);
      const w = toNumber(shape.attrs.width, 8);
      const h = toNumber(shape.attrs.height, 8);
      obj.push(`v ${x} ${y} 0`);
      obj.push(`v ${x + w} ${y} 0`);
      obj.push(`v ${x + w} ${y + h} 0`);
      obj.push(`v ${x} ${y + h} 0`);
      obj.push(`f ${vertexIndex} ${vertexIndex + 1} ${vertexIndex + 2} ${vertexIndex + 3}`);
      vertexIndex += 4;
      return;
    }

    const x1 = toNumber(shape.attrs.x1, 0);
    const y1 = toNumber(shape.attrs.y1, 0);
    const x2 = toNumber(shape.attrs.x2, 0);
    const y2 = toNumber(shape.attrs.y2, 0);
    obj.push(`v ${x1} ${y1} 0`);
    obj.push(`v ${x2} ${y2} 0`);
    obj.push(`l ${vertexIndex} ${vertexIndex + 1}`);
    vertexIndex += 2;
  });

  materials.forEach((value, key) => {
    mtl.push(`newmtl ${key}`);
    mtl.push(`Kd ${value.rgb[0].toFixed(4)} ${value.rgb[1].toFixed(4)} ${value.rgb[2].toFixed(4)}`);
    if (value.alpha < 1) {
      mtl.push(`d ${value.alpha.toFixed(4)}`);
    }
    if (options.texture && key.startsWith("node")) {
      mtl.push(`map_Kd ${options.texture}`);
    }
    mtl.push("");
  });

  return {
    obj: obj.join("\n"),
    mtl: mtl.join("\n"),
  };
}

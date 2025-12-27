export type SvgGltfOptions = {
  texture?: string;
};

type ParsedShape = {
  kind: "rect" | "line";
  id: string;
  classes: string[];
  attrs: Record<string, string>;
};

type BufferChunk = {
  bytes: Uint8Array;
  viewIndex: number;
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

function pad4(value: number): number {
  return (4 - (value % 4)) % 4;
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

export function svgToGltf(svg: string, options: SvgGltfOptions = {}) {
  const shapes = parseShapes(svg);
  const bufferViews: any[] = [];
  const accessors: any[] = [];
  const materials: any[] = [];
  const meshes: any[] = [];
  const nodes: any[] = [];
  const chunks: Uint8Array[] = [];
  const materialIndex = new Map<string, number>();

  let byteOffset = 0;

  const addView = (data: Uint8Array): BufferChunk => {
    const pad = pad4(byteOffset);
    if (pad) {
      chunks.push(new Uint8Array(pad));
      byteOffset += pad;
    }
    const viewIndex = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: data.length });
    chunks.push(data);
    byteOffset += data.length;
    return { bytes: data, viewIndex };
  };

  const ensureMaterial = (name: string, rgba: [number, number, number, number]) => {
    if (materialIndex.has(name)) return materialIndex.get(name)!;
    const idx = materials.length;
    materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: [rgba[0], rgba[1], rgba[2], rgba[3]],
        metallicFactor: 0,
        roughnessFactor: 0.9,
      },
      alphaMode: rgba[3] < 1 ? "BLEND" : "OPAQUE",
      doubleSided: true,
    });
    if (options.texture && name.startsWith("node")) {
      materials[idx].pbrMetallicRoughness.baseColorTexture = { index: 0 };
    }
    materialIndex.set(name, idx);
    return idx;
  };

  shapes.forEach((shape) => {
    const { name, rgba } = materialFor(shape.classes);
    const matIndex = ensureMaterial(name, rgba);
    let positions: number[] = [];
    let indices: number[] = [];
    let mode = 4;

    if (shape.kind === "rect") {
      const x = toNumber(shape.attrs.x, 0);
      const y = toNumber(shape.attrs.y, 0);
      const w = toNumber(shape.attrs.width, 8);
      const h = toNumber(shape.attrs.height, 8);
      positions = [
        x, y, 0,
        x + w, y, 0,
        x + w, y + h, 0,
        x, y + h, 0,
      ];
      indices = [0, 1, 2, 0, 2, 3];
      mode = 4;
    } else {
      const x1 = toNumber(shape.attrs.x1, 0);
      const y1 = toNumber(shape.attrs.y1, 0);
      const x2 = toNumber(shape.attrs.x2, 0);
      const y2 = toNumber(shape.attrs.y2, 0);
      positions = [x1, y1, 0, x2, y2, 0];
      indices = [0, 1];
      mode = 1;
    }

    const posArray = new Float32Array(positions);
    const idxArray = new Uint16Array(indices);
    const posView = addView(new Uint8Array(posArray.buffer));
    const idxView = addView(new Uint8Array(idxArray.buffer));

    const posAccessorIndex = accessors.length;
    accessors.push({
      bufferView: posView.viewIndex,
      componentType: 5126,
      count: positions.length / 3,
      type: "VEC3",
      min: [Math.min(...positions.filter((_, i) => i % 3 === 0)), Math.min(...positions.filter((_, i) => i % 3 === 1)), 0],
      max: [Math.max(...positions.filter((_, i) => i % 3 === 0)), Math.max(...positions.filter((_, i) => i % 3 === 1)), 0],
    });

    const idxAccessorIndex = accessors.length;
    accessors.push({
      bufferView: idxView.viewIndex,
      componentType: 5123,
      count: indices.length,
      type: "SCALAR",
    });

    const meshIndex = meshes.length;
    meshes.push({
      primitives: [
        {
          attributes: { POSITION: posAccessorIndex },
          indices: idxAccessorIndex,
          material: matIndex,
          mode,
        },
      ],
      name: `${shape.kind}_${shape.id}`,
    });

    nodes.push({ mesh: meshIndex, name: `${shape.kind}_${shape.id}` });
  });

  const buffer = concatChunks(chunks);
  const bufferUri = `data:application/octet-stream;base64,${Buffer.from(buffer).toString("base64")}`;

  const gltf: any = {
    asset: { version: "2.0", generator: "virtual-revelation svg-to-gltf" },
    buffers: [{ uri: bufferUri, byteLength: buffer.length }],
    bufferViews,
    accessors,
    materials,
    meshes,
    nodes,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    scene: 0,
  };

  if (options.texture) {
    gltf.images = [{ uri: options.texture }];
    gltf.textures = [{ source: 0 }];
  }

  return gltf;
}

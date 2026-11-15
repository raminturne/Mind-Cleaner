export const COLORS = [
  "#c6dc97",
  "#e7af9c",
  "#a8c5e5",
  "#c6b6df",
  "#e1cf9b",
  "#9fcfc2",
];
export const uid = () => crypto.randomUUID();
export const clone = (value) => structuredClone(value);
export function blankBoard(title = "Untitled") {
  return {
    ...board(title),
    virtualRoot: true,
    layout: "right",
    connector: "rounded",
    root: node(""),
  };
}
export function asCanvasBoard(value) {
  if (value.virtualRoot) return value;
  return {
    ...value,
    virtualRoot: true,
    root: { ...node(""), children: [value.root] },
  };
}
export function detachBranch(value, id, position) {
  const found = find(value.root, id);
  if (!value.virtualRoot || !found?.parent || found.parent === value.root)
    return false;
  found.parent.children = found.parent.children.filter(
    (child) => child.id !== id,
  );
  value.root.children.push(found.node);
  found.node.dx = position.x;
  found.node.dy = position.y;
  return true;
}
export function node(text = "New thought", color = COLORS[0], dir = null) {
  return {
    id: uid(),
    text,
    note: "",
    color,
    dir,
    dx: 0,
    dy: 0,
    children: [],
    attachments: [],
    hasTodo: false,
    checked: false,
    collapsed: false,
  };
}
export function board(title = "Untitled map", sample = false) {
  const root = node(title);
  const b = {
    id: uid(),
    title,
    root,
    connector: "soft",
    shape: "soft",
    layout: "balanced",
    updatedAt: Date.now(),
  };
  if (sample) {
    [
      ["Audience", "left", "Early adopters", "User interviews"],
      ["Product", "left", "Core features", "First prototype"],
      ["Content", "right", "Tutorial series", "Landing page"],
      ["Launch", "right", "Beta release", "Collect feedback"],
    ].forEach(([title, dir, ...leaves], i) => {
      const n = node(title, COLORS[(i + 1) % COLORS.length], dir);
      n.children = leaves.map((t) => node(t, n.color, dir));
      root.children.push(n);
    });
    root.children[2].note =
      "Turn a good idea into something worth sharing.\nStart with one useful tutorial.";
    root.children[3].children.forEach((n) => (n.hasTodo = true));
  }
  return b;
}
export const walk = (root, fn, parent = null, depth = 0) => {
  fn(root, parent, depth);
  root.children.forEach((n) => walk(n, fn, root, depth + 1));
};
export function find(root, id) {
  let result;
  walk(root, (n, p) => {
    if (n.id === id) result = { node: n, parent: p };
  });
  return result;
}
export function descendants(root) {
  const ids = new Set();
  walk(root, (n) => ids.add(n.id));
  return ids;
}
export function normalizeBoard(raw) {
  if (!raw || typeof raw !== "object" || !raw.root)
    throw Error("This file does not contain a mind map.");
  let count = 0;
  const ids = new Set();
  function clean(n, depth = 0) {
    if (!n || typeof n !== "object" || depth > 100 || ++count > 5000)
      throw Error("Map is invalid or exceeds 5,000 branches / 100 levels.");
    const id = typeof n.id === "string" && !ids.has(n.id) ? n.id : uid();
    ids.add(id);
    return {
      ...n,
      id,
      text: String(n.text ?? n.title ?? "New thought").slice(0, 10000),
      note: String(n.note ?? "").slice(0, 100000),
      color: /^#[0-9a-f]{6}$/i.test(n.color) ? n.color : COLORS[0],
      dir: ["left", "right", "up", "down"].includes(n.dir) ? n.dir : null,
      align: ["left", "center", "right"].includes(n.align) ? n.align : "center",
      filled: n.filled === true,
      dx: Number.isFinite(n.dx) ? n.dx : 0,
      dy: Number.isFinite(n.dy) ? n.dy : 0,
      attachments: Array.isArray(n.attachments)
        ? n.attachments.filter((a) => a && typeof a.name === "string")
        : [],
      children: Array.isArray(n.children)
        ? n.children.map((c) => clean(c, depth + 1))
        : [],
    };
  }
  const root = clean(raw.root);
  return {
    ...raw,
    id: typeof raw.id === "string" ? raw.id : uid(),
    title: String(raw.title || root.text),
    root,
    connector: ["sharp", "rounded"].includes(raw.connector)
      ? raw.connector
      : "soft",
    shape: raw.shape === "sharp" ? "sharp" : "soft",
    layout: ["balanced", "left", "right", "up", "down"].includes(raw.layout)
      ? raw.layout
      : "balanced",
  };
}
export function importBoards(raw) {
  const list = Array.isArray(raw?.boards) ? raw.boards : [raw?.board || raw];
  if (!list.length) throw Error("No maps were found.");
  return list.map(normalizeBoard);
}
export function moveBranch(b, id, parentId, dir) {
  const from = find(b.root, id),
    to = find(b.root, parentId);
  if (!from?.parent || !to || descendants(from.node).has(parentId))
    return false;
  from.parent.children = from.parent.children.filter((n) => n.id !== id);
  to.node.children.push(from.node);
  to.node.collapsed = false;
  walk(from.node, (n) => {
    n.dir = dir || to.node.dir || "right";
    n.dx = 0;
    n.dy = 0;
  });
  return true;
}
export function removeBranches(b, ids) {
  walk(b.root, (n) => {
    n.children = n.children.filter((c) => !ids.has(c.id));
  });
}
export class History {
  past = [];
  future = [];
  push(b) {
    this.past.push(clone(b));
    if (this.past.length > 60) this.past.shift();
    this.future = [];
  }
  undo(b) {
    if (!this.past.length) return null;
    this.future.push(clone(b));
    return this.past.pop();
  }
  redo(b) {
    if (!this.future.length) return null;
    this.past.push(clone(b));
    return this.future.pop();
  }
}
export function imageCard(n) {
  return n.attachments.find(
    (a) => a.is_image && (n.imageOnly === true || n.text === a.name),
  );
}
export function imagePreview(n) {
  const image = imageCard(n) || n.attachments.find((a) => a.is_image);
  return image &&
    /^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml);/i.test(image.data_url)
    ? image
    : null;
}
export function mediaCaption(n) {
  return String((imageCard(n) || n.attachments[0])?.caption ?? "")
    .trim()
    .slice(0, 500);
}
export function cardInset(n, depth) {
  if (depth === 0 && n.hasTodo) return 51;
  if (n.hasTodo) return 46;
  return depth === 0 ? 30 : 24;
}
export function measure(n, depth) {
  const attachmentHeight = n.attachments.length
    ? 10 + n.attachments.length * 34
    : 0;
  if (imageCard(n))
    return { w: 276, h: (imagePreview(n) ? 190 : 68) + attachmentHeight };
  const width =
    depth === 0
      ? 354
      : Math.min(350, Math.max(276, 90 + [...n.text].length * 11));
  const charactersPerLine = Math.max(
    1,
    Math.floor((width - 2 * cardInset(n, depth)) / (depth === 0 ? 16 : 13)),
  );
  const lines = Math.max(
    1,
    n.text
      .split("\n")
      .reduce(
        (total, line) =>
          total + Math.max(1, Math.ceil([...line].length / charactersPerLine)),
        0,
      ),
  );
  const image = imagePreview(n);
  return {
    w: width,
    h:
      (depth === 0 ? 116 : 68) +
      (lines - 1) * (depth === 0 ? 36 : 28) +
      (image ? 104 : 0) +
      attachmentHeight +
      (n.note ? 22 : 0),
  };
}
export function layout(b) {
  const roots = b.virtualRoot ? b.root.children : [b.root];
  const result = new Map();
  const bounds = (positions) => {
    const values = [...positions.values()];
    return {
      left: Math.min(...values.map((p) => p.x - p.w / 2)),
      right: Math.max(...values.map((p) => p.x + p.w / 2)),
      top: Math.min(...values.map((p) => p.y - p.h / 2)),
      bottom: Math.max(...values.map((p) => p.y + p.h / 2)),
    };
  };
  function build(root, depth) {
    const size = measure(root, depth);
    const items = new Map([
      [root.id, { ...size, x: 0, y: 0, node: root, depth, side: "root" }],
    ]);
    if (root.collapsed) return items;
    const groups = { left: [], right: [], up: [], down: [] };
    root.children.forEach((child, index) => {
      const side =
        child.dir ||
        (b.layout === "balanced" ? (index % 2 ? "right" : "left") : b.layout) ||
        "down";
      const positions = build(child, depth + 1);
      groups[side].push({ child, positions, box: bounds(positions) });
    });
    for (const [side, children] of Object.entries(groups)) {
      const vertical = side === "down" || side === "up";
      const span = (c) =>
        vertical ? c.box.right - c.box.left : c.box.bottom - c.box.top;
      let cursor =
        -(
          children.reduce((sum, c) => sum + span(c), 0) +
          Math.max(0, children.length - 1) * 64
        ) / 2;
      for (const [index, child] of children.entries()) {
        const box = child.box;
        const cross = cursor + span(child) / 2;
        let x, y;
        if (vertical) {
          x = cross - (box.left + box.right) / 2;
          y =
            side === "down"
              ? size.h / 2 + 88 - box.top
              : -size.h / 2 - 88 - box.bottom;
        } else {
          y = cross - (box.top + box.bottom) / 2;
          x =
            side === "right"
              ? size.w / 2 + 122 - box.left
              : -size.w / 2 - 122 - box.right;
        }
        for (const [id, p] of child.positions)
          items.set(id, { ...p, x: p.x + x, y: p.y + y });
        const portStep = Math.min(
          15,
          (vertical ? size.w : size.h) / (children.length + 2),
        );
        Object.assign(items.get(child.child.id), {
          parent: root.id,
          side,
          port: (index - (children.length - 1) / 2) * portStep,
        });
        cursor += span(child) + 64;
      }
    }
    return items;
  }
  for (const root of roots) {
    const positions = build(root, 0);
    function offsets(n, dx = 0, dy = 0) {
      const p = positions.get(n.id);
      if (!p) return;
      dx += n.dx || 0;
      dy += n.dy || 0;
      p.x += dx;
      p.y += dy;
      result.set(n.id, p);
      if (!n.collapsed) n.children.forEach((child) => offsets(child, dx, dy));
    }
    offsets(root);
  }
  return result;
}
export function edge(a, b, style = "soft") {
  const vertical = b.side === "up" || b.side === "down",
    sign = b.side === "left" || b.side === "up" ? -1 : 1;
  const x1 = a.x + (vertical ? 0 : (sign * a.w) / 2),
    y1 = a.y + (vertical ? (sign * a.h) / 2 : 0),
    x2 = b.x - (vertical ? 0 : (sign * b.w) / 2),
    y2 = b.y - (vertical ? (sign * b.h) / 2 : 0);
  if (style === "rounded") {
    const port = b.port || 0;
    const start = vertical ? y1 : x1,
      end = vertical ? y2 : x2;
    const crossStart = (vertical ? x1 : y1) + port,
      crossEnd = vertical ? x2 : y2;
    const point = (along, across) =>
      vertical ? `${across},${along}` : `${along},${across}`;
    const mid = start + (end - start) * 0.38;
    const turn = Math.sign(end - start);
    const crossTurn = Math.sign(crossEnd - crossStart);
    const radius = Math.min(
      17,
      Math.abs(mid - start),
      Math.abs(end - mid),
      Math.abs(crossEnd - crossStart) / 2,
    );
    if (radius < 1)
      return `M${point(start, crossStart)} L${point(end, crossEnd)}`;
    return `M${point(start, crossStart)} L${point(mid - turn * radius, crossStart)} Q${point(mid, crossStart)} ${point(mid, crossStart + crossTurn * radius)} L${point(mid, crossEnd - crossTurn * radius)} Q${point(mid, crossEnd)} ${point(mid + turn * radius, crossEnd)} L${point(end, crossEnd)}`;
  }
  if (vertical) {
    const mid = (y1 + y2) / 2;
    return style === "sharp"
      ? `M${x1},${y1} V${mid} H${x2} V${y2}`
      : `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
  }
  const mid = (x1 + x2) / 2;
  return style === "sharp"
    ? `M${x1},${y1} H${mid} V${y2} H${x2}`
    : `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
}
export function markdown(b) {
  const lines = [`# ${b.title}`, ""];
  walk(b.root, (n, p, d) => {
    if (!p) {
      if (n.note) lines.push(n.note, "");
      return;
    }
    lines.push(
      `${"  ".repeat(d - 1)}- ${n.hasTodo ? `[${n.checked ? "x" : " "}] ` : ""}${n.text.replace(/\n/g, " ")}`,
    );
    if (n.note) lines.push(`${"  ".repeat(d)}${n.note.replace(/\n/g, " ")}`);
    n.attachments.forEach((a) =>
      lines.push(`${"  ".repeat(d)}- Attachment: ${a.name}`),
    );
  });
  return lines.join("\n");
}

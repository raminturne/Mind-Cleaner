import {
  COLORS,
  blankBoard,
  asCanvasBoard,
  detachBranch,
  uid,
  clone,
  node,
  board,
  walk,
  find,
  descendants,
  normalizeBoard,
  importBoards,
  moveBranch,
  removeBranches,
  History,
  layout,
  edge,
  imageCard,
  imagePreview,
  cardInset,
  markdown,
} from "./model.mjs";
import * as io from "./storage.mjs";
import { icon, hydrate } from "./icons.mjs";
import * as ai from "./ai.mjs";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const btn = (action, label, i = "", cls = "secondary-button") =>
  `<button class="${cls}" data-action="${action}"${label ? ` aria-label="${escape(label)}"` : ` aria-label="${escape({ closePanel: "Close panel", record: "Record voice note", attach: "Attach file", add: "Add branch" }[action] || action)}"`}>${i ? icon(i) : ""}${label}</button>`;
let state = {
    version: 1,
    boards: [],
    activeBoardId: null,
    theme: "dark",
    motion: true,
    confirmThoughtDeletion: true,
  },
  ready = false,
  selected = new Set(),
  positions = new Map(),
  histories = new Map();
const nodeElements = new Map();
const branchColors = [
  ["Turquoise", "#11d9d0"],
  ["Orange", "#ffa555"],
  ["Lilac", "#c18bf3"],
  ["Blue", "#168afb"],
  ["Pink", "#f09ab4"],
  ["Red", "#f15d65"],
  ["Green", "#73d78d"],
  ["Yellow", "#f6d365"],
  ["White", "#ffffff"],
  ["Gray", "#aeb8c7"],
];
const branchButtonOffset = 24;
const branchPorts = ["left", "right", "up", "down"];
function filledCardInk(color) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
let pointer = null;
let spaceDown = false;
let finishEditing = null;
let pan = { x: 0, y: 0, z: 1 },
  panelType = null,
  view = "map",
  tool = "select",
  freshId = null,
  editing = null,
  saveTimer,
  saveQueue = Promise.resolve(),
  revision = 0,
  savedRevision = 0,
  loadFailed = false;
let aiDraft = null,
  aiTarget = null,
  aiController = null,
  recording = null,
  requestingMic = false,
  allowClose = false;
let aiSettings = ai.defaults(),
  aiForm = { prompt: "", mode: "branch", direction: null },
  aiSettingsQueue = Promise.resolve();
const aiConfig = () => aiSettings.connections[aiSettings.provider];
function persistAI() {
  const snapshot = clone(aiSettings);
  aiSettingsQueue = aiSettingsQueue
    .catch(() => {})
    .then(() => io.saveAISettings(snapshot));
  aiSettingsQueue.catch(() =>
    toast("Could not save AI connection settings.", true),
  );
  return aiSettingsQueue;
}
const active = () =>
  state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];
const current = () =>
  find(active().root, [...selected][0])?.node || active().root;
const history = () => {
  if (!histories.has(active().id)) histories.set(active().id, new History());
  return histories.get(active().id);
};
function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = `toast${error ? " error" : ""}`;
  el.textContent = message;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 5000);
}
function safe(fn) {
  return (...args) =>
    Promise.resolve()
      .then(() => fn(...args))
      .catch((e) => toast(e.message || String(e), true));
}
function saveStatus(text, error = false) {
  $("#saveState").textContent = text;
  $("#saveState").classList.toggle("error", error);
}
function scheduleSave() {
  if (!ready || loadFailed) return;
  revision++;
  saveStatus("Saving…");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => flushSave(), 350);
}
async function flushSave() {
  clearTimeout(saveTimer);
  if (!ready || loadFailed) return false;
  const snapshot = clone(state),
    version = revision;
  if (drag?.type === "nodes") {
    const index = snapshot.boards.findIndex((b) => b.id === drag.snapshot.id);
    snapshot.boards[index] = clone(drag.snapshot);
  }
  const task = saveQueue.catch(() => {}).then(() => io.save(snapshot));
  saveQueue = task;
  try {
    await task;
    savedRevision = Math.max(savedRevision, version);
    if (savedRevision === revision)
      saveStatus(io.native ? "Saved locally" : "Saved in browser");
    return true;
  } catch (e) {
    saveStatus("Save failed · retry", true);
    toast(
      `Could not save: ${e.message || e}. Export JSON to keep a copy.`,
      true,
    );
    return false;
  }
}
function mutate(fn, { panel = false, animate = null } = {}) {
  history().push(active());
  fn(active());
  active().updatedAt = Date.now();
  freshId = animate;
  render();
  if (panel && panelType) openPanel(panelType, false);
  scheduleSave();
}
function render() {
  const b = active();
  document.body.classList.toggle("light", state.theme === "light");
  document.body.classList.toggle("no-motion", !state.motion);
  $("#documentTitle").textContent = b.title;
  $("#mapCount").textContent = state.boards.length;
  $("#emptyCanvas").hidden =
    active().root.children.length > 0 || view !== "map";
  positions = layout(b);
  let count = 0,
    todos = 0,
    done = 0;
  walk(b.root, (n) => {
    if (n !== b.root) count++;
    if (n.hasTodo) {
      todos++;
      if (n.checked) done++;
    }
  });
  $("#mapStats").textContent =
    `${count} thoughts${todos ? ` · ${done}/${todos} tasks complete` : ""}`;
  $$('[data-action="undo"]').forEach(
    (el) => (el.disabled = !history().past.length),
  );
  $$('[data-action="redo"]').forEach(
    (el) => (el.disabled = !history().future.length),
  );
  const layer = $("#nodes");
  layer.replaceChildren();
  nodeElements.clear();
  positions.forEach((p) => {
    const n = p.node,
      el = document.createElement("div");
    el.className = `node ${p.depth === 0 ? "root" : p.depth === 1 ? "primary" : ""} ${b.shape === "sharp" ? "sharp" : ""} ${selected.has(n.id) ? "selected" : ""} ${n.checked ? "checked" : ""} ${n.hasTodo ? "has-todo" : ""} ${freshId === n.id ? "fresh" : ""}`;
    el.dataset.node = n.id;
    el.dataset.align = n.align || "center";
    el.classList.toggle("filled", n.filled === true);
    nodeElements.set(n.id, el);
    el.setAttribute("role", "group");
    const picture = imageCard(n);
    const labelText = picture ? "Image" : n.text;
    el.setAttribute("aria-label", labelText);
    el.classList.toggle("image-only", Boolean(picture));
    el.style.setProperty("--node-color", n.color);
    el.style.setProperty("--card-inset", `${cardInset(n, p.depth)}px`);
    if (n.filled) el.style.setProperty("--card-ink", filledCardInk(n.color));
    el.style.width = `${p.w}px`;
    el.style.minHeight = `${p.h}px`;
    el.style.left = `${p.x - p.w / 2}px`;
    el.style.top = `${p.y - p.h / 2}px`;
    const image = imagePreview(n);
    if (image) {
      const img = document.createElement("img");
      img.className = "node-image";
      img.src = image.data_url;
      img.alt = "Image attachment";
      img.draggable = false;
      el.append(img);
    }
    if (n.hasTodo) {
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = n.checked;
      check.setAttribute("aria-label", `Complete ${labelText}`);
      check.onpointerdown = (e) => e.stopPropagation();
      check.onchange = () => mutate(() => (n.checked = check.checked));
      el.append(check);
    }
    if (!picture || !image) {
      const label = document.createElement("div");
      label.className = picture ? "image-placeholder" : "node-label";
      label.dir = "auto";
      label.textContent = labelText;
      if (image) el.insertBefore(label, el.querySelector(".node-image"));
      else el.append(label);
    }
    if (n.note && !picture) {
      const meta = document.createElement("small");
      meta.innerHTML = icon("note");
      el.append(meta);
    }
    if (n.attachments.length) {
      const files = document.createElement("div");
      files.className = "node-files";
      n.attachments.forEach((attachment) => {
        const row = document.createElement("div");
        row.className = "node-file";
        const ext =
          attachment.ext || attachment.name.split(".").slice(1).pop() || "FILE";
        row.innerHTML = `<button class="node-file-open" title="${escape(attachment.name)}" aria-label="Open ${escape(attachment.name)}">${icon(attachment.is_audio ? "mic" : "file")}<span dir="auto">${escape(attachment.name)}</span><small>${escape(ext.toUpperCase())}</small></button><button class="node-file-remove" aria-label="Remove ${escape(attachment.name)}" title="Remove attachment">${icon("close")}</button>`;
        row.onpointerdown = (e) => e.stopPropagation();
        row.ondblclick = (e) => e.stopPropagation();
        row.querySelector(".node-file-open").onclick = safe(() =>
          io.openAttachment(attachment),
        );
        row.querySelector(".node-file-remove").onclick = () =>
          removeAttachment(n, attachment);
        row.oncontextmenu = (e) => {
          e.preventDefault();
          e.stopPropagation();
          finishEditing?.(false);
          selected = new Set([n.id]);
          openMediaMenu(n, attachment);
        };
        files.append(row);
      });
      el.append(files);
    }
    const add = document.createElement("button");
    add.className = "branch-add";
    add.dataset.direction = branchPorts.includes(childDirection(b))
      ? childDirection(b)
      : "down";
    add.innerHTML = icon("plus");
    add.title = "Add child branch";
    add.setAttribute("aria-label", `Add child to ${labelText}`);
    add.setAttribute("aria-expanded", "false");
    add.setAttribute("aria-controls", "thoughtMenu");
    add.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    add.onclick = (e) => {
      e.stopPropagation();
      const direction = add.dataset.direction;
      finishEditing?.(false);
      selected = new Set([n.id]);
      nodeElements.forEach((element, id) =>
        element.classList.toggle("selected", id === n.id),
      );
      openThoughtMenu("add", n, direction);
    };
    el.append(add);
    el.onpointermove = (event) => {
      if (drag || add.getAttribute("aria-expanded") === "true") return;
      if (add.contains(event.target)) {
        add.dataset.near = "true";
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const edge = Math.min(x, 1 - x, y, 1 - y);
      const near = edge < 0.28;
      add.dataset.near = String(near);
      if (near)
        add.dataset.direction =
          edge === x
            ? "left"
            : edge === 1 - x
              ? "right"
              : edge === y
                ? "up"
                : "down";
    };
    el.onpointerleave = () => {
      add.dataset.near = "false";
    };
    if (n.children.length) {
      const fold = document.createElement("button");
      fold.className = `branch-fold ${n.collapsed ? "folded" : ""}`;
      fold.textContent = n.collapsed ? `+${n.children.length}` : "−";
      fold.title = n.collapsed ? "Expand branches" : "Collapse branches";
      fold.onpointerdown = (e) => e.stopPropagation();
      fold.onclick = (e) => {
        e.stopPropagation();
        mutate(() => (n.collapsed = !n.collapsed));
      };
      el.append(fold);
    }
    el.ondblclick = (e) => {
      if (!e.target.closest("button,input")) {
        e.stopPropagation();
        editNode(n.id);
      }
    };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      finishEditing?.(false);
      selected = new Set([n.id]);
      render();
      openThoughtMenu("context", n);
    };
    el.onpointerdown = (e) => nodeDown(e, n.id);
    el.ondragover = (e) => {
      e.preventDefault();
      el.classList.add("drop-target");
    };
    el.ondragleave = () => el.classList.remove("drop-target");
    el.ondrop = safe(async (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("drop-target");
      await addFiles([...e.dataTransfer.files], b.id, n.id);
    });
    layer.append(el);
  });
  drawEdges();
  transform();
  renderOutline();
  renderContext();
  freshId = null;
}
function drawEdges() {
  const svg = $("#edges");
  svg.replaceChildren();
  positions.forEach((p) => {
    if (!p.parent) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      edge(positions.get(p.parent), p, active().connector),
    );
    path.setAttribute("stroke", p.node.color);
    if (p.node.id === freshId) {
      path.setAttribute("pathLength", "1");
      path.classList.add("fresh-edge");
    }
    svg.append(path);
  });
}
function transform() {
  const pixelRatio = window.devicePixelRatio || 1;
  const x = Math.round(pan.x * pixelRatio) / pixelRatio;
  const y = Math.round(pan.y * pixelRatio) / pixelRatio;
  $("#world").style.transform = `translate(${x}px,${y}px) scale(${pan.z})`;
  $("#zoomLabel").textContent = `${Math.round(pan.z * 100)}%`;
  renderContext();
}
function renderContext() {
  const menu = $("#thoughtMenu");
  if (!menu.hidden) menu.querySelector("audio")?.pause();
  menu.hidden = true;
  nodeElements
    .get(menu.dataset.thought)
    ?.querySelector(".branch-add")
    ?.setAttribute("aria-expanded", "false");
  delete menu.dataset.thought;
  $("#thoughtDetails").hidden = selected.size === 0;
}
function openThoughtMenu(type, thought, direction) {
  const menu = $("#thoughtMenu");
  const sameMenu =
    !menu.hidden &&
    menu.dataset.thought === thought.id &&
    menu.dataset.type === type;
  renderContext();
  if (sameMenu) return;
  if (panelType) closePanel();
  toggleIsland(false);
  const add = nodeElements.get(thought.id)?.querySelector(".branch-add");
  if (!add) return;
  const boardId = active().id;
  menu.dataset.thought = thought.id;
  menu.dataset.type = type;
  menu.setAttribute(
    "aria-label",
    type === "add" ? "Add branch type" : "Thought actions",
  );
  if (type === "add") {
    add.dataset.direction = direction;
    menu.innerHTML = [
      ["Text", "text"],
      ["Voice", "mic"],
      ["Image", "image"],
      ["File", "file"],
      ["AI", "spark"],
    ]
      .map(
        ([label, glyph]) =>
          `<button data-kind="${label}">${icon(glyph)}${label}</button>`,
      )
      .join("");
    add.setAttribute("aria-expanded", "true");
    menu.onclick = safe(async (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      const kind = button.dataset.kind;
      if (!kind) return;
      renderContext();
      $("#viewport").focus({ preventScroll: true });
      if (kind === "Text") addNode(false, direction);
      else if (kind === "AI") openNodeAI(thought, "branch", direction);
      else if (kind === "Voice") await recordVoice(direction);
      else await addAttachmentBranch(kind, boardId, thought.id, direction);
    });
  } else {
    menu.innerHTML = `<div class="thought-colors">${branchColors
      .map(
        ([name, color]) =>
          `<button data-color="${color}" style="--swatch:${color}" aria-label="${name}" aria-pressed="${thought.color === color}" title="${name}"></button>`,
      )
      .join("")}</div>${
      imageCard(thought)
        ? ""
        : `<div class="thought-options" role="group" aria-label="Text alignment">${[
            ["left", "alignLeft", "Align left"],
            ["center", "alignCenter", "Center text"],
            ["right", "alignRight", "Align right"],
          ]
            .map(
              ([value, glyph, label]) =>
                `<button data-align="${value}" aria-label="${label}" aria-pressed="${(thought.align || "center") === value}" title="${label}">${icon(glyph)}</button>`,
            )
            .join("")}</div>`
    }<button data-ai>${icon("spark")}Edit with AI</button><button data-fill aria-pressed="${thought.filled === true}">${icon(thought.filled ? "square" : "fillSquare")}${thought.filled ? "Outline only" : "Fill card"}</button><button data-task>${icon("task")}${thought.hasTodo ? "Remove task" : "Add as task"}</button>`;
    menu.onclick = (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-ai")) {
        openNodeAI(thought, "edit");
        return;
      }
      const { color, align } = button.dataset;
      mutate(() => {
        if (color) thought.color = color;
        else if (align) thought.align = align;
        else if (button.hasAttribute("data-fill"))
          thought.filled = !thought.filled;
        else {
          thought.hasTodo = !thought.hasTodo;
          if (!thought.hasTodo) thought.checked = false;
        }
      });
      $("#viewport").focus({ preventScroll: true });
    };
  }
  const anchor = add.getBoundingClientRect();
  const card = nodeElements.get(thought.id).getBoundingClientRect();
  menu.hidden = false;
  const addMenu = type === "add";
  const before = addMenu
    ? (direction === "up" ||
        anchor.bottom + 32 + menu.offsetHeight > innerHeight - 8) &&
      anchor.top - 28 - menu.offsetHeight > 44
    : card.right + 36 + menu.offsetWidth > innerWidth - 8;
  menu.dataset.side = addMenu
    ? before
      ? "above"
      : "below"
    : before
      ? "left"
      : "right";
  const x = addMenu
    ? anchor.left + (anchor.width - menu.offsetWidth) / 2
    : before
      ? card.left - 36 - menu.offsetWidth
      : card.right + 36;
  const y = addMenu
    ? before
      ? anchor.top - 28 - menu.offsetHeight
      : anchor.bottom + 31
    : card.top + (card.height - menu.offsetHeight) / 2;
  const left = Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8));
  const top = Math.max(46, Math.min(y, innerHeight - menu.offsetHeight - 8));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.setProperty(
    "--arrow-offset",
    `${
      addMenu
        ? anchor.left + anchor.width / 2 - left
        : card.top + card.height / 2 - top
    }px`,
  );
  menu.querySelector("button").focus({ preventScroll: true });
}
function removeAttachment(thought, attachment) {
  mutate(
    () => {
      thought.attachments = thought.attachments.filter((a) => a !== attachment);
      if (!thought.attachments.some((a) => a.is_image))
        thought.imageOnly = false;
    },
    { panel: panelType === "details" },
  );
}
function openMediaMenu(thought, attachment) {
  renderContext();
  if (panelType) closePanel();
  toggleIsland(false);
  const boardId = active().id;
  const card = nodeElements.get(thought.id).getBoundingClientRect();
  const menu = $("#thoughtMenu");
  menu.dataset.thought = thought.id;
  menu.dataset.type = "media";
  menu.setAttribute("aria-label", "Media options");
  menu.innerHTML = `<p class="attachment-title" dir="auto">${escape(attachment.name)}</p>
    ${attachment.is_audio ? '<audio controls preload="metadata"></audio>' : ""}
    <button data-media="open">${icon("arrow")}Open file</button>
    <button data-media="folder" ${io.native && attachment.path ? "" : "disabled"}>${icon("folder")}Open in folder</button>
    <button data-media="replace">${icon("file")}Replace file</button>
    ${attachment.is_audio ? `<button data-media="record">${icon("mic")}Record replacement</button>` : ""}
    <button data-media="delete" class="danger">${icon("trash")}Delete attachment</button>`;
  const audio = menu.querySelector("audio");
  if (audio) {
    if (attachment.data_url) audio.src = attachment.data_url;
    else if (io.native && attachment.path)
      safe(async () => {
        const url = await io.invoke("read_media_base64", {
          path: attachment.path,
        });
        if (audio.isConnected) audio.src = url;
      })();
  }
  menu.onclick = safe(async (event) => {
    const action = event.target.closest("[data-media]")?.dataset.media;
    if (!action) return;
    if (action === "open") {
      await io.openAttachment(attachment);
      return;
    }
    if (action === "folder") {
      await io.revealAttachment(attachment);
      return;
    }
    if (action === "delete") {
      removeAttachment(thought, attachment);
      return;
    }
    if (action === "record") {
      renderContext();
      await recordVoice(null, { attachment });
      return;
    }
    if (action === "replace") {
      const kind = attachment.is_image
        ? "Image"
        : attachment.is_audio
          ? "Voice"
          : attachment.is_video
            ? "Video"
            : "File";
      const replacement = await pickAttachment(kind);
      if (!replacement) return;
      commitAttachment(replacement, boardId, thought.id, null, attachment);
    }
    $("#viewport").focus({ preventScroll: true });
  });
  menu.hidden = false;
  const leftSide = card.right + 22 + menu.offsetWidth > innerWidth - 8;
  const left = Math.max(
    8,
    Math.min(
      leftSide ? card.left - menu.offsetWidth - 22 : card.right + 22,
      innerWidth - menu.offsetWidth - 8,
    ),
  );
  const top = Math.max(
    46,
    Math.min(card.top, innerHeight - menu.offsetHeight - 8),
  );
  menu.dataset.side = leftSide ? "left" : "right";
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.setProperty(
    "--arrow-offset",
    `${card.top + card.height / 2 - top}px`,
  );
  menu.querySelector("button").focus({ preventScroll: true });
}
function toggleIsland(open = !$("#island").classList.contains("expanded")) {
  if (open && panelType) closePanel();
  $("#island").classList.toggle("expanded", open);
  $("#islandMenu").hidden = !open;
  $("#menuToggle").setAttribute("aria-expanded", String(open));
}
function worldPoint(clientX, clientY) {
  const rect = $("#viewport").getBoundingClientRect();
  return {
    x: (clientX - rect.left - pan.x) / pan.z,
    y: (clientY - rect.top - pan.y) / pan.z,
  };
}
function centerEmptyCanvas() {
  pan = {
    x: $("#viewport").clientWidth / 2,
    y: $("#viewport").clientHeight / 2,
    z: 1,
  };
  transform();
}
function newThoughtAt(point) {
  const n = node("New thought", branchColors[0][1]);
  const position =
    point || (pointer ? worldPoint(pointer.x, pointer.y) : { x: 0, y: 0 });
  n.dx = position.x;
  n.dy = position.y;
  mutate(
    (b) => {
      b.root.children.push(n);
      selected = new Set([n.id]);
    },
    { animate: n.id },
  );
  editNode(n.id, true);
  return n;
}
function startBlankCanvas() {
  const empty = state.boards.find(
    (b) => b.virtualRoot && !b.root.children.length && b.title === "Untitled",
  );
  const b = empty || blankBoard();
  if (!empty) state.boards.push(b);
  state.activeBoardId = b.id;
  selected.clear();
  view = "map";
  closePanel();
  toggleIsland(false);
  render();
  centerEmptyCanvas();
  scheduleSave();
}
function fit() {
  if (!positions.size) {
    centerEmptyCanvas();
    return;
  }
  const vals = [...positions.values()],
    xs = vals.flatMap((p) => [p.x - p.w / 2, p.x + p.w / 2]),
    ys = vals.flatMap((p) => [p.y - p.h / 2, p.y + p.h / 2]),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const w = $("#viewport").clientWidth,
    h = $("#viewport").clientHeight;
  const availableW = w - 210;
  pan.z = Math.max(
    0.12,
    Math.min(1.1, availableW / (maxX - minX), (h - 240) / (maxY - minY)),
  );
  pan.x = w / 2 - ((minX + maxX) / 2) * pan.z;
  pan.y = h / 2 - ((minY + maxY) / 2) * pan.z;
  transform();
}
function zoom(
  factor,
  x = $("#viewport").clientWidth / 2,
  y = $("#viewport").clientHeight / 2,
) {
  const z = Math.min(2.5, Math.max(0.12, pan.z * factor));
  pan.x = x - ((x - pan.x) * z) / pan.z;
  pan.y = y - ((y - pan.y) * z) / pan.z;
  pan.z = z;
  transform();
}
function childDirection(b = active()) {
  return b.layout === "balanced" ? "right" : b.layout;
}
function addNode(sibling = false, direction = childDirection()) {
  const target = current();
  if (target === active().root) return newThoughtAt();
  const hit = find(active().root, target.id);
  const parent = sibling && hit.parent ? hit.parent : target;
  const n = node(
    "New thought",
    target.color,
    sibling ? target.dir || direction : direction,
  );
  if (parent === active().root) {
    const p = positions.get(target.id);
    n.dx = p.x + p.w + 60;
    n.dy = p.y;
  }
  mutate(
    () => {
      parent.children.push(n);
      parent.collapsed = false;
      selected = new Set([n.id]);
    },
    { animate: n.id },
  );
  editNode(n.id, true);
}
function revealThought(el) {
  const bounds = $("#viewport").getBoundingClientRect();
  const card = el.getBoundingClientRect();
  const dx =
    card.right > bounds.right - 24
      ? bounds.right - 24 - card.right
      : Math.max(0, bounds.left + 104 - card.left);
  const dy =
    card.bottom > bounds.bottom - 24
      ? bounds.bottom - 24 - card.bottom
      : Math.max(0, bounds.top + 24 - card.top);
  if (dx || dy) {
    pan.x += dx;
    pan.y += dy;
    transform();
  }
}
function editNode(id, created = false) {
  if (editing) return;
  const n = find(active().root, id)?.node,
    el = $$("[data-node]").find((e) => e.dataset.node === id);
  if (!n || !el) return;
  if (imageCard(n)) {
    selected = new Set([id]);
    render();
    openMediaMenu(n, imageCard(n));
    return;
  }
  if (created) revealThought(el);
  selected = new Set([id]);
  editing = id;
  renderContext();
  el.classList.add("editing");
  const label = el.querySelector(".node-label"),
    input = document.createElement("textarea");
  input.className = "node-editor";
  input.value = n.text;
  input.dir = "auto";
  input.setAttribute("aria-label", "Branch text");
  label.replaceWith(input);
  const resizeEditor = () => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  };
  resizeEditor();
  input.oninput = resizeEditor;
  input.focus({ preventScroll: true });
  input.select();
  let committed = false;
  const commit = (cancel) => {
    if (committed) return;
    committed = true;
    editing = null;
    finishEditing = null;
    const text = input.value.trim() || "Untitled thought";
    if (!cancel && text !== n.text)
      mutate((b) => {
        n.text = text;
        if (
          n === b.root ||
          (b.title === "Untitled" && b.root.children[0] === n)
        )
          b.title = text.slice(0, 100);
      });
    else render();
    $("#viewport").focus({ preventScroll: true });
  };
  finishEditing = commit;
  input.onpointerdown = (e) => e.stopPropagation();
  input.onblur = () => commit(false);
  input.onkeydown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit(false);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      commit(false);
      addNode(e.shiftKey);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      commit(true);
    }
  };
}
function renderOutline() {
  const el = $("#outline");
  el.hidden = view !== "outline";
  if (view !== "outline") return;
  el.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = active().title;
  el.append(title);
  function add(n, depth) {
    const row = document.createElement("div");
    row.className = `outline-row ${selected.has(n.id) ? "selected" : ""}`;
    row.style.paddingLeft = `${depth * 24}px`;
    const fold = document.createElement("button");
    fold.className = "outline-fold";
    fold.textContent = n.children.length ? (n.collapsed ? "+" : "−") : "·";
    fold.title = "Expand or collapse";
    fold.onclick = () => mutate(() => (n.collapsed = !n.collapsed));
    row.append(fold);
    const dot = document.createElement("span");
    dot.className = "outline-dot";
    dot.style.background = n.color;
    row.append(dot);
    const button = document.createElement("button");
    button.textContent = n.text;
    button.dir = "auto";
    button.onclick = () => {
      selected = new Set([n.id]);
      render();
      openPanel("details");
    };
    row.append(button);
    el.append(row);
    if (!n.collapsed) n.children.forEach((c) => add(c, depth + 1));
  }
  const back = document.createElement("button");
  back.className = "secondary-button outline-back";
  back.textContent = "Back to canvas";
  back.onclick = () => actions.map();
  el.prepend(back);
  active().root.children.forEach((n) => add(n, 0));
}

let drag = null,
  raf = null;
function nodeDown(e, id) {
  if (e.button !== 0 || e.target.closest("button,input,textarea,audio,video"))
    return;
  if (tool === "hand" || spaceDown) return;
  e.stopPropagation();
  if (editing) return;
  if (e.ctrlKey || e.metaKey) {
    selected.has(id) ? selected.delete(id) : selected.add(id);
    render();
    return;
  }
  if (!selected.has(id)) selected = new Set([id]);
  $$(".node").forEach((el) =>
    el.classList.toggle("selected", selected.has(el.dataset.node)),
  );
  renderContext();
  const roots = [...selected].filter(
    (id) =>
      ![...selected].some(
        (other) =>
          other !== id && descendants(find(active().root, other).node).has(id),
      ),
  );
  drag = {
    type: "nodes",
    x: e.clientX,
    y: e.clientY,
    moved: false,
    ids: roots,
    original: roots.map((id) => {
      const n = find(active().root, id).node;
      return { id, dx: n.dx, dy: n.dy };
    }),
    snapshot: clone(active()),
    targetId: null,
    excluded: new Set(
      roots.flatMap((id) => [...descendants(find(active().root, id).node)]),
    ),
  };
  e.currentTarget.setPointerCapture(e.pointerId);
}
$("#viewport").onpointerdown = (e) => {
  if (e.button !== 0 && e.button !== 1) return;
  if (editing) return;
  if (e.target.closest(".node") && tool !== "hand" && !spaceDown) return;
  e.preventDefault();
  drag = {
    type: e.shiftKey ? "marquee" : "pan",
    x: e.clientX,
    y: e.clientY,
    px: pan.x,
    py: pan.y,
    moved: false,
  };
  if (drag.type === "marquee") $("#marquee").hidden = false;
  else $("#viewport").classList.add("panning");
  $("#viewport").setPointerCapture(e.pointerId);
};
$("#viewport").onpointermove = (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  if (!drag) return;
  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  if (drag.type === "pan") {
    pan.x = drag.px + dx;
    pan.y = drag.py + dy;
    transform();
  } else if (drag.type === "marquee") {
    const rect = $("#viewport").getBoundingClientRect();
    Object.assign($("#marquee").style, {
      left: `${Math.min(drag.x, e.clientX) - rect.left}px`,
      top: `${Math.min(drag.y, e.clientY) - rect.top}px`,
      width: `${Math.abs(dx)}px`,
      height: `${Math.abs(dy)}px`,
    });
  } else {
    document.body.classList.add("dragging");
    nodeElements.forEach((el, id) => {
      el.classList.toggle("drag-source", drag.excluded.has(id));
      el.classList.toggle("invalid-target", drag.excluded.has(id));
    });
    updateDropTarget(e);
    drag.original.forEach((o) => {
      const n = find(active().root, o.id).node;
      n.dx = o.dx + dx / pan.z;
      n.dy = o.dy + dy / pan.z;
    });
    if (!raf)
      raf = requestAnimationFrame(() => {
        positions = layout(active());
        positions.forEach((p) => {
          const el = nodeElements.get(p.node.id);
          if (el) {
            el.style.left = `${p.x - p.w / 2}px`;
            el.style.top = `${p.y - p.h / 2}px`;
          }
        });
        drawEdges();
        renderContext();
        raf = null;
      });
  }
};
function finishDrag(e, cancel = false) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }
  document.body.classList.remove("dragging");
  clearDropPreview();
  $("#viewport").classList.remove("panning");
  $("#marquee").hidden = true;
  if (d.type === "nodes" && d.moved) {
    if (cancel) {
      state.boards[state.boards.findIndex((b) => b.id === active().id)] =
        d.snapshot;
      render();
      return;
    }
    history().push(d.snapshot);
    if (d.targetId) {
      d.ids.forEach((id) =>
        moveBranch(active(), id, d.targetId, d.targetDirection),
      );
      toast("Moved under " + find(active().root, d.targetId).node.text);
    }
    render();
    scheduleSave();
  } else if (d.type === "marquee" && d.moved && !cancel) {
    const rect = $("#viewport").getBoundingClientRect(),
      x1 = (Math.min(d.x, e.clientX) - rect.left - pan.x) / pan.z,
      x2 = (Math.max(d.x, e.clientX) - rect.left - pan.x) / pan.z,
      y1 = (Math.min(d.y, e.clientY) - rect.top - pan.y) / pan.z,
      y2 = (Math.max(d.y, e.clientY) - rect.top - pan.y) / pan.z;
    selected = new Set(
      [...positions.values()]
        .filter((p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2)
        .map((p) => p.node.id),
    );
    render();
  } else if (d.type === "pan" && !d.moved) {
    selected.clear();
    renderContext();
    $$(".node").forEach((el) => el.classList.remove("selected"));
  }
}
$("#viewport").onpointerup = (e) => finishDrag(e);
$("#viewport").onpointercancel = (e) => finishDrag(e, true);
$("#viewport").addEventListener(
  "wheel",
  (e) => {
    if (e.target.closest("audio,video")) return;
    e.preventDefault();
    const rect = $("#viewport").getBoundingClientRect();
    zoom(
      Math.exp(-e.deltaY * 0.002),
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
  },
  { passive: false },
);
$("#viewport").ondblclick = (e) => {
  if (e.target.closest(".node")) return;
  newThoughtAt(worldPoint(e.clientX, e.clientY));
};
function clearDropPreview() {
  $("#dropPreview").hidden = true;
  nodeElements.forEach((el) =>
    el.classList.remove("drop-target", "drag-source", "invalid-target"),
  );
}
function updateDropTarget(event) {
  if (!drag || drag.type !== "nodes") return;
  const rect = $("#viewport").getBoundingClientRect();
  let best = null,
    direction = null,
    distance = Infinity;
  positions.forEach((p) => {
    if (drag.excluded.has(p.node.id)) return;
    for (const side of branchPorts) {
      const horizontal = side === "left" || side === "right";
      const x =
        p.x +
        (horizontal
          ? (side === "left" ? -1 : 1) * (p.w / 2 + branchButtonOffset)
          : 0);
      const y =
        p.y +
        (horizontal
          ? 0
          : (side === "up" ? -1 : 1) * (p.h / 2 + branchButtonOffset));
      const d = Math.hypot(
        event.clientX - (x * pan.z + pan.x + rect.left),
        event.clientY - (y * pan.z + pan.y + rect.top),
      );
      if (d < Math.max(32, 25 * pan.z) && d < distance) {
        best = p;
        direction = side;
        distance = d;
      }
    }
  });
  drag.targetId = best?.node.id || null;
  drag.targetDirection = direction;
  nodeElements.forEach((el, id) => {
    const target = id === drag.targetId;
    el.classList.toggle("drop-target", target);
    if (target) el.querySelector(".branch-add").dataset.direction = direction;
  });
  const preview = $("#dropPreview");
  preview.hidden = !best;
  if (best) {
    const horizontal = direction === "left" || direction === "right";
    const sign = direction === "left" || direction === "up" ? -1 : 1;
    const portX = horizontal ? sign * (best.w / 2 + branchButtonOffset) : 0;
    const portY = horizontal ? 0 : sign * (best.h / 2 + branchButtonOffset);
    preview.style.left = `${(best.x + portX) * pan.z + pan.x}px`;
    preview.style.top = `${(best.y + portY) * pan.z + pan.y}px`;
    const offset = (122 - branchButtonOffset) * pan.z;
    preview.style.setProperty(
      "--ghost-x",
      `${direction === "left" ? -offset - 180 : offset}px`,
    );
    preview.style.setProperty("--ghost-y", "-24px");
    preview.classList.toggle("horizontal", horizontal);
    preview.classList.toggle("upward", direction === "up");
  }
}

function panelHead(title) {
  return `<div class="panel-head"><h2>${title}</h2>${btn("closePanel", "", "close", "")}</div>`;
}
function closePanel() {
  panelType = null;
  const el = $("#panel");
  if (
    state.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !el.hidden
  ) {
    el.getAnimations().forEach((a) => a.cancel());
    const animation = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 150,
      easing: "ease-in",
    });
    animation.onfinish = () => {
      if (!panelType) {
        el.hidden = true;
        el.replaceChildren();
      }
    };
  } else {
    el.hidden = true;
    el.replaceChildren();
  }
  $("#viewport").focus({ preventScroll: true });
}
function openPanel(type, focus = true) {
  if (type === "details" && current() === active().root) {
    toast("Select a thought first.");
    return;
  }
  toggleIsland(false);
  panelType = type;
  const el = $("#panel");
  el.getAnimations().forEach((a) => a.cancel());
  el.hidden = false;
  if (type === "details") renderDetails();
  else if (type === "maps") renderMaps();
  else if (type === "settings") renderSettings();
  else if (type === "ai") renderAI();
  else if (type === "search") renderSearch();
  positionPanel(type);
  if (focus)
    el.querySelector("input:not([type=checkbox]),textarea")?.focus({
      preventScroll: true,
    });
}
function positionPanel(type) {
  const el = $("#panel");
  el.classList.toggle("local-details", type === "details");
  el.style.left = "100px";
  el.style.top = "";
  if (type !== "details") return;
  const p = positions.get(current().id);
  if (!p) return;
  const x = p.x * pan.z + pan.x + (p.w * pan.z) / 2 + 24;
  el.style.left = `${Math.max(95, Math.min($("#workspace").clientWidth - 340, x))}px`;
  el.style.top = `${Math.max(16, Math.min($("#workspace").clientHeight - 470, p.y * pan.z + pan.y - (p.h * pan.z) / 2))}px`;
}
function renderDetails() {
  const n = current(),
    b = active();
  $("#panel").innerHTML =
    panelHead("Branch details") +
    `<label class="field"><span>Thought</span><textarea id="detailText" dir="auto" style="min-height:70px">${escape(n.text)}</textarea></label><label class="field"><span>Notes</span><textarea id="detailNote" dir="auto" placeholder="Give this thought a little more room…">${escape(n.note)}</textarea></label><label class="toggle-row">Make this a task<input id="detailTodo" type="checkbox" ${n.hasTodo ? "checked" : ""}></label>${n.hasTodo ? `<label class="toggle-row">Completed<input id="detailChecked" type="checkbox" ${n.checked ? "checked" : ""}></label>` : ""}<label class="field"><span>Branch color</span><div class="color-options">${COLORS.map((c) => `<button class="swatch ${n.color === c ? "active" : ""}" style="background:${c}" data-color="${c}" aria-label="Color ${c}"></button>`).join("")}<input id="customColor" type="color" value="${escape(n.color)}" aria-label="Custom branch color"></div></label>${n !== b.root ? `<label class="field"><span>Move under</span><select id="parentSelect"></select></label>` : ""}<div class="divider"></div><div class="row"><h3 style="font-size:13px">Attachments</h3>${btn("attach", "", "plus", "icon-button")}${btn("record", "", "mic", "icon-button")}</div><div id="attachmentList"></div><div class="panel-footer">${btn("add", "Add child", "plus")}${btn("fold", n.collapsed ? "Expand" : "Collapse", "layers")}</div>${n !== b.root ? `<div class="panel-footer">${btn("detach", "Detach", "layers") + btn("duplicate", "Duplicate", "copy")}${btn("delete", "Delete", "trash", "secondary-button danger")}</div>` : ""}`;
  $("#detailText").onchange = (e) =>
    mutate(() => {
      n.text = e.target.value.trim() || "Untitled thought";
      if (n === b.root) b.title = n.text;
    });
  $("#detailNote").onchange = (e) => mutate(() => (n.note = e.target.value));
  $("#detailTodo").onchange = (e) =>
    mutate(() => (n.hasTodo = e.target.checked), { panel: true });
  if ($("#detailChecked"))
    $("#detailChecked").onchange = (e) =>
      mutate(() => (n.checked = e.target.checked));
  const recolor = (c) =>
    mutate(() => walk(n, (n) => (n.color = c)), { panel: true });
  $$("[data-color]").forEach(
    (el) => (el.onclick = () => recolor(el.dataset.color)),
  );
  $("#customColor").onchange = (e) => recolor(e.target.value);
  if ($("#parentSelect")) {
    const select = $("#parentSelect"),
      excluded = descendants(n),
      parent = find(b.root, n.id).parent;
    walk(b.root, (p, _, d) => {
      if (excluded.has(p.id) || p === b.root) return;
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = "· ".repeat(d) + p.text;
      o.selected = p.id === parent.id;
      select.append(o);
    });
    select.onchange = (e) =>
      mutate(() => moveBranch(b, n.id, e.target.value), { panel: true });
  }
  const list = $("#attachmentList");
  if (!n.attachments.length)
    list.innerHTML =
      '<p class="help">Drop a file on a branch, or attach it here.</p>';
  n.attachments.forEach((a) => {
    const row = document.createElement("div");
    row.className = "attachment";
    row.innerHTML = `<div class="row"><button class="file-name">${icon(a.is_audio ? "mic" : "clip")}${escape(a.name)}</button><button class="icon-button danger" style="flex:0 0 28px" aria-label="Remove attachment">${icon("close")}</button></div>`;
    row.querySelector(".file-name").onclick = safe(() => io.openAttachment(a));
    row.querySelector(".danger").onclick = () => removeAttachment(n, a);
    row.oncontextmenu = (e) => {
      e.preventDefault();
      openMediaMenu(n, a);
    };
    list.append(row);
    if (a.is_audio || a.is_video) {
      const media = document.createElement(a.is_audio ? "audio" : "video");
      media.controls = true;
      media.preload = "none";
      row.append(media);
      if (a.data_url) media.src = a.data_url;
      else if (io.native && a.path)
        io.invoke("read_media_base64", { path: a.path })
          .then((url) => {
            if (media.isConnected) media.src = url;
          })
          .catch(() => {});
    }
  });
}
function renderMaps() {
  const b = active();
  $("#panel").innerHTML =
    panelHead("Your maps") +
    btn("newMap", "New map", "plus", "primary-button") +
    `<label class="field"><span>Find a map</span><input id="mapSearch" placeholder="Search your maps…"></label><div id="mapList"></div><div class="divider"></div>${btn("import", "Import a map", "folder", "secondary-button")}<p class="help">Open maps from the previous Mind Cleaner, or a Studio JSON export.</p><div class="panel-footer">${btn("duplicateMap", "Duplicate map", "copy")}${btn("deleteMap", "Delete map", "trash", "secondary-button danger")}</div>`;
  const update = () => {
    const q = $("#mapSearch").value.toLowerCase(),
      list = $("#mapList");
    list.replaceChildren();
    state.boards
      .filter((b) => b.title.toLowerCase().includes(q))
      .forEach((map) => {
        let count = map.virtualRoot ? -1 : 0;
        walk(map.root, () => count++);
        const el = document.createElement("button");
        el.className = `map-item ${map.id === b.id ? "active" : ""}`;
        el.innerHTML = `<span class="map-dot" style="background:${map.root.color}"></span><span>${escape(map.title)}<small>${count} thoughts</small></span>`;
        el.onclick = () => switchMap(map.id);
        list.append(el);
      });
    if (!list.children.length)
      list.innerHTML = '<p class="empty">No maps match this search.</p>';
  };
  $("#mapSearch").oninput = update;
  update();
}
function renderSettings() {
  const b = active();
  $("#panel").innerHTML =
    panelHead("Make it yours") +
    `<label class="field"><span>Connection style</span><div class="segmented">${btn("roundEdges", "Bends", "corner", b.connector === "rounded" ? "active" : "")}${btn("softEdges", "Soft", "curve", b.connector === "soft" ? "active" : "")}${btn("sharpEdges", "Angular", "corner", b.connector === "sharp" ? "active" : "")}</div><small>Change the lines between your thoughts.</small></label><label class="field"><span>Branch shape</span><div class="segmented">${btn("softNodes", "Rounded", "", b.shape === "soft" ? "active" : "")}${btn("sharpNodes", "Sharp", "", b.shape === "sharp" ? "active" : "")}</div></label><label class="field"><span>Layout direction</span><select id="layoutSelect">${["balanced", "right", "left", "down", "up"].map((v) => `<option value="${v}" ${b.layout === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}</select></label>${btn("tidy", "Tidy up this map", "map", "secondary-button")}<div class="divider"></div><label class="field"><span>Appearance</span><div class="segmented">${btn("dark", "Dark", "", state.theme === "dark" ? "active" : "")}${btn("light", "Light", "", state.theme === "light" ? "active" : "")}</div></label><label class="toggle-row">Spring animations<input id="motionToggle" type="checkbox" ${state.motion ? "checked" : ""}></label><p class="help">Your system’s reduced-motion preference is always respected.</p><div class="divider"></div><label class="toggle-row">Confirm thought deletion<input id="confirmThoughtDeletion" type="checkbox" ${state.confirmThoughtDeletion ? "checked" : ""}></label><div class="divider"></div>${btn("shortcuts", "Keyboard shortcuts", "list", "secondary-button")}<p class="help">English interface · Persian and other languages work inside your maps.</p>`;
  $("#layoutSelect").onchange = (e) => {
    mutate((b) => {
      b.layout = e.target.value;
      walk(b.root, (n, parent) => {
        if (b.virtualRoot && parent === b.root) return;
        n.dx = 0;
        n.dy = 0;
        n.dir = null;
      });
    });
    fit();
  };
  $("#motionToggle").onchange = (e) => {
    state.motion = e.target.checked;
    render();
    scheduleSave();
  };
  $("#confirmThoughtDeletion").onchange = (e) => {
    state.confirmThoughtDeletion = e.target.checked;
    scheduleSave();
  };
}
function renderSearch() {
  $("#panel").innerHTML =
    panelHead("Find a thought") +
    '<input id="branchSearch" placeholder="Search text and notes…" aria-label="Search text and notes"><div id="searchResults"></div>';
  $("#branchSearch").oninput = () => {
    const q = $("#branchSearch").value.toLowerCase().trim(),
      list = $("#searchResults");
    list.replaceChildren();
    if (!q) {
      list.innerHTML =
        '<p class="empty">Search anywhere in this map, including collapsed branches.</p>';
      return;
    }
    walk(active().root, (n, p) => {
      if (!`${n.text} ${n.note}`.toLowerCase().includes(q)) return;
      const el = document.createElement("button");
      el.className = "map-item";
      el.innerHTML = `<span>${escape(n.text)}<small>${escape(p?.text || "Central thought")}</small></span>`;
      el.onclick = () => {
        function expand(root) {
          if (root.id === n.id) return true;
          for (const c of root.children)
            if (expand(c)) {
              root.collapsed = false;
              return true;
            }
          return false;
        }
        expand(active().root);
        selected = new Set([n.id]);
        render();
        const p = positions.get(n.id);
        pan.x = ($("#viewport").clientWidth - 345) / 2 - p.x * pan.z;
        pan.y = $("#viewport").clientHeight / 2 - p.y * pan.z;
        transform();
        scheduleSave();
      };
      list.append(el);
    });
    if (!list.children.length)
      list.innerHTML = '<p class="empty">No matching thoughts yet.</p>';
  };
  $("#branchSearch").oninput();
}
function switchMap(id) {
  editing = null;
  state.activeBoardId = id;
  const index = state.boards.findIndex((b) => b.id === state.activeBoardId);
  state.boards[index] = asCanvasBoard(state.boards[index]);
  selected = new Set();
  render();
  if (panelType === "maps") renderMaps();
  else closePanel();
  fit();
  scheduleSave();
}
function commitAttachment(
  attachment,
  boardId,
  nodeId,
  direction = null,
  replacement = null,
) {
  const b = state.boards.find((map) => map.id === boardId);
  const parent = b && find(b.root, nodeId)?.node;
  if (!parent) throw Error("The target branch no longer exists.");
  const index = replacement ? parent.attachments.indexOf(replacement) : -1;
  if (replacement && index === -1)
    throw Error("The original attachment changed. Try again.");
  const visible = b.id === active().id;
  if (visible) finishEditing?.(false);
  if (!histories.has(b.id)) histories.set(b.id, new History());
  histories.get(b.id).push(b);
  if (direction) {
    const title = attachment.is_image
      ? "Image"
      : attachment.is_audio
        ? "Voice note"
        : attachment.name;
    const child = node(title, parent.color, direction);
    child.attachments.push(attachment);
    if (attachment.is_image) child.imageOnly = true;
    parent.children.push(child);
    parent.collapsed = false;
    if (visible && selected.has(parent.id)) selected = new Set([child.id]);
    if (visible) freshId = child.id;
  } else if (replacement) {
    parent.attachments[index] = attachment;
    if (parent.text === replacement.name) parent.text = attachment.name;
  } else parent.attachments.push(attachment);
  b.updatedAt = Date.now();
  if (visible) {
    render();
    if (panelType === "details") renderDetails();
  }
  scheduleSave();
}
async function addFiles(files, boardId = active().id, nodeId = current().id) {
  for (const file of files)
    commitAttachment(await io.attach(file), boardId, nodeId);
}
async function pickAttachment(kind) {
  const mediaType = { Image: "image", Voice: "audio", Video: "video" }[kind];
  if (io.native) {
    return io.invoke(
      mediaType ? `pick_${mediaType}_dialog` : "pick_file_dialog",
    );
  }
  const file = await io.pickFile(mediaType ? `${mediaType}/*` : "");
  if (!file) return null;
  if (mediaType && !file.type.startsWith(`${mediaType}/`))
    throw Error(`Choose a valid ${mediaType} file.`);
  return io.attach(file);
}
async function addAttachmentBranch(kind, boardId, nodeId, direction) {
  const attachment = await pickAttachment(kind);
  if (attachment) commitAttachment(attachment, boardId, nodeId, direction);
}
async function attachFile() {
  if (current() === active().root) {
    toast("Select a thought to attach a file.");
    return;
  }
  const bid = active().id,
    nid = current().id;
  if (io.native) {
    const a = await io.invoke("pick_file_dialog");
    if (a) commitAttachment(a, bid, nid);
  } else {
    const file = await io.pickFile();
    if (file) await addFiles([file], bid, nid);
  }
}
async function recordVoice(direction = null, replacement = null) {
  if (recording) {
    if (recording.state !== "inactive") recording.stop();
    return;
  }
  if (requestingMic) return;
  if (current() === active().root) {
    toast("Select a thought first.");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
    throw Error(
      "Voice recording is not supported by this browser. Attach an audio file instead.",
    );
  const bid = active().id,
    nid = current().id;
  requestingMic = true;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } finally {
    requestingMic = false;
  }
  let recorder;
  try {
    recorder = new MediaRecorder(stream);
    recorder.start();
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    throw e;
  }
  recording = recorder;
  const chunks = [];
  const stop = $("#recordingStop");
  const finish = () => {
    stream.getTracks().forEach((t) => t.stop());
    recording = null;
    stop.hidden = true;
    stop.disabled = false;
    if (panelType === "details") renderDetails();
  };
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.onstop = safe(async () => {
    if (recording !== recorder) return;
    stop.disabled = true;
    stream.getTracks().forEach((t) => t.stop());
    try {
      if (!chunks.length)
        throw Error("No audio was recorded. Please try again.");
      const type = recorder.mimeType || "audio/webm";
      const file = new File(
        chunks,
        `Voice note ${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.${type.includes("mp4") ? "m4a" : "webm"}`,
        { type },
      );
      const attachment = await io.attach(file);
      if (replacement) attachment.caption = replacement.caption;
      commitAttachment(
        attachment,
        bid,
        nid,
        direction,
        replacement?.attachment,
      );
      toast(
        replacement
          ? "Voice note replaced."
          : direction
            ? "Voice branch added."
            : "Voice note attached.",
      );
    } finally {
      finish();
    }
  });
  recorder.onerror = () => {
    finish();
    toast("Recording failed. Please try again.", true);
  };
  stop.hidden = false;
  toast("Recording… choose Stop recording when finished.");
  $$('[data-action="record"]').forEach((el) => {
    el.classList.add("danger");
    el.title = "Stop recording";
    el.setAttribute("aria-label", "Stop recording");
  });
}

function modal(title, body, actions = []) {
  const d = $("#dialog");
  d.innerHTML = `<h2>${escape(title)}</h2>${body}<div class="actions">${btn("cancelDialog", "Cancel", "", "secondary-button")}${actions.map((a) => btn(a.action, a.label, "", a.class || "primary-button")).join("")}</div>`;
  d.showModal();
  return d;
}
function askText(title, value, onSubmit) {
  const d = modal(
    title,
    `<label class="field"><span>Name</span><input id="nameInput" value="${escape(value)}" maxlength="200"></label>`,
    [{ action: "submitName", label: "Save" }],
  );
  const input = d.querySelector("input");
  input.focus();
  input.select();
  const submit = () => {
    const v = input.value.trim();
    if (!v) {
      input.focus();
      return;
    }
    d.close();
    onSubmit(v);
  };
  d.querySelector('[data-action="submitName"]').onclick = submit;
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };
}
function confirm(title, message, callback, { allowSkipping = false } = {}) {
  const remember = allowSkipping
    ? '<label class="toggle-row"><span>Don’t show again</span><input id="skipThoughtDelete" type="checkbox"></label>'
    : "";
  const d = modal(title, `<p>${escape(message)}</p>${remember}`, [
    {
      action: "confirmDelete",
      label: "Delete",
      class: "secondary-button danger",
    },
  ]);
  const button = d.querySelector('[data-action="confirmDelete"]');
  if (allowSkipping) button.focus();
  button.onclick = () => {
    if (d.querySelector("#skipThoughtDelete")?.checked)
      state.confirmThoughtDeletion = false;
    d.close();
    callback();
  };
}
function deleteSelection() {
  const ids = new Set([...selected].filter((id) => id !== active().root.id));
  if (!ids.size) {
    toast("Keep the central thought. You can delete the map from My maps.");
    return;
  }
  const remove = () =>
    mutate(
      (b) => {
        removeBranches(b, ids);
        selected.clear();
      },
      { panel: panelType === "details" },
    );
  if (!state.confirmThoughtDeletion) {
    remove();
    return;
  }
  const removed = new Set();
  ids.forEach((id) => {
    const n = find(active().root, id)?.node;
    if (n) descendants(n).forEach((x) => removed.add(x));
  });
  const count = removed.size;
  confirm(
    "Delete thoughts?",
    `Remove ${count} thought${count === 1 ? "" : "s"} and their attachments from this map? You can undo this.`,
    remove,
    { allowSkipping: true },
  );
}
async function importMap() {
  let text;
  if (io.native) {
    const result = await io.invoke("open_project_dialog");
    if (!result) return;
    text = result.content;
  } else {
    const file = await io.pickFile(".json");
    if (!file) return;
    text = await file.text();
  }
  const maps = importBoards(JSON.parse(text)).map(asCanvasBoard);
  maps.forEach((b) => {
    b.id = uid();
    state.boards.push(b);
  });
  switchMap(maps[0].id);
  toast(`Imported ${maps.length} map${maps.length > 1 ? "s" : ""}.`);
}
function exportDialog() {
  const d = $("#dialog");
  d.innerHTML = `<h2>Take your ideas with you</h2><p>Export “${escape(active().title)}”. Your original map stays here.</p><button class="export-option" data-export="json"><span>Mind map JSON<small>Editable map · includes embedded attachments</small></span>${icon("arrow")}</button><button class="export-option" data-export="png"><span>PNG image<small>All visible branches · current appearance</small></span>${icon("arrow")}</button><button class="export-option" data-export="md"><span>Markdown outline<small>Thoughts, notes and task checkboxes</small></span>${icon("arrow")}</button><p class="help">Linked desktop attachments keep their file paths. Keep those files when moving a JSON export.</p><div class="actions">${btn("cancelDialog", "Close", "", "secondary-button")}</div>`;
  d.showModal();
  d.querySelectorAll("[data-export]").forEach(
    (el) =>
      (el.onclick = safe(async () => {
        const type = el.dataset.export,
          b = active();
        let result;
        if (type === "png") result = await exportPng();
        else
          result = await io.exportText(
            type === "json"
              ? JSON.stringify(
                  { format: "mind-cleaner-studio", version: 1, board: b },
                  null,
                  2,
                )
              : markdown(b),
            b.title,
            type,
          );
        if (result) {
          toast("Export ready.");
          d.close();
        }
      })),
  );
}
async function exportPng() {
  const vals = [...positions.values()];
  if (!vals.length) throw Error("Add a thought before exporting an image.");
  const minX = Math.min(...vals.map((p) => p.x - p.w / 2)) - 50,
    maxX = Math.max(...vals.map((p) => p.x + p.w / 2)) + 50,
    minY = Math.min(...vals.map((p) => p.y - p.h / 2)) - 50,
    maxY = Math.max(...vals.map((p) => p.y + p.h / 2)) + 50;
  const w = maxX - minX,
    h = maxY - minY,
    scale = Math.min(2, 8000 / w, 8000 / h, Math.sqrt(24000000 / (w * h))),
    canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.fillStyle = state.theme === "light" ? "#f6f7f9" : "#17181b";
  ctx.fillRect(minX, minY, w, h);
  vals.forEach((p) => {
    if (p.parent) {
      ctx.strokeStyle = p.node.color;
      ctx.lineWidth = 5.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(
        new Path2D(edge(positions.get(p.parent), p, active().connector)),
      );
    }
  });
  ctx.globalAlpha = 1;
  for (const p of vals) {
    const n = p.node,
      x = p.x - p.w / 2,
      y = p.y - p.h / 2;
    const picture = imageCard(n);
    ctx.fillStyle = n.filled
      ? n.color
      : state.theme === "light"
        ? "#ffffff"
        : "#17181b";
    ctx.beginPath();
    ctx.roundRect(
      x,
      y,
      p.w,
      p.h,
      active().shape === "sharp" ? 3 : p.depth === 0 ? 18 : 13,
    );
    ctx.fill();
    if (p.depth === 0 && !picture) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = n.color;
      ctx.fillRect(x, y, 15, p.h);
      ctx.restore();
    }
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = n.filled
      ? filledCardInk(n.color)
      : state.theme === "light"
        ? "#242a2c"
        : "#f1f2ee";
    ctx.font = p.depth === 0 ? "650 30px Segoe UI" : "600 23px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lineHeight = p.depth === 0 ? 36 : 28;
    let textY = y + lineHeight;
    const image = imagePreview(n);
    const drawFiles = () => {
      if (!n.attachments.length) return;
      ctx.font = "12px Segoe UI";
      const start = y + p.h - n.attachments.length * 34 - (picture ? 6 : 18);
      n.attachments.forEach((a, index) => {
        const rowY = start + index * 34;
        const ext = String(
          a.ext || a.name.split(".").slice(1).pop() || "FILE",
        ).toUpperCase();
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 16, rowY);
        ctx.lineTo(x + p.w - 16, rowY);
        ctx.stroke();
        ctx.restore();
        ctx.textAlign = "right";
        ctx.fillText(ext, x + p.w - 18, rowY + 17);
        let name = a.name;
        const width = p.w - 52 - ctx.measureText(ext).width;
        while (name.length && ctx.measureText(name).width > width)
          name = name.slice(0, -1);
        if (name !== a.name) name = name.slice(0, -1) + "…";
        ctx.textAlign = "left";
        ctx.fillText(name, x + 18, rowY + 17);
      });
    };
    if (image) {
      try {
        const img = new Image();
        img.src = image.data_url;
        await img.decode();
        ctx.save();
        ctx.beginPath();
        if (picture) {
          const scale = Math.min(
            (p.w - 14) / img.naturalWidth,
            176 / img.naturalHeight,
          );
          const width = img.naturalWidth * scale,
            height = img.naturalHeight * scale;
          ctx.drawImage(
            img,
            p.x - width / 2,
            y + 95 - height / 2,
            width,
            height,
          );
        } else {
          ctx.roundRect(x + 15, y + 10, p.w - 30, 94, 6);
          ctx.clip();
          ctx.drawImage(img, x + 15, y + 10, p.w - 30, 94);
        }
        ctx.restore();
        textY += 100;
      } catch {}
    }
    if (picture) {
      if (!image) ctx.fillText("Image", p.x, p.y);
      drawFiles();
      continue;
    }
    const alignment = n.align || "center";
    const inset = cardInset(n, p.depth);
    const textWidth = p.w - 2 * inset;
    const textX =
      alignment === "left"
        ? x + inset
        : alignment === "right"
          ? x + p.w - inset
          : p.x;
    ctx.textAlign = alignment;
    const lines = [];
    for (const paragraph of n.text.split("\n")) {
      let line = "";
      for (const char of [...paragraph]) {
        if (ctx.measureText(line + char).width > textWidth && line) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
      lines.push(line);
    }
    lines
      .slice(0, 7)
      .forEach((line, i) => ctx.fillText(line, textX, textY + i * lineHeight));
    ctx.textAlign = "center";
    if (n.hasTodo) {
      ctx.strokeStyle = ctx.fillStyle;
      ctx.strokeRect(x + 10, y + p.h / 2 - 5, 10, 10);
      if (n.checked) {
        ctx.beginPath();
        ctx.moveTo(x + 11, y + p.h / 2);
        ctx.lineTo(x + 14, y + p.h / 2 + 3);
        ctx.lineTo(x + 19, y + p.h / 2 - 3);
        ctx.stroke();
      }
    }
    drawFiles();
    if (n.note) {
      ctx.globalAlpha = 0.6;
      ctx.font = "10px Segoe UI";
      ctx.fillText("Note", p.x, y + p.h - 12);
      ctx.globalAlpha = 1;
    }
  }
  if (io.native)
    return io.invoke("export_png_dialog", {
      base64Png: canvas.toDataURL("image/png"),
      defaultName: active().title,
    });
  const blob = await new Promise((r) => canvas.toBlob(r));
  io.download(blob, `${active().title}.png`);
  return true;
}
function openNodeAI(thought, mode = "branch", direction = null) {
  if (aiController || aiDraft) {
    toast(
      "Review or discard the current draft before choosing another thought.",
    );
  } else {
    selected = new Set([thought.id]);
    aiForm = {
      prompt: "",
      mode,
      direction,
      boardId: active().id,
      nodeId: thought.id,
    };
  }
  renderContext();
  openPanel("ai");
}
function aiFormTarget() {
  const b = state.boards.find((b) => b.id === aiForm.boardId);
  return b && find(b.root, aiForm.nodeId)?.node;
}
function renderAI() {
  const connectionOpen = $("#aiConnection")?.open;
  if (!aiForm.boardId) {
    aiForm.boardId = active().id;
    aiForm.nodeId = current().id;
    if (current() === active().root) aiForm.mode = "new";
  }
  const cfg = aiConfig(),
    target = aiFormTarget();
  $("#panel").innerHTML =
    panelHead("A new perspective") +
    `<p class="help">Describe what to create or change, including how many branches you want. Review the draft before applying it.</p>
    <label class="field"><span>What’s on your mind?</span><textarea id="aiPrompt" dir="auto" placeholder="Create 5 branches, or rewrite this thought…">${escape(aiForm.prompt)}</textarea></label>
    <label class="field"><span>Action</span><select id="aiDestination"><option value="branch">Create child branches</option><option value="edit">Edit only this box</option><option value="new">Create a new map</option></select><small id="aiTargetLabel">Target: ${escape(target?.text || "Original thought unavailable")}</small></label>
    <details id="aiConnection"><summary>AI connection</summary>
    <div class="panel-footer">${btn("importPromptPad", "Import from PromptPad", "folder")}${btn("importPromptPadFile", "Choose data file", "file")}</div>
    <label class="field"><span>Provider</span><select id="aiProvider">${Object.keys(
      ai.PROVIDERS,
    )
      .map(
        (id) =>
          `<option value="${id}">${{ openrouter: "OpenRouter", openai: "OpenAI", google: "Google AI Studio", anthropic: "Anthropic", custom: "Custom / Ollama" }[id]}</option>`,
      )
      .join("")}</select></label>
    <label class="field"><span>Endpoint</span><input id="aiEndpoint" value="${escape(cfg.endpoint)}"></label>
    <label class="field"><span>API key</span><input id="aiKey" type="password" autocomplete="off" value="${escape(cfg.key)}"><small>${io.native ? "Encrypted for your Windows account on Windows. Excluded from map exports." : "Kept in memory for this session. Excluded from map exports."}</small></label>
    <div class="row"><h3>Models</h3>${btn("refreshAIModels", "Refresh", "refresh")}</div>
    <label class="field"><span>Available models</span><select id="aiModelPicker"></select></label>
    <label class="field"><span>Model ID</span><input id="aiModel" value="${escape(cfg.model)}" placeholder="auto, or enter a model ID"></label>
    <label class="toggle-row" ${aiSettings.provider === "openrouter" ? "" : "hidden"}>Free models only in Auto<input id="aiFreeOnly" type="checkbox" ${aiSettings.freeOnly ? "checked" : ""}></label>
    <p id="aiModelStatus" class="help" role="status"></p></details>
    <div id="aiStatus" role="status"></div><div id="aiPreview"></div>
    <div class="panel-footer">${btn("generateAI", "Generate draft", "spark", "primary-button")}${btn("cancelAI", "Cancel", "", "secondary-button")}</div>
    <div id="aiAccept" hidden class="panel-footer">${btn("acceptAI", "Add to map", "check", "primary-button")}${btn("discardAI", "Discard", "", "secondary-button")}</div>`;
  $("#aiDestination").value = aiForm.mode;
  $("#aiProvider").value = aiSettings.provider;
  $("#aiConnection").open =
    connectionOpen ?? (!cfg.key && aiSettings.provider !== "custom");
  $("#aiPrompt").oninput = (e) => (aiForm.prompt = e.target.value);
  $("#aiDestination").onchange = (e) => (aiForm.mode = e.target.value);
  $("#aiProvider").onchange = (e) => {
    aiSettings.provider = e.target.value;
    persistAI();
    renderAI();
    $("#aiConnection").open = true;
    if (
      aiConfig().key ||
      ["openrouter", "custom"].includes(aiSettings.provider)
    )
      safe(refreshAIModels)();
  };
  for (const [id, key] of [
    ["aiEndpoint", "endpoint"],
    ["aiModel", "model"],
    ["aiKey", "key"],
  ]) {
    $(`#${id}`).oninput = (e) => {
      const value = e.target.value.trim();
      if ((key === "key" || key === "endpoint") && value !== cfg[key]) {
        cfg.models = [];
        cfg.health = {};
      }
      cfg[key] = value;
      if (key === "model") updateModelPicker();
    };
    $(`#${id}`).onchange = () => {
      persistAI();
      if (key !== "model") safe(refreshAIModels)();
    };
  }
  $("#aiModelPicker").onchange = (e) => {
    cfg.model = e.target.value;
    $("#aiModel").value = cfg.model;
    persistAI();
  };
  $("#aiFreeOnly").onchange = (e) => {
    aiSettings.freeOnly = e.target.checked;
    persistAI();
    updateModelPicker();
  };
  updateModelPicker();
  if (aiController) {
    $("#aiStatus").innerHTML =
      '<p class="help loading-dot">Generating your draft…</p>';
    $$('[data-action="generateAI"]').forEach((e) => (e.disabled = true));
  }
  if (aiDraft) showAIDraft();
}
function updateModelPicker() {
  if (!$("#aiModelPicker")) return;
  const cfg = aiConfig(),
    groups = new Map();
  for (const m of ai.sortedModels(cfg)) {
    const health = cfg.health?.[m.id];
    const group = `${m.free ? "Free" : "Other models"} · ${health?.ok === true ? "Worked recently" : health?.ok === false ? "Failed recently" : "Available / untested"}`;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(m);
  }
  $("#aiModelPicker").innerHTML =
    '<option value="auto">Auto — try available models</option>' +
    [...groups]
      .map(
        ([label, models]) =>
          `<optgroup label="${label}">${models.map((m) => `<option value="${escape(m.id)}">${escape(m.id)}</option>`).join("")}</optgroup>`,
      )
      .join("");
  if (
    cfg.model &&
    cfg.model !== "auto" &&
    !cfg.models.some((m) => m.id === cfg.model)
  ) {
    const option = document.createElement("option");
    option.value = cfg.model;
    option.textContent = cfg.model + " (manual)";
    $("#aiModelPicker").append(option);
  }
  $("#aiModelPicker").value = cfg.model || "auto";
  $("#aiModelStatus").textContent = cfg.models.length
    ? `${cfg.models.length} chat models · ${cfg.models.filter((m) => m.free).length} free. Availability is updated after each request.`
    : "Refresh to get models from your provider.";
}
const modelRefreshes = new Map();
async function refreshAIModels() {
  const provider = aiSettings.provider,
    cfg = aiConfig();
  const signature = JSON.stringify([provider, cfg.endpoint, cfg.key]);
  if (modelRefreshes.has(signature)) return modelRefreshes.get(signature);
  const stillCurrent = () =>
    panelType === "ai" &&
    provider === aiSettings.provider &&
    cfg === aiConfig();
  const snapshot = clone(cfg);
  if (stillCurrent()) $("#aiModelStatus").textContent = "Asking the provider…";
  const task = (async () => {
    try {
      const models = await ai.listModels(provider, snapshot, io.requestAI);
      if (cfg.key !== snapshot.key || cfg.endpoint !== snapshot.endpoint)
        return;
      cfg.models = models;
      if (cfg.model !== "auto" && !models.some((m) => m.id === cfg.model))
        cfg.model = "auto";
      await persistAI();
      if (stillCurrent()) {
        $("#aiModel").value = cfg.model;
        updateModelPicker();
      }
    } catch (e) {
      if (
        stillCurrent() &&
        cfg.key === snapshot.key &&
        cfg.endpoint === snapshot.endpoint
      )
        $("#aiModelStatus").textContent = e.message;
    } finally {
      modelRefreshes.delete(signature);
    }
  })();
  modelRefreshes.set(signature, task);
  return task;
}
async function importAIFromPromptPad(pick = false) {
  let source;
  if (io.native) {
    source = await io.invoke("import_promptpad_ai", { pickFile: pick });
    if (!source) {
      if (!pick)
        toast(
          "PromptPad was not found. Use Choose data file to select promptpad-data.json.",
        );
      return;
    }
  } else {
    const file = await io.pickFile(".json");
    if (!file) return;
    source = JSON.parse(await file.text());
  }
  const imported = ai.importPromptPad(source);
  // Merge populated connections so another provider's existing key is preserved.
  for (const id of Object.keys(ai.PROVIDERS)) {
    const cfg = imported.connections[id];
    if (
      cfg.key ||
      cfg.models.length ||
      id === imported.provider ||
      (id === "custom" && cfg.endpoint !== ai.PROVIDERS.custom)
    )
      aiSettings.connections[id] = {
        ...cfg,
        key: cfg.key || aiSettings.connections[id].key,
      };
  }
  aiSettings.provider = imported.provider;
  await persistAI();
  if (panelType === "ai") {
    renderAI();
    $("#aiConnection").open = true;
  }
  toast("PromptPad AI connections and models imported.");
  await refreshAIModels();
}
async function generateAI() {
  if (aiController) return;
  const prompt = $("#aiPrompt").value.trim();
  if (!prompt) {
    $("#aiPrompt").focus();
    return;
  }
  const provider = aiSettings.provider,
    sourceConfig = aiConfig(),
    cfg = clone(sourceConfig);
  cfg.model = cfg.model || "auto";
  if (!cfg.key.trim() && provider !== "custom") {
    $("#aiConnection").open = true;
    throw Error("Enter your API key first.");
  }
  const target = aiFormTarget();
  if (
    aiForm.mode !== "new" &&
    (!target ||
      target === state.boards.find((b) => b.id === aiForm.boardId)?.root)
  )
    throw Error("Select a thought for this action.");
  aiTarget = {
    boardId: aiForm.boardId,
    nodeId: aiForm.nodeId,
    mode: aiForm.mode,
    direction: aiForm.direction,
    originalText: target?.text,
    originalNote: target?.note,
  };
  const requestTarget = aiTarget;
  aiDraft = null;
  const controller = new AbortController();
  aiController = controller;
  const timeout = setTimeout(() => controller.abort(), 150000);
  $("#aiStatus").innerHTML =
    '<p class="help loading-dot">Generating your draft…</p>';
  $("#aiPreview").replaceChildren();
  $("#aiAccept").hidden = true;
  $$('[data-action="generateAI"]').forEach((e) => (e.disabled = true));
  try {
    const instruction =
      requestTarget.mode === "edit"
        ? 'Edit only the selected box according to the user request. Return ONLY JSON: {"text":"the edited box text","children":[]}. Do not create branches. Use the language requested by the user, otherwise preserve the original language. No markdown fences.'
        : 'Return ONLY JSON for a mind map: {"text":"short root title","children":[{"text":"thought","children":[]}]}. Follow the requested number of direct children and depth. At most 100 nodes and 6 levels. For adding child branches, put the requested branches directly in children. Use the user topic language unless they request another language. No markdown fences.';
    const content = `Request: ${prompt}\n${target ? `Selected box: ${target.text}\nNotes: ${target.note || ""}` : ""}`;
    const text = await ai.generate({
      provider,
      cfg,
      freeOnly: aiSettings.freeOnly,
      instruction,
      content,
      request: io.requestAI,
      signal: controller.signal,
      onAttempt(model) {
        if (panelType === "ai")
          $("#aiStatus").textContent = `Generating with ${model}…`;
      },
      onHealth(model, ok) {
        if (
          sourceConfig.key === cfg.key &&
          sourceConfig.endpoint === cfg.endpoint
        ) {
          sourceConfig.models = cfg.models;
          sourceConfig.health[model] = { ok, at: Date.now() };
          persistAI();
        }
      },
    });
    if (controller.signal.aborted)
      throw new DOMException("Stopped", "AbortError");
    const raw = JSON.parse(
      text
        .trim()
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, ""),
    );
    let count = 0;
    function convert(v, depth = 0) {
      if (
        !v ||
        typeof v.text !== "string" ||
        !v.text.trim() ||
        depth > 6 ||
        ++count > 100
      )
        throw Error(
          "The draft has an invalid structure or is too large. Try a smaller topic.",
        );
      const n = node(
        v.text.slice(0, requestTarget.mode === "edit" ? 10000 : 1000),
        COLORS[(depth + 1) % COLORS.length],
      );
      n.children = (Array.isArray(v.children) ? v.children : []).map((c) =>
        convert(c, depth + 1),
      );
      return n;
    }
    aiDraft = convert(
      requestTarget.mode === "edit" ? { text: raw.text, children: [] } : raw,
    );
    if (panelType === "ai") showAIDraft();
    else toast("Your AI draft is ready. Open AI assistant to review.");
  } catch (e) {
    const message =
      e.name === "AbortError"
        ? "Generation stopped. Try again whenever you’re ready."
        : e.message;
    if (panelType === "ai")
      $("#aiStatus").innerHTML =
        `<p class="inline-error">${escape(message)}</p>`;
    else toast(message, true);
  } finally {
    clearTimeout(timeout);
    aiController = null;
    $$('[data-action="generateAI"]').forEach((e) => (e.disabled = false));
  }
}
function showAIDraft() {
  if (!aiDraft || !$("#aiPreview")) return;
  $("#aiStatus").innerHTML =
    '<p class="help">Draft ready. Nothing has changed in your map yet.</p>';
  const html = (n) =>
    `<li>${escape(n.text)}${n.children.length ? `<ul>${n.children.map(html).join("")}</ul>` : ""}</li>`;
  $("#aiPreview").innerHTML =
    `<div class="preview-tree"><ul>${html(aiDraft)}</ul></div>`;
  $("#aiAccept").hidden = false;
  const accept = $('[data-action="acceptAI"]');
  const label = aiTarget?.mode === "edit" ? "Apply edit" : "Add to map";
  accept.lastChild.textContent = label;
  accept.setAttribute("aria-label", label);
}
function acceptAI() {
  if (!aiDraft || !aiTarget) return;
  if (aiTarget.mode === "new") {
    let b = board(aiDraft.text);
    b.root = clone(aiDraft);
    b = asCanvasBoard(b);
    state.boards.push(b);
    switchMap(b.id);
  } else {
    const b = state.boards.find((b) => b.id === aiTarget.boardId),
      n = b && find(b.root, aiTarget.nodeId)?.node;
    if (!n)
      throw Error(
        "The original branch no longer exists. Generate a new draft.",
      );
    if (aiTarget.mode === "edit" && n.text !== aiTarget.originalText)
      throw Error(
        "This box changed after generation started. Discard this draft and generate again.",
      );
    if (!histories.has(b.id)) histories.set(b.id, new History());
    histories.get(b.id).push(b);
    if (aiTarget.mode === "edit") {
      n.text = aiDraft.text;
      n.imageOnly = false;
    } else {
      const children = aiDraft.children.length
        ? clone(aiDraft.children)
        : [clone(aiDraft)];
      children.forEach((c) =>
        walk(c, (child) => {
          child.color = n.color;
          child.dir = aiTarget.direction || n.dir || childDirection(b);
        }),
      );
      n.children.push(...children);
      n.collapsed = false;
    }
    b.updatedAt = Date.now();
    state.activeBoardId = b.id;
    selected = new Set([n.id]);
    render();
    scheduleSave();
  }
  aiDraft = null;
  aiTarget = null;
  aiForm = { prompt: "", mode: "branch", direction: null };
  closePanel();
  fit();
  toast("Draft applied. Undo is available.");
}
function shortcutDialog() {
  const rows = [
    ["Add text branch", "Tab"],
    ["Add sibling branch", "Shift + Tab"],
    ["Edit selected thought", "Enter / F2"],
    ["New line while editing", "Shift + Enter"],
    ["Select multiple", "Ctrl + click"],
    ["Box selection", "Shift + drag canvas"],
    ["Move under another branch", "Drop on its +"],
    ["Pan canvas", "Drag empty canvas / Space + drag"],
    ["Zoom at cursor", "Scroll"],
    ["Undo / Redo", "Ctrl + Z / Ctrl + Shift + Z"],
    ["Search / New map", "Ctrl + F / Ctrl + N"],
    ["New independent thought", "N / double-click canvas"],
    ["Focus mode", "F"],
    ["Delete selected", "Delete"],
  ];
  const d = $("#dialog");
  d.innerHTML = `<h2>A few useful shortcuts</h2>${rows.map(([a, b]) => `<div class="shortcut"><span>${a}</span><kbd>${b}</kbd></div>`).join("")}<div class="actions">${btn("cancelDialog", "Got it", "", "primary-button")}</div>`;
  d.showModal();
}
const actions = {
  menu: () => toggleIsland(),
  newThought: () => newThoughtAt(),
  detach: () => {
    const n = current(),
      p = positions.get(n.id);
    if (!p) return;
    mutate((b) => detachBranch(b, n.id, p), { panel: true });
  },
  add: () => addNode(),
  details: () => openPanel("details"),
  more: () => openPanel("details"),
  attach: attachFile,
  record: recordVoice,
  maps: () => (panelType === "maps" ? closePanel() : openPanel("maps")),
  settings: () =>
    panelType === "settings" ? closePanel() : openPanel("settings"),
  search: () => openPanel("search"),
  ai: () => {
    if (
      !aiController &&
      !aiDraft &&
      (aiForm.nodeId !== current().id || aiForm.boardId !== active().id)
    ) {
      aiForm = {
        prompt: aiForm.prompt,
        mode: current() === active().root ? "new" : "branch",
        direction: null,
        boardId: active().id,
        nodeId: current().id,
      };
    }
    openPanel("ai");
  },
  refreshAIModels,
  importPromptPad: () => importAIFromPromptPad(false),
  importPromptPadFile: () => importAIFromPromptPad(true),
  closePanel,
  map: () => {
    view = "map";
    $$(".view-switch button").forEach((e) =>
      e.classList.toggle("active", e.dataset.action === "map"),
    );
    render();
  },
  outline: () => {
    closePanel();
    toggleIsland(false);
    view = "outline";
    $$(".view-switch button").forEach((e) =>
      e.classList.toggle("active", e.dataset.action === "outline"),
    );
    render();
  },
  select: () => setTool("select"),
  hand: () => setTool("hand"),
  zoomIn: () => zoom(1.2),
  zoomOut: () => zoom(1 / 1.2),
  resetZoom: () => zoom(1 / pan.z),
  fit,
  focus: () => {
    document.body.classList.toggle("focus");
    closePanel();
    fit();
  },
  undo: () => restoreHistory("undo"),
  redo: () => restoreHistory("redo"),
  save: flushSave,
  roundEdges: () => mutate((b) => (b.connector = "rounded"), { panel: true }),
  softEdges: () => mutate((b) => (b.connector = "soft"), { panel: true }),
  sharpEdges: () => mutate((b) => (b.connector = "sharp"), { panel: true }),
  softNodes: () => mutate((b) => (b.shape = "soft"), { panel: true }),
  sharpNodes: () => mutate((b) => (b.shape = "sharp"), { panel: true }),
  tidy: () => {
    if (!positions.size) return;
    mutate((b) =>
      walk(b.root, (n, parent) => {
        if (b.virtualRoot && parent === b.root) return;
        n.dx = 0;
        n.dy = 0;
      }),
    );
    fit();
    toast("A little more breathing room.");
  },
  dark: () => setTheme("dark"),
  light: () => setTheme("light"),
  fold: () => {
    if (current() === active().root) return;
    mutate(() => (current().collapsed = !current().collapsed), { panel: true });
  },
  delete: deleteSelection,
  duplicate: () => {
    const hit = find(active().root, current().id);
    if (!hit.parent) return;
    mutate(
      () => {
        const n = clone(hit.node);
        walk(n, (c) => (c.id = uid()));
        n.text += " copy";
        if (hit.parent === active().root) {
          n.dx += 280;
          n.dy += 60;
        }
        hit.parent.children.push(n);
        selected = new Set([n.id]);
      },
      { panel: true },
    );
  },
  rename: () =>
    askText("Name this map", active().title, (name) =>
      mutate((b) => {
        b.title = name;
        b.root.text = name;
      }),
    ),
  newMap: () => startBlankCanvas(),
  duplicateMap: () => {
    const b = clone(active());
    b.id = uid();
    b.title += " copy";
    b.root.text = b.title;
    walk(b.root, (n) => (n.id = uid()));
    state.boards.push(b);
    switchMap(b.id);
  },
  deleteMap: () => {
    if (state.boards.length === 1) {
      toast("Create another map before deleting this one.");
      return;
    }
    const id = active().id;
    confirm(
      "Delete this map?",
      "This removes the map from your workspace. Export a JSON copy first if you want to keep it. This action cannot be undone.",
      () => {
        state.boards = state.boards.filter((b) => b.id !== id);
        histories.delete(id);
        switchMap(state.boards[0].id);
      },
    );
  },
  import: importMap,
  export: exportDialog,
  shortcuts: shortcutDialog,
  cancelDialog: () => $("#dialog").close(),
  generateAI,
  cancelAI: () => aiController?.abort(),
  acceptAI,
  discardAI: () => {
    aiDraft = null;
    aiTarget = null;
    aiForm.boardId = null;
    renderAI();
  },
  minimize: () => io.native && io.invoke("win_minimize"),
  maximize: () => io.native && io.invoke("win_toggle_maximize"),
  close: async () => {
    if (recording) {
      toast("Stop the voice recording before closing.", true);
      return;
    }
    await aiSettingsQueue;
    if (await flushSave()) {
      allowClose = true;
      await io.invoke("win_close");
    } else {
      modal(
        "Close without saving?",
        "<p>Your latest changes have not been saved. Cancel and export JSON to keep a copy, or close without saving.</p>",
        [
          {
            action: "forceClose",
            label: "Close without saving",
            class: "secondary-button danger",
          },
        ],
      );
    }
  },
  forceClose: async () => {
    allowClose = true;
    await io.invoke("win_close");
  },
};
function restoreHistory(method) {
  const b = history()[method](active());
  if (!b) return;
  state.boards[state.boards.findIndex((x) => x.id === b.id)] = b;
  selected = new Set([...selected].filter((id) => find(b.root, id)));
  render();
  if (panelType === "details" || panelType === "settings")
    openPanel(panelType, false);
  scheduleSave();
}
function setTool(value) {
  tool = value;
  $("#viewport").classList.toggle("hand", value === "hand");
  $$(
    '.tool-rail [data-action="select"],.tool-rail [data-action="hand"]',
  ).forEach((el) => el.classList.toggle("active", el.dataset.action === value));
}
function setTheme(theme) {
  state.theme = theme;
  render();
  renderSettings();
  scheduleSave();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn && ready) safe(fn)();
});
document.addEventListener(
  "pointerdown",
  (e) => {
    if (panelType && e.target.closest("#viewport")) closePanel();
  },
  true,
);
document.addEventListener("pointerdown", (e) => {
  if (
    !$("#thoughtMenu").hidden &&
    !e.target.closest("#thoughtMenu,.branch-add")
  )
    renderContext();
});
document.addEventListener("keydown", (e) => {
  if (
    !ready ||
    e.target.closest("input,textarea,select,[contenteditable=true]") ||
    $("#dialog").open
  )
    return;
  if (e.key === "Escape" && !$("#thoughtMenu").hidden) {
    e.preventDefault();
    renderContext();
    $("#viewport").focus({ preventScroll: true });
    return;
  }
  const ctrl = e.ctrlKey || e.metaKey;
  let action;
  if (ctrl) {
    if (e.key.toLowerCase() === "z") action = e.shiftKey ? "redo" : "undo";
    if (e.key.toLowerCase() === "y") action = "redo";
    if (e.key.toLowerCase() === "f") action = "search";
    if (e.key.toLowerCase() === "n") action = "newMap";
    if (e.key.toLowerCase() === "s") action = "save";
    if (e.key.toLowerCase() === "g") action = "ai";
    if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      selected = new Set(positions.keys());
      render();
      return;
    }
  } else if (e.key === "Tab" && e.target === $("#viewport")) {
    e.preventDefault();
    addNode(e.shiftKey);
    return;
  } else if (
    (e.key === "Enter" || e.key === "F2") &&
    !e.target.closest("button")
  ) {
    e.preventDefault();
    if (current() === active().root) newThoughtAt();
    else editNode(current().id);
    return;
  } else if (e.key === "Delete" || e.key === "Backspace") action = "delete";
  else if (e.key === " " && !e.target.closest("button")) {
    e.preventDefault();
    spaceDown = true;
  } else if (e.key.toLowerCase() === "h") action = "hand";
  else if (e.key.toLowerCase() === "v") action = "select";
  else if (e.key.toLowerCase() === "f") action = "focus";
  else if (e.key === "Escape") {
    if (document.body.classList.contains("focus")) action = "focus";
    else {
      if (drag) finishDrag(e, true);
      toggleIsland(false);
      closePanel();
      selected.clear();
      render();
    }
  }
  if (e.key.toLowerCase() === "n" && !ctrl) action = "newThought";
  if (action) {
    e.preventDefault();
    safe(actions[action])();
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === " ") spaceDown = false;
});
window.addEventListener("blur", () => {
  spaceDown = false;
  if (drag) finishDrag({}, true);
});
$("#viewport").addEventListener("click", (e) => {
  if (e.target.closest("input,textarea,button")) return;
  if (panelType) closePanel();
  $("#viewport").focus({ preventScroll: true });
});
$("#titlebar").addEventListener("pointerdown", (e) => {
  if (
    io.native &&
    e.target.classList.contains("header-spacer") &&
    e.button === 0
  )
    io.invoke("win_start_drag").catch(() => {});
});
$("#titlebar").addEventListener("dblclick", (e) => {
  if (io.native && e.target.classList.contains("header-spacer"))
    io.invoke("win_toggle_maximize").catch(() => {});
});
window.addEventListener("beforeunload", (e) => {
  if (!allowClose && (recording || revision !== savedRevision)) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && ready && revision !== savedRevision) flushSave();
});
window.addEventListener("resize", () => {
  if (ready) transform();
});
async function init() {
  hydrate();
  $("#windowControls").hidden = !io.native;
  if (io.native && window.__TAURI__.window?.getCurrentWindow) {
    await window.__TAURI__.window.getCurrentWindow().onCloseRequested((e) => {
      if (!allowClose) {
        e.preventDefault();
        if (ready) safe(actions.close)();
      }
    });
  }
  try {
    const data = await io.load();
    if (data) {
      const maps = importBoards(data).map(asCanvasBoard);
      state = {
        version: 1,
        boards: maps,
        activeBoardId: maps.some((b) => b.id === data.activeBoardId)
          ? data.activeBoardId
          : maps[0].id,
        theme: data.theme === "light" ? "light" : "dark",
        motion: data.motion !== false,
        confirmThoughtDeletion: data.confirmThoughtDeletion !== false,
      };
      if (data.version !== 1)
        toast(
          "Your previous maps are ready. The original workspace is preserved.",
        );
    } else {
      const b = blankBoard();
      state.boards = [b];
      state.activeBoardId = b.id;
    }
  } catch (e) {
    loadFailed = true;
    const b = blankBoard("Recovery workspace");
    state.boards = [b];
    state.activeBoardId = b.id;
    toast(
      `Could not read your workspace. Automatic saving is disabled to protect it. ${e.message || e}`,
      true,
    );
  }
  ready = true;
  try {
    aiSettings = ai.normalizeSettings(await io.loadAISettings());
  } catch {
    toast("Could not load AI connections. You can import them again.", true);
  }
  selected = new Set();
  render();
  fit();
  saveStatus(
    loadFailed
      ? "Recovery · export only"
      : io.native
        ? "Saved locally"
        : "Saved in browser",
    loadFailed,
  );
  if (!loadFailed) {
    scheduleSave();
    await flushSave();
  }
  $("#viewport").focus({ preventScroll: true });
}
init().catch((e) => {
  saveStatus("Could not start", true);
  toast(e.message, true);
});

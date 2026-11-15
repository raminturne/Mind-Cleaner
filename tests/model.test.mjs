import test from "node:test";
import assert from "node:assert/strict";
import {
  board,
  blankBoard,
  asCanvasBoard,
  detachBranch,
  node,
  layout,
  edge,
  moveBranch,
  find,
  History,
  normalizeBoard,
  importBoards,
  removeBranches,
  markdown,
} from "../studio/model.mjs";
test("legacy maps keep notes, attachments and four-direction branches", () => {
  const b = board("Legacy");
  const n = node("فارسی");
  n.note = "A note";
  n.attachments = [{ name: "photo.png", path: "C:/photo.png", is_image: true }];
  n.dir = "up";
  b.root.children.push(n);
  const clean = normalizeBoard(b);
  assert.equal(clean.root.children[0].note, "A note");
  assert.equal(clean.root.children[0].attachments[0].path, "C:/photo.png");
  assert.equal(layout(clean).get(n.id).side, "up");
  assert.equal(importBoards({ boards: [b] }).length, 1);
});
test("reparent cannot introduce a cycle or move the root", () => {
  const b = board("Test", true),
    a = b.root.children[0],
    child = a.children[0],
    other = b.root.children[1];
  assert.equal(moveBranch(b, a.id, child.id), false);
  assert.equal(moveBranch(b, b.root.id, a.id), false);
  assert.equal(moveBranch(b, child.id, other.id, "left"), true);
  assert.equal(find(b.root, child.id).parent.id, other.id);
  assert.equal(a.children.length, 1);
});
test("undo and redo restore structural edits and connector preferences", () => {
  let b = board("Test", true);
  const h = new History();
  h.push(b);
  b.connector = "sharp";
  b.root.children.pop();
  b = h.undo(b);
  assert.equal(b.connector, "soft");
  assert.equal(b.root.children.length, 4);
  b = h.redo(b);
  assert.equal(b.connector, "sharp");
  assert.equal(b.root.children.length, 3);
  h.push(b);
  assert.equal(h.future.length, 0);
});
test("soft and angular edges use distinct geometry, all layouts are finite", () => {
  const b = board("Test", true);
  for (const dir of ["balanced", "left", "right", "up", "down"]) {
    b.layout = dir;
    const p = layout(b);
    for (const item of p.values()) {
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y));
      if (item.parent) {
        assert.match(edge(p.get(item.parent), item, "soft"), /C/);
        assert.match(edge(p.get(item.parent), item, "sharp"), /H|V/);
        assert.ok(!edge(p.get(item.parent), item, "sharp").includes("C"));
      }
    }
  }
});
test("collapse hides descendants without deleting them", () => {
  const b = board("Test", true),
    branch = b.root.children[0],
    before = layout(b).size;
  branch.collapsed = true;
  assert.equal(layout(b).size, before - 2);
  assert.ok(find(b.root, branch.children[0].id));
  branch.collapsed = false;
  assert.equal(layout(b).size, before);
});
test("overlapping selection deletes each subtree safely and keeps root", () => {
  const b = board("Test", true),
    branch = b.root.children[0];
  removeBranches(b, new Set([b.root.id, branch.id, branch.children[0].id]));
  assert.equal(b.root.children.length, 3);
  assert.equal(find(b.root, branch.id), undefined);
});
test("malformed imports are rejected and duplicate IDs are repaired", () => {
  assert.throws(() => importBoards({ hello: "world" }));
  assert.throws(() => importBoards({ boards: [] }));
  const b = board("Test", true);
  b.root.children[0].id = b.root.id;
  const n = normalizeBoard(b);
  assert.notEqual(n.root.children[0].id, n.root.id);
  assert.throws(() => normalizeBoard({ root: { children: [null] } }));
});
test("Markdown retains tasks and notes", () => {
  const b = board("Test", true);
  b.root.children[0].note = "Useful note";
  b.root.children[0].hasTodo = true;
  b.root.children[0].checked = true;
  const md = markdown(b);
  assert.match(md, /- \[x\] Audience/);
  assert.match(md, /Useful note/);
  assert.match(md, /  - Early adopters/);
});

test("blank canvas excludes its structural root and positions independent trees", () => {
  const b = blankBoard();
  assert.equal(layout(b).size, 0);
  const a = node("A"),
    z = node("Z");
  a.dx = -300;
  z.dx = 400;
  z.dy = 100;
  a.children.push(node("One", a.color, "down"), node("Two", a.color, "down"));
  b.root.children.push(a, z);
  const p = layout(b);
  assert.equal(p.size, 4);
  assert.equal(p.get(z.id).x, 400);
  assert.equal(p.get(a.id).x, -300);
  for (const c of a.children) assert.ok(p.get(c.id).y > p.get(a.id).y);
  assert.notEqual(p.get(a.children[0].id).x, p.get(a.children[1].id).x);
});
test("legacy conversion preserves positions and detaching preserves subtree position", () => {
  const old = board("Legacy", true),
    before = layout(old),
    b = asCanvasBoard(old);
  const converted = layout(b);
  for (const [id, p] of before) {
    assert.equal(converted.get(id).x, p.x);
    assert.equal(converted.get(id).y, p.y);
  }
  const branch = old.root.children[0],
    original = converted.get(branch.id);
  assert.equal(detachBranch(b, branch.id, original), true);
  const after = layout(b);
  assert.equal(after.get(branch.id).x, original.x);
  assert.equal(after.get(branch.id).y, original.y);
  assert.equal(branch.children.length, 2);
  assert.equal(moveBranch(b, old.root.id, branch.children[0].id, "down"), true);
  assert.equal(moveBranch(b, branch.id, old.root.id, "down"), false);
});

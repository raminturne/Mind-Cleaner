import { test, expect } from "@playwright/test";
const key = "mind-cleaner-canvas-v2";
const thought = (page, text) =>
  page.locator(".node").filter({
    has: page.locator(".node-label", { hasText: new RegExp(`^${text}$`) }),
  });
async function create(page, text, x = 700, y = 260) {
  await page.mouse.dblclick(x, y);
  const input = page.getByRole("textbox", { name: "Branch text" });
  await input.fill(text);
  await input.press("Enter");
  return thought(page, text);
}
async function menu(page, label) {
  if (!(await page.locator("#islandMenu").isVisible()))
    await page.getByRole("button", { name: "More tools", exact: true }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
}
async function finishText(page, text) {
  const input = page.getByRole("textbox", { name: "Branch text" });
  await input.fill(text);
  await input.press("Enter");
}
async function saved(page) {
  await expect(page.locator("#saveState")).toHaveText("Saved in browser");
}
async function data(page) {
  await saved(page);
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
}
async function dragOntoPlus(page, source, target) {
  const a = await source.boundingBox();
  await target.hover();
  const b = await target.locator(".branch-add").boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 });
  await expect(target).toHaveClass(/drop-target/);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (e) => {
    throw e;
  });
  await page.goto("/");
  await expect(page.locator("#emptyCanvas")).toBeVisible();
});

test("blank entry shows only a centered floating island; menu expands and hides", async ({
  page,
}) => {
  await expect(page.locator(".node")).toHaveCount(0);
  await expect(page.locator("#panel")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "AI assistant", exact: true }),
  ).toBeHidden();
  const island = await page.locator("#island").boundingBox();
  expect(island.width).toBeLessThan(80);
  expect(Math.abs(island.y + island.height / 2 - 502)).toBeLessThan(3);
  await expect(page.getByRole("button", { name: "Hand tool" })).toBeVisible();
  await page.getByRole("button", { name: "More tools" }).click();
  await expect(page.locator("#island")).toHaveClass(/expanded/);
  await expect(page.getByRole("button", { name: "Appearance" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#islandMenu")).toBeHidden();
});

test("direct typing, Tab and repeated bottom plus produce children to the right of parent", async ({
  page,
}) => {
  const parent = await create(page, "Parent");
  const original = await parent.boundingBox();
  await parent.click();
  await page.keyboard.press("Tab");
  await finishText(page, "First");
  await parent.hover();
  await parent.locator(".branch-add").click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await finishText(page, "Second");
  const one = await thought(page, "First").boundingBox(),
    two = await thought(page, "Second").boundingBox();
  expect(one.x).toBeGreaterThan(original.x + original.width);
  expect(two.x).toBeGreaterThan(original.x + original.width);
  expect(Math.abs(one.x - two.x)).toBeLessThan(2);
  expect(two.y).toBeGreaterThan(one.y);
  await expect(page.locator("#edges path").first()).toHaveAttribute("d", /Q/);
  expect((await parent.boundingBox()).y).toBeCloseTo(original.y);
  await expect(page.locator(".node")).toHaveCount(3);
  const s = await data(page);
  const b = s.boards.find((b) => b.id === s.activeBoardId);
  expect(b.root.children[0].children).toHaveLength(2);
});

test("wheel zoom anchors to cursor without modifier and empty drag pans", async ({
  page,
}) => {
  const n = await create(page, "Anchor");
  const before = await n.boundingBox(),
    x = before.x + before.width / 2,
    y = before.y + before.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -180);
  await page.waitForTimeout(150);
  const after = await n.boundingBox();
  expect(after.width).toBeGreaterThan(before.width);
  expect(Math.abs(after.x + after.width / 2 - x)).toBeLessThan(2);
  expect(Math.abs(after.y + after.height / 2 - y)).toBeLessThan(2);
  await page.mouse.move(1200, 750);
  await page.mouse.down();
  await page.mouse.move(1260, 800, { steps: 8 });
  await page.mouse.up();
  const moved = await n.boundingBox();
  expect(moved.x - after.x).toBeCloseTo(60, 0);
  expect(moved.y - after.y).toBeCloseTo(50, 0);
});

test("independent thoughts drag onto plus without modifiers, carrying descendants; undo restores", async ({
  page,
}) => {
  const target = await create(page, "Target", 500, 250);
  const source = await create(page, "Source", 1000, 250);
  await source.click();
  await page.keyboard.press("Tab");
  await finishText(page, "Nested");
  await dragOntoPlus(page, source, target);
  await expect(page.locator("#dropPreview")).toBeHidden();
  const s = await data(page),
    b = s.boards.find((b) => b.id === s.activeBoardId);
  expect(b.root.children).toHaveLength(1);
  expect(b.root.children[0].children[0].text).toBe("Source");
  expect(b.root.children[0].children[0].children[0].text).toBe("Nested");
  await page.keyboard.press("Control+z");
  const undone = await data(page),
    ub = undone.boards.find((b) => b.id === undone.activeBoardId);
  expect(ub.root.children).toHaveLength(2);
  await expect(page.locator(".node")).toHaveCount(3);
});

test("invalid descendant drop and Escape preserve the tree", async ({
  page,
}) => {
  const parent = await create(page, "Parent", 650, 220);
  await parent.click();
  await page.keyboard.press("Tab");
  await finishText(page, "Child");
  const child = thought(page, "Child");
  await child.hover();
  const target = await child.locator(".branch-add").boundingBox(),
    start = await parent.boundingBox();
  await page.mouse.move(start.x + 50, start.y + 20);
  await page.mouse.down();
  await page.mouse.move(target.x + 16, target.y + 16, { steps: 10 });
  await expect(child).not.toHaveClass(/drop-target/);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  const restored = await parent.boundingBox();
  expect(restored.x).toBeCloseTo(start.x, 0);
  const s = await data(page);
  expect(
    s.boards.find((b) => b.id === s.activeBoardId).root.children[0].children,
  ).toHaveLength(1);
});

test("reopen restores the last active map without creating extra maps", async ({
  page,
}) => {
  await create(page, "Saved idea");
  await saved(page);
  const before = await data(page);
  await page.reload();
  await expect(thought(page, "Saved idea")).toBeVisible();
  const after = await data(page);
  expect(after.activeBoardId).toBe(before.activeBoardId);
  expect(after.boards.length).toBe(before.boards.length);
});

test("settings preserve connection and shape independently without moving viewport", async ({
  page,
}) => {
  const p = await create(page, "Shape");
  await p.click();
  await page.keyboard.press("Tab");
  await finishText(page, "Child");
  const transform = await page.locator("#world").getAttribute("style");
  await menu(page, "Appearance");
  await page.getByRole("button", { name: "Soft", exact: true }).click();
  await page.getByRole("button", { name: "Sharp", exact: true }).click();
  await expect(p).toHaveClass(/sharp/);
  await expect(page.locator("#edges path").first()).toHaveAttribute("d", /C/);
  expect(await page.locator("#world").getAttribute("style")).toBe(transform);
  await expect(page.locator("#panel")).toBeVisible();
  await page.mouse.click(1150, 750);
  await expect(page.locator("#panel")).toBeHidden();
  expect(await page.locator("#world").getAttribute("style")).toBe(transform);
  await menu(page, "Appearance");
  await page.locator("#motionToggle").uncheck();
  await expect(page.locator("body")).toHaveClass(/no-motion/);
});

test("notes, attachment, delete and undo use selected thought", async ({
  page,
}) => {
  const p = await create(page, "Files");
  await p.click({ button: "right" });
  await expect(page.locator("#panel")).toBeHidden();
  await page.getByRole("button", { name: "Lilac", exact: true }).click();
  await expect(p).toHaveAttribute("style", /#c18bf3/);
  await expect(p).toHaveCSS("box-shadow", /rgb\(193, 139, 243\).*inset/);
  await p.click({ button: "right" });
  await page.getByRole("button", { name: "Add as task" }).click();
  await expect(p.getByRole("checkbox")).toBeVisible();
  await menu(page, "Thought details");
  await page.locator("#detailNote").fill("Remember this");
  await page.locator("#detailNote").press("Tab");
  const chooser = page.waitForEvent("filechooser");
  await page
    .locator("#panel")
    .getByRole("button", { name: "Attach file", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A note"),
  });
  await expect(
    page.getByRole("button", { name: "brief.txt", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close panel" }).click();
  await p.click();
  await page.keyboard.press("Delete");
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.locator(".node")).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(p).toBeVisible();
  await p.click();
  await menu(page, "Thought details");
  await expect(page.locator("#detailNote")).toHaveValue("Remember this");
});

test("legacy JSON import and PNG export work through hidden menu", async ({
  page,
}) => {
  await menu(page, "Saved maps");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import a map", exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: "legacy.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        title: "Legacy map",
        root: {
          id: "root",
          text: "Legacy root",
          children: [{ id: "child", text: "Legacy child", dir: "right" }],
        },
      }),
    ),
  });
  await expect(page.locator(".node")).toHaveCount(2);
  await menu(page, "Export");
  const wait = page.waitForEvent("download");
  await page.locator('[data-export="png"]').click();
  const file = await wait;
  expect(file.suggestedFilename()).toBe("Legacy map.png");
  expect(await file.failure()).toBeNull();
});

test("save failure stays visible and corrupted workspace remains intact", async ({
  page,
}) => {
  await create(page, "Stored");
  await saved(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw Error("Disk full");
    };
  });
  await thought(page, "Stored").dblclick();
  await finishText(page, "Unsaved");
  await expect(page.locator("#saveState")).toHaveText("Save failed · retry");
  await page.reload();
  await page.evaluate((k) => localStorage.setItem(k, "{broken"), key);
  await page.reload();
  await expect(page.locator("#saveState")).toHaveText("Recovery · export only");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "{broken",
  );
});

test("AI drafts require acceptance and remain hidden outside the requested sheet", async ({
  page,
}) => {
  await create(page, "Target");
  await thought(page, "Target").click();
  await page.route("https://openrouter.ai/**", (r) =>
    r.fulfill({
      json: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                text: "Draft",
                children: [{ text: "Try this", children: [] }],
              }),
            },
          },
        ],
      },
    }),
  );
  await menu(page, "AI assistant");
  await page.locator("#aiPrompt").fill("Explore options");
  await page.locator("#aiModel").fill("test-model");
  await page.locator("#aiKey").fill("synthetic-key");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add to map", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".node")).toHaveCount(1);
  await page.getByRole("button", { name: "Add to map", exact: true }).click();
  await expect(page.locator(".node")).toHaveCount(2);
  expect(JSON.stringify(await data(page))).not.toContain("synthetic-key");
});

test("small window keeps island centered and expanded controls reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.getByRole("button", { name: "More tools" }).click();
  const r = await page.locator("#island").boundingBox();
  expect(r.y).toBeGreaterThan(38);
  expect(r.y + r.height).toBeLessThanOrEqual(600);
  await menu(page, "Appearance");
  await expect(
    page.getByRole("button", { name: "Angular", exact: true }),
  ).toBeVisible();
});

test("tidy keeps independent roots apart and inline plus commits before creating a child", async ({
  page,
}) => {
  await page.mouse.dblclick(450, 230);
  await page.getByRole("textbox", { name: "Branch text" }).fill("Quick parent");
  await page.locator(".node .branch-add").click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await finishText(page, "Quick child");
  await expect(thought(page, "Quick parent")).toBeVisible();
  const second = await create(page, "Independent", 1050, 620);
  const before = await second.boundingBox();
  const child = await thought(page, "Quick child").boundingBox();
  await page.mouse.move(child.x + child.width / 2, child.y + child.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    child.x + child.width / 2,
    child.y + child.height / 2 + 120,
  );
  await page.mouse.up();
  const moved = await data(page);
  expect(
    moved.boards.find((b) => b.id === moved.activeBoardId).root.children[0]
      .children[0].dy,
  ).not.toBe(0);
  await page.getByRole("button", { name: "Auto arrange" }).click();
  const s = await data(page),
    b = s.boards.find((b) => b.id === s.activeBoardId);
  const roots = b.root.children;
  expect(roots).toHaveLength(2);
  expect(roots[0].dx).not.toBe(roots[1].dx);
  expect(roots[0].children[0].text).toBe("Quick child");
  expect(roots[0].children[0].dy).toBe(0);
  expect(before.width).toBeGreaterThan(0);
});

test("plus creates media children on the original parent and undo removes one child", async ({
  page,
}) => {
  const parent = await create(page, "Media");
  for (const [kind, name, mimeType, buffer] of [
    ["File", "brief.txt", "text/plain", Buffer.from("A brief")],
    [
      "Image",
      "reference.png",
      "image/png",
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKJ0AAAAASUVORK5CYII=",
        "base64",
      ),
    ],
  ]) {
    await parent.hover();
    await parent.locator(".branch-add").click();
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: kind, exact: true }).click();
    await (await chooser).setFiles({ name, mimeType, buffer });
    const child = page.getByRole("group", {
      name: kind === "Image" ? "Image" : name,
      exact: true,
    });
    if (kind === "Image") {
      await expect(
        child.getByRole("img", { name: "Image attachment" }),
      ).toBeVisible();
      await expect(child.locator(".node-files")).toContainText(name);
      await expect(child.locator(".node-label")).toHaveCount(0);
    }
    await expect(
      child.getByRole("button", { name: "Open " + name, exact: true }),
    ).toBeVisible();
    expect((await child.boundingBox()).x).toBeGreaterThan(
      (await parent.boundingBox()).x,
    );
  }
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("group", { name: "Image", exact: true }),
  ).toHaveCount(0);
  const s = await data(page);
  const board = s.boards.find((b) => b.id === s.activeBoardId);
  expect(board.root.children[0].children.map((n) => n.text)).toEqual([
    "brief.txt",
  ]);
});

test("voice records a stream and creates a playable child when stopped", async ({
  page,
}) => {
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext();
      await context.resume();
      const oscillator = context.createOscillator();
      const destination = context.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      return destination.stream;
    };
  });
  const parent = await create(page, "Record");
  await parent.locator(".branch-add").click();
  await page.getByRole("button", { name: "Voice", exact: true }).click();
  const stop = page.getByRole("button", { name: "Stop recording" });
  await expect(stop).toBeVisible();
  await page.waitForTimeout(350);
  await stop.click();
  await expect(stop).toBeHidden();
  await page.locator(".node-file-open").click({ button: "right" });
  await expect(page.locator("#thoughtMenu audio")).toHaveAttribute(
    "src",
    /^data:audio\//,
  );
  await page.getByRole("button", { name: "Record replacement" }).click();
  await expect(stop).toBeVisible();
  await page.waitForTimeout(350);
  await stop.click();
  await expect(stop).toBeHidden();
  await expect(thought(page, "Voice note").locator(".node-file")).toHaveCount(
    1,
  );
  await expect(page.locator(".node")).toHaveCount(2);
});

test("long card text wraps and its editor grows without scrolling", async ({
  page,
}) => {
  await page.mouse.dblclick(500, 200);
  const editor = page.getByRole("textbox", { name: "Branch text" });
  const text = "A long thought should wrap across the card without scrolling. "
    .repeat(5)
    .trim();
  await editor.fill(text);
  const size = await editor.evaluate((el) => ({
    overflow: getComputedStyle(el).overflowY,
    height: el.clientHeight,
    content: el.scrollHeight,
  }));
  expect(size.overflow).toBe("hidden");
  expect(size.height).toBeGreaterThanOrEqual(size.content - 1);
  await editor.press("Enter");
  const label = page.locator(".node-label");
  await expect(label).toHaveText(text);
  await expect(label).toHaveCSS("overflow-y", "visible");
  await expect(page.locator(".root-glyph")).toHaveCount(0);
});

test("Persian is centered by default and new downward branches inherit their parent's color", async ({
  page,
}) => {
  const parent = await create(page, "ایده های یوتیوب", 500, 220);
  const label = parent.locator(".node-label");
  await expect(label).toHaveCSS("direction", "rtl");
  await expect(label).toHaveCSS("text-align", "center");
  for (const [button, expected] of [
    ["Align right", "right"],
    ["Align left", "left"],
    ["Center text", "center"],
  ]) {
    await parent.click({ button: "right" });
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(label).toHaveCSS("text-align", expected);
    await expect(label).toHaveCSS("direction", "rtl");
  }
  for (const [color, hex] of [
    ["Red", "#f15d65"],
    ["White", "#ffffff"],
  ]) {
    await parent.click({ button: "right" });
    await page.getByRole("button", { name: color, exact: true }).click();
    await expect(parent).toHaveAttribute("style", new RegExp(hex));
  }
  const parentBox = await parent.boundingBox();
  const plus = parent.locator(".branch-add");
  await parent.hover({
    position: { x: parentBox.width / 2, y: parentBox.height - 5 },
  });
  await expect(plus).toHaveAttribute("data-direction", "down");
  const plusBox = await plus.boundingBox();
  expect(plusBox.y - parentBox.y - parentBox.height).toBeGreaterThan(5);
  await plus.click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await finishText(page, "ایده جدید");
  const child = thought(page, "ایده جدید");
  const childBox = await child.boundingBox();
  expect(childBox.y).toBeGreaterThan(parentBox.y + parentBox.height);
  expect(childBox.x + childBox.width / 2).toBeCloseTo(
    parentBox.x + parentBox.width / 2,
    0,
  );
  await expect(child).toHaveAttribute("style", /#ffffff/);
  const s = await data(page);
  const savedRoot = s.boards.find((b) => b.id === s.activeBoardId).root
    .children[0];
  expect(savedRoot.align).toBe("center");
  expect(savedRoot.children[0]).toMatchObject({
    dir: "down",
    color: "#ffffff",
  });
});

test("card fill is per thought, keeps white cards readable, and survives reopening", async ({
  page,
}) => {
  const parent = await create(page, "Color map", 440, 240);
  await parent.click();
  await page.keyboard.press("Tab");
  await finishText(page, "Filled child");
  const child = thought(page, "Filled child");
  expect(
    await child.evaluate((el) => getComputedStyle(el, "::before").content),
  ).toBe("none");
  await child.click({ button: "right" });
  await page.getByRole("button", { name: "White", exact: true }).click();
  await child.click({ button: "right" });
  await page.getByRole("button", { name: "Fill card", exact: true }).click();
  await expect(child).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(child.locator(".node-label")).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(parent).not.toHaveClass(/filled/);
  await saved(page);
  await page.reload();
  await menu(page, "Saved maps");
  await page.locator(".map-item").filter({ hasText: "Color map" }).click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(child).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await child.click({ button: "right" });
  await page.getByRole("button", { name: "Outline only", exact: true }).click();
  await expect(child).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.keyboard.press("Control+z");
  await expect(child).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("Delete starts focused and remembered thought confirmation can be restored in Settings", async ({
  page,
}) => {
  const first = await create(page, "First thought", 450, 250);
  const next = await create(page, "Second thought", 900, 250);
  const dialog = page.locator("#dialog");
  const remove = dialog.getByRole("button", { name: "Delete", exact: true });
  const skip = dialog.getByRole("checkbox", { name: "Don’t show again" });
  await first.click();
  await page.keyboard.press("Delete");
  await expect(remove).toBeFocused();
  await skip.check();
  await page.keyboard.press("Escape");
  await expect(first).toBeVisible();

  await first.click();
  await page.keyboard.press("Delete");
  await expect(remove).toBeFocused();
  await expect(skip).not.toBeChecked();
  await skip.check();
  await remove.press("Enter");
  await expect(first).toHaveCount(0);

  await next.click();
  await page.keyboard.press("Delete");
  await expect(next).toHaveCount(0);
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(next).toBeVisible();

  await saved(page);
  await page.reload();
  await menu(page, "Appearance");
  const setting = page.getByRole("checkbox", {
    name: "Confirm thought deletion",
  });
  await expect(setting).not.toBeChecked();
  await setting.check();
  await page.getByRole("button", { name: "Close panel" }).click();
  await menu(page, "Saved maps");
  await page.locator(".map-item").filter({ hasText: "First thought" }).click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await next.click();
  await page.keyboard.press("Delete");
  await expect(remove).toBeFocused();
});

test("only the hovered edge shows its plus and each edge creates a branch there", async ({
  page,
}) => {
  const parent = await create(page, "Directions", 720, 340);
  const plus = parent.locator(".branch-add");
  await expect(plus).toHaveCount(1);
  for (const side of ["left", "right", "up", "down"]) {
    const box = await parent.boundingBox();
    const point =
      side === "left"
        ? { x: 5, y: box.height / 2 }
        : side === "right"
          ? { x: box.width - 5, y: box.height / 2 }
          : { x: box.width / 2, y: side === "up" ? 5 : box.height - 5 };
    await parent.hover({ position: point });
    await expect(plus).toHaveAttribute("data-direction", side);
    await expect(plus).toHaveCSS("opacity", "1");
    await plus.click();
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await finishText(page, "Child " + side);
    if (side === "up") {
      const childBox = await thought(page, "Child up").boundingBox();
      expect(childBox.y + childBox.height).toBeLessThan(box.y);
    }
  }
  const s = await data(page);
  const map = s.boards.find((b) => b.id === s.activeBoardId);
  expect(map.root.children[0].children.map((n) => n.dir)).toEqual([
    "left",
    "right",
    "up",
    "down",
  ]);
});

test("dragging onto the upper plus previews above the parent and reparents the whole subtree", async ({
  page,
}) => {
  const parent = await create(page, "Top target", 480, 500);
  const source = await create(page, "Move up", 1100, 600);
  await source.click();
  await page.keyboard.press("Tab");
  await finishText(page, "Nested thought");
  const targetBox = await parent.boundingBox();
  await parent.hover({ position: { x: targetBox.width / 2, y: 5 } });
  const plus = parent.locator(".branch-add");
  await expect(plus).toHaveAttribute("data-direction", "up");
  const port = await plus.boundingBox(),
    start = await source.boundingBox();
  expect(port.y + port.height).toBeLessThan(targetBox.y);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(port.x + port.width / 2, port.y + port.height / 2, {
    steps: 15,
  });
  await expect(parent).toHaveClass(/drop-target/);
  await expect(page.locator("#dropPreview")).toHaveClass(/upward/);
  const ghost = await page.locator(".drop-ghost").boundingBox();
  expect(ghost.y + ghost.height).toBeLessThan(targetBox.y);
  await page.mouse.up();
  const savedState = await data(page);
  const root = savedState.boards.find(
    (b) => b.id === savedState.activeBoardId,
  ).root;
  expect(root.children).toHaveLength(1);
  expect(root.children[0].children[0]).toMatchObject({
    text: "Move up",
    dir: "up",
  });
  expect(root.children[0].children[0].children[0].text).toBe("Nested thought");
  await page.keyboard.press("Control+z");
  const undone = await data(page);
  expect(
    undone.boards.find((b) => b.id === undone.activeBoardId).root.children,
  ).toHaveLength(2);
});

test("attachments show filename and format below content, replace in place and delete with undo", async ({
  page,
}) => {
  const parent = await create(page, "Media root", 440, 240);
  await parent.locator(".branch-add").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "File", exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: "before.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("before"),
  });
  const before = thought(page, "before.txt");
  const file = before.getByRole("button", {
    name: "Open before.txt",
    exact: true,
  });
  await expect(file).toContainText("before.txt");
  await expect(file.locator("small")).toHaveText("TXT");
  const labelBox = await before.locator(".node-label").boundingBox();
  expect((await file.boundingBox()).y).toBeGreaterThan(
    labelBox.y + labelBox.height,
  );
  const download = page.waitForEvent("download");
  await file.click();
  expect((await download).suggestedFilename()).toBe("before.txt");
  await file.click({ button: "right" });
  const popup = page.getByRole("group", { name: "Media options" });
  await expect(popup.getByRole("textbox", { name: "Description" })).toHaveCount(
    0,
  );
  await expect(
    popup.getByRole("button", { name: "Open in folder", exact: true }),
  ).toBeDisabled();
  const replace = page.waitForEvent("filechooser");
  await popup.getByRole("button", { name: "Replace file" }).click();
  await (
    await replace
  ).setFiles({
    name: "after.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("after"),
  });
  const after = thought(page, "after.pdf");
  await expect(after.locator(".node-file small")).toHaveText("PDF");
  await expect(page.locator(".node")).toHaveCount(2);
  await after
    .getByRole("button", { name: "Open after.pdf", exact: true })
    .click({ button: "right" });
  await popup.getByRole("button", { name: "Delete attachment" }).click();
  await expect(after.locator(".node-file")).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(after.locator(".node-file")).toHaveCount(1);
  await after
    .getByRole("button", { name: "Remove after.pdf", exact: true })
    .click();
  await expect(after.locator(".node-file")).toHaveCount(0);
});

test("every panel closes on canvas and thought clicks while AI prompt survives dismissal", async ({
  page,
}) => {
  const item = await create(page, "Panel target", 700, 260);
  for (const name of [
    "Saved maps",
    "Appearance",
    "Find a thought",
    "AI assistant",
  ]) {
    await menu(page, name);
    await expect(page.locator("#panel")).toBeVisible();
    if (name === "AI assistant")
      await page.locator("#aiPrompt").fill("Keep this prompt");
    await page.mouse.click(1250, 800);
    await expect(page.locator("#panel")).toBeHidden();
  }
  await item.click();
  await menu(page, "AI assistant");
  await expect(page.locator("#aiPrompt")).toHaveValue("Keep this prompt");
  await item.click();
  await expect(page.locator("#panel")).toBeHidden();
});

test("last selected map reopens even when another map was edited more recently", async ({
  page,
}) => {
  await create(page, "First map", 450, 240);
  const first = (await data(page)).activeBoardId;
  await page.keyboard.press("Control+n");
  await create(page, "Second map", 600, 300);
  await menu(page, "Saved maps");
  await page.locator(".map-item").filter({ hasText: "First map" }).click();
  await saved(page);
  await page.reload();
  await expect(thought(page, "First map")).toBeVisible();
  await expect(thought(page, "Second map")).toHaveCount(0);
  expect((await data(page)).activeBoardId).toBe(first);
  expect((await data(page)).boards).toHaveLength(2);
});

test("AI from plus creates requested children on its original target; right-click AI edits only that box and supports undo", async ({
  page,
}) => {
  const parent = await create(page, "Original", 450, 240);
  const other = await create(page, "Other", 1050, 600);
  let edit = false,
    request;
  await page.route("https://openrouter.ai/**", (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({ json: { data: [{ id: "test-model" }] } });
    request = r.request().postDataJSON();
    return r.fulfill({
      json: {
        choices: [
          {
            message: {
              content: JSON.stringify(
                edit
                  ? {
                      text: "Rewritten",
                      children: [{ text: "Must not be added" }],
                    }
                  : {
                      text: "Branches",
                      children: Array.from({ length: 5 }, (_, i) => ({
                        text: `Idea ${i + 1}`,
                        children: [],
                      })),
                    },
              ),
            },
          },
        ],
      },
    });
  });
  await parent.locator(".branch-add").click();
  await page.getByRole("button", { name: "AI", exact: true }).click();
  await expect(page.locator("#aiDestination")).toHaveValue("branch");
  await page.locator("#aiPrompt").fill("Create exactly 5 branches");
  await page.locator("#aiModel").fill("test-model");
  await page.locator("#aiKey").fill("synthetic-key");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.locator("#aiAccept")).toBeVisible();
  expect(request.messages[1].content).toContain("Create exactly 5 branches");
  await expect(page.locator(".node")).toHaveCount(2);
  await other.click();
  await expect(page.locator("#panel")).toBeHidden();
  await menu(page, "AI assistant");
  await page.getByRole("button", { name: "Add to map", exact: true }).click();
  const state = await data(page),
    b = state.boards.find((b) => b.id === state.activeBoardId);
  expect(
    b.root.children.find((n) => n.text === "Original").children,
  ).toHaveLength(5);
  expect(b.root.children.find((n) => n.text === "Other").children).toHaveLength(
    0,
  );
  edit = true;
  await parent.click({ button: "right" });
  await page.getByRole("button", { name: "Edit with AI", exact: true }).click();
  await expect(page.locator("#aiDestination")).toHaveValue("edit");
  await page.locator("#aiPrompt").fill("Rewrite just this box");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(parent).toBeVisible();
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(thought(page, "Rewritten")).toBeVisible();
  await expect(page.locator(".node")).toHaveCount(7);
  const after = await data(page);
  expect(
    after.boards[0].root.children.find((n) => n.text === "Rewritten").children,
  ).toHaveLength(5);
  await page.keyboard.press("Control+z");
  await expect(parent).toBeVisible();
  await expect(page.locator(".node")).toHaveCount(7);
});

test("PromptPad file import loads all connections and refresh groups free and working models; Auto skips unavailable models", async ({
  page,
}) => {
  await create(page, "Import target");
  const attempted = [];
  await page.route("https://openrouter.ai/**", (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({
        json: {
          data: [
            { id: "paid-model", pricing: { prompt: "1", completion: "1" } },
            { id: "a:free" },
            { id: "b:free" },
            { id: "embedding-model" },
          ],
        },
      });
    const model = r.request().postDataJSON().model;
    attempted.push(model);
    if (model === "a:free")
      return r.fulfill({
        status: 404,
        json: { error: { message: "Unavailable" } },
      });
    return r.fulfill({
      json: {
        choices: [
          {
            message: {
              content:
                '{"text":"Root","children":[{"text":"Works","children":[]}]}',
            },
          },
        ],
      },
    });
  });
  await page.route("https://api.openai.com/**", (r) =>
    r.fulfill({ json: { data: [{ id: "openai-test" }] } }),
  );
  await menu(page, "AI assistant");
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import from PromptPad", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "promptpad-data.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        settings: {
          ai: {
            provider: "openrouter",
            model: "auto",
            openrouterKey: "router-synthetic",
            openaiKey: "openai-synthetic",
            customUrl: "http://localhost:1234/v1/chat/completions",
          },
        },
      }),
    ),
  });
  await expect(page.locator("#aiKey")).toHaveValue("router-synthetic");
  await expect(page.locator("#aiModelStatus")).toContainText("3 chat models");
  await expect(page.locator("#aiModelPicker optgroup").first()).toHaveAttribute(
    "label",
    /Free/,
  );
  await expect(
    page.locator("#aiModelPicker option[value='embedding-model']"),
  ).toHaveCount(0);
  await page.locator("#aiPrompt").fill("Explore this thought");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.locator("#aiAccept")).toBeVisible();
  expect(attempted).toEqual(["a:free", "b:free"]);
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.locator("#aiModelPicker optgroup").first()).toHaveAttribute(
    "label",
    "Free · Worked recently",
  );
  await expect(page.locator("#aiModelPicker option").nth(1)).toHaveAttribute(
    "value",
    "b:free",
  );
  await page.locator("#aiProvider").selectOption("openai");
  await expect(page.locator("#aiKey")).toHaveValue("openai-synthetic");
  await page.locator("#aiProvider").selectOption("custom");
  await expect(page.locator("#aiEndpoint")).toHaveValue(
    "http://localhost:1234/v1/chat/completions",
  );
  expect(JSON.stringify(await data(page))).not.toContain("synthetic");
  expect(
    await page.evaluate(() => localStorage.getItem("mind-cleaner-ai")),
  ).not.toContain("synthetic");
});

test("cancelling AI leaves the map unchanged and does not expose a late draft", async ({
  page,
}) => {
  const parent = await create(page, "Cancel target");
  let release;
  const response = new Promise((resolve) => (release = resolve));
  await page.route("https://openrouter.ai/**", async (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({ json: { data: [{ id: "test-model" }] } });
    await response;
    await r
      .fulfill({
        json: {
          choices: [{ message: { content: '{"text":"Late","children":[]}' } }],
        },
      })
      .catch(() => {});
  });
  await parent.click({ button: "right" });
  await page.getByRole("button", { name: "Edit with AI", exact: true }).click();
  await page.locator("#aiPrompt").fill("Edit");
  await page.locator("#aiModel").fill("test-model");
  await page.locator("#aiKey").fill("synthetic-key");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await expect(page.locator("#aiStatus")).toContainText("Generating");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  release();
  await expect(page.locator("#aiStatus")).toContainText("Generation stopped");
  await expect(page.locator("#aiAccept")).toBeHidden();
  await expect(parent).toBeVisible();
  await expect(page.locator(".node")).toHaveCount(1);
});

import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { board, layout } from "../studio/model.mjs";
const dir = resolve(`native-test-results/native-runtime-${Date.now()}`),
  exe = join(dir, "mind-cleaner.exe");
await mkdir(join(dir, "data"), { recursive: true });
await copyFile(resolve("src-tauri/target/release/mind-cleaner.exe"), exe);
const b = board("Native legacy map", true),
  legacy = JSON.stringify({
    boards: [b],
    activeBoardId: b.id,
    ai: { openaiKey: "synthetic-key-not-a-secret" },
  });
await writeFile(join(dir, "data/workspace.json"), legacy);
let child, browser;
async function launch() {
  child = spawn(exe, [], {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9224",
      WEBVIEW2_USER_DATA_FOLDER: join(dir, "webview-profile"),
    },
  });
  let connected = false;
  for (let i = 0; i < 60; i++) {
    try {
      browser = await chromium.connectOverCDP("http://127.0.0.1:9224");
      connected = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  if (!connected) throw Error("Could not attach to the native WebView.");
  let page;
  for (let i = 0; i < 40; i++) {
    page = browser.contexts().flatMap((c) => c.pages())[0];
    if (page) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!page) throw Error("Native window did not open.");
  page.on("pageerror", (e) => console.error("NATIVE PAGE ERROR:", e.message));
  await expect(page.locator("#saveState")).toHaveText("Saved locally", {
    timeout: 20000,
  });
  const dataDir = await page.evaluate(() =>
    window.__TAURI__.core
      .invoke("load_canvas_workspace")
      .then((r) => r.data_dir),
  );
  if (resolve(dataDir) !== resolve(join(dir, "data")))
    throw Error("Native test is not using isolated data.");
  return page;
}
async function close(page) {
  await page.getByRole("button", { name: "Close", exact: true }).click();
  for (let i = 0; i < 60 && child.exitCode === null; i++)
    await new Promise((r) => setTimeout(r, 100));
  if (child.exitCode === null) throw Error("Native close did not complete.");
  await browser.close().catch(() => {});
}
try {
  let page = await launch();
  await expect(page.locator(".node")).toHaveCount(layout(b).size);
  await page.getByRole("button", { name: "More tools" }).click();
  await page.getByRole("button", { name: "Saved maps", exact: true }).click();
  await page
    .locator(".map-item")
    .filter({ hasText: "Native legacy map" })
    .click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.locator(".node.root").dblclick();
  await page
    .getByRole("textbox", { name: "Branch text" })
    .fill("Native save verified");
  await page.getByRole("textbox", { name: "Branch text" }).press("Enter");
  await expect(page.locator("#saveState")).toHaveText("Saved locally");
  const saved = JSON.parse(
    await readFile(join(dir, "data/canvas-workspace.json"), "utf8"),
  );
  if (saved.boards[0].root.children[0].text !== "Native save verified")
    throw Error("Native disk save missing.");
  if (JSON.stringify(saved).includes("synthetic-key"))
    throw Error("Legacy credential was copied.");
  if ((await readFile(join(dir, "data/workspace.json"), "utf8")) !== legacy)
    throw Error("Legacy workspace changed.");
  JSON.parse(
    await readFile(join(dir, "data/canvas-workspace.backup.json"), "utf8"),
  );
  const attachment = await page.evaluate(() =>
    window.__TAURI__.core.invoke("save_dropped_file", {
      name: "native-smoke.txt",
      base64Data: btoa("native attachment test"),
      isImage: false,
      isAudio: false,
      isVideo: false,
    }),
  );
  if ((await readFile(attachment.path, "utf8")) !== "native attachment test")
    throw Error("Attachment was not saved.");
  const parent = page.locator(".node.root");
  const parentBounds = await parent.boundingBox();
  await parent.hover({ position: { x: parentBounds.width / 2, y: 3 } });
  await expect(parent.locator(".branch-add")).toHaveAttribute(
    "data-direction",
    "up",
  );
  await page.screenshot({ path: join(dir, "upper-plus.png") });
  await parent.locator(".branch-add").click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Branch text" })
    .fill("Native upper branch");
  await page.getByRole("textbox", { name: "Branch text" }).press("Enter");
  const upper = await page
    .getByRole("group", { name: "Native upper branch", exact: true })
    .boundingBox();
  if (upper.y + upper.height >= (await parent.boundingBox()).y)
    throw Error("Upper branch did not appear above its parent.");
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("group", { name: "Native upper branch", exact: true }),
  ).toHaveCount(0);
  // Text editing and branch insertion are separate undo checkpoints.
  await page.keyboard.press("Control+z");
  await expect(page.locator(".node")).toHaveCount(layout(b).size);
  await mkdir("design/quiet-build", { recursive: true });
  await page.screenshot({ path: "design/quiet-build/native-windows.png" });
  await close(page);
  page = await launch();
  await expect(page.locator(".node")).toHaveCount(layout(b).size);
  await expect(
    page.locator(".node-label").filter({ hasText: "Native save verified" }),
  ).toBeVisible();
  await close(page);
  console.log(
    "Native migration, autosave, backup, attachments, upper +, undo, reopen and close passed.",
  );
} finally {
  if (child && child.exitCode === null) child.kill();
  if (browser) await browser.close().catch(() => {});
}

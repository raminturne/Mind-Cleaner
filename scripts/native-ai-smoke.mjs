import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { blankBoard, node } from "../studio/model.mjs";
import { defaults } from "../studio/ai.mjs";

const dir = resolve(`native-test-results/native-ai-${Date.now()}`),
  exe = join(dir, "mind-cleaner.exe");
await mkdir(join(dir, "data"), { recursive: true });
await copyFile(resolve("src-tauri/target/release/mind-cleaner.exe"), exe);
const map = blankBoard("Native AI");
map.root.children.push(node("Native AI target"));
await writeFile(
  join(dir, "data/canvas-workspace.json"),
  JSON.stringify({ version: 1, boards: [map], activeBoardId: map.id }),
);
let slowClosed = false,
  serverRequests = 0,
  browser,
  child;
const server = createServer(async (req, res) => {
  if (req.url === "/slow") {
    res.on("close", () => (slowClosed = true));
    return;
  }
  serverRequests++;
  res.setHeader("Content-Type", "application/json");
  if (req.method === "GET")
    return res.end(
      JSON.stringify({
        data: [{ id: "native-test-model" }, { id: "embedding-test" }],
      }),
    );
  let raw = "";
  for await (const part of req) raw += part;
  const body = JSON.parse(raw);
  if (body.model !== "native-test-model") {
    res.statusCode = 404;
    return res.end('{"error":{"message":"Unknown model"}}');
  }
  res.end(
    JSON.stringify({
      choices: [
        { message: { content: '{"text":"Native AI result","children":[]}' } },
      ],
    }),
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function launch() {
  child = spawn(exe, [], {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9225",
      WEBVIEW2_USER_DATA_FOLDER: join(dir, "webview-profile"),
    },
  });
  for (let i = 0; i < 80; i++) {
    try {
      browser = await chromium.connectOverCDP("http://127.0.0.1:9225");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  if (!browser) throw Error("Native WebView did not start.");
  const page = browser.contexts()[0].pages()[0];
  page.on("pageerror", (error) => {
    throw error;
  });
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
  if (child.exitCode === null) throw Error("Native app did not close.");
  await browser.close().catch(() => {});
  browser = null;
}
try {
  let page = await launch();
  const settings = defaults();
  settings.provider = "custom";
  settings.connections.custom.endpoint = base + "/v1/chat/completions";
  settings.connections.custom.key = "native-synthetic-key";
  await page.evaluate(
    (settings) =>
      window.__TAURI__.core.invoke("save_ai_settings", { settings }),
    settings,
  );
  const encrypted = await readFile(join(dir, "data/ai-settings.dat"));
  if (encrypted.includes(Buffer.from("native-synthetic-key")))
    throw Error("Credentials were not encrypted.");
  await page.reload();
  await expect(page.locator("#saveState")).toHaveText("Saved locally");
  await page.locator(".node").click({ button: "right" });
  await page.getByRole("button", { name: "Edit with AI", exact: true }).click();
  await page.locator("#aiConnection summary").click();
  await expect(page.locator("#aiKey")).toHaveValue("native-synthetic-key");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator("#aiModelStatus")).toContainText("1 chat models");
  await page.locator("#aiPrompt").fill("Rewrite this box");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await page.getByRole("button", { name: "Apply edit", exact: true }).click();
  await expect(page.locator(".node-label")).toHaveText("Native AI result");
  await expect(page.locator("#saveState")).toHaveText("Saved locally");
  const disk = await readFile(join(dir, "data/canvas-workspace.json"), "utf8");
  if (disk.includes("native-synthetic-key"))
    throw Error("Credentials leaked into the map.");
  if (serverRequests < 2)
    throw Error(
      "Native HTTP model discovery/generation did not reach the fixture.",
    );
  const attachment = await page.evaluate(() =>
    window.__TAURI__.core.invoke("save_dropped_file", {
      name: "native-brief.txt",
      base64Data: btoa("native file"),
      isImage: false,
      isAudio: false,
      isVideo: false,
    }),
  );
  await page.evaluate(
    ({ attachment, id }) => {
      // Native command storage is checked above; add a reference to the isolated workspace for UI readback.
      return window.__TAURI__.core
        .invoke("load_canvas_workspace")
        .then(async ({ data }) => {
          data.boards
            .find((b) => b.id === id)
            .root.children[0].attachments.push(attachment);
          await window.__TAURI__.core.invoke("save_canvas_workspace", { data });
        });
    },
    { attachment, id: map.id },
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open native-brief.txt", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open native-brief.txt", exact: true })
    .click({ button: "right" });
  await expect(
    page.getByRole("button", { name: "Open in folder", exact: true }),
  ).toBeEnabled();
  // Request cancellation is verified without opening external file apps or Explorer.
  await page.evaluate((base) => {
    window.cancelResult = window.__TAURI__.core
      .invoke("ai_http", {
        requestId: "cancel-smoke",
        endpoint: base + "/slow",
        method: "GET",
        headers: {},
        body: null,
      })
      .catch((e) => String(e));
  }, base);
  await page.waitForTimeout(250);
  await page.evaluate(() =>
    window.__TAURI__.core.invoke("cancel_ai_request", {
      requestId: "cancel-smoke",
    }),
  );
  const result = await page.evaluate(() => window.cancelResult);
  if (!result.includes("cancelled"))
    throw Error("Native request did not cancel.");
  for (let i = 0; i < 20 && !slowClosed; i++)
    await new Promise((r) => setTimeout(r, 50));
  if (!slowClosed) throw Error("Cancelled HTTP connection remained open.");
  await page.mouse.click(1100, 700);
  await page.screenshot({ path: join(dir, "native-files.png") });
  await close(page);
  page = await launch();
  await expect(page.locator(".node-label")).toHaveText("Native AI result");
  const loaded = await page.evaluate(() =>
    window.__TAURI__.core.invoke("load_ai_settings"),
  );
  if (loaded.connections.custom.key !== "native-synthetic-key")
    throw Error("Encrypted credentials did not survive restart.");
  await close(page);
  console.log(
    "Native AI discovery, generation, encrypted credentials, cancellation, attachment menu and restart passed.",
  );
  console.log("Screenshot:", join(dir, "native-files.png"));
} finally {
  if (child && child.exitCode === null) child.kill();
  if (browser) await browser.close().catch(() => {});
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}

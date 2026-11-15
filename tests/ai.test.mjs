import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  importPromptPad,
  normalizeSettings,
  parseModels,
  sortedModels,
  modelsEndpoint,
  listModels,
  generate,
  validateEndpoint,
} from "../studio/ai.mjs";

test("PromptPad imports every provider key, selected model, custom URL and cached free models", () => {
  const value = importPromptPad({
    settings: {
      ai: {
        provider: "google",
        model: "gemini-test",
        googleKey: "google-test",
        openrouterKey: "router-test",
        openaiKey: "openai-test",
        anthropicKey: "claude-test",
        customKey: "local-test",
        customUrl: "http://localhost:1234/v1/chat/completions",
        customModels: "one, two\nthree",
        modelCache: {
          openrouter: { models: [{ id: "example/free", free: true }] },
        },
      },
    },
    notes: "do not import",
  });
  assert.equal(value.provider, "google");
  assert.equal(value.connections.google.model, "gemini-test");
  for (const id of ["google", "openrouter", "openai", "anthropic", "custom"])
    assert.ok(value.connections[id].key);
  assert.equal(value.connections.openrouter.models[0].free, true);
  assert.equal(value.connections.custom.models.length, 3);
  assert.equal(
    value.connections.custom.endpoint,
    "http://localhost:1234/v1/chat/completions",
  );
  assert.equal(value.notes, undefined);
  assert.throws(() => importPromptPad({ text: "not settings" }));
  assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(value))), value);
});

test("live models exclude non-chat entries, deduplicate and retain only evidenced free pricing", () => {
  const models = parseModels({
    data: [
      { id: "paid" },
      { id: "zero", pricing: { prompt: "0", completion: "0" } },
      { id: "unknown", pricing: { prompt: null, completion: null } },
      { id: "tagged:free" },
      { id: "embedding-one" },
      { id: "image-generator", architecture: { output_modalities: ["image"] } },
      {
        name: "models/gemini-test",
        supportedGenerationMethods: ["generateContent"],
      },
      { id: "old", supportedGenerationMethods: ["embedContent"] },
      { id: "paid" },
    ],
  });
  assert.deepEqual(
    models.filter((m) => m.free).map((m) => m.id),
    ["tagged:free", "zero"],
  );
  assert.deepEqual(
    models.filter((m) => !m.free).map((m) => m.id),
    ["gemini-test", "paid", "unknown"],
  );
  assert.deepEqual(
    sortedModels({
      models,
      health: { zero: { ok: true }, paid: { ok: false } },
    }).map((m) => m.id),
    ["zero", "tagged:free", "gemini-test", "unknown", "paid"],
  );
});

test("model endpoints work for custom chat URLs and native Google pagination", async () => {
  const cfg = defaults().connections.google;
  assert.equal(
    modelsEndpoint("google", cfg),
    "https://generativelanguage.googleapis.com/v1beta/models",
  );
  assert.equal(
    modelsEndpoint("custom", {
      endpoint: "http://localhost:1234/v1/chat/completions/",
    }),
    "http://localhost:1234/v1/models",
  );
  const calls = [];
  const models = await listModels("google", cfg, async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? { models: [{ name: "models/first" }], nextPageToken: "next" }
      : { models: [{ name: "models/second" }] };
  });
  assert.equal(models.length, 2);
  assert.match(calls[1].url, /pageToken=next/);
  for (const endpoint of [
    "http://example.com/v1",
    "file:///tmp/key",
    "https://user:pass@example.com",
  ])
    assert.throws(() => validateEndpoint(endpoint));
});

test("Auto falls back after unavailable free models and never calls a paid model with free-only enabled", async () => {
  const cfg = defaults().connections.openrouter;
  cfg.key = "synthetic-key";
  cfg.models = [
    { id: "a:free", free: true },
    { id: "b:free", free: true },
    { id: "paid", free: false },
  ];
  const calls = [],
    health = [];
  const text = await generate({
    provider: "openrouter",
    cfg,
    freeOnly: true,
    instruction: "Return JSON",
    content: "Create 3 branches",
    onHealth: (id, ok) => health.push([id, ok]),
    request: async (_, options) => {
      const body = JSON.parse(options.body);
      calls.push(body.model);
      if (body.model === "a:free")
        throw Object.assign(Error("Unavailable"), { status: 404 });
      return {
        choices: [{ message: { content: '{"text":"ok","children":[]}' } }],
      };
    },
  });
  assert.match(text, /ok/);
  assert.deepEqual(calls, ["a:free", "b:free"]);
  assert.deepEqual(health, [
    ["a:free", false],
    ["b:free", true],
  ]);
  const unavailable = [];
  await assert.rejects(
    generate({
      provider: "openrouter",
      cfg,
      freeOnly: true,
      request: async (_, options) => {
        unavailable.push(JSON.parse(options.body).model);
        throw Object.assign(Error("Busy"), { status: 429 });
      },
    }),
    /Busy/,
  );
  assert.deepEqual(unavailable, ["a:free", "b:free"]);
});

test("bad credentials and cancellation stop Auto without exhausting other models", async () => {
  const cfg = defaults().connections.openai;
  cfg.key = "synthetic-key";
  cfg.models = [{ id: "one" }, { id: "two" }];
  let calls = 0;
  await assert.rejects(
    generate({
      provider: "openai",
      cfg,
      request: async () => {
        calls++;
        throw Object.assign(Error("Invalid key"), { status: 401 });
      },
    }),
    /Invalid key/,
  );
  assert.equal(calls, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    generate({
      provider: "openai",
      cfg,
      signal: controller.signal,
      request: async () => {
        calls++;
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(calls, 1);
});

test("Google, Anthropic and keyless custom endpoints use their proper request and response shapes", async () => {
  for (const provider of ["google", "anthropic", "custom"]) {
    const cfg = defaults().connections[provider];
    cfg.model = "test-model";
    cfg.key = provider === "custom" ? "" : "synthetic-key";
    const text = await generate({
      provider,
      cfg,
      instruction: "Edit only this box",
      content: "Original",
      request: async (url, options) => {
        const body = JSON.parse(options.body);
        if (provider === "google") {
          assert.match(url, /models\/test-model:generateContent$/);
          assert.equal(options.headers["x-goog-api-key"], cfg.key);
          assert.equal(
            body.system_instruction.parts[0].text,
            "Edit only this box",
          );
          return { candidates: [{ content: { parts: [{ text: "edited" }] } }] };
        }
        if (provider === "anthropic") {
          assert.equal(body.system, "Edit only this box");
          assert.equal(options.headers["x-api-key"], cfg.key);
          return { content: [{ type: "text", text: "edited" }] };
        }
        assert.equal(options.headers.Authorization, undefined);
        return { choices: [{ message: { content: "edited" } }] };
      },
    });
    assert.equal(text, "edited");
  }
});

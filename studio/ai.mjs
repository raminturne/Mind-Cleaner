export const PROVIDERS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  google: "https://generativelanguage.googleapis.com/v1beta",
  anthropic: "https://api.anthropic.com/v1/messages",
  custom: "http://localhost:11434/v1/chat/completions",
};
const NON_CHAT =
  /embed|whisper|tts|audio|realtime|dall-e|imagen|veo|moderation|rerank|aqa|vision-only|classifier/i;
export const defaults = () => ({
  provider: "openrouter",
  freeOnly: true,
  connections: Object.fromEntries(
    Object.entries(PROVIDERS).map(([id, endpoint]) => [
      id,
      { endpoint, model: "auto", key: "", models: [], health: {} },
    ]),
  ),
});
export function normalizeSettings(value) {
  const result = defaults();
  if (!value || typeof value !== "object") return result;
  if (Object.hasOwn(PROVIDERS, value.provider))
    result.provider = value.provider;
  result.freeOnly = value.freeOnly !== false;
  for (const id of Object.keys(PROVIDERS)) {
    const source = value.connections?.[id];
    if (!source) continue;
    const cfg = result.connections[id];
    for (const key of ["endpoint", "model", "key"])
      if (typeof source[key] === "string") cfg[key] = source[key];
    cfg.models = parseModels(source.models || []);
    if (source.health && typeof source.health === "object")
      cfg.health = source.health;
  }
  return result;
}
export function importPromptPad(value) {
  const source = value?.settings?.ai || value?.ai || value;
  if (
    !source ||
    typeof source !== "object" ||
    !Object.keys(PROVIDERS).some(
      (id) => typeof source[`${id}Key`] === "string" || source.provider === id,
    )
  )
    throw Error("This file has no PromptPad AI settings.");
  const result = defaults();
  if (Object.hasOwn(PROVIDERS, source.provider))
    result.provider = source.provider;
  for (const id of Object.keys(PROVIDERS)) {
    const cfg = result.connections[id];
    cfg.key =
      typeof source[`${id}Key`] === "string" ? source[`${id}Key`].trim() : "";
    cfg.models = parseModels(source.modelCache?.[id]?.models || []);
    if (id === result.provider) cfg.model = String(source.model || "auto");
    if (id === "custom") {
      if (source.customUrl) cfg.endpoint = String(source.customUrl);
      if (!cfg.models.length)
        cfg.models = parseModels(
          String(source.customModels || "").split(/[,\n]/),
        );
    }
  }
  return result;
}
export function parseModels(data) {
  const raw = Array.isArray(data) ? data : data?.data || data?.models;
  if (!Array.isArray(raw))
    throw Error("The provider did not return a model list.");
  const seen = new Set();
  return raw
    .flatMap((m) => {
      const id = String(typeof m === "string" ? m : m?.id || m?.name || "")
        .replace(/^models\//, "")
        .trim();
      if (!id || seen.has(id) || NON_CHAT.test(id)) return [];
      if (
        m?.supportedGenerationMethods &&
        !m.supportedGenerationMethods.includes("generateContent")
      )
        return [];
      const outputs = m?.architecture?.output_modalities;
      if (Array.isArray(outputs) && !outputs.includes("text")) return [];
      seen.add(id);
      const p = m?.pricing;
      const free =
        /:free$/.test(id) ||
        m?.free === true ||
        (p?.prompt != null &&
          p?.completion != null &&
          Number(p.prompt) === 0 &&
          Number(p.completion) === 0);
      return [{ id, free }];
    })
    .sort(
      (a, b) => Number(b.free) - Number(a.free) || a.id.localeCompare(b.id),
    );
}
export function sortedModels(cfg) {
  const rank = (m) =>
    cfg.health?.[m.id]?.ok === true
      ? 0
      : cfg.health?.[m.id]?.ok === false
        ? 2
        : 1;
  return [...cfg.models].sort(
    (a, b) =>
      Number(b.free) - Number(a.free) ||
      rank(a) - rank(b) ||
      a.id.localeCompare(b.id),
  );
}
export function validateEndpoint(endpoint) {
  const url = new URL(endpoint);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      ))
  )
    throw Error("Use HTTPS, or a local HTTP endpoint.");
  return url;
}
function auth(provider, cfg) {
  if (provider === "google") return { "x-goog-api-key": cfg.key };
  if (provider === "anthropic")
    return {
      "x-api-key": cfg.key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
  return cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {};
}
export function modelsEndpoint(provider, cfg) {
  validateEndpoint(cfg.endpoint);
  const endpoint = cfg.endpoint.replace(/\/+$/, "");
  if (provider === "google")
    return (
      endpoint.replace(/\/openai(?:\/chat\/completions)?$/, "") + "/models"
    );
  if (/\/(chat\/completions|messages)$/.test(endpoint))
    return endpoint.replace(/\/(chat\/completions|messages)$/, "/models");
  return endpoint.endsWith("/models") ? endpoint : endpoint + "/models";
}
export async function listModels(provider, cfg, request, signal) {
  let endpoint = modelsEndpoint(provider, cfg),
    all = [];
  for (let page = 0; page < 20; page++) {
    const data = await request(endpoint, {
      headers: auth(provider, cfg),
      signal,
    });
    all.push(...parseModels(data));
    if (provider === "google" && data.nextPageToken) {
      const next = new URL(modelsEndpoint(provider, cfg));
      next.searchParams.set("pageToken", data.nextPageToken);
      endpoint = next.href;
    } else if (provider === "anthropic" && data.has_more && data.last_id) {
      const next = new URL(modelsEndpoint(provider, cfg));
      next.searchParams.set("after_id", data.last_id);
      endpoint = next.href;
    } else break;
  }
  const models = parseModels(all);
  if (!models.length)
    throw Error("No chat models are available at this endpoint.");
  return models;
}
export async function generate({
  provider,
  cfg,
  freeOnly,
  instruction,
  content,
  request,
  signal,
  onAttempt = () => {},
  onHealth = () => {},
}) {
  validateEndpoint(cfg.endpoint);
  if (!cfg.key.trim() && provider !== "custom")
    throw Error("Enter your API key first.");
  if (cfg.model === "auto" && !cfg.models.length)
    cfg.models = await listModels(provider, cfg, request, signal);
  let models =
    cfg.model && cfg.model !== "auto"
      ? [cfg.model]
      : sortedModels(cfg)
          .filter((m) => provider !== "openrouter" || !freeOnly || m.free)
          .map((m) => m.id);
  if (!models.length)
    throw Error("No matching models. Refresh the list or choose a model.");
  let last;
  for (const model of models.slice(0, 8)) {
    if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
    onAttempt(model);
    let endpoint = cfg.endpoint,
      body;
    if (provider === "google") {
      endpoint =
        endpoint
          .replace(/\/openai(?:\/chat\/completions)?\/?$/, "")
          .replace(/\/$/, "") +
        `/models/${encodeURIComponent(model)}:generateContent`;
      body = {
        system_instruction: { parts: [{ text: instruction }] },
        contents: [{ parts: [{ text: content }] }],
        generationConfig: { responseMimeType: "application/json" },
      };
    } else if (provider === "anthropic") {
      body = {
        model,
        max_tokens: 4096,
        system: instruction,
        messages: [{ role: "user", content }],
      };
    } else {
      body = {
        model,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content },
        ],
      };
    }
    try {
      const data = await request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth(provider, cfg) },
        body: JSON.stringify(body),
        signal,
      });
      const text =
        data.choices?.[0]?.message?.content ??
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("") ??
        data.content?.map((p) => p.text || "").join("");
      if (typeof text !== "string" || !text.trim())
        throw Error("The provider returned no text.");
      onHealth(model, true);
      return text;
    } catch (e) {
      if (e.name === "AbortError" || signal?.aborted) throw e;
      last = e;
      if ([401, 403, 402].includes(e.status)) throw e;
      onHealth(model, false);
      if (
        cfg.model !== "auto" ||
        ![400, 404, 408, 429, 500, 502, 503, 504, 529].includes(e.status)
      )
        throw e;
    }
  }
  throw last || Error("No model is available right now. Try again shortly.");
}

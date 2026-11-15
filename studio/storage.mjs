export const native = Boolean(window.__TAURI__?.core?.invoke);
export const invoke = (cmd, args = {}) =>
  window.__TAURI__.core.invoke(cmd, args);
const KEY = "mind-cleaner-canvas-v2";
export async function load() {
  if (native) return (await invoke("load_canvas_workspace")).data;
  const raw =
    localStorage.getItem(KEY) ?? localStorage.getItem("mind-cleaner-studio-v1");
  return raw ? JSON.parse(raw) : null;
}
export async function save(data) {
  if (native) await invoke("save_canvas_workspace", { data });
  else localStorage.setItem(KEY, JSON.stringify(data));
}
export async function exportText(content, name, ext) {
  if (native) {
    return ext === "json"
      ? invoke("save_project_dialog", { content, defaultName: name })
      : invoke("save_text_dialog", {
          content,
          defaultName: name,
          ext,
          label: ext.toUpperCase(),
        });
  }
  download(
    new Blob([content], {
      type: ext === "json" ? "application/json" : "text/plain",
    }),
    `${name}.${ext}`,
  );
  return true;
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function pickFile(accept = "") {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files[0] || null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
export const dataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error("Could not read file."));
    reader.readAsDataURL(file);
  });
export async function attach(file) {
  if (file.size > 25 * 1024 * 1024)
    throw Error("Use a file smaller than 25 MB for inline attachments.");
  const url = await dataUrl(file),
    image = file.type.startsWith("image/"),
    audio = file.type.startsWith("audio/"),
    video = file.type.startsWith("video/");
  if (native)
    return invoke("save_dropped_file", {
      name: file.name,
      base64Data: url,
      isImage: image,
      isAudio: audio,
      isVideo: video,
    });
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    data_url: url,
    is_image: image,
    is_audio: audio,
    is_video: video,
    ext: file.name.split(".").pop(),
  };
}
export async function openAttachment(a) {
  if (native && a.path) return invoke("open_attachment", { path: a.path });
  if (a.data_url) {
    const res = await fetch(a.data_url);
    download(await res.blob(), a.name);
  } else throw Error("This attachment is available only in the desktop app.");
}
export async function revealAttachment(a) {
  if (native && a.path) return invoke("reveal_in_explorer", { path: a.path });
  throw Error("Open in folder is available for desktop attachments.");
}
export async function loadAISettings() {
  if (native) return invoke("load_ai_settings");
  const raw = localStorage.getItem("mind-cleaner-ai");
  return raw ? JSON.parse(raw) : null;
}
export async function saveAISettings(settings) {
  if (native) return invoke("save_ai_settings", { settings });
  const safe = structuredClone(settings);
  Object.values(safe.connections).forEach((c) => {
    c.key = "";
  });
  localStorage.setItem("mind-cleaner-ai", JSON.stringify(safe));
}
export async function requestAI(endpoint, options = {}) {
  const { signal, method = "GET", headers = {}, body } = options;
  if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
  const requestId = crypto.randomUUID();
  let abortHandler, timer;
  const controller = new AbortController();
  const stopped = new Promise((_, reject) => {
    abortHandler = () => {
      controller.abort();
      if (native) invoke("cancel_ai_request", { requestId }).catch(() => {});
      reject(new DOMException("Stopped", "AbortError"));
    };
    signal?.addEventListener("abort", abortHandler, { once: true });
    timer = setTimeout(abortHandler, 40000);
  });
  try {
    const result = await Promise.race([
      native
        ? invoke("ai_http", {
            requestId,
            endpoint,
            method,
            headers,
            body: body || null,
          })
        : fetch(endpoint, {
            method,
            headers,
            body,
            signal: controller.signal,
          }).then(async (r) => ({ status: r.status, body: await r.text() })),
      stopped,
    ]);
    let data;
    try {
      data = JSON.parse(result.body);
    } catch {
      throw Error("The provider returned an invalid response.");
    }
    if (result.status >= 400 || data.error) {
      const error = Error(
        `Provider HTTP ${result.status}: ${String(data.error?.message || data.error || "Check your model, key and quota.").slice(0, 240)}`,
      );
      error.status = result.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortHandler);
  }
}

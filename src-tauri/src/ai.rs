use serde::Serialize;
use std::{collections::HashMap, fs, sync::Mutex, time::Duration};
use tauri::State;
use tokio::sync::oneshot;

#[derive(Default)]
pub struct Requests(Mutex<HashMap<String, oneshot::Sender<()>>>);

#[derive(Serialize)]
pub struct HttpResponse { status: u16, body: String }

#[tauri::command]
pub fn cancel_ai_request(request_id: String, requests: State<'_, Requests>) {
    if let Some(sender) = requests.0.lock().unwrap().remove(&request_id) { let _ = sender.send(()); }
}

#[tauri::command]
pub async fn ai_http(request_id: String, endpoint: String, method: String,
    headers: HashMap<String, String>, body: Option<String>, requests: State<'_, Requests>) -> Result<HttpResponse, String> {
    let url = reqwest::Url::parse(&endpoint).map_err(|_| "Invalid AI endpoint.")?;
    let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]" | "::1"));
    if !url.username().is_empty() || url.password().is_some() ||
        (url.scheme() != "https" && !(url.scheme() == "http" && local)) {
        return Err("Use HTTPS, or a local HTTP endpoint.".into());
    }
    let method = match method.as_str() { "GET" => reqwest::Method::GET, "POST" => reqwest::Method::POST, _ => return Err("Unsupported AI request method.".into()) };
    let client = reqwest::Client::builder().timeout(Duration::from_secs(38))
        .redirect(reqwest::redirect::Policy::none()).build().map_err(|_| "Could not initialize AI connection.")?;
    let mut req = client.request(method, url);
    for (key, value) in headers {
        if !matches!(key.to_ascii_lowercase().as_str(), "authorization" | "content-type" | "x-goog-api-key" | "x-api-key" | "anthropic-version" | "anthropic-dangerous-direct-browser-access") {
            return Err("Unsupported AI request header.".into());
        }
        req = req.header(key, value);
    }
    if let Some(body) = body {
        if body.len() > 1_000_000 { return Err("AI request is too large.".into()); }
        req = req.body(body);
    }
    let (sender, receiver) = oneshot::channel();
    requests.0.lock().unwrap().insert(request_id.clone(), sender);
    let result = tokio::select! {
        _ = receiver => Err("AI request cancelled.".into()),
        result = async {
            // Avoid returning reqwest errors: they can contain the request URL.
            let mut response = req.send().await.map_err(|_| "Could not reach the AI provider. Check your connection and endpoint.")?;
            let status = response.status().as_u16();
            if (300..400).contains(&status) { return Err("AI endpoint redirected. Enter the final endpoint URL.".into()); }
            let mut bytes = Vec::new();
            while let Some(chunk) = response.chunk().await.map_err(|_| "Could not read the AI response.")? {
                if bytes.len() + chunk.len() > 4_000_000 { return Err("AI response is too large.".into()); }
                bytes.extend_from_slice(&chunk);
            }
            let body = String::from_utf8(bytes).map_err(|_| "Invalid AI response encoding.")?;
            Ok(HttpResponse { status, body })
        } => result,
    };
    requests.0.lock().unwrap().remove(&request_id);
    result
}

#[cfg(windows)]
fn protect(bytes: &[u8], decrypt: bool) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::{Foundation::LocalFree, Security::Cryptography::{
        CryptProtectData, CryptUnprotectData, CRYPT_INTEGER_BLOB, CRYPTPROTECT_UI_FORBIDDEN,
    }};
    let input = CRYPT_INTEGER_BLOB { cbData: bytes.len() as u32, pbData: bytes.as_ptr() as *mut u8 };
    let mut output = CRYPT_INTEGER_BLOB { cbData: 0, pbData: std::ptr::null_mut() };
    unsafe {
        let ok = if decrypt {
            CryptUnprotectData(&input, std::ptr::null_mut(), std::ptr::null(), std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut output)
        } else {
            CryptProtectData(&input, std::ptr::null(), std::ptr::null(), std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut output)
        };
        if ok == 0 { return Err("Could not access encrypted AI settings for this Windows account.".into()); }
        let result = std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
        LocalFree(output.pbData as *mut _);
        Ok(result)
    }
}

#[tauri::command]
pub fn save_ai_settings(settings: serde_json::Value) -> Result<(), String> {
    let dir = super::get_app_data_dir();
    let bytes = serde_json::to_vec(&settings).map_err(|_| "Invalid AI settings.")?;
    #[cfg(windows)]
    let bytes = protect(&bytes, false)?;
    #[cfg(not(windows))]
    let bytes = {
        let mut settings = settings;
        if let Some(connections) = settings.get_mut("connections").and_then(|v| v.as_object_mut()) {
            for connection in connections.values_mut() { connection["key"] = "".into(); }
        }
        serde_json::to_vec(&settings).map_err(|_| "Invalid AI settings.")?
    };
    let temp = dir.join("ai-settings.tmp");
    fs::write(&temp, bytes).map_err(|_| "Could not save AI settings.")?;
    fs::rename(temp, dir.join("ai-settings.dat")).map_err(|_| "Could not replace AI settings.")?;
    Ok(())
}

#[tauri::command]
pub fn load_ai_settings() -> Result<Option<serde_json::Value>, String> {
    let path = super::get_app_data_dir().join("ai-settings.dat");
    if !path.exists() { return Ok(None); }
    let bytes = fs::read(path).map_err(|_| "Could not read AI settings.")?;
    #[cfg(windows)]
    let bytes = protect(&bytes, true)?;
    Ok(Some(serde_json::from_slice(&bytes).map_err(|_| "Could not decode AI settings.")?))
}

#[tauri::command]
pub async fn import_promptpad_ai(pick_file: bool) -> Result<Option<serde_json::Value>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = if pick_file {
            rfd::FileDialog::new().set_title("Import PromptPad AI settings")
                .add_filter("PromptPad data (JSON)", &["json"]).pick_file()
        } else {
            dirs::config_dir().and_then(|dir| ["promptpad", "PromptPad", "NotePrompt", "noteprompt"].iter()
                .map(|name| dir.join(name).join("promptpad-data.json")).find(|path| path.is_file()))
        };
        let Some(path) = path else { return Ok(None); };
        let raw = fs::read_to_string(path).map_err(|_| "Could not read the PromptPad data file.")?;
        let value: serde_json::Value = serde_json::from_str(&raw).map_err(|_| "The PromptPad data file is invalid JSON.")?;
        let ai = value.get("settings").and_then(|v| v.get("ai")).or_else(|| value.get("ai"))
            .ok_or("This file has no PromptPad AI settings.")?;
        // Import only AI connection fields; notes and other account data stay in PromptPad.
        let mut result = serde_json::Map::new();
        for name in ["provider", "model", "openrouterKey", "openaiKey", "googleKey", "anthropicKey", "customKey", "customUrl", "customModels", "modelCache"] {
            if let Some(value) = ai.get(name) { result.insert(name.into(), value.clone()); }
        }
        Ok(Some(serde_json::Value::Object(result)))
    }).await.map_err(|_| "Could not import PromptPad settings.")?
}

#[cfg(all(test, windows))]
mod tests {
    #[test]
    fn credentials_roundtrip_with_windows_account_encryption() {
        let original = b"synthetic-test-credential";
        let encrypted = super::protect(original, false).unwrap();
        assert_ne!(encrypted, original);
        assert_eq!(super::protect(&encrypted, true).unwrap(), original);
    }
}

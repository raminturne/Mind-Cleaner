#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::{Deserialize, Serialize};
use std::fs;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize)]
pub struct WorkspaceResponse {
    pub data: Option<serde_json::Value>,
    pub data_dir: String,
}

#[derive(Serialize, Deserialize)]
pub struct LoadedProjectFile {
    pub path: String,
    pub name: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AttachmentInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub ext: String,
    pub is_image: bool,
    #[serde(default)]
    pub is_video: bool,
    #[serde(default)]
    pub is_audio: bool,
    pub data_url: Option<String>,
}

/// Portable mode: if a `data` folder sits next to the executable it is used as-is.
/// Otherwise data lives in the per-user application data directory.
fn get_app_data_dir() -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let portable = exe_dir.join("data");
            if portable.is_dir() {
                let _ = fs::create_dir_all(portable.join("attachments"));
                return portable;
            }
        }
    }
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("MindCleaner");
    let _ = fs::create_dir_all(dir.join("attachments"));
    dir
}

fn generate_unique_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("att_{}", nanos)
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect()
}

fn mime_from_ext(ext: &str) -> &'static str {
    match ext.to_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "bmp" => "image/bmp",
        "mp4" | "m4v" => "video/mp4",
        "webm" => "video/webm",
        "ogv" => "video/ogg",
        "mov" => "video/quicktime",
        "mkv" => "video/x-matroska",
        "avi" => "video/x-msvideo",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" | "opus" => "audio/ogg",
        "m4a" | "aac" => "audio/mp4",
        "flac" => "audio/flac",
        "weba" => "audio/webm",
        "wma" => "audio/x-ms-wma",
        _ => "application/octet-stream",
    }
}

fn is_image_ext(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg" | "bmp"
    )
}

fn is_video_ext(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "mp4" | "webm" | "mkv" | "mov" | "avi" | "m4v" | "ogv"
    )
}

fn is_audio_ext(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "mp3" | "wav" | "ogg" | "m4a" | "aac" | "flac" | "opus" | "weba" | "wma"
    )
}

#[tauri::command]
fn win_minimize(window: tauri::WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn win_toggle_maximize(window: tauri::WebviewWindow) -> Result<bool, String> {
    let is_max = window.is_maximized().unwrap_or(false);
    if is_max {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn win_close(window: tauri::WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn win_set_pin(window: tauri::WebviewWindow, pinned: bool) -> Result<bool, String> {
    window.set_always_on_top(pinned).map_err(|e| e.to_string())?;
    Ok(pinned)
}

#[tauri::command]
fn win_toggle_fullscreen(window: tauri::WebviewWindow) -> Result<bool, String> {
    let is_fs = window.is_fullscreen().unwrap_or(false);
    window.set_fullscreen(!is_fs).map_err(|e| e.to_string())?;
    Ok(!is_fs)
}

#[tauri::command]
fn win_start_drag(window: tauri::WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn load_workspace() -> Result<WorkspaceResponse, String> {
    let data_dir = get_app_data_dir();
    let workspace_file = data_dir.join("workspace.json");
    let data = if workspace_file.exists() {
        let raw = fs::read_to_string(&workspace_file)
            .map_err(|e| format!("خطا در خواندن فایل فضای کاری: {}", e))?;
        match serde_json::from_str(&raw) {
            Ok(v) => Some(v),
            Err(_) => {
                // Never let a corrupt file be silently overwritten by an empty workspace.
                let ts = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let _ = fs::copy(
                    &workspace_file,
                    data_dir.join(format!("workspace.corrupt-{}.json", ts)),
                );
                None
            }
        }
    } else {
        None
    };

    Ok(WorkspaceResponse {
        data,
        data_dir: data_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn save_workspace(data: serde_json::Value) -> Result<String, String> {
    let data_dir = get_app_data_dir();
    let workspace_file = data_dir.join("workspace.json");
    let tmp_file = data_dir.join("workspace.json.tmp");
    let pretty = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Error serializing workspace: {}", e))?;
    // Write to a temp file first, then swap, so a crash can't leave a half-written workspace.
    fs::write(&tmp_file, pretty).map_err(|e| format!("Error saving workspace: {}", e))?;
    fs::rename(&tmp_file, &workspace_file).map_err(|e| format!("Error saving workspace: {}", e))?;
    Ok(workspace_file.to_string_lossy().to_string())
}

#[tauri::command]
fn load_noteprompt_ai() -> Result<Option<serde_json::Value>, String> {
    if let Some(roaming) = dirs::config_dir() {
        let pp_file = roaming.join("promptpad").join("promptpad-data.json");
        if pp_file.exists() {
            if let Ok(raw) = fs::read_to_string(&pp_file) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                    if let Some(ai) = val.get("settings").and_then(|s| s.get("ai")) {
                        return Ok(Some(ai.clone()));
                    }
                }
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn save_project_dialog(content: String, default_name: String) -> Result<Option<String>, String> {
    let safe_name = if default_name.trim().is_empty() {
        "mindmap.json".to_string()
    } else if default_name.ends_with(".json") {
        sanitize_filename(&default_name)
    } else {
        format!("{}.json", sanitize_filename(&default_name))
    };

    let file = rfd::FileDialog::new()
        .set_title("ذخیره فایل نقشه ذهنی (Save Mind Map)")
        .set_file_name(&safe_name)
        .add_filter("Mind Map JSON (*.json)", &["json"])
        .save_file();

    if let Some(path) = file {
        fs::write(&path, content).map_err(|e| format!("خطا در ذخیره فایل: {}", e))?;
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn open_project_dialog() -> Result<Option<LoadedProjectFile>, String> {
    let file = rfd::FileDialog::new()
        .set_title("باز کردن فایل نقشه ذهنی (Open Mind Map)")
        .add_filter("Mind Map JSON (*.json)", &["json"])
        .pick_file();

    if let Some(path) = file {
        let content =
            fs::read_to_string(&path).map_err(|e| format!("خطا در خواندن فایل: {}", e))?;
        let name = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "نقشه باز شده".to_string());
        Ok(Some(LoadedProjectFile {
            path: path.to_string_lossy().to_string(),
            name,
            content,
        }))
    } else {
        Ok(None)
    }
}

fn process_file_from_path(
    src_path: &Path,
    force_image: bool,
    force_video: bool,
    force_audio: bool,
) -> Result<AttachmentInfo, String> {
    let meta = fs::metadata(src_path).map_err(|e| format!("خطا در خواندن مشخصات فایل: {}", e))?;
    let size = meta.len();
    let orig_name = src_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".to_string());
    let ext = src_path
        .extension()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    let is_image = force_image || is_image_ext(&ext);
    let is_video = !is_image && (force_video || is_video_ext(&ext));
    let is_audio = !is_image && !is_video && (force_audio || is_audio_ext(&ext));
    let id = generate_unique_id();

    let attachments_dir = get_app_data_dir().join("attachments");
    let _ = fs::create_dir_all(&attachments_dir);

    let dest_filename = format!("{}_{}", id, sanitize_filename(&orig_name));
    let dest_path = attachments_dir.join(dest_filename);

    let final_path = if size <= 150 * 1024 * 1024 {
        if fs::copy(src_path, &dest_path).is_ok() {
            dest_path
        } else {
            src_path.to_path_buf()
        }
    } else {
        src_path.to_path_buf()
    };

    let data_url = if is_image && size <= 25 * 1024 * 1024 {
        let bytes = fs::read(&final_path).map_err(|e| format!("خطا در خواندن تصویر: {}", e))?;
        let mime = mime_from_ext(&ext);
        Some(format!("data:{};base64,{}", mime, BASE64.encode(&bytes)))
    } else {
        None
    };

    Ok(AttachmentInfo {
        id,
        name: orig_name,
        path: final_path.to_string_lossy().to_string(),
        size,
        ext,
        is_image,
        is_video,
        is_audio,
        data_url,
    })
}

#[tauri::command]
fn pick_image_dialog() -> Result<Option<AttachmentInfo>, String> {
    let file = rfd::FileDialog::new()
        .set_title("انتخاب تصویر برای شاخه (Select Image)")
        .add_filter(
            "تصاویر (PNG, JPG, WEBP, GIF, SVG)",
            &["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"],
        )
        .pick_file();

    if let Some(path) = file {
        let info = process_file_from_path(&path, true, false, false)?;
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn pick_video_dialog() -> Result<Option<AttachmentInfo>, String> {
    let file = rfd::FileDialog::new()
        .set_title("انتخاب ویدیو برای شاخه (Select Video)")
        .add_filter(
            "ویدیوها (MP4, WEBM, MKV, MOV, AVI)",
            &["mp4", "webm", "mkv", "mov", "avi", "m4v", "ogv"],
        )
        .pick_file();

    if let Some(path) = file {
        let info = process_file_from_path(&path, false, true, false)?;
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn pick_audio_dialog() -> Result<Option<AttachmentInfo>, String> {
    let file = rfd::FileDialog::new()
        .set_title("انتخاب ویس / فایل صوتی برای شاخه (Select Voice / Audio)")
        .add_filter(
            "فایل‌های صوتی (MP3, WAV, OGG, M4A, AAC, FLAC, OPUS)",
            &["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "weba", "wma", "webm"],
        )
        .pick_file();

    if let Some(path) = file {
        let info = process_file_from_path(&path, false, false, true)?;
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn pick_file_dialog() -> Result<Option<AttachmentInfo>, String> {
    let file = rfd::FileDialog::new()
        .set_title("انتخاب فایل ضمیمه برای شاخه (Select File)")
        .add_filter("همه فایل‌ها (*.*)", &["*"])
        .pick_file();

    if let Some(path) = file {
        let info = process_file_from_path(&path, false, false, false)?;
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn save_dropped_file(
    name: String,
    base64_data: String,
    is_image: bool,
    is_video: Option<bool>,
    is_audio: Option<bool>,
) -> Result<AttachmentInfo, String> {
    let clean_b64 = if let Some(idx) = base64_data.find(',') {
        &base64_data[idx + 1..]
    } else {
        base64_data.as_str()
    };

    let bytes = BASE64
        .decode(clean_b64)
        .map_err(|e| format!("خطا در رمزگشایی فایل: {}", e))?;
    let size = bytes.len() as u64;
    let id = generate_unique_id();

    let ext = Path::new(&name)
        .extension()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| {
            if is_image {
                "png".to_string()
            } else if is_audio.unwrap_or(false) {
                "webm".to_string()
            } else if is_video.unwrap_or(false) {
                "mp4".to_string()
            } else {
                "bin".to_string()
            }
        });

    let attachments_dir = get_app_data_dir().join("attachments");
    let _ = fs::create_dir_all(&attachments_dir);

    let safe_name = sanitize_filename(&name);
    let dest_path = attachments_dir.join(format!("{}_{}", id, safe_name));
    fs::write(&dest_path, &bytes).map_err(|e| format!("خطا در ذخیره فایل ضمیمه: {}", e))?;

    let detected_image = is_image || is_image_ext(&ext);
    let detected_video = !detected_image && (is_video.unwrap_or(false) || is_video_ext(&ext));
    let detected_audio =
        !detected_image && !detected_video && (is_audio.unwrap_or(false) || is_audio_ext(&ext));

    let data_url = if detected_image && size <= 25 * 1024 * 1024 {
        let mime = mime_from_ext(&ext);
        Some(format!("data:{};base64,{}", mime, BASE64.encode(&bytes)))
    } else {
        None
    };

    Ok(AttachmentInfo {
        id,
        name,
        path: dest_path.to_string_lossy().to_string(),
        size,
        ext,
        is_image: detected_image,
        is_video: detected_video,
        is_audio: detected_audio,
        data_url,
    })
}

#[tauri::command]
fn read_media_base64(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("فایل پیدا نشد: {}", path));
    }
    let meta = fs::metadata(p).map_err(|e| e.to_string())?;
    if meta.len() > 180 * 1024 * 1024 {
        return Err("File is larger than 180MB inline preview limit".to_string());
    }
    let ext = p
        .extension()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let mime = mime_from_ext(&ext);
    let bytes = fs::read(p).map_err(|e| e.to_string())?;
    Ok(format!("data:{};base64,{}", mime, BASE64.encode(&bytes)))
}

#[tauri::command]
fn open_attachment(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("فایل در مسیر زیر پیدا نشد:
{}", path));
    }
    #[cfg(windows)]
    let result = Command::new("rundll32")
        .arg("url.dll,FileProtocolHandler")
        .arg(&path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(&path).spawn();
    #[cfg(all(unix, not(target_os = "macos")))]
    let result = Command::new("xdg-open").arg(&path).spawn();
    result.map_err(|e| format!("خطا در باز کردن فایل: {}", e))?;
    Ok(())
}

#[tauri::command]
fn reveal_in_explorer(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    let parent = p.parent().map(|x| x.to_path_buf());
    #[cfg(windows)]
    let result = if p.exists() {
        Command::new("explorer").arg(format!("/select,{}", path)).spawn()
    } else {
        Command::new("explorer").arg(parent.unwrap_or_default()).spawn()
    };
    #[cfg(target_os = "macos")]
    let result = if p.exists() {
        Command::new("open").arg("-R").arg(&path).spawn()
    } else {
        Command::new("open").arg(parent.unwrap_or_default()).spawn()
    };
    #[cfg(all(unix, not(target_os = "macos")))]
    let result = if p.is_dir() {
        Command::new("xdg-open").arg(&path).spawn()
    } else {
        Command::new("xdg-open").arg(parent.unwrap_or_default()).spawn()
    };
    result.map_err(|e| format!("خطا در باز کردن پوشه: {}", e))?;
    Ok(())
}

#[tauri::command]
fn save_text_dialog(content: String, default_name: String, ext: String, label: String) -> Result<Option<String>, String> {
    let ext = ext.trim_start_matches('.').to_string();
    let base = if default_name.trim().is_empty() { "mindmap".to_string() } else { sanitize_filename(&default_name) };
    let name = if base.ends_with(&format!(".{}", ext)) { base } else { format!("{}.{}", base, ext) };
    let file = rfd::FileDialog::new()
        .set_file_name(&name)
        .add_filter(&label, &[ext.as_str()])
        .save_file();
    if let Some(path) = file {
        fs::write(&path, content).map_err(|e| format!("خطا در ذخیره فایل: {}", e))?;
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn export_png_dialog(base64_png: String, default_name: String) -> Result<Option<String>, String> {
    let safe_name = if default_name.trim().is_empty() {
        "mindmap.png".to_string()
    } else if default_name.ends_with(".png") {
        sanitize_filename(&default_name)
    } else {
        format!("{}.png", sanitize_filename(&default_name))
    };

    let file = rfd::FileDialog::new()
        .set_title("ذخیره تصویر نقشه ذهنی (Export PNG)")
        .set_file_name(&safe_name)
        .add_filter("PNG Image (*.png)", &["png"])
        .save_file();

    if let Some(path) = file {
        let clean_b64 = if let Some(idx) = base64_png.find(',') {
            &base64_png[idx + 1..]
        } else {
            base64_png.as_str()
        };
        let bytes = BASE64
            .decode(clean_b64)
            .map_err(|e| format!("خطا در پردازش تصویر PNG: {}", e))?;
        fs::write(&path, bytes).map_err(|e| format!("خطا در ذخیره تصویر: {}", e))?;
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            win_minimize,
            win_toggle_maximize,
            win_close,
            win_set_pin,
            win_toggle_fullscreen,
            win_start_drag,
            load_workspace,
            save_workspace,
            load_noteprompt_ai,
            save_project_dialog,
            open_project_dialog,
            pick_image_dialog,
            pick_video_dialog,
            pick_audio_dialog,
            pick_file_dialog,
            save_dropped_file,
            read_media_base64,
            open_attachment,
            reveal_in_explorer,
            export_png_dialog,
            save_text_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mind Cleaner application");
}

fn main() {
    // Windows embeds its icon in a compiled resource. Without tracking this
    // artwork Cargo can retain the previous icon after `npm run icon`.
    println!("cargo:rerun-if-changed=icons-studio/icon.ico");
    let attributes = tauri_build::Attributes::new().windows_attributes(
        tauri_build::WindowsAttributes::new().window_icon_path("icons-studio/icon.ico"),
    );
    tauri_build::try_build(attributes).expect("failed to build Mind Cleaner resources");
}

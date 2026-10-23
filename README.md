<div align="center">

<img src="src-tauri/icons/128x128.png" width="96" alt="Mind Cleaner logo" />

# Mind Cleaner

**A fast, lightweight mind-map desktop app — with AI map generation.**
Built with Rust + Tauri. Persian (RTL) & English UI.

[![Latest release](https://img.shields.io/github/v/release/raminturne/Mind-Cleaner?style=for-the-badge&color=3b82f6)](https://github.com/raminturne/Mind-Cleaner/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/raminturne/Mind-Cleaner/total?style=for-the-badge&color=10b981)](https://github.com/raminturne/Mind-Cleaner/releases)
[![Stars](https://img.shields.io/github/stars/raminturne/Mind-Cleaner?style=for-the-badge&color=f59e0b)](https://github.com/raminturne/Mind-Cleaner/stargazers)
[![License](https://img.shields.io/github/license/raminturne/Mind-Cleaner?style=for-the-badge&color=8b5cf6)](LICENSE)

![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat-square&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)

[**⬇ Download latest release**](https://github.com/raminturne/Mind-Cleaner/releases/latest)

</div>

## Features

- Infinite canvas, branches in all four directions (right / left / up / down), auto layout
- ✨ **AI mind-map generator** — OpenRouter, Google AI Studio, OpenAI, Anthropic, or any OpenAI-compatible endpoint (Ollama, LM Studio…)
- Attach images, video, voice (record in-app) and any file to a branch
- To-do checkboxes, notes, colors, folding, search, undo / redo
- Export: **PNG**, **Markdown outline**, and JSON (open / save)
- Dark & light theme, Persian (RTL) and English, focus mode, always-on-top
- Auto-save with atomic writes (a crash can't corrupt your workspace)

## Download

| OS | File |
|---|---|
| Windows | `.msi` / `-setup.exe` |
| macOS (Apple Silicon / Intel) | `.dmg` |
| Linux | `.AppImage` / `.deb` / `.rpm` |

Get them from the [Releases page](https://github.com/raminturne/Mind-Cleaner/releases/latest).

### Where is my data?

| Mode | Location |
|---|---|
| Installed (default) | Windows `%APPDATA%\MindCleaner` · macOS `~/Library/Application Support/MindCleaner` · Linux `~/.local/share/MindCleaner` |
| Portable | create a `data` folder next to the executable and it is used instead |

> API keys you enter for AI are stored **in plain text** in `workspace.json` inside that folder. Never share that file.

## Build from source

Requirements: [Rust](https://rustup.rs), Node.js 18+, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
npm install
npm run dev      # run in development
npm run build    # produce installers in src-tauri/target/release/bundle
```

## Releasing

Push a tag and GitHub Actions builds and publishes installers for Windows, macOS and Linux:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

## License

[MIT](LICENSE)

---

<div dir="rtl">

## معرفی (فارسی)

**Mind Cleaner** یک برنامه‌ی نقشه ذهنی سبک و سریع است که با Rust و Tauri ساخته شده؛ با ساخت نقشه توسط هوش مصنوعی، پیوست عکس/ویدیو/صدا، خروجی PNG و Markdown و پشتیبانی کامل از فارسی (راست‌به‌چپ).

برای دانلود به بخش [Releases](https://github.com/raminturne/Mind-Cleaner/releases/latest) بروید.

</div>

# 0.4.7 — Branches in all four directions

- Show the contextual + at the top edge as well as left, right and bottom.
- Create text, media and AI child branches upwards through the same + menu.
- Support dropping a subtree onto the upper +, with an upward preview and undo.

# 0.4.6 — AI actions and workspace continuity

- Restore the last active map on launch; dismiss all panels by clicking the canvas.
- Add child branches with AI from +; right-click to edit only the selected box. Prompts support requested branch counts, preview, cancellation and undo.
- Import all PromptPad provider connections and cached models from installed data or a chosen JSON file.
- Discover and refresh live chat models, prioritize free and recently working models, and fall back on unavailable models in Auto.
- Send native AI requests outside browser CORS; encrypt Windows connection settings separately from map data.
- Show each attachment as a filename/format row below content, with open, remove, replacement and Open in folder.
- Include the approved clear-head artwork in executable, taskbar and window icons.

# 0.4.0 — Quiet canvas

- Blank entry with saved maps available from the expanding tool island, centered left.
- Independent thoughts, direct typing, predictable downward +, and drag-to-attach previews with undo.
- Scroll-to-zoom, empty-canvas panning, hidden settings/AI, and local thought details.
- Separate canvas workspace with migration from both earlier formats and previous-save backups.
- Retains soft/angular connections, independent node shapes, files, notes, tasks and exports.

# Changelog

## 0.3.0 — Studio

Replaces the old toolbar-heavy interface with the approved Studio canvas direction. The UI is English; map content remains multilingual. A new SVG identity, softer branch palette, dark/light themes and short spring animations establish the new visual system.

Connection geometry (soft/angular) and branch corners (rounded/sharp) are independent per-map preferences. The rewrite separates document/layout/history logic, persistence and UI. It includes map/outline views, contextual details, notes, tasks, files/media, voice recording, four-direction layout, selection/reparenting, search, undo/redo, import/export and AI drafts that require explicit acceptance.

Studio saves separately from the legacy workspace, retains a previous-save backup, and exposes save failures and recovery state. AI keys remain session-only. JSON compatibility preserves existing map trees and attachment metadata.

Validation: document-model tests; browser interaction tests for editing, persistence, drag, preferences, tasks, search, files, exports, mocked AI, recovery and save failure. Native build and migration/save/reopen checks are run separately. Live AI-provider access and microphone hardware require local credentials/permission and are not covered by the automated provider mock.

The original frontend remains in `ui/` for reference. No remote release is published by local builds.

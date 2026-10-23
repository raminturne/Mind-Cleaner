(function () {
  "use strict";

  // --- Tauri IPC Helper ---
  const invoke =
    window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke
      ? window.__TAURI__.core.invoke
      : async (cmd) => {
          console.warn("Tauri invoke fallback:", cmd);
          return null;
        };

  // --- Bilingual Dictionary (Default: English, Switchable to Persian in Settings) ---
  const I18N = {
    en: {
      themeDark: "Dark",
      themeLight: "Light",
      saved: "saved ✓",
      saving: "saving...",
      aiMindMap: "AI Mind Map",
      newMap: "new map",
      aiRail: "ai mind map",
      autoLayout: "auto layout",
      openFile: "open file",
      saveFile: "save json",
      exportPng: "export png",
      exportMd: "export markdown",
      shortcuts: "shortcuts",
      mapsGroup: "MIND MAPS",
      searchPlaceholder: "Search branches...",
      dropHint: "Drop on any + side (← → ↑ ↓) to move or attach there!",
      zenExit: "Focus Mode · Press Esc to exit",
      actAi: "AI Map",
      actChild: "Sub-branch",
      actSibling: "Sibling",
      actTodo: "Todo",
      actNote: "Note",
      actAlignAuto: "Auto",
      actAlignRight: "Right",
      actAlignCenter: "Center",
      actAlignLeft: "Left",
      actImage: "Image",
      actVideo: "Video",
      actVoice: "Voice",
      actFile: "File",
      actColor: "Color",
      actCollapse: "Fold",
      actDelete: "Delete",
      addTypeText: "Text",
      addTypeImage: "Image",
      addTypeVideo: "Video",
      addTypeVoice: "Voice",
      addTypeFile: "File",
      uploadImageTitle: "Upload Image",
      uploadImageHint: "Click or drop image here",
      uploadVideoTitle: "Upload Video",
      uploadVideoHint: "Click or drop video here",
      uploadVoiceTitle: "Upload or Record Voice",
      uploadVoiceHint: "Choose audio file or record",
      btnPickAudio: "Choose Audio",
      btnRecordVoice: "Record Voice",
      btnStopRecord: "Stop",
      uploadFileTitle: "Upload File",
      uploadFileHint: "Click or drop file here",
      aiWritePlaceholder: "Write prompt for AI text or sub-branches...",
      aiWriteTextBtn: "Write Text",
      aiWriteSubBtn: "Sub-branches",
      aiWritingText: "Writing with AI...",
      toastAiTextDone: "AI text written inside box!",
      multiSelected: "selected",
      branchColor: "Branch Color",
      layoutMode: "Default Branch Direction",
      layoutBalanced: "↔ Balanced",
      layoutRight: "→ Right",
      layoutLeft: "← Left",
      layoutDown: "↓ Down",
      layoutBalancedLong: "↔ Balanced (Left & Right)",
      layoutRightLong: "→ Right Only",
      layoutLeftLong: "← Left Only",
      layoutDownLong: "↓ Downward (Tree)",
      settingsTitle: "settings",
      setLanguage: "LANGUAGE / زبان",
      rtlMirrorTitle: "Mirror layout (RTL)",
      rtlMirrorHint: "Moves the sidebar to the right and flips the whole layout",
      setTheme: "THEME",
      setThemeDark: "⬛ Dark (Black)",
      setThemeLight: "⬜ Light (White)",
      setLayout: "DEFAULT LAYOUT",
      setAiHeader: "AI CONNECTION (NOTEPROMPT LINK)",
      syncNotePrompt: "🔗 Sync from NotePrompt",
      aiProvider: "Provider",
      aiModel: "Model",
      aiKey: "API Key",
      aiHint: "Keys are stored locally. Click 'Sync from NotePrompt' to import your existing NotePrompt AI key.",
      aiModalTitle: "✨ AI Mind Map Generator",
      aiPromptLabel: "WHAT SHOULD WE MAP OUT?",
      aiPromptPlaceholder: "Enter any topic, idea, project plan, or paste notes... (English or Persian)",
      aiTargetLabel: "TARGET",
      aiTargetNew: "Create New Mind Map",
      aiTargetExpand: "Expand Selected Branch",
      aiCancel: "Cancel",
      aiGenerateBtn: "Generate Mind Map",
      aiGenerating: "Generating Mind Map...",
      helpTitle: "Shortcuts & Quick Guide",
      openInOs: "Open in Windows",
      showInFolder: "Show in Folder",
      defaultBoardTitle: "Main Mind Map",
      newBoardPrefix: "Mind Map",
      newBranchText: "New Branch",
      newSiblingText: "Sibling Branch",
      notePlaceholder: "Write a note for this branch...",
      toastPinned: "Window pinned on top",
      toastUnpinned: "Window unpinned",
      toastAutoArranged: "Branches auto-arranged cleanly",
      toastRootCannotDelete: "Root node cannot be deleted",
      toastMinOneBoard: "At least one mind map must remain",
      toastImageAdded: "Image attached",
      toastVideoAdded: "Video attached",
      toastVoiceAdded: "Voice attached",
      toastFileAdded: "File attached",
      toastMovedDir: "Branch moved",
      toastSyncedAi: "AI settings synced from NotePrompt!",
      toastNoNotePromptAi: "No saved AI key found in NotePrompt",
      toastAiSuccess: "AI Mind Map generated!",
      ctxAddRight: "Add Branch Right (→)",
      ctxAddLeft: "Add Branch Left (←)",
      ctxAddDown: "Add Branch Down (↓)",
      ctxAddUp: "Add Branch Up (↑)",
      ctxEdit: "Edit Text (F2)",
      ctxNote: "Add / Edit Note",
      ctxTodo: "Toggle Todo Checkbox",
      ctxAlignAuto: "Text Align: Auto (RTL/LTR)",
      ctxAlignRight: "Text Align: Right (RTL)",
      ctxAlignCenter: "Text Align: Center",
      ctxAlignLeft: "Text Align: Left (LTR)",
      ctxImage: "Attach Image...",
      ctxVideo: "Attach Video...",
      ctxVoice: "Attach / Record Voice...",
      ctxFile: "Attach File...",
      ctxResetPos: "Reset Manual Offset",
      ctxDelete: "Delete Branch",
      ctxRenameMap: "Rename Map",
      ctxDuplicateMap: "Duplicate Map",
      ctxDeleteMap: "Delete Map",
      helpRows: [
        ["Add Text / Image / Video / Voice / File", "Click + on Right, Left, Top, or Bottom"],
        ["Create sub-branch while typing", "Press Enter inside box"],
        ["Multi-select branches", "Ctrl+Click, Shift+Drag, or ⬚ tool"],
        ["Move branch to Left / Right / Up / Down", "Drag node & drop onto any + handle"],
        ["Generate text inside box with AI", "Click ✨ icon on selected box"],
        ["Generate full Mind Map with AI", "Ctrl + G"],
        ["Edit branch text", "Double-click or F2"],
        ["Fold / Unfold sub-branches", "Space"],
        ["Delete selected branches", "Delete / Backspace"],
        ["Undo / Redo", "Ctrl + Z / Ctrl + Y"]
      ]
    },
    fa: {
      themeDark: "مشکی (Dark)",
      themeLight: "سفید (Light)",
      saved: "ذخیره شد ✓",
      saving: "در حال ذخیره...",
      aiMindMap: "نقشه با هوش مصنوعی",
      newMap: "نقشه جدید",
      aiRail: "هوش مصنوعی (AI)",
      autoLayout: "مرتب‌سازی خودکار",
      openFile: "باز کردن فایل",
      saveFile: "ذخیره فایل JSON",
      exportPng: "خروجی عکس PNG",
      exportMd: "خروجی Markdown",
      shortcuts: "راهنما و میانبرها",
      mapsGroup: "نقشه‌های ذهنی",
      searchPlaceholder: "جستجو در شاخه‌ها...",
      dropHint: "روی هر علامت + (چپ، راست، بالا، پایین) رها کنید تا به همان جهت منتقل شود!",
      zenExit: "حالت تمرکز · کلید Esc برای خروج",
      actAi: "هوش مصنوعی",
      actChild: "زیرشاخه",
      actSibling: "هم‌سطح",
      actTodo: "چک‌لیست",
      actNote: "یادداشت",
      actAlignAuto: "خودکار",
      actAlignRight: "راست‌چین",
      actAlignCenter: "وسط‌چین",
      actAlignLeft: "چپ‌چین",
      actImage: "عکس",
      actVideo: "ویدیو",
      actVoice: "ویس",
      actFile: "فایل",
      actColor: "رنگ",
      actCollapse: "جمع/باز",
      actDelete: "حذف",
      addTypeText: "متن",
      addTypeImage: "عکس",
      addTypeVideo: "ویدیو",
      addTypeVoice: "ویس",
      addTypeFile: "فایل",
      uploadImageTitle: "آپلود عکس",
      uploadImageHint: "کلیک کنید یا عکس را بکشید",
      uploadVideoTitle: "آپلود ویدیو",
      uploadVideoHint: "کلیک کنید یا ویدیو را بکشید",
      uploadVoiceTitle: "آپلود یا ضبط ویس",
      uploadVoiceHint: "انتخاب فایل صوتی یا ضبط صدا",
      btnPickAudio: "انتخاب فایل",
      btnRecordVoice: "ضبط ویس",
      btnStopRecord: "توقف ضبط",
      uploadFileTitle: "آپلود فایل",
      uploadFileHint: "کلیک کنید یا فایل را بکشید",
      aiWritePlaceholder: "پرامپت تولید متن یا زیرشاخه با هوش مصنوعی...",
      aiWriteTextBtn: "تولید متن",
      aiWriteSubBtn: "زیرشاخه",
      aiWritingText: "در حال نوشتن با AI...",
      toastAiTextDone: "متن با هوش مصنوعی داخل باکس نوشته شد!",
      multiSelected: "شاخه انتخاب شده",
      branchColor: "رنگ شاخه",
      layoutMode: "جهت پیش‌فرض شاخه‌ها",
      layoutBalanced: "↔ دوطرفه",
      layoutRight: "→ راست",
      layoutLeft: "← چپ",
      layoutDown: "↓ پایین",
      layoutBalancedLong: "↔ دوطرفه (چپ و راست)",
      layoutRightLong: "→ شاخه‌ها به راست",
      layoutLeftLong: "← شاخه‌ها به چپ",
      layoutDownLong: "↓ درختی رو به پایین",
      settingsTitle: "تنظیمات (Settings)",
      setLanguage: "LANGUAGE / زبان برنامه",
      rtlMirrorTitle: "چینش راست‌به‌چپ کل برنامه (RTL)",
      rtlMirrorHint: "انتقال نوار کناری به سمت راست و راست‌چین شدن محیط برنامه",
      setTheme: "تم برنامه (فقط سفید و مشکی)",
      setThemeDark: "⬛ مشکی (Dark)",
      setThemeLight: "⬜ سفید (Light)",
      setLayout: "جهت پیش‌فرض نقشه",
      setAiHeader: "اتصال هوش مصنوعی (مشابه NotePrompt)",
      syncNotePrompt: "🔗 دریافت کلید از NotePrompt",
      aiProvider: "سرویس AI",
      aiModel: "مدل",
      aiKey: "کلید API",
      aiHint: "کلیدها روی سیستم شما ذخیره می‌شوند. اگر در NotePrompt کلید دارید روی دکمه بالا بزنید تا خودکار لینک شود.",
      aiModalTitle: "✨ ساخت نقشه ذهنی با هوش مصنوعی",
      aiPromptLabel: "موضوع یا پرامپت خود را بنویسید:",
      aiPromptPlaceholder: "مثلاً: برنامه یادگیری Rust از صفر تا صد، یا ایده راه‌اندازی استارتاپ...",
      aiTargetLabel: "محل ساخت شاخه‌ها",
      aiTargetNew: "در یک نقشه ذهنی جدید",
      aiTargetExpand: "زیرمجموعه شاخه انتخاب‌شده فعلی",
      aiCancel: "انصراف",
      aiGenerateBtn: "ساخت نقشه ذهنی",
      aiGenerating: "در حال ساخت نقشه ذهنی با AI...",
      helpTitle: "راهنمای استفاده سریع و میانبرها",
      openInOs: "باز کردن در ویندوز",
      showInFolder: "نمایش در پوشه",
      defaultBoardTitle: "نقشه ذهنی اصلی",
      newBoardPrefix: "نقشه ذهنی",
      newBranchText: "شاخه جدید",
      newSiblingText: "شاخه هم‌سطح",
      notePlaceholder: "یادداشت یا توضیحات این شاخه را بنویسید...",
      toastPinned: "پنجره روی همه برنامه‌ها سنجاق شد",
      toastUnpinned: "سنجاق پنجره برداشته شد",
      toastAutoArranged: "چیدمان شاخه‌ها مرتب شد",
      toastRootCannotDelete: "شاخه اصلی (ریشه) قابل حذف نیست",
      toastMinOneBoard: "حداقل یک نقشه ذهنی باید باقی بماند",
      toastImageAdded: "تصویر اضافه شد",
      toastVideoAdded: "ویدیو اضافه شد",
      toastVoiceAdded: "ویس اضافه شد",
      toastFileAdded: "فایل اضافه شد",
      toastMovedDir: "شاخه جابجا شد",
      toastSyncedAi: "تنظیمات هوش مصنوعی از NotePrompt لینک شد!",
      toastNoNotePromptAi: "کلید ذخیره‌شده‌ای در NotePrompt پیدا نشد",
      toastAiSuccess: "نقشه ذهنی با موفقیت توسط AI ساخته شد!",
      ctxAddRight: "افزودن شاخه به راست (→)",
      ctxAddLeft: "افزودن شاخه به چپ (←)",
      ctxAddDown: "افزودن شاخه به پایین (↓)",
      ctxAddUp: "افزودن شاخه به بالا (↑)",
      ctxEdit: "ویرایش متن (F2)",
      ctxNote: "افزودن / ویرایش یادداشت",
      ctxTodo: "تیک انجام کار (Todo)",
      ctxAlignAuto: "تراز متن: خودکار (فارسی راست / انگلیسی چپ)",
      ctxAlignRight: "تراز متن: راست‌چین (RTL)",
      ctxAlignCenter: "تراز متن: وسط‌چین",
      ctxAlignLeft: "تراز متن: چپ‌چین (LTR)",
      ctxImage: "افزودن عکس...",
      ctxVideo: "افزودن ویدیو...",
      ctxVoice: "افزودن / ضبط ویس...",
      ctxFile: "افزودن فایل...",
      ctxResetPos: "بازنشانی موقعیت دستی",
      ctxDelete: "حذف شاخه",
      ctxRenameMap: "تغییر نام نقشه",
      ctxDuplicateMap: "کپی از نقشه",
      ctxDeleteMap: "حذف نقشه",
      helpRows: [
        ["افزودن باکس متن / عکس / ویدیو / ویس / فایل", "کلیک روی دکمه + در هر سمت باکس"],
        ["ساخت سریع زیرشاخه هنگام تایپ", "زدن کلید Enter داخل باکس"],
        ["انتخاب چندتایی (Multi-select)", "Ctrl+Click یا Shift+Drag یا ابزار ⬚"],
        ["انتقال شاخه به چپ یا راست باکس دیگر", "کشیدن شاخه (Drag) و رها کردن روی + سمت دلخواه"],
        ["تولید متن داخل باکس با هوش مصنوعی", "کلیک روی آیکون ✨ بالای باکس"],
        ["ساخت کل نقشه ذهنی با هوش مصنوعی", "Ctrl + G"],
        ["ویرایش متن شاخه", "دابل‌کلیک یا F2"],
        ["جمع و باز کردن زیرشاخه‌ها", "Space"],
        ["حذف شاخه‌های انتخاب‌شده", "Delete"],
        ["بازگشت به عقب / جلو", "Ctrl + Z / Ctrl + Y"]
      ]
    }
  };

  const BRANCH_COLORS = [
    "#71717a",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#ef4444",
    "#84cc16",
    "#6366f1"
  ];

  // --- NotePrompt Compatible AI Providers ---
  const AI_PROVIDERS = {
    openrouter: {
      family: "openai",
      url: "https://openrouter.ai/api/v1/chat/completions",
      modelsUrl: "https://openrouter.ai/api/v1/models",
      keyField: "openrouterKey",
      placeholder: "OpenRouter API key (sk-or-v1-...)",
      models: [
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "openai/gpt-4o-mini"
      ],
      headers: {
        "HTTP-Referer": "https://github.com/raminturne/promptpad",
        "X-Title": "MindCleaner"
      }
    },
    google: {
      family: "openai",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      modelsUrl: "https://generativelanguage.googleapis.com/v1beta/openai/models",
      keyField: "googleKey",
      placeholder: "Google AI Studio key (AIza...)",
      models: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest"],
      headers: {}
    },
    openai: {
      family: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      modelsUrl: "https://api.openai.com/v1/models",
      keyField: "openaiKey",
      placeholder: "OpenAI API key (sk-...)",
      models: ["gpt-4o-mini", "gpt-4o"],
      headers: {}
    },
    anthropic: {
      family: "anthropic",
      url: "https://api.anthropic.com/v1/messages",
      modelsUrl: "https://api.anthropic.com/v1/models",
      keyField: "anthropicKey",
      placeholder: "Anthropic API key (sk-ant-...)",
      models: ["claude-haiku-4-5", "claude-sonnet-4-5"],
      headers: {
        "anthropic-dangerous-direct-browser-access": "true"
      }
    },
    custom: {
      family: "openai",
      url: "",
      modelsUrl: "",
      keyField: "customKey",
      placeholder: "Optional API key (leave blank for local Ollama)",
      models: [],
      headers: {}
    }
  };

  // --- Application State ---
  let state = {
    lang: "en",
    rtlMirror: false, // Mirror the whole layout (sidebar on right) when lang === 'fa', matching NotePrompt
    theme: "dark", // only 'dark' or 'light'
    railWidth: 184,
    railHidden: false,
    railToolsClosed: false,
    zenMode: false,
    pinned: false,
    activeBoardId: null,
    boards: [],
    ai: {
      provider: "openrouter",
      model: "auto",
      openrouterKey: "",
      googleKey: "",
      openaiKey: "",
      anthropicKey: "",
      customKey: "",
      customUrl: "http://localhost:11434/v1/chat/completions",
      customModels: "llama3.2",
      modelCache: {}
    }
  };

  let selectedNodeId = null;
  let selectedNodeIds = new Set();
  let editingNodeId = null;
  let editingNoteNodeId = null;
  let aiInlineNodeId = null;
  let renamingBoardId = null;
  let aiTargetMode = "new"; // 'new' | 'expand'
  let isSelectBoxMode = false;
  let marqueeState = null; // { startClientX, startClientY, additive }
  let pendingAddBranch = null; // { parentId, dir, mode: 'child' | 'sibling' }

  // Canvas Pan & Zoom
  let panX = 0;
  let panY = 0;
  let zoom = 1;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let canvasDownX = 0;
  let canvasDownY = 0;

  // Node Dragging & Drop Target State
  let dragNodeState = null;
  let activeDropTarget = null; // { nodeId, dir: 'left'|'right'|'down'|'up'|'body', el }

  // Undo / Redo Stacks per Board
  const historyMap = new Map();
  let saveTimer = null;

  // Search State
  let searchMatches = [];
  let searchIdx = -1;

  // Lightbox current attachment & Media Blob URL cache
  let currentLightboxAtt = null;
  const mediaBlobUrlCache = new Map();
  let activeVoiceRecorder = null; // { nodeId, recorder, stream, timerId, seconds }

  // Computed Layout Positions Cache: nodeId -> { x, y, w, h, side }
  let layoutPositions = new Map();
  let currentDomMap = new Map();
  let currentSizeMap = new Map();

  // --- DOM Elements ---
  const appRoot = document.getElementById("appRoot");
  const titlebar = document.getElementById("titlebar");
  const themeChip = document.getElementById("themeChip");
  const themeAvatar = document.getElementById("themeAvatar");
  const themeChipName = document.getElementById("themeChipName");
  const layoutChip = document.getElementById("layoutChip");
  const layoutChipName = document.getElementById("layoutChipName");
  const aiTopChip = document.getElementById("aiTopChip");
  const aiTopChipLabel = document.getElementById("aiTopChipLabel");
  const autosaveBadge = document.getElementById("autosaveBadge");

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const railToggleBtn = document.getElementById("railToggleBtn");
  const zenBtn = document.getElementById("zenBtn");
  const searchBtn = document.getElementById("searchBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const pinBtn = document.getElementById("pinBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const minBtn = document.getElementById("minBtn");
  const maxBtn = document.getElementById("maxBtn");
  const closeBtn = document.getElementById("closeBtn");

  const railEl = document.getElementById("rail");
  const addBoardBtn = document.getElementById("addBoardBtn");
  const btnAiPrompt = document.getElementById("btnAiPrompt");
  const btnAutoArrange = document.getElementById("btnAutoArrange");
  const btnOpenFile = document.getElementById("btnOpenFile");
  const btnSaveFile = document.getElementById("btnSaveFile");
  const btnExportPng = document.getElementById("btnExportPng");
  const btnHelpModal = document.getElementById("btnHelpModal");
  const railFold = document.getElementById("railFold");
  const tabList = document.getElementById("tabList");
  const railResizer = document.getElementById("railResizer");

  const findBar = document.getElementById("findBar");
  const findInput = document.getElementById("findInput");
  const findPrev = document.getElementById("findPrev");
  const findNext = document.getElementById("findNext");
  const findCount = document.getElementById("findCount");
  const findClose = document.getElementById("findClose");

  const canvasViewport = document.getElementById("canvasViewport");
  const canvasGrid = document.getElementById("canvasGrid");
  const canvasWorld = document.getElementById("canvasWorld");
  const connectionsSvg = document.getElementById("connectionsSvg");
  const nodesLayer = document.getElementById("nodesLayer");
  const selectionMarquee = document.getElementById("selectionMarquee");
  const canvasDropHint = document.getElementById("canvasDropHint");

  const selectModeBtn = document.getElementById("selectModeBtn");
  const tidyCanvasBtn = document.getElementById("tidyCanvasBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomLabel = document.getElementById("zoomLabel");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomFitBtn = document.getElementById("zoomFitBtn");
  const expandAllBtn = document.getElementById("expandAllBtn");

  const statNodes = document.getElementById("statNodes");
  const statTasks = document.getElementById("statTasks");
  const statDirection = document.getElementById("statDirection");

  const actAiGenerate = document.getElementById("actAiGenerate");
  const actAddChild = document.getElementById("actAddChild");
  const actAddSibling = document.getElementById("actAddSibling");
  const actTodo = document.getElementById("actTodo");
  const actNote = document.getElementById("actNote");
  const actAlign = document.getElementById("actAlign");
  const alignIconMid = document.getElementById("alignIconMid");
  const lblActAlign = document.getElementById("lblActAlign");
  const actImage = document.getElementById("actImage");
  const actVideo = document.getElementById("actVideo");
  const actVoice = document.getElementById("actVoice");
  const actFile = document.getElementById("actFile");
  const actColor = document.getElementById("actColor");
  const actColorDot = document.getElementById("actColorDot");
  const actCollapse = document.getElementById("actCollapse");
  const actDelete = document.getElementById("actDelete");

  const addTypePopover = document.getElementById("addTypePopover");
  const btnAddTypeText = document.getElementById("btnAddTypeText");
  const btnAddTypeImage = document.getElementById("btnAddTypeImage");
  const btnAddTypeVideo = document.getElementById("btnAddTypeVideo");
  const btnAddTypeVoice = document.getElementById("btnAddTypeVoice");
  const btnAddTypeFile = document.getElementById("btnAddTypeFile");
  const lblAddTypeText = document.getElementById("lblAddTypeText");
  const lblAddTypeImage = document.getElementById("lblAddTypeImage");
  const lblAddTypeVideo = document.getElementById("lblAddTypeVideo");
  const lblAddTypeVoice = document.getElementById("lblAddTypeVoice");
  const lblAddTypeFile = document.getElementById("lblAddTypeFile");

  const colorPopover = document.getElementById("colorPopover");
  const colorGrid = document.getElementById("colorGrid");
  const layoutPopover = document.getElementById("layoutPopover");
  const contextMenu = document.getElementById("contextMenu");

  // AI Modal Elements
  const aiModal = document.getElementById("aiModal");
  const aiOpenSettingsBtn = document.getElementById("aiOpenSettingsBtn");
  const aiModalCloseBtn = document.getElementById("aiModalCloseBtn");
  const aiPromptTextarea = document.getElementById("aiPromptTextarea");
  const aiTargetSeg = document.getElementById("aiTargetSeg");
  const aiModalStatus = document.getElementById("aiModalStatus");
  const aiCancelBtn = document.getElementById("aiCancelBtn");
  const aiGenerateSubmitBtn = document.getElementById("aiGenerateSubmitBtn");

  // Settings Modal Elements
  const settingsModal = document.getElementById("settingsModal");
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  const settingsLangSeg = document.getElementById("settingsLangSeg");
  const rtlMirrorRow = document.getElementById("rtlMirrorRow");
  const toggleRtlMirror = document.getElementById("toggleRtlMirror");
  const lblRtlMirrorTitle = document.getElementById("lblRtlMirrorTitle");
  const lblRtlMirrorHint = document.getElementById("lblRtlMirrorHint");
  const settingsThemeSeg = document.getElementById("settingsThemeSeg");
  const settingsLayoutSeg = document.getElementById("settingsLayoutSeg");
  const btnSyncNotePromptAi = document.getElementById("btnSyncNotePromptAi");
  const aiProviderSelect = document.getElementById("aiProviderSelect");
  const aiModelSelect = document.getElementById("aiModelSelect");
  const aiModelRefreshBtn = document.getElementById("aiModelRefreshBtn");
  const aiApiKeyInput = document.getElementById("aiApiKeyInput");
  const aiCustomRows = document.getElementById("aiCustomRows");
  const aiCustomUrlInput = document.getElementById("aiCustomUrlInput");
  const aiCustomModelsInput = document.getElementById("aiCustomModelsInput");

  // Lightbox & Help Modal
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxOpenOs = document.getElementById("lightboxOpenOs");
  const lightboxReveal = document.getElementById("lightboxReveal");
  const lightboxClose = document.getElementById("lightboxClose");

  const helpModal = document.getElementById("helpModal");
  const helpCloseBtn = document.getElementById("helpCloseBtn");
  const helpListBody = document.getElementById("helpListBody");
  const zenExitHint = document.getElementById("zenExitHint");
  const toastContainer = document.getElementById("toastContainer");

  // ---------- RTL / LTR & Per-Line Direction Engine (Ported from NotePrompt) ----------
  // Any Hebrew/Arabic/Persian character → treat as RTL
  const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  // Strong left-to-right letters. Digits, punctuation and spaces are NOT in here
  // on purpose: a line that holds only "1." or "—" has no direction of its own,
  // and forcing it to ltr is what throws the caret to the left edge in the middle
  // of a Persian note.
  const LTR_STRONG_RE = /[A-Za-z\u00C0-\u02AF\u0370-\u04FF\u1E00-\u1FFF\u2C60-\u2C7F\uA720-\uA7FF]/;

  // Leading block markers: "# ", "1. ", "- ", "> ". On an RTL line these are
  // ASCII runs at the logical start, and the bidi algorithm reorders them into
  // the middle of the text ("1." rendering as ".1"). Isolating pins them to the right start.
  const MD_BLOCKMARK_RE = /^(\s*)(#{1,6} |[0-9۰-۹٠-٩]+[.)] |[-*+] |> )/;

  const EDITOR_ALIGNS = ["auto", "right", "center", "left"];
  const ALIGN_ICON_MID = {
    auto: [4, 20],
    left: [4, 15],
    center: [7, 17],
    right: [9, 20]
  };

  function uiDefaultDir() {
    return state && state.lang === "fa" ? "rtl" : "ltr";
  }

  function detectDir(text) {
    const s = text || "";
    if (RTL_RE.test(s)) return "rtl";
    if (LTR_STRONG_RE.test(s)) return "ltr";
    return uiDefaultDir();
  }

  function lineDirFor(text, fallback) {
    const s = text || "";
    if (RTL_RE.test(s)) return "rtl";
    if (LTR_STRONG_RE.test(s)) return "ltr";
    return fallback === "rtl" ? "rtl" : "ltr";
  }

  function lineAlignFor(dir, mode) {
    const m = mode && EDITOR_ALIGNS.includes(mode) ? mode : "auto";
    if (m === "auto") return dir === "rtl" ? "right" : "left";
    return m;
  }

  function resolveBlockDir(rawText, nodeAlign) {
    if (nodeAlign === "right") return "rtl";
    if (nodeAlign === "left") return "ltr";
    const lines = String(rawText || "").split("\n");
    for (const ln of lines) {
      if (RTL_RE.test(ln)) return "rtl";
      if (LTR_STRONG_RE.test(ln)) return "ltr";
    }
    return uiDefaultDir();
  }

  function renderMultilineLines(containerEl, rawText, nodeAlign) {
    containerEl.innerHTML = "";
    const text = String(rawText || "");
    const lines = text.split("\n");
    const forcedDir =
      nodeAlign === "right" ? "rtl" : nodeAlign === "left" ? "ltr" : null;

    let carry = forcedDir;
    if (!carry) {
      for (const ln of lines) {
        if (RTL_RE.test(ln)) {
          carry = "rtl";
          break;
        }
        if (LTR_STRONG_RE.test(ln)) {
          carry = "ltr";
          break;
        }
      }
      if (!carry) carry = uiDefaultDir();
    }

    const blockDir = forcedDir || carry;
    containerEl.setAttribute("dir", blockDir);
    containerEl.style.direction = blockDir;

    lines.forEach((lineText) => {
      const d = document.createElement("div");
      d.className = "ln";
      const want = forcedDir || (carry = lineDirFor(lineText, carry));
      d.setAttribute("dir", want);
      d.style.direction = want;
      d.style.textAlign = lineAlignFor(want, nodeAlign);

      if (lineText === "") {
        d.appendChild(document.createElement("br"));
      } else {
        const blockM = want === "rtl" ? lineText.match(MD_BLOCKMARK_RE) : null;
        if (blockM) {
          const leadLen = blockM[0].length;
          const span = document.createElement("span");
          span.className = "md-blockmark";
          span.textContent = lineText.slice(0, leadLen);
          d.appendChild(span);
          d.appendChild(document.createTextNode(lineText.slice(leadLen)));
        } else {
          d.textContent = lineText;
        }
      }
      containerEl.appendChild(d);
    });
  }

  // Per-keystroke RTL/LTR for inputs and textareas (NotePrompt style: mutates both dir attribute and inline style)
  function applyLiveInputDir(inputEl, nodeAlign, headerEl) {
    if (!inputEl) return;
    const val = inputEl.value || "";
    const dir = resolveBlockDir(val, nodeAlign);
    const align = lineAlignFor(dir, nodeAlign);
    inputEl.setAttribute("dir", dir);
    inputEl.style.direction = dir;
    inputEl.style.textAlign = align;
    if (headerEl) {
      headerEl.setAttribute("dir", dir);
      headerEl.style.direction = dir;
    }
  }

  // --- Utilities ---
  function t(key) {
    const dict = I18N[state.lang] || I18N.en;
    return dict[key] !== undefined ? dict[key] : I18N.en[key] || key;
  }

  function uid(prefix = "n") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    const dir = detectDir(msg);
    el.setAttribute("dir", dir);
    el.style.direction = dir;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.2s";
      setTimeout(() => el.remove(), 220);
    }, 2400);
  }

  function formatBytes(bytes) {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function createDefaultBoard(title) {
    const isFa = state.lang === "fa";
    return {
      id: uid("board"),
      title: title || (isFa ? "نقشه ذهنی اصلی" : "Main Mind Map"),
      color: "#3b82f6",
      layout: "balanced",
      panX: 0,
      panY: 0,
      zoom: 1,
      root: {
        id: uid("node"),
        text: isFa ? "ایده یا پروژه اصلی" : "Central Idea",
        note: isFa
          ? "روی دکمه‌های + دور هر باکس کلیک کنید یا فایل/عکس را بکشید و رها کنید"
          : "Click + on any side (Right, Left, Up, Down) or drag & drop images/files here",
        color: "#3b82f6",
        hasTodo: false,
        checked: false,
        collapsed: false,
        dir: null,
        dx: 0,
        dy: 0,
        attachments: [],
        children: [
          {
            id: uid("node"),
            text: isFa ? "شاخه سمت راست" : "Right Branch",
            note: "",
            color: "#10b981",
            hasTodo: false,
            checked: false,
            collapsed: false,
            dir: "right",
            dx: 0,
            dy: 0,
            attachments: [],
            children: [
              {
                id: uid("node"),
                text: isFa ? "زیرشاخه (کلید Tab)" : "Sub-branch (Press Tab)",
                note: "",
                color: "#10b981",
                hasTodo: true,
                checked: true,
                collapsed: false,
                dir: "right",
                dx: 0,
                dy: 0,
                attachments: [],
                children: []
              }
            ]
          },
          {
            id: uid("node"),
            text: isFa ? "شاخه سمت چپ" : "Left Branch",
            note: "",
            color: "#f59e0b",
            hasTodo: false,
            checked: false,
            collapsed: false,
            dir: "left",
            dx: 0,
            dy: 0,
            attachments: [],
            children: []
          },
          {
            id: uid("node"),
            text: isFa ? "شاخه پایین" : "Down Branch",
            note: "",
            color: "#8b5cf6",
            hasTodo: false,
            checked: false,
            collapsed: false,
            dir: "down",
            dx: 0,
            dy: 0,
            attachments: [],
            children: []
          }
        ]
      }
    };
  }

  function getActiveBoard() {
    return state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];
  }

  // --- Tree Helpers ---
  function findNodeAndParent(root, targetId, parent = null) {
    if (!root) return null;
    if (root.id === targetId) return { node: root, parent };
    for (const child of root.children || []) {
      const found = findNodeAndParent(child, targetId, root);
      if (found) return found;
    }
    return null;
  }

  function findNode(root, targetId) {
    const res = findNodeAndParent(root, targetId);
    return res ? res.node : null;
  }

  function isDescendantOrSelf(sourceNode, targetId) {
    if (!sourceNode) return false;
    if (sourceNode.id === targetId) return true;
    for (const c of sourceNode.children || []) {
      if (isDescendantOrSelf(c, targetId)) return true;
    }
    return false;
  }

  function countDescendants(node) {
    let total = 0;
    for (const c of node.children || []) {
      total += 1 + countDescendants(c);
    }
    return total;
  }

  function getSubtaskStats(node) {
    let total = 0;
    let done = 0;
    function walk(n) {
      for (const c of n.children || []) {
        if (c.hasTodo) {
          total++;
          if (c.checked) done++;
        }
        walk(c);
      }
    }
    walk(node);
    return { total, done };
  }

  function countBoardStats(root) {
    let nodes = 0;
    let tasks = 0;
    let tasksDone = 0;
    function walk(n) {
      if (!n) return;
      nodes++;
      if (n.hasTodo) {
        tasks++;
        if (n.checked) tasksDone++;
      }
      for (const c of n.children || []) walk(c);
    }
    walk(root);
    return { nodes, tasks, tasksDone };
  }

  // --- History (Undo / Redo) ---
  function getBoardHistory(boardId) {
    if (!historyMap.has(boardId)) {
      historyMap.set(boardId, { past: [], future: [] });
    }
    return historyMap.get(boardId);
  }

  function pushHistory() {
    const board = getActiveBoard();
    if (!board) return;
    const h = getBoardHistory(board.id);
    const snapshot = JSON.stringify(board.root);
    if (h.past.length > 0 && h.past[h.past.length - 1] === snapshot) return;
    h.past.push(snapshot);
    if (h.past.length > 50) h.past.shift();
    h.future = [];
    updateUndoRedoButtons();
  }

  function undo() {
    const board = getActiveBoard();
    if (!board) return;
    const h = getBoardHistory(board.id);
    if (h.past.length === 0) return;
    h.future.push(JSON.stringify(board.root));
    board.root = JSON.parse(h.past.pop());
    updateUndoRedoButtons();
    renderCanvas();
    scheduleSave();
  }

  function redo() {
    const board = getActiveBoard();
    if (!board) return;
    const h = getBoardHistory(board.id);
    if (h.future.length === 0) return;
    h.past.push(JSON.stringify(board.root));
    board.root = JSON.parse(h.future.pop());
    updateUndoRedoButtons();
    renderCanvas();
    scheduleSave();
  }

  function updateUndoRedoButtons() {
    const board = getActiveBoard();
    if (!board) return;
    const h = getBoardHistory(board.id);
    undoBtn.disabled = h.past.length === 0;
    redoBtn.disabled = h.future.length === 0;
  }

  // --- Theme & Language Application ---
  function applyTheme(themeKey) {
    state.theme = themeKey === "light" ? "light" : "dark";
    if (state.theme === "light") {
      document.body.classList.add("theme-light");
      themeAvatar.textContent = "L";
      themeChipName.textContent = t("themeLight");
    } else {
      document.body.classList.remove("theme-light");
      themeAvatar.textContent = "D";
      themeChipName.textContent = t("themeDark");
    }
    settingsThemeSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === state.theme);
    });
  }

  function translateUntouchedStarterBoard(toLang) {
    const mapEnToFa = {
      "Main Mind Map": "نقشه ذهنی اصلی",
      "Central Idea": "ایده یا پروژه اصلی",
      "Click + on any side (Right, Left, Up, Down) or drag & drop images/files here":
        "روی دکمه‌های + دور هر باکس کلیک کنید یا فایل/عکس را بکشید و رها کنید",
      "Right Branch": "شاخه سمت راست",
      "Sub-branch (Press Tab)": "زیرشاخه (کلید Tab)",
      "Left Branch": "شاخه سمت چپ",
      "Down Branch": "شاخه پایین"
    };
    const mapFaToEn = {};
    Object.keys(mapEnToFa).forEach((k) => {
      mapFaToEn[mapEnToFa[k]] = k;
    });
    const lookup = toLang === "fa" ? mapEnToFa : mapFaToEn;
    state.boards.forEach((b) => {
      if (lookup[b.title]) b.title = lookup[b.title];
      function walk(n) {
        if (!n) return;
        if (lookup[n.text]) n.text = lookup[n.text];
        if (lookup[n.note]) n.note = lookup[n.note];
        (n.children || []).forEach(walk);
      }
      walk(b.root);
    });
  }

  function selectSingleNode(id) {
    selectedNodeId = id || null;
    selectedNodeIds.clear();
    if (id) selectedNodeIds.add(id);
  }

  function clearSelection() {
    selectedNodeId = null;
    selectedNodeIds.clear();
    aiInlineNodeId = null;
  }

  function getSelectedNodeList(board) {
    if (!board || !board.root) return [];
    const list = [];
    selectedNodeIds.forEach((id) => {
      const n = findNode(board.root, id);
      if (n) list.push(n);
    });
    if (list.length === 0 && selectedNodeId) {
      const n = findNode(board.root, selectedNodeId);
      if (n) list.push(n);
    }
    return list;
  }

  function syncSelectionClassesInPlace() {
    const isMulti = selectedNodeIds.size > 1;
    currentDomMap.forEach((dom, id) => {
      const isSel = selectedNodeIds.has(id) || id === selectedNodeId;
      dom.classList.toggle("selected", isSel && !isMulti);
      dom.classList.toggle("multi-selected", isSel && isMulti);
      const qbar = dom.querySelector(".node-quickbar");
      if (qbar) {
        qbar.style.display = id === selectedNodeId && !isMulti ? "flex" : "none";
      }
    });
    updateStatusbar();
  }

  function applyLanguage(lang) {
    state.lang = lang === "fa" ? "fa" : "en";
    const isFa = state.lang === "fa";
    const mirror = isFa && !!state.rtlMirror;

    // Exact NotePrompt RTL / lang-fa application
    document.documentElement.lang = state.lang;
    document.documentElement.dir = mirror ? "rtl" : "ltr";
    appRoot.classList.toggle("rtl", mirror);
    appRoot.classList.toggle("lang-fa", isFa);

    if (toggleRtlMirror) toggleRtlMirror.checked = !!state.rtlMirror;
    if (rtlMirrorRow) rtlMirrorRow.classList.toggle("disabled", !isFa);

    // Modals and Context Menus follow UI language direction so Persian UI text is properly right-aligned
    const uiDir = isFa ? "rtl" : "ltr";
    [
      settingsModal,
      aiModal,
      helpModal,
      contextMenu,
      layoutPopover,
      colorPopover,
      addTypePopover
    ].forEach((el) => {
      if (el) el.setAttribute("dir", uiDir);
    });

    translateUntouchedStarterBoard(state.lang);

    aiTopChipLabel.textContent = t("aiMindMap");
    document.getElementById("lblNewMap").textContent = t("newMap");
    document.getElementById("lblAiGenerator").textContent = t("aiRail");
    document.getElementById("lblAutoLayout").textContent = t("autoLayout");
    document.getElementById("lblOpenFile").textContent = t("openFile");
    document.getElementById("lblSaveFile").textContent = t("saveFile");
    document.getElementById("lblExportPng").textContent = t("exportPng");
    document.getElementById("lblExportMd").textContent = t("exportMd");
    document.getElementById("lblShortcuts").textContent = t("shortcuts");
    document.getElementById("lblMapsGroup").textContent = t("mapsGroup");

    findInput.placeholder = t("searchPlaceholder");
    applyLiveInputDir(findInput);
    canvasDropHint.textContent = t("dropHint");
    zenExitHint.textContent = t("zenExit");

    document.getElementById("lblActAi").textContent = t("actAi");
    document.getElementById("lblActChild").textContent = t("actChild");
    document.getElementById("lblActSibling").textContent = t("actSibling");
    document.getElementById("lblActTodo").textContent = t("actTodo");
    document.getElementById("lblActNote").textContent = t("actNote");
    document.getElementById("lblActImage").textContent = t("actImage");
    if (document.getElementById("lblActVideo")) {
      document.getElementById("lblActVideo").textContent = t("actVideo");
    }
    if (document.getElementById("lblActVoice")) {
      document.getElementById("lblActVoice").textContent = t("actVoice");
    }
    document.getElementById("lblActFile").textContent = t("actFile");
    document.getElementById("lblActColor").textContent = t("actColor");
    document.getElementById("lblActCollapse").textContent = t("actCollapse");
    document.getElementById("lblActDelete").textContent = t("actDelete");

    if (lblAddTypeText) lblAddTypeText.textContent = t("addTypeText");
    if (lblAddTypeImage) lblAddTypeImage.textContent = t("addTypeImage");
    if (lblAddTypeVideo) lblAddTypeVideo.textContent = t("addTypeVideo");
    if (lblAddTypeVoice) lblAddTypeVoice.textContent = t("addTypeVoice");
    if (lblAddTypeFile) lblAddTypeFile.textContent = t("addTypeFile");

    document.getElementById("lblBranchColor").textContent = t("branchColor");
    document.getElementById("lblLayoutMode").textContent = t("layoutMode");
    document.getElementById("optLayoutBalanced").textContent = t("layoutBalancedLong");
    document.getElementById("optLayoutRight").textContent = t("layoutRightLong");
    document.getElementById("optLayoutLeft").textContent = t("layoutLeftLong");
    document.getElementById("optLayoutDown").textContent = t("layoutDownLong");

    document.getElementById("settingsModalTitle").textContent = t("settingsTitle");
    document.getElementById("lblSetLanguage").textContent = t("setLanguage");
    if (lblRtlMirrorTitle) lblRtlMirrorTitle.textContent = t("rtlMirrorTitle");
    if (lblRtlMirrorHint) lblRtlMirrorHint.textContent = t("rtlMirrorHint");
    document.getElementById("lblSetTheme").textContent = t("setTheme");
    document.getElementById("btnThemeDark").textContent = t("setThemeDark");
    document.getElementById("btnThemeLight").textContent = t("setThemeLight");
    document.getElementById("lblSetLayout").textContent = t("setLayout");
    document.getElementById("segBtnBalanced").textContent = t("layoutBalanced");
    document.getElementById("segBtnRight").textContent = t("layoutRight");
    document.getElementById("segBtnLeft").textContent = t("layoutLeft");
    document.getElementById("segBtnDown").textContent = t("layoutDown");
    document.getElementById("lblSetAiHeader").textContent = t("setAiHeader");
    btnSyncNotePromptAi.textContent = t("syncNotePrompt");
    document.getElementById("lblAiProvider").textContent = t("aiProvider");
    document.getElementById("lblAiModel").textContent = t("aiModel");
    document.getElementById("lblAiKey").textContent = t("aiKey");
    document.getElementById("aiConfigHint").textContent = t("aiHint");

    document.getElementById("aiModalTitle").textContent = t("aiModalTitle");
    document.getElementById("lblAiPromptInput").textContent = t("aiPromptLabel");
    aiPromptTextarea.placeholder = t("aiPromptPlaceholder");
    applyLiveInputDir(aiPromptTextarea);
    document.getElementById("lblAiTargetMode").textContent = t("aiTargetLabel");
    document.getElementById("btnAiTargetNew").textContent = t("aiTargetNew");
    document.getElementById("btnAiTargetExpand").textContent = t("aiTargetExpand");
    aiCancelBtn.textContent = t("aiCancel");
    document.getElementById("lblAiGenerateBtn").textContent = t("aiGenerateBtn");

    lightboxOpenOs.textContent = t("openInOs");
    lightboxReveal.textContent = t("showInFolder");
    document.getElementById("helpModalTitle").textContent = t("helpTitle");

    helpListBody.innerHTML = "";
    (t("helpRows") || []).forEach(([desc, key]) => {
      const row = document.createElement("div");
      row.className = "help-row";
      row.style.direction = isFa ? "rtl" : "ltr";
      row.innerHTML = `<span>${desc}</span><kbd>${key}</kbd>`;
      helpListBody.appendChild(row);
    });

    settingsLangSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });

    applyTheme(state.theme);
    renderRail();
    renderCanvas();
    updateStatusbar();
  }

  // --- Save & Load Workspace ---
  async function flushSave() {
    try {
      const board = getActiveBoard();
      if (board) {
        board.panX = panX;
        board.panY = panY;
        board.zoom = zoom;
      }
      await invoke("save_workspace", { data: state });
      autosaveBadge.textContent = t("saved");
      autosaveBadge.classList.remove("saving");
    } catch (e) {
      console.error("Save error:", e);
      autosaveBadge.textContent = "save failed ✗";
      showToast("Could not save workspace: " + e);
    }
  }

  function scheduleSave() {
    autosaveBadge.textContent = t("saving");
    autosaveBadge.classList.add("saving");
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      flushSave();
    }, 350);
  }

  // Never lose the last edit: write pending changes before the window closes.
  async function closeWindowSafely() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      await flushSave();
    }
    invoke("win_close");
  }

  // --- Markdown export ---
  function nodeToMarkdown(node, depth) {
    const indent = "  ".repeat(depth);
    const text = String(node.text || "").replace(/\s*\n\s*/g, " ").trim() || "—";
    const box = node.hasTodo ? (node.checked ? "[x] " : "[ ] ") : "";
    let out = `${indent}- ${box}${text}\n`;
    if (node.note && node.note.trim()) {
      out += node.note
        .trim()
        .split("\n")
        .map((l) => `${indent}  > ${l}`)
        .join("\n") + "\n";
    }
    (node.attachments || []).forEach((a) => {
      out += `${indent}  - 📎 ${a.name}\n`;
    });
    (node.children || []).forEach((c) => {
      out += nodeToMarkdown(c, depth + 1);
    });
    return out;
  }

  async function exportMindMapMarkdown() {
    const board = getActiveBoard();
    if (!board) return;
    const md = `# ${board.title}

` + nodeToMarkdown(board.root, 0);
    try {
      const saved = await invoke("save_text_dialog", {
        content: md,
        defaultName: board.title || "mindmap",
        ext: "md",
        label: "Markdown (*.md)"
      });
      if (saved) showToast("Exported Markdown ✓");
    } catch (e) {
      showToast(String(e));
    }
  }

  // --- Left Rail Tabs Rendering ---
  function renderRail() {
    appRoot.style.setProperty("--rail-width", `${state.railWidth || 184}px`);
    appRoot.classList.toggle("rail-hidden", !!state.railHidden);
    appRoot.classList.toggle("rail-tools-closed", !!state.railToolsClosed);
    appRoot.classList.toggle("zen-mode", !!state.zenMode);
    railToggleBtn.classList.toggle("active", !state.railHidden);

    tabList.innerHTML = "";
    state.boards.forEach((b) => {
      const tab = document.createElement("div");
      tab.className = "tab" + (b.id === state.activeBoardId ? " active" : "");
      tab.style.setProperty("--tab-accent", b.color || "var(--accent)");

      const dot = document.createElement("span");
      dot.className = "tab-color-dot";
      dot.style.background = b.color || "var(--accent)";
      tab.appendChild(dot);

      if (renamingBoardId === b.id) {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.className = "tab-name-input";
        inp.value = b.title;
        applyLiveInputDir(inp);
        inp.addEventListener("input", () => applyLiveInputDir(inp));
        const finishRename = () => {
          const val = inp.value.trim();
          if (val) b.title = val;
          renamingBoardId = null;
          renderRail();
          scheduleSave();
        };
        inp.addEventListener("blur", finishRename);
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") finishRename();
          if (e.key === "Escape") {
            renamingBoardId = null;
            renderRail();
          }
        });
        tab.appendChild(inp);
        setTimeout(() => {
          inp.focus();
          inp.select();
        }, 10);
      } else {
        const nameSpan = document.createElement("span");
        nameSpan.className = "tab-name";
        const dispTitle = b.title || "Untitled";
        const tabDir = detectDir(dispTitle);
        nameSpan.setAttribute("dir", tabDir);
        nameSpan.style.direction = tabDir;
        nameSpan.textContent = dispTitle;
        tab.appendChild(nameSpan);

        const stats = countBoardStats(b.root);
        const badge = document.createElement("span");
        badge.className = "tab-badge";
        badge.textContent = stats.nodes;
        tab.appendChild(badge);

        if (state.boards.length > 1) {
          const closeEl = document.createElement("button");
          closeEl.className = "tab-close";
          closeEl.innerHTML = "×";
          closeEl.addEventListener("click", (ev) => {
            ev.stopPropagation();
            deleteBoard(b.id);
          });
          tab.appendChild(closeEl);
        }
      }

      tab.addEventListener("click", () => {
        if (state.activeBoardId !== b.id) switchBoard(b.id);
      });

      tab.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        renamingBoardId = b.id;
        renderRail();
      });

      tab.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openTabContextMenu(ev.clientX, ev.clientY, b);
      });

      tabList.appendChild(tab);
    });
  }

  function switchBoard(boardId) {
    const prev = getActiveBoard();
    if (prev) {
      prev.panX = panX;
      prev.panY = panY;
      prev.zoom = zoom;
    }
    state.activeBoardId = boardId;
    const next = getActiveBoard();
    if (next) {
      selectSingleNode(next.root.id);
      editingNodeId = null;
      editingNoteNodeId = null;
      aiInlineNodeId = null;
      if (typeof next.panX === "number" && (next.panX !== 0 || next.panY !== 0)) {
        panX = next.panX;
        panY = next.panY;
        zoom = next.zoom || 1;
      } else {
        centerCanvasOnRoot();
      }
    }
    renderRail();
    renderCanvas();
    updateUndoRedoButtons();
    scheduleSave();
  }

  function deleteBoard(boardId) {
    if (state.boards.length <= 1) {
      showToast(t("toastMinOneBoard"));
      return;
    }
    const idx = state.boards.findIndex((b) => b.id === boardId);
    if (idx === -1) return;
    state.boards.splice(idx, 1);
    if (state.activeBoardId === boardId) {
      state.activeBoardId = state.boards[Math.max(0, idx - 1)].id;
      const b = getActiveBoard();
      selectSingleNode(b.root.id);
      centerCanvasOnRoot();
    }
    renderRail();
    renderCanvas();
    scheduleSave();
  }

  // --- Universal 4-Directional Collision-Free Tree Layout Engine ---
  const H_GAP = 76;
  const V_GAP = 32;
  const V_DOWN_GAP = 64;
  const H_DOWN_GAP = 34;

  function resolveChildSide(board, child, parentSide, index) {
    if (child.dir && ["left", "right", "down", "up"].includes(child.dir)) {
      return child.dir;
    }
    if (parentSide && parentSide !== "root") {
      return parentSide;
    }
    if (board.layout === "left") return "left";
    if (board.layout === "right") return "right";
    if (board.layout === "down") return "down";
    return index % 2 === 0 ? "right" : "left";
  }

  function computeTreeLayout(board, sizeMap) {
    const finalPositions = new Map();
    const root = board.root;
    if (!root) return finalPositions;

    // Bottom-up (post-order) subtree layout in local coordinates where `node` is at (0, 0).
    // Returns { map: Map<nodeId, {x,y,w,h,side}>, minX, minY, maxX, maxY }
    // Because every child subtree reports its FULL 2D bounding box (including all 4 directions),
    // sibling subtrees never collide with each other!
    function layoutSubtreeLocal(node, nodeSide) {
      const sz = sizeMap.get(node.id) || { w: 165, h: 46 };
      const localMap = new Map();
      localMap.set(node.id, {
        x: 0,
        y: 0,
        w: sz.w,
        h: sz.h,
        side: nodeSide
      });

      let minX = 0;
      let minY = 0;
      let maxX = sz.w;
      let maxY = sz.h;

      if (node.collapsed || !node.children || node.children.length === 0) {
        return { map: localMap, minX, minY, maxX, maxY };
      }

      const groups = { right: [], left: [], down: [], up: [] };
      node.children.forEach((c, idx) => {
        const s = resolveChildSide(board, c, nodeSide, idx);
        groups[s].push({ child: c, layout: layoutSubtreeLocal(c, s) });
      });

      function mergeChildLayout(cItem, offsetX, offsetY) {
        const dx = offsetX + (cItem.child.dx || 0);
        const dy = offsetY + (cItem.child.dy || 0);
        cItem.layout.map.forEach((p, id) => {
          const nx = p.x + dx;
          const ny = p.y + dy;
          localMap.set(id, { x: nx, y: ny, w: p.w, h: p.h, side: p.side });
          minX = Math.min(minX, nx);
          minY = Math.min(minY, ny);
          maxX = Math.max(maxX, nx + p.w);
          maxY = Math.max(maxY, ny + p.h);
        });
      }

      // 1. Place Right subtrees (stacked vertically by their exact [minY..maxY] height)
      if (groups.right.length > 0) {
        const totalH = groups.right.reduce(
          (acc, item, i) =>
            acc + (i > 0 ? V_GAP : 0) + (item.layout.maxY - item.layout.minY),
          0
        );
        let cursorY = sz.h / 2 - totalH / 2;
        groups.right.forEach((item) => {
          const L = item.layout;
          const boxH = L.maxY - L.minY;
          // Ensure the entire child subtree's left edge is at least sz.w + H_GAP
          const offsetX = sz.w + H_GAP - Math.min(0, L.minX);
          const offsetY = cursorY - L.minY;
          mergeChildLayout(item, offsetX, offsetY);
          cursorY += boxH + V_GAP;
        });
      }

      // 2. Place Left subtrees (stacked vertically by their exact [minY..maxY] height)
      if (groups.left.length > 0) {
        const totalH = groups.left.reduce(
          (acc, item, i) =>
            acc + (i > 0 ? V_GAP : 0) + (item.layout.maxY - item.layout.minY),
          0
        );
        let cursorY = sz.h / 2 - totalH / 2;
        groups.left.forEach((item) => {
          const L = item.layout;
          const boxH = L.maxY - L.minY;
          const cSz = sizeMap.get(item.child.id) || { w: 165, h: 46 };
          const rightExtent = Math.max(cSz.w, L.maxX);
          const offsetX = -H_GAP - rightExtent;
          const offsetY = cursorY - L.minY;
          mergeChildLayout(item, offsetX, offsetY);
          cursorY += boxH + V_GAP;
        });
      }

      // Track vertical extent after placing left & right subtrees so down/up subtrees don't collide
      const lrMinY = minY;
      const lrMaxY = maxY;

      // 3. Place Down subtrees (stacked horizontally by their exact [minX..maxX] width!)
      if (groups.down.length > 0) {
        const totalW = groups.down.reduce(
          (acc, item, i) =>
            acc + (i > 0 ? H_DOWN_GAP : 0) + (item.layout.maxX - item.layout.minX),
          0
        );
        let cursorX = sz.w / 2 - totalW / 2;
        const baseTopY =
          (groups.right.length > 0 || groups.left.length > 0 ? lrMaxY : sz.h) +
          V_DOWN_GAP;
        groups.down.forEach((item) => {
          const L = item.layout;
          const boxW = L.maxX - L.minX;
          const offsetX = cursorX - L.minX;
          const offsetY = baseTopY - Math.min(0, L.minY);
          mergeChildLayout(item, offsetX, offsetY);
          cursorX += boxW + H_DOWN_GAP;
        });
      }

      // 4. Place Up subtrees (stacked horizontally by their exact [minX..maxX] width!)
      if (groups.up.length > 0) {
        const totalW = groups.up.reduce(
          (acc, item, i) =>
            acc + (i > 0 ? H_DOWN_GAP : 0) + (item.layout.maxX - item.layout.minX),
          0
        );
        let cursorX = sz.w / 2 - totalW / 2;
        const baseBottomY =
          (groups.right.length > 0 || groups.left.length > 0 ? lrMinY : 0) -
          V_DOWN_GAP;
        groups.up.forEach((item) => {
          const L = item.layout;
          const boxW = L.maxX - L.minX;
          const cSz = sizeMap.get(item.child.id) || { w: 165, h: 46 };
          const bottomExtent = Math.max(cSz.h, L.maxY);
          const offsetX = cursorX - L.minX;
          const offsetY = baseBottomY - bottomExtent;
          mergeChildLayout(item, offsetX, offsetY);
          cursorX += boxW + H_DOWN_GAP;
        });
      }

      return { map: localMap, minX, minY, maxX, maxY };
    }

    const rootSize = sizeMap.get(root.id) || { w: 195, h: 56 };
    const rootX = (root.dx || 0) - rootSize.w / 2;
    const rootY = (root.dy || 0) - rootSize.h / 2;

    const treeLayout = layoutSubtreeLocal(root, "root");
    treeLayout.map.forEach((p, id) => {
      finalPositions.set(id, {
        x: Math.round(p.x + rootX),
        y: Math.round(p.y + rootY),
        w: p.w,
        h: p.h,
        side: p.side
      });
    });

    return finalPositions;
  }

  // --- Render Canvas & Nodes ---
  function updateViewportTransform() {
    canvasWorld.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    const gridStep = 24 * zoom;
    canvasGrid.style.backgroundSize = `${gridStep}px ${gridStep}px`;
    canvasGrid.style.backgroundPosition = `${panX}px ${panY}px`;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  function centerCanvasOnRoot() {
    const rect = canvasViewport.getBoundingClientRect();
    panX = Math.round((rect.width || 950) / 2);
    panY = Math.round((rect.height || 620) / 2);
    zoom = 1;
    updateViewportTransform();
  }

  function fitCanvasToNodes() {
    if (layoutPositions.size === 0) {
      centerCanvasOnRoot();
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    layoutPositions.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    });
    const rect = canvasViewport.getBoundingClientRect();
    const pad = 95;
    const treeW = Math.max(200, maxX - minX + pad * 2);
    const treeH = Math.max(160, maxY - minY + pad * 2);
    const scaleX = rect.width / treeW;
    const scaleY = rect.height / treeH;
    zoom = Math.min(1.2, Math.max(0.25, Math.min(scaleX, scaleY)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    panX = Math.round(rect.width / 2 - centerX * zoom);
    panY = Math.round(rect.height / 2 - centerY * zoom);
    updateViewportTransform();
    scheduleSave();
  }

  function cycleSelectedNodeAlign() {
    const board = getActiveBoard();
    if (!board) return;
    const targets = getSelectedNodeList(board);
    if (targets.length === 0) return;
    pushHistory();
    const first = targets[0];
    const cur = EDITOR_ALIGNS.includes(first.align) ? first.align : "auto";
    const nextAlign = EDITOR_ALIGNS[(EDITOR_ALIGNS.indexOf(cur) + 1) % EDITOR_ALIGNS.length];
    targets.forEach((n) => {
      n.align = nextAlign;
    });
    renderCanvas();
    scheduleSave();
  }

  function setNodeAlign(nodeOrId, mode) {
    const board = getActiveBoard();
    if (!board) return;
    const targetNode =
      typeof nodeOrId === "string" ? findNode(board.root, nodeOrId) : nodeOrId;
    if (!targetNode) return;
    pushHistory();
    const validMode = EDITOR_ALIGNS.includes(mode) ? mode : "auto";
    if (selectedNodeIds.has(targetNode.id) && selectedNodeIds.size > 1) {
      getSelectedNodeList(board).forEach((n) => {
        n.align = validMode;
      });
    } else {
      targetNode.align = validMode;
    }
    renderCanvas();
    scheduleSave();
  }

  // --- Inline AI Text / Sub-branch Generation inside a Single Node ---
  async function callAiForPlainText(userPrompt, nodeContext) {
    const id = getActiveAiProviderId();
    const meta = AI_PROVIDERS[id];
    const apiKey = getActiveAiKey().trim();

    if (id !== "custom" && !apiKey) {
      throw new Error(
        state.lang === "fa"
          ? "لطفاً ابتدا کلید API هوش مصنوعی را در Settings وارد کنید یا از NotePrompt لینک کنید."
          : "Please add your AI API key in Settings → AI (or click Sync from NotePrompt)."
      );
    }

    const url = id === "custom" ? (state.ai.customUrl || "").trim() : meta.url;
    const availableModels =
      id === "custom"
        ? String(state.ai.customModels || "")
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : state.ai.model && state.ai.model !== "auto"
        ? [state.ai.model]
        : meta.models;

    if (!url || availableModels.length === 0) {
      throw new Error("Please configure AI endpoint and model in Settings.");
    }

    const sysPrompt = `You are a concise, helpful assistant inside a Mind Map node.
Write clear, well-structured text directly answering the user's prompt in the SAME language as the prompt (Persian if Persian, English if English).
Keep it concise (2 to 5 short lines or bullet points) suitable for inside a mind-map card. Do NOT wrap in markdown code fences.`;

    const fullUserPrompt =
      nodeContext && nodeContext !== userPrompt
        ? `Branch Topic: ${nodeContext}\nRequest: ${userPrompt}`
        : userPrompt;

    let lastErr = "AI request failed.";
    for (const model of availableModels) {
      try {
        let resp;
        if (meta.family === "anthropic") {
          resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              ...meta.headers
            },
            body: JSON.stringify({
              model,
              max_tokens: 1024,
              system: sysPrompt,
              messages: [{ role: "user", content: fullUserPrompt }]
            })
          });
        } else {
          const headers = {
            "Content-Type": "application/json",
            ...meta.headers
          };
          if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
          resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model,
              temperature: 0.6,
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: fullUserPrompt }
              ]
            })
          });
        }
        const json = await resp.json();
        if (!resp.ok) {
          lastErr =
            (json && json.error && (json.error.message || json.error)) ||
            `HTTP ${resp.status}`;
          if (resp.status === 429 || resp.status >= 500 || resp.status === 404) {
            continue;
          }
          throw new Error(String(lastErr));
        }
        let rawText = "";
        if (meta.family === "anthropic") {
          const blk = (json.content || []).find((b) => b.type === "text");
          rawText = blk ? blk.text : "";
        } else {
          rawText =
            json &&
            json.choices &&
            json.choices[0] &&
            json.choices[0].message &&
            json.choices[0].message.content;
        }
        if (!rawText) throw new Error("Empty response from AI.");
        return rawText.trim();
      } catch (err) {
        lastErr = err.message || String(err);
      }
    }
    throw new Error(lastErr);
  }

  function buildNodeDOM(node, isRoot, board) {
    const el = document.createElement("div");
    const nType = node.nodeType || "text";
    el.className =
      "mind-node" +
      (isRoot ? " is-root" : "") +
      ` node-type-${nType}`;
    el.dataset.id = node.id;
    const nodeColor = node.color || board.color || "#3b82f6";
    el.style.setProperty("--node-color", nodeColor);

    const isSelected = selectedNodeIds.has(node.id) || node.id === selectedNodeId;
    const isMulti = selectedNodeIds.size > 1;
    if (isSelected && !isMulti) el.classList.add("selected");
    if (isSelected && isMulti) el.classList.add("multi-selected");
    if (node.hasTodo && node.checked) el.classList.add("checked-done");
    if (searchMatches.includes(node.id)) el.classList.add("search-match");

    const nodeAlign = EDITOR_ALIGNS.includes(node.align) ? node.align : "auto";

    // Crisp Vector SVG Floating Quick Action Bar above Selected Node
    if (editingNodeId !== node.id) {
      const qbar = document.createElement("div");
      qbar.className = "node-quickbar";
      qbar.style.display = node.id === selectedNodeId && !isMulti ? "flex" : "none";
      qbar.addEventListener("mousedown", (e) => e.stopPropagation());

      const [ax1, ax2] = ALIGN_ICON_MID[nodeAlign] || [4, 20];
      qbar.innerHTML = `
        <button class="nq-btn" data-nq="image" title="${t("ctxImage")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2.5"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button class="nq-btn" data-nq="video" title="${t("ctxVideo")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="15" height="14" rx="2.5"/>
            <polygon points="22 7 17 12 22 17 22 7"/>
          </svg>
        </button>
        <button class="nq-btn" data-nq="voice" title="${t("ctxVoice")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
        <button class="nq-btn" data-nq="file" title="${t("ctxFile")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <button class="nq-btn ${node.hasTodo ? "active" : ""}" data-nq="todo" title="${t("ctxTodo")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2.5"/>
            <polyline points="8 12 11 15 16 9"/>
          </svg>
        </button>
        <button class="nq-btn ${node.note && node.note.trim() ? "active" : ""}" data-nq="note" title="${t("ctxNote")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="13" y2="17"/>
          </svg>
        </button>
        <button class="nq-btn ${nodeAlign !== "auto" ? "active" : ""}" data-nq="align" title="Align (${nodeAlign})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
            <line x1="4" y1="7" x2="20" y2="7"/>
            <line x1="${ax1}" y1="12" x2="${ax2}" y2="12"/>
            <line x1="4" y1="17" x2="20" y2="17"/>
          </svg>
        </button>
        <button class="nq-btn ai-inline-btn ${aiInlineNodeId === node.id ? "active" : ""}" data-nq="ai" title="${t("aiWritePlaceholder")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>
          </svg>
          <span>AI</span>
        </button>
        ${
          !isRoot
            ? `<button class="nq-btn danger" data-nq="del" title="${t("ctxDelete")}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>`
            : ""
        }
      `;
      qbar.querySelectorAll(".nq-btn").forEach((b) => {
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const act = b.dataset.nq;
          if (act === "image") attachImageToNode(node);
          else if (act === "video") attachVideoToNode(node);
          else if (act === "voice") attachAudioToNode(node);
          else if (act === "file") attachFileToNode(node);
          else if (act === "todo") {
            pushHistory();
            node.hasTodo = !node.hasTodo;
            renderCanvas();
            scheduleSave();
          } else if (act === "note") {
            editingNoteNodeId = editingNoteNodeId === node.id ? null : node.id;
            renderCanvas();
          } else if (act === "align") {
            cycleSelectedNodeAlign();
          } else if (act === "ai") {
            aiInlineNodeId = aiInlineNodeId === node.id ? null : node.id;
            renderCanvas();
          } else if (act === "del") {
            deleteSelectedNode();
          }
        });
      });
      el.appendChild(qbar);
    }

    const atts = node.attachments || [];
    const images = atts.filter((a) => isImageAttachment(a));
    const videos = atts.filter((a) => isVideoAttachment(a));
    const voices = atts.filter((a) => isAudioAttachment(a));
    const files = atts.filter(
      (a) => !isImageAttachment(a) && !isVideoAttachment(a) && !isAudioAttachment(a)
    );

    // 1. Header: Checkbox + Title / Input (Shown for text nodes, or when editing/titled on media/file nodes)
    const showHeader =
      nType === "text" ||
      editingNodeId === node.id ||
      node.hasTodo ||
      (node.text &&
        node.text.trim() &&
        node.text !== t("addTypeImage") &&
        node.text !== t("addTypeVideo") &&
        node.text !== t("addTypeVoice") &&
        node.text !== t("addTypeFile") &&
        node.text !== "Image" &&
        node.text !== "Video" &&
        node.text !== "Voice" &&
        node.text !== "File" &&
        node.text !== "عکس" &&
        node.text !== "ویدیو" &&
        node.text !== "ویس" &&
        node.text !== "فایل");

    if (showHeader) {
      const header = document.createElement("div");
      header.className = "node-header";
      const headerDir = resolveBlockDir(node.text, nodeAlign);
      header.setAttribute("dir", headerDir);
      header.style.direction = headerDir;

      if (node.hasTodo) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "node-checkbox";
        cb.checked = !!node.checked;
        cb.addEventListener("mousedown", (ev) => ev.stopPropagation());
        cb.addEventListener("click", (ev) => ev.stopPropagation());
        cb.addEventListener("change", () => {
          pushHistory();
          node.checked = cb.checked;
          renderCanvas();
          scheduleSave();
        });
        header.appendChild(cb);
      }

      if (editingNodeId === node.id) {
        const ta = document.createElement("textarea");
        ta.className = "node-title-input";
        ta.rows = Math.max(1, (node.text || "").split("\n").length);
        ta.value = node.text || "";
        applyLiveInputDir(ta, nodeAlign, header);
        ta.addEventListener("input", () => {
          ta.rows = Math.max(1, ta.value.split("\n").length);
          applyLiveInputDir(ta, nodeAlign, header);
        });
        let editCommitted = false;
        const commitEdit = (spawnChildAfter = false) => {
          if (editCommitted || editingNodeId !== node.id) return;
          editCommitted = true;
          const fallback =
            nType === "image" ||
            nType === "video" ||
            nType === "voice" ||
            nType === "file"
              ? ""
              : t("newBranchText");
          const nextText = ta.value.trim() || fallback;
          if (nextText !== node.text) {
            pushHistory();
            node.text = nextText;
            if (isRoot && nextText) {
              board.title = nextText;
              renderRail();
            }
          }
          editingNodeId = null;
          if (spawnChildAfter) {
            addChildNode(node.id, null, "text");
          } else {
            renderCanvas();
            scheduleSave();
          }
        };
        ta.addEventListener("mousedown", (e) => e.stopPropagation());
        ta.addEventListener("blur", () => commitEdit(false));
        ta.addEventListener("keydown", (e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            // Pressing Enter inside a box saves the text AND creates a sub-branch from this box!
            e.preventDefault();
            commitEdit(true);
          } else if (e.key === "Escape") {
            editCommitted = true;
            editingNodeId = null;
            renderCanvas();
          }
        });
        header.appendChild(ta);
        setTimeout(() => {
          ta.focus();
          ta.select();
        }, 10);
      } else {
        const titleEl = document.createElement("div");
        titleEl.className = "node-title";
        renderMultilineLines(titleEl, node.text || t("newBranchText"), nodeAlign);
        header.appendChild(titleEl);
      }
      el.appendChild(header);
    }

    // 2. Inline AI Generator inside the Node (Write text inside this box OR expand sub-branches!)
    if (aiInlineNodeId === node.id) {
      const aiBox = document.createElement("div");
      aiBox.className = "node-ai-inline";
      aiBox.addEventListener("mousedown", (e) => e.stopPropagation());
      aiBox.addEventListener("click", (e) => e.stopPropagation());

      const aiInp = document.createElement("textarea");
      aiInp.className = "node-ai-inline-input";
      aiInp.rows = 2;
      aiInp.placeholder = t("aiWritePlaceholder");
      const defaultPrompt =
        node.text &&
        node.text !== t("newBranchText") &&
        node.text !== t("newSiblingText") &&
        node.text !== "New Branch" &&
        node.text !== "شاخه جدید"
          ? node.text
          : "";
      aiInp.value = defaultPrompt;
      applyLiveInputDir(aiInp, "auto");
      aiInp.addEventListener("input", () => applyLiveInputDir(aiInp, "auto"));

      const actionsRow = document.createElement("div");
      actionsRow.className = "node-ai-inline-actions";

      const btnWriteText = document.createElement("button");
      btnWriteText.className = "node-ai-btn primary";
      btnWriteText.innerHTML = `✨ <span>${t("aiWriteTextBtn")}</span>`;

      const btnWriteSubs = document.createElement("button");
      btnWriteSubs.className = "node-ai-btn";
      btnWriteSubs.innerHTML = `🌿 <span>${t("aiWriteSubBtn")}</span>`;

      const runInlineTextGen = async () => {
        const promptText = aiInp.value.trim() || node.text;
        if (!promptText) {
          aiInp.focus();
          return;
        }
        btnWriteText.disabled = true;
        btnWriteSubs.disabled = true;
        btnWriteText.querySelector("span").textContent = t("aiWritingText");
        try {
          const generatedText = await callAiForPlainText(promptText, node.text);
          pushHistory();
          const isPlaceholderTitle =
            !node.text ||
            node.text === t("newBranchText") ||
            node.text === t("newSiblingText") ||
            node.text === "New Branch" ||
            node.text === "شاخه جدید";
          if (isPlaceholderTitle) {
            node.text = generatedText;
          } else {
            node.note = node.note
              ? `${node.note}\n${generatedText}`
              : generatedText;
          }
          aiInlineNodeId = null;
          renderCanvas();
          scheduleSave();
          showToast(t("toastAiTextDone"));
        } catch (err) {
          showToast(err.message || String(err));
          btnWriteText.disabled = false;
          btnWriteSubs.disabled = false;
          btnWriteText.querySelector("span").textContent = t("aiWriteTextBtn");
        }
      };

      const runInlineSubBranches = async () => {
        const promptText = aiInp.value.trim() || node.text;
        if (!promptText) {
          aiInp.focus();
          return;
        }
        btnWriteText.disabled = true;
        btnWriteSubs.disabled = true;
        btnWriteSubs.querySelector("span").textContent = t("aiWritingText");
        try {
          const aiTree = await callAiForMindMap(promptText);
          pushHistory();
          const pos = layoutPositions.get(node.id);
          const baseDir =
            node.dir || (pos && pos.side !== "root" ? pos.side : null);
          const converted = convertAiTreeToNodes(
            aiTree,
            node.color || board.color,
            baseDir,
            isRoot ? 0 : 1
          );
          if (!node.children) node.children = [];
          if (converted.children && converted.children.length > 0) {
            node.children.push(...converted.children);
          } else {
            node.children.push(converted);
          }
          node.collapsed = false;
          aiInlineNodeId = null;
          renderRail();
          renderCanvas();
          fitCanvasToNodes();
          scheduleSave();
          showToast(t("toastAiSuccess"));
        } catch (err) {
          showToast(err.message || String(err));
          btnWriteText.disabled = false;
          btnWriteSubs.disabled = false;
          btnWriteSubs.querySelector("span").textContent = t("aiWriteSubBtn");
        }
      };

      btnWriteText.addEventListener("click", runInlineTextGen);
      btnWriteSubs.addEventListener("click", runInlineSubBranches);
      aiInp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          runInlineTextGen();
        } else if (e.key === "Escape") {
          aiInlineNodeId = null;
          renderCanvas();
        }
      });

      actionsRow.appendChild(btnWriteSubs);
      actionsRow.appendChild(btnWriteText);
      aiBox.appendChild(aiInp);
      aiBox.appendChild(actionsRow);
      el.appendChild(aiBox);
      setTimeout(() => {
        aiInp.focus();
        aiInp.select();
      }, 15);
    }

    // 3. Subtask Progress Pill
    const subStats = getSubtaskStats(node);
    if (subStats.total > 0) {
      const pct = Math.round((subStats.done / subStats.total) * 100);
      const prog = document.createElement("div");
      prog.className = "node-progress";
      prog.innerHTML = `
        <span>${subStats.done}/${subStats.total}</span>
        <div class="node-progress-bar">
          <div class="node-progress-fill" style="width:${pct}%"></div>
        </div>
      `;
      el.appendChild(prog);
    }

    // 4. Note Area (with NotePrompt per-line RTL/LTR direction)
    if (editingNoteNodeId === node.id) {
      const nta = document.createElement("textarea");
      nta.className = "node-note-input";
      nta.placeholder = t("notePlaceholder");
      nta.value = node.note || "";
      applyLiveInputDir(nta, nodeAlign);
      nta.addEventListener("input", () => applyLiveInputDir(nta, nodeAlign));
      const commitNote = () => {
        if (editingNoteNodeId !== node.id) return;
        pushHistory();
        node.note = nta.value.trim();
        editingNoteNodeId = null;
        renderCanvas();
        scheduleSave();
      };
      nta.addEventListener("mousedown", (e) => e.stopPropagation());
      nta.addEventListener("blur", commitNote);
      nta.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && e.ctrlKey)) {
          commitNote();
        }
      });
      el.appendChild(nta);
      setTimeout(() => nta.focus(), 15);
    } else if (node.note && node.note.trim()) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "node-note";
      renderMultilineLines(noteDiv, node.note, nodeAlign);
      noteDiv.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        selectSingleNode(node.id);
        editingNoteNodeId = node.id;
        renderCanvas();
      });
      el.appendChild(noteDiv);
    }

    // 5. Persistent Upload Image Slot (for Image nodes when no image is attached yet, or after removing image!)
    if (nType === "image" && images.length === 0) {
      const slot = document.createElement("div");
      slot.className = "node-upload-slot";
      slot.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2.5"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="node-upload-slot-title">${t("uploadImageTitle")}</span>
        <span class="node-upload-slot-hint">${t("uploadImageHint")}</span>
      `;
      slot.addEventListener("mousedown", (ev) => ev.stopPropagation());
      slot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        attachImageToNode(node);
      });
      el.appendChild(slot);
    }

    // 5b. Persistent Upload Video Slot (for Video nodes when no video is attached yet, or after removing video!)
    if (nType === "video" && videos.length === 0) {
      const slot = document.createElement("div");
      slot.className = "node-upload-slot";
      slot.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="15" height="14" rx="2.5"/>
          <polygon points="22 7 17 12 22 17 22 7"/>
        </svg>
        <span class="node-upload-slot-title">${t("uploadVideoTitle")}</span>
        <span class="node-upload-slot-hint">${t("uploadVideoHint")}</span>
      `;
      slot.addEventListener("mousedown", (ev) => ev.stopPropagation());
      slot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        attachVideoToNode(node);
      });
      el.appendChild(slot);
    }

    // 5c. Persistent Upload / Record Voice Slot (for Voice nodes when no voice is attached yet, or after removing voice!)
    if (nType === "voice" && voices.length === 0) {
      const isRecThis =
        activeVoiceRecorder && activeVoiceRecorder.nodeId === node.id;
      const slot = document.createElement("div");
      slot.className = "node-upload-slot";
      slot.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <span class="node-upload-slot-title">${t("uploadVoiceTitle")}</span>
        <span class="node-upload-slot-hint">${t("uploadVoiceHint")}</span>
        <div class="voice-slot-actions">
          <button type="button" class="voice-rec-btn" data-act="pick">${t("btnPickAudio")}</button>
          <button type="button" class="voice-rec-btn ${isRecThis ? "recording" : ""}" data-act="record">
            <span>${isRecThis ? `● ${formatRecTime(activeVoiceRecorder.seconds)} ${t("btnStopRecord")}` : `🎙 ${t("btnRecordVoice")}`}</span>
          </button>
        </div>
      `;
      slot.addEventListener("mousedown", (ev) => ev.stopPropagation());
      const pickBtn = slot.querySelector('[data-act="pick"]');
      const recBtn = slot.querySelector('[data-act="record"]');
      if (pickBtn) {
        pickBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          attachAudioToNode(node);
        });
      }
      if (recBtn) {
        recBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          toggleVoiceRecording(node, recBtn);
        });
      }
      slot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!ev.target.closest("button")) {
          attachAudioToNode(node);
        }
      });
      el.appendChild(slot);
    }

    // 6. Persistent Upload File Slot (for File nodes when no file is attached yet, or after removing file!)
    if (nType === "file" && files.length === 0) {
      const slot = document.createElement("div");
      slot.className = "node-upload-slot";
      slot.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <polyline points="9 15 12 12 15 15"/>
        </svg>
        <span class="node-upload-slot-title">${t("uploadFileTitle")}</span>
        <span class="node-upload-slot-hint">${t("uploadFileHint")}</span>
      `;
      slot.addEventListener("mousedown", (ev) => ev.stopPropagation());
      slot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        attachFileToNode(node);
      });
      el.appendChild(slot);
    }

    // 7. Attached Images (with Remove button that brings back the Upload Image slot on Image nodes!)
    if (images.length > 0) {
      const imgBox = document.createElement("div");
      imgBox.className = "node-images";
      images.forEach((att) => {
        const wrap = document.createElement("div");
        wrap.className = "node-img-wrapper";
        const img = document.createElement("img");
        img.src = att.data_url || att.path;
        img.alt = att.name;
        img.addEventListener("click", (ev) => {
          ev.stopPropagation();
          openLightbox(att);
        });
        const delBtn = document.createElement("button");
        delBtn.className = "att-del-btn";
        delBtn.title = t("actDelete");
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        delBtn.addEventListener("mousedown", (ev) => ev.stopPropagation());
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeAttachment(node, att.id);
        });
        wrap.appendChild(img);
        wrap.appendChild(delBtn);
        imgBox.appendChild(wrap);
      });
      el.appendChild(imgBox);
    }

    // 7b. Attached Videos (Inline Video Player + Remove button that brings back Upload Video slot on Video nodes!)
    if (videos.length > 0) {
      const vidBox = document.createElement("div");
      vidBox.className = "node-videos";
      videos.forEach((att) => {
        const wrap = document.createElement("div");
        wrap.className = "node-video-wrapper";
        wrap.addEventListener("mousedown", (ev) => ev.stopPropagation());

        const vid = document.createElement("video");
        vid.controls = true;
        vid.preload = "metadata";
        bindMediaSource(vid, att);

        const bar = document.createElement("div");
        bar.className = "node-video-bar";
        const fnDir = detectDir(att.name);
        bar.innerHTML = `
          <div class="file-info" title="${att.name}">
            <span class="file-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="15" height="14" rx="2"/>
                <polygon points="22 7 17 12 22 17 22 7"/>
              </svg>
            </span>
            <div class="file-meta">
              <span class="file-name" dir="${fnDir}" style="direction:${fnDir}">${att.name}</span>
              <span class="file-size">${formatBytes(att.size)}</span>
            </div>
          </div>
          <div class="file-actions"></div>
        `;
        bar.querySelector(".file-info").addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("open_attachment", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const acts = bar.querySelector(".file-actions");
        const folderBtn = document.createElement("button");
        folderBtn.className = "file-mini-btn";
        folderBtn.title = t("showInFolder");
        folderBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        folderBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("reveal_in_explorer", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const delBtn = document.createElement("button");
        delBtn.className = "file-mini-btn del";
        delBtn.title = t("actDelete");
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeAttachment(node, att.id);
        });

        acts.appendChild(folderBtn);
        acts.appendChild(delBtn);
        wrap.appendChild(vid);
        wrap.appendChild(bar);
        vidBox.appendChild(wrap);
      });
      el.appendChild(vidBox);
    }

    // 7c. Attached Voices / Audio (Inline Audio Player + Remove button that brings back Upload Voice slot!)
    if (voices.length > 0) {
      const voiceBox = document.createElement("div");
      voiceBox.className = "node-voices";
      voices.forEach((att) => {
        const card = document.createElement("div");
        card.className = "node-voice-card";
        card.addEventListener("mousedown", (ev) => ev.stopPropagation());

        const top = document.createElement("div");
        top.className = "node-voice-top";
        const fnDir = detectDir(att.name);
        top.innerHTML = `
          <div class="file-info" title="${att.name}">
            <span class="file-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
              </svg>
            </span>
            <div class="file-meta">
              <span class="file-name" dir="${fnDir}" style="direction:${fnDir}">${att.name}</span>
              <span class="file-size">${formatBytes(att.size)}</span>
            </div>
          </div>
          <div class="file-actions"></div>
        `;
        top.querySelector(".file-info").addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("open_attachment", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const acts = top.querySelector(".file-actions");
        const folderBtn = document.createElement("button");
        folderBtn.className = "file-mini-btn";
        folderBtn.title = t("showInFolder");
        folderBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        folderBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("reveal_in_explorer", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const delBtn = document.createElement("button");
        delBtn.className = "file-mini-btn del";
        delBtn.title = t("actDelete");
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeAttachment(node, att.id);
        });

        acts.appendChild(folderBtn);
        acts.appendChild(delBtn);

        const aud = document.createElement("audio");
        aud.controls = true;
        aud.preload = "metadata";
        bindMediaSource(aud, att);

        card.appendChild(top);
        card.appendChild(aud);
        voiceBox.appendChild(card);
      });
      el.appendChild(voiceBox);
    }

    // 8. Attached Files (with crisp SVG icons and Remove button that brings back Upload File slot on File nodes!)
    if (files.length > 0) {
      const fileBox = document.createElement("div");
      fileBox.className = "node-files";
      files.forEach((att) => {
        const card = document.createElement("div");
        card.className = "node-file-card";
        const info = document.createElement("div");
        info.className = "file-info";
        const fnDir = detectDir(att.name);
        info.innerHTML = `
          <span class="file-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <div class="file-meta">
            <span class="file-name" dir="${fnDir}" style="direction:${fnDir}">${att.name}</span>
            <span class="file-size">${formatBytes(att.size)}</span>
          </div>
        `;
        info.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("open_attachment", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const acts = document.createElement("div");
        acts.className = "file-actions";

        const folderBtn = document.createElement("button");
        folderBtn.className = "file-mini-btn";
        folderBtn.title = t("showInFolder");
        folderBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        folderBtn.addEventListener("mousedown", (ev) => ev.stopPropagation());
        folderBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await invoke("reveal_in_explorer", { path: att.path });
          } catch (err) {
            showToast(String(err));
          }
        });

        const delBtn = document.createElement("button");
        delBtn.className = "file-mini-btn del";
        delBtn.title = t("actDelete");
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        delBtn.addEventListener("mousedown", (ev) => ev.stopPropagation());
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeAttachment(node, att.id);
        });

        acts.appendChild(folderBtn);
        acts.appendChild(delBtn);
        card.appendChild(info);
        card.appendChild(acts);
        fileBox.appendChild(card);
      });
      el.appendChild(fileBox);
    }

    // 9. Four-Directional Quick-Add & Drop-Target Handles (+ on Right, Left, Down, Up)
    const dirs = [
      { dir: "right", cls: "quick-add-right", tip: t("ctxAddRight") },
      { dir: "left", cls: "quick-add-left", tip: t("ctxAddLeft") },
      { dir: "down", cls: "quick-add-down", tip: t("ctxAddDown") },
      { dir: "up", cls: "quick-add-up", tip: t("ctxAddUp") }
    ];
    dirs.forEach((d) => {
      const btn = document.createElement("button");
      btn.className = `quick-add-handle ${d.cls}`;
      btn.dataset.nodeId = node.id;
      btn.dataset.dir = d.dir;
      btn.textContent = "+";
      btn.title = d.tip;
      btn.addEventListener("mousedown", (ev) => ev.stopPropagation());
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openAddTypePopover(btn, node.id, d.dir, "child");
      });

      // Allow dropping external files onto a specific + handle to create a branch on that side!
      btn.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        btn.classList.add("drop-target-active");
      });
      btn.addEventListener("dragleave", () => {
        btn.classList.remove("drop-target-active");
      });
      btn.addEventListener("drop", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        btn.classList.remove("drop-target-active");
        if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
          const firstFile = ev.dataTransfer.files[0];
          const fType = (firstFile.type || "").toLowerCase();
          const isImg = fType.startsWith("image/");
          const isVid = fType.startsWith("video/");
          const isAud = fType.startsWith("audio/");
          const targetNType = isImg
            ? "image"
            : isVid
            ? "video"
            : isAud
            ? "voice"
            : "file";
          const newChild = createChildBranchWithoutEdit(
            node.id,
            d.dir,
            "",
            targetNType
          );
          if (newChild) {
            await handleDroppedFiles(newChild, ev.dataTransfer.files);
          }
        }
      });

      el.appendChild(btn);
    });

    // 10. Collapse / Expand Badge
    if (node.children && node.children.length > 0) {
      const badge = document.createElement("button");
      badge.className = "collapse-badge";
      const hiddenCount = countDescendants(node);
      badge.textContent = node.collapsed ? `+${hiddenCount}` : "−";
      badge.style.bottom = "-10px";
      badge.style.right = "12px";
      badge.addEventListener("mousedown", (ev) => ev.stopPropagation());
      badge.addEventListener("click", (ev) => {
        ev.stopPropagation();
        toggleCollapseNode(node.id);
      });
      el.appendChild(badge);
    }

    // Node Interactions: Instant Single-Motion Select & Drag (No 2-click required!), Multi-Select, Double-Click Edit
    el.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      hideAllPopovers();
      if (editingNodeId === node.id || editingNoteNodeId === node.id) return;

      if (ev.ctrlKey || ev.shiftKey) {
        if (selectedNodeIds.has(node.id)) {
          selectedNodeIds.delete(node.id);
          if (selectedNodeId === node.id) {
            selectedNodeId = Array.from(selectedNodeIds)[0] || null;
          }
        } else {
          selectedNodeIds.add(node.id);
          selectedNodeId = node.id;
        }
        syncSelectionClassesInPlace();
      } else {
        if (!selectedNodeIds.has(node.id)) {
          selectSingleNode(node.id);
          syncSelectionClassesInPlace();
        } else {
          selectedNodeId = node.id;
          syncSelectionClassesInPlace();
        }
      }

      // Prepare instant drag for all selected nodes (or this node) on the very first press!
      const draggedIds =
        selectedNodeIds.has(node.id) && selectedNodeIds.size > 0
          ? Array.from(selectedNodeIds)
          : [node.id];
      const origOffsets = new Map();
      draggedIds.forEach((id) => {
        const nObj = findNode(board.root, id);
        if (nObj) {
          origOffsets.set(id, { dx: nObj.dx || 0, dy: nObj.dy || 0 });
        }
      });

      dragNodeState = {
        nodeId: node.id,
        draggedIds,
        origOffsets,
        isRoot,
        startX: ev.clientX,
        startY: ev.clientY,
        moved: false
      };
    });

    el.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      selectSingleNode(node.id);
      editingNodeId = node.id;
      renderCanvas();
    });

    el.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!selectedNodeIds.has(node.id)) {
        selectSingleNode(node.id);
      } else {
        selectedNodeId = node.id;
      }
      syncSelectionClassesInPlace();
      openNodeContextMenu(ev.clientX, ev.clientY, node, isRoot);
    });

    el.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      el.classList.add("drag-over");
    });

    el.addEventListener("dragleave", () => {
      el.classList.remove("drag-over");
    });

    el.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      el.classList.remove("drag-over");
      selectSingleNode(node.id);
      if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        await handleDroppedFiles(node, ev.dataTransfer.files);
      }
    });

    return el;
  }

  function renderCanvas() {
    const board = getActiveBoard();
    if (!board || !board.root) return;

    nodesLayer.innerHTML = "";
    connectionsSvg.innerHTML = "";

    const domMap = new Map();
    const sizeMap = new Map();

    function createVisibleNodes(n, isRoot) {
      const dom = buildNodeDOM(n, isRoot, board);
      dom.style.visibility = "hidden";
      nodesLayer.appendChild(dom);
      domMap.set(n.id, dom);
      if (!n.collapsed && n.children) {
        n.children.forEach((c) => createVisibleNodes(c, false));
      }
    }
    createVisibleNodes(board.root, true);

    domMap.forEach((dom, id) => {
      sizeMap.set(id, {
        w: dom.offsetWidth || 165,
        h: dom.offsetHeight || 46
      });
    });

    currentDomMap = domMap;
    currentSizeMap = sizeMap;
    layoutPositions = computeTreeLayout(board, sizeMap);

    layoutPositions.forEach((pos, id) => {
      const dom = domMap.get(id);
      if (dom) {
        dom.style.left = `${Math.round(pos.x)}px`;
        dom.style.top = `${Math.round(pos.y)}px`;
        dom.style.visibility = "visible";
      }
    });

    drawConnections(board.root, board);
    updateViewportTransform();
    updateStatusbar();
  }

  // Fast in-place position & connector update during dragging (without destroying DOM nodes!)
  function updateCanvasPositionsInPlace() {
    const board = getActiveBoard();
    if (!board || !board.root) return;
    layoutPositions = computeTreeLayout(board, currentSizeMap);
    layoutPositions.forEach((pos, id) => {
      const dom = currentDomMap.get(id);
      if (dom) {
        dom.style.left = `${Math.round(pos.x)}px`;
        dom.style.top = `${Math.round(pos.y)}px`;
      }
    });
    connectionsSvg.innerHTML = "";
    drawConnections(board.root, board);
  }

  // Crisp Straight Orthogonal Connector Lines (Up-Right, Down-Right, Straight Right — NO soft curves!)
  function buildOrthogonalPathD(x1, y1, x2, y2, side, offset = 0) {
    const sx1 = Math.round(x1 + offset);
    const sy1 = Math.round(y1 + offset);
    const sx2 = Math.round(x2 + offset);
    const sy2 = Math.round(y2 + offset);

    if (side === "right" || side === "left") {
      if (Math.abs(sy2 - sy1) <= 2) {
        return `M ${sx1} ${sy1} L ${sx2} ${sy2}`;
      }
      const midX = Math.round(sx1 + (sx2 - sx1) * 0.45);
      return `M ${sx1} ${sy1} L ${midX} ${sy1} L ${midX} ${sy2} L ${sx2} ${sy2}`;
    } else {
      if (Math.abs(sx2 - sx1) <= 2) {
        return `M ${sx1} ${sy1} L ${sx2} ${sy2}`;
      }
      const midY = Math.round(sy1 + (sy2 - sy1) * 0.45);
      return `M ${sx1} ${sy1} L ${sx1} ${midY} L ${sx2} ${midY} L ${sx2} ${sy2}`;
    }
  }

  function drawConnections(root, board) {
    const SVG_OFFSET = 10000;

    function walk(parent) {
      if (!parent || parent.collapsed || !parent.children) return;
      const pPos = layoutPositions.get(parent.id);
      if (!pPos) return;

      parent.children.forEach((child) => {
        const cPos = layoutPositions.get(child.id);
        if (!cPos) return;

        let x1, y1, x2, y2;
        const side = cPos.side;

        if (side === "right") {
          x1 = pPos.x + pPos.w;
          y1 = pPos.y + pPos.h / 2;
          x2 = cPos.x;
          y2 = cPos.y + cPos.h / 2;
        } else if (side === "left") {
          x1 = pPos.x;
          y1 = pPos.y + pPos.h / 2;
          x2 = cPos.x + cPos.w;
          y2 = cPos.y + cPos.h / 2;
        } else if (side === "down") {
          x1 = pPos.x + pPos.w / 2;
          y1 = pPos.y + pPos.h;
          x2 = cPos.x + cPos.w / 2;
          y2 = cPos.y;
        } else {
          x1 = pPos.x + pPos.w / 2;
          y1 = pPos.y;
          x2 = cPos.x + cPos.w / 2;
          y2 = cPos.y + cPos.h;
        }

        const d = buildOrthogonalPathD(x1, y1, x2, y2, side, SVG_OFFSET);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "branch-path");
        path.setAttribute("stroke", child.color || parent.color || board.color || "#3b82f6");
        path.setAttribute("stroke-width", parent.id === board.root.id ? "2.2" : "1.8");
        path.setAttribute("stroke-opacity", "0.88");
        connectionsSvg.appendChild(path);

        walk(child);
      });
    }

    walk(root);
  }

  function updateStatusbar() {
    const board = getActiveBoard();
    if (!board) return;
    const stats = countBoardStats(board.root);
    if (selectedNodeIds.size > 1) {
      statNodes.textContent = `${selectedNodeIds.size} ${t("multiSelected")}`;
    } else {
      statNodes.textContent = `${stats.nodes} ${stats.nodes === 1 ? "node" : "nodes"}`;
    }
    statTasks.textContent =
      stats.tasks > 0 ? `${stats.tasksDone}/${stats.tasks} tasks` : "0 tasks";
    statDirection.textContent = board.layout || "balanced";

    const layoutKey =
      board.layout === "right"
        ? "layoutRight"
        : board.layout === "left"
        ? "layoutLeft"
        : board.layout === "down"
        ? "layoutDown"
        : "layoutBalanced";
    layoutChipName.textContent = t(layoutKey);

    const sel = findNode(board.root, selectedNodeId || board.root.id);
    if (sel) {
      actColorDot.style.background = sel.color || board.color || "var(--accent)";
      actTodo.classList.toggle("active", !!sel.hasTodo);
      actNote.classList.toggle("active", !!(sel.note && sel.note.trim()));

      // Update NotePrompt-style Align button icon and label
      const curAlign = EDITOR_ALIGNS.includes(sel.align) ? sel.align : "auto";
      if (actAlign) actAlign.classList.toggle("active", curAlign !== "auto");
      if (lblActAlign) {
        const alignKey =
          curAlign === "right"
            ? "actAlignRight"
            : curAlign === "center"
            ? "actAlignCenter"
            : curAlign === "left"
            ? "actAlignLeft"
            : "actAlignAuto";
        lblActAlign.textContent = t(alignKey);
      }
      if (alignIconMid && ALIGN_ICON_MID[curAlign]) {
        const [x1, x2] = ALIGN_ICON_MID[curAlign];
        alignIconMid.setAttribute("x1", x1);
        alignIconMid.setAttribute("x2", x2);
      }
    }
  }

  // --- + Branch Type Picker (Text / Image / Video / Voice / File boxes) & Node Operations ---
  function openAddTypePopover(anchorOrCoords, parentId, dir = null, mode = "child") {
    hideAllPopovers();
    pendingAddBranch = { parentId, dir, mode };
    if (!addTypePopover) {
      if (mode === "sibling") addSiblingNode("text");
      else addChildNode(parentId, dir, "text");
      return;
    }
    addTypePopover.classList.remove("hidden");
    const popRect = addTypePopover.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (anchorOrCoords && typeof anchorOrCoords.getBoundingClientRect === "function") {
      const r = anchorOrCoords.getBoundingClientRect();
      x = r.left + r.width / 2 - popRect.width / 2;
      y = r.bottom + 8;
      if (dir === "right") {
        x = r.right + 8;
        y = r.top + r.height / 2 - popRect.height / 2;
      } else if (dir === "left") {
        x = r.left - popRect.width - 8;
        y = r.top + r.height / 2 - popRect.height / 2;
      } else if (dir === "up") {
        x = r.left + r.width / 2 - popRect.width / 2;
        y = r.top - popRect.height - 8;
      }
    } else if (anchorOrCoords && typeof anchorOrCoords.x === "number") {
      x = anchorOrCoords.x;
      y = anchorOrCoords.y;
    }
    const clampedX = Math.min(window.innerWidth - popRect.width - 10, Math.max(8, x));
    const clampedY = Math.min(window.innerHeight - popRect.height - 10, Math.max(8, y));
    addTypePopover.style.left = `${Math.round(clampedX)}px`;
    addTypePopover.style.top = `${Math.round(clampedY)}px`;
  }

  function createChildBranchWithoutEdit(parentId, direction, titleText, nodeType = "text") {
    const board = getActiveBoard();
    if (!board) return null;
    const targetParent = findNode(board.root, parentId || selectedNodeId || board.root.id);
    if (!targetParent) return null;

    pushHistory();
    targetParent.collapsed = false;
    if (!targetParent.children) targetParent.children = [];

    const parentPos = layoutPositions.get(targetParent.id);
    const resolvedDir =
      direction ||
      targetParent.dir ||
      (parentPos && parentPos.side !== "root" ? parentPos.side : null);

    const color =
      targetParent.id === board.root.id
        ? BRANCH_COLORS[targetParent.children.length % BRANCH_COLORS.length]
        : targetParent.color || board.color || "#3b82f6";

    const defaultText =
      nodeType === "image" ||
      nodeType === "video" ||
      nodeType === "voice" ||
      nodeType === "file"
        ? titleText || ""
        : titleText || t("newBranchText");

    const newChild = {
      id: uid("node"),
      nodeType: nodeType || "text",
      text: defaultText,
      note: "",
      color,
      hasTodo: false,
      checked: false,
      collapsed: false,
      dir: resolvedDir,
      dx: 0,
      dy: 0,
      attachments: [],
      children: []
    };

    targetParent.children.push(newChild);
    selectSingleNode(newChild.id);
    return newChild;
  }

  function addChildNode(parentId, direction = null, nodeType = "text") {
    const newChild = createChildBranchWithoutEdit(parentId, direction, "", nodeType);
    if (!newChild) return;
    editingNodeId = nodeType === "text" ? newChild.id : null;
    renderRail();
    renderCanvas();
    scheduleSave();
  }

  function addSiblingNode(nodeType = "text") {
    const board = getActiveBoard();
    if (!board) return;
    const targetId = selectedNodeId || board.root.id;
    if (targetId === board.root.id) {
      addChildNode(board.root.id, null, nodeType);
      return;
    }
    const found = findNodeAndParent(board.root, targetId);
    if (!found || !found.parent) return;

    pushHistory();
    const { node, parent } = found;
    const idx = parent.children.findIndex((c) => c.id === node.id);
    const newSibling = {
      id: uid("node"),
      nodeType: nodeType || "text",
      text: nodeType === "text" ? t("newSiblingText") : "",
      note: "",
      color: node.color || parent.color || "#3b82f6",
      hasTodo: nodeType === "text" ? node.hasTodo : false,
      checked: false,
      collapsed: false,
      dir: node.dir,
      dx: 0,
      dy: 0,
      attachments: [],
      children: []
    };
    parent.children.splice(idx + 1, 0, newSibling);
    selectSingleNode(newSibling.id);
    editingNodeId = nodeType === "text" ? newSibling.id : null;
    renderRail();
    renderCanvas();
    scheduleSave();
  }

  // Move / Re-parent one or more dragged nodes onto a target node's + side (Left, Right, Down, Up)
  function moveNodeToTargetSide(sourceNodeIds, targetNodeId, targetDir) {
    const board = getActiveBoard();
    if (!board) return;
    const ids = Array.isArray(sourceNodeIds) ? sourceNodeIds : [sourceNodeIds];
    const targetNode = findNode(board.root, targetNodeId);
    if (!targetNode) return;

    const validSources = [];
    ids.forEach((sid) => {
      if (sid === board.root.id || sid === targetNodeId) return;
      const srcFound = findNodeAndParent(board.root, sid);
      if (!srcFound || !srcFound.parent) return;
      if (isDescendantOrSelf(srcFound.node, targetNodeId)) return;
      validSources.push(srcFound);
    });
    if (validSources.length === 0) return;

    pushHistory();
    validSources.forEach(({ node: movedNode, parent }) => {
      const oldIdx = parent.children.findIndex((c) => c.id === movedNode.id);
      if (oldIdx !== -1) parent.children.splice(oldIdx, 1);

      if (targetDir && ["left", "right", "down", "up"].includes(targetDir)) {
        function propagateDir(n, d) {
          n.dir = d;
          n.dx = 0;
          n.dy = 0;
          (n.children || []).forEach((ch) => propagateDir(ch, d));
        }
        propagateDir(movedNode, targetDir);
      } else {
        movedNode.dx = 0;
        movedNode.dy = 0;
      }

      targetNode.collapsed = false;
      if (!targetNode.children) targetNode.children = [];
      targetNode.children.push(movedNode);
    });

    selectSingleNode(validSources[0].node.id);
    renderRail();
    renderCanvas();
    scheduleSave();
    showToast(`${t("toastMovedDir")} (${targetDir || "child"})`);
  }

  function deleteSelectedNode() {
    const board = getActiveBoard();
    if (!board) return;
    const targets =
      selectedNodeIds.size > 0
        ? Array.from(selectedNodeIds)
        : selectedNodeId
        ? [selectedNodeId]
        : [];
    const deletable = targets.filter((id) => id && id !== board.root.id);
    if (deletable.length === 0) {
      if (targets.includes(board.root.id)) showToast(t("toastRootCannotDelete"));
      return;
    }

    pushHistory();
    let nextSelectId = board.root.id;
    deletable.forEach((id) => {
      const found = findNodeAndParent(board.root, id);
      if (found && found.parent) {
        nextSelectId = found.parent.id;
        const idx = found.parent.children.findIndex((c) => c.id === id);
        if (idx !== -1) found.parent.children.splice(idx, 1);
      }
    });
    selectSingleNode(nextSelectId);
    renderRail();
    renderCanvas();
    scheduleSave();
  }

  function toggleCollapseNode(nodeId) {
    const board = getActiveBoard();
    if (!board) return;
    const node = findNode(board.root, nodeId || selectedNodeId);
    if (!node || !node.children || node.children.length === 0) return;
    node.collapsed = !node.collapsed;
    renderCanvas();
    scheduleSave();
  }

  function expandAllNodes() {
    const board = getActiveBoard();
    if (!board) return;
    function walk(n) {
      n.collapsed = false;
      (n.children || []).forEach(walk);
    }
    walk(board.root);
    renderCanvas();
    scheduleSave();
  }

  function resetAutoLayout() {
    const board = getActiveBoard();
    if (!board) return;
    pushHistory();
    function clearOffsets(n) {
      n.dx = 0;
      n.dy = 0;
      (n.children || []).forEach(clearOffsets);
    }
    clearOffsets(board.root);
    renderCanvas();
    fitCanvasToNodes();
    scheduleSave();
    showToast(t("toastAutoArranged"));
  }

  // --- Attachments (Images, Videos, Voices/Audio & Files) ---
  function isImageAttachment(att) {
    if (!att) return false;
    if (att.is_image) return true;
    const ext = String(att.ext || "").toLowerCase();
    return ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
  }

  function isVideoAttachment(att) {
    if (!att || isImageAttachment(att)) return false;
    if (att.is_video) return true;
    const ext = String(att.ext || "").toLowerCase();
    return ["mp4", "webm", "mkv", "mov", "avi", "m4v", "ogv"].includes(ext) && !att.is_audio;
  }

  function isAudioAttachment(att) {
    if (!att || isImageAttachment(att)) return false;
    if (att.is_audio) return true;
    const ext = String(att.ext || "").toLowerCase();
    return ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "weba", "wma"].includes(ext);
  }

  function formatRecTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  // Loads local video/audio files into a fast cached Blob URL so <video> and <audio> support full seeking & playback in WebView2
  async function bindMediaSource(mediaEl, att) {
    if (!mediaEl || !att) return;
    if (att.data_url) {
      mediaEl.src = att.data_url;
      return;
    }
    if (mediaBlobUrlCache.has(att.path)) {
      mediaEl.src = mediaBlobUrlCache.get(att.path);
      return;
    }
    try {
      const dataUrl = await invoke("read_media_base64", { path: att.path });
      if (dataUrl) {
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        mediaBlobUrlCache.set(att.path, blobUrl);
        mediaEl.src = blobUrl;
      }
    } catch (e) {
      mediaEl.src = att.path;
    }
  }

  async function attachImageToNode(targetNode) {
    const board = getActiveBoard();
    const node = targetNode || (board && findNode(board.root, selectedNodeId || board.root.id));
    if (!node) return;
    try {
      const att = await invoke("pick_image_dialog");
      if (att) {
        pushHistory();
        if (!node.attachments) node.attachments = [];
        node.attachments.push(att);
        renderCanvas();
        scheduleSave();
        showToast(t("toastImageAdded"));
      }
    } catch (e) {
      showToast(String(e));
    }
  }

  async function attachVideoToNode(targetNode) {
    const board = getActiveBoard();
    const node = targetNode || (board && findNode(board.root, selectedNodeId || board.root.id));
    if (!node) return;
    try {
      const att = await invoke("pick_video_dialog");
      if (att) {
        pushHistory();
        if (!node.attachments) node.attachments = [];
        node.attachments.push(att);
        renderCanvas();
        scheduleSave();
        showToast(t("toastVideoAdded"));
      }
    } catch (e) {
      showToast(String(e));
    }
  }

  async function attachAudioToNode(targetNode) {
    const board = getActiveBoard();
    const node = targetNode || (board && findNode(board.root, selectedNodeId || board.root.id));
    if (!node) return;
    try {
      const att = await invoke("pick_audio_dialog");
      if (att) {
        pushHistory();
        if (!node.attachments) node.attachments = [];
        node.attachments.push(att);
        renderCanvas();
        scheduleSave();
        showToast(t("toastVoiceAdded"));
      }
    } catch (e) {
      showToast(String(e));
    }
  }

  async function toggleVoiceRecording(targetNode, recBtnEl) {
    const board = getActiveBoard();
    const node = targetNode || (board && findNode(board.root, selectedNodeId || board.root.id));
    if (!node) return;

    // If currently recording, stop and save!
    if (activeVoiceRecorder && activeVoiceRecorder.recorder) {
      try {
        activeVoiceRecorder.recorder.stop();
      } catch (e) {}
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      attachAudioToNode(node);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        if (activeVoiceRecorder && activeVoiceRecorder.timerId) {
          clearInterval(activeVoiceRecorder.timerId);
        }
        stream.getTracks().forEach((tr) => tr.stop());
        const targetNodeId = activeVoiceRecorder ? activeVoiceRecorder.nodeId : node.id;
        activeVoiceRecorder = null;

        if (chunks.length === 0) {
          renderCanvas();
          return;
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const ext = (recorder.mimeType || "").includes("ogg") ? "ogg" : "webm";
        const fileName = `voice_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.${ext}`;

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const att = await invoke("save_dropped_file", {
              name: fileName,
              base64Data: reader.result,
              isImage: false,
              isVideo: false,
              isAudio: true
            });
            if (att) {
              const curBoard = getActiveBoard();
              const destNode = (curBoard && findNode(curBoard.root, targetNodeId)) || node;
              pushHistory();
              if (!destNode.attachments) destNode.attachments = [];
              destNode.attachments.push(att);
              renderCanvas();
              scheduleSave();
              showToast(t("toastVoiceAdded"));
            }
          } catch (err) {
            showToast(String(err));
            renderCanvas();
          }
        };
        reader.readAsDataURL(blob);
      };

      activeVoiceRecorder = {
        nodeId: node.id,
        recorder,
        stream,
        seconds: 0,
        timerId: null
      };

      recorder.start();
      if (recBtnEl) {
        recBtnEl.classList.add("recording");
        recBtnEl.innerHTML = `<span>● 00:00 ${t("btnStopRecord")}</span>`;
      }
      activeVoiceRecorder.timerId = setInterval(() => {
        if (!activeVoiceRecorder) return;
        activeVoiceRecorder.seconds += 1;
        const dom = currentDomMap && currentDomMap.get(activeVoiceRecorder.nodeId);
        const btn = dom && dom.querySelector('[data-act="record"]');
        if (btn) {
          btn.classList.add("recording");
          btn.innerHTML = `<span>● ${formatRecTime(activeVoiceRecorder.seconds)} ${t("btnStopRecord")}</span>`;
        }
      }, 1000);
    } catch (err) {
      // Fallback to audio file picker if no microphone permission/device
      attachAudioToNode(node);
    }
  }

  async function attachFileToNode(targetNode) {
    const board = getActiveBoard();
    const node = targetNode || (board && findNode(board.root, selectedNodeId || board.root.id));
    if (!node) return;
    try {
      const att = await invoke("pick_file_dialog");
      if (att) {
        pushHistory();
        if (!node.attachments) node.attachments = [];
        node.attachments.push(att);
        renderCanvas();
        scheduleSave();
        showToast(t("toastFileAdded"));
      }
    } catch (e) {
      showToast(String(e));
    }
  }

  function removeAttachment(node, attId) {
    pushHistory();
    node.attachments = (node.attachments || []).filter((a) => a.id !== attId);
    renderCanvas();
    scheduleSave();
  }

  async function handleDroppedFiles(targetNode, fileList) {
    for (const file of Array.from(fileList)) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async () => {
          try {
            const fType = (file.type || "").toLowerCase();
            const isImg = fType.startsWith("image/");
            const isVid = fType.startsWith("video/");
            const isAud = fType.startsWith("audio/");
            const att = await invoke("save_dropped_file", {
              name:
                file.name ||
                (isImg
                  ? "pasted_image.png"
                  : isVid
                  ? "video.mp4"
                  : isAud
                  ? "voice.webm"
                  : "file.bin"),
              base64Data: reader.result,
              isImage: isImg,
              isVideo: isVid,
              isAudio: isAud
            });
            if (att) {
              pushHistory();
              if (!targetNode.attachments) targetNode.attachments = [];
              targetNode.attachments.push(att);
            }
          } catch (err) {
            showToast(String(err));
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    renderCanvas();
    scheduleSave();
    showToast(t("toastFileAdded"));
  }

  function openLightbox(att) {
    currentLightboxAtt = att;
    lightboxTitle.textContent = att.name || "Image Preview";
    lightboxImg.src = att.data_url || att.path;
    lightboxModal.classList.remove("hidden");
  }

  // --- AI Mind Map Generator & NotePrompt AI Sync ---
  function getActiveAiProviderId() {
    const p = state.ai && state.ai.provider;
    return AI_PROVIDERS[p] ? p : "openrouter";
  }

  function getActiveAiKey() {
    const id = getActiveAiProviderId();
    const meta = AI_PROVIDERS[id];
    return (state.ai && state.ai[meta.keyField]) || "";
  }

  function syncAiSettingsUI() {
    const id = getActiveAiProviderId();
    const meta = AI_PROVIDERS[id];
    aiProviderSelect.value = id;
    aiApiKeyInput.placeholder = meta.placeholder;
    aiApiKeyInput.value = getActiveAiKey();

    aiCustomRows.classList.toggle("hidden", id !== "custom");
    if (id === "custom") {
      aiCustomUrlInput.value = state.ai.customUrl || "";
      aiCustomModelsInput.value = state.ai.customModels || "";
    }

    // Populate Models Select
    const cached =
      state.ai.modelCache && Array.isArray(state.ai.modelCache[id])
        ? state.ai.modelCache[id]
        : null;
    const models =
      id === "custom"
        ? String(state.ai.customModels || "")
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : cached && cached.length > 0
        ? cached
        : meta.models;

    aiModelSelect.innerHTML = "";
    const autoOpt = document.createElement("option");
    autoOpt.value = "auto";
    autoOpt.textContent = "Auto (Recommended)";
    aiModelSelect.appendChild(autoOpt);

    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      aiModelSelect.appendChild(opt);
    });

    aiModelSelect.value =
      state.ai.model && (state.ai.model === "auto" || models.includes(state.ai.model))
        ? state.ai.model
        : "auto";
  }

  async function tryAutoSyncNotePromptAi(silent = false) {
    try {
      const ppAi = await invoke("load_noteprompt_ai");
      if (ppAi && typeof ppAi === "object") {
        let foundAnyKey = false;
        ["openrouterKey", "googleKey", "openaiKey", "anthropicKey", "customKey"].forEach((k) => {
          if (ppAi[k] && typeof ppAi[k] === "string" && ppAi[k].trim()) {
            state.ai[k] = ppAi[k].trim();
            foundAnyKey = true;
          }
        });
        if (ppAi.provider && AI_PROVIDERS[ppAi.provider]) {
          state.ai.provider = ppAi.provider;
        }
        if (ppAi.customUrl) state.ai.customUrl = ppAi.customUrl;
        if (ppAi.customModels) state.ai.customModels = ppAi.customModels;
        syncAiSettingsUI();
        scheduleSave();
        if (!silent) {
          showToast(foundAnyKey ? t("toastSyncedAi") : t("toastNoNotePromptAi"));
        }
        return foundAnyKey;
      } else if (!silent) {
        showToast(t("toastNoNotePromptAi"));
      }
    } catch (e) {
      if (!silent) showToast(t("toastNoNotePromptAi"));
    }
    return false;
  }

  async function refreshModelsFromProvider() {
    const id = getActiveAiProviderId();
    const meta = AI_PROVIDERS[id];
    const apiKey = getActiveAiKey().trim();
    let url = meta.modelsUrl;
    if (id === "custom") {
      const base = (state.ai.customUrl || "").trim();
      if (!base) return;
      url = base.replace(/\/chat\/completions\/?$/, "/models");
    }
    if (!url) return;

    aiModelRefreshBtn.textContent = "…";
    try {
      const headers = {};
      if (meta.family === "anthropic") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      } else if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      const resp = await fetch(url, { headers });
      const json = await resp.json();
      const raw = json && (json.data || json.models);
      if (Array.isArray(raw) && raw.length > 0) {
        const list = raw
          .map((m) => String((m && (m.id || m.name)) || "").replace(/^models\//, "").trim())
          .filter((m) => m && !/embed|whisper|tts|audio|dall-e|imagen|moderation/i.test(m));
        if (list.length > 0) {
          if (!state.ai.modelCache) state.ai.modelCache = {};
          state.ai.modelCache[id] = list;
          syncAiSettingsUI();
          scheduleSave();
          showToast(`Loaded ${list.length} models`);
        }
      }
    } catch (e) {
      showToast("Could not fetch models — check API key");
    } finally {
      aiModelRefreshBtn.textContent = "↻";
    }
  }

  function openAiModal(defaultTarget = "new") {
    aiTargetMode = defaultTarget;
    aiTargetSeg.querySelectorAll(".seg-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.target === aiTargetMode);
    });
    aiModalStatus.classList.add("hidden");
    aiModal.classList.remove("hidden");
    applyLiveInputDir(aiPromptTextarea);
    setTimeout(() => aiPromptTextarea.focus(), 20);
  }

  async function callAiForMindMap(userPrompt) {
    const id = getActiveAiProviderId();
    const meta = AI_PROVIDERS[id];
    const apiKey = getActiveAiKey().trim();

    if (id !== "custom" && !apiKey) {
      throw new Error(
        state.lang === "fa"
          ? "لطفاً ابتدا کلید API هوش مصنوعی را در Settings وارد کنید یا از NotePrompt لینک کنید."
          : "Please add your AI API key in Settings → AI (or click Sync from NotePrompt)."
      );
    }

    const url = id === "custom" ? (state.ai.customUrl || "").trim() : meta.url;
    const availableModels =
      id === "custom"
        ? String(state.ai.customModels || "")
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : state.ai.model && state.ai.model !== "auto"
        ? [state.ai.model]
        : meta.models;

    if (!url || availableModels.length === 0) {
      throw new Error("Please configure AI endpoint and model in Settings.");
    }

    const systemPrompt = `You are an expert Mind Map architect.
Given the user's topic or prompt, return ONLY a valid JSON object representing a structured, multi-level Mind Map tree.
Do NOT wrap the JSON in markdown fences or add any explanation outside the JSON.
Write all node texts and notes in the SAME language as the user's prompt (e.g. Persian if the prompt is in Persian, English if English).

JSON Schema:
{
  "title": "Central Topic Title",
  "note": "Brief summary note",
  "children": [
    {
      "text": "Main Branch 1",
      "dir": "right",
      "note": "Optional short note",
      "hasTodo": false,
      "children": [
        { "text": "Sub-item 1.1", "hasTodo": true, "children": [] },
        { "text": "Sub-item 1.2", "hasTodo": true, "children": [] }
      ]
    },
    {
      "text": "Main Branch 2",
      "dir": "left",
      "children": [...]
    }
  ]
}
Rules:
- Create 4 to 6 main branches under the root, alternating "dir": "right" and "dir": "left" (and optionally "down").
- Each main branch should have 2 to 4 meaningful sub-branches (and deeper sub-branches where helpful).
- Return ONLY raw valid JSON.`;

    let lastErr = "AI request failed.";
    for (const model of availableModels) {
      try {
        let resp;
        if (meta.family === "anthropic") {
          resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              ...meta.headers
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              system: systemPrompt,
              messages: [{ role: "user", content: userPrompt }]
            })
          });
        } else {
          const headers = {
            "Content-Type": "application/json",
            ...meta.headers
          };
          if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
          resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model,
              temperature: 0.6,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ]
            })
          });
        }

        const json = await resp.json();
        if (!resp.ok) {
          lastErr =
            (json && json.error && (json.error.message || json.error)) ||
            `HTTP ${resp.status}`;
          if (resp.status === 429 || resp.status >= 500 || resp.status === 404) {
            continue; // try next model in auto mode
          }
          throw new Error(String(lastErr));
        }

        let rawText = "";
        if (meta.family === "anthropic") {
          const blk = (json.content || []).find((b) => b.type === "text");
          rawText = blk ? blk.text : "";
        } else {
          rawText =
            json &&
            json.choices &&
            json.choices[0] &&
            json.choices[0].message &&
            json.choices[0].message.content;
        }

        if (!rawText) throw new Error("Empty response from AI.");

        // Extract JSON object cleanly even if model included ```json fences
        const cleaned = rawText
          .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, "$1")
          .trim();
        return JSON.parse(cleaned);
      } catch (err) {
        lastErr = err.message || String(err);
      }
    }
    throw new Error(lastErr);
  }

  function convertAiTreeToNodes(aiData, inheritedColor, inheritedDir, depth = 0) {
    const text = aiData.title || aiData.text || "Branch";
    const dir =
      aiData.dir && ["left", "right", "down", "up"].includes(aiData.dir)
        ? aiData.dir
        : inheritedDir;
    const color = aiData.color || inheritedColor || "#3b82f6";

    const rawChildren = Array.isArray(aiData.children) ? aiData.children : [];
    const children = rawChildren.map((c, idx) => {
      const childColor =
        depth === 0 ? BRANCH_COLORS[(idx + 1) % BRANCH_COLORS.length] : color;
      const childDir =
        depth === 0
          ? c.dir || (idx % 2 === 0 ? "right" : "left")
          : c.dir || dir;
      return convertAiTreeToNodes(c, childColor, childDir, depth + 1);
    });

    return {
      id: uid("node"),
      text,
      note: aiData.note || "",
      color,
      hasTodo: !!aiData.hasTodo,
      checked: !!aiData.checked,
      collapsed: false,
      dir: depth === 0 ? null : dir,
      dx: 0,
      dy: 0,
      attachments: [],
      children
    };
  }

  async function handleAiGenerateSubmit() {
    const prompt = aiPromptTextarea.value.trim();
    if (!prompt) {
      aiPromptTextarea.focus();
      return;
    }

    aiModalStatus.textContent = t("aiGenerating");
    aiModalStatus.classList.remove("hidden", "error");
    aiGenerateSubmitBtn.disabled = true;

    try {
      const aiTree = await callAiForMindMap(prompt);

      if (aiTargetMode === "expand") {
        const board = getActiveBoard();
        const targetNode = findNode(board.root, selectedNodeId || board.root.id);
        if (targetNode) {
          pushHistory();
          const pos = layoutPositions.get(targetNode.id);
          const baseDir =
            targetNode.dir || (pos && pos.side !== "root" ? pos.side : null);
          const converted = convertAiTreeToNodes(
            aiTree,
            targetNode.color || board.color,
            baseDir,
            targetNode.id === board.root.id ? 0 : 1
          );
          if (!targetNode.children) targetNode.children = [];
          if (converted.children && converted.children.length > 0) {
            targetNode.children.push(...converted.children);
          } else {
            targetNode.children.push(converted);
          }
          targetNode.collapsed = false;
          renderRail();
          renderCanvas();
          fitCanvasToNodes();
          scheduleSave();
        }
      } else {
        const rootNode = convertAiTreeToNodes(aiTree, "#3b82f6", null, 0);
        const newBoard = {
          id: uid("board"),
          title: rootNode.text || prompt.slice(0, 28),
          color: "#3b82f6",
          layout: "balanced",
          panX: 0,
          panY: 0,
          zoom: 1,
          root: rootNode
        };
        state.boards.push(newBoard);
        switchBoard(newBoard.id);
        setTimeout(fitCanvasToNodes, 40);
      }

      aiModal.classList.add("hidden");
      aiPromptTextarea.value = "";
      showToast(t("toastAiSuccess"));
    } catch (err) {
      aiModalStatus.textContent = err.message || String(err);
      aiModalStatus.classList.add("error");
      aiModalStatus.classList.remove("hidden");
    } finally {
      aiGenerateSubmitBtn.disabled = false;
    }
  }

  // --- Popovers & Context Menus ---
  function hideAllPopovers() {
    colorPopover.classList.add("hidden");
    layoutPopover.classList.add("hidden");
    contextMenu.classList.add("hidden");
    if (addTypePopover) addTypePopover.classList.add("hidden");
  }

  function positionPopover(popEl, x, y) {
    popEl.classList.remove("hidden");
    const rect = popEl.getBoundingClientRect();
    const clampedX = Math.min(window.innerWidth - rect.width - 10, Math.max(8, x));
    const clampedY = Math.min(window.innerHeight - rect.height - 10, Math.max(8, y));
    popEl.style.left = `${clampedX}px`;
    popEl.style.top = `${clampedY}px`;
  }

  function openNodeContextMenu(x, y, node, isRoot) {
    hideAllPopovers();
    const curAlign = EDITOR_ALIGNS.includes(node.align) ? node.align : "auto";
    const lblDir = resolveBlockDir(node.text || "", curAlign);
    contextMenu.innerHTML = `
      <div class="ctx-label" dir="${lblDir}"></div>
      <div class="ctx-item" data-act="child-right"><span>${t("ctxAddRight")}</span></div>
      <div class="ctx-item" data-act="child-left"><span>${t("ctxAddLeft")}</span></div>
      <div class="ctx-item" data-act="child-down"><span>${t("ctxAddDown")}</span></div>
      <div class="ctx-item" data-act="child-up"><span>${t("ctxAddUp")}</span></div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" data-act="ai-inline"><span>✨ ${t("tipNodeAi")}</span></div>
      <div class="ctx-item" data-act="ai-expand"><span>✨ ${t("aiTargetExpand")}</span></div>
      <div class="ctx-item" data-act="edit"><span>${t("ctxEdit")}</span></div>
      <div class="ctx-item" data-act="note"><span>${t("ctxNote")}</span></div>
      <div class="ctx-item" data-act="todo"><span>${t("ctxTodo")}</span></div>
      <div class="ctx-item" data-act="image"><span>${t("ctxImage")}</span></div>
      <div class="ctx-item" data-act="video"><span>${t("ctxVideo")}</span></div>
      <div class="ctx-item" data-act="voice"><span>${t("ctxVoice")}</span></div>
      <div class="ctx-item" data-act="file"><span>${t("ctxFile")}</span></div>
      <div class="ctx-sep"></div>
      <div class="ctx-item ${curAlign === "auto" ? "active" : ""}" data-act="align-auto"><span>${t("ctxAlignAuto")}</span></div>
      <div class="ctx-item ${curAlign === "right" ? "active" : ""}" data-act="align-right"><span>${t("ctxAlignRight")}</span></div>
      <div class="ctx-item ${curAlign === "center" ? "active" : ""}" data-act="align-center"><span>${t("ctxAlignCenter")}</span></div>
      <div class="ctx-item ${curAlign === "left" ? "active" : ""}" data-act="align-left"><span>${t("ctxAlignLeft")}</span></div>
      ${
        node.dx || node.dy
          ? `<div class="ctx-sep"></div><div class="ctx-item" data-act="reset-pos"><span>${t("ctxResetPos")}</span></div>`
          : ""
      }
      ${
        !isRoot
          ? `<div class="ctx-sep"></div>
             <div class="ctx-item ctx-danger" data-act="delete"><span>${t("ctxDelete")}</span></div>`
          : ""
      }
    `;
    const lblEl = contextMenu.querySelector(".ctx-label");
    if (lblEl) lblEl.textContent = (node.text || "Branch").slice(0, 26);

    positionPopover(contextMenu, x, y);

    contextMenu.querySelectorAll(".ctx-item").forEach((item) => {
      item.addEventListener("click", () => {
        const act = item.dataset.act;
        hideAllPopovers();
        if (act === "child-right") openAddTypePopover({ x, y }, node.id, "right", "child");
        else if (act === "child-left") openAddTypePopover({ x, y }, node.id, "left", "child");
        else if (act === "child-down") openAddTypePopover({ x, y }, node.id, "down", "child");
        else if (act === "child-up") openAddTypePopover({ x, y }, node.id, "up", "child");
        else if (act === "ai-inline") {
          aiInlineNodeId = node.id;
          renderCanvas();
        } else if (act === "ai-expand") openAiModal("expand");
        else if (act === "edit") {
          editingNodeId = node.id;
          renderCanvas();
        } else if (act === "note") {
          editingNoteNodeId = node.id;
          renderCanvas();
        } else if (act === "todo") {
          pushHistory();
          const board = getActiveBoard();
          const targets = getSelectedNodeList(board);
          const nextTodo = !node.hasTodo;
          if (targets.length > 1) {
            targets.forEach((tNode) => {
              tNode.hasTodo = nextTodo;
            });
          } else {
            node.hasTodo = nextTodo;
          }
          renderCanvas();
          scheduleSave();
        } else if (act === "image") attachImageToNode(node);
        else if (act === "video") attachVideoToNode(node);
        else if (act === "voice") attachAudioToNode(node);
        else if (act === "file") attachFileToNode(node);
        else if (act === "align-auto") setNodeAlign(node.id, "auto");
        else if (act === "align-right") setNodeAlign(node.id, "right");
        else if (act === "align-center") setNodeAlign(node.id, "center");
        else if (act === "align-left") setNodeAlign(node.id, "left");
        else if (act === "reset-pos") {
          pushHistory();
          node.dx = 0;
          node.dy = 0;
          renderCanvas();
          scheduleSave();
        } else if (act === "delete") deleteSelectedNode();
      });
    });
  }

  function openTabContextMenu(x, y, board) {
    hideAllPopovers();
    const lblDir = resolveBlockDir(board.title || "", "auto");
    contextMenu.innerHTML = `
      <div class="ctx-label" dir="${lblDir}"></div>
      <div class="ctx-item" data-act="rename">${t("ctxRenameMap")}</div>
      <div class="ctx-item" data-act="duplicate">${t("ctxDuplicateMap")}</div>
      <div class="ctx-sep"></div>
      <div class="color-swatch-grid" id="tabColorSwatches"></div>
      ${
        state.boards.length > 1
          ? `<div class="ctx-sep"></div>
             <div class="ctx-item ctx-danger" data-act="delete">${t("ctxDeleteMap")}</div>`
          : ""
      }
    `;
    const lblEl = contextMenu.querySelector(".ctx-label");
    if (lblEl) lblEl.textContent = board.title;

    const swatchContainer = contextMenu.querySelector("#tabColorSwatches");
    BRANCH_COLORS.forEach((c) => {
      const s = document.createElement("button");
      s.className = "color-swatch-btn" + (board.color === c ? " active" : "");
      s.style.background = c;
      s.addEventListener("click", () => {
        board.color = c;
        hideAllPopovers();
        renderRail();
        renderCanvas();
        scheduleSave();
      });
      swatchContainer.appendChild(s);
    });

    positionPopover(contextMenu, x, y);

    contextMenu.querySelectorAll(".ctx-item").forEach((item) => {
      item.addEventListener("click", () => {
        const act = item.dataset.act;
        hideAllPopovers();
        if (act === "rename") {
          renamingBoardId = board.id;
          renderRail();
        } else if (act === "duplicate") {
          const copy = JSON.parse(JSON.stringify(board));
          copy.id = uid("board");
          copy.title = `${board.title} (Copy)`;
          state.boards.push(copy);
          switchBoard(copy.id);
        } else if (act === "delete") {
          deleteBoard(board.id);
        }
      });
    });
  }

  // --- Search / Find in Map ---
  function openFindBar() {
    findBar.classList.remove("hidden");
    applyLiveInputDir(findInput);
    findInput.focus();
    findInput.select();
    runSearch();
  }

  function closeFindBar() {
    findBar.classList.add("hidden");
    searchMatches = [];
    searchIdx = -1;
    renderCanvas();
  }

  function runSearch() {
    const q = findInput.value.trim().toLowerCase();
    searchMatches = [];
    searchIdx = -1;
    const board = getActiveBoard();
    if (!q || !board) {
      findCount.textContent = "0/0";
      renderCanvas();
      return;
    }
    function walk(n) {
      const txt = `${n.text || ""} ${n.note || ""}`.toLowerCase();
      if (txt.includes(q)) searchMatches.push(n.id);
      (n.children || []).forEach(walk);
    }
    walk(board.root);
    if (searchMatches.length > 0) {
      searchIdx = 0;
      focusSearchMatch();
    } else {
      findCount.textContent = "0/0";
      renderCanvas();
    }
  }

  function focusSearchMatch() {
    if (searchMatches.length === 0) return;
    const targetId = searchMatches[searchIdx];
    findCount.textContent = `${searchIdx + 1}/${searchMatches.length}`;
    selectSingleNode(targetId);

    const board = getActiveBoard();
    function expandPath(n) {
      if (n.id === targetId) return true;
      for (const c of n.children || []) {
        if (expandPath(c)) {
          n.collapsed = false;
          return true;
        }
      }
      return false;
    }
    expandPath(board.root);
    renderCanvas();

    const pos = layoutPositions.get(targetId);
    if (pos) {
      const rect = canvasViewport.getBoundingClientRect();
      panX = Math.round(rect.width / 2 - (pos.x + pos.w / 2) * zoom);
      panY = Math.round(rect.height / 2 - (pos.y + pos.h / 2) * zoom);
      updateViewportTransform();
    }
  }

  // --- Export PNG Image of Entire Mind Map ---
  async function exportMindMapPng() {
    const board = getActiveBoard();
    if (!board || layoutPositions.size === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    layoutPositions.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    });

    const pad = 64;
    const width = Math.ceil(maxX - minX + pad * 2);
    const height = Math.ceil(maxY - minY + pad * 2);
    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    const isLight = state.theme === "light";
    ctx.fillStyle = isLight ? "#ffffff" : "#0b0b0d";
    ctx.fillRect(0, 0, width, height);

    const ox = -minX + pad;
    const oy = -minY + pad;

    function drawBranchLines(parent) {
      if (!parent || parent.collapsed || !parent.children) return;
      const pPos = layoutPositions.get(parent.id);
      if (!pPos) return;
      parent.children.forEach((child) => {
        const cPos = layoutPositions.get(child.id);
        if (!cPos) return;
        ctx.beginPath();
        ctx.strokeStyle = child.color || parent.color || board.color || "#3b82f6";
        ctx.lineWidth = parent.id === board.root.id ? 2.4 : 1.8;
        ctx.lineJoin = "miter";
        ctx.lineCap = "square";

        if (cPos.side === "right") {
          const x1 = Math.round(pPos.x + pPos.w + ox);
          const y1 = Math.round(pPos.y + pPos.h / 2 + oy);
          const x2 = Math.round(cPos.x + ox);
          const y2 = Math.round(cPos.y + cPos.h / 2 + oy);
          const mx = Math.round(x1 + (x2 - x1) * 0.45);
          ctx.moveTo(x1, y1);
          if (Math.abs(y1 - y2) <= 2) {
            ctx.lineTo(x2, y2);
          } else {
            ctx.lineTo(mx, y1);
            ctx.lineTo(mx, y2);
            ctx.lineTo(x2, y2);
          }
        } else if (cPos.side === "left") {
          const x1 = Math.round(pPos.x + ox);
          const y1 = Math.round(pPos.y + pPos.h / 2 + oy);
          const x2 = Math.round(cPos.x + cPos.w + ox);
          const y2 = Math.round(cPos.y + cPos.h / 2 + oy);
          const mx = Math.round(x1 + (x2 - x1) * 0.45);
          ctx.moveTo(x1, y1);
          if (Math.abs(y1 - y2) <= 2) {
            ctx.lineTo(x2, y2);
          } else {
            ctx.lineTo(mx, y1);
            ctx.lineTo(mx, y2);
            ctx.lineTo(x2, y2);
          }
        } else if (cPos.side === "down") {
          const x1 = Math.round(pPos.x + pPos.w / 2 + ox);
          const y1 = Math.round(pPos.y + pPos.h + oy);
          const x2 = Math.round(cPos.x + cPos.w / 2 + ox);
          const y2 = Math.round(cPos.y + oy);
          const my = Math.round(y1 + (y2 - y1) * 0.45);
          ctx.moveTo(x1, y1);
          if (Math.abs(x1 - x2) <= 2) {
            ctx.lineTo(x2, y2);
          } else {
            ctx.lineTo(x1, my);
            ctx.lineTo(x2, my);
            ctx.lineTo(x2, y2);
          }
        } else {
          const x1 = Math.round(pPos.x + pPos.w / 2 + ox);
          const y1 = Math.round(pPos.y + oy);
          const x2 = Math.round(cPos.x + cPos.w / 2 + ox);
          const y2 = Math.round(cPos.y + cPos.h + oy);
          const my = Math.round(y1 + (y2 - y1) * 0.45);
          ctx.moveTo(x1, y1);
          if (Math.abs(x1 - x2) <= 2) {
            ctx.lineTo(x2, y2);
          } else {
            ctx.lineTo(x1, my);
            ctx.lineTo(x2, my);
            ctx.lineTo(x2, y2);
          }
        }
        ctx.stroke();
        drawBranchLines(child);
      });
    }
    drawBranchLines(board.root);

    function drawNodes(node) {
      const pos = layoutPositions.get(node.id);
      if (!pos) return;
      const nx = pos.x + ox;
      const ny = pos.y + oy;
      const nw = pos.w;
      const nh = pos.h;

      ctx.fillStyle = isLight ? "#ffffff" : "#141418";
      ctx.strokeStyle = node.color || board.color || "#3b82f6";
      ctx.lineWidth = node.id === board.root.id ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, nh, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? "#111113" : "#f2f2f5";
      ctx.font =
        node.id === board.root.id
          ? 'bold 14.5px "Segoe UI", Tahoma, sans-serif'
          : '600 13px "Segoe UI", Tahoma, sans-serif';
      const nodeAlign = EDITOR_ALIGNS.includes(node.align) ? node.align : "auto";
      const nodeDir = resolveBlockDir(node.text || "", nodeAlign);
      const effAlign = lineAlignFor(nodeDir, nodeAlign);
      ctx.direction = nodeDir;
      ctx.textBaseline = "top";
      const prefix = node.hasTodo ? (node.checked ? "☑ " : "☐ ") : "";
      if (effAlign === "right") {
        ctx.textAlign = "right";
        ctx.fillText(prefix + (node.text || ""), nx + nw - 11, ny + 10, nw - 22);
      } else if (effAlign === "center") {
        ctx.textAlign = "center";
        ctx.fillText(prefix + (node.text || ""), nx + nw / 2, ny + 10, nw - 22);
      } else {
        ctx.textAlign = "left";
        ctx.fillText(prefix + (node.text || ""), nx + 11, ny + 10, nw - 22);
      }

      if (!node.collapsed && node.children) {
        node.children.forEach(drawNodes);
      }
    }
    drawNodes(board.root);

    const dataUrl = canvas.toDataURL("image/png");
    try {
      const savedPath = await invoke("export_png_dialog", {
        base64Png: dataUrl,
        defaultName: `${board.title || "mindmap"}.png`
      });
      if (savedPath) showToast("PNG saved!");
    } catch (e) {
      showToast(String(e));
    }
  }

  // --- Event Listeners Setup ---
  function initEvents() {
    let canvasDownClientX = 0;
    let canvasDownClientY = 0;

    // 5-Box Add Branch Type Picker (+ -> Text / Image / Video / Voice / File)
    function createBranchFromPopover(nodeType) {
      hideAllPopovers();
      if (!pendingAddBranch) return;
      const { parentId, dir, forcedDir, mode, isSibling } = pendingAddBranch;
      pendingAddBranch = null;
      if (mode === "sibling" || isSibling) {
        addSiblingNode(nodeType);
      } else {
        addChildNode(parentId, dir || forcedDir || null, nodeType);
      }
    }

    if (btnAddTypeText) {
      btnAddTypeText.addEventListener("click", (ev) => {
        ev.stopPropagation();
        createBranchFromPopover("text");
      });
    }
    if (btnAddTypeImage) {
      btnAddTypeImage.addEventListener("click", (ev) => {
        ev.stopPropagation();
        createBranchFromPopover("image");
      });
    }
    if (btnAddTypeVideo) {
      btnAddTypeVideo.addEventListener("click", (ev) => {
        ev.stopPropagation();
        createBranchFromPopover("video");
      });
    }
    if (btnAddTypeVoice) {
      btnAddTypeVoice.addEventListener("click", (ev) => {
        ev.stopPropagation();
        createBranchFromPopover("voice");
      });
    }
    if (btnAddTypeFile) {
      btnAddTypeFile.addEventListener("click", (ev) => {
        ev.stopPropagation();
        createBranchFromPopover("file");
      });
    }

    // Window Dragging on Titlebar
    titlebar.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0) return;
      if (ev.target.closest("button, input, .win-controls, .profile-chip")) return;
      invoke("win_start_drag");
    });

    titlebar.addEventListener("dblclick", (ev) => {
      if (ev.target.closest("button, input, .win-controls, .profile-chip")) return;
      invoke("win_toggle_maximize").then((isMax) => {
        appRoot.classList.toggle("maximized", !!isMax);
      });
    });

    minBtn.addEventListener("click", () => invoke("win_minimize"));
    maxBtn.addEventListener("click", async () => {
      const isMax = await invoke("win_toggle_maximize");
      appRoot.classList.toggle("maximized", !!isMax);
    });
    closeBtn.addEventListener("click", closeWindowSafely);
    window.addEventListener("beforeunload", () => {
      if (saveTimer) flushSave();
    });

    pinBtn.addEventListener("click", async () => {
      state.pinned = !state.pinned;
      await invoke("win_set_pin", { pinned: state.pinned });
      pinBtn.classList.toggle("active", state.pinned);
      showToast(state.pinned ? t("toastPinned") : t("toastUnpinned"));
    });

    fullscreenBtn.addEventListener("click", async () => {
      const isFs = await invoke("win_toggle_fullscreen");
      appRoot.classList.toggle("is-fullscreen", !!isFs);
    });

    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    railToggleBtn.addEventListener("click", () => {
      state.railHidden = !state.railHidden;
      renderRail();
      scheduleSave();
    });

    railFold.addEventListener("click", () => {
      state.railToolsClosed = !state.railToolsClosed;
      renderRail();
      scheduleSave();
    });

    zenBtn.addEventListener("click", toggleZenMode);

    searchBtn.addEventListener("click", () => {
      if (findBar.classList.contains("hidden")) openFindBar();
      else closeFindBar();
    });

    settingsBtn.addEventListener("click", () => {
      updateSettingsModalUI();
      settingsModal.classList.remove("hidden");
    });
    settingsCloseBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));

    // One-Click Theme Toggle (Dark <-> Light) in Titlebar
    themeChip.addEventListener("click", () => {
      applyTheme(state.theme === "dark" ? "light" : "dark");
      scheduleSave();
    });

    // Layout Chip in Titlebar
    layoutChip.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const isHidden = layoutPopover.classList.contains("hidden");
      hideAllPopovers();
      if (isHidden) {
        const r = layoutChip.getBoundingClientRect();
        positionPopover(layoutPopover, r.left, r.bottom + 6);
      }
    });

    layoutPopover.querySelectorAll(".ctx-item").forEach((item) => {
      item.addEventListener("click", () => {
        const board = getActiveBoard();
        if (!board) return;
        board.layout = item.dataset.layout;
        hideAllPopovers();
        renderCanvas();
        fitCanvasToNodes();
        scheduleSave();
      });
    });

    // AI Modal Triggers
    aiTopChip.addEventListener("click", () => openAiModal("new"));
    btnAiPrompt.addEventListener("click", () => openAiModal("new"));
    actAiGenerate.addEventListener("click", () => openAiModal("expand"));
    aiModalCloseBtn.addEventListener("click", () => aiModal.classList.add("hidden"));
    aiCancelBtn.addEventListener("click", () => aiModal.classList.add("hidden"));
    aiOpenSettingsBtn.addEventListener("click", () => {
      aiModal.classList.add("hidden");
      updateSettingsModalUI();
      settingsModal.classList.remove("hidden");
    });
    aiTargetSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        aiTargetMode = btn.dataset.target;
        aiTargetSeg.querySelectorAll(".seg-btn").forEach((b) => {
          b.classList.toggle("active", b.dataset.target === aiTargetMode);
        });
      });
    });
    aiGenerateSubmitBtn.addEventListener("click", handleAiGenerateSubmit);
    aiPromptTextarea.addEventListener("input", () => {
      applyLiveInputDir(aiPromptTextarea);
    });
    aiPromptTextarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAiGenerateSubmit();
      }
    });

    // Settings Modal Controls (Language, RTL Mirror, Theme, Layout, AI)
    settingsLangSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextLang = btn.dataset.lang;
        if (nextLang === "fa" && state.rtlMirror === undefined) {
          state.rtlMirror = true;
        }
        applyLanguage(nextLang);
        scheduleSave();
      });
    });

    if (toggleRtlMirror) {
      toggleRtlMirror.addEventListener("change", () => {
        state.rtlMirror = !!toggleRtlMirror.checked;
        applyLanguage(state.lang);
        scheduleSave();
      });
    }

    settingsThemeSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(btn.dataset.theme);
        scheduleSave();
      });
    });

    settingsLayoutSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const board = getActiveBoard();
        if (!board) return;
        board.layout = btn.dataset.layout;
        updateSettingsModalUI();
        renderCanvas();
        fitCanvasToNodes();
        scheduleSave();
      });
    });

    btnSyncNotePromptAi.addEventListener("click", () => tryAutoSyncNotePromptAi(false));

    aiProviderSelect.addEventListener("change", () => {
      state.ai.provider = aiProviderSelect.value;
      state.ai.model = "auto";
      syncAiSettingsUI();
      scheduleSave();
    });

    aiModelSelect.addEventListener("change", () => {
      state.ai.model = aiModelSelect.value;
      scheduleSave();
    });

    aiModelRefreshBtn.addEventListener("click", refreshModelsFromProvider);

    aiApiKeyInput.addEventListener("input", () => {
      const id = getActiveAiProviderId();
      const meta = AI_PROVIDERS[id];
      state.ai[meta.keyField] = aiApiKeyInput.value.trim();
      scheduleSave();
    });

    aiCustomUrlInput.addEventListener("input", () => {
      state.ai.customUrl = aiCustomUrlInput.value.trim();
      scheduleSave();
    });

    aiCustomModelsInput.addEventListener("input", () => {
      state.ai.customModels = aiCustomModelsInput.value.trim();
      syncAiSettingsUI();
      scheduleSave();
    });

    // Rail Buttons
    addBoardBtn.addEventListener("click", () => {
      const n = state.boards.length + 1;
      const newB = createDefaultBoard(`${t("newBoardPrefix")} ${n}`);
      newB.color = BRANCH_COLORS[(n - 1) % BRANCH_COLORS.length];
      newB.root.color = newB.color;
      state.boards.push(newB);
      switchBoard(newB.id);
    });

    btnAutoArrange.addEventListener("click", resetAutoLayout);

    btnOpenFile.addEventListener("click", async () => {
      try {
        const loaded = await invoke("open_project_dialog");
        if (!loaded) return;
        const parsed = JSON.parse(loaded.content);
        if (parsed && parsed.root) {
          parsed.id = uid("board");
          parsed.title = parsed.title || loaded.name;
          state.boards.push(parsed);
          switchBoard(parsed.id);
        } else if (parsed && Array.isArray(parsed.boards)) {
          state.boards.push(...parsed.boards);
          switchBoard(parsed.boards[0].id);
        }
      } catch (e) {
        showToast("Invalid JSON file");
      }
    });

    btnSaveFile.addEventListener("click", async () => {
      const board = getActiveBoard();
      if (!board) return;
      try {
        const content = JSON.stringify(board, null, 2);
        await invoke("save_project_dialog", {
          content,
          defaultName: `${board.title || "mindmap"}.json`
        });
      } catch (e) {
        showToast(String(e));
      }
    });

    btnExportPng.addEventListener("click", exportMindMapPng);
    document.getElementById("btnExportMd").addEventListener("click", exportMindMapMarkdown);
    btnHelpModal.addEventListener("click", () => helpModal.classList.remove("hidden"));
    helpCloseBtn.addEventListener("click", () => helpModal.classList.add("hidden"));

    // Rail Resizer Drag (supports both LTR and RTL mirrored layout like NotePrompt)
    railResizer.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      railResizer.classList.add("active");
      const onMove = (e) => {
        const rect = railEl.getBoundingClientRect();
        const isRtlLayout = appRoot.classList.contains("rtl");
        const rawW = isRtlLayout ? rect.right - e.clientX : e.clientX - rect.left;
        const w = Math.min(340, Math.max(140, Math.round(rawW)));
        state.railWidth = w;
        appRoot.style.setProperty("--rail-width", `${w}px`);
      };
      const onUp = () => {
        railResizer.classList.remove("active");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        scheduleSave();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    // Canvas Panning, Multi-Select Marquee & Dragging Nodes
    canvasViewport.addEventListener("mousedown", (ev) => {
      hideAllPopovers();
      canvasDownClientX = ev.clientX;
      canvasDownClientY = ev.clientY;

      // Start Marquee Box Selection if Multi-Select mode is active or Shift/Ctrl is held on empty canvas
      if (ev.button === 0 && (isSelectBoxMode || ev.shiftKey || ev.ctrlKey || ev.metaKey)) {
        const rect = canvasViewport.getBoundingClientRect();
        const sx = ev.clientX - rect.left;
        const sy = ev.clientY - rect.top;
        marqueeState = {
          startX: sx,
          startY: sy,
          additive: ev.shiftKey || ev.ctrlKey || ev.metaKey,
          initialSelected: new Set(selectedNodeIds)
        };
        if (selectionMarquee) {
          selectionMarquee.style.left = `${sx}px`;
          selectionMarquee.style.top = `${sy}px`;
          selectionMarquee.style.width = "0px";
          selectionMarquee.style.height = "0px";
          selectionMarquee.classList.remove("hidden");
        }
        return;
      }

      if (ev.button === 0 || ev.button === 1) {
        isPanning = true;
        panStartX = ev.clientX - panX;
        panStartY = ev.clientY - panY;
        canvasViewport.classList.add("panning");
      }
    });

    // Dropping files directly onto empty canvas
    canvasViewport.addEventListener("dragover", (ev) => {
      ev.preventDefault();
    });
    canvasViewport.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        const board = getActiveBoard();
        const target = findNode(board.root, selectedNodeId || board.root.id);
        if (target) await handleDroppedFiles(target, ev.dataTransfer.files);
      }
    });

    window.addEventListener("mousemove", (ev) => {
      // 1) Multi-select Marquee Drag
      if (marqueeState) {
        const rect = canvasViewport.getBoundingClientRect();
        const curX = ev.clientX - rect.left;
        const curY = ev.clientY - rect.top;
        const x1 = Math.min(marqueeState.startX, curX);
        const y1 = Math.min(marqueeState.startY, curY);
        const x2 = Math.max(marqueeState.startX, curX);
        const y2 = Math.max(marqueeState.startY, curY);

        if (selectionMarquee) {
          selectionMarquee.style.left = `${x1}px`;
          selectionMarquee.style.top = `${y1}px`;
          selectionMarquee.style.width = `${x2 - x1}px`;
          selectionMarquee.style.height = `${y2 - y1}px`;
        }

        // Convert marquee screen coordinates to canvas world coordinates
        const wx1 = (x1 - panX) / zoom;
        const wy1 = (y1 - panY) / zoom;
        const wx2 = (x2 - panX) / zoom;
        const wy2 = (y2 - panY) / zoom;

        selectedNodeIds = marqueeState.additive
          ? new Set(marqueeState.initialSelected)
          : new Set();

        layoutPositions.forEach((pos, nId) => {
          const intersects =
            pos.x < wx2 &&
            pos.x + pos.w > wx1 &&
            pos.y < wy2 &&
            pos.y + pos.h > wy1;
          if (intersects) {
            selectedNodeIds.add(nId);
          }
        });

        const arr = Array.from(selectedNodeIds);
        selectedNodeId = arr.length > 0 ? arr[arr.length - 1] : null;
        syncSelectionClassesInPlace();
        return;
      }

      // 2) Dragging one or multiple nodes smoothly in-place
      if (dragNodeState) {
        const dxScreen = ev.clientX - dragNodeState.startX;
        const dyScreen = ev.clientY - dragNodeState.startY;
        if (!dragNodeState.moved && Math.hypot(dxScreen, dyScreen) > 3) {
          pushHistory();
          dragNodeState.moved = true;
          document.body.classList.add("dragging-node-mode");
          if (!dragNodeState.isRoot) {
            canvasDropHint.classList.remove("hidden");
          }
          dragNodeState.draggedIds.forEach((id) => {
            const dom = currentDomMap && currentDomMap.get(id);
            if (dom) dom.classList.add("dragging-source");
          });
        }
        if (dragNodeState.moved) {
          const board = getActiveBoard();
          const dxWorld = Math.round(dxScreen / zoom);
          const dyWorld = Math.round(dyScreen / zoom);

          dragNodeState.draggedIds.forEach((id) => {
            const n = findNode(board.root, id);
            const orig = dragNodeState.origOffsets.get(id);
            if (n && orig) {
              n.dx = orig.dx + dxWorld;
              n.dy = orig.dy + dyWorld;
            }
          });

          // Smooth 60fps in-place DOM & SVG update (never destroys DOM elements mid-drag!)
          updateCanvasPositionsInPlace();

          // Magnetic proximity detection for + handles so dropping onto + is effortless!
          if (!dragNodeState.isRoot) {
            const draggedSet = new Set(dragNodeState.draggedIds);
            const primaryNode = findNode(board.root, dragNodeState.nodeId);
            nodesLayer
              .querySelectorAll(".quick-add-handle.drop-target-active")
              .forEach((b) => b.classList.remove("drop-target-active"));
            activeDropTarget = null;

            let bestBtn = null;
            let bestDist = 36; // Magnetic snap radius in pixels
            const allHandles = nodesLayer.querySelectorAll(".quick-add-handle");
            allHandles.forEach((btn) => {
              const targetNodeId = btn.dataset.nodeId;
              if (!targetNodeId || draggedSet.has(targetNodeId)) return;
              if (primaryNode && isDescendantOrSelf(primaryNode, targetNodeId)) return;
              const r = btn.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) return;
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
              if (dist < bestDist) {
                bestDist = dist;
                bestBtn = btn;
              }
            });

            if (bestBtn) {
              bestBtn.classList.add("drop-target-active");
              activeDropTarget = {
                nodeId: bestBtn.dataset.nodeId,
                dir: bestBtn.dataset.dir
              };
            }
          }
        }
        return;
      }

      // 3) Canvas Panning
      if (isPanning) {
        panX = ev.clientX - panStartX;
        panY = ev.clientY - panStartY;
        updateViewportTransform();
      }
    });

    window.addEventListener("mouseup", (ev) => {
      if (marqueeState) {
        marqueeState = null;
        if (selectionMarquee) selectionMarquee.classList.add("hidden");
        renderCanvas();
        return;
      }

      if (dragNodeState) {
        document.body.classList.remove("dragging-node-mode");
        canvasDropHint.classList.add("hidden");
        nodesLayer
          .querySelectorAll(".quick-add-handle.drop-target-active")
          .forEach((b) => b.classList.remove("drop-target-active"));

        if (dragNodeState.moved) {
          if (activeDropTarget) {
            const board = getActiveBoard();
            dragNodeState.draggedIds.forEach((id) => {
              const n = findNode(board.root, id);
              if (n) {
                n.dx = 0;
                n.dy = 0;
              }
            });
            moveNodeToTargetSide(
              dragNodeState.nodeId,
              activeDropTarget.nodeId,
              activeDropTarget.dir
            );
            activeDropTarget = null;
          } else {
            renderCanvas();
            scheduleSave();
          }
        }
        dragNodeState = null;
      }

      if (isPanning) {
        isPanning = false;
        canvasViewport.classList.remove("panning");
        const movedDist = Math.hypot(
          ev.clientX - canvasDownClientX,
          ev.clientY - canvasDownClientY
        );
        // Clicking on empty canvas space clears selection and hides floating toolbars/+ handles!
        if (movedDist < 5 && ev.button === 0) {
          if (selectedNodeId || selectedNodeIds.size > 0 || editingNodeId || editingNoteNodeId || aiInlineNodeId) {
            clearSelection();
            editingNodeId = null;
            editingNoteNodeId = null;
            aiInlineNodeId = null;
            renderCanvas();
          }
        } else {
          scheduleSave();
        }
      }
    });

    // Zoom with Mouse Wheel
    canvasViewport.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const rect = canvasViewport.getBoundingClientRect();
        const mouseX = ev.clientX - rect.left;
        const mouseY = ev.clientY - rect.top;
        const worldX = (mouseX - panX) / zoom;
        const worldY = (mouseY - panY) / zoom;

        const factor = ev.deltaY < 0 ? 1.1 : 0.9;
        const nextZoom = Math.min(2.6, Math.max(0.22, zoom * factor));
        zoom = nextZoom;
        panX = Math.round(mouseX - worldX * zoom);
        panY = Math.round(mouseY - worldY * zoom);
        updateViewportTransform();
        scheduleSave();
      },
      { passive: false }
    );

    // Canvas HUD Controls (Multi-Select, Tidy Auto-Layout, Zoom)
    if (selectModeBtn) {
      selectModeBtn.addEventListener("click", () => {
        isSelectBoxMode = !isSelectBoxMode;
        selectModeBtn.classList.toggle("active", isSelectBoxMode);
        canvasViewport.classList.toggle("select-mode", isSelectBoxMode);
      });
    }
    if (tidyCanvasBtn) {
      tidyCanvasBtn.addEventListener("click", resetAutoLayout);
    }
    zoomInBtn.addEventListener("click", () => {
      zoom = Math.min(2.6, zoom * 1.15);
      updateViewportTransform();
    });
    zoomOutBtn.addEventListener("click", () => {
      zoom = Math.max(0.22, zoom / 1.15);
      updateViewportTransform();
    });
    zoomLabel.addEventListener("click", () => {
      zoom = 1;
      updateViewportTransform();
    });
    zoomFitBtn.addEventListener("click", fitCanvasToNodes);
    expandAllBtn.addEventListener("click", expandAllNodes);

    // Statusbar Actions
    actAddChild.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const board = getActiveBoard();
      if (!board) return;
      openAddTypePopover(actAddChild, selectedNodeId || board.root.id, "up", "child");
    });
    actAddSibling.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const board = getActiveBoard();
      if (!board) return;
      openAddTypePopover(actAddSibling, selectedNodeId || board.root.id, "up", "sibling");
    });

    actTodo.addEventListener("click", () => {
      const board = getActiveBoard();
      if (!board) return;
      const targets = getSelectedNodeList(board);
      const primary =
        targets[0] || findNode(board.root, selectedNodeId || board.root.id);
      if (!primary) return;
      pushHistory();
      const nextVal = !primary.hasTodo;
      if (targets.length > 0) {
        targets.forEach((n) => {
          n.hasTodo = nextVal;
        });
      } else {
        primary.hasTodo = nextVal;
      }
      renderCanvas();
      scheduleSave();
    });

    actNote.addEventListener("click", () => {
      const board = getActiveBoard();
      if (!board) return;
      const targetId = selectedNodeId || board.root.id;
      editingNoteNodeId = editingNoteNodeId === targetId ? null : targetId;
      renderCanvas();
    });

    if (actAlign) {
      actAlign.addEventListener("click", cycleSelectedNodeAlign);
    }

    actImage.addEventListener("click", () => attachImageToNode());
    if (actVideo) actVideo.addEventListener("click", () => attachVideoToNode());
    if (actVoice) actVoice.addEventListener("click", () => attachAudioToNode());
    actFile.addEventListener("click", () => attachFileToNode());

    actColor.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const isHidden = colorPopover.classList.contains("hidden");
      hideAllPopovers();
      if (isHidden) {
        renderNodeColorPicker();
        const r = actColor.getBoundingClientRect();
        positionPopover(colorPopover, r.left, r.top - 96);
      }
    });

    actCollapse.addEventListener("click", () => toggleCollapseNode(selectedNodeId));
    actDelete.addEventListener("click", deleteSelectedNode);

    // Find Bar Events
    findInput.addEventListener("input", () => {
      applyLiveInputDir(findInput);
      runSearch();
    });
    findNext.addEventListener("click", () => {
      if (searchMatches.length === 0) return;
      searchIdx = (searchIdx + 1) % searchMatches.length;
      focusSearchMatch();
    });
    findPrev.addEventListener("click", () => {
      if (searchMatches.length === 0) return;
      searchIdx = (searchIdx - 1 + searchMatches.length) % searchMatches.length;
      focusSearchMatch();
    });
    findClose.addEventListener("click", closeFindBar);

    // Lightbox Modal Events
    lightboxClose.addEventListener("click", () => lightboxModal.classList.add("hidden"));
    lightboxOpenOs.addEventListener("click", async () => {
      if (currentLightboxAtt) {
        await invoke("open_attachment", { path: currentLightboxAtt.path });
      }
    });
    lightboxReveal.addEventListener("click", async () => {
      if (currentLightboxAtt) {
        await invoke("reveal_in_explorer", { path: currentLightboxAtt.path });
      }
    });

    // Close Modals on Backdrop Click
    [aiModal, settingsModal, lightboxModal, helpModal].forEach((m) => {
      m.addEventListener("click", (ev) => {
        if (ev.target === m) m.classList.add("hidden");
      });
    });

    // Clipboard Paste Image (Ctrl+V)
    window.addEventListener("paste", async (ev) => {
      if (
        editingNodeId ||
        editingNoteNodeId ||
        renamingBoardId ||
        !aiModal.classList.contains("hidden") ||
        !settingsModal.classList.contains("hidden")
      ) {
        return;
      }
      const items = ev.clipboardData && ev.clipboardData.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const board = getActiveBoard();
            const node = findNode(board.root, selectedNodeId || board.root.id);
            if (node) await handleDroppedFiles(node, [file]);
          }
        }
      }
    });

    // Global Keyboard Shortcuts
    window.addEventListener("keydown", (ev) => {
      const activeTag = document.activeElement && document.activeElement.tagName;
      if (
        editingNodeId ||
        editingNoteNodeId ||
        renamingBoardId ||
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        (document.activeElement && document.activeElement.isContentEditable)
      ) {
        if (ev.key === "Escape") {
          if (document.activeElement === findInput) closeFindBar();
          aiModal.classList.add("hidden");
          settingsModal.classList.add("hidden");
        }
        return;
      }

      if ((ev.ctrlKey || ev.metaKey) && (ev.key === "a" || ev.key === "A")) {
        ev.preventDefault();
        selectedNodeIds.clear();
        layoutPositions.forEach((_, nId) => selectedNodeIds.add(nId));
        const arr = Array.from(selectedNodeIds);
        selectedNodeId = arr.length > 0 ? arr[arr.length - 1] : null;
        renderCanvas();
        return;
      }
      if (ev.ctrlKey && (ev.key === "g" || ev.key === "G")) {
        ev.preventDefault();
        openAiModal("new");
        return;
      }
      if (ev.ctrlKey && ev.shiftKey && (ev.key === "F" || ev.key === "f")) {
        ev.preventDefault();
        toggleZenMode();
        return;
      }
      if (ev.ctrlKey && (ev.key === "z" || ev.key === "Z")) {
        ev.preventDefault();
        undo();
        return;
      }
      if (ev.ctrlKey && (ev.key === "y" || ev.key === "Y")) {
        ev.preventDefault();
        redo();
        return;
      }
      if (ev.ctrlKey && (ev.key === "f" || ev.key === "F")) {
        ev.preventDefault();
        openFindBar();
        return;
      }
      if (ev.ctrlKey && (ev.key === "t" || ev.key === "T")) {
        ev.preventDefault();
        addBoardBtn.click();
        return;
      }
      if (ev.ctrlKey && ev.key === "\\") {
        ev.preventDefault();
        railToggleBtn.click();
        return;
      }
      if (ev.key === "F11") {
        ev.preventDefault();
        fullscreenBtn.click();
        return;
      }
      if (ev.key === "Tab" || ev.key === "Enter") {
        ev.preventDefault();
        const board = getActiveBoard();
        if (board) {
          addChildNode(selectedNodeId || board.root.id, null, "text");
        }
        return;
      }
      if (ev.key === "F2") {
        ev.preventDefault();
        if (selectedNodeId) {
          editingNodeId = selectedNodeId;
          renderCanvas();
        }
        return;
      }
      if (ev.key === " ") {
        ev.preventDefault();
        if (selectedNodeId) toggleCollapseNode(selectedNodeId);
        return;
      }
      if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        deleteSelectedNode();
        return;
      }
      if (ev.key === "Escape") {
        hideAllPopovers();
        aiModal.classList.add("hidden");
        settingsModal.classList.add("hidden");
        lightboxModal.classList.add("hidden");
        helpModal.classList.add("hidden");
        if (state.zenMode) toggleZenMode();
        if (selectedNodeId || selectedNodeIds.size > 0 || aiInlineNodeId) {
          clearSelection();
          aiInlineNodeId = null;
          renderCanvas();
        }
      }
    });
  }

  function renderNodeColorPicker() {
    const board = getActiveBoard();
    if (!board) return;
    const targets = getSelectedNodeList(board);
    const primary =
      targets[0] || findNode(board.root, selectedNodeId || board.root.id);
    if (!primary) return;
    colorGrid.innerHTML = "";
    BRANCH_COLORS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "color-swatch-btn" + (primary.color === c ? " active" : "");
      btn.style.background = c;
      btn.addEventListener("click", () => {
        pushHistory();
        function colorSubtree(n) {
          n.color = c;
          (n.children || []).forEach(colorSubtree);
        }
        if (targets.length > 0) {
          targets.forEach(colorSubtree);
        } else {
          colorSubtree(primary);
        }
        hideAllPopovers();
        renderCanvas();
        scheduleSave();
      });
      colorGrid.appendChild(btn);
    });
  }

  function updateSettingsModalUI() {
    const board = getActiveBoard();
    const curLayout = (board && board.layout) || "balanced";
    settingsLayoutSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.layout === curLayout);
    });
    settingsLangSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });
    const isRtlMirror =
      state.rtlMirror !== undefined ? !!state.rtlMirror : state.lang === "fa";
    if (toggleRtlMirror) toggleRtlMirror.checked = isRtlMirror;
    if (rtlMirrorRow) rtlMirrorRow.classList.toggle("hidden", state.lang !== "fa");
    settingsThemeSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === state.theme);
    });
    syncAiSettingsUI();
  }

  function toggleZenMode() {
    state.zenMode = !state.zenMode;
    renderRail();
    if (state.zenMode) {
      zenExitHint.classList.remove("hidden");
      setTimeout(() => zenExitHint.classList.add("hidden"), 2400);
    } else {
      zenExitHint.classList.add("hidden");
    }
  }

  // --- Bootstrap Application ---
  async function init() {
    initEvents();
    try {
      const res = await invoke("load_workspace");
      if (res && res.data && Array.isArray(res.data.boards) && res.data.boards.length > 0) {
        state = Object.assign(state, res.data);
        if (!state.ai) {
          state.ai = {
            provider: "openrouter",
            model: "auto",
            openrouterKey: "",
            googleKey: "",
            openaiKey: "",
            anthropicKey: "",
            customKey: "",
            customUrl: "http://localhost:11434/v1/chat/completions",
            customModels: "llama3.2",
            modelCache: {}
          };
        }
      } else {
        state.lang = "en";
        state.theme = "dark";
        const firstBoard = createDefaultBoard();
        state.boards = [firstBoard];
        state.activeBoardId = firstBoard.id;
      }
    } catch (e) {
      const firstBoard = createDefaultBoard();
      state.boards = [firstBoard];
      state.activeBoardId = firstBoard.id;
    }

    // Ensure theme is only 'dark' or 'light'
    if (state.theme !== "light") state.theme = "dark";
    if (state.lang !== "fa") state.lang = "en";

    applyLanguage(state.lang);
    applyTheme(state.theme);

    const board = getActiveBoard();
    if (board) {
      selectSingleNode(board.root.id);
      if (typeof board.panX === "number" && (board.panX !== 0 || board.panY !== 0)) {
        panX = board.panX;
        panY = board.panY;
        zoom = board.zoom || 1;
      } else {
        centerCanvasOnRoot();
      }
    }
    renderRail();
    renderCanvas();
    if (board && !board.panX && !board.panY) {
      setTimeout(fitCanvasToNodes, 60);
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();

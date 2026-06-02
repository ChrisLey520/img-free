export const locales = ["en", "zh-CN", "zh-TW"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-CN";

export type MessageKey =
  | "app.name"
  | "app.tagline"
  | "nav.navigate"
  | "nav.settings"
  | "nav.format"
  | "nav.sprite"
  | "nav.redeem"
  | "nav.spritesheet"
  | "nav.aisprite"
  | "nav.imagegen"
  | "settings.title"
  | "settings.description"
  | "settings.apiBase"
  | "settings.apiHint"
  | "settings.language"
  | "settings.apiEnv"
  | "converter.title"
  | "converter.subtitle"
  | "controls.title"
  | "controls.description"
  | "controls.sourceFile"
  | "controls.chooseOrDrop"
  | "controls.supportedFormats"
  | "controls.outputFormat"
  | "controls.outputFormatFixed"
  | "controls.spriteRequiresPng"
  | "controls.jpegQuality"
  | "controls.pngCompression"
  | "controls.pixelSprite"
  | "controls.resizeExact"
  | "controls.width"
  | "controls.height"
  | "controls.fit"
  | "controls.fitInside"
  | "controls.fitCover"
  | "controls.fitFill"
  | "controls.letterboxRGBA"
  | "controls.paletteReduction"
  | "controls.colors"
  | "controls.gamePayload"
  | "controls.icoSizes"
  | "controls.icoHint"
  | "controls.traceTitle"
  | "controls.colorTrace"
  | "controls.threshold"
  | "controls.turdSize"
  | "controls.optTolerance"
  | "controls.blackOnWhite"
  | "controls.existingSvgHint"
  | "actions.controls"
  | "actions.convert"
  | "actions.converting"
  | "actions.download"
  | "status.failed"
  | "preview.before"
  | "preview.after"
  | "preview.noFile"
  | "preview.previewHere"
  | "preview.outputPreview"
  | "preview.runToSeeOutput"
  | "preview.downloadWhenReady";

type Messages = Record<MessageKey, string>;

const MESSAGES: Record<Locale, Messages> = {
  en: {
    "app.name": "img-free",
    "app.tagline": "Image lab",
    "nav.navigate": "Navigate",
    "nav.format": "Format Converter",
    "nav.sprite": "Pixel Sprite",
    "nav.redeem": "Pixel Avatar",
    "nav.spritesheet": "Sprite Sheet",
    "nav.aisprite": "AI Sprite",
    "nav.imagegen": "AI Image Gen",
    "nav.settings": "Settings",
    "settings.title": "Settings",
    "settings.description": "Environment and defaults for this workspace.",
    "settings.apiBase": "API base",
    "settings.apiHint": "Override with {env} before build.",
    "settings.apiEnv": "NEXT_PUBLIC_API_BASE",
    "settings.language": "Language",
    "converter.title": "Image Converter",
    "converter.subtitle": "Convert images and decode .tex — preview before download.",
    "controls.title": "Controls",
    "controls.description": "Choose a file, tune output, run convert.",
    "controls.sourceFile": "Source file",
    "controls.chooseOrDrop": "Choose or drop a file",
    "controls.supportedFormats": "PNG, JPEG, SVG, ICO, .tex",
    "controls.outputFormat": "Output format",
    "controls.outputFormatFixed": "Output format · {format}",
    "controls.spriteRequiresPng": "Pixel sprite is available only for PNG output.",
    "controls.jpegQuality": "JPEG quality",
    "controls.pngCompression": "PNG compression (0–9)",
    "controls.pixelSprite": "Pixel sprite",
    "controls.resizeExact": "Resize to exact W×H (nearest)",
    "controls.width": "Width",
    "controls.height": "Height",
    "controls.fit": "Fit",
    "controls.fitInside": "Inside (letterbox)",
    "controls.fitCover": "Cover",
    "controls.fitFill": "Fill",
    "controls.letterboxRGBA": "Letterbox RGBA",
    "controls.paletteReduction": "Palette reduction",
    "controls.colors": "Colors (2–256)",
    "controls.gamePayload": "gamePayload · max {max} cells",
    "controls.icoSizes": "ICO sizes",
    "controls.icoHint": "Comma-separated pixels.",
    "controls.traceTitle": "Trace (raster → SVG)",
    "controls.colorTrace": "Color trace",
    "controls.threshold": "Threshold",
    "controls.turdSize": "Turd size",
    "controls.optTolerance": "Opt tolerance",
    "controls.blackOnWhite": "Black on white",
    "controls.existingSvgHint": "Existing SVG is optimized, not re-traced.",
    "actions.controls": "Controls",
    "actions.convert": "Convert",
    "actions.converting": "Converting…",
    "actions.download": "Download",
    "status.failed": "Failed",
    "preview.before": "Before",
    "preview.after": "After",
    "preview.noFile": "No file selected",
    "preview.previewHere": "Preview here",
    "preview.outputPreview": "Output preview",
    "preview.runToSeeOutput": "Run convert to see output.",
    "preview.downloadWhenReady": "Download when ready.",
  },
  "zh-CN": {
    "app.name": "img-free",
    "app.tagline": "图片实验室",
    "nav.navigate": "导航",
    "nav.format": "格式转换",
    "nav.sprite": "像素精灵",
    "nav.redeem": "像素兑换",
    "nav.spritesheet": "精灵表制作",
    "nav.aisprite": "AI 生成动作",
    "nav.imagegen": "AI 图像生成",
    "nav.settings": "设置",
    "settings.title": "设置",
    "settings.description": "本工作区的环境与默认项。",
    "settings.apiBase": "API 地址",
    "settings.apiHint": "构建前可用 {env} 覆盖。",
    "settings.apiEnv": "NEXT_PUBLIC_API_BASE",
    "settings.language": "语言",
    "converter.title": "图片转换",
    "converter.subtitle": "图片转换与 .tex 解码，下载前可预览。",
    "controls.title": "参数",
    "controls.description": "选择文件，设置输出，执行转换。",
    "controls.sourceFile": "源文件",
    "controls.chooseOrDrop": "选择或拖拽文件",
    "controls.supportedFormats": "PNG、JPEG、SVG、ICO、.tex",
    "controls.outputFormat": "输出格式",
    "controls.outputFormatFixed": "输出格式 · {format}",
    "controls.spriteRequiresPng": "像素精灵仅在输出 PNG 时可用。",
    "controls.jpegQuality": "JPEG 质量",
    "controls.pngCompression": "PNG 压缩（0–9）",
    "controls.pixelSprite": "像素精灵",
    "controls.resizeExact": "按指定宽高缩放（最近邻）",
    "controls.width": "宽",
    "controls.height": "高",
    "controls.fit": "适配",
    "controls.fitInside": "包含（留边）",
    "controls.fitCover": "覆盖",
    "controls.fitFill": "拉伸",
    "controls.letterboxRGBA": "留边背景 RGBA",
    "controls.paletteReduction": "调色板压缩",
    "controls.colors": "颜色数（2–256）",
    "controls.gamePayload": "gamePayload · 最多 {max} 格",
    "controls.icoSizes": "ICO 尺寸",
    "controls.icoHint": "用逗号分隔像素尺寸。",
    "controls.traceTitle": "描摹（位图 → SVG）",
    "controls.colorTrace": "彩色描摹",
    "controls.threshold": "阈值",
    "controls.turdSize": "噪点过滤",
    "controls.optTolerance": "优化容差",
    "controls.blackOnWhite": "白底黑线",
    "controls.existingSvgHint": "已有 SVG 将优化，而非重新描摹。",
    "actions.controls": "参数",
    "actions.convert": "开始转换",
    "actions.converting": "转换中…",
    "actions.download": "下载",
    "status.failed": "失败",
    "preview.before": "转换前",
    "preview.after": "转换后",
    "preview.noFile": "未选择文件",
    "preview.previewHere": "此处预览",
    "preview.outputPreview": "输出预览",
    "preview.runToSeeOutput": "点击转换后查看输出。",
    "preview.downloadWhenReady": "准备好后可下载。",
  },
  "zh-TW": {
    "app.name": "img-free",
    "app.tagline": "圖片實驗室",
    "nav.navigate": "導覽",
    "nav.format": "格式轉換",
    "nav.sprite": "像素精靈",
    "nav.redeem": "像素兌換",
    "nav.spritesheet": "精靈表製作",
    "nav.aisprite": "AI 生成動作",
    "nav.imagegen": "AI 圖像生成",
    "nav.settings": "設定",
    "settings.title": "設定",
    "settings.description": "此工作區的環境與預設項目。",
    "settings.apiBase": "API 位址",
    "settings.apiHint": "建置前可用 {env} 覆寫。",
    "settings.apiEnv": "NEXT_PUBLIC_API_BASE",
    "settings.language": "語言",
    "converter.title": "圖片轉換",
    "converter.subtitle": "圖片轉換與 .tex 解碼，下載前可預覽。",
    "controls.title": "參數",
    "controls.description": "選擇檔案，調整輸出，執行轉換。",
    "controls.sourceFile": "來源檔案",
    "controls.chooseOrDrop": "選擇或拖曳檔案",
    "controls.supportedFormats": "PNG、JPEG、SVG、ICO、.tex",
    "controls.outputFormat": "輸出格式",
    "controls.outputFormatFixed": "輸出格式 · {format}",
    "controls.spriteRequiresPng": "像素精靈僅在輸出 PNG 時可用。",
    "controls.jpegQuality": "JPEG 品質",
    "controls.pngCompression": "PNG 壓縮（0–9）",
    "controls.pixelSprite": "像素精靈",
    "controls.resizeExact": "依指定寬高縮放（最近鄰）",
    "controls.width": "寬",
    "controls.height": "高",
    "controls.fit": "適配",
    "controls.fitInside": "包含（留邊）",
    "controls.fitCover": "覆蓋",
    "controls.fitFill": "拉伸",
    "controls.letterboxRGBA": "留邊背景 RGBA",
    "controls.paletteReduction": "調色盤壓縮",
    "controls.colors": "顏色數（2–256）",
    "controls.gamePayload": "gamePayload · 最多 {max} 格",
    "controls.icoSizes": "ICO 尺寸",
    "controls.icoHint": "以逗號分隔像素尺寸。",
    "controls.traceTitle": "描摹（點陣 → SVG）",
    "controls.colorTrace": "彩色描摹",
    "controls.threshold": "閾值",
    "controls.turdSize": "雜訊過濾",
    "controls.optTolerance": "最佳化容差",
    "controls.blackOnWhite": "白底黑線",
    "controls.existingSvgHint": "既有 SVG 會被最佳化，而非重新描摹。",
    "actions.controls": "參數",
    "actions.convert": "開始轉換",
    "actions.converting": "轉換中…",
    "actions.download": "下載",
    "status.failed": "失敗",
    "preview.before": "轉換前",
    "preview.after": "轉換後",
    "preview.noFile": "尚未選擇檔案",
    "preview.previewHere": "此處預覽",
    "preview.outputPreview": "輸出預覽",
    "preview.runToSeeOutput": "點擊轉換後查看輸出。",
    "preview.downloadWhenReady": "準備好後即可下載。",
  },
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function formatMessage(locale: Locale, key: MessageKey, vars?: Record<string, string | number>) {
  const raw = getMessages(locale)[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function stripPlaceholder(raw: string, placeholder: string) {
  return raw.replace(placeholder, "");
}


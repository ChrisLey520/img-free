"use client";

import { useMemo, useState } from "react";

export type TargetFormat = "png" | "jpeg" | "ico" | "svg";

export type GamePayload = {
  layout: "rowMajor";
  width: number;
  height: number;
  palette: string[];
  indices: number[];
};

export type ConvertResponse = {
  input: {
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    previewDataUrl: string;
  };
  output: {
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    dataUrl: string;
    previewDataUrl: string;
    gamePayload?: GamePayload;
  };
};

export const SPRITE_MAX_SIDE = 512;
export const GAME_PAYLOAD_MAX_CELLS = 4096;

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function useConverter() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ??
    (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3002");

  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("png");
  const [jpegQuality, setJpegQuality] = useState(85);
  const [pngCompressionLevel, setPngCompressionLevel] = useState(9);
  const [icoSizes, setIcoSizes] = useState("16,32,48,256");
  const [traceThreshold, setTraceThreshold] = useState(180);
  const [traceTurdSize, setTraceTurdSize] = useState(2);
  const [traceOptTolerance, setTraceOptTolerance] = useState(0.2);
  const [traceBlackOnWhite, setTraceBlackOnWhite] = useState(true);
  const [traceColor, setTraceColor] = useState(false);
  const [traceColors, setTraceColors] = useState(32);

  const [spriteEnabled, setSpriteEnabled] = useState(false);
  const [spriteWidth, setSpriteWidth] = useState(64);
  const [spriteHeight, setSpriteHeight] = useState(64);
  const [spriteFit, setSpriteFit] = useState<"inside" | "cover" | "fill">("inside");
  const [spriteUsePalette, setSpriteUsePalette] = useState(false);
  const [spritePaletteColors, setSpritePaletteColors] = useState(16);
  const [spriteIncludeGamePayload, setSpriteIncludeGamePayload] = useState(false);
  const [spriteLetterboxBg, setSpriteLetterboxBg] = useState(false);
  const [spriteBgR, setSpriteBgR] = useState(32);
  const [spriteBgG, setSpriteBgG] = useState(32);
  const [spriteBgB, setSpriteBgB] = useState(40);
  const [spriteBgA, setSpriteBgA] = useState(255);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<ConvertResponse | null>(null);

  const downloadName = useMemo(() => {
    const base = (file?.name ?? "output").replace(/\.[^/.]+$/, "");
    const ext = targetFormat === "jpeg" ? "jpg" : targetFormat;
    return `${base}.${ext}`;
  }, [file?.name, targetFormat]);

  /** 小图输出时用整数倍放大 + 像素化渲染，便于查看精灵格 */
  const outputPixelScale = useMemo(() => {
    if (!res?.output?.width || !res?.output?.height) return 1;
    const w = res.output.width;
    const h = res.output.height;
    const m = Math.max(w, h);
    if (m > 128) return 1;
    return Math.min(8, Math.max(1, Math.floor(220 / m)));
  }, [res]);

  function onDownloadGamePayload() {
    if (!res?.output?.gamePayload) return;
    const blob = new Blob([JSON.stringify(res.output.gamePayload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = (file?.name ?? "sprite").replace(/\.[^/.]+$/, "");
    a.href = url;
    a.download = `${base}.gamePayload.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onPickFile(f: File | null) {
    setErr(null);
    setRes(null);
    setFile(f);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function convertWith(overrides?: { targetFormat?: TargetFormat; spriteEnabled?: boolean }) {
    if (!file) return;
    const effectiveTargetFormat = overrides?.targetFormat ?? targetFormat;
    const effectiveSpriteEnabled = overrides?.spriteEnabled ?? spriteEnabled;
    if (effectiveSpriteEnabled && effectiveTargetFormat !== "png") {
      setErr('Pixel sprite requires PNG output.');
      return;
    }
    if (effectiveSpriteEnabled) {
      if (
        !Number.isFinite(spriteWidth) ||
        !Number.isFinite(spriteHeight) ||
        spriteWidth < 1 ||
        spriteHeight < 1 ||
        spriteWidth > SPRITE_MAX_SIDE ||
        spriteHeight > SPRITE_MAX_SIDE
      ) {
        setErr(`Sprite width/height must be between 1 and ${SPRITE_MAX_SIDE}.`);
        return;
      }
      if (spriteIncludeGamePayload && spriteWidth * spriteHeight > GAME_PAYLOAD_MAX_CELLS) {
        setErr(
          `Game payload is only allowed when width × height ≤ ${GAME_PAYLOAD_MAX_CELLS} (e.g. 64×64).`,
        );
        return;
      }
    }
    setBusy(true);
    setErr(null);
    setRes(null);
    try {
      const options: Record<string, unknown> = {};
      if (effectiveTargetFormat === "jpeg") options.jpegQuality = jpegQuality;
      if (effectiveTargetFormat === "png") options.pngCompressionLevel = pngCompressionLevel;
      if (effectiveTargetFormat === "ico") {
        options.icoSizes = icoSizes
          .split(",")
          .map((s) => Number.parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n) && n > 0);
      }
      if (effectiveTargetFormat === "svg") {
        options.trace = {
          mode: traceColor ? "color" : "mono",
          threshold: traceThreshold,
          turdSize: traceTurdSize,
          optTolerance: traceOptTolerance,
          blackOnWhite: traceBlackOnWhite,
          colors: traceColors,
        };
      }
      if (effectiveTargetFormat === "png" && effectiveSpriteEnabled) {
        const sprite: Record<string, unknown> = {
          enabled: true,
          width: Math.round(spriteWidth),
          height: Math.round(spriteHeight),
          fit: spriteFit,
        };
        if (spriteFit === "inside" && spriteLetterboxBg) {
          sprite.background = {
            r: Math.min(255, Math.max(0, Math.round(spriteBgR))),
            g: Math.min(255, Math.max(0, Math.round(spriteBgG))),
            b: Math.min(255, Math.max(0, Math.round(spriteBgB))),
            a: Math.min(255, Math.max(0, Math.round(spriteBgA))),
          };
        }
        sprite.paletteColors = spriteUsePalette
          ? Math.min(256, Math.max(2, Math.round(spritePaletteColors)))
          : null;
        if (spriteIncludeGamePayload) sprite.includeGamePayload = true;
        options.sprite = sprite;
      }

      const fd = new FormData();
      fd.set("targetFormat", effectiveTargetFormat);
      fd.set("options", JSON.stringify(options));
      fd.set("input", file, file.name);

      const r = await fetch(`${apiBase}/convert`, { method: "POST", body: fd });
      const json = (await r.json()) as unknown;
      if (!r.ok) throw new Error(JSON.stringify(json));
      setRes(json as ConvertResponse);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onConvert() {
    return convertWith();
  }

  return {
    apiBase,
    file,
    localPreviewUrl,
    targetFormat,
    setTargetFormat,
    jpegQuality,
    setJpegQuality,
    pngCompressionLevel,
    setPngCompressionLevel,
    icoSizes,
    setIcoSizes,
    traceThreshold,
    setTraceThreshold,
    traceTurdSize,
    setTraceTurdSize,
    traceOptTolerance,
    setTraceOptTolerance,
    traceBlackOnWhite,
    setTraceBlackOnWhite,
    traceColor,
    setTraceColor,
    traceColors,
    setTraceColors,
    spriteEnabled,
    setSpriteEnabled,
    spriteWidth,
    setSpriteWidth,
    spriteHeight,
    setSpriteHeight,
    spriteFit,
    setSpriteFit,
    spriteUsePalette,
    setSpriteUsePalette,
    spritePaletteColors,
    setSpritePaletteColors,
    spriteIncludeGamePayload,
    setSpriteIncludeGamePayload,
    spriteLetterboxBg,
    setSpriteLetterboxBg,
    spriteBgR,
    setSpriteBgR,
    spriteBgG,
    setSpriteBgG,
    spriteBgB,
    setSpriteBgB,
    spriteBgA,
    setSpriteBgA,
    busy,
    err,
    res,
    downloadName,
    outputPixelScale,
    onPickFile,
    onConvert,
    convertWith,
    onDownloadGamePayload,
  };
}

export type UseConverterReturn = ReturnType<typeof useConverter>;

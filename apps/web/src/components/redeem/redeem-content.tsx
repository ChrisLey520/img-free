"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

type PresetKey = "mini" | "standard" | "hd";
type StyleKey  = "natural" | "retro";
type Phase     = "form" | "result";

const PRESETS: { key: PresetKey; label: string; desc: string }[] = [
  { key: "mini",     label: "32×32 迷你版",   desc: "适合小头像、表情包" },
  { key: "standard", label: "64×64 标准版",   desc: "最常用尺寸" },
  { key: "hd",       label: "128×128 高清版", desc: "细节更丰富" },
];

const STYLES: { key: StyleKey; label: string; desc: string }[] = [
  { key: "natural", label: "🎨 自然色彩",   desc: "完整色彩，还原真实头像" },
  { key: "retro",   label: "🕹 像素游戏风", desc: "64 色限色 + 抖动，复古感" },
];

const MAX_REMAKES = 3;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3002");

type ModalState =
  | { type: "none" }
  | { type: "no_code" }
  | { type: "not_found" }
  | { type: "expired" }
  | { type: "new_code_confirm" };

export function RedeemContent() {
  const apiBase = API_BASE;
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase]                   = useState<Phase>("form");
  const [file, setFile]                     = useState<File | null>(null);
  const [localPreview, setLocalPreview]     = useState<string | null>(null);
  const [preset, setPreset]                 = useState<PresetKey>("standard");
  const [style, setStyle]                   = useState<StyleKey>("natural");
  const [code, setCode]                     = useState("");
  const [busy, setBusy]                     = useState(false);
  const [convertError, setConvertError]     = useState("");
  const [modal, setModal]                   = useState<ModalState>({ type: "none" });
  const [remakesRemaining, setRemakesRemaining] = useState<number>(MAX_REMAKES);
  const [satisfied, setSatisfied]               = useState(false);

  const [result, setResult] = useState<{
    code: string;
    previewDataUrl: string;
    inputPreviewDataUrl?: string;
    expiresAt: string;
  } | null>(null);

  const isRemakeMode = phase === "form" && result !== null;

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(f ? URL.createObjectURL(f) : null);
    setConvertError("");
  }

  async function handleConvert() {
    if (!code.trim()) { setModal({ type: "no_code" }); return; }
    if (!file)        { setConvertError("请先上传头像图片"); return; }

    setBusy(true);
    setConvertError("");

    try {
      const fd = new FormData();
      fd.set("code", code.trim());
      fd.set("preset", preset);
      fd.set("style", style);
      fd.set("image", file, file.name);

      const res  = await fetch(`${apiBase}/codes/redeem`, { method: "POST", body: fd });
      const json = (await res.json()) as {
        previewDataUrl?: string;
        inputPreviewDataUrl?: string;
        expiresAt?: string;
        alreadyDone?: boolean;
        remakesRemaining?: number;
        message?: string;
      };

      if (res.status === 404)  { setModal({ type: "not_found" }); return; }
      if (res.status === 403)  { setModal({ type: "expired" });   return; }
      if (!res.ok)             { setConvertError(json.message ?? "转换失败，请重试"); return; }

      const remaining = json.remakesRemaining ?? 0;
      setRemakesRemaining(remaining);
      setResult({
        code: code.trim(),
        previewDataUrl: json.previewDataUrl!,
        inputPreviewDataUrl: json.inputPreviewDataUrl,
        expiresAt: json.expiresAt ?? "",
      });
      setPhase("result");
    } catch {
      setConvertError("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  }

  function handleRemake() {
    setPhase("form");
    setConvertError("");
  }

  function handleDownload() {
    if (!result) return;
    // 直接用内存里的 previewDataUrl 下载，避免浏览器缓存旧版本
    const a = document.createElement("a");
    a.href = result.previewDataUrl;
    a.download = `pixel-avatar-${result.code}.png`;
    a.click();
    setSatisfied(true);
  }

  function handleReset() {
    setPhase("form");
    setFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setCode("");
    setPreset("standard");
    setStyle("natural");
    setResult(null);
    setRemakesRemaining(MAX_REMAKES);
    setSatisfied(false);
    setConvertError("");
  }

  return (
    <div className="flex flex-col items-center justify-start py-10 px-4 overflow-y-auto flex-1">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">🎨 像素头像制作</h1>
          <p className="text-sm text-muted-foreground">上传头像，选择尺寸，输入制作码，一键生成像素风格图片</p>
        </div>

        {/* Form（初次生成 or 重制） */}
        {phase === "form" && (
          <Card>
            <CardContent className="pt-5 space-y-5">

              {/* Remake hint */}
              {isRemakeMode && (
                <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground flex items-center justify-between">
                  <span>重新选择尺寸和风格，再次生成</span>
                  <span className="font-medium text-foreground">剩余 {remakesRemaining} 次重制</span>
                </div>
              )}

              {/* File upload */}
              <div className="space-y-2">
                <Label>头像图片</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {localPreview
                    ? <img src={localPreview} alt="preview" className="mx-auto h-28 w-28 object-contain rounded" />
                    : <div className="text-muted-foreground text-sm">点击上传 PNG / JPG / JPEG</div>}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handlePickFile} />
                {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <Label>像素尺寸</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.key} type="button" onClick={() => setPreset(p.key)}
                      className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                        preset === p.key
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:border-primary/50"}`}>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label>图片风格</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button key={s.key} type="button" onClick={() => setStyle(s.key)}
                      className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                        style === s.key
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:border-primary/50"}`}>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code input */}
              <div className="space-y-2">
                <Label htmlFor="code-input">制作码</Label>
                <Input
                  id="code-input"
                  placeholder="请输入制作码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-base tracking-widest"
                />
              </div>

              {convertError && (
                <Alert variant="destructive">
                  <AlertDescription>{convertError}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleConvert} disabled={busy || !file} className="w-full">
                {busy ? "生成中…" : isRemakeMode ? "重新生成" : "生成像素图"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {phase === "result" && result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">✅ 生成完成！</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid gap-4 ${result.inputPreviewDataUrl ? "grid-cols-2" : "grid-cols-1"}`}>
                {result.inputPreviewDataUrl && (
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">原图</p>
                    <img src={result.inputPreviewDataUrl} alt="原图"
                      className="mx-auto rounded border" style={{ imageRendering: "auto", maxHeight: 160 }} />
                  </div>
                )}
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">像素图</p>
                  <img src={result.previewDataUrl} alt="像素图"
                    className="mx-auto rounded border" style={{ imageRendering: "pixelated", maxHeight: 160 }} />
                </div>
              </div>

              {result.expiresAt && (
                <p className="text-xs text-muted-foreground text-center">
                  图片保存至 {new Date(result.expiresAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}，过期后请重新制作
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center font-mono">制作码：{result.code}</p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button onClick={handleDownload} className="w-full">
                  {!satisfied && remakesRemaining > 0 ? "满意！下载图片" : "下载图片"}
                </Button>
                {!satisfied && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={remakesRemaining === 0}
                    onClick={handleRemake}
                  >
                    {remakesRemaining > 0
                      ? `不满意，重选尺寸（剩余 ${remakesRemaining} 次）`
                      : "重制次数已用完"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setModal({ type: "new_code_confirm" })}
                >
                  制作其他图片
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          每个制作码可重制 3 次 · 以最后生成的图片起算保存 3 天
        </p>
      </div>

      {/* Modals */}
      <Modal open={modal.type === "no_code"} onClose={() => setModal({ type: "none" })}
        title="请输入制作码" description="下单后您会收到制作码，请填写后再生成。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]} />

      <Modal open={modal.type === "not_found"} onClose={() => setModal({ type: "none" })}
        title="制作码不存在" description="请检查制作码是否输入正确。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]} />

      <Modal open={modal.type === "expired"} onClose={() => setModal({ type: "none" })}
        title="制作码已过期" description="该制作码已使用，且生成的图片已超过保存期（3天）。如需重新制作请联系客服。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]} />

      <Modal open={modal.type === "new_code_confirm"} onClose={() => setModal({ type: "none" })}
        title="制作其他图片"
        description="制作其他图片需要使用新的制作码。确认后将清空当前结果，请前往购买新的制作码。"
        actions={[
          { label: "取消", variant: "outline", onClick: () => setModal({ type: "none" }) },
          { label: "确定", onClick: () => { setModal({ type: "none" }); handleReset(); } },
        ]} />
    </div>
  );
}

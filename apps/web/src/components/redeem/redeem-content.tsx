"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

type PresetKey = "mini" | "standard" | "hd";

const PRESETS: { key: PresetKey; label: string; desc: string }[] = [
  { key: "mini",     label: "32×32 迷你版",  desc: "适合小头像、表情包" },
  { key: "standard", label: "64×64 标准版",  desc: "最常用尺寸" },
  { key: "hd",       label: "128×128 高清版", desc: "细节更丰富" },
];

function getApiBase() {
  if (typeof window === "undefined") return "http://localhost:3002";
  return process.env.NEXT_PUBLIC_API_BASE ??
    (window.location.hostname === "localhost" ? "http://localhost:3002" : "/api");
}

type ModalState =
  | { type: "none" }
  | { type: "no_code" }
  | { type: "not_found" }
  | { type: "used_ask"; code: string }
  | { type: "expired" };

export function RedeemContent() {
  const apiBase = getApiBase();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile]               = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [preset, setPreset]           = useState<PresetKey>("standard");
  const [code, setCode]               = useState("");
  const [busy, setBusy]               = useState(false);
  const [convertError, setConvertError] = useState("");
  const [modal, setModal]             = useState<ModalState>({ type: "none" });

  const [result, setResult] = useState<{
    code: string;
    previewDataUrl: string;
    inputPreviewDataUrl?: string;
    expiresAt: string;
    alreadyDone: boolean;
  } | null>(null);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(f ? URL.createObjectURL(f) : null);
    setConvertError("");
    setResult(null);
  }

  async function fetchExistingResult(c: string): Promise<string | null> {
    const res = await fetch(`${apiBase}/results/${c}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function handleConvert() {
    if (!code.trim()) {
      setModal({ type: "no_code" });
      return;
    }
    if (!file) {
      setConvertError("请先上传头像图片");
      return;
    }

    setBusy(true);
    setConvertError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.set("code", code.trim());
      fd.set("preset", preset);
      fd.set("image", file, file.name);

      const res = await fetch(`${apiBase}/codes/redeem`, { method: "POST", body: fd });
      const json = (await res.json()) as {
        previewDataUrl?: string;
        inputPreviewDataUrl?: string;
        expiresAt?: string;
        alreadyDone?: boolean;
        message?: string;
        statusCode?: number;
      };

      if (res.status === 404) {
        setModal({ type: "not_found" });
        return;
      }

      if (res.status === 400 && json.message === "兑换码已使用") {
        // Check if result is still alive
        const validate = await fetch(`${apiBase}/codes/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim() }),
        });
        const vJson = (await validate.json()) as { valid: boolean; reason?: string };
        if (vJson.reason === "used_has_result") {
          setModal({ type: "used_ask", code: code.trim() });
        } else {
          setModal({ type: "expired" });
        }
        return;
      }

      if (!res.ok) {
        setConvertError(json.message ?? "转换失败，请重试");
        return;
      }

      setResult({
        code: code.trim(),
        previewDataUrl: json.previewDataUrl!,
        inputPreviewDataUrl: json.inputPreviewDataUrl,
        expiresAt: json.expiresAt ?? "",
        alreadyDone: json.alreadyDone ?? false,
      });

      // If already done, the server returns the stored image
      if (json.alreadyDone) {
        const url = await fetchExistingResult(code.trim());
        if (url) {
          setResult(prev => prev ? { ...prev, previewDataUrl: url } : prev);
        }
      }
    } catch {
      setConvertError("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  }

  async function handleShowExisting(c: string) {
    setModal({ type: "none" });
    setBusy(true);
    try {
      const url = await fetchExistingResult(c);
      if (url) {
        setResult({
          code: c,
          previewDataUrl: url,
          expiresAt: "",
          alreadyDone: true,
        });
      } else {
        setModal({ type: "expired" });
      }
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `${apiBase}/results/${result.code}`;
    a.download = `pixel-avatar-${result.code}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center justify-start py-10 px-4 overflow-y-auto flex-1">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">🎨 像素头像制作</h1>
          <p className="text-sm text-muted-foreground">上传头像，选择尺寸，输入制作码，一键生成像素风格图片</p>
        </div>

        {/* Main form */}
        <Card>
          <CardContent className="pt-5 space-y-5">

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
                        : "border-border hover:border-primary/50"
                    }`}>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
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
              {busy ? "生成中…" : "生成像素图"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {result.alreadyDone ? "已生成的像素图" : "✅ 生成完成！"}
              </CardTitle>
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
              {result.code && (
                <p className="text-xs text-muted-foreground text-center font-mono">制作码：{result.code}</p>
              )}
              <Button onClick={handleDownload} className="w-full">下载像素图 PNG</Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          每个制作码仅限使用一次 · 生成结果保存 3 天
        </p>
      </div>

      {/* Modals */}
      <Modal
        open={modal.type === "no_code"}
        onClose={() => setModal({ type: "none" })}
        title="请输入制作码"
        description="下单后您会收到制作码，请填写后再生成。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]}
      />

      <Modal
        open={modal.type === "not_found"}
        onClose={() => setModal({ type: "none" })}
        title="制作码不存在"
        description="请检查制作码是否输入正确。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]}
      />

      <Modal
        open={modal.type === "used_ask"}
        onClose={() => setModal({ type: "none" })}
        title="制作码已使用"
        description="该制作码已生成过图片，是否查看已生成的图片？"
        actions={[
          { label: "取消", variant: "outline", onClick: () => setModal({ type: "none" }) },
          {
            label: "查看图片",
            onClick: () => {
              const c = modal.type === "used_ask" ? modal.code : "";
              handleShowExisting(c);
            },
          },
        ]}
      />

      <Modal
        open={modal.type === "expired"}
        onClose={() => setModal({ type: "none" })}
        title="制作码已过期"
        description="该制作码已使用，且生成的图片已超过保存期（3天）。如需重新制作请联系客服。"
        actions={[{ label: "确定", onClick: () => setModal({ type: "none" }) }]}
      />
    </div>
  );
}

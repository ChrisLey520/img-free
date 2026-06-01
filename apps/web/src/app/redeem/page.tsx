"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "code" | "upload" | "result";
type PresetKey = "mini" | "standard" | "hd";

const PRESETS: { key: PresetKey; label: string; desc: string }[] = [
  { key: "mini", label: "32×32 迷你版", desc: "适合小头像、表情包" },
  { key: "standard", label: "64×64 标准版", desc: "最常用尺寸" },
  { key: "hd", label: "128×128 高清版", desc: "细节更丰富" },
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api"
    : "http://localhost:3002");

export default function RedeemPage() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetKey>("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    previewDataUrl: string;
    inputPreviewDataUrl?: string;
    expiresAt: string;
    alreadyDone: boolean;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleValidateCode() {
    if (!code.trim()) {
      setCodeError("请输入兑换码");
      return;
    }
    setBusy(true);
    setCodeError("");
    try {
      const res = await fetch(`${API_BASE}/codes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = (await res.json()) as { valid: boolean; reason?: string; expiresAt?: string };
      if (json.valid) {
        setStep("upload");
      } else if (json.reason === "used_has_result") {
        // Already used but result still alive — jump straight to result
        const buf = await fetch(`${API_BASE}/results/${code.trim()}`);
        if (buf.ok) {
          const blob = await buf.blob();
          const url = URL.createObjectURL(blob);
          setResult({
            previewDataUrl: url,
            expiresAt: json.expiresAt ?? "",
            alreadyDone: true,
          });
          setStep("result");
        } else {
          setCodeError("兑换码已使用");
        }
      } else {
        const msgs: Record<string, string> = {
          not_found: "兑换码不存在",
          used: "兑换码已使用",
          expired: "兑换码已过期",
        };
        setCodeError(msgs[json.reason ?? ""] ?? "兑换码无效");
      }
    } catch {
      setCodeError("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(f ? URL.createObjectURL(f) : null);
    setError("");
  }

  async function handleConvert() {
    if (!file) {
      setError("请先上传头像图片");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("code", code.trim());
      fd.set("preset", preset);
      fd.set("image", file, file.name);
      const res = await fetch(`${API_BASE}/codes/redeem`, { method: "POST", body: fd });
      const json = (await res.json()) as {
        previewDataUrl?: string;
        inputPreviewDataUrl?: string;
        expiresAt?: string;
        alreadyDone?: boolean;
        message?: string;
      };
      if (!res.ok) throw new Error(json.message ?? "转换失败");
      setResult({
        previewDataUrl: json.previewDataUrl!,
        inputPreviewDataUrl: json.inputPreviewDataUrl,
        expiresAt: json.expiresAt ?? "",
        alreadyDone: json.alreadyDone ?? false,
      });
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = `${API_BASE}/results/${code.trim()}`;
    a.download = `pixel-avatar-${code.trim()}.png`;
    a.click();
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">🎨 像素头像制作</h1>
          <p className="text-sm text-muted-foreground">输入兑换码，上传头像，获取专属像素风格图片</p>
        </div>

        {/* Step 1: Enter code */}
        {step === "code" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">第 1 步：输入兑换码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code-input">兑换码</Label>
                <Input
                  id="code-input"
                  placeholder="请输入您收到的 12 位兑换码"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                  className="font-mono text-base tracking-widest"
                />
                {codeError && <p className="text-sm text-destructive">{codeError}</p>}
              </div>
              <Button onClick={handleValidateCode} disabled={busy} className="w-full">
                {busy ? "验证中…" : "验证兑换码"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload + pick preset */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">第 2 步：上传头像 & 选择尺寸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* File picker */}
              <div className="space-y-2">
                <Label>头像图片</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {localPreview ? (
                    <img src={localPreview} alt="preview" className="mx-auto h-28 w-28 object-contain rounded" />
                  ) : (
                    <div className="text-muted-foreground text-sm">点击上传 PNG / JPG / JPEG</div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handlePickFile} />
                {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <Label>像素尺寸</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPreset(p.key)}
                      className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                        preset === p.key
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleConvert} disabled={busy || !file} className="w-full">
                {busy ? "生成中…" : "生成像素图"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {result.alreadyDone ? "您的像素图（已生成）" : "✅ 生成完成！"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid gap-4 ${result.inputPreviewDataUrl ? "grid-cols-2" : "grid-cols-1"}`}>
                {result.inputPreviewDataUrl && (
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">原图</p>
                    <img src={result.inputPreviewDataUrl} alt="原图" className="mx-auto rounded border" style={{ imageRendering: "auto", maxHeight: 160 }} />
                  </div>
                )}
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">像素图</p>
                  <img
                    src={result.previewDataUrl}
                    alt="像素图"
                    className="mx-auto rounded border"
                    style={{ imageRendering: "pixelated", maxHeight: 160 }}
                  />
                </div>
              </div>

              {result.expiresAt && (
                <p className="text-xs text-muted-foreground text-center">
                  图片保存至 {new Date(result.expiresAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}

              <Button onClick={handleDownload} className="w-full">
                下载像素图 PNG
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          每个兑换码仅限使用一次 · 生成结果保存 3 天
        </p>
      </div>
    </main>
  );
}

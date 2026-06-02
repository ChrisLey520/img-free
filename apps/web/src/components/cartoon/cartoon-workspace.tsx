"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3002");

export function CartoonWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleConvert() {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("image", file, file.name);
      const res = await fetch(`${API_BASE}/cartoon/convert`, { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(json.message ?? "转换失败");
      }
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = file ? `cartoon_${file.name.replace(/\.[^.]+$/, "")}.png` : "cartoon.png";
    a.click();
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-semibold">漫画风转换</h2>

          {/* Upload */}
          <div className="space-y-1.5">
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              {preview ? (
                <img src={preview} alt="" className="mx-auto max-h-40 object-contain rounded" />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  点击或拖拽上传图片<br />PNG / JPG / JPEG
                </p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onInputChange}
            />
            {file && (
              <p className="text-xs text-muted-foreground truncate">{file.name}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleConvert} disabled={busy || !file} className="w-full">
            {busy
              ? <span className="flex items-center gap-2"><span className="animate-spin">⚙</span>转换中…</span>
              : "开始转换"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            使用 AnimeGANv2 模型，本地推理无需 API Key
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-muted/20">
        {result ? (
          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">原图</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div
                    className="cursor-zoom-in rounded-lg overflow-hidden border bg-muted"
                    onClick={() => preview && setLightbox(preview)}
                  >
                    {preview && <img src={preview} alt="original" className="w-full object-contain" />}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">漫画风</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div
                    className="cursor-zoom-in rounded-lg overflow-hidden border bg-muted"
                    onClick={() => setLightbox(result)}
                  >
                    <img src={result} alt="cartoon" className="w-full object-contain" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={download}>
                    下载 PNG
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3 max-w-xs">
              <div className="text-5xl">🎨</div>
              <p className="text-sm font-medium">上传图片，一键转漫画风</p>
              <p className="text-xs leading-relaxed">
                基于 AnimeGANv2 Hayao 风格模型，将照片或插图转换为动漫画风。本地 ONNX 推理，无需联网。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="preview" className="max-h-full max-w-full rounded-lg shadow-2xl object-contain" />
        </div>
      )}
    </div>
  );
}

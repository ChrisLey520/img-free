"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3002");

type Mode = "text" | "image";
type Model = "dall-e-2" | "dall-e-3" | "gpt-image-1" | "gpt-image-2";

const MODEL_SIZES: Record<Model, string[]> = {
  "dall-e-2":    ["256x256", "512x512", "1024x1024"],
  "dall-e-3":    ["1024x1024", "1792x1024", "1024x1792"],
  "gpt-image-1": ["1024x1024", "1536x1024", "1024x1536"],
  "gpt-image-2": ["1024x1024", "1536x1024", "1024x1536"],
};

const DALLE3_QUALITIES = ["standard", "hd"];
const GPT_IMAGE_QUALITIES = ["low", "medium", "high"];

function modelSupportsEdit(model: Model) {
  return model !== "dall-e-3";
}

function qualityOptions(model: Model): string[] {
  if (model === "dall-e-3") return DALLE3_QUALITIES;
  if (model === "gpt-image-1" || model === "gpt-image-2") return GPT_IMAGE_QUALITIES;
  return [];
}

export function ImageGenWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode]           = useState<Mode>("text");
  const [model, setModel]         = useState<Model>("dall-e-3");
  const [prompt, setPrompt]       = useState("");
  const [n, setN]                 = useState(1);
  const [size, setSize]           = useState("1024x1024");
  const [quality, setQuality]     = useState("");
  const [refImage, setRefImage]   = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");
  const [images, setImages]       = useState<string[]>([]);
  const [lightbox, setLightbox]   = useState<string | null>(null);

  function handleModelChange(m: Model) {
    setModel(m);
    const sizes = MODEL_SIZES[m];
    if (!sizes.includes(size)) setSize(sizes[0]);
    if (mode === "image" && !modelSupportsEdit(m)) setMode("text");
    setQuality("");
  }

  function handleRefImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setRefImage(f);
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError("请输入描述词"); return; }
    if (mode === "image" && !refImage) { setError("图生图模式需要上传参考图片"); return; }

    setBusy(true);
    setError("");
    setImages([]);

    try {
      const fd = new FormData();
      fd.set("mode", mode);
      fd.set("model", model);
      fd.set("prompt", prompt.trim());
      fd.set("n", String(n));
      fd.set("size", size);
      if (quality) fd.set("quality", quality);
      if (mode === "image" && refImage) fd.set("image", refImage, refImage.name);

      const res = await fetch(`${API_BASE}/image-gen/generate`, { method: "POST", body: fd });
      const json = await res.json() as { images?: string[]; message?: string };
      if (!res.ok) throw new Error(json.message ?? "生成失败");
      setImages(json.images ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function download(dataUrl: string, idx: number) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `image_${idx + 1}.png`;
    a.click();
  }

  const qualities = qualityOptions(model);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-semibold">AI 图像生成</h2>

          {/* Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs">模式</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["text", "image"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={m === "image" && !modelSupportsEdit(model)}
                  onClick={() => setMode(m)}
                  className={`rounded border px-2 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === m ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"}`}
                >
                  {m === "text" ? "文生图" : "图生图"}
                </button>
              ))}
            </div>
            {model === "dall-e-3" && (
              <p className="text-xs text-muted-foreground">dall-e-3 不支持图生图</p>
            )}
          </div>

          {/* Reference image (image mode) */}
          {mode === "image" && (
            <div className="space-y-1.5">
              <Label className="text-xs">参考图片</Label>
              <div
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {refPreview
                  ? <img src={refPreview} alt="" className="mx-auto h-20 w-20 object-contain rounded" />
                  : <p className="text-xs text-muted-foreground">点击上传参考图<br />PNG / JPG</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleRefImage} />
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs">描述词（Prompt）</Label>
            <textarea
              placeholder="描述你想要生成的图片内容…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Separator />

          {/* Model */}
          <div className="space-y-1.5">
            <Label className="text-xs">模型</Label>
            <Select value={model} onValueChange={(v) => handleModelChange(v as Model)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dall-e-2">dall-e-2</SelectItem>
                <SelectItem value="dall-e-3">dall-e-3</SelectItem>
                <SelectItem value="gpt-image-1">gpt-image-1</SelectItem>
                <SelectItem value="gpt-image-2">gpt-image-2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <Label className="text-xs">尺寸</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_SIZES[model].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          {qualities.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">质量</Label>
              <Select value={quality || qualities[0]} onValueChange={setQuality}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {qualities.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Count */}
          <div className="space-y-1.5">
            <Label className="text-xs">生成数量</Label>
            <Select value={String(n)} onValueChange={(v) => setN(Number(v))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((i) => (
                  <SelectItem key={i} value={String(i)}>{i} 张</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleGenerate} disabled={busy || !prompt.trim()} className="w-full">
            {busy
              ? <span className="flex items-center gap-2"><span className="animate-spin">⚙</span>生成中…</span>
              : "生成图像"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">需要配置 OPENAI_API_KEY · 按量计费</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-muted/20">
        {images.length > 0 ? (
          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{images.length} 张</Badge>
              <Badge variant="outline">{model}</Badge>
              <Badge variant="outline">{size}</Badge>
            </div>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">生成结果</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="space-y-2">
                      <div
                        className="cursor-zoom-in rounded-lg overflow-hidden border bg-muted"
                        onClick={() => setLightbox(url)}
                      >
                        <img src={url} alt={`result ${i + 1}`} className="w-full object-contain" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => download(url, i)}>
                        下载第 {i + 1} 张
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3 max-w-xs">
              <div className="text-5xl">🎨</div>
              <p className="text-sm font-medium">输入描述词，生成图像</p>
              <p className="text-xs leading-relaxed">
                支持 dall-e-2、dall-e-3、gpt-image-1、gpt-image-2，文生图和图生图两种模式，每次最多生成 4 张。
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

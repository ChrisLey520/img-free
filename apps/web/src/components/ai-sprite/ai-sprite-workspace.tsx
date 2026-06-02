"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3002");

const PRESET_ACTIONS = ["行走", "奔跑", "待机", "跳跃", "攻击", "受伤", "死亡", "防御", "蹲伏", "翻滚", "施法", "推", "爬行", "胜利"];

type PipelineMode = "img2img" | "controlnet";
type Provider = "replicate" | "huggingface";

interface GenerateResult {
  frames: string[];
  posePreviewDataUrls: string[];
  frameCount: number;
  cellW: number;
  cellH: number;
  mode: PipelineMode;
}

export function AiSpriteWorkspace() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage]             = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [characterDesc, setCharacterDesc] = useState("");
  const [action, setAction]           = useState("行走");
  const [customAction, setCustomAction] = useState("");
  const [frameCount, setFrameCount]   = useState(4);
  const [cellSize, setCellSize]       = useState(64);
  const [style, setStyle]             = useState<"pixel" | "smooth">("pixel");
  const [mode, setMode]               = useState<PipelineMode>("img2img");
  const [provider, setProvider]       = useState<Provider>("replicate");
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");
  const [result, setResult]           = useState<GenerateResult | null>(null);
  const [selectedFrame, setSelectedFrame] = useState(0);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImage(f);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
    setError("");
  }

  const effectiveAction = action === "__custom__" ? customAction : action;

  async function handleGenerate() {
    if (!image) { setError("请先上传角色参考图"); return; }
    if (!effectiveAction.trim()) { setError("请输入动作描述"); return; }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.set("image", image, image.name);
      fd.set("characterDesc", characterDesc);
      fd.set("action", effectiveAction.trim());
      fd.set("frameCount", String(frameCount));
      fd.set("cellW", String(cellSize));
      fd.set("cellH", String(cellSize));
      fd.set("style", style);
      fd.set("mode", mode);
      fd.set("provider", provider);

      const res  = await fetch(`${API_BASE}/ai-sprite/generate`, { method: "POST", body: fd });
      const json = (await res.json()) as GenerateResult & { message?: string };
      if (!res.ok) throw new Error(json.message ?? "生成失败");
      setResult(json);
      setSelectedFrame(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function downloadFrame(dataUrl: string, idx: number) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${effectiveAction}_frame_${idx + 1}.png`;
    a.click();
  }

  function downloadAll() {
    if (!result) return;
    result.frames.forEach((url, i) => downloadFrame(url, i));
  }

  function sendToSpriteSheet() {
    if (!result) return;
    sessionStorage.setItem(
      "ai_sprite_transfer",
      JSON.stringify({ frames: result.frames, action: effectiveAction, cellSize: result.cellW }),
    );
    router.push("/sprite-sheet");
  }

  const scale = cellSize <= 32 ? 6 : cellSize <= 64 ? 4 : 2;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-semibold">AI 生成精灵动作</h2>

          {/* Upload */}
          <div className="space-y-2">
            <Label className="text-xs">角色参考图</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {localPreview
                ? <img src={localPreview} alt="" className="mx-auto h-24 w-24 object-contain rounded"
                    style={{ imageRendering: "pixelated" }} />
                : <div className="text-xs text-muted-foreground">点击上传角色图片<br />PNG / JPG</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePickFile} />
            {image && <p className="text-xs text-muted-foreground truncate">{image.name}</p>}
          </div>

          {/* Character description */}
          <div className="space-y-1.5">
            <Label className="text-xs">角色描述（可选）</Label>
            <textarea
              placeholder="e.g. 红衣战士，头戴盔甲，手持宝剑"
              value={characterDesc}
              onChange={(e) => setCharacterDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">描述得越详细，一致性越好</p>
          </div>

          <Separator />

          {/* Action */}
          <div className="space-y-1.5">
            <Label className="text-xs">动作类型</Label>
            <Select value={action} onValueChange={(v) => v && setAction(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
                <SelectItem value="__custom__">自定义…</SelectItem>
              </SelectContent>
            </Select>
            {action === "__custom__" && (
              <textarea
                placeholder="输入动作描述，如：施法、挥手"
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
          </div>

          {/* Frame count */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">帧数</Label>
              <Select value={String(frameCount)} onValueChange={(v) => setFrameCount(Number(v))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 6, 8].map((n) => <SelectItem key={n} value={String(n)}>{n} 帧</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">帧尺寸</Label>
              <Select value={String(cellSize)} onValueChange={(v) => setCellSize(Number(v))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[32, 64, 128].map((s) => <SelectItem key={s} value={String(s)}>{s}×{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <Label className="text-xs">像素风格</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["pixel", "smooth"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStyle(s)}
                  className={`rounded border px-2 py-1.5 text-xs transition-colors ${
                    style === s ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                  {s === "pixel" ? "🕹 像素游戏风" : "🎨 自然色彩"}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <Label className="text-xs">提供商</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { key: "replicate",   label: "Replicate",    desc: "付费·支持 img2img / ControlNet" },
                { key: "huggingface", label: "HuggingFace",  desc: "免费额度·纯文本生成" },
              ] as const).map((p) => (
                <button key={p.key} type="button" onClick={() => setProvider(p.key)}
                  className={`rounded border px-2 py-1.5 text-xs text-left transition-colors ${
                    provider === p.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-muted-foreground mt-0.5 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
            {provider === "huggingface" && (
              <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                需配置 HUGGINGFACE_API_TOKEN · 不使用参考图 conditioning，仅凭提示词生成
              </p>
            )}
          </div>

          {/* Pipeline mode */}
          <div className="space-y-1.5">
            <Label className="text-xs">生成管线</Label>
            <div className="space-y-1.5">
              {([
                { key: "img2img",    label: "⚡ 标准 img2img",        desc: "快速，基于参考图风格迁移" },
                { key: "controlnet", label: "🦴 ControlNet 骨骼绑定", desc: "预置骨骼姿态，动作更标准" },
              ] as const).map((m) => (
                <button key={m.key} type="button" onClick={() => setMode(m.key)}
                  className={`w-full rounded border px-3 py-2 text-xs text-left transition-colors ${
                    mode === m.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                  <div className="font-medium">{m.label}</div>
                  <div className="text-muted-foreground mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
            {mode === "controlnet" && (
              <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                骨骼姿态由预置库驱动，对应 7 种动作各 4 帧关键姿势
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleGenerate} disabled={busy || !image} className="w-full">
            {busy
              ? <span className="flex items-center gap-2"><span className="animate-spin">⚙</span>AI 生成中…（约 20-60 秒）</span>
              : "✨ AI 生成动作帧"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            需要配置 REPLICATE_API_TOKEN · 按量计费
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-muted/20">
        {result ? (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{result.frameCount} 帧</Badge>
              <Badge variant="secondary">{result.cellW}×{result.cellH} px</Badge>
              <Badge variant="outline">{effectiveAction}</Badge>
              <Badge variant="outline">{style === "pixel" ? "像素游戏风" : "自然色彩"}</Badge>
            </div>

            {/* ControlNet 骨骼预览 */}
            {result.mode === "controlnet" && result.posePreviewDataUrls.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">骨骼姿态（ControlNet conditioning）</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex gap-2 flex-wrap">
                    {result.posePreviewDataUrls.map((url, i) => (
                      <div key={i} className="text-center space-y-1">
                        <img src={url} alt={`pose ${i + 1}`}
                          style={{ imageRendering: "pixelated", width: 64, height: 64 }}
                          className="rounded border border-muted" />
                        <p className="text-xs text-muted-foreground">帧 {i + 1}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    以上为传入 ControlNet 的 OpenPose 骨骼图，用于约束每帧的姿态
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Frame strip */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">动作帧预览</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Thumbnail strip */}
                <div className="flex gap-2 flex-wrap">
                  {result.frames.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedFrame(i)}
                      className={`rounded border-2 transition-colors bg-[repeating-conic-gradient(#ccc_0_90deg,transparent_0_180deg)] bg-[size:8px_8px] ${
                        selectedFrame === i ? "border-primary" : "border-transparent hover:border-primary/50"}`}
                    >
                      <img
                        src={url}
                        alt={`frame ${i + 1}`}
                        style={{
                          imageRendering: "pixelated",
                          width: cellSize * scale,
                          height: cellSize * scale,
                          display: "block",
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Selected frame large view */}
                <div className="flex justify-center">
                  <div className="rounded-lg border bg-[repeating-conic-gradient(#ccc_0_90deg,transparent_0_180deg)] bg-[size:16px_16px] p-4 inline-block">
                    <img
                      src={result.frames[selectedFrame]}
                      alt="selected frame"
                      style={{
                        imageRendering: "pixelated",
                        width: Math.min(cellSize * scale * 2, 256),
                        height: Math.min(cellSize * scale * 2, 256),
                        display: "block",
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  第 {selectedFrame + 1} / {result.frameCount} 帧（点击缩略图切换）
                </p>
              </CardContent>
            </Card>

            {/* Download */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">下载</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={sendToSpriteSheet}>
                    发送到精灵表制作 →
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadAll}>
                    下载全部帧（{result.frameCount} 张 PNG）
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFrame(result.frames[selectedFrame], selectedFrame)}>
                    下载当前帧
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  点击「发送到精灵表制作」可一键跳转并自动导入所有帧
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3 max-w-xs">
              <div className="text-5xl">🤖</div>
              <p className="text-sm font-medium">上传角色图，描述动作</p>
              <p className="text-xs leading-relaxed">
                AI 会根据你的角色参考图，生成对应动作的多帧像素精灵素材。
                生成后可直接下载，或导入精灵表制作工具拼合动画。
              </p>
              <div className="text-xs text-left bg-muted rounded-lg p-3 space-y-1">
                <p className="font-medium">支持的动作预设：</p>
                <p className="text-muted-foreground">{PRESET_ACTIONS.join("、")}，或自定义描述</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

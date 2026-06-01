"use client";

import { useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FrameItem {
  id: string;
  file: File;
  localUrl: string;
  name: string;
}

interface BuildResult {
  sheetDataUrl: string;
  gifDataUrl: string;
  atlasJson: object;
  sheetWidth: number;
  sheetHeight: number;
  frameCount: number;
}

function getApiBase() {
  if (typeof window === "undefined") return "http://localhost:3002";
  return process.env.NEXT_PUBLIC_API_BASE ??
    (window.location.hostname === "localhost" ? "http://localhost:3002" : "/api");
}

let idCounter = 0;
function nextId() { return `f${++idCounter}`; }

export function SpriteSheetWorkspace() {
  const apiBase = getApiBase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [frames, setFrames]   = useState<FrameItem[]>([]);
  const [cellW, setCellW]     = useState(32);
  const [cellH, setCellH]     = useState(32);
  const [columns, setColumns] = useState(4);
  const [fit, setFit]         = useState<"inside" | "cover" | "fill">("inside");
  const [fps, setFps]         = useState(8);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<BuildResult | null>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const items: FrameItem[] = Array.from(fileList).map((file) => ({
      id: nextId(),
      file,
      localUrl: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""),
    }));
    setFrames((prev) => [...prev, ...items]);
    setResult(null);
    setError("");
  }

  function removeFrame(id: string) {
    setFrames((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.localUrl);
      return prev.filter((x) => x.id !== id);
    });
    setResult(null);
  }

  function moveFrame(id: string, dir: -1 | 1) {
    setFrames((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setResult(null);
  }

  function renameFrame(id: string, name: string) {
    setFrames((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
    setResult(null);
  }

  async function handleBuild() {
    if (frames.length === 0) { setError("请先上传至少 1 帧图片"); return; }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      frames.forEach((f) => fd.append("frames", f.file, f.file.name));
      fd.set("cellW", String(cellW));
      fd.set("cellH", String(cellH));
      fd.set("columns", String(Math.min(columns, frames.length)));
      fd.set("fit", fit);
      fd.set("fps", String(fps));
      fd.set("frameNames", JSON.stringify(frames.map((f) => f.name)));

      const res = await fetch(`${apiBase}/spritesheet/build`, { method: "POST", body: fd });
      const json = (await res.json()) as BuildResult & { message?: string };
      if (!res.ok) throw new Error(json.message ?? "生成失败");
      setResult(json as BuildResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function download(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.atlasJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    download(url, "atlas.json");
    URL.revokeObjectURL(url);
  }

  const cols = Math.min(columns, Math.max(1, frames.length));
  const rows = frames.length > 0 ? Math.ceil(frames.length / cols) : 0;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-3">精灵表制作</h2>

            {/* Upload */}
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors text-sm text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              点击或拖拽上传帧图片<br />
              <span className="text-xs">PNG / JPG，支持多选</span>
            </div>
            <input
              ref={fileInputRef} type="file" multiple
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* Frame list */}
          {frames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">帧列表（{frames.length} 帧）</Label>
              {frames.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-1.5 rounded border p-1.5">
                  <img src={f.localUrl} alt="" className="h-8 w-8 object-contain rounded shrink-0"
                    style={{ imageRendering: "pixelated" }} />
                  <Input
                    value={f.name}
                    onChange={(e) => renameFrame(f.id, e.target.value)}
                    className="h-7 text-xs px-1.5 flex-1 min-w-0"
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveFrame(f.id, -1)} disabled={idx === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowUpIcon className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveFrame(f.id, 1)} disabled={idx === frames.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowDownIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFrame(f.id)}
                    className="p-0.5 text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Config */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">配置</Label>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">帧宽 px</Label>
                <Input type="number" min={1} max={512} value={cellW}
                  onChange={(e) => { setCellW(Number(e.target.value) || 32); setResult(null); }}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">帧高 px</Label>
                <Input type="number" min={1} max={512} value={cellH}
                  onChange={(e) => { setCellH(Number(e.target.value) || 32); setResult(null); }}
                  className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">每行帧数</Label>
                <Input type="number" min={1} max={64} value={columns}
                  onChange={(e) => { setColumns(Number(e.target.value) || 4); setResult(null); }}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GIF FPS</Label>
                <Input type="number" min={1} max={60} value={fps}
                  onChange={(e) => { setFps(Number(e.target.value) || 8); setResult(null); }}
                  className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">缩放适配</Label>
              <Select value={fit} onValueChange={(v) => { setFit(v as typeof fit); setResult(null); }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside">包含（保持比例，留边）</SelectItem>
                  <SelectItem value="cover">覆盖（裁剪填满）</SelectItem>
                  <SelectItem value="fill">拉伸（精确填满）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                → 精灵表：{cols} 列 × {rows} 行，共 {cols * cellW} × {rows * cellH} px
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleBuild} disabled={busy || frames.length === 0} className="w-full">
            {busy ? "生成中…" : "生成精灵表"}
          </Button>

          {/* Downloads */}
          {result && (
            <div className="space-y-2">
              <Separator />
              <Label className="text-xs text-muted-foreground">下载</Label>
              <Button variant="outline" size="sm" className="w-full"
                onClick={() => download(result.sheetDataUrl, "sprite-sheet.png")}>
                下载 PNG 精灵表
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={downloadJson}>
                下载 JSON Atlas
              </Button>
              <Button variant="outline" size="sm" className="w-full"
                onClick={() => download(result.gifDataUrl, "animation.gif")}>
                下载 GIF 动画
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right panel – preview */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-muted/20">
        {result ? (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Sheet info */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{result.frameCount} 帧</Badge>
              <Badge variant="secondary">{result.sheetWidth} × {result.sheetHeight} px</Badge>
              <Badge variant="outline">精灵表 PNG</Badge>
            </div>

            {/* Sprite sheet preview */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">精灵表预览</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-auto max-h-80 rounded border bg-[repeating-conic-gradient(#ccc_0_90deg,transparent_0_180deg)] bg-[size:16px_16px]">
                  <img
                    src={result.sheetDataUrl}
                    alt="sprite sheet"
                    style={{ imageRendering: "pixelated", display: "block" }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* GIF preview */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">GIF 动画预览</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex justify-center bg-[repeating-conic-gradient(#ccc_0_90deg,transparent_0_180deg)] bg-[size:16px_16px] rounded border p-4">
                  <img
                    src={result.gifDataUrl}
                    alt="animation preview"
                    style={{ imageRendering: "pixelated", maxHeight: 200 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{fps} FPS · 循环播放</p>
              </CardContent>
            </Card>

            {/* Atlas JSON preview */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Atlas JSON 预览</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48 leading-relaxed">
                  {JSON.stringify(result.atlasJson, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎮</div>
              <p>上传帧图片后点击「生成精灵表」</p>
              <p className="text-xs">支持导出 PNG + JSON Atlas + GIF 动画</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

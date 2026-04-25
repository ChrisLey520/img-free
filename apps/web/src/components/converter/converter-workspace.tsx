"use client";

import { useEffect, useState } from "react";
import {
  ImageIcon,
  Loader2Icon,
  SlidersHorizontalIcon,
  UploadIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  GAME_PAYLOAD_MAX_CELLS,
  SPRITE_MAX_SIDE,
  formatBytes,
  type TargetFormat,
  type UseConverterReturn,
} from "@/hooks/use-converter";
import { useT } from "@/i18n/locale-provider";

type Props = {
  model: UseConverterReturn;
  tool: "format" | "sprite";
};

/** 主工作区：容器宽度足够时左表单 / 右预览分栏；右侧 Before|After 再并排 */
export function ConverterWorkspace({ model, tool }: Props) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const { t } = useT();

  const {
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
  } = model;

  useEffect(() => {
    if (tool !== "sprite") return;
    setSpriteEnabled(true);
    setTargetFormat("png");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  const runConvert = tool === "sprite" ? () => convertWith({ spriteEnabled }) : onConvert;

  const controlsBody = (
    <div className="flex flex-col gap-10 px-5 pt-0 pb-6 sm:px-6 [&_[data-slot=input]]:h-11 [&_[data-slot=input]]:min-h-11 [&_[data-slot=input]]:text-base">
      <div className="flex flex-col gap-4">
        <Label htmlFor="converter-file" className="text-sm text-muted-foreground">
          {t("controls.sourceFile")}
        </Label>
        <label
          htmlFor="converter-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-10 transition-colors hover:bg-muted/50"
        >
          <input
            id="converter-file"
            className="sr-only"
            type="file"
            accept="image/*,.tex"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <UploadIcon className="size-10 text-muted-foreground" aria-hidden />
          <span className="text-center text-base font-medium">{t("controls.chooseOrDrop")}</span>
          <span className="text-center text-sm text-muted-foreground">{t("controls.supportedFormats")}</span>
        </label>
        {file ? <p className="text-center text-sm text-muted-foreground">{formatBytes(file.size)}</p> : null}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label htmlFor="format-select" className="text-sm text-muted-foreground">
          {t("controls.outputFormat")}
        </Label>
        <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as TargetFormat)}>
          <SelectTrigger id="format-select" className="h-11 w-full min-h-11 text-base">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="ico">ICO</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {tool === "sprite" ? (
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-4 text-sm leading-snug">
            <Checkbox checked={spriteEnabled} onCheckedChange={(v) => setSpriteEnabled(Boolean(v))} />
            <span>{t("controls.pixelSprite")}</span>
          </label>
          {targetFormat !== "png" ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{t("controls.spriteRequiresPng")}</p>
          ) : null}
        </div>
      ) : null}

      {tool === "format" ? (
        <div className="flex flex-col gap-4">
          <Label htmlFor="format-select" className="text-sm text-muted-foreground">
            {t("controls.outputFormat")}
          </Label>
          <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as TargetFormat)}>
            <SelectTrigger id="format-select" className="h-11 w-full min-h-11 text-base">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="ico">ICO</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Label className="text-sm text-muted-foreground">{t("controls.outputFormatFixed", { format: "PNG" })}</Label>
          <Badge variant="secondary" className="w-fit font-mono text-xs font-normal">
            PNG
          </Badge>
        </div>
      )}

      {tool === "format" && targetFormat === "jpeg" ? (
        <>
          <Separator />
          <div className="flex flex-col gap-4">
            <Label className="text-sm text-muted-foreground">{t("controls.jpegQuality")}</Label>
            <Slider
              value={[jpegQuality]}
              min={1}
              max={100}
              onValueChange={(v) => setJpegQuality((Array.isArray(v) ? v[0] : v) ?? 85)}
            />
            <p className="text-sm tabular-nums text-muted-foreground">{jpegQuality}</p>
          </div>
        </>
      ) : null}

      {(tool === "sprite" || targetFormat === "png") ? (
        <>
          <Separator />
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <Label className="text-sm text-muted-foreground">{t("controls.pngCompression")}</Label>
              <Slider
                value={[pngCompressionLevel]}
                min={0}
                max={9}
                step={1}
                onValueChange={(v) => setPngCompressionLevel((Array.isArray(v) ? v[0] : v) ?? 9)}
              />
              <p className="text-sm tabular-nums text-muted-foreground">{pngCompressionLevel}</p>
            </div>

            {tool === "sprite" ? (
              <div className="flex flex-col gap-6 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ImageIcon className="size-4" aria-hidden />
                  {t("controls.pixelSprite")}
                </div>
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-3">
                        <Label className="text-xs text-muted-foreground">{t("controls.width")}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={SPRITE_MAX_SIDE}
                          value={spriteWidth}
                          onChange={(e) => setSpriteWidth(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <Label className="text-xs text-muted-foreground">{t("controls.height")}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={SPRITE_MAX_SIDE}
                          value={spriteHeight}
                          onChange={(e) => setSpriteHeight(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label className="text-xs text-muted-foreground">{t("controls.fit")}</Label>
                      <Select value={spriteFit} onValueChange={(v) => setSpriteFit(v as "inside" | "cover" | "fill")}>
                        <SelectTrigger className="h-11 w-full min-h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inside">{t("controls.fitInside")}</SelectItem>
                          <SelectItem value="cover">{t("controls.fitCover")}</SelectItem>
                          <SelectItem value="fill">{t("controls.fitFill")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {spriteFit === "inside" ? (
                      <div className="flex flex-col gap-4">
                        <label className="flex cursor-pointer items-center gap-4 text-sm leading-snug">
                          <Checkbox
                            checked={spriteLetterboxBg}
                            onCheckedChange={(v) => setSpriteLetterboxBg(Boolean(v))}
                          />
                          <span>{t("controls.letterboxRGBA")}</span>
                        </label>
                        {spriteLetterboxBg ? (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {(
                              [
                                ["R", spriteBgR, setSpriteBgR],
                                ["G", spriteBgG, setSpriteBgG],
                                ["B", spriteBgB, setSpriteBgB],
                                ["A", spriteBgA, setSpriteBgA],
                              ] as const
                            ).map(([k, val, set]) => (
                              <div key={k} className="flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">{k}</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={val}
                                  onChange={(e) => set(Number(e.target.value))}
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <label className="flex cursor-pointer items-center gap-4 text-sm leading-snug">
                      <Checkbox checked={spriteUsePalette} onCheckedChange={(v) => setSpriteUsePalette(Boolean(v))} />
                      <span>{t("controls.paletteReduction")}</span>
                    </label>
                    {spriteUsePalette ? (
                      <div className="flex flex-col gap-4">
                        <Label className="text-sm text-muted-foreground">{t("controls.colors")}</Label>
                        <Slider
                          value={[spritePaletteColors]}
                          min={2}
                          max={256}
                          step={1}
                          onValueChange={(v) => setSpritePaletteColors((Array.isArray(v) ? v[0] : v) ?? 16)}
                        />
                        <p className="text-sm tabular-nums text-muted-foreground">{spritePaletteColors}</p>
                      </div>
                    ) : null}
                    <label className="flex cursor-pointer items-start gap-4 text-sm leading-snug">
                      <Checkbox
                        checked={spriteIncludeGamePayload}
                        onCheckedChange={(v) => setSpriteIncludeGamePayload(Boolean(v))}
                        className="mt-0.5"
                      />
                      <span>
                        <code className="rounded bg-muted px-1 py-px text-xs">gamePayload</code>
                        {" · "}
                        {t("controls.gamePayload", { max: GAME_PAYLOAD_MAX_CELLS })}
                      </span>
                    </label>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {tool === "format" && targetFormat === "ico" ? (
        <>
          <Separator />
          <div className="flex flex-col gap-4">
            <Label className="text-sm text-muted-foreground">{t("controls.icoSizes")}</Label>
            <Input value={icoSizes} onChange={(e) => setIcoSizes(e.target.value)} placeholder="16,32,48,256" />
            <p className="text-sm text-muted-foreground">{t("controls.icoHint")}</p>
          </div>
        </>
      ) : null}

      {tool === "format" && targetFormat === "svg" ? (
        <>
          <Separator />
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium text-muted-foreground">{t("controls.traceTitle")}</p>
            <label className="flex cursor-pointer items-center gap-4 text-sm leading-snug">
              <Checkbox checked={traceColor} onCheckedChange={(v) => setTraceColor(Boolean(v))} />
              <span>{t("controls.colorTrace")}</span>
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
              <div className="flex flex-col gap-3">
                <Label className="text-xs text-muted-foreground">{t("controls.threshold")}</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={traceThreshold}
                  onChange={(e) => setTraceThreshold(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-xs text-muted-foreground">{t("controls.turdSize")}</Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={traceTurdSize}
                  onChange={(e) => setTraceTurdSize(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-xs text-muted-foreground">{t("controls.optTolerance")}</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={traceOptTolerance}
                  onChange={(e) => setTraceOptTolerance(Number(e.target.value))}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 self-center text-sm sm:self-end">
                <Checkbox checked={traceBlackOnWhite} onCheckedChange={(v) => setTraceBlackOnWhite(Boolean(v))} />
                <span>{t("controls.blackOnWhite")}</span>
              </label>
            </div>
            {traceColor ? (
              <div className="flex flex-col gap-4">
                <Label className="text-sm text-muted-foreground">Colors</Label>
                <Slider
                  value={[traceColors]}
                  min={2}
                  max={128}
                  step={1}
                  onValueChange={(v) => setTraceColors((Array.isArray(v) ? v[0] : v) ?? 32)}
                />
                <p className="text-sm tabular-nums text-muted-foreground">{traceColors}</p>
              </div>
            ) : null}
            <p className="text-sm leading-relaxed text-muted-foreground">{t("controls.existingSvgHint")}</p>
          </div>
        </>
      ) : null}
    </div>
  );

  const controlsFooterCard = (
    <CardFooter className="flex-col items-stretch gap-3">
      <Button
        className="h-12 min-h-12 w-full px-6 text-base font-semibold"
        size="lg"
        disabled={!file || busy}
        onClick={runConvert}
      >
        {busy ? <Loader2Icon data-icon="inline-start" className="animate-spin" aria-hidden /> : null}
        {busy ? t("actions.converting") : t("actions.convert")}
      </Button>

      {err ? (
        <Alert variant="destructive">
          <AlertTitle>{t("status.failed")}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-sm leading-relaxed">{err}</AlertDescription>
        </Alert>
      ) : null}
    </CardFooter>
  );

  const controlsFooterSheet = (
    <div className="border-t bg-muted/50 p-4">
      <Button
        className="h-12 min-h-12 w-full px-6 text-base font-semibold"
        size="lg"
        disabled={!file || busy}
        onClick={runConvert}
      >
        {busy ? <Loader2Icon data-icon="inline-start" className="animate-spin" aria-hidden /> : null}
        {busy ? t("actions.converting") : t("actions.convert")}
      </Button>

      {err ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>{t("status.failed")}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-sm leading-relaxed">{err}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="@container mx-auto flex min-h-0 w-full min-w-0 max-w-[1600px] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="shrink-0 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <SidebarTrigger
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("converter.title")}</h1>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {t("converter.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
            <div className="flex items-center gap-2">
              {file ? (
                <Badge
                  variant="outline"
                  className="max-w-[min(16rem,70vw)] truncate font-normal text-xs"
                  title={file.name}
                >
                  {file.name}
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-normal text-xs">
                  No file
                </Badge>
              )}
              <Button
                type="button"
                variant="outline"
                size="default"
                className="h-10 min-h-10 gap-2 @min-[960px]:hidden"
                onClick={() => setControlsOpen(true)}
              >
                <SlidersHorizontalIcon className="size-4" aria-hidden />
                {t("actions.controls")}
              </Button>
            </div>
            <p
              className="shrink-0 break-all font-mono text-[11px] leading-snug text-muted-foreground sm:max-w-[min(100%,14rem)] sm:text-right"
              title="API base URL"
            >
              {apiBase}
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 grid min-w-0 grid-cols-1 gap-6 @min-[960px]:grid-cols-12 @min-[960px]:items-stretch @min-[960px]:gap-8">
          <div className="@container/previews flex min-h-0 min-w-0 flex-col @min-[960px]:col-span-8 @min-[1200px]:col-span-9">
            <div className="grid flex-1 min-h-0 min-w-0 grid-cols-1 gap-8 @min-[520px]/previews:grid-cols-2 @min-[520px]/previews:gap-8">
              <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden shadow-none">
              <CardHeader className="gap-2 pb-5">
                <CardTitle className="text-lg">{t("preview.before")}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {file ? file.name : t("preview.noFile")}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex flex-1 flex-col gap-5 px-5 pb-6 pt-0 sm:px-6">
                <div className="relative flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/25">
                  {localPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={localPreviewUrl}
                      alt="Input preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <span className="px-4 text-center text-sm text-muted-foreground">{t("preview.previewHere")}</span>
                  )}
                </div>
                {res?.input ? (
                  <p className="text-sm text-muted-foreground">
                    {res.input.mime} · {formatBytes(res.input.bytes)} ·{" "}
                    {res.input.width && res.input.height ? `${res.input.width}×${res.input.height}` : "—"}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden shadow-none">
              <CardHeader className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg">{t("preview.after")}</CardTitle>
                  <CardDescription className="mt-1 text-sm leading-relaxed">
                    {res ? t("preview.downloadWhenReady") : t("preview.runToSeeOutput")}
                  </CardDescription>
                </div>
                {res ? (
                  <div className="flex shrink-0 flex-wrap gap-3">
                    {res.output.gamePayload ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        className="h-11 min-h-11 px-4"
                        onClick={onDownloadGamePayload}
                      >
                        gamePayload.json
                      </Button>
                    ) : null}
                    {/* 下载链接用 Base UI Button 的 render，避免 <a> 手动拼 class 导致 hover/对比度不一致 */}
                    <Button
                      variant="default"
                      size="default"
                      nativeButton={false}
                      className="h-11 min-h-11 px-5 text-base font-semibold"
                      render={
                        <a href={res.output.dataUrl} download={downloadName}>
                          {t("actions.download")}
                        </a>
                      }
                    />
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="min-h-0 flex flex-1 flex-col gap-5 px-5 pb-6 pt-0 sm:px-6">
                <div className="relative flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/25">
                  {res ? (
                    <div
                      className="flex max-h-full max-w-full items-center justify-center overflow-hidden p-2"
                      style={
                        outputPixelScale > 1
                          ? { transform: `scale(${outputPixelScale})`, transformOrigin: "center" }
                          : undefined
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={res.output.previewDataUrl}
                        alt="Output preview"
                        className={cn(
                          "max-h-full max-w-full object-contain",
                          outputPixelScale > 1 && "[image-rendering:pixelated]",
                        )}
                        style={outputPixelScale > 1 ? { imageRendering: "pixelated" } : undefined}
                      />
                    </div>
                  ) : (
                    <span className="px-4 text-center text-sm text-muted-foreground">{t("preview.outputPreview")}</span>
                  )}
                  {busy ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-3 text-base text-muted-foreground shadow-sm">
                        <Loader2Icon className="size-5 shrink-0 animate-spin" aria-hidden />
                        {t("actions.converting")}
                      </div>
                    </div>
                  ) : null}
                </div>
                {res?.output ? (
                  <p className="text-sm text-muted-foreground">
                    {res.output.mime} · {formatBytes(res.output.bytes)} ·{" "}
                    {res.output.width && res.output.height ? `${res.output.width}×${res.output.height}` : "—"}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            </div>
          </div>

          <div className="hidden min-h-0 min-w-0 @min-[960px]:col-span-4 @min-[1200px]:col-span-3 @min-[960px]:flex @min-[960px]:flex-col">
            <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden shadow-sm ring-1 ring-border/60">
              <CardHeader className="gap-2 pb-5">
                <CardTitle className="text-lg">{t("controls.title")}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{t("controls.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <ScrollArea className="min-h-0 flex-1">
                  {controlsBody}
                </ScrollArea>
                {controlsFooterCard}
              </CardContent>
            </Card>
          </div>
        </div>

        <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
            <SheetHeader className="border-b border-border/60 px-5 py-4 text-left sm:px-6">
              <SheetTitle>{t("controls.title")}</SheetTitle>
              <SheetDescription>{t("controls.description")}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                {controlsBody}
              </ScrollArea>
            </div>
            {controlsFooterSheet}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

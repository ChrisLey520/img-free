"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotIcon, ImageIcon, LayersIcon, LayoutGridIcon, SettingsIcon, SparklesIcon, Wand2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/i18n/locale-provider";
import { locales, stripPlaceholder, type Locale } from "@/i18n/i18n";
import type { Tool } from "@/components/app-shell";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

type Props = {
  apiBase: string;
  tool: Tool;
};

/** 应用侧栏：导航 + 主题 + 设置抽屉（shadcn Sheet） */
export function AppSidebar({ apiBase, tool }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { locale, t } = useT();
  const router = useRouter();

  const pathPrefix = locale === "zh-CN" ? "" : `/${locale}`;
  function goTool(nextTool: Tool) {
    if (nextTool === "sprite") {
      router.push(`${pathPrefix}/sprite`);
    } else if (nextTool === "redeem") {
      router.push(`${pathPrefix}/pixel`);
    } else if (nextTool === "spritesheet") {
      router.push(`${pathPrefix}/sprite-sheet`);
    } else if (nextTool === "aisprite") {
      router.push(`${pathPrefix}/ai-sprite`);
    } else if (nextTool === "imagegen") {
      router.push(`${pathPrefix}/image-gen`);
    } else {
      router.push(pathPrefix || "/");
    }
    router.refresh();
  }

  function onChangeLocale(nextLocale: Locale | null) {
    if (!nextLocale) return;
    const nl = (locales as readonly string[]).includes(nextLocale) ? (nextLocale as Locale) : locale;
    document.cookie = `locale=${nl}; path=/; samesite=lax`;
    const prefix = nl === "zh-CN" ? "" : `/${nl}`;
    const base = tool === "sprite" ? "/sprite" : tool === "redeem" ? "/pixel" : tool === "spritesheet" ? "/sprite-sheet" : tool === "aisprite" ? "/ai-sprite" : tool === "imagegen" ? "/image-gen" : "/";
    router.push(`${prefix}${base === "/" ? "" : base}`);
    router.refresh();
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-2">
          <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="truncate font-heading text-sm font-semibold tracking-tight">{t("app.name")}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">{t("app.tagline")}</span>
            </div>
            <ThemeToggle />
          </div>
          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.navigate")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "format"}
                    tooltip={t("nav.format")}
                    onClick={() => goTool("format")}
                    render={
                      <button type="button">
                        <ImageIcon />
                        <span>{t("nav.format")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "sprite"}
                    tooltip={t("nav.sprite")}
                    onClick={() => goTool("sprite")}
                    render={
                      <button type="button">
                        <LayersIcon />
                        <span>{t("nav.sprite")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "aisprite"}
                    tooltip={t("nav.aisprite")}
                    onClick={() => goTool("aisprite")}
                    render={
                      <button type="button">
                        <BotIcon />
                        <span>{t("nav.aisprite")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "imagegen"}
                    tooltip={t("nav.imagegen")}
                    onClick={() => goTool("imagegen")}
                    render={
                      <button type="button">
                        <Wand2Icon />
                        <span>{t("nav.imagegen")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "spritesheet"}
                    tooltip={t("nav.spritesheet")}
                    onClick={() => goTool("spritesheet")}
                    render={
                      <button type="button">
                        <LayoutGridIcon />
                        <span>{t("nav.spritesheet")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tool === "redeem"}
                    tooltip={t("nav.redeem")}
                    onClick={() => goTool("redeem")}
                    render={
                      <button type="button">
                        <SparklesIcon />
                        <span>{t("nav.redeem")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={t("nav.settings")}
                    onClick={() => setSettingsOpen(true)}
                    render={
                      <button type="button">
                        <SettingsIcon />
                        <span>{t("nav.settings")}</span>
                      </button>
                    }
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/60 pb-4 text-left">
            <SheetTitle>{t("settings.title")}</SheetTitle>
            <SheetDescription>{t("settings.description")}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                {t("settings.language")}
              </Label>
              <Select value={locale} onValueChange={onChangeLocale}>
                <SelectTrigger className="h-10">
                  <SelectValue>{LOCALE_LABEL[locale]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">{LOCALE_LABEL["zh-CN"]}</SelectItem>
                  <SelectItem value="zh-TW">{LOCALE_LABEL["zh-TW"]}</SelectItem>
                  <SelectItem value="en">{LOCALE_LABEL.en}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">{t("settings.apiBase")}</span>
              <Badge variant="secondary" className="w-fit max-w-full justify-start font-mono text-[11px] font-normal">
                {apiBase}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {stripPlaceholder(t("settings.apiHint", { env: t("settings.apiEnv") }), t("settings.apiEnv"))}
              <code className="rounded bg-muted px-1 py-px">{t("settings.apiEnv")}</code>
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

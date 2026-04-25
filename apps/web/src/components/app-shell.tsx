"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ConverterWorkspace } from "@/components/converter/converter-workspace";
import { useConverter } from "@/hooks/use-converter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LocaleProvider } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/i18n";

export type Tool = "format" | "sprite";

export function AppShell({ locale, tool }: { locale: Locale; tool: Tool }) {
  const model = useConverter();

  return (
    <LocaleProvider locale={locale}>
      <SidebarProvider defaultOpen className="h-svh overflow-hidden min-h-0">
        <AppSidebar apiBase={model.apiBase} tool={tool} />
        <SidebarInset className="min-h-0 flex-1 overflow-hidden bg-background">
          <ConverterWorkspace model={model} tool={tool} />
        </SidebarInset>
      </SidebarProvider>
    </LocaleProvider>
  );
}


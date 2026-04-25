import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const p = await params;
  const seg = p.locale;

  // 默认语言不需要前缀：访问 /zh-CN 时自动归一化到 /
  if (seg === defaultLocale) {
    redirect("/");
  }

  if (!(locales as readonly string[]).includes(seg)) {
    redirect("/");
  }

  return <AppShell locale={seg as Locale} tool="format" />;
}


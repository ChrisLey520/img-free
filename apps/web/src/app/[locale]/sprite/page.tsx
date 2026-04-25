import { AppShell } from "@/components/app-shell";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n";

export default async function SpritePage({ params }: { params: Promise<{ locale: string }> }) {
  const p = await params;
  const seg = p.locale;
  const locale: Locale = (locales as readonly string[]).includes(seg) ? (seg as Locale) : defaultLocale;
  return <AppShell locale={locale} tool="sprite" />;
}


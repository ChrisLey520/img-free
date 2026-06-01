import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n";

export default async function LocaleSpriteSheetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  if (seg === defaultLocale) redirect("/sprite-sheet");
  if (!(locales as readonly string[]).includes(seg)) redirect("/sprite-sheet");
  return <AppShell locale={seg as Locale} tool="spritesheet" />;
}

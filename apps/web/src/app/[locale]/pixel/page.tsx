import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n";

export default async function LocalePixelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  if (seg === defaultLocale) redirect("/pixel");
  if (!(locales as readonly string[]).includes(seg)) redirect("/pixel");
  return <AppShell locale={seg as Locale} tool="redeem" />;
}

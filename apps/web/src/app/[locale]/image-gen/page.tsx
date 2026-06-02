import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n";

export default async function LocaleImageGenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  if (seg === defaultLocale) redirect("/image-gen");
  if (!(locales as readonly string[]).includes(seg)) redirect("/image-gen");
  return <AppShell locale={seg as Locale} tool="imagegen" />;
}

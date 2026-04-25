import { AppShell } from "@/components/app-shell";
import { defaultLocale } from "@/i18n/i18n";

export default async function SpritePage() {
  return <AppShell locale={defaultLocale} tool="sprite" />;
}


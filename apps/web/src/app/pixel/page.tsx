import { AppShell } from "@/components/app-shell";
import { defaultLocale } from "@/i18n/i18n";

export default function PixelPage() {
  return <AppShell locale={defaultLocale} tool="redeem" />;
}

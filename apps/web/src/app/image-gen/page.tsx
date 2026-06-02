import { AppShell } from "@/components/app-shell";
import { defaultLocale } from "@/i18n/i18n";

export default function ImageGenPage() {
  return <AppShell locale={defaultLocale} tool="imagegen" />;
}

import { AppShell } from "@/components/app-shell";
import { defaultLocale } from "@/i18n/i18n";

export default async function Home() {
  // 默认语言（简体）不带前缀：永远渲染 "/"，不会自动跳转到其它语言。
  return <AppShell locale={defaultLocale} tool="format" />;
}

import { NextResponse, type NextRequest } from "next/server";

const LOCALE_COOKIE = "locale";
type Locale = "en" | "zh-CN" | "zh-TW";
const defaultLocale: Locale = "zh-CN";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals + static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1];

  // 访问 /zh-CN 统一重定向到 "/"（默认语言无前缀）
  if (seg === defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/zh-CN(\/|$)/, "/");
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", sameSite: "lax" });
    return res;
  }

  // 访问带前缀语言：直接放行并写 cookie
  if (seg === "en" || seg === "zh-TW") {
    const res = NextResponse.next();
    res.cookies.set(LOCALE_COOKIE, seg, { path: "/", sameSite: "lax" });
    return res;
  }

  // 未带前缀：永远渲染默认语言，不根据 cookie / Accept-Language 自动跳转到其它语言
  const res = NextResponse.next();
  res.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", sameSite: "lax" });
  return res;
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};


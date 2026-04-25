"use client"

import { useMemo, useSyncExternalStore } from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

function readThemeClient(): Theme {
  const stored = window.localStorage.getItem("theme")
  if (stored === "light" || stored === "dark") return stored
  if (document.documentElement.classList.contains("dark")) return "dark"
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"
}

function subscribeTheme(cb: () => void) {
  const onChange = () => cb()
  window.addEventListener("storage", onChange)
  window.addEventListener("themechange", onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener("themechange", onChange)
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => readThemeClient(),
    () => "light"
  )
  const nextTheme = useMemo<Theme>(() => (theme === "dark" ? "light" : "dark"), [theme])

  function toggle() {
    const nt: Theme = theme === "dark" ? "light" : "dark"
    window.localStorage.setItem("theme", nt)
    applyTheme(nt)
    window.dispatchEvent(new Event("themechange"))
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      suppressHydrationWarning
    >
      {theme === "dark" ? <SunIcon data-icon="inline-start" /> : <MoonIcon data-icon="inline-start" />}
    </Button>
  )
}


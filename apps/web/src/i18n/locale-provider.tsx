"use client";

import { createContext, useContext, useMemo } from "react";

import { formatMessage, type Locale, type MessageKey } from "@/i18n/i18n";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => formatMessage(locale, key, vars),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within LocaleProvider");
  return ctx;
}


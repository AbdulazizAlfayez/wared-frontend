"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type Locale = "en" | "ar";
type Messages = typeof en;

const messages: Record<Locale, Messages> = { en, ar };

interface I18nContextType {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof result === "string" ? result : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang") as Locale | null;
      if (stored && (stored === "en" || stored === "ar")) {
        setLocaleState(stored);
      }
    }
    setIsInitialized(true);
  }, []);

  // Update document attributes when locale changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", locale);
    
    // Add/remove Arabic font class
    if (locale === "ar") {
      document.documentElement.classList.add("font-arabic");
    } else {
      document.documentElement.classList.remove("font-arabic");
    }
  }, [locale, isInitialized]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("lang", newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
      
      // Replace parameters like {count} with actual values
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
        });
      }
      
      return text;
    },
    [locale]
  );

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook for just the translation function
export function useTranslation() {
  const { t, locale, dir } = useI18n();
  return { t, locale, dir };
}

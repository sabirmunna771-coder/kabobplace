import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  SUPPORTED_LANGUAGES,
  translations,
  type LanguageCode,
  type LanguageMeta,
} from "@/i18n/translations";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  availableLanguages: LanguageMeta[];
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = "kabob-places-lang";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isValidLang(value: string | null | undefined): value is LanguageCode {
  return value === "es" || value === "en" || value === "arn" || value === "ay";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();

  const availableLanguages = useMemo(() => {
    const enabled = settings.enabledLanguages;
    if (!enabled || enabled.length === 0) {
      return SUPPORTED_LANGUAGES;
    }
    const filtered = SUPPORTED_LANGUAGES.filter((l) => enabled.includes(l.code));
    return filtered.length > 0 ? filtered : SUPPORTED_LANGUAGES;
  }, [settings.enabledLanguages]);

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (isValidLang(stored)) {
      return stored;
    }
    return "es";
  });

  // Sync with admin defaultLanguage if user hasn't explicitly chosen one, or if current lang was disabled
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!isValidLang(stored) && isValidLang(settings.defaultLanguage)) {
      setLanguageState(settings.defaultLanguage);
      return;
    }
    if (!availableLanguages.some((l) => l.code === language)) {
      const fallback = isValidLang(settings.defaultLanguage)
        ? settings.defaultLanguage
        : availableLanguages[0]?.code ?? "es";
      setLanguageState(fallback);
    }
  }, [settings.defaultLanguage, availableLanguages, language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = useMemo(() => {
    const dict = translations[language] ?? translations.es;
    return (key: string, fallback?: string) => dict[key] ?? translations.es[key] ?? fallback ?? key;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      availableLanguages,
      t,
    }),
    [language, availableLanguages, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}


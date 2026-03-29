"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { translateAdminTextBatchAction } from "@/app/admin/translation-actions";
import {
  applyAdminAutoTranslation,
  collectAdminMissingTranslations,
  registerAdminRuntimeTranslations,
  resetAdminRuntimeTranslations,
} from "@/lib/admin-auto-translate";
import {
  ADMIN_LANGUAGE_COOKIE,
  ADMIN_THEME_COOKIE,
  adminT,
  resolveAdminLanguage,
  resolveAdminTheme,
  type AdminLanguage,
  type AdminTheme,
} from "@/lib/admin-ui";

type AdminPreferencesContextValue = {
  language: AdminLanguage;
  theme: AdminTheme;
  setLanguage: (language: AdminLanguage) => void;
  setTheme: (theme: AdminTheme) => void;
  t: (key: string) => string;
};

const AdminPreferencesContext = createContext<AdminPreferencesContextValue | null>(null);

type AdminPreferencesProviderProps = {
  children: ReactNode;
  initialLanguage: AdminLanguage;
  initialTheme: AdminTheme;
};

export function AdminPreferencesProvider({
  children,
  initialLanguage,
  initialTheme,
}: AdminPreferencesProviderProps) {
  const router = useRouter();
  const [language, setLanguageState] = useState<AdminLanguage>(initialLanguage);
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);

  const pendingRemoteTextsRef = useRef<Set<string>>(new Set());
  const inFlightRemoteTextsRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `${ADMIN_LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000`;
    window.localStorage.setItem(ADMIN_LANGUAGE_COOKIE, language);
  }, [language]);

  useEffect(() => {
    if (language !== "zh") return;

    let disposed = false;
    resetAdminRuntimeTranslations();
    const pendingRemoteTexts = pendingRemoteTextsRef.current;
    const inFlightRemoteTexts = inFlightRemoteTextsRef.current;

    const shouldQueueRemoteText = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      if (!/[A-Za-z]/.test(trimmed)) return false;
      if (trimmed.length < 8) return false;
      if (/#{2,}/.test(trimmed)) return false;
      if (/\b(?:USR|ACC|WDL|AXI|TM|VT|ICM)-\d+\b/i.test(trimmed)) return false;
      if (/\b0x[a-fA-F0-9]{8,}\b/.test(trimmed)) return false;

      const englishWords = trimmed.match(/[A-Za-z]+/g) ?? [];
      if (englishWords.length < 2) return false;

      const isShoutLabel = /^[A-Z\s/_-]+$/.test(trimmed) && englishWords.length <= 5;
      if (isShoutLabel) return false;

      return true;
    };

    const flushRemoteTranslations = async () => {
      if (disposed) return;
      if (inFlightRemoteTexts.size > 0) return;
      if (pendingRemoteTexts.size === 0) return;

      const batch = Array.from(pendingRemoteTexts).slice(0, 50);
      if (batch.length === 0) return;

      for (const text of batch) {
        pendingRemoteTexts.delete(text);
        inFlightRemoteTexts.add(text);
      }

      try {
        const result = await translateAdminTextBatchAction({
          language,
          texts: batch,
        });

        if (disposed) return;

        if (result && Object.keys(result.translations).length > 0) {
          registerAdminRuntimeTranslations(result.translations);
          applyAdminAutoTranslation(document.body, language);
        }
      } catch {
        // Ignore translation provider failures so admin remains usable.
      } finally {
        for (const text of batch) {
          inFlightRemoteTexts.delete(text);
        }

        if (!disposed && pendingRemoteTexts.size > 0) {
          flushTimerRef.current = setTimeout(() => {
            flushTimerRef.current = null;
            void flushRemoteTranslations();
          }, 200);
        }
      }
    };

    const queueRemoteTranslations = (root: ParentNode) => {
      const missing = collectAdminMissingTranslations(root, language, 80);
      for (const text of missing) {
        if (!shouldQueueRemoteText(text)) continue;
        if (inFlightRemoteTexts.has(text)) continue;
        pendingRemoteTexts.add(text);
      }

      if (!flushTimerRef.current && pendingRemoteTexts.size > 0) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          void flushRemoteTranslations();
        }, 160);
      }
    };

    const runTranslation = () => {
      applyAdminAutoTranslation(document.body, language);
      queueRemoteTranslations(document.body);
    };

    runTranslation();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
              applyAdminAutoTranslation(addedNode as Element, language);
              queueRemoteTranslations(addedNode as Element);
            } else if (addedNode.nodeType === Node.TEXT_NODE && addedNode.parentElement) {
              applyAdminAutoTranslation(addedNode.parentElement, language);
              queueRemoteTranslations(addedNode.parentElement);
            }
          }
        }

        if (mutation.type === "characterData" && mutation.target.parentElement) {
          applyAdminAutoTranslation(mutation.target.parentElement, language);
          queueRemoteTranslations(mutation.target.parentElement);
        }

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          applyAdminAutoTranslation(mutation.target, language);
          queueRemoteTranslations(mutation.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => {
      disposed = true;
      observer.disconnect();
      pendingRemoteTexts.clear();
      inFlightRemoteTexts.clear();
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.dataset.theme = theme;
    document.cookie = `${ADMIN_THEME_COOKIE}=${theme}; path=/; max-age=31536000`;
    window.localStorage.setItem(ADMIN_THEME_COOKIE, theme);
  }, [theme]);

  useEffect(() => {
    const storedLanguageValue = window.localStorage.getItem(ADMIN_LANGUAGE_COOKIE);
    const storedThemeValue = window.localStorage.getItem(ADMIN_THEME_COOKIE);

    if (storedLanguageValue && resolveAdminLanguage(storedLanguageValue) !== language) {
      const storedLanguage = resolveAdminLanguage(storedLanguageValue);
      setLanguageState(storedLanguage);
    }
    if (storedThemeValue && resolveAdminTheme(storedThemeValue) !== theme) {
      const storedTheme = resolveAdminTheme(storedThemeValue);
      setThemeState(storedTheme);
    }
  }, [language, theme]);

  const value = useMemo<AdminPreferencesContextValue>(
    () => ({
      language,
      theme,
      setLanguage: (nextLanguage) => {
        document.cookie = `${ADMIN_LANGUAGE_COOKIE}=${nextLanguage}; path=/; max-age=31536000`;
        window.localStorage.setItem(ADMIN_LANGUAGE_COOKIE, nextLanguage);
        setLanguageState(nextLanguage);
        router.refresh();
      },
      setTheme: (nextTheme) => {
        document.cookie = `${ADMIN_THEME_COOKIE}=${nextTheme}; path=/; max-age=31536000`;
        window.localStorage.setItem(ADMIN_THEME_COOKIE, nextTheme);
        setThemeState(nextTheme);
      },
      t: (key: string) => adminT(language, key),
    }),
    [language, theme, router]
  );

  return (
    <AdminPreferencesContext.Provider value={value}>
      {children}
    </AdminPreferencesContext.Provider>
  );
}

export function useAdminPreferences() {
  const context = useContext(AdminPreferencesContext);

  if (!context) {
    throw new Error("useAdminPreferences must be used within AdminPreferencesProvider");
  }

  return context;
}

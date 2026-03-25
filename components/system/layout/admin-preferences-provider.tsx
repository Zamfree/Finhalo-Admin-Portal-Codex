"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `${ADMIN_LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000`;
    window.localStorage.setItem(ADMIN_LANGUAGE_COOKIE, language);
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

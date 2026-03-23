import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AdminPreferencesProvider } from "@/components/admin/admin-preferences-provider";
import {
  ADMIN_LANGUAGE_COOKIE,
  ADMIN_THEME_COOKIE,
  resolveAdminLanguage,
  resolveAdminTheme,
} from "@/lib/admin-ui";

import "./globals.css";

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const language = resolveAdminLanguage(cookieStore.get(ADMIN_LANGUAGE_COOKIE)?.value);
  const theme = resolveAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value);

  return (
    <html lang={language} className={theme} data-theme={theme}>
      <body>
        <AdminPreferencesProvider initialLanguage={language} initialTheme={theme}>
          {children}
        </AdminPreferencesProvider>
      </body>
    </html>
  );
}

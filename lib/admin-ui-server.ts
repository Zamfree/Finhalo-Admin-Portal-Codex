import { cookies } from "next/headers";

import { adminTranslations, resolveAdminLanguage, resolveAdminTheme } from "./admin-ui";

export async function getAdminServerPreferences() {
  const cookieStore = await cookies();
  const language = resolveAdminLanguage(cookieStore.get("finhalo_admin_lang")?.value);
  const theme = resolveAdminTheme(cookieStore.get("finhalo_admin_theme")?.value);

  return {
    language,
    theme,
    translations: adminTranslations[language],
  };
}

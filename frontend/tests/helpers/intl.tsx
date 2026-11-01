import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import { navigationState } from "./next-navigation";

export const catalogs = { en, hi } as const;
export type TestLocale = keyof typeof catalogs;

/** Wraps UI in the real message catalog for `locale` (and a theme provider), as the locale layout does. */
export function IntlWrapper({ locale = "en", children }: { locale?: TestLocale; children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={catalogs[locale]} timeZone="UTC">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

/** Renders inside the real catalogs; also points the mocked router at a page in that locale. */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "en", path = "", ...options }: { locale?: TestLocale; path?: string } & Omit<RenderOptions, "wrapper"> = {},
) {
  navigationState.locale = locale;
  navigationState.pathname = `/${locale}${path}`;
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
    ...options,
  });
}

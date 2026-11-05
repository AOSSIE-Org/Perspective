import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { messagesMap, defaultMessages } from "@/i18n/messages";
import { generateLocaleMetadata, generateStructuredData, serializeJsonLd } from "@/i18n/metadata";
import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_THEME, THEME_STORAGE_KEY, themeInitScript } from "@/components/theme-script";
import { Navbar } from "@/components/navbar";
import { MarqueeTicker } from "@/components/marquee-ticker";
import { ThemeToggle } from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";
import { NavigationProgress } from "@/components/navigation-progress";
import { RoutePreloader } from "@/components/route-preloader";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  return generateLocaleMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = messagesMap[locale] || defaultMessages;

  return (
    <html lang={locale} className={`${inter.variable} h-full overflow-hidden antialiased`} suppressHydrationWarning>
      <head>
        {/* Sets the theme class before <body> is parsed, so the first paint is never the wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full max-h-[100dvh] w-full overflow-hidden bg-background text-foreground transition-colors selection:bg-primary/20 selection:text-primary">
        <script
          type="application/ld+json"
          // Static, build-time data serialized with "<" escaped (see serializeJsonLd)
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateStructuredData(locale)) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          {/* disableTransitionOnChange: colours switch instantly, so the Support Us widget ("auto" theme), which reads
              the page's computed colours right after a theme change, sees the new theme rather than a mid-fade value. */}
          <ThemeProvider
            attribute="class"
            storageKey={THEME_STORAGE_KEY}
            defaultTheme={DEFAULT_THEME}
            enableSystem
            disableTransitionOnChange
          >
            <NavigationProgress />
            <RoutePreloader />
            <div className="relative flex flex-col h-screen max-h-[100dvh] w-full overflow-hidden">
              <Navbar />
              <main className="flex-1 min-h-0 w-full overflow-hidden relative flex flex-col">{children}</main>

              {/* Floating Bottom Left Theme Switcher */}
              <div className="fixed bottom-14 sm:bottom-16 left-4 z-40">
                <ThemeToggle />
              </div>

              {/* Floating Bottom Right Language Switcher */}
              <div className="fixed bottom-14 sm:bottom-16 right-4 z-40">
                <LanguageSwitcher />
              </div>

              {/* Continuous Bottom Marquee Ticker */}
              <div className="shrink-0 z-30">
                <MarqueeTicker />
              </div>
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

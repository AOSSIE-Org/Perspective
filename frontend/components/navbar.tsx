"use client";

import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { GetPerspectiveButton } from "@/components/get-perspective-button";
import { SiteShareButton } from "@/components/site-share-button";
import { Heart, Menu, X } from "lucide-react";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/config/links";
import { SUPPORT_PAGE_PATH } from "@/config/site";

/** Square icon button shared by the social links and the share button. */
const ICON_BUTTON_CLASS =
  "w-9 h-9 rounded-lg border border-border bg-background hover:bg-hover hover:scale-105 flex items-center justify-center transition-all shadow-xs";

function SocialLinksBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center flex-nowrap justify-center sm:justify-end gap-2 sm:gap-3 shrink-0 ${className}`}>
      <a
        href={SOCIAL_LINKS.discord}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discord"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/discord.svg" alt="Discord" width={20} height={20} className="theme-icon-invert" />
      </a>
      <a
        href={SOCIAL_LINKS.x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/twitter.svg" alt="X" width={14} height={14} className="theme-icon-invert" />
      </a>

      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/linkedin.svg" alt="LinkedIn" width={18} height={18} className="theme-icon-invert" />
      </a>

      <a
        href={SOCIAL_LINKS.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/github.svg" alt="GitHub" width={18} height={18} className="theme-icon-invert" />
      </a>

      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/youtube.svg" alt="YouTube" width={20} height={20} className="theme-icon-invert" />
      </a>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        aria-label="Email"
        className={ICON_BUTTON_CLASS}
      >
        <Image src="/brand/icons/mail.svg" alt="Mail" width={20} height={20} className="theme-icon-invert" />
      </a>
    </div>
  );
}

export function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setPendingHref(null);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: t("home") },
    // { href: "/impact", label: t("impact") },
    { href: "/contribute", label: t("contribute") },
    { href: "/about", label: t("about") },
  ];

  // The support page follows the main links, with a heart icon. Below xl the desktop bar shows only the
  // icon, so the centre group stays clear of the share button and the social links at 1024px.
  // Privacy Policy and Terms of Service are linked from the notice under the home page's search box.
  const secondaryLinks = [{ href: SUPPORT_PAGE_PATH, label: t("support"), icon: Heart }];

  const isActive = (href: string) => {
    const target = pendingHref || pathname;
    if (href === "/" && target === "/") return true;
    if (href !== "/" && target.startsWith(href)) return true;
    return false;
  };

  const isHomePage = pathname === "/";

  const handleGetPerspectiveClick = (e: React.MouseEvent<HTMLElement>) => {
    setMobileMenuOpen(false);
    if (isHomePage) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("perspective:prompt-input"));
    } else {
      router.push("/?focus=true");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background transition-colors px-4 sm:px-6 py-3 sm:py-4 md:py-6">
      <div className="relative mx-auto w-full flex items-center justify-between">
        {/* Action CTA Button and the share button on the Left */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <GetPerspectiveButton
            href={isHomePage ? undefined : "/?focus=true"}
            onClick={handleGetPerspectiveClick}
            variant="topic"
            size="sm"
            className="md:px-5 md:py-2.5"
          >
            {t("perspectiveAi")}
          </GetPerspectiveButton>
          <SiteShareButton className={`${ICON_BUTTON_CLASS} text-foreground`} />
        </div>

        {/* Desktop Nav Items in Exact Center */}
        <nav className="hidden lg:flex items-center gap-x-6 xl:gap-x-4 2xl:gap-x-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setPendingHref(link.href)}
                className={`text-xs lg:text-sm tracking-wider uppercase transition-colors duration-200 ${
                  active
                    ? "text-foreground font-semibold"
                    : "text-nav-muted hover:text-foreground font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {secondaryLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                title={link.label}
                onClick={() => setPendingHref(link.href)}
                className={`inline-flex items-center gap-1 text-xs lg:text-sm tracking-wider uppercase transition-colors duration-200 ${
                  active
                    ? "text-foreground font-semibold"
                    : "text-nav-muted hover:text-foreground font-medium"
                }`}
              >
                <Icon aria-hidden="true" className="size-4 xl:size-3.5 shrink-0" />
                <span className="sr-only xl:not-sr-only">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Social Media Links (hidden when hamburger is active, shown on desktop lg+) and Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <SocialLinksBar className="hidden lg:flex" />

          {/* Hamburger Toggle (shown on screens smaller than lg) */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="rounded-lg text-foreground hover:bg-secondary/60 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay (floats over page content with backdrop blur, does NOT push down layout) */}
      {mobileMenuOpen && (
        <>
          {/* Click-away backdrop with gentle blur and dimming */}
          <div
            className="fixed inset-0 top-[56px] sm:top-[68px] md:top-[88px] z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Floating Mobile Menu Container with guaranteed opaque card background */}
          <div
            className="absolute top-full left-0 right-0 z-50 lg:hidden border-b border-border bg-card shadow-2xl px-5 pt-3 pb-5 space-y-4 animate-fade-in"
            style={{ backgroundColor: "var(--card)" }}
          >
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 rounded-[4px] text-sm tracking-wider uppercase transition-colors ${
                      active
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-nav-muted hover:bg-secondary/40 font-medium"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {secondaryLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[4px] text-sm tracking-wider uppercase transition-colors ${
                      active
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-nav-muted hover:bg-secondary/40 font-medium"
                    }`}
                  >
                    <link.icon aria-hidden="true" className="size-3.5 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Socials */}
            <div className="pt-3 border-t border-border/50 flex justify-center">
              <SocialLinksBar />
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;

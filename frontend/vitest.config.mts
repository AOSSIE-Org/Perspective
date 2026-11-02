import { defineConfig } from "vitest/config";
import path from "path";

/**
 * shadcn/ui primitives that ship with the template but are not imported by any page or component
 * (checked with `grep`). They are excluded until something uses them; a primitive that starts being
 * used must be removed from this list so its tests count. `components/ui/bucket.tsx` is used (About page).
 */
const unusedUiPrimitives = [
  "accordion.tsx",
  "alert-dialog.tsx",
  "alert.tsx",
  "aspect-ratio.tsx",
  "avatar.tsx",
  "badge.tsx",
  "breadcrumb.tsx",
  "button.tsx",
  "calendar.tsx",
  "card.tsx",
  "carousel.tsx",
  "chart.tsx",
  "checkbox.tsx",
  "collapsible.tsx",
  "command.tsx",
  "context-menu.tsx",
  "dialog.tsx",
  "drawer.tsx",
  "dropdown-menu.tsx",
  "form.tsx",
  "hover-card.tsx",
  "input-otp.tsx",
  "input.tsx",
  "label.tsx",
  "menubar.tsx",
  "navigation-menu.tsx",
  // Re-export of components/orbiting-tech-stack.tsx (which is tested) that nothing imports
  "orbiting-skills.tsx",
  "pagination.tsx",
  "popover.tsx",
  "progress.tsx",
  "radio-group.tsx",
  "resizable.tsx",
  "scroll-area.tsx",
  "select.tsx",
  "separator.tsx",
  "sheet.tsx",
  "sidebar.tsx",
  "skeleton.tsx",
  "slider.tsx",
  "sonner.tsx",
  "switch.tsx",
  "table.tsx",
  "tabs.tsx",
  "textarea.tsx",
  "toast.tsx",
  "toaster.tsx",
  "toggle-group.tsx",
  "toggle.tsx",
  "tooltip.tsx",
  // Unused copies of hooks/use-mobile.tsx and hooks/use-toast.ts (the hooks/ versions are tested)
  "use-mobile.tsx",
  "use-toast.ts",
].map((file) => `components/ui/${file}`);

export default defineConfig({
  // tsconfig leaves JSX to Next.js, so tests that render components compile it here
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    // jest-dom matchers and the browser/Next.js APIs jsdom lacks (see the file for the list)
    setupFiles: ["tests/setup.ts"],
    // next-intl imports `next/navigation` without an extension, which Node's ESM loader rejects; inlining it
    // lets Vite resolve that import (and lets the `next/navigation` mock apply to it)
    server: { deps: { inline: ["next-intl"] } },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      // The whole code base: every route, component, hook, config module, i18n helper and utility
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "config/**/*.{ts,tsx}",
        "i18n/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      exclude: [
        // Type declarations only, no runtime code
        "**/*.d.ts",
        ...unusedUiPrimitives,
      ],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});

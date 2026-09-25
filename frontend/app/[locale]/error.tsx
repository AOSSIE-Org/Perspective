"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-3xl font-extrabold text-foreground mb-4">{t("title")}</h1>
      <p className="text-sm text-foreground-muted mb-6 max-w-md">{t("description")}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:opacity-90 cursor-pointer"
      >
        {t("retry")}
      </button>
    </div>
  );
}

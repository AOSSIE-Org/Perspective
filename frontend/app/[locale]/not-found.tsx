import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-extrabold text-foreground mb-4">404 - {t("title")}</h1>
      <p className="text-base text-foreground-muted mb-8 max-w-md">{t("description")}</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:opacity-90"
      >
        {t("home")}
      </Link>
    </div>
  );
}

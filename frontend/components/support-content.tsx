"use client";

import { useTranslations } from "next-intl";
import SupportUsButton from "support-us-button";
import { AOSSIE_URL, GITHUB_SPONSORS_URL } from "@/config/links";
import { SUPPORT_LOGOS, SUPPORTERS } from "@/config/support";

/** The support widget, in the site's font and colours, with the reader's language. */
export function SupportContent() {
  const t = useTranslations("Support");
  const tMeta = useTranslations("Metadata");

  return (
    <SupportUsButton
      Theme="auto"
      heading={t("title")}
      labels={{ madeBy: t("madeBy"), supportedBy: t("supportedBy") }}
      organizationInformation={{
        name: "AOSSIE",
        desc: t("aossieDescription"),
        image: SUPPORT_LOGOS.organization,
        link: AOSSIE_URL,
      }}
      projectInformation={{
        name: "Perspective",
        description: tMeta("description"),
        image: SUPPORT_LOGOS.project,
      }}
      sponsors={SUPPORTERS.map(({ name, link }) => ({ name, link }))}
      ctaSection={{ sponsorLink: [{ name: "GitHub Sponsors", url: GITHUB_SPONSORS_URL }] }}
    />
  );
}

export default SupportContent;

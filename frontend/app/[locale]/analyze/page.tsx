import type { Metadata } from "next";

// Replaces the server redirect `/:locale/analyze` → `/:locale`, which a static export cannot run.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function AnalyzeIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const home = `/${locale}`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${home}`} />
      <p className="p-8 text-center">
        <a href={home} className="underline">
          Continue
        </a>
      </p>
    </>
  );
}

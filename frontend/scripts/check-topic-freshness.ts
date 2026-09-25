import { PRESET_TOPICS, TOPICS_CURATED_AT, TOPIC_MAX_AGE_DAYS } from "../config/preset-topics";

function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidIsoDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const timestamp = Date.parse(dateString);
  return !isNaN(timestamp);
}

function checkFreshness() {
  console.log("=================================================");
  console.log(" Perspective Preset Topics Freshness & Schema Audit");
  console.log("=================================================");
  console.log(`Anchor / Curated At Date : ${TOPICS_CURATED_AT}`);
  console.log(`Max Age Threshold        : ${TOPIC_MAX_AGE_DAYS} days`);
  console.log(`Total Topics Configured  : ${PRESET_TOPICS.length}`);
  console.log("-------------------------------------------------");

  const anchorDate = new Date(TOPICS_CURATED_AT);
  let staleCount = 0;
  let invalidCount = 0;

  if (PRESET_TOPICS.length < 24) {
    console.error(`❌ ERROR: Expected at least 24 topics, but found ${PRESET_TOPICS.length}`);
    invalidCount++;
  }

  const ids = new Set<string>();

  PRESET_TOPICS.forEach((topic, idx) => {
    const num = idx + 1;
    const errors: string[] = [];

    // Duplicate ID check
    if (!topic.id || ids.has(topic.id)) {
      errors.push(`Duplicate or missing id: "${topic.id}"`);
    } else {
      ids.add(topic.id);
    }

    // Title checks
    if (!topic.title || topic.title.trim() === "") {
      errors.push("Missing 'title'");
    }
    if (!topic.fallbackTitle || topic.fallbackTitle.trim() === "") {
      errors.push("Missing 'fallbackTitle'");
    }
    if (!topic.titleHi || topic.titleHi.trim() === "") {
      errors.push("Missing 'titleHi'");
    }

    // URL validation
    if (!isValidUrl(topic.url)) {
      errors.push(`Invalid URL: "${topic.url}"`);
    }

    // Date validation
    if (!isValidIsoDate(topic.publishedAt)) {
      errors.push(`Invalid publishedAt format (expected YYYY-MM-DD): "${topic.publishedAt}"`);
    } else {
      const pubDate = new Date(topic.publishedAt);
      const diffMs = anchorDate.getTime() - pubDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        errors.push(`publishedAt "${topic.publishedAt}" is in the future relative to anchor "${TOPICS_CURATED_AT}"`);
      } else if (diffDays > TOPIC_MAX_AGE_DAYS) {
        errors.push(`Topic is STALE: published ${diffDays} days ago (exceeds max ${TOPIC_MAX_AGE_DAYS} days)`);
        staleCount++;
      }
    }

    // BiasScore validation
    if (
      !topic.biasScore ||
      typeof topic.biasScore.bias_score !== "number" ||
      topic.biasScore.bias_score < 0 ||
      topic.biasScore.bias_score > 100 ||
      !topic.biasScore.explanation ||
      !topic.biasScore.bias_category
    ) {
      errors.push("Invalid or incomplete 'biasScore' object");
    }

    // AnalysisResult validation
    if (
      !topic.analysisResult ||
      !topic.analysisResult.cleaned_text ||
      !topic.analysisResult.sentiment ||
      typeof topic.analysisResult.score !== "number" ||
      !Array.isArray(topic.analysisResult.facts) ||
      topic.analysisResult.facts.length < 2 ||
      !topic.analysisResult.perspective
    ) {
      errors.push("Invalid or incomplete 'analysisResult' object (requires >= 2 verified facts)");
    }

    if (errors.length > 0) {
      invalidCount++;
      console.error(`[${num.toString().padStart(2, "0")}] ❌ FAILED: ${topic.title || topic.id}`);
      errors.forEach((err) => console.error(`     - ${err}`));
    } else {
      const pubDate = new Date(topic.publishedAt);
      const ageDays = Math.floor((anchorDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(
        `[${num.toString().padStart(2, "0")}] ✅ PASS | Age: ${ageDays.toString().padStart(2, " ")}d | ${topic.publishedAt} | ${topic.title}`
      );
    }
  });

  console.log("-------------------------------------------------");
  console.log(`Audit Summary:`);
  console.log(`- Total Topics : ${PRESET_TOPICS.length}`);
  console.log(`- Fresh Topics : ${PRESET_TOPICS.length - staleCount - (invalidCount - staleCount)}`);
  console.log(`- Stale Topics : ${staleCount}`);
  console.log(`- Invalid Specs: ${invalidCount}`);
  console.log("=================================================");

  if (staleCount > 0 || invalidCount > 0) {
    console.error("Freshness check FAILED. Please resolve the errors above.");
    process.exit(1);
  } else {
    console.log("All preset topics are fresh, verified, and strictly conform to specification.");
    process.exit(0);
  }
}

checkFreshness();

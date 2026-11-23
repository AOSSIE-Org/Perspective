"""
evaluator.py
------------
Evaluation pipeline that uses Groq to assess debate eligibility and format
trending topics for the frontend cards.
"""

from datetime import datetime
import json
import re
from typing import Any, Dict, List
from groq import Groq

from app.config import (
    TRENDING_EVAL_MAX_TOKENS,
    TRENDING_EVAL_MODEL,
    TRENDING_EVAL_TEMPERATURE,
    TRENDING_MAX_TOPICS,
)
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def get_groq_client() -> Groq:
    """Instantiates a Groq client from environment."""
    return Groq()


def evaluate_topic_suitability(story: Dict[str, str], client: Groq = None) -> Dict[str, Any]:
    """
    Evaluates whether a news story presents a controversial or multi-faceted
    topic suitable for alternative perspective analysis.
    """
    if client is None:
        client = get_groq_client()

    prompt = f"""You are an AI editor for Perspective, an platform providing balanced counter-arguments to biased or one-sided news.
Analyze the following article headline and summary:
Headline: {story.get('title', '')}
Summary: {story.get('description', '')}

Respond in strict JSON with the following structure:
{{
  "is_suitable": true/false (true if controversial/has multiple valid viewpoints; false for pure facts/weather/sports),
  "bias_score": 0-100 (estimated lean or one-sidedness score),
  "category": "Topic Category (e.g., Geopolitics, Technology, Economy)",
  "explanation": "One sentence explaining the debate or perspective gap",
  "counter_perspective": "A concise 2-3 sentence counter-argument presenting the opposing viewpoint",
  "sentiment": "Neutral / Cautious / Critical"
}}
"""
    try:
        response = client.chat.completions.create(
            model=TRENDING_EVAL_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=TRENDING_EVAL_TEMPERATURE,
            max_tokens=TRENDING_EVAL_MAX_TOKENS,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        logger.error(f"Error evaluating story suitability with LLM: {e}")
        return {
            "is_suitable": False,
            "bias_score": 50,
            "category": "General",
            "explanation": "Unable to evaluate at this time.",
            "counter_perspective": "Opposing viewpoints are currently being indexed.",
            "sentiment": "Neutral",
        }


def format_preset_topic(story: Dict[str, str], eval_result: Dict[str, Any]) -> Dict[str, Any]:
    """Formats an evaluated story into the PresetTopic schema matching the frontend."""
    # Generate URL-safe slug ID
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", story.get("title", "topic").lower()).strip("-")[:40]
    today = datetime.now().strftime("%Y-%m-%d")

    return {
        "id": f"dynamic-{slug}",
        "title": story.get("title", "Trending Topic"),
        "fallbackTitle": story.get("title", "Trending Topic"),
        "url": story.get("url", ""),
        "publishedAt": story.get("published_at", today) or today,
        "curatedAt": today,
        "biasScore": {
            "bias_score": eval_result.get("bias_score", 50),
            "explanation": eval_result.get("explanation", "Multi-perspective debate detected."),
            "bias_category": eval_result.get("category", "Current Affairs"),
        },
        "analysisResult": {
            "cleaned_text": story.get("description", story.get("title", "")),
            "sentiment": eval_result.get("sentiment", "Neutral"),
            "score": 85,
            "facts": [],
            "perspective": eval_result.get("counter_perspective", "Alternative perspectives exist."),
        },
    }


def evaluate_and_generate_topics(
    stories: List[Dict[str, str]],
    client: Groq = None,
    max_topics: int = TRENDING_MAX_TOPICS,
) -> List[Dict[str, Any]]:
    """Evaluates candidate stories and returns formatted trending topics."""
    if client is None:
        client = get_groq_client()

    topics: List[Dict[str, Any]] = []
    for story in stories:
        if len(topics) >= max_topics:
            break
        eval_result = evaluate_topic_suitability(story, client=client)
        if eval_result.get("is_suitable", True):
            topic = format_preset_topic(story, eval_result)
            topics.append(topic)

    logger.info(f"Generated {len(topics)} qualified trending topics.")
    return topics


"""
lens_prompts.py
---------------
Defines the 6 lens prompt templates for multi-perspective article analysis.

Each lens produces a structured analysis of the same article from a specific
domain viewpoint. The prompts receive pre-extracted article metadata to avoid
reprocessing the full article text each time.
"""

from typing import Literal

LENSES = ["educational", "technical", "political", "economic", "social", "global"]

LensType = Literal[
    "educational", "technical", "political", "economic", "social", "global"
]

LENS_META = {
    "educational": {
        "label": "Educational",
        "icon": "school",
        "color": "#06e0f9",
        "description": "Impact on learning, curriculum & knowledge",
    },
    "technical": {
        "label": "Technical",
        "icon": "memory",
        "color": "#a78bfa",
        "description": "Technological feasibility & implementation",
    },
    "political": {
        "label": "Political",
        "icon": "account_balance",
        "color": "#f87171",
        "description": "Policy, governance & power dynamics",
    },
    "economic": {
        "label": "Economic",
        "icon": "trending_up",
        "color": "#4ade80",
        "description": "Market impact, finance & inequality",
    },
    "social": {
        "label": "Social",
        "icon": "groups",
        "color": "#fbbf24",
        "description": "Community, culture & human behaviour",
    },
    "global": {
        "label": "Global",
        "icon": "public",
        "color": "#38bdf8",
        "description": "International relations & cross-border effects",
    },
}


def build_lens_prompt(lens: LensType, article_data: dict) -> str:
    """Build a lens-specific analysis prompt from pre-extracted article metadata."""

    summary = article_data.get("summary", "No summary available.")
    main_claim = article_data.get("main_claim", "No main claim identified.")
    entities = ", ".join(article_data.get("entities", [])) or "Not specified"
    tone = article_data.get("tone", "neutral")
    key_points = (
        "\n".join(f"- {kp}" for kp in article_data.get("key_points", []))
        or "- No key points extracted."
    )

    base = f"""You are an expert analyst. Based on the following article summary and key information, provide a well-structured analysis from the specified perspective.

## Article Summary
{summary}

## Main Claim
{main_claim}

## Key Entities
{entities}

## Article Tone
{tone}

## Key Points
{key_points}

---
"""

    lens_instructions = {
        "educational": """Analyze this article from an **Educational** perspective.

Cover:
1. **Learning Implications** – How does this affect education systems, curricula, or access to knowledge?
2. **Skill Gaps** – What new skills or knowledge does society need to develop in response?
3. **Pedagogical Challenges** – How should educators adapt teaching methods or priorities?
4. **Opportunities for Learning** – What constructive educational initiatives could emerge from this?
5. **Critical Thinking Angle** – What questions should students and learners ask about this topic?

Write in clear, accessible language. Be constructive and evidence-based.""",
        "technical": """Analyze this article from a **Technical** perspective.

Cover:
1. **Technological Feasibility** – Are the claims technically sound and achievable?
2. **Implementation Challenges** – What are the engineering or systems-level hurdles?
3. **Infrastructure Requirements** – What technical infrastructure is needed?
4. **Innovation Opportunities** – What new technologies or approaches could this spur?
5. **Technical Risks** – What could go wrong from a systems or engineering standpoint?

Be precise and grounded in technical reasoning.""",
        "political": """Analyze this article from a **Political** perspective.

Cover:
1. **Policy Implications** – What legislation, regulation, or policy changes are needed or at risk?
2. **Power Dynamics** – Who gains and who loses political power or influence?
3. **Governance Challenges** – How difficult is it for governments to respond effectively?
4. **Partisan Angles** – How might different political perspectives interpret or exploit this?
5. **Democratic Concerns** – What are the implications for democratic institutions and civic rights?

Be analytical and balanced across the political spectrum.""",
        "economic": """Analyze this article from an **Economic** perspective.

Cover:
1. **Market Impact** – How does this affect markets, industries, or financial systems?
2. **Winners & Losers** – Which economic actors benefit, and which are negatively affected?
3. **Cost-Benefit Analysis** – What are the economic costs and potential returns?
4. **Inequality Angle** – Does this widen or close economic gaps?
5. **Long-term Outlook** – What are the macroeconomic projections or risks?

Use economic reasoning and be specific about mechanisms.""",
        "social": """Analyze this article from a **Social** perspective.

Cover:
1. **Community Impact** – How does this affect social cohesion, communities, and relationships?
2. **Cultural Shifts** – What cultural attitudes, norms, or behaviors could change?
3. **Equity & Inclusion** – How does this affect marginalized or vulnerable groups?
4. **Mental Health & Wellbeing** – Are there psychological or societal wellbeing implications?
5. **Collective Behavior** – How might social movements, public opinion, or activism respond?

Be empathetic and consider diverse social realities.""",
        "global": """Analyze this article from a **Global** perspective.

Cover:
1. **International Implications** – How does this affect relations between countries or regions?
2. **Geopolitical Shifts** – What changes to global power balances or alliances might result?
3. **Cross-border Cooperation** – Is international collaboration needed? What forms?
4. **Developing World Impact** – How does this affect lower-income or developing nations?
5. **Global Risks & Opportunities** – What are the planetary-scale risks or benefits?

Think globally and consider geopolitical nuance.""",
    }

    prompt = base + lens_instructions[lens]
    prompt += "\n\nRespond with a structured, analytical essay of 250-350 words. Use clear headings for each section."
    return prompt

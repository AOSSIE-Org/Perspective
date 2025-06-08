import re


def clean_extracted_text(text: str):
    """
    Clean up the extracted article text to remove boilerplate,
    repetitive lines, excessive whitespace, and unwanted junk.
    """
    if not text:
        return ""

    # 1. Remove multiple line breaks to single line break
    text = re.sub(r'\n{2,}', '\n\n', text)

    # 2. Remove common boilerplate patterns
    # (example: "Read more at...", "Subscribe", etc.)
    boilerplate_phrases = [
        r"read more at.*",
        r"subscribe to.*",
        r"click here to.*",
        r"follow us on.*",
        r"advertisement",
        r"© \d{4}.*",  # copyright lines
        r"all rights reserved",
        r"terms of service",
    ]
    for pattern in boilerplate_phrases:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # 3. Remove lines with too few characters (likely junk)
    lines = text.split('\n')
    cleaned_lines = [line.strip() for line in lines if len(line.strip()) > 30]

    # 4. Join lines back with a double newline for paragraphs
    cleaned_text = '\n\n'.join(cleaned_lines)

    # 5. Optional: Fix multiple spaces and trim
    cleaned_text = re.sub(r'[ \t]{2,}', ' ', cleaned_text).strip()

    return cleaned_text

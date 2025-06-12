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
        r"sponsored content",
        r"promoted by.*",
        r"recommended for you",
        r"© \d{4}.*",               # copyright lines
        r"all rights reserved",
        r"terms of service",
        r"privacy policy",
        r"cookie policy",
        r"about us",
        r"contact us",
        r"share this article",
        r"sign up for our newsletter",
        r"report this ad",
        r"this story was originally published.*",
        r"originally appeared on.*",
        r"download our app.*",
        r"view comments",
        r"comment below",
        r"leave a comment",
        r"next article",
        r"previous article",
        r"related articles",
        r"top stories",
        r"breaking news",
        r"editor's picks",
        r"latest news",
        r"trending now",
        r"this content is provided by.*",
        r"image source:.*",
        r"photo by.*",
        r"disclaimer:.*",
        r"support independent journalism.*",
        r"if you enjoyed this article.*",
        r"don’t miss out on.*",
        r"watch the video",
        r"listen to the podcast",
        r"stay connected with.*",
        r"visit our homepage.*",
        r"post a job on.*",
        r"powered by .*",
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

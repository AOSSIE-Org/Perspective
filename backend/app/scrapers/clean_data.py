import re

def clean_scraped_data(raw_text):
    """
    Cleans the scraped text by removing unwanted characters, multiple spaces, and normalizing case.
    """
    if raw_text is None:
        return None
    
    # Remove excessive spaces and new lines
    clean_text = re.sub(r'\s+', ' ', raw_text).strip()

    # Remove special characters (keeping only letters, numbers, and spaces)
    clean_text = re.sub(r'[^a-zA-Z0-9\s.,!?]', '', clean_text)
    print(clean_text)

    return clean_text.lower()  # Normalize to lowercase
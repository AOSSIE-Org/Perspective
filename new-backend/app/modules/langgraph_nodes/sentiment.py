from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")


def run_sentiment(state):
    """
    Analyzes the sentiment of the provided text and returns the result.
    
    Args:
        state: A dictionary containing a "text" key with the input string to analyze.
    
    Returns:
        A dictionary with the sentiment label and its confidence score.
    """
    text = state["text"]
    result = sentiment_pipeline(text)[0]
    return {"sentiment": result["label"], "sentiment_score": result["score"]}

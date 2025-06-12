from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")


def run_sentiment(state):
    text = state["text"]
    result = sentiment_pipeline(text)[0]
    return {
        **state,  # Keep all existing keys
        "sentiment": result["label"],
        "sentiment_score": result["score"],
    }

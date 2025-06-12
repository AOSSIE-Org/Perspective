from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")


def run_sentiment(state):
    text = state["text"]
    try:
        result = sentiment_pipeline(text)[0]
    except Exception as e:
        print(f"some error occured:{e}")
        return {
            "error": str(e)
        }
    return {
        **state,  # Keep all existing keys
        "sentiment": result["label"],
        "sentiment_score": result["score"],
    }

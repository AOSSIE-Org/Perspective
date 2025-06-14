from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")


def run_sentiment(state):
    text = state["text"]
    try:
        result = sentiment_pipeline(text)[0]
    except Exception as e:
        print(f"some error occured in sentiment_analysis:{e}")
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": f"{e}",
            }
    return {
        **state,  # Keeping all existing keys
        "sentiment": result["label"],
        "sentiment_score": result["score"],
        "status": "success"
    }

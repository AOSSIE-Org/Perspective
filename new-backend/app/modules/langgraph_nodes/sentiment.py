from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")


def run_sentiment(state):
    try:
        text = state.get("cleaned_text")
        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        result = sentiment_pipeline(text)[0]

        return {
            **state,
            "sentiment": result["label"],
            "sentiment_score": result["score"],
            "status": "success"
        }

    except Exception as e:
        print(f"Error in sentiment_analysis: {e}")
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": str(e),
        }

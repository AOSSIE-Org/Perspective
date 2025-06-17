import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def run_sentiment_sdk(state):
    try:
        text = state.get("cleaned_text")
        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a sentiment analysis assistant. "
                        "Only respond with one word:"
                        " Positive, Negative, or Neutral."
                    ),
                },
                {
                    "role": "user",
                    "content": ("Analyze the sentiment of the following text:"
                                f"\n\n{text}"
                                ),
                },
            ],
            model="gemma2-9b-it",
            temperature=0.2,
            max_tokens=10,
        )

        sentiment = chat_completion.choices[0].message.content.strip()

        return {
            **state,
            "sentiment": sentiment,
            "status": "success",
        }

    except Exception as e:
        print(f"Error in sentiment_analysis: {e}")
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": str(e),
        }


# if __name__ == "__main__":
#     dummy_state = {
#         "cleaned_text": (
#             "The 2025 French Open men’s final at Roland Garros was more than"
#             "just a sporting event."
#         )
#     }

#     result = run_sentiment_sdk(dummy_state)
#     print("Sentiment Output:", result)

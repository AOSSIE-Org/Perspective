import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def check_bias(text):
    try:
        print(text)
        print(json.dumps(text))
        
        if not text:
            raise ValueError("Missing or empty 'cleaned_text'")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that checks  "
                        "if given article is biased and give"
                        "score to each based on biasness where 0 is lowest bias and 100 is highest bias"
                        "Only return a number between 0 to 100 base on bias."
                        "only return Number No Text"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Give bias score to the following article "
                        f"\n\n{text}"
                    ),
                },
            ],
            model="gemma2-9b-it",
            temperature=0.3,
            max_tokens=512,
        )

        bias_score = chat_completion.choices[0].message.content.strip()

        return {
            "bias_score": bias_score,
            "status": "success",
        }

    except Exception as e:
        print(f"Error in bias_detection: {e}")
        return {
            "status": "error",
            "error_from": "bias_detection",
            "message": str(e),
        }

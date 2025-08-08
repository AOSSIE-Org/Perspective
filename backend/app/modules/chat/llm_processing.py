import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def build_context(docs):

    return "\n".join(f"{m['metadata'].get('explanation') or m['metadata'].get('reasoning', '')}"for m in docs)


def ask_llm(question, docs):
    context = build_context(docs)
    print(context)
    prompt = f"""You are an assistant that answers based on context.

Context:
{context}

Question:
{question}
"""

    response = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[
            {"role": "system", "content": "Use only the context to answer."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content

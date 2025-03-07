import requests
import json


def generate_response(prompt, context=None):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    messages = []
    if context:
        messages.extend(context)
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": messages
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code != 200:
        raise Exception(f"OpenRouter API Error: {
                        response.status_code} - {response.text}")

    return response.json()["choices"][0]["message"]["content"]


# Example
prompt = "What is the capital of France?"
response = generate_response(prompt)
print(response)

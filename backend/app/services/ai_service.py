

# import json
# import requests
# import os
# import sys
# import re

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# from app.prompts.opposite_perspective import get_opposite_perspective_prompt

# class AIService:
#     def __init__(self, api_key=None):
#         self.api_key = api_key
#         self.model_id = "mistralai/Mistral-7B-Instruct-v0.2"
#         self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
#         self.headers = {"Authorization": f"Bearer {self.api_key}"} if api_key else {}

#     def clean_article_text(self, article_text):
#         """Clean the article text by removing extra whitespace, normalizing quotes, etc."""
#         if not article_text:
#             return ""
#         cleaned = article_text.strip()
#         cleaned = "\n".join(line for line in cleaned.splitlines() if line.strip())
#         return cleaned

#     def get_opposite_perspective(self, article_text):
#         prompt_template = get_opposite_perspective_prompt()
#         cleaned_text = self.clean_article_text(article_text)
#         formatted_prompt = prompt_template.format(article_text=cleaned_text)
        
#         try:
#             print("Sending request to Hugging Face API...")
#             payload = {
#                 "inputs": formatted_prompt,
#                 "parameters": {
#                     "max_new_tokens": 2500,  # Increased for a more detailed response
#                     "temperature": 0.7,
#                     "return_full_text": False
#                 }
#             }
#             response = requests.post(self.api_url, headers=self.headers, json=payload)
#             if response.status_code != 200:
#                 return {"error": f"API Error: {response.status_code}", "details": response.text}
            
#             print("Response received from API, parsing result...")
#             result = self._parse_llm_response(response.json())
#             return result
#         except Exception as e:
#             return {"error": str(e)}
    
#     def _parse_llm_response(self, response):

#         try:
#             if isinstance(response, list) and len(response) > 0:
#                 raw_text = response[0].get("generated_text", "")
#             elif isinstance(response, dict):
#                 raw_text = response.get("generated_text", "")
#             else:
#                 raw_text = str(response)
            
#             pat = r"```(.*?)```"
#             matches = re.findall(pat, raw_text, re.DOTALL)
#             if not matches:
#                 return {"error": "Could not extract formatted output using regex", "raw_response": raw_text}
#             res = matches[0].replace("json", "")
#             result = json.loads(res)
#             return result 
#         except Exception as e:
#             return {"error": str(e), "raw_response": raw_text if 'raw_text' in locals() else response}
    
#     def format_result(self, result):
#         """  
#         Output Format:
#         """
#         try:
#             formatted_output = "{{\n" + json.dumps(result, indent=2) + "\n}}"
#             return formatted_output
#         except Exception as e:
#             return f"Error formatting result: {e}"

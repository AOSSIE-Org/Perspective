# # backend/app/services/analysis_service.py - Add a summarization method

# async def generate_article_summary(self, article_content: str, max_length: int = 300) -> str:
#     """
#     Generate a concise summary of the article content
#     """
#     try:
#         # Use your existing AI service to generate a summary
#         prompt = f"""Summarize the following article in a concise manner, under {max_length} characters.
#         Focus on the main points and key takeaways.
        
#         Article content: {article_content[:4000]}
        
#         Summary:"""
        
#         # Use your existing AI connector
#         summary = await self.ai_service.generate_text(prompt)
        
#         return summary
#     except Exception as e:
#         self.logger.error(f"Error generating summary: {str(e)}")
#         raise
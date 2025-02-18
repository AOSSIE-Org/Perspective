from newspaper import Article
from typing import Optional

async def get_article_summary(url: str) -> Optional[str]:
    """
    Get summary of an article using newspaper3k
    """
    try:
        article = Article(url)
        article.download()
        article.parse()
        article.nlp()
        return article.summary
    except Exception as e:
        raise Exception(f"Failed to get article summary: {str(e)}") 
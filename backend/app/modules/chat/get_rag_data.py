from pinecone import Pinecone
from dotenv import load_dotenv
from app.modules.chat.embed_query import embed_query
import os

load_dotenv()

pc = Pinecone(os.getenv("PINECONE_API_KEY"))
index = pc.Index("perspective")


def search_pinecone(query: str, top_k: int = 5):

    embeddings = embed_query(query)

    results = index.query(
        vector=embeddings,
        top_k=top_k,
        include_metadata=True,
        namespace="default"

    )

    matches = []
    for match in results["matches"]:
        matches.append({
            "id": match["id"],
            "score": match["score"],
            "metadata": match["metadata"]
        })
    return matches

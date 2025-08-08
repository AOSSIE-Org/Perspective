from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")


def embed_query(query: str):

    embeddings = embedder.encode(query).tolist()

    return embeddings

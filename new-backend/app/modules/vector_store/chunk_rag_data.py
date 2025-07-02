from app.utils.generate_chunk_id import generate_id


def chunk_rag_data(data):
    article_id = generate_id(data["cleaned_text"])

    chunks = []

    chunks.append(
        {
            "id": f"{article_id}-perspective",
            "text": data["perspective"]["perspective"],
            "metadata": {
                "type": "counter-perspective",
                "reasoning": data["perspective"]["reasoning"]
            }
        }
    )

    for i, fact in enumerate(data["facts"]):
        chunks.append(
            {
                "id": f"{article_id}-fact-{i}",
                "text": fact["original_claim"],
                "metadata": {
                    "verdict": fact["verdict"],
                    "explaination": fact["explaination"],
                    "source_link": fact["source_link"],
                    "type": "fact"
                }
            }
        )

    return chunks

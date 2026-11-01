"""Tests for turning an analysis into vector-store chunks, embedding them and storing them."""

import re

import pytest

from app.config import PINECONE_NAMESPACE
from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput
from app.modules.langgraph_nodes.store_and_send import store_and_send
from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.modules.vector_store.embed import embed_chunks
from app.utils.generate_chunk_id import generate_id
from app.utils.store_vectors import store

ARTICLE_ID_PATTERN = re.compile(r"^article-[0-9a-f]{15}$")


def make_fact(n):
    return {
        "original_claim": f"Claim number {n}",
        "verdict": "True" if n % 2 else "False",
        "explanation": f"Explanation {n}",
        "source_link": f"https://example.com/source-{n}",
    }


def make_analysis(facts=None):
    return {
        "cleaned_text": "City council approves new budget for public transport.",
        "perspective": PerspectiveOutput(reasoning="Costs are understated.", perspective="The budget may not be enough."),
        "facts": [make_fact(1), make_fact(2)] if facts is None else facts,
        "sentiment": "neutral",
    }


# --- generate_id ---------------------------------------------------------------


def test_generate_id_is_deterministic_and_well_formed():
    first = generate_id("Breaking news: AI takes over the world!")

    assert ARTICLE_ID_PATTERN.match(first)
    assert generate_id("Breaking news: AI takes over the world!") == first


def test_generate_id_differs_for_different_text():
    assert generate_id("Article A") != generate_id("Article B")
    assert generate_id("Article A") != generate_id("Article A ")


def test_generate_id_handles_non_ascii_text():
    assert ARTICLE_ID_PATTERN.match(generate_id("नमस्ते दुनिया"))


@pytest.mark.parametrize("bad_input", ["", None, 42, ["text"]])
def test_generate_id_rejects_empty_or_non_string_input(bad_input):
    with pytest.raises(ValueError, match="non-empty string"):
        generate_id(bad_input)


# --- chunk_rag_data -------------------------------------------------------------


def test_chunks_contain_the_perspective_then_one_chunk_per_fact():
    data = make_analysis()
    article_id = generate_id(data["cleaned_text"])

    chunks = chunk_rag_data(data)

    assert chunks == [
        {
            "id": f"{article_id}-perspective",
            "text": "The budget may not be enough.",
            "metadata": {
                "type": "counter-perspective",
                "reasoning": "Costs are understated.",
                "article_id": article_id,
            },
        },
        {
            "id": f"{article_id}-fact-0",
            "text": "Claim number 1",
            "metadata": {
                "type": "fact",
                "verdict": "True",
                "explanation": "Explanation 1",
                "source_link": "https://example.com/source-1",
                "article_id": article_id,
            },
        },
        {
            "id": f"{article_id}-fact-1",
            "text": "Claim number 2",
            "metadata": {
                "type": "fact",
                "verdict": "False",
                "explanation": "Explanation 2",
                "source_link": "https://example.com/source-2",
                "article_id": article_id,
            },
        },
    ]


def test_an_analysis_without_facts_yields_only_the_perspective_chunk():
    chunks = chunk_rag_data(make_analysis(facts=[]))

    assert [c["metadata"]["type"] for c in chunks] == ["counter-perspective"]


@pytest.mark.parametrize("missing", ["cleaned_text", "perspective", "facts"])
def test_rejects_analysis_missing_a_required_field(missing):
    data = make_analysis()
    del data[missing]

    with pytest.raises(ValueError, match=f"Missing required field: {missing}"):
        chunk_rag_data(data)


def test_rejects_facts_that_are_not_a_list():
    with pytest.raises(ValueError, match="Facts must be a list"):
        chunk_rag_data(make_analysis(facts="not a list"))


def test_rejects_a_perspective_without_reasoning():
    data = make_analysis()
    data["perspective"] = "just a string"

    with pytest.raises(ValueError, match="Perspective object missing required fields"):
        chunk_rag_data(data)


@pytest.mark.parametrize("missing", ["original_claim", "verdict", "explanation", "source_link"])
def test_rejects_a_fact_missing_a_field_and_names_its_index(missing):
    broken = make_fact(2)
    del broken[missing]

    with pytest.raises(ValueError, match=f"{missing} in fact index 1"):
        chunk_rag_data(make_analysis(facts=[make_fact(1), broken]))


# --- embed_chunks and store ------------------------------------------------------


def test_embed_chunks_pairs_each_vector_with_its_chunk():
    chunks = chunk_rag_data(make_analysis())

    vectors = embed_chunks(chunks)

    assert [v["id"] for v in vectors] == [c["id"] for c in chunks]
    assert [v["metadata"] for v in vectors] == [c["metadata"] for c in chunks]
    # The fake embedder encodes the text length in the first value.
    assert [v["values"][0] for v in vectors] == [float(len(c["text"])) for c in chunks]


def test_embed_chunks_returns_nothing_for_no_chunks():
    assert embed_chunks([]) == []


def test_embed_chunks_rejects_chunks_without_text():
    with pytest.raises(ValueError, match="index 1"):
        embed_chunks([{"id": "a", "text": "ok", "metadata": {}}, {"id": "b", "metadata": {}}])


def test_store_upserts_into_the_configured_namespace(fake_index):
    vectors = [{"id": "a", "values": [0.1], "metadata": {}}]

    store(vectors)

    assert fake_index.upserts == [{"vectors": vectors, "namespace": PINECONE_NAMESPACE}]


def test_store_rejects_an_empty_batch(fake_index):
    with pytest.raises(ValueError, match="cannot be empty"):
        store([])

    assert fake_index.upserts == []


def test_store_wraps_upsert_failures(fake_index):
    fake_index.upsert_error = ConnectionError("pinecone unavailable")

    with pytest.raises(RuntimeError, match="Vector storage failed"):
        store([{"id": "a", "values": [0.1], "metadata": {}}])


# --- store_and_send node --------------------------------------------------------------


def test_store_and_send_stores_every_chunk_and_keeps_the_state(fake_index):
    data = make_analysis()

    result = store_and_send(data)

    assert result == {**data, "status": "success"}
    [upsert] = fake_index.upserts
    assert len(upsert["vectors"]) == 1 + len(data["facts"])


def test_store_and_send_still_succeeds_when_storage_fails(fake_index):
    # Storage problems must not hide an analysis the user is waiting for.
    fake_index.upsert_error = ConnectionError("pinecone unavailable")

    result = store_and_send(make_analysis())

    assert result["status"] == "success"

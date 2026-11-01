"""Property-based tests (Hypothesis) for the URL guard, chunk IDs, chunking and keyword fallback.

Fixtures run once per test, not once per generated example, so each example patches DNS itself
inside pytest.MonkeyPatch.context(). The autouse network guard from conftest stays in place for
the whole test, which is why the function-scoped-fixture health check is suppressed.
"""

import ipaddress
import re
import socket
import string

import pytest
import rake_nltk
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput
from app.modules.scraper import keywords as keywords_module
from app.modules.scraper.keywords import DEFAULT_STOPWORDS, extract_keywords
from app.modules.scraper.safe_fetch import UnsafeURLError, validate_public_url
from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.utils.generate_chunk_id import generate_id

PROPERTY_SETTINGS = settings(
    max_examples=75,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
HOST = "article.example"

# Address ranges an SSRF guard must never let a request reach.
NON_PUBLIC_NETWORKS = [
    "0.0.0.0/8",  # "this network"
    "10.0.0.0/8",  # private
    "100.64.0.0/10",  # carrier-grade NAT
    "127.0.0.0/8",  # loopback
    "169.254.0.0/16",  # link-local, including cloud metadata at 169.254.169.254
    "172.16.0.0/12",  # private
    "192.168.0.0/16",  # private
    "240.0.0.0/4",  # reserved
    "::1/128",  # IPv6 loopback
    "fc00::/7",  # IPv6 unique local
    "fe80::/10",  # IPv6 link-local
]

non_public_ips = st.one_of(*[st.ip_addresses(network=net) for net in NON_PUBLIC_NETWORKS]).map(str)
public_ips = st.ip_addresses().filter(lambda ip: ip.is_global).map(str)
url_paths = st.text(alphabet=string.ascii_letters + string.digits + "/-_.?=&", max_size=30).map(lambda p: "/" + p)


def resolving(ips, lookups):
    def fake_getaddrinfo(host, port, *args, **kwargs):
        lookups.append((host, port))
        if host != HOST:
            raise socket.gaierror(f"unknown host {host}")
        return [
            (socket.AF_INET6 if ":" in ip else socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", (ip, port))
            for ip in ips
        ]

    return fake_getaddrinfo


@PROPERTY_SETTINGS
@given(
    scheme=st.from_regex(r"[a-zA-Z][a-zA-Z0-9+.\-]{0,9}", fullmatch=True).filter(
        lambda s: s.lower() not in {"http", "https"}
    ),
    path=url_paths,
)
def test_urls_with_any_other_scheme_are_rejected_without_a_dns_lookup(scheme, path):
    lookups = []
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(socket, "getaddrinfo", resolving(["93.184.215.14"], lookups))
        with pytest.raises(UnsafeURLError, match="Only http and https"):
            validate_public_url(f"{scheme}://{HOST}{path}")
    assert lookups == []


@PROPERTY_SETTINGS
@given(
    public=st.lists(public_ips, max_size=3),
    blocked=st.lists(non_public_ips, min_size=1, max_size=3),
    data=st.data(),
    scheme=st.sampled_from(["http", "https", "HTTP", "Https"]),
    path=url_paths,
)
def test_a_host_with_any_non_public_address_is_rejected(public, blocked, data, scheme, path):
    # Order should not matter: a private address hidden behind public ones is still refused.
    addresses = data.draw(st.permutations(public + blocked))
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(socket, "getaddrinfo", resolving(addresses, []))
        with pytest.raises(UnsafeURLError, match="private or reserved"):
            validate_public_url(f"{scheme}://{HOST}{path}")


@PROPERTY_SETTINGS
@given(
    addresses=st.lists(public_ips, min_size=1, max_size=4),
    scheme=st.sampled_from(["http", "https"]),
    port=st.one_of(st.none(), st.integers(min_value=1, max_value=65535)),
    path=url_paths,
)
def test_a_host_with_only_public_addresses_is_accepted_and_looked_up_on_the_right_port(addresses, scheme, port, path):
    lookups = []
    netloc = HOST if port is None else f"{HOST}:{port}"
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(socket, "getaddrinfo", resolving(addresses, lookups))
        validate_public_url(f"{scheme}://{netloc}{path}")
    default_port = 443 if scheme == "https" else 80
    assert lookups == [(HOST, port or default_port)]


@settings(max_examples=150, deadline=None)
@given(texts=st.lists(st.text(min_size=1), min_size=2, max_size=6, unique=True))
def test_generate_id_is_deterministic_well_formed_and_distinct_per_text(texts):
    ids = [generate_id(t) for t in texts]

    assert all(re.fullmatch(r"article-[0-9a-f]{15}", i) for i in ids)
    assert [generate_id(t) for t in texts] == ids
    assert len(set(ids)) == len(texts)


facts = st.fixed_dictionaries(
    {
        "original_claim": st.text(max_size=40),
        "verdict": st.sampled_from(["True", "False", "Unverified"]),
        "explanation": st.text(max_size=40),
        "source_link": st.text(max_size=20),
    }
)


@settings(max_examples=75, deadline=None)
@given(
    cleaned_text=st.text(min_size=1, max_size=200),
    perspective=st.text(max_size=60),
    reasoning=st.text(max_size=60),
    fact_list=st.lists(facts, max_size=8),
)
def test_chunking_keeps_every_fact_once_under_one_article_id(cleaned_text, perspective, reasoning, fact_list):
    chunks = chunk_rag_data(
        {
            "cleaned_text": cleaned_text,
            "perspective": PerspectiveOutput(reasoning=reasoning, perspective=perspective),
            "facts": fact_list,
        }
    )
    article_id = generate_id(cleaned_text)

    assert len(chunks) == 1 + len(fact_list)
    assert len({c["id"] for c in chunks}) == len(chunks)
    assert all(c["id"].startswith(article_id + "-") for c in chunks)
    assert {c["metadata"]["article_id"] for c in chunks} == {article_id}

    head, *fact_chunks = chunks
    assert (head["text"], head["metadata"]["reasoning"]) == (perspective, reasoning)
    assert [c["text"] for c in fact_chunks] == [f["original_claim"] for f in fact_list]
    assert [
        (c["metadata"]["verdict"], c["metadata"]["explanation"], c["metadata"]["source_link"]) for c in fact_chunks
    ] == [(f["verdict"], f["explanation"], f["source_link"]) for f in fact_list]


class UnavailableRake:
    def __init__(self, stopwords):
        raise LookupError("punkt_tab not found")


@PROPERTY_SETTINGS
@given(
    text=st.lists(
        st.one_of(st.sampled_from(sorted(DEFAULT_STOPWORDS)), st.text(alphabet=string.ascii_letters + ".,!?'", min_size=1, max_size=12)),
        min_size=1,
        max_size=40,
    ).map(" ".join),
    max_keywords=st.integers(min_value=1, max_value=20),
)
def test_fallback_keywords_are_unique_lowercase_content_words_within_the_limit(text, max_keywords):
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(rake_nltk, "Rake", UnavailableRake)
        mp.setattr(keywords_module, "STOPWORDS_SET", DEFAULT_STOPWORDS)
        result = extract_keywords(text, max_keywords=max_keywords)

    assert len(result) <= max_keywords
    assert len(set(result)) == len(result)
    for word in result:
        assert word == word.lower()
        assert len(word) > 3
        assert word not in DEFAULT_STOPWORDS
        assert word in text.lower()

"""
conftest.py
-----------
Shared setup for the backend test suite.

Several app modules create API clients as soon as they are imported: the Groq
clients read GROQ_API_KEY, the embedding modules download a sentence-transformers
model, and the scraper cleaner downloads NLTK corpora. The suite must run
without API keys or network access, so before any app module is imported this
file:

    - sets placeholder API keys and stops load_dotenv() from reading a local
      backend/.env, so real keys are never picked up,
    - replaces sentence_transformers with a deterministic fake embedder,
    - replaces the Pinecone client with an in-memory fake index,
    - turns nltk.download() into a no-op (the keyword extractor then falls
      back to its built-in stopword list).

An autouse fixture also blocks DNS lookups and non-loopback socket connections,
so a test that accidentally reaches the network fails instead of passing
against a live service.
"""

import importlib.util
import logging
import os
import socket
import sys
import types

import dotenv
import nltk
import pinecone
import pytest

from app.config import PINECONE_DIMENSIONS, SEARCH_KEY_PLACEHOLDER

PLACEHOLDER_ENV = {
    "GROQ_API_KEY": "test-groq-key",
    "PINECONE_API_KEY": "test-pinecone-key",
    "SEARCH_KEY": SEARCH_KEY_PLACEHOLDER,
}
LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}

os.environ.update(PLACEHOLDER_ENV)
dotenv.load_dotenv = lambda *args, **kwargs: False
nltk.download = lambda *args, **kwargs: False


class FakeVectors(list):
    """List with the .tolist() method that numpy arrays returned by encode() have."""

    def tolist(self):
        return [v.tolist() if isinstance(v, FakeVectors) else v for v in self]


def fake_embedding(text: str) -> list[float]:
    """Deterministic vector whose first value identifies the text it came from."""
    return [float(len(text))] + [0.0] * (PINECONE_DIMENSIONS - 1)


class FakeSentenceTransformer:
    def __init__(self, model_name, *args, **kwargs):
        self.model_name = model_name

    def encode(self, sentences, *args, **kwargs):
        if isinstance(sentences, str):
            return FakeVectors(fake_embedding(sentences))
        return FakeVectors(FakeVectors(fake_embedding(s)) for s in sentences)


class FakeIndex:
    """In-memory stand-in for a Pinecone index."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.upserts = []
        self.queries = []
        self.matches = []
        self.upsert_error = None

    def upsert(self, vectors, namespace=None):
        if self.upsert_error:
            raise self.upsert_error
        self.upserts.append({"vectors": vectors, "namespace": namespace})

    def query(self, **kwargs):
        self.queries.append(kwargs)
        return {"matches": self.matches}


FAKE_INDEX = FakeIndex()


class FakePinecone:
    def __init__(self, *args, **kwargs):
        pass

    def has_index(self, name):
        return True

    def create_index(self, *args, **kwargs):
        pass

    def Index(self, name):
        return FAKE_INDEX


sentence_transformers_stub = types.ModuleType("sentence_transformers")
sentence_transformers_stub.SentenceTransformer = FakeSentenceTransformer
sys.modules["sentence_transformers"] = sentence_transformers_stub
pinecone.Pinecone = FakePinecone


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    real_connect = socket.socket.connect
    real_connect_ex = socket.socket.connect_ex

    def check(address):
        host = address[0] if isinstance(address, tuple) else address
        if host not in LOOPBACK_HOSTS:
            raise RuntimeError(f"Tests must not open network connections (tried {address!r}).")

    def guarded_connect(self, address):
        check(address)
        return real_connect(self, address)

    def guarded_connect_ex(self, address):
        check(address)
        return real_connect_ex(self, address)

    def blocked_getaddrinfo(host, *args, **kwargs):
        raise RuntimeError(f"Tests must not resolve hostnames (tried {host!r}); patch socket.getaddrinfo.")

    monkeypatch.setattr(socket.socket, "connect", guarded_connect)
    monkeypatch.setattr(socket.socket, "connect_ex", guarded_connect_ex)
    monkeypatch.setattr(socket, "getaddrinfo", blocked_getaddrinfo)


@pytest.fixture
def fake_index():
    FAKE_INDEX.reset()
    yield FAKE_INDEX
    FAKE_INDEX.reset()


@pytest.fixture
def resolve_hosts(monkeypatch):
    """Point hostnames at chosen IP addresses: resolve_hosts({"example.com": ["93.184.215.14"]})."""
    lookups = []

    def install(mapping):
        def fake_getaddrinfo(host, port, *args, **kwargs):
            lookups.append((host, port))
            if host not in mapping:
                raise socket.gaierror(f"unknown host {host}")
            return [
                (socket.AF_INET6 if ":" in ip else socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", (ip, port))
                for ip in mapping[host]
            ]

        monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
        return lookups

    return install


class FakeChatClient:
    """Stand-in for a Groq client: returns queued replies and records each request."""

    def __init__(self, *replies):
        self.replies = list(replies)
        self.requests = []
        self.chat = types.SimpleNamespace(completions=types.SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.requests.append(kwargs)
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        message = types.SimpleNamespace(content=reply)
        return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])


@pytest.fixture
def fake_chat_client():
    return FakeChatClient


@pytest.fixture
def fresh_module():
    """Run a module's import-time code again, as a new module object that is not put in sys.modules.

    fresh_module("app.db.vector_store") re-executes that file so tests can check what it does at
    import (environment checks, client setup) under patched conditions, without replacing the
    module the rest of the suite uses. Loggers the copies create are closed afterwards.
    """
    names = []

    def load(dotted_name):
        origin = importlib.util.find_spec(dotted_name).origin
        name = f"fresh_{dotted_name.replace('.', '_')}_{len(names)}"
        names.append(name)
        spec = importlib.util.spec_from_file_location(name, origin)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    yield load
    for name in names:
        logger = logging.getLogger(name)
        for handler in list(logger.handlers):
            logger.removeHandler(handler)
            handler.close()

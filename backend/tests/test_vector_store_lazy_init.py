"""Tests for lazy Pinecone initialization in app.db.vector_store (#173)."""

from __future__ import annotations

import importlib
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend/ is on the path when pytest is run from repo root or backend/.
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)


def _reload_vector_store():
    """Reload vector_store with a cleared client cache for an isolated test."""
    import app.db.vector_store as vs

    vs.reset_index_for_tests()
    return importlib.reload(vs)


def test_import_without_pinecone_api_key_does_not_raise(monkeypatch):
    """Importing vector_store succeeds when PINECONE_API_KEY is unset."""
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    vs = _reload_vector_store()
    assert vs.INDEX_NAME == "perspective"
    assert callable(vs.get_index)


def test_get_index_without_api_key_raises_value_error(monkeypatch):
    """get_index() raises ValueError when PINECONE_API_KEY is missing."""
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    vs = _reload_vector_store()
    with pytest.raises(ValueError, match="PINECONE_API_KEY"):
        vs.get_index()


def test_get_index_initializes_once_and_reuses_cached_index(monkeypatch):
    """The Pinecone client is constructed once and the same index is reused."""
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    vs = _reload_vector_store()

    fake_index = MagicMock(name="Index")
    fake_pc = MagicMock(name="Pinecone")
    fake_pc.has_index.return_value = True
    fake_pc.Index.return_value = fake_index

    with patch("pinecone.Pinecone", return_value=fake_pc) as pinecone_ctor:
        first = vs.get_index()
        second = vs.get_index()

    assert first is fake_index
    assert second is fake_index
    pinecone_ctor.assert_called_once_with(api_key="test-key")
    fake_pc.Index.assert_called_once_with(vs.INDEX_NAME)


def test_get_index_creates_missing_index(monkeypatch):
    """get_index() creates the Pinecone index when it does not already exist."""
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    vs = _reload_vector_store()

    fake_index = MagicMock(name="Index")
    fake_pc = MagicMock(name="Pinecone")
    fake_pc.has_index.return_value = False
    fake_pc.Index.return_value = fake_index

    with (
        patch("pinecone.Pinecone", return_value=fake_pc),
        patch("pinecone.ServerlessSpec") as spec_cls,
        patch("pinecone.CloudProvider") as cloud,
        patch("pinecone.AwsRegion") as region,
    ):
        cloud.AWS = "aws"
        region.US_EAST_1 = "us-east-1"
        spec_cls.return_value = MagicMock(name="Spec")
        assert vs.get_index() is fake_index

    fake_pc.create_index.assert_called_once()
    kwargs = fake_pc.create_index.call_args.kwargs
    assert kwargs["name"] == vs.INDEX_NAME
    assert kwargs["dimension"] == vs.DIMENSIONS
    assert kwargs["metric"] == vs.METRIC


def test_direct_import_of_index_does_not_initialize(monkeypatch):
    """``from app.db.vector_store import index`` must not construct the client."""
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    _reload_vector_store()

    with patch("pinecone.Pinecone") as pinecone_ctor:
        from app.db.vector_store import index

        assert index is not None
        pinecone_ctor.assert_not_called()
        with pytest.raises(ValueError, match="PINECONE_API_KEY"):
            index.query(vector=[0.1], top_k=1)
        pinecone_ctor.assert_not_called()


def test_index_and_pc_proxies_forward_on_first_use(monkeypatch):
    """Proxy attribute access initializes once and forwards to the real objects."""
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    vs = _reload_vector_store()

    fake_index = MagicMock(name="Index")
    fake_pc = MagicMock(name="Pinecone")
    fake_pc.has_index.return_value = True
    fake_pc.Index.return_value = fake_index

    with patch("pinecone.Pinecone", return_value=fake_pc) as pinecone_ctor:
        bound_index = vs.index
        bound_pc = vs.pc
        pinecone_ctor.assert_not_called()

        bound_index.upsert([{"id": "1"}], namespace="default")
        assert bound_pc.has_index(vs.INDEX_NAME) is True

    pinecone_ctor.assert_called_once_with(api_key="test-key")
    fake_index.upsert.assert_called_once_with(
        [{"id": "1"}], namespace="default"
    )


def test_store_vectors_uses_lazy_get_index(monkeypatch):
    """store_vectors.store() fetches the index via get_index(), not at import."""
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    vs = _reload_vector_store()

    fake_index = MagicMock(name="Index")
    with patch.object(vs, "get_index", return_value=fake_index) as get_index:
        from app.utils import store_vectors

        importlib.reload(store_vectors)
        store_vectors.store(
            [{"id": "1", "values": [0.1], "metadata": {}}], namespace="default"
        )

    get_index.assert_called_once_with()
    fake_index.upsert.assert_called_once()


def test_store_vectors_module_import_without_api_key(monkeypatch):
    """Importing store_vectors must not require Pinecone credentials."""
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    _reload_vector_store()
    from app.utils import store_vectors

    importlib.reload(store_vectors)
    assert callable(store_vectors.store)

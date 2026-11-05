"""Tests for import-time setup: logging, the Pinecone connection, the prompt template and the FastAPI app."""

import logging
import sys

import pinecone
import pytest
from fastapi.testclient import TestClient

from app.config import (
    CORS_ALLOW_ORIGINS,
    PINECONE_CLOUD,
    PINECONE_DIMENSIONS,
    PINECONE_INDEX_NAME,
    PINECONE_METRIC,
    PINECONE_REGION,
)
from app.logging.logging_config import setup_logger
from app.utils.prompt_templates import generation_prompt
from main import app

# --- setup_logger ---------------------------------------------------------------------


@pytest.fixture
def new_logger_name(request, tmp_path, monkeypatch):
    """A logger name no other test uses, with app.log written to a temporary directory."""
    monkeypatch.chdir(tmp_path)
    name = f"test_logger.{request.node.name}"
    yield name
    logger = logging.getLogger(name)
    for handler in list(logger.handlers):
        logger.removeHandler(handler)
        handler.close()


def test_logger_writes_info_to_stdout_and_debug_to_app_log(new_logger_name, tmp_path, capsys):
    logger = setup_logger(new_logger_name)

    logger.debug("debug detail")
    logger.info("info message")
    for handler in logger.handlers:
        handler.flush()

    assert logger.level == logging.DEBUG
    stdout = capsys.readouterr().out
    assert "[INFO] [" + new_logger_name + "]: info message" in stdout
    assert "debug detail" not in stdout
    log_file = (tmp_path / "app.log").read_text(encoding="utf-8")
    assert "debug detail" in log_file
    assert "info message" in log_file


def test_logger_is_configured_only_once(new_logger_name):
    first = setup_logger(new_logger_name)
    handlers = list(first.handlers)

    second = setup_logger(new_logger_name)

    assert second is first
    assert second.handlers == handlers


def test_logger_keeps_console_output_when_app_log_cannot_be_opened(new_logger_name, monkeypatch, capsys):
    def unwritable(*args, **kwargs):
        raise PermissionError("read-only file system")

    monkeypatch.setattr(logging, "FileHandler", unwritable)

    logger = setup_logger(new_logger_name)
    logger.info("still visible")

    assert [type(h) for h in logger.handlers] == [logging.StreamHandler]
    stdout = capsys.readouterr().out
    assert "File logging disabled (app.log could not be opened): read-only file system" in stdout
    assert "still visible" in stdout


class FakeStream:
    def __init__(self, error=None):
        self.error = error
        self.reconfigured = []

    def reconfigure(self, **kwargs):
        self.reconfigured.append(kwargs)
        if self.error:
            raise self.error

    def write(self, text):
        pass

    def flush(self):
        pass


@pytest.mark.parametrize(
    ("platform", "expected"),
    [("win32", [{"encoding": "utf-8", "errors": "replace"}]), ("linux", [])],
)
def test_console_streams_are_switched_to_utf8_only_on_windows(monkeypatch, fresh_module, platform, expected):
    stdout, stderr = FakeStream(), FakeStream()
    monkeypatch.setattr(sys, "platform", platform)
    monkeypatch.setattr(sys, "stdout", stdout)
    monkeypatch.setattr(sys, "stderr", stderr)

    fresh_module("app.logging.logging_config")

    assert stdout.reconfigured == expected
    assert stderr.reconfigured == expected


def test_a_console_that_cannot_be_reconfigured_does_not_break_logging(monkeypatch, fresh_module):
    monkeypatch.setattr(sys, "platform", "win32")
    monkeypatch.setattr(sys, "stdout", FakeStream(error=OSError("not a tty")))

    module = fresh_module("app.logging.logging_config")

    assert callable(module.setup_logger)


# --- app.db.vector_store ----------------------------------------------------------------------


@pytest.fixture
def pinecone_client(monkeypatch):
    """Replace the Pinecone client class; `config` controls it and `calls` records what it was asked."""
    calls = {"init": [], "create_index": [], "index": []}
    config = {"init_error": None, "has_index": True, "index_error": None}
    index = object()

    class RecordingPinecone:
        def __init__(self, api_key):
            calls["init"].append(api_key)
            if config["init_error"]:
                raise config["init_error"]

        def has_index(self, name):
            return config["has_index"]

        def create_index(self, **kwargs):
            calls["create_index"].append(kwargs)

        def Index(self, name):
            calls["index"].append(name)
            if config["index_error"]:
                raise config["index_error"]
            return index

    monkeypatch.setattr(pinecone, "Pinecone", RecordingPinecone)
    return config, calls, index


def test_vector_store_connects_to_an_existing_index(pinecone_client, fresh_module):
    _, calls, index = pinecone_client

    module = fresh_module("app.db.vector_store")

    assert module.index is index
    assert calls == {"init": ["test-pinecone-key"], "create_index": [], "index": [PINECONE_INDEX_NAME]}


def test_vector_store_creates_the_index_when_it_is_missing(pinecone_client, fresh_module):
    config, calls, index = pinecone_client
    config["has_index"] = False

    module = fresh_module("app.db.vector_store")

    [created] = calls["create_index"]
    assert created["name"] == PINECONE_INDEX_NAME
    assert created["dimension"] == PINECONE_DIMENSIONS
    assert created["metric"] == PINECONE_METRIC
    assert (created["spec"].cloud, created["spec"].region) == (PINECONE_CLOUD, PINECONE_REGION)
    assert module.index is index


def test_vector_store_requires_an_api_key(monkeypatch, pinecone_client, fresh_module):
    _, calls, _ = pinecone_client
    monkeypatch.delenv("PINECONE_API_KEY")

    with pytest.raises(ValueError, match="PINECONE_API_KEY environment variable is required"):
        fresh_module("app.db.vector_store")

    assert calls["init"] == []


@pytest.mark.parametrize(
    ("failure", "message"),
    [("init_error", "intialising pinecone client"), ("index_error", f"connecting to the index {PINECONE_INDEX_NAME}")],
)
def test_vector_store_reports_connection_failures(pinecone_client, fresh_module, failure, message):
    config, _, _ = pinecone_client
    config[failure] = ConnectionError("pinecone unreachable")

    with pytest.raises(RuntimeError, match=message) as raised:
        fresh_module("app.db.vector_store")

    assert "pinecone unreachable" in str(raised.value)


# --- prompt template --------------------------------------------------------------------------


def test_generation_prompt_fills_in_the_article_sentiment_and_facts():
    assert set(generation_prompt.input_variables) == {"cleaned_article", "sentiment", "facts"}

    [message] = generation_prompt.format_messages(
        cleaned_article="ARTICLE BODY", sentiment="negative", facts="FACT LIST"
    )

    assert "## Article:\nARTICLE BODY" in message.content
    assert "## Sentiment:\nnegative" in message.content
    assert "## Verified Facts:\nFACT LIST" in message.content
    # Escaped braces render as a literal JSON example rather than template variables.
    assert '{\n  "counter_perspective"' in message.content


# --- main.py ------------------------------------------------------------------------------------


def test_routes_are_mounted_under_api():
    paths = {route.path for route in app.routes}

    assert {"/api/", "/api/bias", "/api/process", "/api/chat"} <= paths
    assert "/bias" not in paths


def test_cors_preflight_is_allowed_for_configured_origins():
    origin = "https://frontend.example" if CORS_ALLOW_ORIGINS == ["*"] else CORS_ALLOW_ORIGINS[0]

    response = TestClient(app).options(
        "/api/chat",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] in {origin, "*"}
    assert "POST" in response.headers["access-control-allow-methods"]

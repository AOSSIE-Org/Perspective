"""Tests for app.modules.scraper.safe_fetch: the SSRF guard around article fetching."""

import pytest
import requests

from app.config import (
    FETCH_CHUNK_BYTES,
    FETCH_MAX_BYTES,
    FETCH_MAX_REDIRECTS,
    FETCH_TIMEOUT_SECONDS,
)
from app.modules.scraper import safe_fetch
from app.modules.scraper.safe_fetch import (
    UnsafeURLError,
    fetch_public_html,
    validate_public_url,
)

PUBLIC_IP = "93.184.215.14"
PUBLIC_IPV6 = "2606:2800:21f:cb07:6820:80da:af6b:8b2c"
HTTP_OK = 200
HTTP_FOUND = 302
HTTP_NOT_FOUND = 404


# --- validate_public_url ------------------------------------------------------


@pytest.mark.parametrize(
    ("url", "expected_port"),
    [
        ("https://example.com/article", 443),
        ("http://example.com/article", 80),
        ("HTTPS://example.com/article", 443),
        ("http://example.com:8080/article", 8080),
    ],
)
def test_accepts_public_http_and_https_urls(resolve_hosts, url, expected_port):
    lookups = resolve_hosts({"example.com": [PUBLIC_IP, PUBLIC_IPV6]})

    validate_public_url(url)

    assert lookups == [("example.com", expected_port)]


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/file.txt",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "gopher://example.com/",
        "example.com/article",
        "http://",
        "",
    ],
)
def test_rejects_non_http_urls_without_resolving_them(resolve_hosts, url):
    lookups = resolve_hosts({"example.com": [PUBLIC_IP]})

    with pytest.raises(UnsafeURLError, match="Only http and https"):
        validate_public_url(url)

    assert lookups == []


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",  # loopback
        "10.0.0.5",  # private
        "172.16.4.2",  # private
        "192.168.1.1",  # private
        "169.254.169.254",  # link-local (cloud metadata service)
        "100.64.0.1",  # carrier-grade NAT
        "0.0.0.0",  # unspecified
        "240.0.0.1",  # reserved
        "::1",  # IPv6 loopback
        "fe80::1%eth0",  # IPv6 link-local with a zone index
        "fc00::1",  # IPv6 unique local
        "::ffff:127.0.0.1",  # IPv4-mapped loopback
    ],
)
def test_rejects_hosts_that_resolve_to_non_public_addresses(resolve_hosts, address):
    resolve_hosts({"internal.example": [address]})

    with pytest.raises(UnsafeURLError, match="private or reserved"):
        validate_public_url("http://internal.example/")


def test_rejects_ip_literal_urls_for_private_addresses(resolve_hosts):
    resolve_hosts({"127.0.0.1": ["127.0.0.1"]})

    with pytest.raises(UnsafeURLError, match="private or reserved"):
        validate_public_url("http://127.0.0.1:8000/admin")


def test_rejects_host_when_any_resolved_address_is_private(resolve_hosts):
    # DNS can return several records; a single internal one must block the request.
    resolve_hosts({"mixed.example": [PUBLIC_IP, "10.1.2.3"]})

    with pytest.raises(UnsafeURLError, match="private or reserved"):
        validate_public_url("https://mixed.example/")


def test_rejects_unresolvable_hosts(resolve_hosts):
    resolve_hosts({})

    with pytest.raises(UnsafeURLError, match="could not be resolved"):
        validate_public_url("https://does-not-exist.example/")


def test_rejects_out_of_range_ports(resolve_hosts):
    lookups = resolve_hosts({"example.com": [PUBLIC_IP]})

    with pytest.raises(UnsafeURLError, match="could not be resolved"):
        validate_public_url("http://example.com:99999/")

    assert lookups == []


def test_unsafe_url_error_is_a_value_error():
    # Callers that already handle ValueError keep working.
    assert issubclass(UnsafeURLError, ValueError)


# --- fetch_public_html ---------------------------------------------------------


class FakeResponse:
    def __init__(self, status=HTTP_OK, body=b"", headers=None, encoding=None, chunks=None):
        self.status_code = status
        self.headers = headers or {}
        self.encoding = encoding
        self._chunks = chunks if chunks is not None else [body]
        self.requested_chunk_size = None

    @property
    def is_redirect(self):
        return "Location" in self.headers or self.status_code in (301, 302, 303, 307, 308)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} error")

    def iter_content(self, chunk_size):
        self.requested_chunk_size = chunk_size
        yield from self._chunks

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


@pytest.fixture
def fake_get(monkeypatch):
    """Serve queued FakeResponses from requests.get and record every request."""
    calls = []
    responses = []

    def get(url, **kwargs):
        calls.append({"url": url, **kwargs})
        return responses.pop(0)

    monkeypatch.setattr(safe_fetch.requests, "get", get)

    def queue(*items):
        responses.extend(items)
        return calls

    return queue


def test_fetches_a_public_page_without_letting_requests_follow_redirects(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    response = FakeResponse(body=b"<html>hello</html>")
    calls = fake_get(response)
    headers = {"User-Agent": "test-agent"}

    html = fetch_public_html("https://example.com/a", headers)

    assert html == "<html>hello</html>"
    assert calls == [
        {
            "url": "https://example.com/a",
            "headers": headers,
            "timeout": FETCH_TIMEOUT_SECONDS,
            "allow_redirects": False,
            "stream": True,
        }
    ]
    assert response.requested_chunk_size == FETCH_CHUNK_BYTES


def test_refuses_to_fetch_a_private_url(resolve_hosts, fake_get):
    resolve_hosts({"localhost": ["127.0.0.1"]})
    calls = fake_get()

    with pytest.raises(UnsafeURLError):
        fetch_public_html("http://localhost/")

    assert calls == []


def test_follows_relative_redirects_and_validates_each_hop(resolve_hosts, fake_get):
    lookups = resolve_hosts({"example.com": [PUBLIC_IP], "cdn.example.org": [PUBLIC_IP]})
    calls = fake_get(
        FakeResponse(status=HTTP_FOUND, headers={"Location": "/moved"}),
        FakeResponse(status=HTTP_FOUND, headers={"Location": "https://cdn.example.org/final"}),
        FakeResponse(body=b"final page"),
    )

    html = fetch_public_html("https://example.com/start")

    assert html == "final page"
    assert [c["url"] for c in calls] == [
        "https://example.com/start",
        "https://example.com/moved",
        "https://cdn.example.org/final",
    ]
    assert [host for host, _ in lookups] == ["example.com", "example.com", "cdn.example.org"]


def test_blocks_a_redirect_to_a_private_address(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP], "metadata.internal": ["169.254.169.254"]})
    calls = fake_get(
        FakeResponse(status=HTTP_FOUND, headers={"Location": "http://metadata.internal/latest/"}),
        FakeResponse(body=b"secret"),
    )

    with pytest.raises(UnsafeURLError, match="private or reserved"):
        fetch_public_html("https://example.com/start")

    assert [c["url"] for c in calls] == ["https://example.com/start"]


def test_rejects_a_redirect_without_a_location_header(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    fake_get(FakeResponse(status=HTTP_FOUND))

    with pytest.raises(requests.RequestException, match="without a Location"):
        fetch_public_html("https://example.com/start")


def test_gives_up_after_the_redirect_limit(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    hops = FETCH_MAX_REDIRECTS + 1
    calls = fake_get(*[FakeResponse(status=HTTP_FOUND, headers={"Location": f"/hop-{i}"}) for i in range(hops)])

    with pytest.raises(requests.RequestException, match="Too many redirects"):
        fetch_public_html("https://example.com/start")

    assert len(calls) == hops


def test_raises_for_error_status_codes(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    fake_get(FakeResponse(status=HTTP_NOT_FOUND, body=b"not found"))

    with pytest.raises(requests.HTTPError):
        fetch_public_html("https://example.com/missing")


def test_accepts_a_body_of_exactly_the_size_limit(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    full_chunks, remainder = divmod(FETCH_MAX_BYTES, FETCH_CHUNK_BYTES)
    chunks = [b"a" * FETCH_CHUNK_BYTES] * full_chunks + [b"a" * remainder]
    fake_get(FakeResponse(chunks=chunks))

    html = fetch_public_html("https://example.com/big")

    assert len(html) == FETCH_MAX_BYTES


def test_rejects_a_body_larger_than_the_size_limit(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    chunks_read = []

    def endless_body():
        while True:
            chunks_read.append(1)
            yield b"a" * FETCH_CHUNK_BYTES

    fake_get(FakeResponse(chunks=endless_body()))

    with pytest.raises(requests.RequestException, match="too large"):
        fetch_public_html("https://example.com/huge")

    # Reading stops as soon as the limit is passed instead of draining the stream.
    assert len(chunks_read) == FETCH_MAX_BYTES // FETCH_CHUNK_BYTES + 1


def test_decodes_with_the_declared_charset(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    fake_get(
        FakeResponse(
            body="café".encode("latin-1"),
            headers={"Content-Type": "text/html; charset=ISO-8859-1"},
            encoding="ISO-8859-1",
        )
    )

    assert fetch_public_html("https://example.com/") == "café"


def test_decodes_utf8_when_no_charset_is_declared(resolve_hosts, fake_get):
    # requests would guess ISO-8859-1 for text/html without a charset and garble UTF-8.
    resolve_hosts({"example.com": [PUBLIC_IP]})
    fake_get(FakeResponse(body="naïve café".encode("utf-8"), headers={"Content-Type": "text/html"}, encoding="ISO-8859-1"))

    assert fetch_public_html("https://example.com/") == "naïve café"


def test_falls_back_to_latin1_for_undeclared_non_utf8_bodies(resolve_hosts, fake_get):
    resolve_hosts({"example.com": [PUBLIC_IP]})
    fake_get(FakeResponse(body="café".encode("latin-1"), headers={"Content-Type": "text/html"}))

    assert fetch_public_html("https://example.com/") == "café"

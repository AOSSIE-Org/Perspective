"""
safe_fetch.py
-------------
Fetches article HTML for a user-supplied URL without letting the request reach
private or internal hosts (server-side request forgery).

Every URL, including each redirect target, must use http or https and resolve
only to public IP addresses. Redirects are followed manually so each hop is
checked, and the response body is capped in size and in total download time.
The connection for each hop goes to the address that was validated, so a DNS
answer that changes between the check and the request (DNS rebinding) cannot
redirect it; the Host header, TLS SNI and certificate check still use the
original hostname. The redirect, size and timeout limits are set in app.config.

Functions:
    validate_public_url(url)
        Raises UnsafeURLError if the URL is not an http(s) URL on a public host;
        otherwise returns a validated address to connect to.
    fetch_public_html(url, headers)
        Returns the HTML of a public page, following and re-checking redirects.
"""

import ipaddress
import socket
import time
from urllib.parse import urljoin, urlsplit

import requests
from requests.adapters import HTTPAdapter

from app.config import (
    FETCH_CHUNK_BYTES,
    FETCH_MAX_BYTES,
    FETCH_MAX_REDIRECTS,
    FETCH_TIMEOUT_SECONDS,
    FETCH_TOTAL_TIMEOUT_SECONDS,
)

ALLOWED_SCHEMES = {"http", "https"}


class UnsafeURLError(ValueError):
    """The URL is malformed, not http(s), or points at a non-public address."""


def validate_public_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme.lower() not in ALLOWED_SCHEMES or not parts.hostname:
        raise UnsafeURLError("Only http and https URLs are allowed.")
    try:
        port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
        infos = socket.getaddrinfo(parts.hostname, port, proto=socket.IPPROTO_TCP)
    except (ValueError, socket.gaierror) as e:
        raise UnsafeURLError("The URL's host could not be resolved.") from e
    addresses = [ipaddress.ip_address(info[4][0].split("%", 1)[0]) for info in infos]
    # Python counts multicast ranges (224.0.0.0/4, ff00::/8) as global, so they are rejected explicitly
    if not addresses or any(not address.is_global or address.is_multicast for address in addresses):
        raise UnsafeURLError("The URL points to a private or reserved address.")
    return str(addresses[0])


class PinnedHostAdapter(HTTPAdapter):
    """
    Transport for an https URL whose host has been replaced by a validated IP
    address: TLS uses the original hostname for SNI and certificate checking.
    """

    def __init__(self, hostname: str):
        self.hostname = hostname
        super().__init__()

    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        super().init_poolmanager(
            connections,
            maxsize,
            block,
            server_hostname=self.hostname,
            assert_hostname=self.hostname,
            **pool_kwargs,
        )


def pin_to_address(url: str, address: str) -> tuple[str, str]:
    """Returns (url with its host replaced by address, Host header value for the original host)."""
    parts = urlsplit(url)
    ip_host = f"[{address}]" if ":" in address else address
    host_header = f"[{parts.hostname}]" if ":" in parts.hostname else parts.hostname
    if parts.port:
        ip_host = f"{ip_host}:{parts.port}"
        host_header = f"{host_header}:{parts.port}"
    # Credentials in the URL are dropped; they are never sent to article sites
    return parts._replace(netloc=ip_host).geturl(), host_header


def fetch_public_html(url: str, headers: dict | None = None) -> str:
    deadline = time.monotonic() + FETCH_TOTAL_TIMEOUT_SECONDS
    current = url
    with requests.Session() as session:
        for _ in range(FETCH_MAX_REDIRECTS + 1):
            address = validate_public_url(current)
            pinned_url, host_header = pin_to_address(current, address)
            parts = urlsplit(pinned_url)
            if parts.scheme.lower() == "https":
                session.mount(f"https://{parts.netloc}/", PinnedHostAdapter(urlsplit(current).hostname))
            with session.get(
                pinned_url,
                headers={**(headers or {}), "Host": host_header},
                timeout=FETCH_TIMEOUT_SECONDS,
                allow_redirects=False,
                stream=True,
            ) as res:
                if res.is_redirect:
                    location = res.headers.get("Location")
                    if not location:
                        raise requests.RequestException("Redirect without a Location header.")
                    current = urljoin(current, location)
                    continue
                res.raise_for_status()
                body = b""
                for chunk in res.iter_content(chunk_size=FETCH_CHUNK_BYTES):
                    body += chunk
                    if len(body) > FETCH_MAX_BYTES:
                        raise requests.RequestException("Response is too large.")
                    if time.monotonic() > deadline:
                        raise requests.RequestException("Download took too long.")
                return _decode(body, res)
    raise requests.RequestException("Too many redirects.")


def _decode(body: bytes, res: requests.Response) -> str:
    # requests assumes ISO-8859-1 for text/* without a charset, which garbles most pages
    if "charset=" in res.headers.get("Content-Type", "").lower() and res.encoding:
        return body.decode(res.encoding, errors="replace")
    try:
        return body.decode("utf-8")
    except UnicodeDecodeError:
        return body.decode("latin-1")

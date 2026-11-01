"""
safe_fetch.py
-------------
Fetches article HTML for a user-supplied URL without letting the request reach
private or internal hosts (server-side request forgery).

Every URL, including each redirect target, must use http or https and resolve
only to public IP addresses. Redirects are followed manually so each hop is
checked, and the response body is capped in size.

Functions:
    validate_public_url(url)
        Raises UnsafeURLError if the URL is not an http(s) URL on a public host.
    fetch_public_html(url, headers)
        Returns the HTML of a public page, following and re-checking redirects.
"""

import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import requests

ALLOWED_SCHEMES = {"http", "https"}
MAX_REDIRECTS = 5
MAX_BYTES = 5 * 1024 * 1024
TIMEOUT_SECONDS = 10


class UnsafeURLError(ValueError):
    """The URL is malformed, not http(s), or points at a non-public address."""


def validate_public_url(url: str) -> None:
    parts = urlsplit(url)
    if parts.scheme.lower() not in ALLOWED_SCHEMES or not parts.hostname:
        raise UnsafeURLError("Only http and https URLs are allowed.")
    try:
        port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
        infos = socket.getaddrinfo(parts.hostname, port, proto=socket.IPPROTO_TCP)
    except (ValueError, socket.gaierror) as e:
        raise UnsafeURLError("The URL's host could not be resolved.") from e
    for info in infos:
        address = ipaddress.ip_address(info[4][0].split("%", 1)[0])
        if not address.is_global:
            raise UnsafeURLError("The URL points to a private or reserved address.")


def fetch_public_html(url: str, headers: dict | None = None) -> str:
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        validate_public_url(current)
        with requests.get(
            current,
            headers=headers,
            timeout=TIMEOUT_SECONDS,
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
            for chunk in res.iter_content(chunk_size=65536):
                body += chunk
                if len(body) > MAX_BYTES:
                    raise requests.RequestException("Response is too large.")
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

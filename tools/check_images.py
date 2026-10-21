#!/usr/bin/env python3
"""Check local Markdown image paths and SVG syntax without network access.

Run `python3 tools/check_images.py` from any directory. External image URLs
are counted separately: passing this check does not verify remote availability.
"""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


class ImageTags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []

    def handle_starttag(self, tag, attrs):
        if tag == "img":
            self.sources.append(dict(attrs).get("src", ""))


def image_sources(text):
    # Ignore examples inside fenced code blocks.
    text = re.sub(r"^(`{3,}|~{3,})[^\n]*\n.*?^\1[^\n]*$", "", text,
                  flags=re.MULTILINE | re.DOTALL)
    tags = ImageTags()
    tags.feed(text)
    yield from tags.sources
    # Inline Markdown images, including angle-bracket destinations with spaces.
    for match in re.finditer(r"!\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))", text):
        yield match.group(1) or match.group(2)
    # Full, collapsed, and shortcut reference-style images.
    definitions = {
        " ".join(m.group(1).casefold().split()): m.group(2) or m.group(3)
        for m in re.finditer(r"^ {0,3}\[([^\]\n]+)\]:\s*(?:<([^>\n]+)>|(\S+))",
                             text, re.MULTILINE)
    }
    for match in re.finditer(r"!\[([^\]\n]*)\](?:\[([^\]\n]*)\])?(?![\[(])", text):
        label = match.group(2) or match.group(1)
        label = " ".join(label.casefold().split())
        if label in definitions:
            yield definitions[label]


def check(root):
    errors = []
    local = set()
    external = set()
    references = 0
    for document in sorted(root.rglob("*.md")):
        if ".git" in document.relative_to(root).parts:
            continue
        for source in image_sources(document.read_text(encoding="utf-8")):
            references += 1
            url = urlsplit(source)
            if url.scheme or url.netloc:
                external.add(source)
                continue
            target = (root if url.path.startswith("/") else document.parent) / unquote(url.path).lstrip("/")
            local.add(target.resolve())
            if not source or not url.path or not target.is_file():
                errors.append(f"{document.relative_to(root)}: missing image {source!r}")
    svgs = sorted(root.rglob("*.svg"))
    for asset in svgs:
        try:
            element = ET.parse(asset).getroot()
            if element.tag != "{http://www.w3.org/2000/svg}svg":
                raise ValueError("missing SVG root or SVG namespace")
        except (ET.ParseError, OSError, ValueError) as error:
            errors.append(f"{asset.relative_to(root)}: invalid SVG: {error}")
    print(f"Image references: {references}; distinct local images: {len(local)}; SVG files: {len(svgs)}")
    print(f"External image URLs: {len(external)} (not checked; require a network-enabled audit)")
    for error in errors:
        print(f"ERROR: {error}")
    print(f"{'FAIL' if errors else 'PASS'}: local image paths and SVG syntax")
    return bool(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    raise SystemExit(check(parser.parse_args().root.resolve()))

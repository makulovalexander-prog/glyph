#!/usr/bin/env python3
"""
check_copy.py — language gate for public-facing copy (PLATFORM-FRAMEWORK §1, §4).

The thesis is presence-verified digital art. The moment public copy needs crypto
vocabulary to sound exciting, we've drifted. This scans the *visible text* of
public-facing files (tags/scripts/styles stripped) for the banned words.

Run from repo root:  python3 tools/check_copy.py
Exit 0 = clean; 1 = banned word in public copy.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Public-facing surfaces. Code files / internal docs are exempt — this gate is
# about what the public reads, not what the stack is called internally.
PUBLIC_FILES = ["campaign.html", "index.html", "studio-v2.html"]
PUBLIC_GLOBS = ["copy/**/*.md", "copy/**/*.html"]

BANNED = re.compile(
    r"\b(nft|nfts|blockchain|on-chain|onchain|token|tokens|tokenized|crypto|"
    r"cryptocurrency|web3|smart contract|minting fee|wallet address)\b",
    re.IGNORECASE,
)

TAG_STRIP = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.DOTALL | re.IGNORECASE)
TAGS = re.compile(r"<[^>]+>")
COMMENTS = re.compile(r"<!--.*?-->", re.DOTALL)


def visible_text(path: pathlib.Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix == ".html":
        text = COMMENTS.sub(" ", text)
        text = TAG_STRIP.sub(" ", text)
        text = TAGS.sub(" ", text)
    return text


def main() -> int:
    targets = [ROOT / f for f in PUBLIC_FILES]
    for g in PUBLIC_GLOBS:
        targets += list(ROOT.glob(g))

    fails = []
    for p in targets:
        if not p.exists():
            continue
        for i, line in enumerate(visible_text(p).splitlines(), 1):
            for m in BANNED.finditer(line):
                fails.append(f"  {p.relative_to(ROOT)}: banned word “{m.group(0)}” → “{line.strip()[:90]}”")

    if fails:
        print("✗ Copy gate FAILED — crypto vocabulary in public copy (PLATFORM-FRAMEWORK §1):")
        print("\n".join(fails))
        print("\nSay what it does: presence-verified · really there · digital keepsake/art.")
        return 1
    print("✓ Copy gate holds — no banned vocabulary in public copy.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

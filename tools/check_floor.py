#!/usr/bin/env python3
"""
check_floor.py — automated gate for the Glyph engineering floor (CLAUDE.md).

Checks, matching the four floor rules:
  1. No runtime network: no http(s) URLs in src/href/fetch/@import/url() across
     the static app (xmlns + data: URLs allowed); no CDN hosts in platform/src.
  2. (Perf is not statically checkable — reminder only.)
  3. WCAG AA: ink/soft text colors hit 4.5:1 on bg/surface in every THEME_PRESET.
  4. prefers-reduced-motion block + :focus-visible rules exist.

Run from repo root:  python3 tools/check_floor.py
Exit code 0 = floor holds; 1 = violation (pre-commit hook blocks the commit).
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, warns = [], []

# ---------- 1. No runtime network ----------
STATIC_FILES = ["index.html", "app.js", "styles.css", "fonts/fonts.css", "campaign.html",
                "studio-v2.html", "themes/generated.js",
                "style-tile.html", "style-tile-v2.html", "style-tile-v3.html"]
URL_RE = re.compile(r"https?://[^\s'\"<>)]+")
for rel in STATIC_FILES:
    p = ROOT / rel
    if not p.exists():
        continue
    text = p.read_text(encoding="utf-8", errors="replace")
    for m in URL_RE.finditer(text):
        start = max(0, m.start() - 30)
        ctx = text[start:m.start()]
        if "xmlns" in ctx or "data:image" in ctx:
            continue  # SVG namespace / data URLs are offline-safe
        fails.append(f"[network] {rel}: external URL {m.group(0)[:80]}")
    for bad in ("fetch(", "XMLHttpRequest", "sendBeacon", "new WebSocket"):
        if bad in text:
            warns.append(f"[network?] {rel}: contains `{bad}` — verify it never leaves localhost")

CDN_RE = re.compile(r"fonts\.googleapis|fonts\.gstatic|cdn\.|cdnjs|unpkg|jsdelivr")
plat = ROOT / "platform" / "src"
if plat.exists():
    for p in plat.rglob("*"):
        if p.suffix in {".ts", ".tsx", ".css", ".js", ".jsx"}:
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                if CDN_RE.search(line):
                    fails.append(f"[network] platform/src/{p.relative_to(plat)}:{i}: CDN reference")

# ---------- 3. WCAG AA contrast on theme presets ----------
def lum(hexc):
    h = hexc.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

appjs = (ROOT / "app.js").read_text(encoding="utf-8", errors="replace")
preset_re = re.compile(r"(\w+):\{ preset:'(\w+)'.*?colors:\{([^}]*)\}", re.S)
for _, preset, colorblock in preset_re.findall(appjs):
    c = dict(re.findall(r"(\w+):'(#[0-9A-Fa-f]{6})'", colorblock))
    for fg, bg, label in [("ink", "bg", "body on bg"), ("ink", "surface", "body on surface"),
                          ("soft", "bg", "secondary on bg"), ("soft", "surface", "secondary on surface")]:
        if fg in c and bg in c:
            r = ratio(c[fg], c[bg])
            if r < 4.5:
                fails.append(f"[contrast] theme '{preset}': {label} = {r:.2f}:1 (< 4.5 AA)")

# ---------- 4. Reduced motion + focus-visible ----------
css = (ROOT / "styles.css").read_text(encoding="utf-8", errors="replace")
if "prefers-reduced-motion" not in css:
    fails.append("[motion] styles.css: no @media (prefers-reduced-motion: reduce) block")
if ":focus-visible" not in css:
    fails.append("[a11y] styles.css: no :focus-visible rules")
gcss = ROOT / "platform" / "src" / "app" / "globals.css"
if gcss.exists():
    g = gcss.read_text(encoding="utf-8", errors="replace")
    if "prefers-reduced-motion" not in g:
        fails.append("[motion] platform globals.css: no prefers-reduced-motion block")

# ---------- report ----------
for w in warns:
    print("WARN ", w)
for f in fails:
    print("FAIL ", f)
if not fails:
    print("Floor holds: no network refs, AA contrast on all presets, reduced-motion + focus-visible present.")
    print("(Reminder — rule 2 is dynamic: gallery perf with 20+ cards needs a manual/browser check.)")
sys.exit(1 if fails else 0)

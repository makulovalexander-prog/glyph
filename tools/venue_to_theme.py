#!/usr/bin/env python3
"""
venue_to_theme.py — the automated venue → card-theme pipeline.

Input:  a venue folder (logo + reference images), e.g. one folder per venue in
        the "Glyph Mood Board/glyph_art" directory.
Output: themes/generated.js — `const VENUE_THEMES = {...}` consumed by
        studio-v2.html (kept as a local <script src>, so the app stays offline).

What it does per venue:
  1. Picks the logo (filename containing "logo", else largest image).
  2. Extracts a 1–5 color identity palette (k-means via Pillow quantize,
     deduped perceptually, ranked by population × saturation).
  3. Chooses a ground (bg) from the palette — dark ground unless the identity
     is overwhelmingly light/loud (Hanuman-style poster ground).
  4. ENFORCES WCAG AA: ink is auto-picked and soft is iteratively blended so
     both hit ≥4.5:1 on the ground (engineering floor — themes ship legal).
  5. Suggests an archetype: poster (loud), classic, or minimal (quiet) from
     saturation/contrast heuristics. (The studio lets you override.)
  6. Re-encodes the logo ≤400px as a data URL (engineering floor: no runtime
     fetches of user assets).

Usage:
  python3 tools/venue_to_theme.py "/path/to/Glyph Mood Board/glyph_art"
  python3 tools/venue_to_theme.py "/path/to/one venue folder" --single
"""
import sys, os, json, re, base64, io, colorsys, pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "themes" / "generated.js"

# ---------- color math ----------
def lum(rgb):
    f = lambda c: c/12.92 if (c := c/255) <= 0.04045 else ((c+0.055)/1.055)**2.4
    r, g, b = rgb
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la+0.05)/(lb+0.05)

def hexc(rgb): return "#%02X%02X%02X" % tuple(rgb)

def sat(rgb):
    r, g, b = (c/255 for c in rgb)
    return colorsys.rgb_to_hsv(r, g, b)[1]

def mix(a, b, t):
    return tuple(round(a[i]*(1-t) + b[i]*t) for i in range(3))

def dist(a, b):  # rough perceptual distance
    return sum((a[i]-b[i])**2 for i in range(3)) ** 0.5

# ---------- palette extraction ----------
def load_rgb(path, max_side=300):
    im = Image.open(path).convert("RGBA")
    im.thumbnail((max_side, max_side))
    # composite on mid-grey so transparency doesn't read as a color
    bgd = Image.new("RGBA", im.size, (127, 127, 127, 255))
    return Image.alpha_composite(bgd, im).convert("RGB")

def palette_of(images, k=10):
    """k-means-ish palette across all reference images, ranked."""
    strip = Image.new("RGB", (sum(i.width for i in images), max(i.height for i in images)), (127,127,127))
    x = 0
    for i in images:
        strip.paste(i, (x, 0)); x += i.width
    q = strip.quantize(colors=k, method=Image.MEDIANCUT)
    counts = sorted(q.getcolors(strip.width*strip.height), reverse=True)
    pal = q.getpalette()
    out = []
    for n, idx in counts:
        rgb = tuple(pal[idx*3:idx*3+3])
        if dist(rgb, (127,127,127)) < 18:  # the transparency grey
            continue
        out.append((n, rgb))
    return out

def identity_colors(ranked, max_n=5):
    """Dedup + rank by population × (saturation boost). Returns up to 5."""
    chosen = []
    total = sum(n for n, _ in ranked) or 1
    scored = sorted(ranked, key=lambda t: -(t[0]/total) * (0.35 + sat(t[1])))
    for _, rgb in scored:
        if all(dist(rgb, c) > 60 for c in chosen):
            chosen.append(rgb)
        if len(chosen) == max_n:
            break
    return chosen

# ---------- AA enforcement ----------
INK_DARK, INK_LIGHT = (20, 16, 10), (244, 241, 234)

def pick_ground(colors):
    """Prefer a dark, low-ish saturation member; if identity is loud+light
    (poster logic), allow the loud light ground."""
    darks = [c for c in colors if lum(c) < 0.22]
    lights = [c for c in colors if lum(c) > 0.5]
    if darks:
        return min(darks, key=lum), "dark"
    if lights and max(sat(c) for c in lights) > 0.55:
        return max(lights, key=lambda c: sat(c)), "poster"
    if lights:
        return max(lights, key=lum), "light"
    return min(colors, key=lum), "dark"

def enforce_text(bg):
    ink = INK_LIGHT if ratio(INK_LIGHT, bg) >= ratio(INK_DARK, bg) else INK_DARK
    # soft: blend ink toward bg until just above 4.6 (keeps hierarchy, stays AA)
    soft = ink
    for t in range(1, 60):
        cand = mix(ink, bg, t/100*1.2)
        if ratio(cand, bg) < 4.6:
            break
        soft = cand
    return ink, soft

def accent_for(colors, bg, ink):
    """Most saturated identity color that isn't the ground; nudged for ≥3:1
    (large-text/graphics threshold) against the ground."""
    cands = sorted((c for c in colors if dist(c, bg) > 60), key=lambda c: -sat(c))
    acc = cands[0] if cands else ink
    t = 0
    while ratio(acc, bg) < 3.0 and t < 20:
        acc = mix(acc, ink, 0.12); t += 1
    return acc

# ---------- logo data-url ----------
def logo_data_url(path, max_side=400):
    im = Image.open(path)
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    if (im.mode in ("RGBA", "LA", "P")) and "A" in im.getbands() or im.mode == "P":
        im.save(buf, "PNG", optimize=True)
        mime = "image/png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=82, optimize=True)
        mime = "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()

# ---------- per-venue ----------
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def process(folder: pathlib.Path):
    imgs = [p for p in sorted(folder.iterdir())
            if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")]
    if not imgs:
        unsupported = [p.suffix for p in folder.iterdir() if p.suffix.lower() == ".avif"]
        print(f"  SKIP {folder.name}: no readable images" +
              (" (only .avif — convert to png/webp and rerun)" if unsupported else ""))
        return None
    logos = [p for p in imgs if "logo" in p.name.lower()]
    logo = logos[0] if logos else max(imgs, key=lambda p: p.stat().st_size)
    try:
        loaded = [load_rgb(p) for p in imgs[:6]]
    except Exception as e:
        print(f"  SKIP {folder.name}: {e}")
        return None
    ranked = palette_of(loaded)
    if not ranked:
        print(f"  SKIP {folder.name}: empty palette"); return None
    colors = identity_colors(ranked)
    bg, ground_kind = pick_ground(colors)
    ink, soft = enforce_text(bg)
    accent = accent_for(colors, bg, ink)
    bg2 = mix(bg, (0, 0, 0), 0.25) if lum(bg) > 0.04 else mix(bg, (255, 255, 255), 0.05)
    avg_sat = sum(sat(c) for c in colors)/len(colors)
    archetype = ("poster" if ground_kind == "poster" or avg_sat > 0.55
                 else "minimal" if avg_sat < 0.18 else "classic")
    theme = {
        "id": slug(folder.name), "name": folder.name,
        "archetype": archetype,
        "colors": {
            "bg1": hexc(bg), "bg2": hexc(bg2), "ink": hexc(ink), "soft": hexc(soft),
            "accents": [hexc(c) for c in colors if dist(c, bg) > 40][:5] or [hexc(accent)],
            "accent": hexc(accent),
            "line": hexc(mix(ink, bg, 0.55)),
        },
        "checks": {"ink_bg": round(ratio(ink, bg), 2), "soft_bg": round(ratio(soft, bg), 2)},
        "hero": {"src": logo_data_url(logo), "x": 0, "y": 0, "scale": 1, "from": logo.name},
    }
    print(f"  OK   {folder.name}: {archetype}, ground {theme['colors']['bg1']}, "
          f"ink {theme['checks']['ink_bg']}:1, soft {theme['checks']['soft_bg']}:1, "
          f"{len(theme['colors']['accents'])} accents")
    return theme

def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not src or not src.exists():
        print(__doc__); sys.exit(1)
    folders = [src] if "--single" in sys.argv else sorted(p for p in src.iterdir() if p.is_dir())
    themes = {}
    print(f"Processing {len(folders)} venue folder(s)…")
    for f in folders:
        t = process(f)
        if t: themes[t["id"]] = t
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text("// GENERATED by tools/venue_to_theme.py — do not hand-edit.\n"
                   "// Regenerate: python3 tools/venue_to_theme.py <glyph_art folder>\n"
                   "const VENUE_THEMES = " + json.dumps(themes, indent=1) + ";\n")
    print(f"\nWrote {OUT} ({len(themes)} themes, {OUT.stat().st_size//1024} KB)")

if __name__ == "__main__":
    main()

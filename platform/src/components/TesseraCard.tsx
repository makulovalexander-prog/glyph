"use client";
// TesseraCard — the single React component that replaces the static app's
// cardMarkup + paintCard. One template + one painter serves all three contexts:
//   - interactive editor card / focus view (holo + 3D)
//   - static gallery thumbnail (holo:false, no 3D — invariant 1)
//   - the tap experience card
// Theme is applied as CSS vars on THIS element only (never globally) so every
// card on a page can look different.

import { forwardRef, useImperativeHandle, useRef, useEffect, type CSSProperties } from "react";
import type { Design } from "@/types/tessera";
import { getTheme, RARITIES } from "@/lib/theme";
import { guillochePath, seedFrom, sealSVG, sealShimmerMaskUri } from "@/lib/seal";
import { useCardInteraction, type CardControls } from "./useCardInteraction";
import { useAutoFit } from "./useAutoFit";

export interface TesseraCardProps {
  design: Design;
  holo?: boolean;        // include GPU holo layers (default true)
  back?: boolean;        // render the back face (default true)
  interactive?: boolean; // attach 3D pointer interaction (default false)
  thumb?: boolean;       // static scaled thumbnail mode
  className?: string;
}

export interface TesseraCardHandle {
  flip: () => void;
  reset: () => void;
}

function cardVars(design: Design): CSSProperties {
  const t = getTheme(design.theme);
  const c = t.colors;
  return {
    ["--p-bg1" as any]: c.bg,
    ["--p-bg2" as any]: c.surface || c.bg,
    ["--p-ink" as any]: c.ink,
    ["--p-soft" as any]: c.soft,
    ["--p-line" as any]: c.line,
    ["--p-accent" as any]: c.accent || c.line,
    ["--p-accent2" as any]: c.accent2 || c.accent || c.line,
    ["--p-display" as any]: t.fonts.display,
    ["--p-body" as any]: t.fonts.body,
    ["--p-tag-style" as any]: t.fonts.tagStyle,
    ["--p-frame-w" as any]: (t.frame.frameless ? 0 : t.frame.weight || 1) + "px",
    ["--p-frame-r" as any]: (t.frame.radius ?? 11) + "px",
  };
}

export const TesseraCard = forwardRef<TesseraCardHandle, TesseraCardProps>(function TesseraCard(
  { design, holo = true, back = true, interactive = false, thumb = false, className },
  ref,
) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);

  const t = getTheme(design.theme);
  const hasLogo = !!design.logoUrl;
  const showHero = t.heroArt && !!design.heroArtUrl;
  const rsym = (RARITIES.find((r) => r.id === design.rarity) ?? RARITIES[0]).sym;
  const accent = t.colors.accent || t.colors.line;

  const controls = useCardInteraction(sceneRef, cardRef, interactive);
  useImperativeHandle(ref, () => ({ flip: () => controls.current.flip(), reset: () => controls.current.reset() }), [controls]);

  useAutoFit(cardRef, { venueName: design.venueName, eventLine: design.eventLine, hasLogo, display: t.fonts.display });

  // Procedural seal — Glyph's constant mark, drawn in the card's ink color.
  useEffect(() => {
    const host = sealRef.current;
    if (!host) return;
    const g = guillochePath(seedFrom(design.venueName || "GLYPH"));
    const withShimmer = holo && interactive;
    host.innerHTML = sealSVG(g, design.venueName, design.date, t.colors.ink) + (withShimmer ? '<div class="seal-shimmer"></div>' : "");
    if (withShimmer) {
      const sh = host.querySelector<HTMLDivElement>(".seal-shimmer");
      if (sh) { const uri = sealShimmerMaskUri(g); sh.style.webkitMaskImage = uri; sh.style.maskImage = uri; }
    }
  }, [design.venueName, design.date, t.colors.ink, holo, interactive]);

  const locLen = (design.location || "").length;

  const card = (
    <div
      ref={cardRef}
      className={`card${thumb ? " thumb-card" : ""}`}
      style={cardVars(design)}
      data-bg={t.background}
      data-rarity={design.rarity}
      {...(t.frame.frameless ? { "data-frameless": "" } : {})}
      {...(thumb || !interactive ? { "data-static": "" } : {})}
    >
      <div className="face front">
        <div className="f-tex" />
        <div className="f-matte" />
        {showHero && (
          <div className="f-hero-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="o-hero" src={design.heroArtUrl!} alt="" />
          </div>
        )}
        <div className="f-frame" />
        <div className="f-frame2" />
        <div className="f-top">
          <span className="f-presence">Tessera</span>
          <span className="f-edition o-edition">{design.edition}</span>
        </div>
        <div className="f-rule" />
        <div className="f-hero">
          {hasLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="f-logo o-logo" src={design.logoUrl!} alt="" />
          )}
          <div className="f-namewrap">
            <div className="f-name o-name">{(design.venueName || " ").toUpperCase()}</div>
            <div className="f-event o-event" data-raw={design.eventLine}>{(design.eventLine || "").toUpperCase()}</div>
          </div>
        </div>
        <div className="f-loc o-loc" style={{ letterSpacing: locLen > 24 ? "1.5px" : "4px" }}>
          {(design.location || "").toUpperCase()}
        </div>
        <div className="f-rule" />
        <div className="f-seal o-seal" ref={sealRef} />
        <div className="f-date o-date">{(design.date || "").toUpperCase()}</div>
        <div className="f-tag o-tag">{design.tagline}</div>
        <div className="f-rarity o-rsym" style={{ color: accent }}>{rsym}</div>
        {holo && (
          <>
            <div className="holo holo-rainbow" />
            <div className="holo holo-prism" />
            <div className="holo holo-gold" />
            <div className="holo holo-sparkle" />
            <div className="holo holo-glare" />
          </>
        )}
      </div>

      {back && (
        <div className="face back">
          <div className="b-guilloche" />
          <div className="b-frame" />
          <div className="b-emblem"><span>✦</span></div>
          <div className="b-word">GLYPH</div>
          <div className="b-sub">Verified Presence</div>
          <div className="b-foot">Collect the real world · Berlin</div>
          {holo && (
            <>
              <div className="holo holo-rainbow" />
              <div className="holo holo-sparkle" />
              <div className="holo holo-glare" />
            </>
          )}
        </div>
      )}
    </div>
  );

  if (thumb) return <div className={className}>{card}</div>;

  return (
    <div className={`scene${className ? " " + className : ""}`} ref={sceneRef}>
      {card}
    </div>
  );
});

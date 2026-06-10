"use client";
// Auto-fit venue name + event line. Ported from app.js `fitNameIn` / `fitEventIn`.
// Invariant 4: the event line is never larger than the venue name.

import { useLayoutEffect } from "react";

export function useAutoFit(
  cardRef: React.RefObject<HTMLElement | null>,
  deps: { venueName: string; eventLine: string; hasLogo: boolean; display: string },
) {
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    fitName(card, deps.hasLogo);
    fitEvent(card, deps.hasLogo);
    // Re-run after fonts load (metrics change once the display face is ready).
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        if (!cardRef.current) return;
        fitName(cardRef.current, deps.hasLogo);
        fitEvent(cardRef.current, deps.hasLogo);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.venueName, deps.eventLine, deps.hasLogo, deps.display]);
}

function fitName(card: HTMLElement, hasLogo: boolean) {
  const el = card.querySelector<HTMLElement>(".o-name");
  if (!el) return;
  if (hasLogo) { el.style.display = "none"; return; }
  el.style.display = "block";
  const maxW = 300 * 0.8;
  let size = 52;
  el.style.whiteSpace = "nowrap"; el.style.wordBreak = "normal"; el.style.lineHeight = "1";
  el.style.letterSpacing = (el.textContent!.length > 10 ? "2px" : "5px");
  el.style.fontSize = size + "px";
  let guard = 0;
  while (el.scrollWidth > maxW && size > 14 && guard < 100) { size -= 1; el.style.fontSize = size + "px"; guard++; }
  if (el.scrollWidth > maxW) {
    el.style.whiteSpace = "normal"; el.style.wordBreak = "break-word"; el.style.lineHeight = "1.04"; el.style.letterSpacing = "1px";
    let g2 = 0;
    while (g2 < 100 && size > 9) { const lines = Math.round(el.scrollHeight / (size * 1.06)); if (lines <= 2) break; size -= 1; el.style.fontSize = size + "px"; g2++; }
  }
}

function fitEvent(card: HTMLElement, hasLogo: boolean) {
  const el = card.querySelector<HTMLElement>(".o-event");
  if (!el) return;
  const raw = (el.dataset.raw || "").trim();
  if (!raw) { el.style.display = "none"; return; }
  el.style.display = "block";
  el.textContent = raw.toUpperCase();
  el.style.letterSpacing = raw.length > 34 ? "0.4px" : raw.length > 22 ? "1px" : "2px";
  const lh = 1.25;
  let size = 16;
  if (!hasLogo) {
    const ns = parseFloat(card.querySelector<HTMLElement>(".o-name")!.style.fontSize) || 52;
    size = Math.min(16, Math.max(8, Math.round(ns) - 2));
  }
  el.style.fontSize = size + "px";
  let guard = 0;
  while (guard < 100 && size > 8) { el.style.fontSize = size + "px"; const lines = Math.round(el.scrollHeight / (size * lh)); if (lines <= 2) break; size -= 1; guard++; }
}

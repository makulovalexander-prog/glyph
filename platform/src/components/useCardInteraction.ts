"use client";
// Pointer-driven 3D tilt + holo light. Ported from app.js `attachInteraction`.
// rAF-coalesced, rect cached, will-change toggled only while interacting.

import { useEffect, useRef } from "react";

export interface CardControls {
  flip: () => void;
  reset: () => void;
}

export function useCardInteraction(
  sceneRef: React.RefObject<HTMLElement | null>,
  cardRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): React.MutableRefObject<CardControls> {
  const controls = useRef<CardControls>({ flip: () => {}, reset: () => {} });

  useEffect(() => {
    const scene = sceneRef.current;
    const card = cardRef.current;
    if (!scene || !card || !enabled) return;

    let flipped = false;
    let dragging = false;
    let hovering = false;
    let rect: DOMRect | null = null;
    let lastX = 0;
    let lastY = 0;
    let rafId = 0;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const canHover = () => matchMedia("(hover:hover)").matches;
    const refreshRect = () => { rect = scene.getBoundingClientRect(); };
    const updateWillChange = () => { card.style.willChange = dragging || hovering ? "transform" : "auto"; };

    function apply() {
      rafId = 0;
      if (!rect) refreshRect();
      const r = rect!;
      const px = clamp01((lastX - r.left) / r.width);
      const py = clamp01((lastY - r.top) / r.height);
      card.style.setProperty("--ry", (px - 0.5) * 46 + (flipped ? 180 : 0) + "deg");
      card.style.setProperty("--rx", -(py - 0.5) * 46 + "deg");
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      card.style.setProperty("--glare", "0.55");
    }
    function queue(x: number, y: number) { lastX = x; lastY = y; if (!rafId) rafId = requestAnimationFrame(apply); }
    function reset() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      card.style.setProperty("--rx", "8deg");
      card.style.setProperty("--ry", (flipped ? 194 : -14) + "deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
      card.style.setProperty("--glare", "0.22");
    }

    const onDown = (e: PointerEvent) => { dragging = true; refreshRect(); updateWillChange(); scene.setPointerCapture(e.pointerId); queue(e.clientX, e.clientY); };
    const onMove = (e: PointerEvent) => { if (dragging || hovering) queue(e.clientX, e.clientY); };
    const onUp = () => { if (!dragging) return; dragging = false; updateWillChange(); reset(); };
    const onCancel = () => { dragging = false; updateWillChange(); reset(); };
    const onEnter = () => { if (!dragging && canHover()) { hovering = true; refreshRect(); updateWillChange(); } };
    const onLeave = () => { hovering = false; updateWillChange(); if (!dragging) reset(); };
    const onViewport = () => { if (dragging || hovering) refreshRect(); };

    scene.addEventListener("pointerdown", onDown);
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerup", onUp);
    scene.addEventListener("pointercancel", onCancel);
    scene.addEventListener("pointerenter", onEnter);
    scene.addEventListener("pointerleave", onLeave);
    addEventListener("resize", onViewport);
    addEventListener("scroll", onViewport, { passive: true });

    reset();
    updateWillChange();
    controls.current = { flip() { flipped = !flipped; reset(); }, reset };

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scene.removeEventListener("pointerdown", onDown);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerup", onUp);
      scene.removeEventListener("pointercancel", onCancel);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointerleave", onLeave);
      removeEventListener("resize", onViewport);
      removeEventListener("scroll", onViewport);
    };
  }, [sceneRef, cardRef, enabled]);

  return controls;
}

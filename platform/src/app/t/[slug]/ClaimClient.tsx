"use client";

import { useRef, useState } from "react";
import { TesseraCard, type TesseraCardHandle } from "@/components/TesseraCard";
import type { Design } from "@/types/tessera";

const REASONS: Record<string, string> = {
  NOT_FOUND: "This tag isn't active.",
  NOT_LIVE: "This edition isn't live right now.",
  NOT_STARTED: "This edition hasn't started yet.",
  ENDED: "This edition has ended.",
  SOLD_OUT: "Every copy has been claimed.",
  OUT_OF_RANGE: "You need to be at the venue to collect this.",
  VENUE_UNVERIFIED: "This venue isn't verified yet.",
};

interface Props {
  slug: string;
  design: Design;
  live: boolean;
  requireGeo: boolean;
  remaining: number | null;
  maxSupply: number | null;
  signedIn: boolean;
  alreadyOwned: { claimToken: string; serial: number } | null;
}

export function ClaimClient(props: Props) {
  const cardRef = useRef<TesseraCardHandle>(null);
  const [state, setState] = useState<"idle" | "claiming" | "done" | "error">(
    props.alreadyOwned ? "done" : "idle",
  );
  const [serial, setSerial] = useState<number | null>(props.alreadyOwned?.serial ?? null);
  const [error, setError] = useState<string | null>(null);

  async function getCoords(): Promise<{ lat?: number; lng?: number }> {
    if (!props.requireGeo || !navigator.geolocation) return {};
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }

  async function claim() {
    if (!props.signedIn) {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(`/t/${props.slug}`)}`;
      return;
    }
    setState("claiming");
    setError(null);
    try {
      const coords = await getCoords();
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tapSlug: props.slug, ...coords }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(REASONS[data.error] ?? "Something went wrong.");
        setState("error");
        return;
      }
      setSerial(data.serial);
      setState("done");
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  const supplyLabel =
    props.maxSupply == null ? "Open edition" : `${props.remaining ?? 0} of ${props.maxSupply} left`;

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="stage-wrap" style={{ height: 460, display: "flex", alignItems: "center" }}>
        <TesseraCard ref={cardRef} design={props.design} interactive holo back />
      </div>

      <button
        onClick={() => cardRef.current?.flip()}
        className="mt-1 text-xs uppercase tracking-wider text-soft hover:text-ink"
      >
        Flip card
      </button>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-soft">{supplyLabel}</p>

      {state === "done" && serial != null && (
        <div className="mt-5 w-full rounded-2xl border border-accent/40 bg-accent/5 p-5 text-center">
          <div className="font-display text-2xl text-accent">Collected ✦</div>
          <p className="mt-1 text-sm text-ink">
            You own <span className="font-semibold">No. {serial}</span>
            {props.maxSupply != null && <> of {props.maxSupply}</>}.
          </p>
          <a href="/collection" className="mt-3 inline-block text-xs uppercase tracking-wider text-accent underline">
            View in your collection →
          </a>
        </div>
      )}

      {state !== "done" && (
        <button
          disabled={!props.live || state === "claiming"}
          onClick={claim}
          className="mt-5 w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold uppercase tracking-wider text-[#15130E] disabled:opacity-40"
        >
          {!props.live
            ? "Not available"
            : state === "claiming"
              ? "Collecting…"
              : props.signedIn
                ? "Collect this Tessera"
                : "Sign in to collect"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-[#e0857d]">{error}</p>}
    </div>
  );
}

// Tiny helpers shared by route handlers: JSON responses + a guard that turns
// thrown errors (auth, zod) into clean HTTP status codes.

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ZodError) return fail("Invalid input: " + e.issues.map((i) => i.path.join(".")).join(", "), 422);
    if (e instanceof Error && e.message === "UNAUTHENTICATED") return fail("Sign in required", 401);
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Not allowed", 403);
    console.error(e);
    return fail("Internal error", 500);
  }
}

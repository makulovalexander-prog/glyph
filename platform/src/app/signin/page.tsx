"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/collection";
  const [email, setEmail] = useState("");
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Dev uses the credentials shim; prod uses the email magic link.
        signIn(isDev ? "credentials" : "nodemailer", { email, callbackUrl });
      }}
      className="mx-auto mt-32 flex max-w-sm flex-col gap-4 px-6"
    >
      <h1 className="font-display text-3xl text-ink">Sign in</h1>
      <p className="text-sm text-soft">
        {isDev ? "Dev mode: enter any email to sign in instantly." : "We'll email you a magic link."}
      </p>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-line bg-panel px-3 py-3 text-sm text-ink outline-none focus:border-accent"
      />
      <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#15130E]">
        Continue
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

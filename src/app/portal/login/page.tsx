"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-sm border border-white/10 bg-[#141414] p-8"
    >
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#e6c47a]">
        Ryan Tang
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        Client portal
      </h1>
      <p className="mt-2 text-sm text-white/50">Sign in with the email from your invite.</p>

      <label className="mt-6 block text-xs uppercase tracking-wider text-white/40">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#e6c47a]"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#e6c47a]"
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-[#e6c47a] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div className="text-white/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

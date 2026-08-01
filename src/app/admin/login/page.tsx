"use client";

import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
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
    // Full navigation so the session cookie is included on the next request
    // (client soft-nav can race middleware and look like a failed login).
    window.location.assign(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 text-[#f2efe8]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-white/10 bg-[#141414] p-8"
      >
        <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#e6c47a]">
          Ryan Tang
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">Admin login</h1>
        <p className="mt-2 text-sm text-white/50">Sign in to manage the site.</p>

        <label className="mt-6 block text-xs uppercase tracking-wider text-white/40">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#e6c47a]"
          />
        </label>

        <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#e6c47a]"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-[#e6c47a] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#f0d49a] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/50">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

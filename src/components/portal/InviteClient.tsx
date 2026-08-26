"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  setPasswordFromInviteAction,
  signInFromInviteAction,
} from "@/app/portal/actions/auth";

export default function InviteClient({
  token,
  email,
  valid,
  hasPassword,
  errorMessage,
}: {
  token: string;
  email: string | null;
  valid: boolean;
  hasPassword?: boolean;
  errorMessage?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(errorMessage || "");
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(hasPassword === true);

  useEffect(() => {
    if (!valid || !hasPassword) return;

    let cancelled = false;
    (async () => {
      setSigningIn(true);
      setError("");
      try {
        const result = await signInFromInviteAction(token);
        const signInResult = await signIn("credentials", {
          email: result.email,
          magicToken: token,
          redirect: false,
        });
        if (cancelled) return;
        if (signInResult?.error) {
          setError("Could not sign in automatically. Try logging in with your password.");
          setSigningIn(false);
          return;
        }
        router.push(result.redirectTo);
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setSigningIn(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [valid, hasPassword, token, router]);

  if (!valid) {
    return (
      <div className="mx-auto max-w-sm border border-white/10 bg-[#141414] p-8">
        <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold">
          Link unavailable
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {error || "This link is invalid or has expired. Ask for a new one or reset your password."}
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <Link href="/portal/login" className="text-[#fdf0d5]">
            Go to login
          </Link>
          <Link href="/portal/forgot-password" className="text-white/50 hover:text-white/70">
            Forgot password
          </Link>
        </div>
      </div>
    );
  }

  if (signingIn) {
    return (
      <div className="mx-auto max-w-sm border border-white/10 bg-[#141414] p-8 text-center">
        <p className="font-[family-name:var(--font-syne)] text-lg font-bold">Signing you in…</p>
        <p className="mt-2 text-sm text-white/50">Taking you to your project.</p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await setPasswordFromInviteAction(token, password);
      const signInResult = await signIn("credentials", {
        email: result.email,
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        setError("Password set, but sign-in failed. Try logging in.");
        setLoading(false);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-sm border border-white/10 bg-[#141414] p-8"
    >
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
        Ryan Tang
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        Set your password
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Choose a password to access your portal. Your username is your email.
      </p>

      <label className="mt-6 block text-xs uppercase tracking-wider text-white/40">
        Email
        <input
          type="email"
          value={email || ""}
          disabled
          className="mt-1 w-full border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/70"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
        Password
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#fdf0d5]"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
        Confirm password
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#fdf0d5]"
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-[#fdf0d5] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/app/portal/actions/auth";

export default function ResetPasswordForm({
  token,
  valid,
  errorMessage,
}: {
  token: string;
  valid: boolean;
  errorMessage?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(errorMessage || "");
  const [loading, setLoading] = useState(false);

  if (!valid) {
    return (
      <div className="mx-auto max-w-sm border border-white/10 bg-[#141414] p-8">
        <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold">Link unavailable</h1>
        <p className="mt-2 text-sm text-white/50">
          {error || "This reset link is invalid or has expired."}
        </p>
        <Link href="/portal/forgot-password" className="mt-4 inline-block text-sm text-[#fdf0d5]">
          Request a new link
        </Link>
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
      const result = await resetPasswordAction(token, password);
      const signInResult = await signIn("credentials", {
        email: result.email,
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        setError("Password updated, but sign-in failed. Try logging in.");
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
        Reset password
      </h1>
      <p className="mt-2 text-sm text-white/50">Choose a new password for your portal account.</p>

      <label className="mt-6 block text-xs uppercase tracking-wider text-white/40">
        New password
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
        {loading ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}

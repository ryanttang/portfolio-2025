"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/portal/actions/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      await requestPasswordResetAction(email);
      setStatus("If an account exists for that email, we sent a reset link.");
    } catch {
      setStatus("Something went wrong. Please try again.");
    }
    setLoading(false);
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
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Enter your email and we&apos;ll send a link to reset your password.
      </p>

      <label className="mt-6 block text-xs uppercase tracking-wider text-white/40">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#fdf0d5]"
        />
      </label>
      {status && <p className="mt-3 text-sm text-white/60">{status}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-[#fdf0d5] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/portal/login" className="mt-4 inline-block text-sm text-white/50 hover:text-white/70">
        Back to login
      </Link>
    </form>
  );
}

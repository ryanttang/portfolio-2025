"use client";

import { FormEvent, useState } from "react";
import DashboardCard from "@/components/portal/DashboardCard";
import { changePasswordAction } from "@/app/portal/actions/onboarding";

export default function AccountPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changePasswordAction(currentPassword, newPassword);
      setMessage("Password updated.");
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-white/10 bg-[#121212] p-6">
        <p className="font-[family-name:var(--font-syne)] text-[10px] uppercase tracking-[0.25em] text-[#fdf0d5]">
          Settings
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">Account</h1>
        <p className="mt-2 text-sm text-white/50">Manage your portal sign-in.</p>
      </div>

      <DashboardCard title="Password" description="Update your portal password">
        <form onSubmit={onSubmit} className="max-w-md space-y-3">
          <label className="block text-xs uppercase tracking-wider text-white/40">
            Current password
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs uppercase tracking-wider text-white/40">
            New password
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs uppercase tracking-wider text-white/40">
            Confirm new password
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
      </DashboardCard>
    </div>
  );
}

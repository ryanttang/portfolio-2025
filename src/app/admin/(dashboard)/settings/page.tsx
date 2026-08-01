import { getSetting } from "@/lib/content";
import { isPayPalConfigured, isResendConfigured, isSigningConfigured } from "@/lib/env";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const [brand, invoice, email, features] = await Promise.all([
    getSetting("brand"),
    getSetting("invoice"),
    getSetting("email"),
    getSetting("features"),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-white/50">Brand, invoice letterhead, email, and integrations.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatusCard label="Resend" ok={isResendConfigured()} />
        <StatusCard label="PayPal" ok={isPayPalConfigured()} />
        <StatusCard label="Contract signing cert" ok={isSigningConfigured()} />
      </div>

      <SettingsForm
        brand={brand}
        invoice={invoice}
        email={email}
        features={features}
      />
    </div>
  );
}

function StatusCard({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="border border-white/10 bg-[#141414] p-4">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${ok ? "text-emerald-400" : "text-amber-400"}`}>
        {ok ? "Configured" : "Missing env"}
      </p>
    </div>
  );
}

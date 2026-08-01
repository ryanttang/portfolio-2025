import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { unreadCount } from "@/lib/email/threads";
import AdminShell from "@/components/admin/AdminShell";
import AdminProviders from "@/components/admin/AdminProviders";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  let unread = 0;
  try {
    unread = await unreadCount();
  } catch {
    unread = 0;
  }

  return (
    <AdminProviders>
      <AdminShell unreadCount={unread}>{children}</AdminShell>
    </AdminProviders>
  );
}

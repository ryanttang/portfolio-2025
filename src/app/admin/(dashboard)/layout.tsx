import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { emailMessages } from "@/db/schema";
import AdminShell from "@/components/admin/AdminShell";
import AdminProviders from "@/components/admin/AdminProviders";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  let unreadCount = 0;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailMessages)
      .where(and(eq(emailMessages.direction, "inbound"), isNull(emailMessages.readAt)));
    unreadCount = row?.count ?? 0;
  } catch {
    unreadCount = 0;
  }

  return (
    <AdminProviders>
      <AdminShell unreadCount={unreadCount}>{children}</AdminShell>
    </AdminProviders>
  );
}

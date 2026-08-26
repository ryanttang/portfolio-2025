import { auth } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";
import PortalProviders from "@/components/portal/PortalProviders";
import { getViewAsPayload } from "@/lib/portal/view-as";
import { getClient } from "@/lib/crm/clients";
import { listNotificationsForClient, countUnreadNotifications } from "@/lib/portal/notifications";
import { listOnboardingsForClient } from "@/lib/onboarding";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const viewAs = session?.user?.role === "admin" ? await getViewAsPayload() : null;

  let showNav = false;
  let email: string | null = session?.user?.email || null;
  let impersonating = false;
  let impersonatedClientId: string | null = null;
  let notifications: Awaited<ReturnType<typeof listNotificationsForClient>> = [];
  let unreadCount = 0;
  let projectSlugs: Record<string, string> = {};

  if (session?.user?.role === "client" && session.user.clientId) {
    showNav = true;
    const clientId = session.user.clientId;
    const [notifs, count, projects] = await Promise.all([
      listNotificationsForClient(clientId),
      countUnreadNotifications(clientId),
      listOnboardingsForClient(clientId),
    ]);
    notifications = notifs;
    unreadCount = count;
    projectSlugs = Object.fromEntries(projects.map((p) => [p.id, p.slug]));
  } else if (viewAs) {
    showNav = true;
    impersonating = true;
    impersonatedClientId = viewAs.clientId;
    const client = await getClient(viewAs.clientId);
    email = client?.email || email;
    const [notifs, count, projects] = await Promise.all([
      listNotificationsForClient(viewAs.clientId),
      countUnreadNotifications(viewAs.clientId),
      listOnboardingsForClient(viewAs.clientId),
    ]);
    notifications = notifs;
    unreadCount = count;
    projectSlugs = Object.fromEntries(projects.map((p) => [p.id, p.slug]));
  }

  return (
    <PortalProviders>
      <PortalShell
        showNav={showNav}
        email={email}
        impersonating={impersonating}
        impersonatedClientId={impersonatedClientId}
        notifications={notifications}
        unreadCount={unreadCount}
        projectSlugs={projectSlugs}
      >
        {children}
      </PortalShell>
    </PortalProviders>
  );
}

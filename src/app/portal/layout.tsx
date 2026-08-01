import { auth } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";
import PortalProviders from "@/components/portal/PortalProviders";
import { getViewAsPayload } from "@/lib/portal/view-as";
import { getClient } from "@/lib/crm/clients";

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

  if (session?.user?.role === "client") {
    showNav = true;
  } else if (viewAs) {
    showNav = true;
    impersonating = true;
    impersonatedClientId = viewAs.clientId;
    const client = await getClient(viewAs.clientId);
    email = client?.email || email;
  }

  return (
    <PortalProviders>
      <PortalShell
        showNav={showNav}
        email={email}
        impersonating={impersonating}
        impersonatedClientId={impersonatedClientId}
      >
        {children}
      </PortalShell>
    </PortalProviders>
  );
}

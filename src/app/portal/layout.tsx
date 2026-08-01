import { auth } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";
import PortalProviders from "@/components/portal/PortalProviders";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isClient = session?.user?.role === "client";

  return (
    <PortalProviders>
      <PortalShell showNav={isClient} email={session?.user?.email || null}>
        {children}
      </PortalShell>
    </PortalProviders>
  );
}

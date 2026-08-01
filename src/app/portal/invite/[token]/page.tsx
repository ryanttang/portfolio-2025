import { getClient } from "@/lib/crm/clients";
import { getInviteByToken, isInviteValid } from "@/lib/portal/auth";
import InviteClient from "@/components/portal/InviteClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return <InviteClient token={token} email={null} valid={false} errorMessage="Invite not found." />;
  }

  if (!isInviteValid(invite)) {
    return (
      <InviteClient
        token={token}
        email={null}
        valid={false}
        errorMessage="This invite has already been used or expired."
      />
    );
  }

  const client = await getClient(invite.clientId);

  return (
    <InviteClient
      token={token}
      email={client?.email || null}
      valid={Boolean(client)}
      errorMessage={client ? undefined : "Client not found."}
    />
  );
}

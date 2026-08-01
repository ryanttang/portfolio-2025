import {
  listThreads,
  getThreadMessages,
  getAttachmentsForMessages,
  unreadCountsByThread,
  markThreadRead,
  unreadCount,
} from "@/lib/email/threads";
import { listEmailTemplates } from "@/lib/email/templates";
import { getClient } from "@/lib/crm/clients";
import InboxClient from "@/components/admin/inbox/InboxClient";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string; to?: string; thread?: string }>;
}) {
  const sp = await searchParams;
  if (sp.thread) {
    await markThreadRead(sp.thread);
  }

  const [threads, templates, totalUnread] = await Promise.all([
    listThreads(80),
    listEmailTemplates(),
    unreadCount().catch(() => 0),
  ]);
  const unreadByThread = await unreadCountsByThread(threads.map((t) => t.id));

  let messages: Awaited<ReturnType<typeof getThreadMessages>> = [];
  let attachments: Awaited<ReturnType<typeof getAttachmentsForMessages>> = [];
  if (sp.thread) {
    messages = await getThreadMessages(sp.thread);
    attachments = await getAttachmentsForMessages(messages.map((m) => m.id));
  }

  const clientIds = Array.from(
    new Set(threads.map((t) => t.clientId).filter(Boolean) as string[]),
  );
  const clientNameById: Record<string, string> = {};
  await Promise.all(
    clientIds.map(async (id) => {
      const c = await getClient(id);
      if (c) clientNameById[id] = c.name;
    }),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Inbox</h1>
          <p className="mt-1 text-sm text-white/50">
            Compose with templates, preview branded HTML, and reply via Resend.
          </p>
        </div>
        {totalUnread > 0 && (
          <p className="rounded-full bg-[#fdf0d5] px-3 py-1 text-xs font-semibold text-black">
            {totalUnread} unread
          </p>
        )}
      </div>
      <InboxClient
        threads={threads.map((t) => ({
          ...t,
          lastMessageAt: t.lastMessageAt.toISOString(),
          createdAt: t.createdAt.toISOString(),
          unreadCount: unreadByThread[t.id] ?? 0,
        }))}
        initialThreadId={sp.thread || null}
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() || null,
        }))}
        attachments={attachments}
        templates={templates}
        composeOpen={sp.compose === "1"}
        defaultTo={sp.to || ""}
        clientNameById={clientNameById}
      />
    </div>
  );
}

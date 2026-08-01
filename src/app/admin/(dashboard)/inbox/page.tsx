import { listThreads, getThreadMessages } from "@/lib/email/threads";
import InboxClient from "@/components/admin/inbox/InboxClient";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string; to?: string; thread?: string }>;
}) {
  const sp = await searchParams;
  const threads = await listThreads(80);
  let messages: Awaited<ReturnType<typeof getThreadMessages>> = [];
  if (sp.thread) {
    messages = await getThreadMessages(sp.thread);
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Inbox</h1>
      <p className="mt-1 text-sm text-white/50">Send and receive via Resend.</p>
      <InboxClient
        threads={threads.map((t) => ({
          ...t,
          lastMessageAt: t.lastMessageAt.toISOString(),
          createdAt: t.createdAt.toISOString(),
        }))}
        initialThreadId={sp.thread || null}
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() || null,
        }))}
        composeOpen={sp.compose === "1"}
        defaultTo={sp.to || ""}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createMeetingAction,
  createTaskAction,
  deleteFileAction,
  deleteMeetingAction,
  deleteTaskAction,
  postAdminMessageAction,
  uploadPortalFileAction,
  updateHubWelcomeMessageAction,
  updateMessagesEnabledAction,
} from "@/app/admin/actions/portal-hub";
import { resetHubWelcomeAction } from "@/app/portal/actions/auth";

export default function PortalHubEditor({
  clientId,
  onboardingId,
  hubWelcomeMessage,
  messagesEnabled,
  tasks,
  meetings,
  files,
  messages,
}: {
  clientId: string;
  onboardingId: string;
  hubWelcomeMessage: string | null;
  messagesEnabled: boolean;
  tasks: {
    id: string;
    type: string;
    status: string;
    title: string;
    description: string | null;
    dueAt: Date | null;
  }[];
  meetings: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
  }[];
  files: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
  }[];
  messages: {
    id: string;
    senderType: string;
    subject: string | null;
    body: string;
    createdAt: Date;
  }[];
}) {
  const router = useRouter();
  const [welcomeMsg, setWelcomeMsg] = useState(hubWelcomeMessage || "");
  const [messagesOn, setMessagesOn] = useState(messagesEnabled);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("general");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskLinkUrl, setTaskLinkUrl] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [fileTitle, setFileTitle] = useState("");

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <section className="border border-white/10 bg-[#141414] p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold">Dashboard welcome message</h3>
        <textarea
          value={welcomeMsg}
          onChange={(e) => setWelcomeMsg(e.target.value)}
          rows={3}
          placeholder="Shown once when the client first opens the completed project hub…"
          className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            await updateHubWelcomeMessageAction(onboardingId, welcomeMsg);
            router.refresh();
          }}
          className="mt-2 bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
        >
          Save welcome message
        </button>
        <button
          type="button"
          onClick={async () => {
            await resetHubWelcomeAction(onboardingId);
            router.refresh();
          }}
          className="ml-2 mt-2 border border-white/20 px-3 py-1.5 text-xs text-white/70"
        >
          Reset welcome modal
        </button>
      </section>

      <section className="border border-white/10 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold">Action items</h3>
        <div className="mt-3 space-y-2">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task title"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="general">General</option>
            <option value="approval">Approval</option>
            <option value="review">Review</option>
            <option value="upload">Upload</option>
          </select>
          <input
            type="datetime-local"
            value={taskDueAt}
            onChange={(e) => setTaskDueAt(e.target.value)}
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            value={taskLinkUrl}
            onChange={(e) => setTaskLinkUrl(e.target.value)}
            placeholder="Optional link URL (review tasks)"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!taskTitle.trim()) return;
              await createTaskAction(clientId, onboardingId, {
                type: taskType,
                title: taskTitle.trim(),
                dueAt: taskDueAt || undefined,
                linkUrl: taskLinkUrl || undefined,
              });
              setTaskTitle("");
              setTaskDueAt("");
              setTaskLinkUrl("");
              router.refresh();
            }}
            className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Add task
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-2 border-t border-white/10 pt-2">
              <span>
                {t.title}{" "}
                <span className="text-white/40">({t.type} · {t.status})</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await deleteTaskAction(t.id, clientId, onboardingId);
                  router.refresh();
                }}
                className="text-xs text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-white/10 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold">Meetings</h3>
        <div className="mt-3 space-y-2">
          <input
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="Meeting title"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={meetingStart}
            onChange={(e) => setMeetingStart(e.target.value)}
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={meetingEnd}
            onChange={(e) => setMeetingEnd(e.target.value)}
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
            placeholder="Location or Zoom link"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!meetingTitle.trim() || !meetingStart || !meetingEnd) return;
              await createMeetingAction(clientId, onboardingId, {
                title: meetingTitle.trim(),
                startsAt: meetingStart,
                endsAt: meetingEnd,
                location: meetingLocation || undefined,
              });
              setMeetingTitle("");
              setMeetingStart("");
              setMeetingEnd("");
              setMeetingLocation("");
              router.refresh();
            }}
            className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Schedule meeting
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {meetings.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-2 border-t border-white/10 pt-2">
              <span>
                {m.title}{" "}
                <span className="text-white/40">{m.startsAt.toLocaleString()}</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await deleteMeetingAction(m.id, clientId, onboardingId);
                  router.refresh();
                }}
                className="text-xs text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-white/10 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold">Deliverables</h3>
        <form
          className="mt-3 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (fileTitle.trim()) fd.set("title", fileTitle.trim());
            await uploadPortalFileAction(clientId, onboardingId, fd);
            setFileTitle("");
            e.currentTarget.reset();
            router.refresh();
          }}
        >
          <input
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            placeholder="File title"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            name="file"
            type="file"
            required
            className="w-full text-sm text-white/70"
          />
          <button
            type="submit"
            className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Upload file
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {files.map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-2 border-t border-white/10 pt-2">
              <span>{f.title}</span>
              <button
                type="button"
                onClick={async () => {
                  await deleteFileAction(f.id, clientId, onboardingId);
                  router.refresh();
                }}
                className="text-xs text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-white/10 bg-[#141414] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Messages</h3>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={messagesOn}
              onChange={async (e) => {
                const enabled = e.target.checked;
                setMessagesOn(enabled);
                await updateMessagesEnabledAction(onboardingId, enabled);
                router.refresh();
              }}
            />
            Show in client portal
          </label>
        </div>
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
          {messages.map((m) => (
            <li key={m.id} className="border-t border-white/10 pt-2">
              <span className="text-white/40">{m.senderType} · </span>
              {m.body.slice(0, 120)}
            </li>
          ))}
          {messages.length === 0 && <li className="text-white/40">No messages yet.</li>}
        </ul>
        <textarea
          value={msgBody}
          onChange={(e) => setMsgBody(e.target.value)}
          rows={3}
          placeholder="Reply to client…"
          className="mt-3 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            if (!msgBody.trim()) return;
            await postAdminMessageAction(clientId, onboardingId, { body: msgBody.trim() });
            setMsgBody("");
            router.refresh();
          }}
          className="mt-2 bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
        >
          Send message
        </button>
      </section>
    </div>
  );
}

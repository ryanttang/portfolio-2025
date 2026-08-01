"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveTemplateItemsAction, updateTemplateAction } from "@/app/admin/actions/onboarding";
import { QUESTION_TYPES, type QuestionInput, type QuestionType } from "@/lib/onboarding/types";

export default function TemplateEditor({
  template,
  items,
}: {
  template: { id: string; name: string; description: string | null };
  items: {
    id: string;
    label: string;
    helpText: string | null;
    type: string;
    options: string[];
    required: boolean;
  }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [questions, setQuestions] = useState<QuestionInput[]>(
    items.map((i) => ({
      label: i.label,
      helpText: i.helpText,
      type: i.type as QuestionType,
      options: i.options || [],
      required: i.required,
    })),
  );
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<QuestionType>("short_text");
  const [message, setMessage] = useState("");

  async function save() {
    await updateTemplateAction(template.id, {
      name,
      description: description || null,
    });
    await saveTemplateItemsAction(template.id, questions);
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4 border border-white/10 bg-[#141414] p-4">
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
      </label>

      <ul className="space-y-2">
        {questions.map((q, idx) => (
          <li key={idx} className="flex gap-2 border border-white/10 p-3">
            <input
              value={q.label}
              onChange={(e) => {
                const next = [...questions];
                next[idx] = { ...q, label: e.target.value };
                setQuestions(next);
              }}
              className="flex-1 border border-white/15 bg-black/40 px-2 py-1 text-sm"
            />
            <span className="self-center text-[10px] uppercase text-white/30">{q.type}</span>
            <button
              type="button"
              onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
              className="text-xs text-red-300"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Question label"
          className="flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as QuestionType)}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (!newLabel.trim()) return;
            setQuestions([
              ...questions,
              { label: newLabel.trim(), type: newType, required: true, options: [] },
            ]);
            setNewLabel("");
          }}
          className="bg-white/10 px-3 py-2 text-sm"
        >
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
      >
        Save template
      </button>
      {message && <p className="text-sm text-white/50">{message}</p>}
    </div>
  );
}

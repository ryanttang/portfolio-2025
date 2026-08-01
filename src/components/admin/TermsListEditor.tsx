"use client";

const inputClass =
  "w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#fdf0d5]";

export default function TermsListEditor({
  label,
  values,
  onChange,
  placeholder = "Term line",
  hint,
  addLabel = "Add term",
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
}) {
  return (
    <div>
      {label ? (
        <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      ) : null}
      {hint && <p className={`text-[10px] text-white/30 ${label ? "mt-1" : ""}`}>{hint}</p>}
      <div className={`${label || hint ? "mt-2" : ""} space-y-2`}>
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="shrink-0 px-2 py-2 text-xs text-white/35 hover:text-red-400"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-2 text-xs text-[#fdf0d5] hover:underline"
      >
        + {addLabel}
      </button>
    </div>
  );
}

export default function FileList({
  files,
}: {
  files: {
    id: string;
    title: string;
    description: string | null;
    blobUrl: string;
    mimeType: string | null;
    createdAt: Date;
  }[];
}) {
  if (files.length === 0) {
    return <p className="text-sm text-white/40">Deliverables will appear here when shared.</p>;
  }

  return (
    <ul className="space-y-3">
      {files.map((f) => (
        <li key={f.id} className="rounded-sm border border-white/5 bg-white/[0.02] p-4">
          <a
            href={f.blobUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#fdf0d5] hover:underline"
          >
            {f.title}
          </a>
          {f.description && <p className="mt-1 text-sm text-white/55">{f.description}</p>}
          <p className="mt-2 text-[10px] text-white/30">{f.createdAt.toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  );
}

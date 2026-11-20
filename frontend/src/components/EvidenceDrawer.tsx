import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import type { EvidenceItem, SourceType } from "../types";

const SOURCE_LABEL: Record<SourceType, string> = {
  competitor_page: "Competitor page",
  hacker_news: "Hacker News",
  reddit: "Reddit",
  demo_cache: "Cached summary",
};

export function EvidencePill({ id, onOpen, tone = "dark" }: { id: string; onOpen: (id: string) => void; tone?: "dark" | "light" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(id);
      }}
      className={`code rounded px-1.5 py-0.5 font-semibold transition-colors ${
        tone === "dark" ? "bg-enamel text-enamel-ink hover:bg-aspect-amber" : "bg-enamel-ink text-enamel hover:bg-aspect-red"
      }`}
      aria-label={`Open source ${id}`}
    >
      {id}
    </button>
  );
}

interface Props {
  open: boolean;
  focusId: string | null;
  evidence: EvidenceItem[];
  onClose: () => void;
}

export default function EvidenceDrawer({ open, focusId, evidence, onClose }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && focusId) {
      listRef.current?.querySelector(`[data-ev="${focusId}"]`)?.scrollIntoView({ block: "start" });
    }
  }, [open, focusId]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="ev-title">
      <div className="absolute inset-0 bg-box-950/75" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[34rem] animate-slidein flex-col bg-enamel text-enamel-ink shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-enamel-ink px-6 py-4">
          <div>
            <h2 id="ev-title" className="sign text-3xl">Evidence register</h2>
            <p className="text-[13px] text-enamel-soft">
              {evidence.length} public sources kept by BM25. Live sources are quoted as found; cached ones are labelled.
            </p>
          </div>
          <button ref={closeRef} onClick={onClose} className="rounded-md p-2 hover:bg-enamel-deep" aria-label="Close evidence register">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {evidence.map((e) => {
            const focused = e.id === focusId;
            const cached = e.source_type === "demo_cache";
            return (
              <article
                key={e.id}
                data-ev={e.id}
                className={`scroll-mt-0 border-b border-enamel-ink/15 px-6 py-5 ${focused ? "bg-aspect-amber/25" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`code rounded px-1.5 py-0.5 font-semibold ${focused ? "bg-enamel-ink text-enamel" : "bg-enamel-deep"}`}>{e.id}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-enamel-soft">{SOURCE_LABEL[e.source_type]}</span>
                </div>
                <h3 className="mt-2.5 text-[15px] font-semibold leading-snug">{e.title}</h3>
                <blockquote className="mt-2 text-[14px] leading-relaxed text-enamel-soft">{cached ? e.snippet : `“${e.snippet}”`}</blockquote>
                {cached && <p className="mt-2 text-[12px] italic text-enamel-soft">Paraphrased summary of a public page or search. Open the link to check it.</p>}
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="code mt-3 flex max-w-full items-center gap-1.5 text-enamel-ink underline decoration-enamel-ink/30 hover:decoration-enamel-ink"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{e.url}</span>
                </a>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

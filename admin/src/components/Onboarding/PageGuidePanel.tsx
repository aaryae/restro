import { Check, Lightbulb, Play, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PageGuide } from "@/onboarding/pageGuides";
import VideoEmbed from "./VideoEmbed";

interface PageGuidePanelProps {
  guide: PageGuide | null;
  onClose: () => void;
  onReplayTour: () => void;
}

export default function PageGuidePanel({
  guide,
  onClose,
  onReplayTour,
}: PageGuidePanelProps) {
  return createPortal(
    <div className="fixed inset-0 z-[150]">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-guide-title"
        className="serve-sheet absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in-right flex-col shadow-2xl motion-reduce:animate-none"
      >
        <div
          aria-hidden
          className="h-1 w-full shrink-0 bg-gradient-to-r from-tourAccent via-tourAccent/45 to-transparent"
        />

        <header className="flex items-start justify-between gap-3 border-b border-[var(--serve-border)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--serve-accent)]">
              Page guide
            </p>
            <h2
              id="page-guide-title"
              className="mt-0.5 truncate text-lg font-semibold text-[var(--serve-fg)]"
            >
              {guide?.title || "Serve"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="shrink-0 rounded-lg p-1.5 text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-fg)]"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {guide ? (
            <>
              <p className="text-sm leading-relaxed text-[var(--serve-muted)]">
                {guide.summary}
              </p>

              {guide.videoUrl ? (
                <VideoEmbed url={guide.videoUrl} title={`${guide.title} walkthrough`} />
              ) : null}

              <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--serve-fg)]">
                  What you can do here
                </h3>
                <ul className="mt-2 space-y-2">
                  {guide.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--serve-muted)]"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-[var(--serve-positive)]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {guide.tips?.length ? (
                <section className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-4 py-3">
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--serve-fg)]">
                    <Lightbulb size={14} className="text-[var(--serve-warning)]" />
                    Good to know
                  </h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {guide.tips.map((tip) => (
                      <li
                        key={tip}
                        className="text-[13px] leading-relaxed text-[var(--serve-muted)]"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--serve-muted)]">
              There is no guide for this page yet. Take the product tour for an
              overview of how Serve fits together.
            </p>
          )}
        </div>

        <footer className="border-t border-[var(--serve-border)] px-5 py-4">
          <button
            type="button"
            onClick={onReplayTour}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] text-sm font-semibold text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
          >
            <Play size={15} />
            Replay the product tour
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { closeTrialGate } from "@/redux/feature/trialGateSlice";
import { getToken } from "@/utils/tokenHandler";
import { getTenantSlug } from "@/utils/tenantHandler";
import { BACKEND_BASE_URL } from "@/constants";
import { getServeLoginUrl, redirectToServeLogin } from "@/utils/serveAuth";

const SUPPORT_EMAIL = "serve@technirvana.com.np";

export default function TrialLifecycleGate() {
  const dispatch = useDispatch();
  const gate = useSelector((s: RootState) => s.trialGate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!gate.open || !gate.code) return null;

  const cafeName = gate.cafe?.name || "your cafe";
  const isExtendable =
    gate.code === "TRIAL_EXPIRED" && gate.canSelfExtend;
  const isFinished = gate.code === "TRIAL_FINISHED";
  const title = isExtendable
    ? "Your trial has ended"
    : isFinished
      ? "Your trial has finished"
      : "Cafe unavailable";
  const subtitle = isExtendable
    ? `The free trial for ${cafeName} is over. You can extend it once by ${gate.selfServeExtendDays} days — no card needed.`
    : isFinished
      ? `The free trial for ${cafeName} is finished. Activate hosting to keep using POS, KOT, and reports.`
      : `${cafeName} is not available right now. Contact Serve if you need help.`;

  async function extendTrial() {
    setBusy(true);
    setError("");
    try {
      const token = getToken("token");
      const slug = getTenantSlug();
      const res = await fetch(`${BACKEND_BASE_URL}cafe/trial/extend`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Admin ${token}` } : {}),
          ...(slug ? { "x-tenant-slug": slug } : {}),
        },
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        const code = json?.data?.code;
        if (code === "TRIAL_FINISHED") {
          setError(
            json.msg ||
              json.message ||
              "Your free extension has already been used.",
          );
          setBusy(false);
          return;
        }
        throw new Error(
          json.msg || json.message || "Could not extend your trial.",
        );
      }
      dispatch(closeTrialGate());
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not extend trial.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Frosted glass over live POS — not a solid black curtain */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40 backdrop-blur-xl backdrop-saturate-150 dark:bg-black/55"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-gate-title"
        className="serve-modal relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ring-1 ring-[var(--serve-border)]"
      >
        <div className="border-b border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--serve-accent)]">
            Serve · Trial
          </p>
          <h2
            id="trial-gate-title"
            className="mt-1 text-xl font-semibold tracking-tight text-[var(--serve-fg)]"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--serve-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {gate.message ? (
            <p className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2 text-sm text-[var(--serve-fg)]">
              {gate.message}
            </p>
          ) : null}

          {isExtendable ? (
            <div className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-bg)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--serve-fg)]">
                One-time free extension
              </p>
              <p className="mt-1 text-sm text-[var(--serve-muted)]">
                Add{" "}
                <span className="font-semibold text-[var(--serve-fg)]">
                  +{gate.selfServeExtendDays} days
                </span>{" "}
                to keep taking orders. After this, you’ll need an active plan.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-bg)] px-4 py-3 text-sm text-[var(--serve-muted)]">
              <p>
                Email{" "}
                <a
                  className="font-medium text-[var(--serve-accent)] underline-offset-2 hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                to activate {cafeName}.
              </p>
            </div>
          )}

          {error ? (
            <p className="text-sm text-[var(--serve-negative)]">{error}</p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
              onClick={() => {
                dispatch(closeTrialGate());
                redirectToServeLogin();
              }}
            >
              Back to Serve
            </button>

            {isExtendable ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-xl bg-[var(--primary-color)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={extendTrial}
              >
                {busy
                  ? "Extending…"
                  : `Extend +${gate.selfServeExtendDays} days free`}
              </button>
            ) : (
              <a
                href={getServeLoginUrl().replace("/login?mode=login", "")}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary-color)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
              >
                Visit Serve
              </a>
            )}
          </div>

          {isFinished ? (
            <p className="text-center text-xs text-[var(--serve-muted)]">
              Your one-time free extension has already been used.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

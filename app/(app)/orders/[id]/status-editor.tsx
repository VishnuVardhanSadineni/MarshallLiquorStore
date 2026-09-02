"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { isNextControlFlowError } from "@/lib/next-error";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "./actions";

type Status = "pending" | "confirmed" | "ready" | "picked_up" | "cancelled";

const FLOW: { key: Status; label: string; short: string }[] = [
  { key: "pending", label: "New", short: "New" },
  { key: "confirmed", label: "Confirmed", short: "Confirm" },
  { key: "ready", label: "Ready for pickup", short: "Ready" },
  { key: "picked_up", label: "Picked up", short: "Picked up" },
];

const STATUS_TONE: Record<Status, string> = {
  pending: "border-amber-400/40 bg-amber-100/70 text-amber-900",
  confirmed: "border-primary/30 bg-primary/10 text-primary",
  ready: "border-emerald-400/40 bg-emerald-100/70 text-emerald-900",
  picked_up: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/25 bg-destructive/10 text-destructive",
};

const STATUS_DOT: Record<Status, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-primary",
  ready: "bg-emerald-500",
  picked_up: "bg-muted-foreground",
  cancelled: "bg-destructive",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "New",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export function StatusEditor({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: Status;
}) {
  const [pending, startTransition] = useTransition();
  const [committed, setCommitted] = useState<Status>(initialStatus);
  const [optimistic, setOptimistic] = useOptimistic<Status, Status>(
    committed,
    (_prev, next) => next,
  );
  // Bump key to re-trigger CSS animation whenever the value changes.
  const [animKey, setAnimKey] = useState(0);

  const cancelled = optimistic === "cancelled";
  const currentIndex = FLOW.findIndex((s) => s.key === optimistic);
  const next = !cancelled && currentIndex >= 0 ? FLOW[currentIndex + 1] : undefined;

  function change(target: Status) {
    if (target === optimistic || pending) return;
    startTransition(async () => {
      setOptimistic(target);
      setAnimKey((k) => k + 1);
      try {
        await updateOrderStatus(orderId, target);
        setCommitted(target);
      } catch (err) {
        if (isNextControlFlowError(err)) throw err;
        setOptimistic(committed);
        toast.error(
          err instanceof Error ? err.message : "Failed to update status",
        );
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="font-heading text-xl text-foreground">
            Order status
          </h2>
          <p className="text-sm text-muted-foreground">
            Click any step below to jump to that status. Changes save
            immediately.
          </p>
        </div>
        <div
          key={animKey}
          className={
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium animate-in fade-in-0 zoom-in-95 duration-300 " +
            STATUS_TONE[optimistic]
          }
        >
          <span
            className={
              "inline-block h-2 w-2 rounded-full " + STATUS_DOT[optimistic]
            }
            aria-hidden
          />
          <span>{STATUS_LABEL[optimistic]}</span>
          {pending && (
            <span
              className="ml-1 inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden
            />
          )}
        </div>
      </div>

      <ol
        className="relative grid grid-cols-4 gap-2"
        aria-label="Order fulfillment steps"
      >
        {FLOW.map((step, i) => {
          const stepIndex = i;
          const isActive = optimistic === step.key;
          const isPast = !cancelled && currentIndex > stepIndex;
          const isFuture = cancelled || currentIndex < stepIndex;

          return (
            <li key={step.key} className="relative">
              <button
                type="button"
                onClick={() => change(step.key)}
                disabled={pending}
                aria-current={isActive ? "step" : undefined}
                className={
                  "group w-full flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center transition-all duration-300 disabled:opacity-70 " +
                  (isActive
                    ? "border-primary bg-primary/10 shadow-sm scale-[1.02]"
                    : isPast
                    ? "border-emerald-400/40 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border/70 bg-background hover:bg-accent")
                }
              >
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 " +
                    (isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : isPast
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-accent")
                  }
                >
                  {isPast ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepIndex + 1
                  )}
                </span>
                <span
                  className={
                    "text-[11px] sm:text-xs font-medium " +
                    (isActive
                      ? "text-primary"
                      : isPast
                      ? "text-emerald-700 dark:text-emerald-500"
                      : "text-muted-foreground") +
                    (isFuture && !isActive ? " opacity-70" : "")
                  }
                >
                  {step.label}
                </span>
              </button>
              {stepIndex < FLOW.length - 1 && (
                <span
                  aria-hidden
                  className={
                    "hidden md:block absolute top-[calc(0.75rem+1rem)] left-full -translate-x-1/2 w-[calc(100%_-_2rem)] h-[2px] pointer-events-none " +
                    (currentIndex > stepIndex && !cancelled
                      ? "bg-emerald-400"
                      : "bg-border")
                  }
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {cancelled ? (
            <span>
              This order is cancelled. You can restore it by clicking a step
              above.
            </span>
          ) : optimistic === "picked_up" ? (
            <span>Order complete. Nothing left to do.</span>
          ) : (
            <span>
              Next up:{" "}
              <span className="font-medium text-foreground">
                {next?.label ?? "—"}
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {!cancelled && optimistic !== "picked_up" && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => change("cancelled")}
              disabled={pending}
              className="w-full sm:w-auto"
            >
              Cancel order
            </Button>
          )}
          {next && !cancelled && (
            <Button
              type="button"
              size="lg"
              onClick={() => change(next.key)}
              disabled={pending}
              className="w-full sm:w-auto"
            >
              Advance to {next.short} →
            </Button>
          )}
          {cancelled && (
            <Button
              type="button"
              size="lg"
              onClick={() => change("pending")}
              disabled={pending}
              className="w-full sm:w-auto"
            >
              Reopen order
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

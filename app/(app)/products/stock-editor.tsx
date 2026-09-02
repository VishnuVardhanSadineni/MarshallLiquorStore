"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { isNextControlFlowError } from "@/lib/next-error";
import { updateStock } from "./actions";

export function StockInlineEditor({
  productId,
  initialStock,
}: {
  productId: string;
  initialStock: number;
}) {
  const [value, setValue] = useState<number>(initialStock);
  const [saved, setSaved] = useState<number>(initialStock);
  const [pending, startTransition] = useTransition();

  const dirty = value !== saved;

  const tone =
    value === 0
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : value < 10
      ? "border-amber-400/40 bg-amber-100/40 text-amber-900"
      : "border-border bg-background text-foreground";

  function dec() {
    setValue((v) => Math.max(0, v - 1));
  }
  function inc() {
    setValue((v) => Math.min(9999, v + 1));
  }
  function reset() {
    setValue(saved);
  }
  function save() {
    if (!dirty || pending) return;
    startTransition(async () => {
      try {
        await updateStock(productId, value);
        setSaved(value);
      } catch (err) {
        if (isNextControlFlowError(err)) throw err;
        toast.error(
          err instanceof Error ? err.message : "Failed to update stock",
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={pending || value === 0}
        aria-label="Decrease stock"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= 0) setValue(Math.floor(n));
        }}
        disabled={pending}
        aria-label="Stock quantity"
        className={
          "h-8 w-16 rounded-lg border px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-3 focus:ring-ring/40 disabled:opacity-60 transition-colors " +
          tone
        }
      />
      <button
        type="button"
        onClick={inc}
        disabled={pending}
        aria-label="Increase stock"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
      {dirty && (
        <>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/85 disabled:opacity-60 transition-colors"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            aria-label="Undo change"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Undo
          </button>
        </>
      )}
    </div>
  );
}

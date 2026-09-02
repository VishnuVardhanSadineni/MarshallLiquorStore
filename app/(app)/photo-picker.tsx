"use client";

import { useRef, useState } from "react";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif";
const MAX_MB = 5;

export function PhotoPicker({
  currentUrl,
  disabled,
}: {
  currentUrl?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const shownImage = preview ?? (remove ? null : currentUrl ?? null);
  const hasSomething = Boolean(shownImage);

  function pickFile() {
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_MB} MB.`);
      e.target.value = "";
      setPreview(null);
      setFileName(null);
      return;
    }
    setRemove(false);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setFileName(null);
    setError(null);
  }

  function removeCurrent() {
    clearSelection();
    setRemove(true);
  }

  function undoRemove() {
    setRemove(false);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className={
          "relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-colors " +
          (hasSomething
            ? "border-border/60 bg-muted"
            : "border-dashed border-border bg-muted/40")
        }
      >
        {shownImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownImage}
            alt="Product photo preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider">No photo</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <input
          ref={inputRef}
          type="file"
          name="photo"
          accept={ACCEPT}
          className="sr-only"
          onChange={onChange}
          disabled={disabled}
        />
        {remove && <input type="hidden" name="remove_photo" value="1" />}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {shownImage ? "Change photo" : "Choose photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex h-8 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Undo selection
            </button>
          )}
          {!preview && currentUrl && !remove && (
            <button
              type="button"
              onClick={removeCurrent}
              disabled={disabled}
              className="inline-flex h-8 items-center rounded-lg px-3 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
          {remove && (
            <button
              type="button"
              onClick={undoRemove}
              className="inline-flex h-8 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep current photo
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {fileName
            ? `Selected: ${fileName}`
            : remove
            ? "Photo will be removed when you save."
            : `JPG, PNG, WebP, or HEIC. Up to ${MAX_MB} MB.`}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

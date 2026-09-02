"use client";

import { useEffect, useRef, useState } from "react";

function initialsFrom(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

export function HeaderUser({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string;
  role: "admin" | "staff";
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = (fullName?.trim() || email.split("@")[0] || "You").trim();
  const initials = initialsFrom(fullName?.trim() || email);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          "group flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 sm:pr-3 transition-colors " +
          (open
            ? "border-border bg-accent"
            : "border-border/70 bg-card/70 hover:bg-accent/60")
        }
      >
        <span
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium " +
            (isAdmin
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground")
          }
        >
          {initials}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm text-foreground max-w-[10rem] truncate">
            {displayName}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {isAdmin ? "Admin" : "Staff"}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={
            "hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform " +
            (open ? "rotate-180" : "")
          }
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg shadow-black/5 z-40"
        >
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
            <span
              className={
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium " +
                (isAdmin
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground")
              }
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between border-b border-border/60">
            <span>Role</span>
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                (isAdmin
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground")
              }
            >
              <span
                className={
                  "inline-block h-1.5 w-1.5 rounded-full " +
                  (isAdmin ? "bg-primary" : "bg-muted-foreground/60")
                }
                aria-hidden
              />
              {isAdmin ? "Admin" : "Staff"}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

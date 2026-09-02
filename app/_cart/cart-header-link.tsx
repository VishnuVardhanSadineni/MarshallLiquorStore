"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartHeaderLink() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 h-9 text-sm hover:bg-accent transition-colors"
      aria-label={`Cart with ${count} ${count === 1 ? "item" : "items"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      {ready && count > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : (
        <span className="hidden sm:inline text-muted-foreground">Cart</span>
      )}
    </Link>
  );
}

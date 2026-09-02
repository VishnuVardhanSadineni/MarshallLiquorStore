"use client";

import Link from "next/link";
import { useCart } from "@/app/_cart/cart-provider";
import {
  BrandLockup,
  MAPS_URL,
  MarketingFooter,
} from "@/lib/marketing";
import { buttonVariants } from "@/components/ui/button";
import { CartHeaderLink } from "@/app/_cart/cart-header-link";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem, ready } = useCart();

  return (
    <div className="min-h-screen">
      <CartHeader />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Keep shopping
        </Link>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Your cart
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight text-foreground">
            Ready to check out?
          </h1>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-border/70 bg-card/70 px-6 py-10 text-center text-sm text-muted-foreground">
            Loading your cart…
          </div>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
            <ul className="space-y-3">
              {items.map((it) => {
                const lineCents = it.priceCents * it.quantity;
                return (
                  <li
                    key={it.productId}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm flex gap-4"
                  >
                    <Thumbnail url={it.imageUrl} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        {it.categoryName ?? "Selection"}
                      </p>
                      <p className="font-medium text-foreground">{it.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {it.sku}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <QtyButton
                            onClick={() =>
                              setQuantity(it.productId, it.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </QtyButton>
                          <span className="min-w-[2.25rem] text-center font-medium tabular-nums">
                            {it.quantity}
                          </span>
                          <QtyButton
                            onClick={() =>
                              setQuantity(it.productId, it.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </QtyButton>
                          <button
                            type="button"
                            onClick={() => removeItem(it.productId)}
                            className="ml-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="font-heading text-lg text-primary tabular-nums">
                          ${(lineCents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
              <h2 className="font-heading text-xl text-foreground">Summary</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  ${(subtotalCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tax and any additional fees will be calculated at pickup. Pay
                in store when you collect your order.
              </p>
              <Link
                href="/checkout"
                className={
                  buttonVariants({ size: "lg" }) + " w-full justify-center"
                }
              >
                Checkout →
              </Link>
              <p className="text-[11px] text-muted-foreground text-center">
                Must be 21+ with valid ID to pick up.
              </p>
            </aside>
          </div>
        )}
      </main>

      <MarketingFooter
        nav={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          { href: MAPS_URL, label: "Visit", external: true },
          { href: "/login", label: "Staff sign in" },
        ]}
      />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
      <p className="font-heading text-2xl text-foreground">
        Your cart is empty.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Head back to the shop and pick out something good.
      </p>
      <Link
        href="/shop"
        className={buttonVariants({ size: "lg" }) + " mt-6 shadow-sm"}
      >
        Browse the aisles →
      </Link>
    </div>
  );
}

function QtyButton({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent transition-colors"
    >
      {children}
    </button>
  );
}

function Thumbnail({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div
        className="h-20 w-20 shrink-0 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center text-muted-foreground"
        aria-hidden
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M21 16l-5-5-8 8" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className="h-20 w-20 shrink-0 rounded-xl object-cover border border-border/60 bg-muted"
    />
  );
}

function CartHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <BrandLockup />
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="px-3 py-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
          >
            Shop
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <CartHeaderLink />
          <Link
            href="/login"
            className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Staff
          </Link>
        </div>
      </div>
    </header>
  );
}

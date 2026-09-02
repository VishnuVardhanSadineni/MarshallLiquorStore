"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useCart } from "@/app/_cart/cart-provider";
import {
  BrandLockup,
  MAPS_URL,
  MarketingFooter,
} from "@/lib/marketing";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CartHeaderLink } from "@/app/_cart/cart-header-link";
import { placeOrder } from "./actions";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, clear, ready } = useCart();
  const [pending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = ready && items.length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(
        {
          firstName,
          lastName,
          phone,
          pickupNotes,
          ageVerified,
        },
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      clear();
      router.push(`/order/${result.orderNumber}`);
    });
  }

  return (
    <div className="min-h-screen">
      <CheckoutHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Back to cart
        </Link>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Checkout
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight text-foreground">
            Just a few details.
          </h1>
          <p className="text-muted-foreground max-w-lg">
            We&apos;ll set your bottles aside. Pay in store when you pick them
            up.
          </p>
        </div>

        {empty ? (
          <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
            <p className="font-heading text-2xl text-foreground">
              Your cart is empty.
            </p>
            <Link
              href="/shop"
              className={buttonVariants({ size: "lg" }) + " mt-6 shadow-sm"}
            >
              Browse the aisles →
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start"
          >
            <div className="space-y-6">
              <FormSection title="Who&apos;s picking up?">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name" htmlFor="firstName" required>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label="Last name" htmlFor="lastName" required>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      autoComplete="family-name"
                    />
                  </Field>
                </div>
                <Field label="Phone" htmlFor="phone" required>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 555-0123"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll call if anything&apos;s wrong. No spam.
                  </p>
                </Field>
                <Field label="Pickup notes" htmlFor="pickupNotes">
                  <Textarea
                    id="pickupNotes"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Picking up Saturday around 4 pm."
                    maxLength={500}
                  />
                </Field>
              </FormSection>

              <FormSection title="Confirm">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ageVerified}
                    onChange={(e) => setAgeVerified(e.target.checked)}
                    className="peer sr-only"
                    required
                  />
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-sm text-foreground">
                    I am 21 years or older and will present a valid ID when
                    picking up my order.
                  </span>
                </label>
              </FormSection>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
              <h2 className="font-heading text-xl text-foreground">
                Order summary
              </h2>
              <ul className="space-y-3">
                {items.map((it) => (
                  <li
                    key={it.productId}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-foreground">
                        {it.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Qty {it.quantity}
                      </span>
                    </span>
                    <span className="tabular-nums text-foreground shrink-0">
                      ${((it.priceCents * it.quantity) / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-heading text-xl text-primary tabular-nums">
                  ${(subtotalCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tax and any additional fees calculated at pickup.
              </p>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending || !ageVerified}
              >
                {pending ? "Placing order…" : "Place order"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                You&apos;ll get a confirmation number and PDF receipt.
              </p>
            </aside>
          </form>
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
      <h2 className="font-heading text-xl text-foreground mb-5">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-primary text-xs" aria-hidden>
            •
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <BrandLockup />
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

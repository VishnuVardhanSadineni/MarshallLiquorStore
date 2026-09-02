import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BrandLockup,
  MAPS_URL,
  MarketingFooter,
} from "@/lib/marketing";
import { buttonVariants } from "@/components/ui/button";

type OrderItem = {
  id: string;
  product_name: string;
  product_sku: string;
  unit_price_cents: number;
  quantity: number;
};

type Order = {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  pickup_notes: string | null;
  status: string;
  subtotal_cents: number;
  created_at: string;
  order_items: OrderItem[];
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, first_name, last_name, phone, pickup_notes, status, subtotal_cents, created_at, order_items(id, product_name, product_sku, unit_price_cents, quantity)",
    )
    .eq("order_number", order_number)
    .single();

  if (error || !data) notFound();
  const order = data as unknown as Order;

  const placed = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <BrandLockup />
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <section className="rounded-3xl border border-primary/25 bg-primary/5 p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Order placed
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight text-foreground">
            You&apos;re all set,{" "}
            <span className="text-primary italic">{order.first_name}</span>.
          </h1>
          <p className="text-sm text-muted-foreground">
            Your confirmation number is
          </p>
          <p className="font-mono text-2xl sm:text-3xl font-semibold text-foreground tracking-widest">
            {order.order_number}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Save this page or download the PDF. Present the confirmation
            number and a valid ID when picking up.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`/order/${order.order_number}/pdf`}
              className={buttonVariants({ size: "lg" })}
            >
              Download PDF
            </a>
            <Link
              href="/shop"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Keep shopping
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-heading text-xl text-foreground">Order details</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Placed
              </dt>
              <dd className="text-foreground">{placed}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Customer
              </dt>
              <dd className="text-foreground">
                {order.first_name} {order.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Phone
              </dt>
              <dd className="text-foreground">{order.phone}</dd>
            </div>
            {order.pickup_notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pickup notes
                </dt>
                <dd className="text-foreground whitespace-pre-wrap">
                  {order.pickup_notes}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-heading text-xl text-foreground">Items</h2>
          <ul className="divide-y divide-border/60">
            {order.order_items.map((it) => (
              <li
                key={it.id}
                className="py-3 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {it.quantity} × {it.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {it.product_sku}
                  </p>
                </div>
                <p className="tabular-nums text-foreground shrink-0">
                  ${((it.unit_price_cents * it.quantity) / 100).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/60 pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-heading text-2xl text-primary tabular-nums">
              ${(order.subtotal_cents / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tax and any additional fees calculated at pickup. Pay in store.
          </p>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-2">
          <h2 className="font-heading text-xl text-foreground">Pickup</h2>
          <p className="text-sm text-foreground">
            Marshall Liquor Store
            <br />
            613 Locust St, Suite A
            <br />
            Marshall, IL 62441
          </p>
          <p className="text-sm text-muted-foreground">
            Mon–Sat · 9a – 12a
            <br />
            Sun · 12p – 12a
          </p>
          <div className="flex flex-wrap gap-3 pt-3">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary" }) + ""}
            >
              Get directions
            </a>
            <a
              href="tel:+16187075250"
              className={buttonVariants({ variant: "ghost" })}
            >
              (618) 707-5250
            </a>
          </div>
        </section>
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

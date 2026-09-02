import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrder } from "./actions";
import { DeleteOrderButton } from "./delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  updated_at: string;
  order_items: OrderItem[];
};

const STATUS_OPTIONS = [
  { value: "pending", label: "New (pending)" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ready", label: "Ready for pickup" },
  { value: "picked_up", label: "Picked up" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, first_name, last_name, phone, pickup_notes, status, subtotal_cents, created_at, updated_at, order_items(id, product_name, product_sku, unit_price_cents, quantity)",
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const order = data as unknown as Order;

  const boundUpdate = updateOrder.bind(null, order.id);
  const placed = new Date(order.created_at).toLocaleString();
  const updated = new Date(order.updated_at).toLocaleString();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Back to orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium font-mono normal-case tracking-normal">
              {order.order_number}
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
              {order.first_name} {order.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed {placed} · Updated {updated}
            </p>
          </div>
          <a
            href={`/order/${order.order_number}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <form action={boundUpdate} className="space-y-6">
          <FormSection title="Customer">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" htmlFor="first_name" required>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={order.first_name}
                  required
                />
              </Field>
              <Field label="Last name" htmlFor="last_name" required>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={order.last_name}
                  required
                />
              </Field>
            </div>
            <Field label="Phone" htmlFor="phone" required>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={order.phone}
                required
              />
            </Field>
            <Field label="Pickup notes" htmlFor="pickup_notes">
              <Textarea
                id="pickup_notes"
                name="pickup_notes"
                rows={3}
                defaultValue={order.pickup_notes ?? ""}
                maxLength={500}
              />
            </Field>
          </FormSection>

          <FormSection title="Status">
            <Field label="Order status" htmlFor="status" required>
              <select
                id="status"
                name="status"
                defaultValue={order.status}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Cancel keeps a record. Delete wipes it entirely.
              </p>
            </Field>
          </FormSection>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <DeleteOrderButton
              id={order.id}
              orderNumber={order.order_number}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Link
                href="/orders"
                className={
                  buttonVariants({ variant: "ghost" }) +
                  " w-full justify-center sm:w-auto"
                }
              >
                Cancel
              </Link>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Save changes
              </Button>
            </div>
          </div>
        </form>

        <aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
          <h2 className="font-heading text-lg text-foreground">Items</h2>
          <ul className="divide-y divide-border/60">
            {order.order_items.map((it) => (
              <li
                key={it.id}
                className="py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {it.quantity} × {it.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {it.product_sku}
                  </p>
                </div>
                <p className="tabular-nums text-sm text-foreground shrink-0">
                  ${((it.unit_price_cents * it.quantity) / 100).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/60 pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-heading text-xl text-primary tabular-nums">
              ${(order.subtotal_cents / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tax and any fees added at pickup.
          </p>
          <div className="border-t border-border/60 pt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              Customer receipt:{" "}
              <Link
                href={`/order/${order.order_number}`}
                target="_blank"
                className="text-primary hover:underline"
              >
                /order/{order.order_number}
              </Link>
            </p>
          </div>
        </aside>
      </div>
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
      <h2 className="font-heading text-xl text-foreground mb-6">{title}</h2>
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

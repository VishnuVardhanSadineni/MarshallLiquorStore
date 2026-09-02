import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  subtotal_cents: number;
  created_at: string;
  item_count: number;
};

const STATUSES = [
  { key: "all", label: "All" },
  { key: "pending", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "ready", label: "Ready" },
  { key: "picked_up", label: "Picked up" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-400/40 bg-amber-100/60 text-amber-900",
  confirmed: "border-primary/30 bg-primary/10 text-primary",
  ready: "border-emerald-400/40 bg-emerald-100/60 text-emerald-900",
  picked_up: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/25 bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "New",
  confirmed: "Confirmed",
  ready: "Ready",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, first_name, last_name, phone, status, subtotal_cents, created_at, order_items(count)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && status !== "all" && STATUSES.some((s) => s.key === status)) {
    query = query.eq("status", status);
  }

  if (q && q.trim()) {
    const term = q.trim().replace(/[,()%\\]/g, "");
    if (term) {
      query = query.or(
        `order_number.ilike.%${term}%,phone.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;

  const rows: Row[] = (data ?? []).map((r) => ({
    id: r.id as string,
    order_number: r.order_number as string,
    first_name: r.first_name as string,
    last_name: r.last_name as string,
    phone: r.phone as string,
    status: r.status as string,
    subtotal_cents: Number(r.subtotal_cents),
    created_at: r.created_at as string,
    item_count:
      Array.isArray(r.order_items) && r.order_items[0]?.count
        ? Number(r.order_items[0].count)
        : 0,
  }));

  const activeStatus = status && STATUSES.some((s) => s.key === status) ? status : "all";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
          Fulfillment
        </span>
        <h1 className="font-heading text-3xl sm:text-5xl leading-none text-foreground">
          Orders
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md">
          Manage customer pickup orders — call them, mark ready, and check
          them out at the counter.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/60 p-2 backdrop-blur sm:flex-row sm:items-center"
        action="/orders"
        method="get"
      >
        <Input
          name="q"
          placeholder="Search by name, phone, or order #..."
          defaultValue={q ?? ""}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0"
        />
        {status && status !== "all" && (
          <input type="hidden" name="status" value={status} />
        )}
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {(q || (status && status !== "all")) && (
          <Link
            href="/orders"
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const isActive = activeStatus === s.key;
          const href =
            s.key === "all" && !q
              ? "/orders"
              : `/orders?${new URLSearchParams({
                  ...(s.key !== "all" ? { status: s.key } : {}),
                  ...(q ? { q } : {}),
                }).toString()}`;
          return (
            <Link
              key={s.key}
              href={href}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent")
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load orders: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
          <p className="font-heading text-2xl text-foreground">
            {activeStatus === "all" && !q
              ? "No orders yet"
              : "Nothing matched"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeStatus === "all" && !q
              ? "New pickup orders will show up here as customers place them."
              : "Try a different search or clear the filters."}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/orders/${r.id}`}
                  className="block rounded-2xl border border-border/70 bg-card p-4 shadow-sm active:bg-accent/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {r.order_number}
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {r.first_name} {r.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.phone}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <StatusPill status={r.status} />
                      <p className="text-sm font-medium tabular-nums">
                        ${(r.subtotal_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.item_count} item{r.item_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Order
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Phone
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                    Items
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                    Total
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Placed
                  </TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-border/50 transition-colors hover:bg-accent/40"
                  >
                    <TableCell className="font-mono text-xs">
                      {r.order_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.first_name} {r.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.phone}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.item_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${(r.subtotal_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(r.created_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/${r.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Open →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    STATUS_STYLE[status] ?? "border-border bg-muted text-muted-foreground";
  const isNew = status === "pending";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium " +
        cls
      }
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {isNew && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-current opacity-70 animate-ping"
            aria-hidden
          />
        )}
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      </span>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

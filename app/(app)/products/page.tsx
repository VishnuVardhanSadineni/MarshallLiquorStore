import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products")
    .select("id, sku, name, category, price, stock")
    .order("created_at", { ascending: false })
    .limit(500);

  if (q && q.trim()) {
    const term = q.trim().replace(/[,()%\\]/g, "");
    if (term) {
      query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    }
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load products: {error.message}
      </div>
    );
  }

  const rows = (products ?? []) as Product[];
  const hasSearch = Boolean(q && q.trim());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Catalog
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl leading-none text-foreground">
            Products
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            {isAdmin
              ? "Add, edit, and keep your store's inventory up to date."
              : "Browse your store's current inventory."}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/products/new"
            className={
              buttonVariants({ size: "lg" }) +
              " w-full sm:w-auto justify-center shadow-sm"
            }
          >
            <span className="mr-1.5 text-lg leading-none">+</span> Add product
          </Link>
        )}
      </div>

      <form
        className="flex gap-2 rounded-xl border border-border/70 bg-card/60 p-2 backdrop-blur"
        action="/products"
        method="get"
      >
        <Input
          name="q"
          placeholder="Search by name or SKU..."
          defaultValue={q ?? ""}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {hasSearch && (
          <Link
            href="/products"
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState isAdmin={isAdmin} hasSearch={hasSearch} query={q} />
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className="block rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors active:bg-accent/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono">{p.sku}</span>
                        {p.category && (
                          <>
                            <span className="mx-1.5 opacity-50">·</span>
                            {p.category}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium tabular-nums text-foreground">
                        ${Number(p.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StockPill value={p.stock} />
                    <span className="text-sm text-primary">
                      {isAdmin ? "Edit" : "View"} →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

        <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  SKU
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Name
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Category
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                  Price
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                  Stock
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-border/50 transition-colors hover:bg-accent/40"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.sku}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <StockPill value={p.stock} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      {isAdmin ? "Edit" : "View"} →
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

function StockPill({ value }: { value: number }) {
  const style =
    value === 0
      ? "border-destructive/25 bg-destructive/10 text-destructive"
      : value < 10
      ? "border-amber-400/40 bg-amber-100/60 text-amber-800"
      : "border-border bg-muted text-foreground/70";
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs " +
        style
      }
    >
      {value}
      <span className="text-[10px] uppercase tracking-wider opacity-70">
        in stock
      </span>
    </span>
  );
}

function EmptyState({
  isAdmin,
  hasSearch,
  query,
}: {
  isAdmin: boolean;
  hasSearch: boolean;
  query?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/8 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="M4 7l8-4 8 4-8 4-8-4z" />
          <path d="M4 7v10l8 4 8-4V7" />
          <path d="M12 11v10" />
        </svg>
      </div>
      <h2 className="relative mt-6 font-heading text-2xl text-foreground">
        {hasSearch
          ? "Nothing matched your search"
          : isAdmin
          ? "Your catalog is empty"
          : "No products yet"}
      </h2>
      <p className="relative mt-2 text-sm text-muted-foreground">
        {hasSearch
          ? `We couldn't find anything for "${query}". Try a different name or SKU.`
          : isAdmin
          ? "Add your first product to start tracking inventory."
          : "Check back after your admin adds inventory."}
      </p>
      {isAdmin && !hasSearch && (
        <Link
          href="/products/new"
          className={
            buttonVariants({ size: "lg" }) + " relative mt-6 shadow-sm"
          }
        >
          <span className="mr-1.5 text-lg leading-none">+</span> Add your first product
        </Link>
      )}
    </div>
  );
}

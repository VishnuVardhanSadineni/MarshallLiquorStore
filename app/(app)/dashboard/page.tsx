import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: { name: string } | null;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
};

const LOW_STOCK_THRESHOLD = 10;

export default async function DashboardPage() {
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, price, stock, image_url, created_at, category:categories(name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = ((data ?? []) as unknown as Product[]).map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  const totals = {
    bottles: rows.reduce((sum, p) => sum + p.stock, 0),
    outOfStock: rows.filter((p) => p.stock === 0).length,
    lowStock: rows.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length,
    value: rows.reduce((sum, p) => sum + p.stock * p.price, 0),
  };

  const recent = rows.slice(0, 5);
  const displayName = profile?.full_name?.split(/\s+/)[0] ?? "there";

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
          Today
        </span>
        <h1 className="font-heading text-3xl sm:text-5xl leading-none text-foreground">
          Welcome back, {displayName}.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
          {isAdmin
            ? "A quick look at what's on the shelves right now."
            : "A quick look at what's on the shelves right now. Ask an admin to make changes."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load your inventory: {error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Bottles on hand"
              value={totals.bottles.toLocaleString()}
              hint={`${rows.length} distinct products`}
              tone="primary"
            />
            <StatCard
              label="Out of stock"
              value={totals.outOfStock.toLocaleString()}
              hint={
                totals.outOfStock === 0
                  ? "Nothing empty. Nice."
                  : "Time to restock these"
              }
              tone={totals.outOfStock === 0 ? "muted" : "destructive"}
            />
            <StatCard
              label="Low stock"
              value={totals.lowStock.toLocaleString()}
              hint={`Under ${LOW_STOCK_THRESHOLD} on the shelf`}
              tone={totals.lowStock === 0 ? "muted" : "warn"}
            />
            <StatCard
              label="Inventory value"
              value={"$" + totals.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              hint="At sale price"
              tone="muted"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
                <h2 className="font-heading text-lg text-foreground">
                  Recently added
                </h2>
                <Link
                  href="/products"
                  className="text-sm text-primary hover:underline"
                >
                  See all →
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="px-5 py-10 sm:px-6 text-center">
                  <p className="font-heading text-xl text-foreground">
                    Your shelves are empty.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isAdmin
                      ? "Add your first bottle to get started."
                      : "Ask your admin to add bottles to the catalog."}
                  </p>
                  {isAdmin && (
                    <Link
                      href="/products/new"
                      className={
                        buttonVariants({ size: "lg" }) + " mt-5 shadow-sm"
                      }
                    >
                      <span className="mr-1.5 text-lg leading-none">+</span>
                      Add your first bottle
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {recent.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.id}`}
                        className="flex items-center gap-3 px-5 py-3 sm:px-6 hover:bg-accent/40 transition-colors"
                      >
                        <Thumb url={p.image_url} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {p.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="font-mono">{p.sku}</span>
                            {p.category?.name && (
                              <>
                                <span className="mx-1.5 opacity-50">·</span>
                                {p.category.name}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium tabular-nums">
                            ${p.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.stock} in stock
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card shadow-sm p-5 sm:p-6 space-y-4">
              <h2 className="font-heading text-lg text-foreground">
                Shortcuts
              </h2>
              <div className="grid gap-2">
                {isAdmin && (
                  <ShortcutLink
                    href="/products/new"
                    label="Add a bottle"
                    hint="New wine, spirit, or beer"
                  />
                )}
                <ShortcutLink
                  href="/products"
                  label="Browse the catalog"
                  hint="Search, edit, restock"
                />
                {isAdmin && (
                  <ShortcutLink
                    href="/team"
                    label="Manage your team"
                    hint="Add bartenders and managers"
                  />
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "muted" | "warn" | "destructive";
}) {
  const ring =
    tone === "primary"
      ? "ring-1 ring-primary/15 bg-gradient-to-br from-primary/5 to-transparent"
      : tone === "warn"
      ? "ring-1 ring-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent"
      : tone === "destructive"
      ? "ring-1 ring-destructive/20 bg-gradient-to-br from-destructive/10 to-transparent"
      : "";
  return (
    <div
      className={
        "rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm " + ring
      }
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl sm:text-3xl text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ShortcutLink({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 hover:bg-accent/40 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="text-primary transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

function Thumb({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 opacity-60"
          aria-hidden
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
      className="h-10 w-10 shrink-0 rounded-lg border border-border/60 object-cover bg-muted"
    />
  );
}

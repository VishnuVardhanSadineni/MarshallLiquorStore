import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { StockInlineEditor } from "./stock-editor";
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
  category: { name: string } | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  is_special: boolean;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, sku, name, price, stock, image_url, is_active, is_special, category:categories(name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (q && q.trim()) {
    const term = q.trim().replace(/[,()%\\]/g, "");
    if (term) {
      query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    }
  }

  if (category === "uncategorized") {
    query = query.is("category_id", null);
  } else if (category && category.trim()) {
    query = query.eq("category_id", category);
  }

  const { data: products, error } = await query;

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  const categories = (categoriesData ?? []) as { id: string; name: string }[];
  const selectedCategoryName =
    category === "uncategorized"
      ? "Uncategorized"
      : categories.find((c) => c.id === category)?.name ?? null;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load products: {error.message}
      </div>
    );
  }

  const rows = (products ?? []) as unknown as Product[];
  const hasSearch = Boolean(q && q.trim());
  const hasCategoryFilter = Boolean(category && category.trim());
  const hasAnyFilter = hasSearch || hasCategoryFilter;

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
            Add bottles, adjust prices, and keep the shelf count honest.
          </p>
        </div>
        <Link
          href="/products/new"
          className={
            buttonVariants({ size: "lg" }) +
            " w-full sm:w-auto justify-center shadow-sm"
          }
        >
          <span className="mr-1.5 text-lg leading-none">+</span> Add bottle
        </Link>
      </div>

      <form
        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/60 p-2 backdrop-blur sm:flex-row sm:items-center"
        action="/products"
        method="get"
      >
        <Input
          name="q"
          placeholder="Search by name or SKU..."
          defaultValue={q ?? ""}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-ring/40 sm:max-w-[220px]"
        >
          <option value="">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {hasAnyFilter && (
          <Link
            href="/products"
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear
          </Link>
        )}
      </form>

      {hasCategoryFilter && selectedCategoryName && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Aisle:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            {selectedCategoryName}
          </span>
          <span className="text-muted-foreground">
            · {rows.length} {rows.length === 1 ? "bottle" : "bottles"}
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          hasSearch={hasSearch}
          hasCategoryFilter={hasCategoryFilter}
          categoryName={selectedCategoryName}
          query={q}
        />
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((p) => (
              <li key={p.id}>
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <Link
                    href={`/products/${p.id}`}
                    className="flex gap-3 active:opacity-90"
                  >
                    <Thumbnail url={p.image_url} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="font-medium tabular-nums text-foreground shrink-0">
                          ${Number(p.price).toFixed(2)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono">{p.sku}</span>
                        {p.category?.name && (
                          <>
                            <span className="mx-1.5 opacity-50">·</span>
                            {p.category.name}
                          </>
                        )}
                      </p>
                      {(p.is_special || !p.is_active) && (
                        <div className="mt-1.5">
                          <StatusPills
                            isActive={p.is_active}
                            isSpecial={p.is_special}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <StockInlineEditor
                      productId={p.id}
                      initialStock={p.stock}
                    />
                    <Link
                      href={`/products/${p.id}`}
                      className="text-sm text-primary"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>

        <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-16" />
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
                  <TableCell className="py-2">
                    <Thumbnail url={p.image_url} size={44} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.sku}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2 flex-wrap">
                      {p.name}
                      <StatusPills
                        isActive={p.is_active}
                        isSpecial={p.is_special}
                      />
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div className="flex justify-end">
                      <StockInlineEditor
                        productId={p.id}
                        initialStock={p.stock}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      Edit →
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

function Thumbnail({
  url,
  size,
}: {
  url: string | null;
  size: number;
}) {
  if (!url) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground"
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
          className="h-1/2 w-1/2 opacity-60"
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
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg border border-border/60 object-cover bg-muted"
    />
  );
}

function StatusPills({
  isActive,
  isSpecial,
}: {
  isActive: boolean;
  isSpecial: boolean;
}) {
  if (isActive && !isSpecial) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {!isActive && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
            aria-hidden
          />
          Inactive
        </span>
      )}
      {isSpecial && (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
            aria-hidden
          />
          Featured
        </span>
      )}
    </span>
  );
}

function EmptyState({
  hasSearch,
  hasCategoryFilter,
  categoryName,
  query,
}: {
  hasSearch: boolean;
  hasCategoryFilter: boolean;
  categoryName: string | null;
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
          : hasCategoryFilter
          ? `No bottles in ${categoryName}`
          : "Your shelves are empty"}
      </h2>
      <p className="relative mt-2 text-sm text-muted-foreground">
        {hasSearch
          ? `We couldn't find anything for "${query}". Try a different name or SKU.`
          : hasCategoryFilter
          ? "Clear the filter to see everything, or add a bottle to this aisle."
          : "Add your first bottle to start tracking your inventory."}
      </p>
      {!hasSearch && !hasCategoryFilter && (
        <Link
          href="/products/new"
          className={
            buttonVariants({ size: "lg" }) + " relative mt-6 shadow-sm"
          }
        >
          <span className="mr-1.5 text-lg leading-none">+</span> Add your first bottle
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
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
  name: string;
  image_url: string | null;
  bottle_count: number;
};

export default async function CategoriesPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, image_url, products(count)")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Couldn&apos;t load categories: {error.message}
      </div>
    );
  }

  const rows: Row[] = (categories ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    image_url: (c.image_url as string | null) ?? null,
    bottle_count:
      Array.isArray(c.products) && c.products[0]?.count
        ? Number(c.products[0].count)
        : 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Aisles
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl leading-none text-foreground">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Organize your bottles by aisle. Wine, whiskey, beer — whatever
            makes sense on your shelves.
          </p>
        </div>
        <Link
          href="/categories/new"
          className={
            buttonVariants({ size: "lg" }) +
            " w-full sm:w-auto justify-center shadow-sm"
          }
        >
          <span className="mr-1.5 text-lg leading-none">+</span> Add category
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
          <p className="font-heading text-2xl text-foreground">
            No categories yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first category to start organizing the shelves.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/categories/${r.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm active:bg-accent/60 transition-colors"
                >
                  <Thumb url={r.image_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.bottle_count} bottle{r.bottle_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-primary text-sm shrink-0">Edit →</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-16" />
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Name
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                    Bottles
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
                    <TableCell className="py-2">
                      <Thumb url={r.image_url} />
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.bottle_count === 0 ? (
                        <span className="text-muted-foreground">0</span>
                      ) : (
                        <Link
                          href={`/products?category=${r.id}`}
                          className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                        >
                          {r.bottle_count}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/categories/${r.id}`}
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

function Thumb({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground"
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
          className="h-5 w-5 opacity-60"
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
      className="h-11 w-11 shrink-0 rounded-lg border border-border/60 object-cover bg-muted"
    />
  );
}

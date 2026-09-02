import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BrandLockup,
  MAPS_URL,
  MarketingFooter,
} from "@/lib/marketing";
import { buttonVariants } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: { name: string } | null;
};

export const revalidate = 60;

async function getAllProducts(): Promise<Product[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, name, price, image_url, category:categories(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500);
    const raw = (data ?? []) as unknown as {
      id: string;
      name: string;
      price: string | number;
      image_url: string | null;
      category: { name: string } | null;
    }[];
    return raw.map((p) => ({ ...p, price: Number(p.price) }));
  } catch {
    return [];
  }
}

export default async function ShopAllPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen">
      <ShopHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> All categories
        </Link>

        <section className="space-y-3 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Everything
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl leading-[1.02] tracking-tight text-foreground">
            All bottles.
          </h1>
          <p className="text-lg text-muted-foreground">
            {products.length}{" "}
            {products.length === 1 ? "bottle" : "bottles"} on the shelf.
          </p>
        </section>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center">
            <p className="font-heading text-2xl text-foreground">
              Nothing on the shelf right now.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Stop by or give us a call — we may have more in the back.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
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

function ProductCard({ product }: { product: Product }) {
  const categoryName = product.category?.name ?? "Selection";
  return (
    <div className="group rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-900/60 via-rose-900/40 to-primary/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-x-6 bottom-6 rounded-lg border border-white/15 bg-black/25 backdrop-blur px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.24em] text-white/70">
                {categoryName}
              </p>
              <p className="font-heading text-white mt-0.5 line-clamp-2">
                {product.name}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {categoryName}
        </p>
        <p className="font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
        <p className="font-heading text-lg text-primary mt-1 tabular-nums">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function ShopHeader() {
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
            className="px-3 py-1.5 rounded-md text-primary bg-primary/10"
          >
            Shop
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "sm" }) + " hidden sm:inline-flex"}
          >
            Visit us
          </a>
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Staff
          </Link>
        </div>
      </div>
    </header>
  );
}
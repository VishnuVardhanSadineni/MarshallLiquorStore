import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BrandLockup,
  MAPS_URL,
  MarketingFooter,
} from "@/lib/marketing";
import { buttonVariants } from "@/components/ui/button";

type CategoryTile = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export const revalidate = 60;

async function getCategories(): Promise<CategoryTile[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("categories")
      .select("id, name, description, image_url")
      .order("name", { ascending: true });
    return (data ?? []) as CategoryTile[];
  } catch {
    return [];
  }
}

const CATEGORY_GRADIENTS = [
  "from-rose-900 via-rose-800 to-amber-900",
  "from-amber-900 via-amber-800 to-orange-900",
  "from-emerald-900 via-emerald-800 to-teal-900",
  "from-lime-900 via-emerald-800 to-emerald-950",
  "from-sky-900 via-slate-800 to-slate-900",
  "from-orange-800 via-rose-800 to-rose-900",
];

export default async function ShopPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen">
      <ShopHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10 sm:mb-14 space-y-3 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Shop
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl leading-[1.02] tracking-tight text-foreground">
            Browse the aisles.
          </h1>
          <p className="text-lg text-muted-foreground">
            Pick a category to see what&apos;s on the shelf right now.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center">
            <p className="font-heading text-2xl text-foreground">
              Coming soon.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re still stocking the shelves. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <CategoryCard
                key={c.id}
                category={c}
                gradient={CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}
              />
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

function CategoryCard({
  category,
  gradient,
}: {
  category: CategoryTile;
  gradient: string;
}) {
  return (
    <Link
      href={`/shop/${category.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm block hover:-translate-y-0.5 transition-transform"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        {category.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image_url}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={
              "absolute inset-0 bg-gradient-to-br " +
              gradient +
              " transition-transform duration-500 group-hover:scale-[1.04]"
            }
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-5">
          <p className="font-heading text-2xl text-white leading-tight drop-shadow-sm">
            {category.name}
          </p>
        </div>
      </div>
      {category.description && (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
        </div>
      )}
    </Link>
  );
}

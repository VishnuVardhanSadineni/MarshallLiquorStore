import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";

type FeaturedProduct = {
  id: string;
  name: string;
  category: { name: string } | null;
  price: number;
  image_url: string | null;
};

type CategoryTile = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export const revalidate = 60; // refresh featured bottles every minute

const MAPS_URL = "https://maps.app.goo.gl/uXotNg5kVUvXVT4t5";
const INSTAGRAM_URL = "https://www.instagram.com/marshallliquor.613";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100093053714579";

export default async function LandingPage() {
  const [featured, categories] = await Promise.all([
    getFeaturedBottles(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen">
      <TopHeader />

      <main>
        <Hero />
        <Featured products={featured} />
        {categories.length > 0 && <Categories categories={categories} />}
        <Story />
        <Visit />
      </main>

      <Footer />
    </div>
  );
}

/* --------------------------------- data -------------------------------- */

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

async function getFeaturedBottles(): Promise<FeaturedProduct[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, name, price, image_url, category:categories(name)")
      .order("created_at", { ascending: false })
      .limit(8);
    const rows = (data ?? []) as unknown as FeaturedProduct[];
    // prefer bottles that actually have a photo
    const withPhoto = rows.filter((r) => r.image_url).slice(0, 4);
    if (withPhoto.length >= 4) return withPhoto;
    return [...withPhoto, ...rows.filter((r) => !r.image_url)].slice(0, 4);
  } catch {
    // admin client not configured yet, or DB unavailable — the section
    // will just show placeholder tiles below
    return [];
  }
}

/* --------------------------------- header ------------------------------ */

function TopHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BrandMark />
          <span className="font-heading text-lg sm:text-xl leading-none text-foreground">
            Marshall <span className="text-primary italic">Liquor</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <HeaderLink href="#featured">Featured</HeaderLink>
          <HeaderLink href="#categories">Categories</HeaderLink>
          <HeaderLink href={MAPS_URL} external>
            Visit
          </HeaderLink>
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

function HeaderLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const externalProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <a
      href={href}
      {...externalProps}
      className="px-3 py-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </a>
  );
}

function BrandMark() {
  return (
    <span
      className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M3 7.5l9-4 9 4v9l-9 4-9-4v-9z" />
        <path d="M3 7.5l9 4 9-4" />
        <path d="M12 11.5v9" />
        <path d="M7.5 5.25l9 4" />
      </svg>
    </span>
  );
}

/* ---------------------------------- hero ------------------------------- */

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Family owned · Since 1974
          </span>
          <h1 className="font-heading text-5xl sm:text-7xl leading-[0.98] tracking-tight text-foreground">
            The good stuff,
            <br />
            <span className="text-primary italic">picked by hand.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Wine from small vineyards. Bourbon aged the slow way. Ice-cold beer
            from the neighborhood. Come by, or call ahead — we&apos;ll set it
            aside for you.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#categories"
              className={buttonVariants({ size: "lg" }) + " shadow-sm"}
            >
              Browse the shelves
            </a>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Find the store →
            </a>
          </div>
          <dl className="grid grid-cols-3 gap-6 pt-6 max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Wines
              </dt>
              <dd className="font-heading text-2xl text-foreground mt-1">400+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Whiskeys
              </dt>
              <dd className="font-heading text-2xl text-foreground mt-1">120+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Craft beers
              </dt>
              <dd className="font-heading text-2xl text-foreground mt-1">80+</dd>
            </div>
          </dl>
        </div>

        {/* Hero image — public/images/hero-storefront.png */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-storefront.png"
            alt="Inside Marshall Liquor Store"
            className="w-full max-w-md mx-auto aspect-[4/5] rounded-3xl object-cover border border-border shadow-[0_40px_100px_-40px_oklch(0.4_0.08_40_/_0.45)]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ featured ------------------------------- */

function Featured({ products }: { products: FeaturedProduct[] }) {
  return (
    <section
      id="featured"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 space-y-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            This week
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
            Bottles we&apos;re pouring into.
          </h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          A small selection from the newest arrivals. Prices as marked in-store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(products.length > 0 ? products : PLACEHOLDER_FEATURED).map((p) => (
          <FeaturedCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

const PLACEHOLDER_FEATURED: FeaturedProduct[] = [
  { id: "p1", name: "Old-Vine Zinfandel", category: { name: "Wine" }, price: 24.0, image_url: null },
  { id: "p2", name: "Small-Batch Bourbon", category: { name: "Whiskey" }, price: 48.0, image_url: null },
  { id: "p3", name: "Neighborhood IPA (6-pack)", category: { name: "Beer" }, price: 14.0, image_url: null },
  { id: "p4", name: "Blanco Tequila", category: { name: "Tequila" }, price: 32.0, image_url: null },
];

function FeaturedCard({ product }: { product: FeaturedProduct }) {
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
          <PlaceholderBottle label={product.category?.name ?? "Bottle"} />
        )}
      </div>
      <div className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {product.category?.name ?? "Selection"}
        </p>
        <p className="font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
        <p className="font-heading text-lg text-primary mt-1 tabular-nums">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function PlaceholderBottle({ label }: { label: string }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/60 via-rose-900/40 to-primary/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-x-6 bottom-6 rounded-lg border border-white/15 bg-black/25 backdrop-blur px-3 py-2">
        <p className="text-[9px] uppercase tracking-[0.24em] text-white/70">
          Coming soon
        </p>
        <p className="font-heading text-white mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ----------------------------- categories ------------------------------ */

const CATEGORY_GRADIENTS = [
  "from-rose-900 via-rose-800 to-amber-900",
  "from-amber-900 via-amber-800 to-orange-900",
  "from-emerald-900 via-emerald-800 to-teal-900",
  "from-lime-900 via-emerald-800 to-emerald-950",
  "from-sky-900 via-slate-800 to-slate-900",
  "from-orange-800 via-rose-800 to-rose-900",
];

function Categories({ categories }: { categories: CategoryTile[] }) {
  return (
    <section
      id="categories"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 space-y-10"
    >
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
          Aisles
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
          What we pour.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          A little bit of everything, curated tight. Not sure what to grab?
          Ask — we love a recommendation.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <CategoryCard
            key={c.id}
            category={c}
            gradient={CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}
          />
        ))}
      </div>
    </section>
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
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
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- story --------------------------------- */

function Story() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        {/* Storefront photo — public/images/storefront.jpg */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/storefront.jpg"
          alt="Marshall Liquor Store from the sidewalk"
          className="w-full aspect-square rounded-3xl object-cover border border-border shadow-sm"
        />
        <div className="space-y-5">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Our story
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
            Three generations of pouring the good stuff.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Marshall Liquor Store opened in 1974 with a handshake and a
            shelf of bourbon. Fifty years later, we&apos;re still family-run.
            We&apos;ve grown the selection, kept the neighbors, and never
            stopped asking small distillers what they think you should
            try next.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Stop by. Say hi. Ask us what&apos;s new — the answer changes
            every week.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- visit --------------------------------- */

function Visit() {
  return (
    <section
      id="visit"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24"
    >
      <div className="rounded-3xl border border-border/70 bg-card p-8 sm:p-12 shadow-sm">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
              Come see us
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
              Visit the shop.
            </h2>
            <p className="text-muted-foreground">
              Free parking out front. Call ahead and we&apos;ll pull it for you.
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg" }) + " shadow-sm"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5 h-4 w-4"
                aria-hidden
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Get directions
            </a>
            <div className="pt-3 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Follow us
              </p>
              <div className="flex items-center gap-2">
                <SocialIconLink
                  href={INSTAGRAM_URL}
                  label="Instagram"
                  icon={<InstagramGlyph />}
                />
                <SocialIconLink
                  href={FACEBOOK_URL}
                  label="Facebook"
                  icon={<FacebookGlyph />}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
            <InfoBlock
              title="Address"
              lines={[
                "613 Locust St, Suite A",
                "Marshall, IL 62441",
              ]}
            />
            <InfoBlock
              title="Hours"
              lines={[
                "Mon–Sat · 9a – 12a",
                "Sun · 12p – 12a",
                "Hours may differ on holidays",
              ]}
            />
            <InfoBlock
              title="Call us"
              lines={[
                { text: "(618) 707-5250", href: "tel:+16187075250" },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

type InfoLine = string | { text: string; href: string };

function InfoBlock({ title, lines }: { title: string; lines: InfoLine[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {title}
      </p>
      <div className="mt-2 space-y-0.5 text-sm text-foreground">
        {lines.map((line) => {
          if (typeof line === "string") {
            return <p key={line}>{line}</p>;
          }
          return (
            <p key={line.text}>
              <a
                href={line.href}
                className="text-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
              >
                {line.text}
              </a>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ footer --------------------------------- */

function SocialIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground/70 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
    >
      {icon}
    </a>
  );
}

function InstagramGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M13.5 22v-8.25h2.79l.42-3.24H13.5V8.44c0-.94.26-1.58 1.6-1.58h1.71V3.96A22.87 22.87 0 0 0 14.31 3.8c-2.46 0-4.15 1.5-4.15 4.26v2.45H7.4v3.24h2.76V22h3.34z" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-heading text-lg text-foreground">
              Marshall <span className="text-primary italic">Liquor</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-xs">
            Please drink responsibly. Must be 21+ to purchase alcohol.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <SocialIconLink
              href={INSTAGRAM_URL}
              label="Instagram"
              icon={<InstagramGlyph />}
            />
            <SocialIconLink
              href={FACEBOOK_URL}
              label="Facebook"
              icon={<FacebookGlyph />}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href="#featured" className="hover:text-foreground">
            Featured
          </a>
          <a href="#categories" className="hover:text-foreground">
            Categories
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Visit
          </a>
          <Link href="/login" className="hover:text-foreground">
            Staff sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Marshall Liquor Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

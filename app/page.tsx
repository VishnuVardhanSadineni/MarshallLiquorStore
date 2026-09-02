import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";

type FeaturedProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  image_url: string | null;
};

export const revalidate = 60; // refresh featured bottles every minute

export default async function LandingPage() {
  const featured = await getFeaturedBottles();

  return (
    <div className="min-h-screen">
      <TopHeader />

      <main>
        <Hero />
        <Featured products={featured} />
        <Categories />
        <Story />
        <Visit />
      </main>

      <Footer />
    </div>
  );
}

/* --------------------------------- data -------------------------------- */

async function getFeaturedBottles(): Promise<FeaturedProduct[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, name, category, price, image_url")
      .order("created_at", { ascending: false })
      .limit(8);
    const rows = (data ?? []) as FeaturedProduct[];
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
          <HeaderLink href="#visit">Visit</HeaderLink>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#visit"
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

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
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
              href="#visit"
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

        {/*
          Hero image slot.
          Drop a photo at: public/images/hero-storefront.jpg (or .webp).
          Then uncomment the <img> below and delete the gradient block.
        */}
        <div className="relative">
          {/* <img
            src="/images/hero-storefront.jpg"
            alt="Inside Marshall Liquor Store"
            className="w-full aspect-[4/5] rounded-3xl object-cover border border-border shadow-[0_40px_100px_-40px_oklch(0.4_0.08_40_/_0.45)]"
          /> */}
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-3xl border border-border shadow-[0_40px_100px_-40px_oklch(0.4_0.08_40_/_0.45)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-amber-800/40 to-rose-900/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/15 bg-black/25 backdrop-blur px-5 py-4 text-white/90">
              <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">
                Curator&apos;s pick
              </p>
              <p className="font-heading text-2xl mt-1 leading-tight">
                Rye of the month
              </p>
              <p className="text-sm opacity-80 mt-0.5">
                Aged twelve years in charred oak.
              </p>
            </div>
            <div className="absolute top-6 left-6 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/90">
              In-store now
            </div>
          </div>
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
  { id: "p1", name: "Old-Vine Zinfandel", category: "Wine", price: 24.0, image_url: null },
  { id: "p2", name: "Small-Batch Bourbon", category: "Whiskey", price: 48.0, image_url: null },
  { id: "p3", name: "Neighborhood IPA (6-pack)", category: "Beer", price: 14.0, image_url: null },
  { id: "p4", name: "Blanco Tequila", category: "Tequila", price: 32.0, image_url: null },
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
          <PlaceholderBottle label={product.category ?? "Bottle"} />
        )}
      </div>
      <div className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {product.category ?? "Selection"}
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

const CATEGORIES = [
  {
    label: "Wine",
    body: "Reds, whites, sparkling. Small producers, curated by region.",
    gradient: "from-rose-900 via-rose-800 to-amber-900",
    file: "wine.jpg",
  },
  {
    label: "Whiskey & Bourbon",
    body: "Single malts, small-batch bourbons, ryes worth a slow sip.",
    gradient: "from-amber-900 via-amber-800 to-orange-900",
    file: "whiskey.jpg",
  },
  {
    label: "Beer",
    body: "Cold six-packs, IPAs, lagers, and local craft on rotation.",
    gradient: "from-emerald-900 via-emerald-800 to-teal-900",
    file: "beer.jpg",
  },
  {
    label: "Tequila & Mezcal",
    body: "Blanco, reposado, añejo — and a few mezcals from Oaxaca.",
    gradient: "from-lime-900 via-emerald-800 to-emerald-950",
    file: "tequila.jpg",
  },
  {
    label: "Vodka & Gin",
    body: "House pours to top-shelf. Botanical gins from around the world.",
    gradient: "from-sky-900 via-slate-800 to-slate-900",
    file: "vodka-gin.jpg",
  },
  {
    label: "Mixers & Bitters",
    body: "Tonic, sodas, syrups, cherries. Everything for the home bar.",
    gradient: "from-orange-800 via-rose-800 to-rose-900",
    file: "mixers.jpg",
  },
];

function Categories() {
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
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({
  label,
  body,
  gradient,
  file,
}: {
  label: string;
  body: string;
  gradient: string;
  file: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="relative aspect-[5/4] overflow-hidden">
        {/*
          Category image slot. Drop a photo at:
          public/images/categories/${file}
          Then uncomment the <img> below and delete the gradient div.
        */}
        {/* <img
          src={`/images/categories/${file}`}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        /> */}
        <div
          data-image-file={file}
          className={
            "absolute inset-0 bg-gradient-to-br " +
            gradient +
            " transition-transform duration-500 group-hover:scale-[1.04]"
          }
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute inset-x-5 bottom-5">
          <p className="font-heading text-2xl text-white leading-tight">
            {label}
          </p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

/* ------------------------------- story --------------------------------- */

function Story() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        {/*
          Storefront photo slot. Drop a photo at:
          public/images/storefront.jpg
        */}
        {/* <img
          src="/images/storefront.jpg"
          alt="Marshall Liquor Store from the sidewalk"
          className="w-full aspect-square rounded-3xl object-cover border border-border shadow-sm"
        /> */}
        <div className="relative aspect-square rounded-3xl overflow-hidden border border-border shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 via-primary/40 to-rose-900/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.4),transparent_60%)]" />
          <div className="absolute inset-x-6 bottom-6 text-white/90">
            <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">
              Our store
            </p>
            <p className="font-heading text-2xl mt-1">
              Corner of Main &amp; 5th
            </p>
          </div>
        </div>
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
          <div className="space-y-2 lg:col-span-1">
            <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
              Come see us
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
              Visit the shop.
            </h2>
            <p className="text-muted-foreground">
              Free parking out front. Call ahead and we&apos;ll pull it for you.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
            <InfoBlock
              title="Address"
              lines={[
                "123 Main Street",
                "Springfield, ST 00000",
              ]}
            />
            <InfoBlock
              title="Hours"
              lines={[
                "Mon–Thu · 10a – 9p",
                "Fri–Sat · 10a – 11p",
                "Sun · 12p – 7p",
              ]}
            />
            <InfoBlock
              title="Get in touch"
              lines={[
                "(555) 555-0123",
                "hello@marshallliquor.com",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {title}
      </p>
      <div className="mt-2 space-y-0.5 text-sm text-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ footer --------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-heading text-lg text-foreground">
              Marshall <span className="text-primary italic">Liquor</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-xs">
            Please drink responsibly. Must be 21+ to purchase alcohol.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href="#featured" className="hover:text-foreground">
            Featured
          </a>
          <a href="#categories" className="hover:text-foreground">
            Categories
          </a>
          <a href="#visit" className="hover:text-foreground">
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

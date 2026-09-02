import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export default async function LandingPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Inventory home"
          >
            <BrandMark />
            <span className="font-heading text-lg sm:text-xl leading-none text-foreground">
              Inventory
            </span>
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "sm" })}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              For liquor stores
            </span>
            <h1 className="font-heading text-4xl sm:text-6xl leading-[1.02] tracking-tight text-foreground">
              Every bottle,
              <br />
              <span className="text-primary italic">counted.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              A simple back-of-house tool for wine, beer, and spirits.
              Track what&apos;s on the shelf, know when to reorder, and give
              your staff exactly the access they need — no more, no less.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/login"
                className={buttonVariants({ size: "lg" }) + " shadow-sm"}
              >
                Sign in to your store
              </Link>
              <a
                href="#features"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                What&apos;s inside
              </a>
            </div>
          </div>

          <ShelfIllustration />
        </section>

        <section id="features" className="mt-24 sm:mt-32 space-y-8">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
              Inside
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
              Made for the way you actually run a bottle shop.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={
                <>
                  <path d="M4 7l8-4 8 4-8 4-8-4z" />
                  <path d="M4 7v10l8 4 8-4V7" />
                  <path d="M12 11v10" />
                </>
              }
              title="A shelf you can actually see"
              body="Photos, SKUs, prices, and stock counts in one clean list. Search by name or SKU, tap through to edit."
            />
            <FeatureCard
              icon={
                <>
                  <path d="M12 2v6" />
                  <path d="M12 22v-6" />
                  <path d="M4 12H2" />
                  <path d="M22 12h-6" />
                </>
              }
              title="Low-stock at a glance"
              body="Bottles running low get a warm amber tag; empties get a red one. No spreadsheet gymnastics."
            />
            <FeatureCard
              icon={
                <>
                  <path d="M3 21v-4a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4" />
                  <circle cx="12" cy="7" r="4" />
                </>
              }
              title="Roles that respect your team"
              body="Bartenders view the catalog. Managers you promote to admin can edit, add staff, and reset passwords."
            />
          </div>
        </section>

        <section className="mt-24 sm:mt-32 rounded-3xl border border-border/70 bg-card p-8 sm:p-12 shadow-sm text-center">
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
            Ready when you open tomorrow.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Sign in with the account your admin gave you. New team member?
            Ask them to add you.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className={buttonVariants({ size: "lg" }) + " shadow-sm"}
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Inventory</span>
          <span>Built for corner shops and cellars alike.</span>
        </div>
      </footer>
    </div>
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

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {icon}
        </svg>
      </div>
      <h3 className="font-heading text-lg text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ShelfIllustration() {
  const bottles = [
    { top: "bg-rose-800", body: "bg-rose-700", label: "Red" },
    { top: "bg-emerald-800", body: "bg-emerald-700", label: "IPA" },
    { top: "bg-amber-900", body: "bg-amber-700", label: "Rye" },
    { top: "bg-zinc-800", body: "bg-zinc-700", label: "Gin" },
    { top: "bg-orange-900", body: "bg-orange-700", label: "Rum" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-40px_oklch(0.4_0.08_40_/_0.4)]">
        <div className="grid grid-cols-5 items-end gap-3 h-52">
          {bottles.map((b, i) => (
            <div key={i} className="flex h-full flex-col items-center">
              <div className={`h-4 w-2.5 rounded-sm ${b.top}`} />
              <div
                className={`mt-0.5 w-6 rounded-md ${b.body} flex-1 flex items-end justify-center pb-2`}
              >
                <span
                  className="text-[9px] tracking-widest uppercase font-medium text-white/80"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {b.label}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40" />
        <p className="mt-3 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Shelf 1 · 5 in stock
        </p>
      </div>
      <div className="absolute -top-4 -right-4 rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Low stock</p>
        <p className="mt-0.5 font-heading text-lg leading-none text-primary">3 bottles</p>
      </div>
      <div className="absolute -bottom-3 -left-3 rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">This month</p>
        <p className="mt-0.5 font-heading text-lg leading-none text-foreground">$4,820</p>
      </div>
    </div>
  );
}

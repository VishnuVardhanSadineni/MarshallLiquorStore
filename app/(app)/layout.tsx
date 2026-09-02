import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/70 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/products" className="flex items-center gap-2 group">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full bg-primary transition-transform group-hover:scale-125"
                aria-hidden
              />
              <span className="font-heading text-lg sm:text-xl leading-none text-foreground">
                Inventory
              </span>
            </Link>
            <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
              <Link
                href="/products"
                className="px-2 sm:px-3 py-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
              >
                Products
              </Link>
              {isAdmin && (
                <Link
                  href="/team"
                  className="px-2 sm:px-3 py-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
                >
                  Team
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={
                "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
                (isAdmin
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground")
              }
            >
              <span
                className={
                  "inline-block h-1.5 w-1.5 rounded-full " +
                  (isAdmin ? "bg-primary" : "bg-muted-foreground/60")
                }
                aria-hidden
              />
              {isAdmin ? "Admin" : "Staff"}
            </span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

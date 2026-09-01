import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/products" className="font-semibold">
              Inventory
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
              {profile.role === "admin" ? "Admin" : "Staff"}
            </Badge>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

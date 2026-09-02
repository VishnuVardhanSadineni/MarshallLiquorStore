import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { HeaderNav } from "./header-nav";
import { HeaderUser } from "./header-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, user] = await Promise.all([getProfile(), getUser()]);
  if (!profile || !user) redirect("/login");

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 shrink-0"
              aria-label="Inventory home"
            >
              <BrandMark />
              <span className="hidden sm:inline font-heading text-xl leading-none text-foreground">
                Inventory
              </span>
            </Link>
            <HeaderNav isAdmin={isAdmin} />
          </div>
          <HeaderUser
            fullName={profile.full_name}
            email={user.email ?? ""}
            role={profile.role}
          />
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

function BrandMark() {
  return (
    <span
      className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary transition-transform group-hover:-rotate-6"
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; matcher: (path: string) => boolean };

export function HeaderNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: Item[] = [
    {
      href: "/products",
      label: "Products",
      matcher: (p) => p === "/products" || p.startsWith("/products/"),
    },
  ];
  if (isAdmin) {
    items.push({
      href: "/team",
      label: "Team",
      matcher: (p) => p === "/team" || p.startsWith("/team/"),
    });
  }

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
      {items.map((item) => {
        const active = item.matcher(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "relative px-2 sm:px-3 py-1.5 rounded-md transition-colors " +
              (active
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:text-foreground hover:bg-accent")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

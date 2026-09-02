import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
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
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
  created_at: string;
};

export default async function TeamPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: authList }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    admin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const profileById = new Map<
    string,
    { full_name: string | null; role: "admin" | "staff"; created_at: string }
  >(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        full_name: p.full_name as string | null,
        role: p.role as "admin" | "staff",
        created_at: p.created_at as string,
      },
    ]),
  );

  const rows: Row[] = (authList?.users ?? [])
    .map((u) => {
      const p = profileById.get(u.id);
      if (!p) return null;
      return {
        id: u.id,
        email: u.email ?? "—",
        full_name: p.full_name,
        role: p.role,
        created_at: p.created_at,
      } satisfies Row;
    })
    .filter((r): r is Row => r !== null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            People
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl leading-none text-foreground">
            Team
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Invite staff, promote managers to admin, and keep passwords fresh.
          </p>
        </div>
        <Link
          href="/team/new"
          className={
            buttonVariants({ size: "lg" }) +
            " w-full sm:w-auto justify-center shadow-sm"
          }
        >
          <span className="mr-1.5 text-lg leading-none">+</span> Add team member
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
          <p className="font-heading text-2xl text-foreground">
            No teammates yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first staff member or fellow admin above.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/team/${r.id}`}
                  className="block rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors active:bg-accent/60"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={r.full_name ?? r.email} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {r.full_name || "Unnamed"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.email}
                      </p>
                    </div>
                    <RolePill role={r.role} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-14" />
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Name
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Email
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Role
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Added
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
                      <Avatar name={r.full_name ?? r.email} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.full_name || "Unnamed"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.email}
                    </TableCell>
                    <TableCell>
                      <RolePill role={r.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/team/${r.id}`}
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
      {initials}
    </div>
  );
}

function RolePill({ role }: { role: "admin" | "staff" }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
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
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

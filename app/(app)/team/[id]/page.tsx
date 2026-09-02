import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTeamMember } from "./actions";
import { DeleteTeamMemberButton } from "./delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const currentUser = await getUser();
  const admin = createAdminClient();

  const [{ data: userRes, error: authError }, { data: profile }] =
    await Promise.all([
      admin.auth.admin.getUserById(id),
      admin
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", id)
        .single(),
    ]);

  if (authError || !userRes?.user || !profile) notFound();

  const email = userRes.user.email ?? "";
  const fullName = (profile.full_name as string | null) ?? "";
  const role = (profile.role as "admin" | "staff") ?? "staff";
  const isSelf = currentUser?.id === id;

  const boundUpdate = updateTeamMember.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-3">
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Back to team
        </Link>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            Edit teammate
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
            {fullName || email}
          </h1>
          {isSelf && (
            <p className="text-sm text-muted-foreground">
              This is your account. Some options are limited to protect access.
            </p>
          )}
        </div>
      </div>

      <form action={boundUpdate} className="space-y-6">
        <FormSection
          title="Person"
          description="Their name and email address."
        >
          <Field label="Full name" htmlFor="full_name" required>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={fullName}
              required
            />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              autoComplete="off"
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Access"
          description="Change their role or reset their password."
        >
          <Field label="Role" htmlFor="role" required>
            <RoleSelect defaultValue={role} disabled={isSelf} />
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                You can&apos;t change your own role.
              </p>
            )}
          </Field>
          <Field label="Reset password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="text"
              minLength={8}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters. Share the new password with them privately.
            </p>
          </Field>
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {isSelf ? (
            <span className="text-xs text-muted-foreground">
              You can&apos;t delete your own account.
            </span>
          ) : (
            <DeleteTeamMemberButton
              id={id}
              name={fullName || email}
            />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              href="/team"
              className={
                buttonVariants({ variant: "ghost" }) +
                " w-full justify-center sm:w-auto"
              }
            >
              Cancel
            </Link>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="font-heading text-xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-primary text-xs" aria-hidden>
            •
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

function RoleSelect({
  defaultValue,
  disabled,
}: {
  defaultValue: "admin" | "staff";
  disabled?: boolean;
}) {
  return (
    <select
      id="role"
      name="role"
      defaultValue={defaultValue}
      disabled={disabled}
      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <option value="staff">Bartender — read-only access to bottles</option>
      <option value="admin">Manager — full access, can manage team</option>
    </select>
  );
}

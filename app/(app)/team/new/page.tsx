import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createTeamMember } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function NewTeamMemberPage() {
  await requireAdmin();

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
            Invite
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
            Add a team member
          </h1>
          <p className="text-sm text-muted-foreground">
            Create their account and share the password with them.
          </p>
        </div>
      </div>

      <form action={createTeamMember} className="space-y-6">
        <FormSection
          title="Person"
          description="Their name and email address."
        >
          <Field label="Full name" htmlFor="full_name" required>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Jane Doe"
              required
            />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@yourstore.com"
              autoComplete="off"
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Access"
          description="Choose their role and set an initial password to share."
        >
          <Field label="Role" htmlFor="role" required>
            <RoleSelect defaultValue="staff" />
          </Field>
          <Field label="Initial password" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="text"
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">
              Share this password with them privately. They can change it later.
            </p>
          </Field>
        </FormSection>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
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
            Create account
          </Button>
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

function RoleSelect({ defaultValue }: { defaultValue: "admin" | "staff" }) {
  return (
    <select
      id="role"
      name="role"
      defaultValue={defaultValue}
      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
    >
      <option value="staff">Staff — read-only access to products</option>
      <option value="admin">Admin — full access, can manage team</option>
    </select>
  );
}

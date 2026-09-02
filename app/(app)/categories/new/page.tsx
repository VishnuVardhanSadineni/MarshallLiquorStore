import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createCategory } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="space-y-3">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Back to categories
        </Link>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
            New aisle
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
            Add a category
          </h1>
          <p className="text-sm text-muted-foreground">
            Give it a short name like &ldquo;Bourbon&rdquo; or &ldquo;Craft
            Beer&rdquo;.
          </p>
        </div>
      </div>

      <form action={createCategory} className="space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Name
              <span className="text-primary text-xs" aria-hidden>
                •
              </span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Bourbon"
              maxLength={60}
              required
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/categories"
            className={
              buttonVariants({ variant: "ghost" }) +
              " w-full justify-center sm:w-auto"
            }
          >
            Cancel
          </Link>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Add category
          </Button>
        </div>
      </form>
    </div>
  );
}

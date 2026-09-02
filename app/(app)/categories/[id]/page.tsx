import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCategory } from "./actions";
import { DeleteCategoryButton } from "./delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, products(count)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const name = data.name as string;
  const bottleCount =
    Array.isArray(data.products) && data.products[0]?.count
      ? Number(data.products[0].count)
      : 0;

  const boundUpdate = updateCategory.bind(null, id);

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
            Edit aisle
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bottleCount} bottle{bottleCount === 1 ? "" : "s"} in this category.
          </p>
        </div>
      </div>

      <form action={boundUpdate} className="space-y-6">
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
              defaultValue={name}
              maxLength={60}
              required
            />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <DeleteCategoryButton
            id={id}
            name={name}
            bottleCount={bottleCount}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

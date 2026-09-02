import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import { PhotoPicker } from "../../photo-picker";
import { ToggleSwitch } from "../toggle-switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default async function NewProductPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  const categories = (categoriesData ?? []) as { id: string; name: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span> Back to products
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-primary font-medium">
              New bottle
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
              Add a bottle
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter what&apos;s on the label. You can always edit later.
            </p>
          </div>
        </div>
      </div>

      <form action={createProduct} className="space-y-6" encType="multipart/form-data">
        <FormSection
          title="Visibility"
          description="Control where this bottle appears."
        >
          <ToggleSwitch
            name="is_active"
            label="Active"
            description="Visible to customers on the storefront."
            defaultChecked
          />
          <ToggleSwitch
            name="is_special"
            label="Featured"
            description="Show in This Week's Special on the home page."
          />
        </FormSection>

        <FormSection
          title="Photo"
          description="A shot of the label helps staff spot the bottle in a hurry."
        >
          <PhotoPicker />
        </FormSection>

        <FormSection
          title="Basics"
          description="What's on the shelf — name, category, and SKU."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" required>
              <Input
                id="sku"
                name="sku"
                placeholder="SKU-001"
                required
              />
            </Field>
            <Field label="Category" htmlFor="category_id">
              <CategorySelect categories={categories} />
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No categories yet.{" "}
                  <Link
                    href="/categories/new"
                    className="text-primary hover:underline"
                  >
                    Add one first
                  </Link>{" "}
                  to sort your bottles.
                </p>
              )}
            </Field>
          </div>
          <Field label="Name" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Buffalo Trace Bourbon 750ml"
              required
            />
          </Field>
          <Field label="Tasting notes" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Region, vintage, ABV, food pairing — whatever your staff should know."
            />
          </Field>
        </FormSection>

        <FormSection
          title="Pricing"
          description="What you charge and, optionally, what it costs you."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Sale price" htmlFor="price" required>
              <MoneyInput id="price" name="price" required />
            </Field>
            <Field label="Purchase cost" htmlFor="cost">
              <MoneyInput id="cost" name="cost" />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Stock"
          description="How many bottles are on the shelf right now."
        >
          <Field label="Bottles on hand" htmlFor="stock" required>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="1"
              min="0"
              defaultValue={0}
              className="max-w-[180px]"
              required
            />
          </Field>
        </FormSection>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/products"
            className={
              buttonVariants({ variant: "ghost" }) +
              " w-full justify-center sm:w-auto"
            }
          >
            Cancel
          </Link>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Add bottle
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

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: { id: string; name: string }[];
  defaultValue?: string | null;
}) {
  return (
    <select
      id="category_id"
      name="category_id"
      defaultValue={defaultValue ?? ""}
      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
    >
      <option value="">Uncategorized</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function MoneyInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
        $
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        {...props}
        className={"pl-7 " + (props.className ?? "")}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { updateProduct } from "./actions";
import { DeleteButton } from "./delete-button";
import { PhotoPicker } from "../photo-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price: string;
  cost: string | null;
  stock: number;
  image_url: string | null;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const [{ data, error }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, sku, name, description, category_id, price, cost, stock, image_url",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (error || !data) notFound();
  const product = data as Product;
  const categories = (categoriesData ?? []) as { id: string; name: string }[];

  const boundUpdate = updateProduct.bind(null, product.id);

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
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary font-medium">
              <span className="font-mono normal-case tracking-normal">
                {product.sku}
              </span>
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
              {isAdmin ? "Edit bottle" : product.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? `Update the shelf details for ${product.name}.`
                : "Read-only view. Ask an admin if the details need changing."}
            </p>
          </div>
        </div>
      </div>

      <form action={boundUpdate} className="space-y-6" encType="multipart/form-data">
        <fieldset disabled={!isAdmin} className="space-y-6 group">
          <FormSection
            title="Photo"
            description={
              isAdmin
                ? "A shot of the label helps staff spot the bottle in a hurry."
                : "Label photo."
            }
          >
            <PhotoPicker currentUrl={product.image_url} disabled={!isAdmin} />
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
                  defaultValue={product.sku}
                  required
                />
              </Field>
              <Field label="Category" htmlFor="category_id">
                <CategorySelect
                  categories={categories}
                  defaultValue={product.category_id}
                />
                {categories.length === 0 && isAdmin && (
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
                defaultValue={product.name}
                required
              />
            </Field>
            <Field label="Tasting notes" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={product.description ?? ""}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Pricing"
            description="What you charge and, optionally, what it costs you."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Sale price" htmlFor="price" required>
                <MoneyInput
                  id="price"
                  name="price"
                  defaultValue={product.price}
                  required
                />
              </Field>
              <Field label="Purchase cost" htmlFor="cost">
                <MoneyInput
                  id="cost"
                  name="cost"
                  defaultValue={product.cost ?? ""}
                />
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
                defaultValue={product.stock}
                className="max-w-[180px]"
                required
              />
            </Field>
          </FormSection>
        </fieldset>

        {isAdmin ? (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <DeleteButton id={product.id} name={product.name} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-6">
            <Link
              href="/products"
              className={buttonVariants({ variant: "ghost" })}
            >
              Back
            </Link>
          </div>
        )}
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
      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-60 disabled:cursor-not-allowed"
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

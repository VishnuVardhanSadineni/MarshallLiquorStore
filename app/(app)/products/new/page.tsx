import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createProduct } from "../actions";
import { PhotoPicker } from "../photo-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default async function NewProductPage() {
  await requireAdmin();

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
              New item
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl leading-none text-foreground">
              Add a product
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details below. You can always edit them later.
            </p>
          </div>
        </div>
      </div>

      <form action={createProduct} className="space-y-6" encType="multipart/form-data">
        <FormSection
          title="Photo"
          description="A picture helps staff recognize the product at a glance."
        >
          <PhotoPicker />
        </FormSection>

        <FormSection
          title="Basics"
          description="The identifying details customers and staff will recognize."
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
            <Field label="Category" htmlFor="category">
              <Input
                id="category"
                name="category"
                placeholder="e.g. Apparel, Grocery, Hardware"
              />
            </Field>
          </div>
          <Field label="Name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="Product name" required />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="A short description your team will see when browsing."
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
          description="How many units are on hand right now."
        >
          <Field label="Quantity" htmlFor="stock" required>
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
            Create product
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

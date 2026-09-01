import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { updateProduct } from "./actions";
import { DeleteButton } from "./delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  cost: string | null;
  stock: number;
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

  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, description, category, price, cost, stock")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const product = data as Product;

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? "Edit product" : product.name}
        </h1>
        <Link href="/products" className={buttonVariants({ variant: "ghost" })}>
          Back
        </Link>
      </div>

      <form action={boundUpdate} className="space-y-4">
        <fieldset disabled={!isAdmin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue={product.category ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.price}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.cost ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                defaultValue={product.stock}
                required
              />
            </div>
          </div>
        </fieldset>

        {isAdmin && (
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <DeleteButton id={product.id} name={product.name} />
          </div>
        )}
      </form>
    </div>
  );
}

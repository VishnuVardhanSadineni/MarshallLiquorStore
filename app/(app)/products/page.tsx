import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products")
    .select("id, sku, name, category, price, stock")
    .order("created_at", { ascending: false })
    .limit(500);

  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load products: {error.message}
      </div>
    );
  }

  const rows = (products ?? []) as Product[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        {isAdmin && (
          <Link href="/products/new" className={buttonVariants()}>
            Add product
          </Link>
        )}
      </div>

      <form className="flex gap-2" action="/products" method="get">
        <Input
          name="q"
          placeholder="Search by name or SKU"
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          {isAdmin
            ? "No products yet. Add your first product."
            : "No products yet."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      {isAdmin ? "Edit" : "View"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

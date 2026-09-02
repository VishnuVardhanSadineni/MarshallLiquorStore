"use client";

import { toast } from "sonner";
import { useCart, type CartItem } from "./cart-provider";

export function AddToCartButton({
  product,
  size = "md",
}: {
  product: Omit<CartItem, "quantity">;
  size?: "sm" | "md";
}) {
  const { addItem, items } = useCart();
  const inCart = items.find((i) => i.productId === product.productId)?.quantity ?? 0;

  const base =
    "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/85 active:translate-y-px";
  const sizeCls = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        toast.success(
          inCart > 0 ? `Added another ${product.name}` : `${product.name} added to cart`,
        );
      }}
      className={base + " " + sizeCls}
      aria-label={`Add ${product.name} to cart`}
    >
      {inCart > 0 ? `In cart · ${inCart}` : "Add to cart"}
    </button>
  );
}

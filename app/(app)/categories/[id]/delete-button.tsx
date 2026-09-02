"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { isNextControlFlowError } from "@/lib/next-error";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
  bottleCount,
}: {
  id: string;
  name: string;
  bottleCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        Delete category
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {bottleCount > 0 ? (
              <>
                {bottleCount} bottle{bottleCount === 1 ? "" : "s"} in this
                category will become <strong>Uncategorized</strong>. You can
                re-assign them anytime from the product page.
              </>
            ) : (
              <>This cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteCategory(id);
                } catch (err) {
                  if (isNextControlFlowError(err)) throw err;
                  setOpen(false);
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to delete category",
                  );
                }
              })
            }
          >
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

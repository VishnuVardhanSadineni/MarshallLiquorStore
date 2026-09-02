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
import { deleteOrder } from "./actions";

export function DeleteOrderButton({
  id,
  orderNumber,
}: {
  id: string;
  orderNumber: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        Delete order
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the order and its items permanently. Cannot be undone.
            To keep records, mark it Cancelled instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteOrder(id);
                } catch (err) {
                  if (isNextControlFlowError(err)) throw err;
                  setOpen(false);
                  toast.error(
                    err instanceof Error ? err.message : "Failed to delete",
                  );
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

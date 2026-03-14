'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';

import { cancelOrder, deleteOrder } from '~/lib/orders/orders-actions.server';
import type { OrderStatus } from '~/lib/orders/types';
import pathsConfig from '~/config/paths.config';
import { toast } from 'sonner';

export function OrderActions({
  orderId,
  displayId,
  status,
}: {
  orderId: string;
  displayId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCancel = status !== 'cancelled' && status !== 'delivered';

  async function handleCancel() {
    setCancelLoading(true);
    const { error } = await cancelOrder(orderId, null);
    setCancelLoading(false);
    setCancelConfirmOpen(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Order cancelled');
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteOrder(orderId);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Order deleted');
    router.push(pathsConfig.app.orders);
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelConfirmOpen(true)}
            disabled={cancelLoading}
            className="gap-1.5"
          >
            {cancelLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            Cancel order
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={cancelLoading || deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete order
        </Button>
      </div>

      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Cancel order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order #{displayId}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

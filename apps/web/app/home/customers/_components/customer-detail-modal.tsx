'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Button } from '@kit/ui/button';

import { StatusBadge } from '~/components/orders/status-badge';
import { deleteCustomer, getCustomerById } from '~/lib/orders/customers.server';
import pathsConfig from '~/config/paths.config';
import type { OrderStatus } from '~/lib/orders/types';
import { format } from 'date-fns';
import { formatIndianMobile } from '~/lib/phone';

type CustomerData = Awaited<ReturnType<typeof getCustomerById>>;

export function CustomerDetailModal({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !customerId) {
      setData(null);
      return;
    }
    setLoading(true);
    getCustomerById(customerId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [open, customerId]);

  async function handleDelete() {
    if (!customerId) return;
    setDeleting(true);
    const { error } = await deleteCustomer(customerId);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Customer deleted');
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? data.name : loading ? 'Loading...' : 'Customer'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading customer…</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Customer Details</CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete customer
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  {data.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Mobile:</span>{' '}
                  {formatIndianMobile(data.mobile)}
                </p>
                {data.email && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {data.email}
                  </p>
                )}
                {data.address && (
                  <p>
                    <span className="text-muted-foreground">Address:</span>{' '}
                    {data.address}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order History ({data.orders?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {!data.orders?.length ? (
                  <p className="text-muted-foreground text-sm">No orders yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map(
                        (order: {
                          id: string;
                          display_id: string | null;
                          status: OrderStatus;
                          created_at: string;
                        }) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Link
                                href={`${pathsConfig.app.orders}/${order.id}`}
                                className="font-medium hover:underline"
                              >
                                #{order.display_id ?? order.id.slice(0, 8)}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(order.created_at), 'PP')}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`${pathsConfig.app.orders}/${order.id}`}
                                  onClick={() => onOpenChange(false)}
                                >
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the customer record. Any orders linked to this customer will be kept but will no longer show the customer link. This cannot be undone.
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

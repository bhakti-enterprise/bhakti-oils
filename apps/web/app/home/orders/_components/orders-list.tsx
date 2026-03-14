'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, MoreVertical, Trash2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
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
import { toast } from 'sonner';

import { NewOrderButton } from '~/home/_components/new-order-button';
import { StatusBadge } from '~/components/orders/status-badge';
import pathsConfig from '~/config/paths.config';
import type { OrderStatus } from '~/lib/orders/types';
import { ORDER_STATUS_LABELS } from '~/lib/orders/types';
import { formatDistanceToNow } from 'date-fns';
import { deleteOrder, updateOrderStatus } from '~/lib/orders/orders-actions.server';
import { formatIndianMobile } from '~/lib/phone';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  ...(Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))),
];

type OrderRow = {
  id: string;
  display_id: string | null;
  customer_name: string;
  customer_mobile: string;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name: string | null;
};

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export function OrdersList({
  initialData,
  page: initialPage,
  statusFilter,
  search: initialSearch,
  total: totalCount = 0,
}: {
  initialData?: OrderRow[];
  page: number;
  statusFilter?: string;
  search?: string;
  total?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(statusFilter ?? 'all');
  const [search, setSearch] = useState(initialSearch ?? '');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<OrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const orders = initialData ?? [];
  const totalPages = Math.ceil(totalCount / 25) || 1;

  function applyFilters() {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    startTransition(() => {
      router.push(`${pathsConfig.app.orders}?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (status && status !== 'all') params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    startTransition(() => {
      router.push(`${pathsConfig.app.orders}?${params.toString()}`);
    });
  }

  async function handleQuickStatusChange(order: OrderRow, toStatus: OrderStatus) {
    if (toStatus === order.status) return;
    setUpdatingOrderId(order.id);
    const { error } = await updateOrderStatus(order.id, toStatus, null);
    setUpdatingOrderId(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(`Order updated to ${ORDER_STATUS_LABELS[toStatus]}`);
    router.refresh();
  }

  async function handleDeleteOrder(order: OrderRow) {
    setDeleting(true);
    const { error } = await deleteOrder(order.id);
    setDeleting(false);
    setDeleteConfirmOrder(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Order deleted');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by Order ID, customer name, or mobile..."
            className="max-w-sm"
            defaultValue={initialSearch}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isPending}
          />
          <Select value={status} onValueChange={setStatus} disabled={isPending}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyFilters} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying…
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Showing {orders.length} of {totalCount} orders
        </p>
      </div>

      <div className="relative rounded-md border">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-muted-foreground">No orders found. Try adjusting filters or create a new order.</p>
                  <div className="mt-4">
                    <NewOrderButton />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`${pathsConfig.app.orders}/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      #{order.display_id ?? order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{formatIndianMobile(order.customer_mobile)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {order.creator_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="View order">
                        <Link href={`${pathsConfig.app.orders}/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={updatingOrderId === order.id || isPending}
                            aria-label="Change status"
                          >
                            {updatingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ALL_STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={s === order.status}
                              onClick={() => handleQuickStatusChange(order, s)}
                            >
                              {ORDER_STATUS_LABELS[s]}
                              {s === order.status && ' (current)'}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Delete order"
                        onClick={() => setDeleteConfirmOrder(order)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={initialPage <= 1 || isPending}
            onClick={() => goToPage(Math.max(1, initialPage - 1))}
          >
            {isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            {isPending ? 'Loading…' : `Page ${initialPage} of ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={initialPage >= totalPages || isPending}
            onClick={() => goToPage(initialPage + 1)}
          >
            Next
            {isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : null}
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteConfirmOrder} onOpenChange={(open) => !open && setDeleteConfirmOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order
              {deleteConfirmOrder && ` #${deleteConfirmOrder.display_id ?? deleteConfirmOrder.id.slice(0, 8)}`}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmOrder) handleDeleteOrder(deleteConfirmOrder);
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
    </div>
  );
}

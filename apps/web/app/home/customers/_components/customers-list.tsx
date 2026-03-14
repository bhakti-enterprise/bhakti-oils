'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';

import { CustomerDetailModal } from '~/home/customers/_components/customer-detail-modal';
import { StatusBadge } from '~/components/orders/status-badge';
import type { CustomerWithStats } from '~/lib/orders/types';
import type { OrderStatus } from '~/lib/orders/types';
import pathsConfig from '~/config/paths.config';
import { formatDistanceToNow } from 'date-fns';
import { formatIndianMobile } from '~/lib/phone';

export function CustomersList({
  initialData,
  page: initialPage,
  search: initialSearch,
  total: totalCount = 0,
}: {
  initialData: CustomerWithStats[];
  page: number;
  search?: string;
  total: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch ?? '');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customers = initialData ?? [];
  const totalPages = Math.ceil(totalCount / 25) || 1;

  function applySearch() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    startTransition(() => {
      router.push(`${pathsConfig.app.customers}?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (search.trim()) params.set('search', search.trim());
    startTransition(() => {
      router.push(`${pathsConfig.app.customers}?${params.toString()}`);
    });
  }

  function openCustomerDetail(id: string) {
    setSelectedCustomerId(id);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name or mobile number"
          className="max-w-sm"
          defaultValue={initialSearch}
          onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isPending}
        />
        <Button onClick={applySearch} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching…
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No customers found. Customers are created when you create orders.
          </CardContent>
        </Card>
      ) : (
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {customers.map((c) => (
            <Card
              key={c.id}
              role="button"
              tabIndex={0}
              className="hover:bg-muted/50 transition-colors cursor-pointer h-full"
              onClick={() => openCustomerDetail(c.id)}
              onKeyDown={(e) => e.key === 'Enter' && openCustomerDetail(c.id)}
            >
              <CardContent className="pt-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-muted-foreground text-sm">{formatIndianMobile(c.mobile)}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {c.total_orders ?? 0} orders
                  {c.last_order_date && (
                    <> · Last order {formatDistanceToNow(new Date(c.last_order_date), { addSuffix: true })}</>
                  )}
                </p>
                {c.last_order_status && (
                  <StatusBadge status={c.last_order_status as OrderStatus} className="mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        customerId={selectedCustomerId}
      />

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
    </div>
  );
}

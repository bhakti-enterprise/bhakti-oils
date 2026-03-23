import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import { OrderDetailClient } from '~/home/orders/[id]/_components/order-detail-client';
import { OrderActions } from '~/home/orders/[id]/_components/order-actions';
import { getOrderById } from '~/lib/orders/orders.server';
import { format } from 'date-fns';

/** Convert UTC date string to IST (UTC+5:30) before formatting */
function formatIST(dateStr: string): string {
  const utc = new Date(dateStr);
  const ist = new Date(utc.getTime() + (5 * 60 + 30) * 60 * 1000);
  return format(ist, 'dd MMM yyyy, hh:mm a') + ' IST';
}
import { StatusBadge } from '~/components/orders/status-badge';
import { formatIndianMobile } from '~/lib/phone';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const displayId = order.display_id ?? order.id.slice(0, 8);
  const formattedMobile = formatIndianMobile(order.customer_mobile);
  const telHref = (() => {
    const digits = order.customer_mobile.replace(/\D/g, '');
    if (!digits) return '';
    const withCountry = digits.startsWith('91') ? digits : `91${digits}`;
    return `+${withCountry}`;
  })();

  return (
    <>
      <PageHeader
        title={`Order #${displayId}`}
        description={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AppBreadcrumbs values={{ [id]: `#${displayId}` }} />
              <StatusBadge status={order.status} />
            </div>
            <span className="text-muted-foreground mt-1 block text-xs">
              Created {formatIST(order.created_at)}
            </span>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Order ID:</span> #{displayId}</p>
                <p><span className="text-muted-foreground">Created by:</span> {order.creator_name ?? '—'}</p>
                <p><span className="text-muted-foreground">Created at:</span> {formatIST(order.created_at)}</p>
                <p><span className="text-muted-foreground">Last updated:</span> {formatIST(order.updated_at)}</p>
                {order.notes && (
                  <div className="pt-1">
                    <p className="text-muted-foreground mb-0.5">Description:</p>
                    <p className="rounded-md bg-muted/40 px-3 py-2 leading-relaxed">{order.notes}</p>
                  </div>
                )}
                <OrderActions orderId={order.id} displayId={displayId} status={order.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {order.customer_name}</p>
                <p>
                  <span className="text-muted-foreground">Mobile:</span>{' '}
                  <a href={`tel:${telHref}`} className="text-primary hover:underline">
                    {formattedMobile}
                  </a>
                </p>
                {order.customer_address && (
                  <div className="pt-1">
                    <p className="text-muted-foreground mb-0.5">Address:</p>
                    <p className="rounded-md bg-muted/40 px-3 py-2 leading-relaxed">{order.customer_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <OrderDetailClient order={order} />
          </div>
        </div>
      </PageBody>
    </>
  );
}

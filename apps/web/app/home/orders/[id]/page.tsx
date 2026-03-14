import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import { OrderDetailClient } from '~/home/orders/[id]/_components/order-detail-client';
import { OrderActions } from '~/home/orders/[id]/_components/order-actions';
import { getOrderById } from '~/lib/orders/orders.server';
import { format } from 'date-fns';
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
              Created {format(new Date(order.created_at), 'PPp')}
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
                <p><span className="text-muted-foreground">Created at:</span> {format(new Date(order.created_at), 'PPp')}</p>
                <p><span className="text-muted-foreground">Last updated:</span> {format(new Date(order.updated_at), 'PPp')}</p>
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

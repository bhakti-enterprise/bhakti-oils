import { PageBody, PageHeader } from '@kit/ui/page';

import { NewOrderButton } from '~/home/_components/new-order-button';
import { OrdersList } from '~/home/orders/_components/orders-list';
import { getOrders } from '~/lib/orders/orders.server';
import type { OrderStatus } from '~/lib/orders/types';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const status = params.status && params.status !== 'all' ? params.status : undefined;
  const search = params.search?.trim() || undefined;

  const { orders, total } = await getOrders(page, {
    status: status as OrderStatus | undefined,
    search,
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description="Manage and track all orders"
      >
        <NewOrderButton />
      </PageHeader>

      <PageBody>
        <OrdersList
          initialData={orders}
          page={page}
          statusFilter={status}
          search={search}
          total={total}
        />
      </PageBody>
    </>
  );
}

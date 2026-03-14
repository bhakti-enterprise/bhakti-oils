import { PageBody, PageHeader } from '@kit/ui/page';

import { CustomersList } from '~/home/customers/_components/customers-list';
import { getCustomersList } from '~/lib/orders/customers.server';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search?.trim() || undefined;

  const { customers, total } = await getCustomersList(page, search);

  return (
    <>
      <PageHeader
        title="Customers"
        description="All customers identified by mobile number"
      />
      <PageBody>
        <CustomersList initialData={customers} page={page} search={search} total={total} />
      </PageBody>
    </>
  );
}

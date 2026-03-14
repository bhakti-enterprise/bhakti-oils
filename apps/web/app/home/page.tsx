import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardOrders } from '~/home/_components/dashboard-orders';
import { NewOrderButton } from '~/home/_components/new-order-button';

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      >
        <NewOrderButton />
      </PageHeader>

      <PageBody className="pb-5">
        <DashboardOrders />
      </PageBody>
    </>
  );
}

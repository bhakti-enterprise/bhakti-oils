import { PageBody, PageHeader } from '@kit/ui/page';

import { EnableBrowserNotifications } from '~/home/notifications/_components/enable-browser-notifications';
import { NotificationsList } from '~/home/notifications/_components/notifications-list';
import { getNotifications } from '~/lib/orders/notifications.server';

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const { notifications, total, unreadCount } = await getNotifications(page);

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
      />
      <PageBody>
        <div className="space-y-4">
          <EnableBrowserNotifications />
          <NotificationsList
            initialData={notifications}
            page={page}
            total={total}
            unreadCount={unreadCount}
          />
        </div>
      </PageBody>
    </>
  );
}

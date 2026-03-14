'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';

import pathsConfig from '~/config/paths.config';
import { markAllNotificationsRead } from '~/lib/orders/notifications.server';
import { format, formatDistanceToNow } from 'date-fns';

type NotificationRow = {
  id: string;
  order_id: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function NotificationsList({
  initialData,
  page: initialPage,
  total,
  unreadCount,
}: {
  initialData: NotificationRow[];
  page: number;
  total: number;
  unreadCount: number;
}) {
  const router = useRouter();
  const [markingRead, setMarkingRead] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notifications = initialData ?? [];
  const totalPages = Math.ceil(total / 20) || 1;

  useEffect(() => setMounted(true), []);

  async function handleMarkAllRead() {
    setMarkingRead(true);
    await markAllNotificationsRead();
    router.refresh();
    setMarkingRead(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingRead}>
          {markingRead && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {markingRead ? 'Marking…' : 'Mark all as read'}
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          You're all caught up! No notifications.
        </div>
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className={n.read ? 'text-muted-foreground' : 'font-medium'}>
                  {n.message}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {mounted
                    ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                    : format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {n.order_id && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${pathsConfig.app.orders}/${n.order_id}`}>View order</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground text-sm">
            Page {initialPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}

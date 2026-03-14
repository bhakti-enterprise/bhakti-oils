'use client';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

import type { OrderStatus } from '~/lib/orders/types';
import { ORDER_STATUS_LABELS } from '~/lib/orders/types';

const statusVariants: Record<OrderStatus, string> = {
  pending: 'bg-muted text-muted-foreground border-muted-foreground/30',
  accepted: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  ready_for_delivery: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  out_for_delivery: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  delivered: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', statusVariants[status], className)}
    >
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

import Link from 'next/link';

import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { DashboardCharts } from '~/home/_components/dashboard-charts';
import type { StatusCountItem, VolumeDataPoint } from '~/home/_components/dashboard-charts';
import { StatusBadge } from '~/components/orders/status-badge';
import {
  getDashboardStats,
  getOrderCountsByStatus,
  getOrderVolumeLast7Days,
} from '~/lib/orders/orders.server';
import pathsConfig from '~/config/paths.config';
import { format, formatDistanceToNow } from 'date-fns';
import type { OrderStatus } from '~/lib/orders/types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#64748b',
  accepted: '#3b82f6',
  ready_for_delivery: '#f59e0b',
  out_for_delivery: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  ready_for_delivery: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDayName(dateStr: string) {
  const d = new Date(dateStr);
  return format(d, 'EEE d');
}

export async function DashboardOrders() {
  const [stats, statusCountsRaw, volumeRaw] = await Promise.all([
    getDashboardStats(),
    getOrderCountsByStatus(),
    getOrderVolumeLast7Days(),
  ]);

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }
  const volumeByDate = new Map(
    volumeRaw.map((row: Record<string, unknown>) => {
      const date = row.date as string;
      let total = 0;
      const statuses = [
        'pending',
        'accepted',
        'ready_for_delivery',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ];
      for (const s of statuses) {
        total += (row[s] as number) ?? 0;
      }
      return [date, { date, dayName: formatDayName(date), total, ...row }];
    }),
  );
  const volumeData: VolumeDataPoint[] = last7Days.map((date) =>
    volumeByDate.get(date)
      ? volumeByDate.get(date)!
      : { date, dayName: formatDayName(date), total: 0 },
  );

  const statusCounts: StatusCountItem[] = Object.entries(statusCountsRaw).map(
    ([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      fill: STATUS_COLORS[status] ?? '#94a3b8',
      status,
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      {/* KPI cards - colorful */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total orders today
            </CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalOrdersToday}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Pending
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Out for delivery
            </CardTitle>
            <Truck className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {stats.outForDeliveryCount}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Delivered today
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {stats.deliveredTodayCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts volumeData={volumeData} statusCounts={statusCounts} />

      {/* Recent orders + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent orders</CardTitle>
              <CardDescription>Last 10 orders</CardDescription>
            </div>
            <Link
              href={pathsConfig.app.orders}
              className="text-primary text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground text-center"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentOrders.map((order: Record<string, unknown>) => (
                    <TableRow
                      key={order.id as string}
                      className="hover:bg-primary/5"
                    >
                      <TableCell>
                        <Link
                          href={`${pathsConfig.app.orders}/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{order.display_id ?? order.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span>{order.customer_name as string}</span>
                        <span className="text-muted-foreground ml-1 text-xs">
                          {(order.customer_mobile as string)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            order.status as OrderStatus
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(order.created_at as string), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`${pathsConfig.app.orders}/${order.id}`}
                          className="text-primary text-sm hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Latest status updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {stats.recentTimeline.length === 0 ? (
                <li className="text-muted-foreground text-sm">
                  No activity yet
                </li>
              ) : (
                stats.recentTimeline.map((event: Record<string, unknown>) => {
                  const order = event.orders as { display_id?: string } | null;
                  const displayId =
                    order?.display_id ?? (event.order_id as string)?.slice(0, 8);
                  const toStatus = (event.to_status as string) ?? '';
                  const color =
                    STATUS_COLORS[toStatus] ?? 'var(--muted-foreground)';
                  return (
                    <li
                      key={event.id as string}
                      className="flex gap-3 border-l-2 pl-4"
                      style={{ borderColor: color }}
                    >
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium">
                          Order #{displayId} →{' '}
                          {(STATUS_LABELS[toStatus] ?? toStatus).replace(
                            /_/g,
                            ' ',
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          by {(event.display_name ?? event.changed_by_name) as string} ·{' '}
                          {formatDistanceToNow(
                            new Date(event.created_at as string),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
            <Link
              href={pathsConfig.app.notifications}
              className="text-primary mt-4 block text-sm font-medium hover:underline"
            >
              View all notifications
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

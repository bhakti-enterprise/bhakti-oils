import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { StatusBadge } from '~/components/orders/status-badge';
import { getCustomerById } from '~/lib/orders/customers.server';
import pathsConfig from '~/config/paths.config';
import type { OrderStatus } from '~/lib/orders/types';
import { format } from 'date-fns';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerById(id);
  if (!data) notFound();

  const { orders, ...customer } = data;

  return (
    <>
      <PageHeader
        title={customer.name}
        description={
          <>
            <AppBreadcrumbs values={{ [id]: customer.name }} />
            <span className="text-muted-foreground mt-1 block text-xs">
              {customer.mobile}
            </span>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {customer.name}</p>
              <p><span className="text-muted-foreground">Mobile:</span> {customer.mobile}</p>
              {customer.email && <p><span className="text-muted-foreground">Email:</span> {customer.email}</p>}
              {customer.address && <p><span className="text-muted-foreground">Address:</span> {customer.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: { id: string; display_id: string | null; status: OrderStatus; created_at: string }) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link href={`${pathsConfig.app.orders}/${order.id}`} className="font-medium hover:underline">
                            #{order.display_id ?? order.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(order.created_at), 'PP')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`${pathsConfig.app.orders}/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

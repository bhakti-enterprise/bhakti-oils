'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';

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

export type VolumeDataPoint = {
  date: string;
  dayName: string;
  total: number;
  [key: string]: number | string;
};

export type StatusCountItem = {
  name: string;
  value: number;
  fill: string;
  status: string;
};

export function DashboardCharts({
  volumeData,
  statusCounts,
}: {
  volumeData: VolumeDataPoint[];
  statusCounts: StatusCountItem[];
}) {
  const barConfig = {
    total: {
      label: 'Orders',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  const pieConfig = Object.fromEntries(
    Object.entries(STATUS_COLORS).map(([status]) => [
      status,
      { label: STATUS_LABELS[status] ?? status, color: STATUS_COLORS[status] },
    ]),
  ) satisfies ChartConfig;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3 border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Order volume — last 7 days</CardTitle>
          <CardDescription>Orders created per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer id="dashboard-volume-chart" config={barConfig} className="h-[260px] w-full">
            <BarChart
              data={volumeData}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="dayName"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => [`${value} orders`, 'Total']}
                  />
                }
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--color-total)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Status distribution</CardTitle>
          <CardDescription>Orders by current status</CardDescription>
        </CardHeader>
        <CardContent>
          {statusCounts.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
              No orders yet
            </div>
          ) : (
            <>
              <ChartContainer id="dashboard-status-chart" config={pieConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) => [
                          `${value} orders`,
                          (item.payload as { status?: string })?.status
                            ? STATUS_LABELS[(item.payload as { status?: string }).status!] ?? name
                            : name,
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={statusCounts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {statusCounts.map((item) => (
                  <span
                    key={item.status}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

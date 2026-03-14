'use client';

import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@kit/ui/card';

export function KPICard({
  title,
  value,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <Card
      className={onClick ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-muted-foreground text-sm font-medium">{title}</span>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

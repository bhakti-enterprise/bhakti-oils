import { Bell, Home, Package, Users } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.dashboard',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.orders',
        path: pathsConfig.app.orders,
        Icon: <Package className={iconClasses} />,
      },
      {
        label: 'common:routes.customers',
        path: pathsConfig.app.customers,
        Icon: <Users className={iconClasses} />,
      },
      {
        label: 'common:notifications',
        path: pathsConfig.app.notifications,
        Icon: <Bell className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: 'false',
  sidebarCollapsedStyle: 'none',
});

import { use } from 'react';

import { cookies } from 'next/headers';

import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { navigationConfig } from '~/config/navigation.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { getUnreadCount } from '~/lib/orders/notifications.server';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

// home imports
import { HomeMenuNavigation } from './_components/home-menu-navigation';
import { HomeMobileNavigation } from './_components/home-mobile-navigation';
import { HomeSidebar } from './_components/home-sidebar';
import { NotificationsRealtime } from './_components/notifications-realtime';

function HomeLayout({ children }: React.PropsWithChildren) {
  const style = use(getLayoutStyle());

  if (style === 'sidebar') {
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  return <HeaderLayout>{children}</HeaderLayout>;
}

export default withI18n(HomeLayout);

function SidebarLayout({ children }: React.PropsWithChildren) {
  const [user, unreadCount] = use(
    Promise.all([requireUserInServerComponent(), getUnreadCount()]),
  );

  const notificationBadge =
    unreadCount > 0 ? { [pathsConfig.app.notifications]: unreadCount } : undefined;

  return (
    <SidebarProvider defaultOpen={true}>
      <NotificationsRealtime />
      <Page style={'sidebar'}>
        <PageNavigation>
          <HomeSidebar user={user} badgeByPath={notificationBadge} />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <MobileNavigation />
        </PageMobileNavigation>

        {children}
      </Page>
    </SidebarProvider>
  );
}

function HeaderLayout({ children }: React.PropsWithChildren) {
  return (
    <>
      <NotificationsRealtime />
      <Page style={'header'}>
        <PageNavigation>
          <HomeMenuNavigation />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <MobileNavigation />
        </PageMobileNavigation>

        {children}
      </Page>
    </>
  );
}

function MobileNavigation() {
  return (
    <>
      <AppLogo />

      <HomeMobileNavigation />
    </>
  );
}

async function getLayoutStyle() {
  const cookieStore = await cookies();

  return (
    (cookieStore.get('layout-style')?.value as PageLayoutStyle) ??
    navigationConfig.style
  );
}

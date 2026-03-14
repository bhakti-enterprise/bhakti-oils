'use client';

import { useEffect, useState } from 'react';
import type { JwtPayload } from '@supabase/supabase-js';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';

import pathsConfig from '~/config/paths.config';

const paths = {
  home: pathsConfig.app.home,
  profileSettings: pathsConfig.app.profileSettings,
};

const features = {
  enableThemeToggle: false,
};

export function ProfileAccountDropdownContainer(props: {
  user?: JwtPayload;
  showProfileName?: boolean;

  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!userData) {
    return null;
  }

  if (!mounted) {
    return (
      <div
        className="animate-in fade-in flex cursor-pointer items-center gap-x-4 rounded-md p-2 duration-500"
        aria-hidden
      >
        <div className="h-9 w-9 shrink-0 rounded-md border bg-muted" />
        {props.showProfileName !== false && (
          <div className="flex min-w-0 flex-1 flex-col truncate text-left">
            <span className="truncate text-sm">&nbsp;</span>
            <span className="text-muted-foreground truncate text-xs">&nbsp;</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <PersonalAccountDropdown
      className={'w-full'}
      paths={paths}
      features={features}
      user={userData}
      account={props.account}
      signOutRequested={() => signOut.mutateAsync()}
      showProfileName={props.showProfileName}
    />
  );
}

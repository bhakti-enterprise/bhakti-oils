import { use } from 'react';

import { PersonalAccountSettingsContainer } from '@kit/accounts/personal-account-settings';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import {
  ensurePersonalAccount,
  ensurePersonalAccountAction,
} from '~/lib/account/ensure-personal-account.server';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

const callbackPath = pathsConfig.auth.callback;

const features = {
  enableAccountDeletion: true,
  enablePasswordUpdate: authConfig.providers.password,
};

const paths = {
  callback: callbackPath + `?next=${pathsConfig.app.profileSettings}`,
};

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:settingsTab');

  return {
    title,
  };
};

async function PersonalAccountSettingsPage() {
  const user = await requireUserInServerComponent();
  const supabase = getSupabaseServerClient();
  // Ensure account row exists (auth only creates auth.users; accounts row may be missing if trigger failed or was added later)
  await ensurePersonalAccount(supabase, { id: user.id, email: user.email });

  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col lg:max-w-2xl'}>
        <PersonalAccountSettingsContainer
          userId={user.id}
          paths={paths}
          features={features}
          onRetry={ensurePersonalAccountAction}
        />
      </div>
    </PageBody>
  );
}

export default withI18n(PersonalAccountSettingsPage);

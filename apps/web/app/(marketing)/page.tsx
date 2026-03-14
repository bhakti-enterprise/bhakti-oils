import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export default async function MarketingHomePage() {
  const client = getSupabaseServerClient();
  const { data } = await client.auth.getUser();
  if (data?.user) {
    redirect(pathsConfig.app.home);
  }
  redirect(pathsConfig.auth.signIn);
}

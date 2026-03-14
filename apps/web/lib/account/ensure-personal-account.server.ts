'use server';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

/**
 * Ensures the current user has a row in public.accounts (e.g. if they signed up
 * before the auth trigger existed). Inserts only when missing; does not overwrite.
 */
export async function ensurePersonalAccount(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<void> {
  const name =
    (user.email && user.email.trim().split('@')[0]) || 'User';
  await supabase
    .from('accounts')
    .upsert(
      {
        id: user.id,
        name: name.slice(0, 255),
        email: user.email?.trim() ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
}

/**
 * Server action: ensure current user's account row exists, then the client can refetch.
 * Call this when the settings page shows "Could not load account" and user clicks Retry.
 */
export async function ensurePersonalAccountAction(): Promise<{ ok: boolean }> {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  if (result.error || !result.data) {
    return { ok: false };
  }
  const user = result.data;
  await ensurePersonalAccount(supabase, { id: user.id, email: user.email });
  return { ok: true };
}

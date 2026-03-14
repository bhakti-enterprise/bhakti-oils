'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

const PAGE_SIZE = 20;

export async function getNotifications(page: number = 1, unreadOnly?: boolean) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [], total: 0, unreadCount: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Exclude notifications triggered by the current user (actor_user_id = me)
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .or(`actor_user_id.is.null,actor_user_id.neq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error, count } = await query;

  if (error) return { notifications: [], total: 0, unreadCount: 0 };

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .or(`actor_user_id.is.null,actor_user_id.neq.${user.id}`)
    .eq('read', false);

  return {
    notifications: data ?? [],
    total: count ?? 0,
    unreadCount: unreadCount ?? 0,
  };
}

export async function getUnreadCount(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .or(`actor_user_id.is.null,actor_user_id.neq.${user.id}`)
    .eq('read', false);
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseServerClient();
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ read: true })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .or(`actor_user_id.is.null,actor_user_id.neq.${user.id}`);
}

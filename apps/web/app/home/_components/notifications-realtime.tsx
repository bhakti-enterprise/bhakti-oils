'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

/**
 * Subscribes to new notifications in realtime, refreshes the app so lists/counts update,
 * and shows a browser notification when the user has granted permission and the tab is in background.
 * Refreshes on mount and on window focus so in-app list stays in sync even if Realtime is unavailable.
 * Uses Supabase auth directly (not useUser) so this component does not require QueryClientProvider.
 */
export function NotificationsRealtime() {
  const supabase = useSupabase();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const permissionAsked = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  const refresh = useCallback(() => routerRef.current.refresh(), []);

  // Resolve current user from Supabase auth so we don't depend on React Query / QueryClientProvider
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUserId(user?.id ?? null);
      });
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!userId || !supabase) return;

    // One-time refresh on mount so any notifications created while tab was closed appear (fallback if Realtime didn't fire)
    const mountRefresh = setTimeout(refresh, 500);

    // Request browser notification permission once (non-blocking). Browsers may ignore unless triggered by user gesture; use the "Enable notifications" button on the notifications page.
    if (typeof window !== 'undefined' && 'Notification' in window && !permissionAsked.current) {
      permissionAsked.current = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    const handleNewNotification = (payload: { new?: Record<string, unknown> }) => {
      const row = payload.new as {
        user_id?: string | null;
        actor_user_id?: string | null;
        message?: string;
        id?: string;
      };
      const isRelevant = row.user_id === null || row.user_id === userId;
      const notTriggeredByMe = row.actor_user_id == null || row.actor_user_id !== userId;
      const isForMe = isRelevant && notTriggeredByMe;
      if (!isForMe) return;

      refresh();

      // Only show browser notification when tab is in background (avoids duplicate with in-app update when tab is focused)
      const tabVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        !tabVisible
      ) {
        try {
          const n = new Notification('New notification', {
            body: row.message ?? 'You have a new notification',
            tag: row.id ?? undefined,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {
          // ignore
        }
      }
    };

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        handleNewNotification,
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(
            'NotificationsRealtime: Realtime channel error. Ensure migration 20250313000000_notifications_realtime.sql is applied (adds notifications to supabase_realtime publication).',
          );
        }
      });

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      clearTimeout(mountRefresh);
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, refresh]);

  return null;
}

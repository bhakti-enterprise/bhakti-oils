'use client';

import { useEffect, useState } from 'react';

import { Bell } from 'lucide-react';

import { Button } from '@kit/ui/button';

/**
 * Shown when Notification.permission is 'default'. Clicking the button (user gesture)
 * requests permission so browsers that require user gesture will grant it.
 */
export function EnableBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const isDefault =
    typeof window !== 'undefined' && 'Notification' in window && (permission ?? Notification.permission) === 'default';

  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  async function handleEnable() {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } finally {
      setRequesting(false);
    }
  }

  if (!isDefault && permission !== 'default') return null;

  return (
    <div className="bg-muted/50 border-border flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Bell className="text-muted-foreground h-5 w-5" />
        <span className="text-muted-foreground text-sm">
          Enable browser notifications to get alerts when you're not on this tab.
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={handleEnable} disabled={requesting}>
        {requesting ? 'Requesting…' : 'Enable notifications'}
      </Button>
    </div>
  );
}

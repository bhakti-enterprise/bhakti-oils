'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Circle, Loader2, MessageSquarePlus, Star, XCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { addOrderFeedback, updateOrderStatus } from '~/lib/orders/orders-actions.server';
import type { OrderStatus } from '~/lib/orders/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS } from '~/lib/orders/types';

/** Convert UTC ISO string to IST before formatting */
function formatIST(dateStr: string): string {
  const utc = new Date(dateStr);
  const ist = new Date(utc.getTime() + (5 * 60 + 30) * 60 * 1000);
  return format(ist, 'dd MMM yyyy, hh:mm a') + ' IST';
}

const FLOW: OrderStatus[] = ['pending', 'accepted', 'ready_for_delivery', 'out_for_delivery', 'delivered'];

const FLOW_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  ready_for_delivery: 'Ready',
  out_for_delivery: 'Out',
  delivered: 'Delivered',
};

type TimelineEvent = {
  id: string;
  to_status: string;
  changed_by_name?: string;
  display_name?: string;
  created_at: string;
  note?: string | null;
};

type OrderData = {
  id: string;
  display_id: string | null;
  status: OrderStatus;
  notes: string | null;
  timeline?: unknown[];
};

export function OrderDetailClient({ order }: { order: OrderData }) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const currentIndex = FLOW.indexOf(order.status);
  const isTerminal = order.status === 'cancelled' || order.status === 'delivered';
  const timeline = (order.timeline ?? []) as TimelineEvent[];

  async function handleSubmitFeedback() {
    if (!feedbackRating) return;
    setFeedbackLoading(true);
    const { error } = await addOrderFeedback(order.id, feedbackRating, feedbackText || null);
    setFeedbackLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Feedback submitted');
    setFeedbackSubmitted(true);
    router.refresh();
  }

  async function handleUpdateStatus() {
    if (!selectedStatus) return;
    setLoading(true);
    const { error } = await updateOrderStatus(order.id, selectedStatus, note || null);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Order updated to ${ORDER_STATUS_LABELS[selectedStatus]}`);
    setSelectedStatus(null);
    setNote('');
    router.refresh();
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 py-4">
          <h3 className="text-lg font-semibold">Status & timeline</h3>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {ORDER_STATUS_DESCRIPTIONS[order.status]}
          </p>
        </div>

        {/* Horizontal progress bar (segmented) - only for active flow */}
        {order.status !== 'cancelled' && (
          <div className="px-5 pb-4">
            <div className="flex gap-0.5 rounded-lg overflow-hidden bg-muted/60 p-0.5">
              {FLOW.map((step, i) => {
                const isDone = currentIndex > i;
                const isCurrent = order.status === step;
                return (
                  <div
                    key={step}
                    className={cn(
                      'h-2 flex-1 min-w-0 rounded-sm transition-colors',
                      isDone && 'bg-primary',
                      isCurrent && !isDone && 'bg-primary/80',
                      !isDone && !isCurrent && 'bg-muted',
                    )}
                    title={ORDER_STATUS_LABELS[step]}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
              {FLOW.map((step) => (
                <span key={step} className="truncate" style={{ width: '20%' }}>
                  {FLOW_LABELS[step]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {order.status === 'cancelled' && (
          <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">This order has been cancelled.</span>
          </div>
        )}

        {/* Status dropdown + optional note */}
        {!isTerminal && (
          <div className="border-t border-border/60 px-5 py-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Select
                value={selectedStatus ?? order.status}
                onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
              >
                <SelectTrigger className="w-full sm:max-w-[220px] font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {FLOW.map((s) => {
                    const isDone = FLOW.indexOf(s) < currentIndex;
                    const isCurrent = order.status === s;
                    return (
                      <SelectItem key={s} value={s} className="gap-2">
                        <span className="flex items-center gap-2">
                          {isDone ? (
                            <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                          ) : isCurrent ? (
                            <Circle className="h-4 w-4 shrink-0 fill-primary text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          {ORDER_STATUS_LABELS[s]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateStatus}
                disabled={!selectedStatus || selectedStatus === order.status || loading}
                className="sm:shrink-0 gap-1.5"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Updating…' : 'Update status'}
              </Button>
            </div>
            <Textarea
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="resize-none bg-muted/30 text-sm border-muted"
            />
          </div>
        )}

        {/* Feedback section */}
        <div className="border-t border-border/60 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Feedback
            </p>
          </div>
          {feedbackSubmitted ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Feedback submitted. Thank you!
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    onMouseEnter={() => setFeedbackHover(star)}
                    onMouseLeave={() => setFeedbackHover(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        (feedbackHover || feedbackRating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/40',
                      )}
                    />
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackRating]}
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Add feedback comments (optional)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={2}
                className="resize-none bg-muted/30 text-sm border-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitFeedback}
                disabled={!feedbackRating || feedbackLoading}
                className="gap-1.5"
              >
                {feedbackLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {feedbackLoading ? 'Submitting…' : 'Submit Feedback'}
              </Button>
            </div>
          )}
        </div>

        {/* Timeline history */}
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
            History
          </p>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium capitalize">
                      {(event.to_status as string).replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      by {(event.display_name ?? event.changed_by_name) ?? '—'} ·{' '}
                      {formatIST(event.created_at)}
                    </span>
                    {event.note && (
                      <span className="text-muted-foreground mt-0.5 italic text-xs">
                        {event.note}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

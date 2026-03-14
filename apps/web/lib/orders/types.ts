/**
 * Order Management Portal - TypeScript types
 * Mirrors Supabase schema from migration 20250307000000_order_management.sql
 */

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type NotificationType =
  | 'order_created'
  | 'status_update'
  | 'order_cancelled'
  | 'system';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  display_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  status: OrderStatus;
  created_by: string;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface OrderTimelineEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  order_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

/** Order with optional creator name for display */
export interface OrderWithCreator extends Order {
  creator_name?: string | null;
}

/** Customer with aggregated order stats */
export interface CustomerWithStats extends Customer {
  total_orders?: number;
  last_order_date?: string | null;
  last_order_status?: OrderStatus | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Order created, no action taken yet.',
  accepted: 'Team has acknowledged and accepted the order.',
  ready_for_delivery: 'Order is packed and ready for pickup.',
  out_for_delivery: 'Delivery is en route to the customer.',
  delivered: 'Customer has received the order.',
  cancelled: 'Order was cancelled.',
};

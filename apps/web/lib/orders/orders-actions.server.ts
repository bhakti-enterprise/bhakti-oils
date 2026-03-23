'use server';

import { revalidatePath } from 'next/cache';

import type { User } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

import { upsertCustomer } from './customers.server';
import type { OrderStatus } from './types';

/** Prefer account name, then auth user_metadata (full_name / name), then email. */
async function getDisplayName(supabase: ReturnType<typeof getSupabaseServerClient>, user: User): Promise<string> {
  const account = await supabase.from('accounts').select('name').eq('id', user.id).single();
  const accountName = account.data?.name?.trim();
  if (accountName) return accountName;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = typeof meta?.full_name === 'string' ? meta.full_name.trim() : '';
  if (fullName) return fullName;
  const name = typeof meta?.name === 'string' ? meta.name.trim() : '';
  if (name) return name;

  return user.email ?? 'Unknown';
}

export interface CreateOrderInput {
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  order_description: string;
}

export async function createOrder(input: CreateOrderInput): Promise<{ id?: string; display_id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  let customerId = input.customer_id;
  if (!customerId) {
    const { id, error: custError } = await upsertCustomer(
      input.customer_name,
      input.customer_mobile,
      null,
      input.customer_address.trim() || null,
    );
    if (custError) return { error: custError };
    customerId = id;
  }

  const createdByName = await getDisplayName(supabase, user);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      customer_name: input.customer_name,
      customer_mobile: input.customer_mobile,
      notes: input.order_description.trim(),
      created_by: user.id,
      created_by_name: createdByName,
      status: 'pending',
    })
    .select('id, display_id')
    .single();

  if (orderError) {
    console.error('createOrder error', orderError);
    return { error: orderError.message };
  }
  if (!order) return { error: 'Failed to create order' };

  await supabase.from('order_timeline').insert({
    order_id: order.id,
    from_status: null,
    to_status: 'pending',
    changed_by_user_id: user.id,
    changed_by_name: createdByName,
    note: null,
  });

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: null,
    actor_user_id: user.id,
    order_id: order.id,
    type: 'order_created',
    message: `${createdByName} created Order #${order.display_id ?? order.id} for ${input.customer_name}`,
    read: false,
  });
  if (notifError) console.error('createOrder notification insert:', notifError);

  revalidatePath(pathsConfig.app.home);
  revalidatePath(pathsConfig.app.orders);
  return {
    id: order.id,
    display_id: order.display_id ?? order.id.slice(0, 8),
  };
}

export async function updateOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  note?: string | null,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, display_id, customer_name')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) return { error: 'Order not found' };
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return { error: 'Cannot change status of cancelled or delivered order' };
  }

  const changedByName = await getDisplayName(supabase, user);

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) return { error: updateError.message };

  await supabase.from('order_timeline').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: toStatus,
    changed_by_user_id: user.id,
    changed_by_name: changedByName,
    note: note ?? null,
  });

  const msg = `Order #${order.display_id ?? orderId} is now ${toStatus.replace(/_/g, ' ')}`;
  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: null,
    actor_user_id: user.id,
    order_id: orderId,
    type: 'status_update',
    message: `${changedByName}: ${msg}`,
    read: false,
  });
  if (notifError) console.error('updateOrderStatus notification insert:', notifError);

  revalidatePath(pathsConfig.app.home);
  revalidatePath(pathsConfig.app.orders);
  revalidatePath(`${pathsConfig.app.orders}/${orderId}`);
  return {};
}

export async function cancelOrder(orderId: string, reason?: string | null): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, display_id, customer_name')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) return { error: 'Order not found' };
  if (order.status === 'cancelled') return { error: 'Order is already cancelled' };
  if (order.status === 'delivered') return { error: 'Cannot cancel delivered order' };

  const changedByName = await getDisplayName(supabase, user);

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) return { error: updateError.message };

  await supabase.from('order_timeline').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: 'cancelled',
    changed_by_user_id: user.id,
    changed_by_name: changedByName,
    note: reason ?? null,
  });

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: null,
    actor_user_id: user.id,
    order_id: orderId,
    type: 'order_cancelled',
    message: `Order #${order.display_id ?? orderId} was cancelled by ${changedByName}`,
    read: false,
  });
  if (notifError) console.error('cancelOrder notification insert:', notifError);

  revalidatePath(pathsConfig.app.home);
  revalidatePath(pathsConfig.app.orders);
  revalidatePath(`${pathsConfig.app.orders}/${orderId}`);
  return {};
}

export async function addOrderFeedback(
  orderId: string,
  rating: number,
  feedbackText: string | null,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();
  if (!order) return { error: 'Order not found' };

  const changedByName = await getDisplayName(supabase, user);
  const stars = '⭐'.repeat(Math.min(5, Math.max(1, rating)));
  const note = feedbackText?.trim()
    ? `Feedback ${stars}: ${feedbackText.trim()}`
    : `Feedback ${stars}`;

  await supabase.from('order_timeline').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: order.status,
    changed_by_user_id: user.id,
    changed_by_name: changedByName,
    note,
  });

  revalidatePath(`${pathsConfig.app.orders}/${orderId}`);
  return {};
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error: fetchError } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single();

  if (fetchError) return { error: 'Order not found' };

  const { error: deleteError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath(pathsConfig.app.home);
  revalidatePath(pathsConfig.app.orders);
  return {};
}

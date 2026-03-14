'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { OrderStatus } from './types';

/** Prefer name; else email local part; else full email. */
function resolveDisplayName(name: string, email: string): string {
  if (name.length > 0) return name;
  const e = email.trim();
  if (!e) return '';
  const local = e.split('@')[0];
  return (local && local.length > 0) ? local : e;
}

/** If stored value looks like an email, show part before @; otherwise show as-is. */
function friendlyNameFromStored(stored: string): string {
  if (!stored?.trim()) return stored ?? '';
  return stored.includes('@') ? stored.trim().split('@')[0] : stored.trim();
}

export interface OrdersFilter {
  status?: OrderStatus | null;
  createdBy?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
}

export interface OrdersListResult {
  orders: Array<{
    id: string;
    display_id: string | null;
    customer_name: string;
    customer_mobile: string;
    status: OrderStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    creator_name: string | null;
  }>;
  total: number;
}

const PAGE_SIZE = 25;

export async function getOrders(
  page: number = 1,
  filter: OrdersFilter = {},
): Promise<OrdersListResult> {
  const supabase = getSupabaseServerClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('orders')
    .select(
      'id, display_id, customer_name, customer_mobile, status, created_by, created_by_name, created_at, updated_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter.status) {
    query = query.eq('status', filter.status);
  }
  if (filter.createdBy) {
    query = query.eq('created_by', filter.createdBy);
  }
  if (filter.dateFrom) {
    query = query.gte('created_at', filter.dateFrom);
  }
  if (filter.dateTo) {
    query = query.lte('created_at', filter.dateTo);
  }
  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    query = query.or(
      `display_id.ilike.${term},customer_name.ilike.${term},customer_mobile.ilike.${term}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('getOrders error', error);
    return { orders: [], total: 0 };
  }

  const rows = data ?? [];
  const creatorIds = new Set<string>();
  for (const row of rows) {
    const uid = (row as Record<string, unknown>).created_by as string;
    if (uid) creatorIds.add(uid);
  }
  let creatorNameById: Record<string, string> = {};
  if (creatorIds.size > 0) {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, email')
      .in('id', Array.from(creatorIds));
    if (accounts?.length) {
      creatorNameById = Object.fromEntries(
        accounts.map((a: { id: string; name?: string | null; email?: string | null }) => [
          a.id,
          resolveDisplayName((a.name ?? '').trim(), (a.email ?? '').trim()),
        ]).filter(([, n]) => n.length > 0),
      );
    }
  }

  const orders = rows.map((row: Record<string, unknown>) => {
    const createdBy = row.created_by as string;
    const stored = (row.created_by_name as string) ?? '';
    const creatorName = creatorNameById[createdBy] ?? (friendlyNameFromStored(stored) || null);
    return {
      id: row.id as string,
      display_id: row.display_id as string | null,
      customer_name: row.customer_name as string,
      customer_mobile: row.customer_mobile as string,
      status: row.status as OrderStatus,
      created_by: createdBy,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      creator_name: creatorName,
    };
  });

  return { orders, total: count ?? 0 };
}

export async function getOrderById(orderId: string) {
  const supabase = getSupabaseServerClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, display_id, customer_id, customer_name, customer_mobile, status, created_by, created_by_name, created_at, updated_at, notes',
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return null;
  }

  const { data: timeline } = await supabase
    .from('order_timeline')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  const userIds = new Set<string>();
  if (order.created_by) userIds.add(order.created_by);
  for (const e of timeline ?? []) {
    const uid = (e as { changed_by_user_id?: string }).changed_by_user_id;
    if (uid) userIds.add(uid);
  }

  let nameByUserId: Record<string, string> = {};
  if (userIds.size > 0) {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, email')
      .in('id', Array.from(userIds));
    if (accounts?.length) {
      nameByUserId = Object.fromEntries(
        accounts.map((a: { id: string; name?: string | null; email?: string | null }) => [
          a.id,
          resolveDisplayName((a.name ?? '').trim(), (a.email ?? '').trim()),
        ]).filter(([, n]) => n.length > 0),
      );
    }
  }

  const creatorName = nameByUserId[order.created_by] ?? order.created_by_name ?? null;
  const timelineWithNames = (timeline ?? []).map((e: Record<string, unknown>) => {
    const uid = e.changed_by_user_id as string | undefined;
    const stored = (e.changed_by_name as string) ?? '';
    const displayName = uid && nameByUserId[uid] ? nameByUserId[uid] : friendlyNameFromStored(stored);
    return { ...e, display_name: displayName };
  });

  return {
    ...order,
    creator_name: creatorName,
    timeline: timelineWithNames,
  };
}

export async function getDashboardStats() {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const [
    { count: totalToday },
    { count: pending },
    { count: outForDelivery },
    { count: deliveredToday },
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStart).lt('created_at', todayEnd),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'out_for_delivery'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').gte('updated_at', todayStart).lt('updated_at', todayEnd),
  ]);

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, display_id, customer_name, customer_mobile, status, created_by, created_by_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentTimeline } = await supabase
    .from('order_timeline')
    .select('id, order_id, to_status, changed_by_user_id, changed_by_name, created_at, orders(display_id)')
    .order('created_at', { ascending: false })
    .limit(15);

  const timelineList = recentTimeline ?? [];
  const timelineUserIds = new Set<string>();
  for (const e of timelineList) {
    const uid = (e as { changed_by_user_id?: string }).changed_by_user_id;
    if (uid) timelineUserIds.add(uid);
  }
  let timelineNameByUserId: Record<string, string> = {};
  if (timelineUserIds.size > 0) {
    const { data: timelineAccounts } = await supabase
      .from('accounts')
      .select('id, name, email')
      .in('id', Array.from(timelineUserIds));
    if (timelineAccounts?.length) {
      timelineNameByUserId = Object.fromEntries(
        timelineAccounts.map((a: { id: string; name?: string | null; email?: string | null }) => [
          a.id,
          resolveDisplayName((a.name ?? '').trim(), (a.email ?? '').trim()),
        ]).filter(([, n]) => n.length > 0),
      );
    }
  }
  const recentTimelineWithNames = timelineList.map((e: Record<string, unknown>) => {
    const uid = e.changed_by_user_id as string | undefined;
    const stored = (e.changed_by_name as string) ?? '';
    const displayName = uid && timelineNameByUserId[uid] ? timelineNameByUserId[uid] : friendlyNameFromStored(stored);
    return { ...e, display_name: displayName };
  });

  return {
    totalOrdersToday: totalToday ?? 0,
    pendingCount: pending ?? 0,
    outForDeliveryCount: outForDelivery ?? 0,
    deliveredTodayCount: deliveredToday ?? 0,
    recentOrders: recentOrders ?? [],
    recentTimeline: recentTimelineWithNames,
  };
}

export async function getOrderCountsByStatus() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('status');
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

export async function getOrderVolumeLast7Days() {
  const supabase = getSupabaseServerClient();
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const from = d.toISOString();
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, created_at')
    .gte('created_at', from);
  if (error) return [];
  const byDay: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = {};
    byDay[day][row.status] = (byDay[day][row.status] ?? 0) + 1;
  }
  return Object.entries(byDay)
    .map(([date, statusCounts]) => ({ date, ...statusCounts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

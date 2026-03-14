'use server';

import { revalidatePath } from 'next/cache';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import type { CustomerWithStats } from './types';

export async function searchCustomers(query: string, limit: number = 5): Promise<CustomerWithStats[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = getSupabaseServerClient();
  const term = query.trim();

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, mobile, email, address, created_at, updated_at')
    .or(`mobile.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(limit);

  if (error) return [];

  const withStats: CustomerWithStats[] = await Promise.all(
    (customers ?? []).map(async (c) => {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('created_at, status')
        .eq('customer_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', c.id);
      return {
        ...c,
        total_orders: count ?? 0,
        last_order_date: lastOrder?.created_at ?? null,
        last_order_status: lastOrder?.status ?? null,
      };
    }),
  );
  return withStats;
}

export async function getCustomersList(page: number = 1, search?: string | null) {
  const supabase = getSupabaseServerClient();
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from('customers')
    .select('id, name, mobile, email, address, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`mobile.ilike.${term},name.ilike.${term}`);
  }

  const { data, error, count } = await q;
  if (error) return { customers: [], total: 0 };

  const customers = (data ?? []) as CustomerWithStats[];
  for (const c of customers) {
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', c.id);
    const { data: last } = await supabase
      .from('orders')
      .select('created_at, status')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    c.total_orders = totalOrders ?? 0;
    c.last_order_date = last?.created_at ?? null;
    c.last_order_status = last?.status ?? null;
  }

  return { customers, total: count ?? 0 };
}

/** Get customers whose mobile number starts with the given prefix (for dropdown). Prefix = local digits only, e.g. "9" or "98765". */
export async function getCustomersByMobilePrefix(
  prefix: string,
  limit: number = 10,
): Promise<{ id: string; name: string; mobile: string; address: string | null }[]> {
  const localDigits = prefix?.trim().replace(/\D/g, '');
  if (!localDigits) return [];
  const supabase = getSupabaseServerClient();
  const seenIds = new Set<string>();
  const results: { id: string; name: string; mobile: string; address: string | null }[] = [];

  const patterns = [
    `${localDigits}%`,
    `91${localDigits}%`,
    `+91${localDigits}%`,
  ];

  for (const pattern of patterns) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, mobile, address')
      .ilike('mobile', pattern)
      .limit(limit);
    if (error) continue;
    for (const row of data ?? []) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        results.push(row as { id: string; name: string; mobile: string; address: string | null });
        if (results.length >= limit) break;
      }
    }
    if (results.length >= limit) break;
  }

  return results;
}

/** Get customer by exact mobile for auto-fill (e.g. in create order form) */
export async function getCustomerByMobile(mobile: string): Promise<{ id: string; name: string; mobile: string; address: string | null } | null> {
  const trimmed = mobile?.trim();
  if (!trimmed) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, mobile, address')
    .eq('mobile', trimmed)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; name: string; mobile: string; address: string | null };
}

export async function getCustomerById(customerId: string) {
  const supabase = getSupabaseServerClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (error || !customer) return null;

  const { data: orders } = await supabase
    .from('orders')
    .select('id, display_id, status, created_at, updated_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return { ...customer, orders: orders ?? [] };
}

/** Upsert customer by mobile; returns id and whether it was inserted */
export async function upsertCustomer(name: string, mobile: string, email?: string | null, address?: string | null) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .upsert(
      { name, mobile, email: email ?? null, address: address ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'mobile' },
    )
    .select('id')
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

/** Delete a customer. Orders referencing this customer will have customer_id set to null (FK on delete set null). */
export async function deleteCustomer(customerId: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('customers').delete().eq('id', customerId);
  if (error) return { error: error.message };
  revalidatePath(pathsConfig.app.customers);
  return {};
}

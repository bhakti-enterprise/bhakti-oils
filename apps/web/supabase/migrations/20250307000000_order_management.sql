/*
 * -------------------------------------------------------
 * Order Management Portal - Schema
 * customers, orders, order_timeline, notifications
 * -------------------------------------------------------
 */

-- Order status enum
create type public.order_status as enum (
  'pending',
  'accepted',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Notification type enum
create type public.notification_type as enum (
  'order_created',
  'status_update',
  'order_cancelled',
  'system'
);

-- -------------------------------------------------------
-- Customers (unique by mobile)
-- -------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default extensions.uuid_generate_v4(),
  name varchar(255) not null,
  mobile varchar(20) not null unique,
  email varchar(320),
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customers_mobile on public.customers (mobile);
create index if not exists idx_customers_name_lower on public.customers (lower(name));
comment on table public.customers is 'Unique customers identified by mobile number';

alter table public.customers enable row level security;

create policy customers_all_authenticated on public.customers
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.customers to authenticated;

-- -------------------------------------------------------
-- Orders
-- -------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default extensions.uuid_generate_v4(),
  display_id varchar(20) unique,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name varchar(255) not null,
  customer_mobile varchar(20) not null,
  status public.order_status not null default 'pending',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_by_name varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  notes text
);

create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_created_by on public.orders (created_by);
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_display_id on public.orders (display_id);

comment on table public.orders is 'Order management records';

alter table public.orders enable row level security;

create policy orders_all_authenticated on public.orders
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.orders to authenticated;

-- Trigger: generate display_id (ORD-0001, ORD-0002, ...)
create or replace function kit.next_order_display_id() returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_num int;
begin
  select coalesce(max((regexp_replace(display_id, '^ORD-', ''))::int), 0) + 1
  into next_num
  from public.orders;
  return 'ORD-' || lpad(next_num::text, 4, '0');
end;
$$;

grant execute on function kit.next_order_display_id() to authenticated;

-- Trigger: set display_id before insert if not provided
create or replace function kit.set_order_display_id() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.display_id is null or new.display_id = '' then
    new.display_id := kit.next_order_display_id();
  end if;
  return new;
end;
$$;

create trigger set_order_display_id_trigger
  before insert on public.orders
  for each row
  when (new.display_id is null or new.display_id = '')
  execute function kit.set_order_display_id();

-- -------------------------------------------------------
-- Order timeline (status history)
-- -------------------------------------------------------
create table if not exists public.order_timeline (
  id uuid primary key default extensions.uuid_generate_v4(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by_user_id uuid not null references auth.users (id) on delete restrict,
  changed_by_name varchar(255) not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_order_timeline_order_id on public.order_timeline (order_id);
create index if not exists idx_order_timeline_created_at on public.order_timeline (created_at desc);

alter table public.order_timeline enable row level security;

create policy order_timeline_all_authenticated on public.order_timeline
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.order_timeline to authenticated;

-- -------------------------------------------------------
-- Notifications (in-app, persisted)
-- -------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  type public.notification_type not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_order_id on public.notifications (order_id);
create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
create index if not exists idx_notifications_read on public.notifications (read) where read = false;

comment on table public.notifications is 'In-app notifications; user_id null = broadcast to all';

alter table public.notifications enable row level security;

create policy notifications_own_or_broadcast on public.notifications
  for all to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

grant select, insert, update, delete on public.notifications to authenticated;


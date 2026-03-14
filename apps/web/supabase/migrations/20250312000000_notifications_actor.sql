-- Add actor_user_id so we can exclude the acting user from seeing their own action notifications
alter table public.notifications
  add column if not exists actor_user_id uuid references auth.users;

comment on column public.notifications.actor_user_id is 'User who triggered this notification; they will not see it in their list';

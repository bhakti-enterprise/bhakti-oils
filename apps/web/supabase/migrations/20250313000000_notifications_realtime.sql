-- Enable Realtime for notifications so clients can subscribe to new rows
alter publication supabase_realtime add table public.notifications;

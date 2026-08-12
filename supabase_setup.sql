-- 1. Create user_settings table
create table if not exists public.user_settings (
  user_id uuid references auth.users on delete cascade not null primary key,
  ai_provider text default 'auto',
  cf_account_id text,
  cf_api_token text,
  gemini_api_key text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_settings enable row level security;

-- Drop old policies if they exist
drop policy if exists "Users can select their own settings" on public.user_settings;
drop policy if exists "Users can upsert their own settings" on public.user_settings;

-- Create Policies
create policy "Users can select their own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can upsert their own settings" on public.user_settings
  for all using (auth.uid() = user_id);


-- 2. Create ip_usage table for guest rate-limiting
create table if not exists public.ip_usage (
  ip text not null primary key,
  count integer default 0 not null,
  last_request timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.ip_usage enable row level security;

-- Drop old policies if they exist
drop policy if exists "Public read access to ip_usage" on public.ip_usage;
drop policy if exists "Public insert/update to ip_usage" on public.ip_usage;

-- Create Policies (allow anyone to read/write guest IP counters)
create policy "Public read access to ip_usage" on public.ip_usage
  for select using (true);

create policy "Public insert/update to ip_usage" on public.ip_usage
  for all using (true);

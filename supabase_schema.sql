-- CardGamers.io Database Schema
-- Run this entire file in your Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'plus', 'club')),
  rating integer default 1000,
  games_played integer default 0,
  games_won integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Game history
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  game_type text not null,
  result text check (result in ('win','loss','draw')),
  score integer default 0,
  duration_seconds integer,
  played_at timestamp with time zone default timezone('utc'::text, now())
);

-- Leaderboard view
create or replace view public.leaderboard as
  select
    p.username,
    p.rating,
    p.games_played,
    p.games_won,
    round(case when p.games_played > 0 then (p.games_won::decimal / p.games_played) * 100 else 0 end, 1) as win_pct
  from public.profiles p
  order by p.rating desc
  limit 100;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.game_history enable row level security;

-- Policies: users can read all profiles, only edit their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Game history: users see only their own
create policy "Users see own history" on public.game_history for select using (auth.uid() = user_id);
create policy "Users insert own history" on public.game_history for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

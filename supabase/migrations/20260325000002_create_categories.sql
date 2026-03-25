-- =============================================================
-- Migration: Create categories table
-- =============================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.categories enable row level security;

-- Everyone can read active categories
create policy "Anyone can view active categories"
  on public.categories for select
  using (is_active = true);

-- Admins can do everything
create policy "Admins can manage categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-update updated_at
create trigger categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

-- =============================================================
-- Migration: Create plants table with full-text search
-- =============================================================

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

create table public.plants (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.categories(id) on delete restrict,
  name            text not null,
  slug            text not null unique,
  description     text not null default '',
  short_description text not null default '',
  price_paise     int not null check (price_paise > 0),
  compare_at_price_paise int,  -- strikethrough price for discounts
  stock_quantity  int not null default 0 check (stock_quantity >= 0),
  image_url       text,
  images          text[] not null default '{}',  -- additional image URLs
  care_level      text not null default 'medium' check (care_level in ('easy', 'medium', 'hard', 'expert')),
  sunlight        text not null default 'indirect' check (sunlight in ('full_sun', 'partial', 'indirect', 'low_light')),
  watering        text not null default 'moderate' check (watering in ('daily', 'moderate', 'weekly', 'minimal')),
  growth_time     text,         -- e.g., "6-12 months to fruit"
  max_height      text,         -- e.g., "2-3 meters"
  origin          text,         -- e.g., "Southeast Asia"
  care_tips       text,         -- detailed care instructions
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index plants_category_id_idx on public.plants(category_id);
create index plants_is_active_idx on public.plants(is_active) where is_active = true;
create index plants_is_featured_idx on public.plants(is_featured) where is_featured = true;
create index plants_name_trgm_idx on public.plants using gin (name gin_trgm_ops);
create index plants_price_idx on public.plants(price_paise);

-- Enable RLS
alter table public.plants enable row level security;

-- Everyone can read active plants
create policy "Anyone can view active plants"
  on public.plants for select
  using (is_active = true);

-- Admins can do everything (including viewing inactive)
create policy "Admins can manage plants"
  on public.plants for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-update updated_at
create trigger plants_updated_at
  before update on public.plants
  for each row
  execute function public.set_updated_at();

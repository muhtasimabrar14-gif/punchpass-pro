-- Fix triggers: use drop-if-exists then create
-- 1) Enums (idempotent: create if not exists not supported for types)
DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM ('owner','admin','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('booked','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Utility function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Profiles table and triggers
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Drop and recreate trigger to avoid IF NOT EXISTS
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Ensure only one trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Organizations and membership
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  primary_color text,
  logo_url text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
create trigger update_organizations_updated_at
before update on public.organizations
for each row execute function public.update_updated_at_column();

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
alter table public.org_members enable row level security;

create index if not exists idx_org_members_user on public.org_members(user_id);

-- 5) Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  start_at timestamptz not null,
  duration_mins int not null default 60,
  capacity int not null default 10,
  published boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.classes enable row level security;

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
create trigger update_classes_updated_at
before update on public.classes
for each row execute function public.update_updated_at_column();

create index if not exists idx_classes_org_start on public.classes(org_id, start_at);

-- 6) Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  pass_type text,
  status public.booking_status not null default 'booked',
  booked_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create index if not exists idx_bookings_class on public.bookings(class_id);

-- Capacity enforcement trigger (drop + create)
create or replace function public.enforce_class_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_booked int;
  max_capacity int;
begin
  if (tg_op = 'INSERT' and new.status = 'booked') then
    select count(*) into current_booked from public.bookings where class_id = new.class_id and status='booked';
    select capacity into max_capacity from public.classes where id = new.class_id;
    if current_booked >= max_capacity then
      raise exception 'Class is full';
    end if;
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_enforce_class_capacity ON public.bookings;
create trigger trg_enforce_class_capacity
before insert on public.bookings
for each row execute procedure public.enforce_class_capacity();

-- 7) RLS Policies
-- profiles
create policy if not exists "Profiles are viewable by self"
  on public.profiles for select
  using (id = auth.uid());
create policy if not exists "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());
create policy if not exists "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- organizations
create policy if not exists "Org members can view org"
  on public.organizations for select to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid()
  ));
create policy if not exists "Authenticated can create org"
  on public.organizations for insert to authenticated
  with check (created_by = auth.uid());
create policy if not exists "Org admins can update org"
  on public.organizations for update to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));
create policy if not exists "Org owners can delete org"
  on public.organizations for delete to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- org_members
create policy if not exists "Users view their memberships"
  on public.org_members for select to authenticated
  using (user_id = auth.uid());
create policy if not exists "Users can insert own membership"
  on public.org_members for insert to authenticated
  with check (user_id = auth.uid());
create policy if not exists "Admins manage org members"
  on public.org_members for update to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));
create policy if not exists "Owners remove org members"
  on public.org_members for delete to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- classes
create policy if not exists "Public can view published classes"
  on public.classes for select to anon
  using (published = true);
create policy if not exists "Members view org classes"
  on public.classes for select to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid()
  ));
create policy if not exists "Admins create classes"
  on public.classes for insert to authenticated
  with check (
    exists (select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
    and created_by = auth.uid()
  );
create policy if not exists "Admins update classes"
  on public.classes for update to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));
create policy if not exists "Admins delete classes"
  on public.classes for delete to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));

-- bookings
create policy if not exists "Members view bookings"
  on public.bookings for select to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid()
  ));
create policy if not exists "Public can create booking"
  on public.bookings for insert to anon
  with check (exists (
    select 1 from public.classes c where c.id = class_id and c.published = true
  ));
create policy if not exists "Users can create booking"
  on public.bookings for insert to authenticated
  with check (exists (
    select 1 from public.classes c where c.id = class_id and c.published = true
  ));
create policy if not exists "Admins update bookings"
  on public.bookings for update to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));
create policy if not exists "Admins delete bookings"
  on public.bookings for delete to authenticated
  using (exists (
    select 1 from public.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
  ));
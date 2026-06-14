-- Migration to link perfiles table with Supabase Auth users

-- 1. Drop existing perfiles table to cleanly recreate it or recreate constraint
-- Since there may be foreign keys pointing to it, we can safely drop constraints or recreate the table if empty.
-- We will modify the table to match the Auth UUID.
drop table if exists perfiles cascade;

-- Recreate perfiles table with UUID referencing auth.users(id)
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  rol text not null check (rol in ('Administrador', 'Administrativo', 'Personal de almacén', 'Coordinador de planta')),
  residencia_ids text[] default '{}'::text[],
  planta_asignada text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Re-enable RLS on perfiles if desired (optional based on user configuration, keeping it simple for now)
alter table perfiles enable row level security;

-- Create policies for perfiles table:
-- 1. Anyone can read profiles (or profiles can be read by authenticated users)
create policy "Allow read for authenticated users" on perfiles
  for select to authenticated using (true);

-- 2. Allow update of own profile, or Admins can update any profile
create policy "Allow update of own profile or by Admin" on perfiles
  for update to authenticated
  using (
    auth.uid() = id or 
    (select rol from perfiles where id = auth.uid()) = 'Administrador'
  );

-- Trigger to automatically create a profile for a new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email, nombre, rol, residencia_ids, planta_asignada)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    -- The first user gets 'Administrador', all others get 'Coordinador de planta'
    case 
      when (select count(*) from public.perfiles) = 0 then 'Administrador'::text
      else 'Coordinador de planta'::text
    end,
    array[]::text[],
    null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

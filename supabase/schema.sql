-- =============================================
-- EduTrack Attendance System - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ───
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin','teacher','student')),
  roll_number text unique,        -- for students only
  section text,                   -- A, B, C
  email text not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Admins and teachers can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admins can insert profiles" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() = id
  );

-- ─── SUBJECTS ───
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null,
  teacher_id uuid references public.profiles(id),
  section text not null,
  created_at timestamptz default now()
);
alter table public.subjects enable row level security;

create policy "Anyone authenticated can view subjects" on public.subjects
  for select using (auth.role() = 'authenticated');
create policy "Teachers/admins can manage subjects" on public.subjects
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

-- ─── ATTENDANCE ───
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','leave')),
  marked_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(student_id, subject_id, date)
);
alter table public.attendance enable row level security;

create policy "Students can view own attendance" on public.attendance
  for select using (auth.uid() = student_id);
create policy "Teachers/admins can view all attendance" on public.attendance
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );
create policy "Teachers/admins can insert attendance" on public.attendance
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );
create policy "Teachers/admins can update attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher'))
  );

-- ─── ATTENDANCE SUMMARY VIEW ───
create or replace view public.attendance_summary as
select
  p.id as student_id,
  p.full_name,
  p.roll_number,
  p.section,
  s.id as subject_id,
  s.name as subject_name,
  s.code as subject_code,
  count(*) filter (where a.status = 'present') as present_count,
  count(*) filter (where a.status = 'absent') as absent_count,
  count(*) filter (where a.status = 'leave') as leave_count,
  count(*) as total_classes,
  round(
    count(*) filter (where a.status = 'present')::numeric / nullif(count(*),0) * 100, 1
  ) as percentage
from public.profiles p
cross join public.subjects s
left join public.attendance a on a.student_id = p.id and a.subject_id = s.id
where p.role = 'student'
group by p.id, p.full_name, p.roll_number, p.section, s.id, s.name, s.code;

-- ─── FUNCTION: auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SEED: Sample subjects ───
-- (Run after creating your first teacher account and replace teacher_id)
-- insert into public.subjects (name, code, section, teacher_id) values
--   ('Data Structures', 'CS301', 'A', '<your-teacher-uuid>'),
--   ('DBMS', 'CS302', 'A', '<your-teacher-uuid>'),
--   ('Operating Systems', 'CS303', 'B', '<your-teacher-uuid>'),
--   ('Computer Networks', 'CS304', 'B', '<your-teacher-uuid>'),
--   ('Software Engineering', 'CS305', 'C', '<your-teacher-uuid>');

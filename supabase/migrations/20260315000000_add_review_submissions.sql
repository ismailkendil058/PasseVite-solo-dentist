
-- Table for review funnel submissions
create table public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  satisfied boolean not null,
  patient_name text,
  phone text,
  feedback text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.review_submissions enable row level security;

-- Policies
create policy "Anyone can insert reviews" on public.review_submissions for insert with check (true);
create policy "Authenticated can read reviews" on public.review_submissions for select to authenticated using (true);

-- Enable realtime
alter publication supabase_realtime add table review_submissions;

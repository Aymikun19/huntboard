-- Interview scheduling: one upcoming interview time per application.
alter table huntboard.applications add column if not exists interview_at timestamptz;
alter table huntboard.applications add column if not exists interview_with text;
create index if not exists applications_interview_idx on huntboard.applications (user_id, interview_at);

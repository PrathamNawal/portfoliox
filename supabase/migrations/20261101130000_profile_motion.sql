-- Portfolio motion level (see lib/motion.ts): still | subtle | expressive. Default 'still' = no change.
-- Keep the values in sync with MOTION_LEVELS in lib/motion.ts.
-- Apply BEFORE deploying the code that writes profiles.motion (published pages tolerate a missing column).

alter table profiles
  add column if not exists motion text not null default 'still';

alter table profiles drop constraint if exists profiles_motion_check;
alter table profiles
  add constraint profiles_motion_check check (motion in ('still','subtle','expressive'));

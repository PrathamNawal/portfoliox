-- "Story" layout for Work Experience (see components/published/ExperienceStory.tsx).
-- All additive; the defaults keep the current look. Apply BEFORE deploying the code that writes these columns
-- (published pages tolerate a missing profiles.exp_story and read the story fields only when the switch is on).

alter table profiles
  add column if not exists exp_story boolean not null default false;

alter table work_experience
  add column if not exists headline    text  check (char_length(headline) <= 140),
  add column if not exists stat_value  text  check (char_length(stat_value) <= 12),
  add column if not exists stat_label  text  check (char_length(stat_label) <= 40),
  add column if not exists screens     jsonb not null default '[]'
    check (jsonb_typeof(screens) = 'array' and jsonb_array_length(screens) <= 12);

-- Optional "~N years" in the Work Experience kicker (profiles.exp_years). Off by default.
-- Apply BEFORE deploying the code that writes it (published pages tolerate a missing column = off).

alter table profiles
  add column if not exists exp_years boolean not null default false;

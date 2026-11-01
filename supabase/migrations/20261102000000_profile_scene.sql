-- Separate on/off for the designer-at-work illustration (see components/scene).
-- Before this, the scene showed for everyone at motion = 'expressive'; keep that for existing profiles.
-- Apply BEFORE deploying the code that writes profiles.scene (published pages tolerate a missing column).

alter table profiles
  add column if not exists scene boolean not null default false;

update profiles set scene = true where motion = 'expressive';

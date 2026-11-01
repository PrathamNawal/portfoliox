-- Published-portfolio theme (see lib/themes.ts and app/themes.css).
-- Apply BEFORE deploying the code that writes profiles.theme. The published pages
-- tolerate a missing column (they fall back to 'light'), but the editor save does not.
-- Keep the id list in sync with THEME_IDS in lib/themes.ts.

alter table profiles
  add column if not exists theme text not null default 'light';

alter table profiles drop constraint if exists profiles_theme_check;
alter table profiles
  add constraint profiles_theme_check check (theme in (
    'light','skeuomorphism','neumorphism','glass','papercut','chrome','inflated','steampunk',
    'isometric','brutalism','minimal','clay','neon','holo','vector','handwritten'
  ));

-- How a case study cover fills card shapes: 'fill' crops to the card, 'fit' shows the whole image
-- over a blurred copy. Keep the values in sync with COVER_FITS in lib/cover.ts.
-- Apply BEFORE deploying the code that writes cover_fit (published pages tolerate a missing column).

alter table case_studies
  add column if not exists cover_fit text not null default 'fill';

alter table case_studies drop constraint if exists case_studies_cover_fit_check;
alter table case_studies
  add constraint case_studies_cover_fit_check check (cover_fit in ('fill','fit'));

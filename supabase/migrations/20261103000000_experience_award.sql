-- An award or recognition earned in a role: {"title": "...", "note": "Sep 2024", "image": {"url", "w", "h"}}.
-- Additive; null = no award. Apply BEFORE deploying the code that writes this column.

alter table work_experience
  add column if not exists award jsonb
    check (award is null or (jsonb_typeof(award) = 'object' and char_length(award->>'title') between 1 and 80));

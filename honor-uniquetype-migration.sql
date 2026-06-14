-- honor-uniquetype-migration.sql
-- Her onur türü maç başına sadece 1 kişiye verilebilsin (aynı rater için)
ALTER TABLE match_honors
  ADD CONSTRAINT match_honors_unique_honor_type
  UNIQUE (match_id, rater_id, honor_type);

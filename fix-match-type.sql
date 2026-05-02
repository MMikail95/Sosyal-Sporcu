-- match_type kısıtını 5v5, 6v6 gibi format değerlerini de kabul edecek şekilde güncelle
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_match_type_check;

ALTER TABLE matches
  ADD CONSTRAINT matches_match_type_check
    CHECK (match_type IN ('5v5','6v6','7v7','8v8','11v11','friendly','league','tournament','practice'));

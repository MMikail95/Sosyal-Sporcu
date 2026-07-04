-- =====================================================
-- PROFİL AYRICALIKLI SÜTUN KORUMASI MİGRASYONU
-- =====================================================
-- Sorun: `profiles` UPDATE RLS politikası (`USING (auth.uid() = id)`) sütun
-- bazlı bir kısıt içermiyor. Bu yüzden herhangi bir authenticated kullanıcı,
-- kendi satırında is_admin, honor_* ve gen_score gibi normalde sadece
-- trigger/sistem tarafından yazılması gereken alanları doğrudan
-- supabase.from('profiles').update({...}) çağrısıyla değiştirebiliyordu.
--
-- Çözüm: BEFORE UPDATE trigger ile bu alanları OLD değerine sabitliyoruz —
-- ama SADECE gerçek bir son-kullanıcı isteğinde (auth.uid() IS NOT NULL) VE
-- üst seviye bir UPDATE'te (pg_trigger_depth() <= 1). Böylece:
--   - match_honors INSERT → increment_honor_count() trigger'ının profiles
--     üzerindeki iç güncellemesi (depth > 1) etkilenmez, onur sistemi çalışmaya devam eder.
--   - Dashboard/SQL Editor/servis rolünden yapılan idari güncellemeler
--     (auth.uid() IS NULL, ör. seed-simulation.sql) etkilenmez.
--   - Normal oturum açmış bir kullanıcının kendi profiline REST/JS client
--     üzerinden gönderdiği is_admin/honor_*/gen_score değişiklikleri iptal edilir.

CREATE OR REPLACE FUNCTION protect_profile_privileged_columns()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() <= 1 AND auth.uid() IS NOT NULL THEN
    NEW.is_admin              := OLD.is_admin;
    NEW.gen_score             := OLD.gen_score;
    NEW.honor_calm            := OLD.honor_calm;
    NEW.honor_maestro         := OLD.honor_maestro;
    NEW.honor_punctual        := OLD.honor_punctual;
    NEW.honor_joker           := OLD.honor_joker;
    NEW.honor_dynamo          := OLD.honor_dynamo;
    NEW.honor_mvp             := OLD.honor_mvp;
    NEW.honor_fuzeci          := OLD.honor_fuzeci;
    NEW.honor_duvar           := OLD.honor_duvar;
    NEW.honor_cigersiz_honor  := OLD.honor_cigersiz_honor;
    NEW.honor_beyefendi       := OLD.honor_beyefendi;
    NEW.honor_sosyal          := OLD.honor_sosyal;
    NEW.honor_gizli_cevher    := OLD.honor_gizli_cevher;
    NEW.honor_oyunbozan       := OLD.honor_oyunbozan;
    NEW.honor_organizator     := OLD.honor_organizator;
    NEW.honor_saha_komiseri   := OLD.honor_saha_komiseri;
    NEW.honor_emanetci        := OLD.honor_emanetci;
    NEW.honor_fedakar_eldiven := OLD.honor_fedakar_eldiven;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_columns();

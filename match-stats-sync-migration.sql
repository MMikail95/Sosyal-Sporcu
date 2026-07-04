-- =====================================================
-- match-stats-sync-migration.sql
-- Uygulandı: 2026-07-05, proje ref: rpwbmvpapfouhpyvoeol ("Sosyal Sporcu Published")
--
-- SORUN (bug #11): profiles.total_matches / total_goals / total_assists kolonları
-- denormalize sayaçlar ama match_players'a maç işlendiğinde GÜNCELLENMİYORDU.
-- Örn. MikimonTheGray'in match_players'ta 2 "finished" maçı olmasına rağmen
-- total_matches = 0 kalıyor; arkadaş listesi / keşfet kartları bu bayat 0'ı okuyordu.
--
-- ÇÖZÜM: match_players (finished maçlar) üzerinden bu üç kolonu otomatik hesaplayan
-- bir fonksiyon + match_players ve matches tablolarında trigger + tek seferlik backfill.
--
-- NOT (manuel istatistik girişi): Karakter sayfasındaki "Kişisel İstatistikler" formu
-- (inp-total-matches-detail vb.) hâlâ bu kolonlara yazabiliyor, ama bir oyuncunun
-- herhangi bir IN-APP (finished) maçı olduğu anda bu trigger kolonu gerçek maç
-- verisiyle EZER. Yani in-app maçı olan oyuncularda kolon = gerçek maç istatistiği;
-- hiç in-app maçı olmayan oyuncularda manuel değer korunur (backfill onlara dokunmaz).
-- =====================================================

-- Tek bir oyuncunun sayaçlarını finished maçlardan yeniden hesapla
create or replace function public.sync_profile_match_stats(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p set
    total_matches = coalesce(s.matches, 0),
    total_goals   = coalesce(s.goals, 0),
    total_assists = coalesce(s.assists, 0)
  from (
    select
      count(distinct mp.match_id) as matches,
      coalesce(sum(mp.goals), 0)   as goals,
      coalesce(sum(mp.assists), 0) as assists
    from public.match_players mp
    join public.matches m on m.id = mp.match_id
    where mp.player_id = p_player_id
      and m.status = 'finished'
  ) s
  where p.id = p_player_id;
end;
$$;

-- match_players değişince ilgili oyuncu(lar)ı senkronla
create or replace function public.trg_match_players_sync_stats()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.sync_profile_match_stats(old.player_id);
    return old;
  end if;
  perform public.sync_profile_match_stats(new.player_id);
  if (tg_op = 'UPDATE' and new.player_id is distinct from old.player_id) then
    perform public.sync_profile_match_stats(old.player_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_match_players_sync_stats on public.match_players;
create trigger trg_match_players_sync_stats
after insert or update or delete on public.match_players
for each row execute function public.trg_match_players_sync_stats();

-- Maç durumu değişince (ör. scheduled -> finished) o maçtaki tüm oyuncuları senkronla
create or replace function public.trg_matches_sync_stats()
returns trigger
language plpgsql
as $$
declare
  r record;
begin
  if (new.status is distinct from old.status) then
    for r in select distinct player_id from public.match_players where match_id = new.id loop
      perform public.sync_profile_match_stats(r.player_id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_matches_sync_stats on public.matches;
create trigger trg_matches_sync_stats
after update on public.matches
for each row execute function public.trg_matches_sync_stats();

-- Tek seferlik backfill: SADECE finished maçı olan oyuncular güncellenir
-- (in-app maçı olmayanların manuel/eski değerine dokunulmaz).
update public.profiles p set
  total_matches = s.matches,
  total_goals   = s.goals,
  total_assists = s.assists
from (
  select
    mp.player_id,
    count(distinct mp.match_id) as matches,
    coalesce(sum(mp.goals), 0)   as goals,
    coalesce(sum(mp.assists), 0) as assists
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  where m.status = 'finished'
  group by mp.player_id
) s
where p.id = s.player_id;

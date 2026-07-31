-- ============================================================================
-- moderation-migration.sql  (2026-07-31)
-- İçerik moderasyonu: rezerve/küfürlü kullanıcı adı, küfür/hakaret, yasaklı link
-- engeli + kullanıcı şikayet sistemi.
--
-- ⚠️ Uygulanacak proje: rpwbmvpapfouhpyvoeol (Sosyal Sporcu Published) — SADECE.
--    "Sosyal Sporcu Old" (lgfhtzxmwrabrsqbccty) paused; ASLA çalıştırma.
--
-- Katman mantığı: BURASI gerçek zorlama katmanıdır. Client (moderation.js) sadece
-- UX uyarısı verir ve atlanabilir; aşağıdaki trigger'lar atlanamaz.
-- ============================================================================

-- ============================================================================
-- 1) TABLOLAR
-- ============================================================================

create table if not exists public.banned_words (
  id         bigint generated always as identity primary key,
  word       text not null unique,
  match_type text not null default 'word' check (match_type in ('word','substring')),
  category   text default 'profanity',           -- profanity | hate | political | religious | other
  created_at timestamptz default now()
);
comment on column public.banned_words.match_type is
  'word = tam kelime (token) eşleşmesi (kısa/ambigü kökler); substring = normalize edilmiş metin içinde geçmesi (uzun/belirgin ifadeler).';

create table if not exists public.reserved_usernames (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  reason     text default 'reserved',
  created_at timestamptz default now()
);

create table if not exists public.banned_domains (
  id         bigint generated always as identity primary key,
  domain     text not null unique,               -- ör. 'pornhub.com' (alt domainler de eşleşir)
  category   text default 'adult',               -- adult | malware | phishing | gambling | other
  created_at timestamptz default now()
);

create table if not exists public.content_reports (
  id           uuid default gen_random_uuid() primary key,
  reporter_id  uuid references public.profiles(id) on delete set null,
  content_type text not null check (content_type in ('post','comment','profile','team')),
  content_id   uuid not null,
  reason       text,
  status       text not null default 'pending' check (status in ('pending','reviewed','dismissed','removed')),
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz default now()
);
create index if not exists idx_content_reports_status on public.content_reports(status, created_at desc);

-- ============================================================================
-- 2) RLS
-- ============================================================================

alter table public.banned_words       enable row level security;
alter table public.reserved_usernames enable row level security;
alter table public.banned_domains     enable row level security;
alter table public.content_reports    enable row level security;

-- Listeler herkese OKUNUR (client UX için), yazma yok (yalnız service-role/SQL editor).
drop policy if exists "read banned_words" on public.banned_words;
create policy "read banned_words" on public.banned_words for select using (true);

drop policy if exists "read reserved_usernames" on public.reserved_usernames;
create policy "read reserved_usernames" on public.reserved_usernames for select using (true);

drop policy if exists "read banned_domains" on public.banned_domains;
create policy "read banned_domains" on public.banned_domains for select using (true);

-- Şikayetler: kullanıcı kendi şikayetini oluşturur; kendi + admin görür; admin günceller.
drop policy if exists "insert own report" on public.content_reports;
create policy "insert own report" on public.content_reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "read reports own or admin" on public.content_reports;
create policy "read reports own or admin" on public.content_reports
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "admin update reports" on public.content_reports;
create policy "admin update reports" on public.content_reports
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================================
-- 3) NORMALİZASYON FONKSİYONLARI  (client moderation.js ile aynı mantık)
-- ============================================================================

-- Türkçe + leetspeak katlama + küçük harf. Sonuç ağırlıklı a-z0-9.
create or replace function public.moderation_fold(p text)
returns text language sql immutable as $func$
  select translate(
           lower(translate(coalesce(p,''), 'ÇĞIİÖŞÜÂÎÛ', 'CGIIOSUAIU')),
           'çğıöşüâîû0134578@$',
           'cgiosuaiuoieastbas'
         );
$func$;

-- Kompakt: harf/rakam dışını sil + tekrar eden karakteri tek'e indir.
create or replace function public.moderation_compact(p text)
returns text language sql immutable as $func$
  select regexp_replace(
           regexp_replace(public.moderation_fold(p), '[^a-z0-9]+', '', 'g'),
           '(.)\1+', '\1', 'g'
         );
$func$;

-- Boşluk korumalı token dizisi (her token içi tekrarları da sadeleşir).
create or replace function public.moderation_tokens(p text)
returns text[] language sql immutable as $func$
  select coalesce(array_agg(regexp_replace(tok, '(.)\1+', '\1', 'g')), '{}')
  from regexp_split_to_table(
         regexp_replace(public.moderation_fold(p), '[^a-z0-9]+', ' ', 'g'),
         '\s+'
       ) as tok
  where tok <> '';
$func$;

-- ============================================================================
-- 4) KONTROL FONKSİYONLARI
-- ============================================================================

create or replace function public.moderation_has_banned_word(p text)
returns boolean language sql stable as $func$
  select
    -- substring tipi: kompakt metin içinde geçiyor mu
    exists (
      select 1 from public.banned_words b
      where b.match_type = 'substring'
        and public.moderation_compact(b.word) <> ''
        and public.moderation_compact(p) like '%' || public.moderation_compact(b.word) || '%'
    )
    -- word tipi: token'lardan biriyle tam eşleşiyor mu
    or exists (
      select 1 from public.banned_words b
      where b.match_type = 'word'
        and public.moderation_compact(b.word) <> ''
        and public.moderation_compact(b.word) = any (public.moderation_tokens(p))
    );
$func$;

create or replace function public.moderation_is_reserved_username(p text)
returns boolean language sql stable as $func$
  select exists (
    select 1 from public.reserved_usernames r
    where public.moderation_compact(r.name) = public.moderation_compact(p)
  );
$func$;

-- Metindeki bir URL, yasaklı bir domaine (veya alt domainine) işaret ediyor mu.
create or replace function public.moderation_has_banned_domain(p text)
returns boolean language sql stable as $func$
  select exists (
    select 1 from public.banned_domains d
    where lower(coalesce(p,'')) ~
          ('(^|[^a-z0-9])' || regexp_replace(d.domain, '\.', '[.]', 'g') || '([^a-z0-9]|$)')
  );
$func$;

-- ============================================================================
-- 5) TRIGGER FONKSİYONLARI
--    Not: auth.uid() kısıtı YOK — kullanıcı adı/içerik her zaman kullanıcı
--    kaynaklıdır ve signup (handle_new_user, SECURITY DEFINER, auth.uid()=null)
--    yolunun da filtreden geçmesini isteriz. Migration/service-role ile
--    kasıtlı bir düzeltme gerekiyorsa trigger geçici disable edilir.
-- ============================================================================

create or replace function public.moderation_check_profile()
returns trigger language plpgsql as $func$
begin
  if new.username is not null and public.moderation_is_reserved_username(new.username) then
    raise exception 'Bu kullanıcı adı rezerve edilmiştir, seçilemez.' using errcode = 'check_violation';
  end if;
  if public.moderation_has_banned_word(new.username)
     or public.moderation_has_banned_word(new.full_name) then
    raise exception 'İsim / kullanıcı adı uygunsuz bir ifade içeriyor.' using errcode = 'check_violation';
  end if;
  return new;
end;
$func$;

create or replace function public.moderation_check_post()
returns trigger language plpgsql as $func$
begin
  if public.moderation_has_banned_word(new.content) then
    raise exception 'Paylaşım uygunsuz bir ifade içeriyor.' using errcode = 'check_violation';
  end if;
  if public.moderation_has_banned_domain(new.content) then
    raise exception 'Paylaşımda izin verilmeyen bir bağlantı (link) var.' using errcode = 'check_violation';
  end if;
  return new;
end;
$func$;

create or replace function public.moderation_check_comment()
returns trigger language plpgsql as $func$
begin
  if public.moderation_has_banned_word(new.content) then
    raise exception 'Yorum uygunsuz bir ifade içeriyor.' using errcode = 'check_violation';
  end if;
  if public.moderation_has_banned_domain(new.content) then
    raise exception 'Yorumda izin verilmeyen bir bağlantı (link) var.' using errcode = 'check_violation';
  end if;
  return new;
end;
$func$;

create or replace function public.moderation_check_team()
returns trigger language plpgsql as $func$
begin
  if public.moderation_has_banned_word(new.name)
     or public.moderation_has_banned_word(new.description) then
    raise exception 'Takım adı / açıklaması uygunsuz bir ifade içeriyor.' using errcode = 'check_violation';
  end if;
  if public.moderation_has_banned_domain(new.description) then
    raise exception 'Takım açıklamasında izin verilmeyen bir bağlantı (link) var.' using errcode = 'check_violation';
  end if;
  return new;
end;
$func$;

-- ============================================================================
-- 6) TRIGGER'LAR
-- ============================================================================

drop trigger if exists trg_moderation_profile on public.profiles;
create trigger trg_moderation_profile
  before insert or update of username, full_name on public.profiles
  for each row execute function public.moderation_check_profile();

drop trigger if exists trg_moderation_post on public.posts;
create trigger trg_moderation_post
  before insert or update of content on public.posts
  for each row execute function public.moderation_check_post();

drop trigger if exists trg_moderation_comment on public.post_comments;
create trigger trg_moderation_comment
  before insert or update of content on public.post_comments
  for each row execute function public.moderation_check_comment();

drop trigger if exists trg_moderation_team on public.teams;
create trigger trg_moderation_team
  before insert or update of name, description on public.teams
  for each row execute function public.moderation_check_team();

-- ============================================================================
-- 7) SEED LİSTELERİ  (başlangıç; kullanıcı DB'den genişletebilir)
-- ============================================================================

-- --- Rezerve kullanıcı adları (kimlik taklidi / sistem adları) ---
insert into public.reserved_usernames (name, reason) values
  ('admin','system'), ('administrator','system'), ('admins','system'),
  ('moderator','system'), ('moderatör','system'), ('mod','system'), ('mods','system'),
  ('yonetici','system'), ('yönetici','system'), ('yonetim','system'), ('yönetim','system'),
  ('destek','system'), ('support','system'), ('help','system'), ('yardim','system'),
  ('official','impersonation'), ('resmi','impersonation'), ('sosyalsporcu','brand'),
  ('sosyal_sporcu','brand'), ('sosyalsporcuapp','brand'),
  ('sistem','system'), ('system','system'), ('root','system'), ('superadmin','system'),
  ('bot','system'), ('api','system'), ('null','system'), ('undefined','system'),
  ('guvenlik','system'), ('güvenlik','system'), ('security','system'),
  ('hesap','system'), ('account','system'), ('owner','system'), ('ceo','system'),
  ('hakem','impersonation'), ('anonymous','system'), ('anonim','system')
on conflict (name) do nothing;

-- --- Yasaklı kelimeler ---
-- match_type: kısa/ambigü kökler 'word' (tam token; yanlış pozitifi önler:
--   ör. 'sik' substring olsa 'klasik'i, 'got' 'götür'ü yakalardı → 'word' seçildi),
--   uzun/belirgin ifadeler 'substring' (aralara nokta/boşluk koysa bile yakalar).
-- Kategoriler: profanity (küfür), hate (nefret/hakaret), sexual.
insert into public.banned_words (word, match_type, category) values
  -- küfür kökleri (kısa → tam kelime)
  ('amk','word','profanity'), ('amq','word','profanity'), ('aq','word','profanity'),
  ('sik','word','profanity'), ('sikik','word','profanity'), ('oç','word','profanity'),
  ('piç','word','profanity'), ('göt','word','profanity'), ('mal','word','profanity'),
  ('gavat','word','profanity'), ('ibne','word','hate'), ('top','word','hate'),
  -- küfür (uzun/belirgin → substring, evazyona dayanıklı)
  ('siktir','substring','profanity'), ('sikeyim','substring','profanity'),
  ('sikerim','substring','profanity'), ('siktir','substring','profanity'),
  ('orospu','substring','profanity'), ('orospucocugu','substring','profanity'),
  ('yarrak','substring','profanity'), ('yarak','substring','profanity'),
  ('yavşak','substring','hate'), ('pezevenk','substring','profanity'),
  ('pezeveng','substring','profanity'), ('kahpe','substring','hate'),
  ('şerefsiz','substring','hate'), ('serefsiz','substring','hate'),
  ('amcık','substring','sexual'), ('amcik','substring','sexual'),
  ('gerizekalı','substring','hate'), ('gerizekali','substring','hate'),
  ('salak','word','hate'), ('aptal','word','hate'),
  ('orospuçocuğu','substring','profanity'), ('godoş','substring','profanity'),
  ('sürtük','substring','hate'), ('surtuk','substring','hate'),
  ('ananı','substring','profanity'), ('anani','substring','profanity'),
  ('siktiğim','substring','profanity'), ('siktigim','substring','profanity')
on conflict (word) do nothing;

-- --- Yasaklı domainler (yetişkin içerik; alt domainler de otomatik kapsanır) ---
insert into public.banned_domains (domain, category) values
  ('pornhub.com','adult'), ('xvideos.com','adult'), ('xnxx.com','adult'),
  ('xhamster.com','adult'), ('redtube.com','adult'), ('youporn.com','adult'),
  ('brazzers.com','adult'), ('chaturbate.com','adult'), ('stripchat.com','adult'),
  ('bongacams.com','adult'), ('spankbang.com','adult'), ('porn.com','adult'),
  ('sex.com','adult'), ('xxx.com','adult'), ('onlyfans.com','adult'),
  ('hentaihaven.xxx','adult'), ('rule34.xxx','adult'), ('motherless.com','adult'),
  ('tnaflix.com','adult'), ('eporner.com','adult'), ('txxx.com','adult'),
  ('hqporner.com','adult'), ('fapello.com','adult')
on conflict (domain) do nothing;

-- ============================================================================
-- ROLLBACK (gerekirse, elle çalıştır):
--   drop trigger if exists trg_moderation_profile on public.profiles;
--   drop trigger if exists trg_moderation_post on public.posts;
--   drop trigger if exists trg_moderation_comment on public.post_comments;
--   drop trigger if exists trg_moderation_team on public.teams;
--   (fonksiyonlar ve tablolar bırakılabilir; veri kaybı olmaz)
-- ============================================================================

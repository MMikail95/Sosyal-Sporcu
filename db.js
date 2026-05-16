// =====================================================
// DB.JS — Supabase Adaptör Katmanı
// FAZ 0: localStorage → Supabase köprüsü
//
// ⚡ Strateji: Kademeli geçiş
//    - Önce Supabase'den oku, localStorage fallback
//    - FAZ 1 (Auth) tamamlandıktan sonra localStorage tamamen kaldırılır
// =====================================================

'use strict';

// Supabase client — supabase.js yüklü olmalı
const sb = () => window.sbClient;

// =====================================================
// 🔐 AUTH İŞLEMLERİ
// =====================================================

const Auth = {
  // Mevcut oturum
  async getSession() {
    const { data, error } = await sb().auth.getSession();
    if (error) console.error('Auth session error:', error);
    return data?.session || null;
  },

  // Oturum değişikliklerini dinle
  onAuthChange(callback) {
    sb().auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Giriş yap
  async signIn(email, password) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Kayıt ol
  async signUp(email, password, username, fullName) {
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  },

  // Çıkış yap
  async signOut() {
    const { error } = await sb().auth.signOut();
    if (error) throw error;
  },

  // Mevcut kullanıcı
  async getCurrentUser() {
    const { data: { user } } = await sb().auth.getUser();
    return user;
  }
};

// =====================================================
// 👤 PROFİL İŞLEMLERİ
// =====================================================

const Profiles = {
  // Tek profil getir
  async get(userId) {
    const { data, error } = await sb()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { console.error('Profile get error:', error); return null; }
    return data;
  },

  // Tüm profilleri getir (Keşfet sayfası için)
  async getAll({ city, position, search, limit = 200 } = {}) {
    let query = sb()
      .from('profiles_with_ratings')
      .select('*')
      .order('gen_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (city) query = query.eq('city', city);
    if (position) query = query.eq('position', position);
    if (search) query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) { console.error('Profiles getAll error:', error); return []; }
    return data || [];
  },

  // Username ile bul
  async getByUsername(username) {
    const { data, error } = await sb()
      .from('profiles_with_ratings')
      .select('*')
      .eq('username', username)
      .single();
    if (error) return null;
    return data;
  },

  // Profil güncelle
  async update(userId, updates) {
    const { data, error } = await sb()
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) { console.error('Profile update error:', error); throw error; }
    return data;
  },

  // Highlight URL'lerini oku
  async getHighlightUrls(userId) {
    const { data, error } = await sb()
      .from('profiles')
      .select('highlight_url_1, highlight_url_2')
      .eq('id', userId)
      .single();
    if (error) { console.warn('getHighlightUrls error:', error); return {}; }
    return data || {};
  },

  // Highlight URL'lerini güncelle
  async updateHighlightUrls(userId, url1, url2) {
    const { error } = await sb()
      .from('profiles')
      .update({ highlight_url_1: url1 || null, highlight_url_2: url2 || null })
      .eq('id', userId);
    if (error) { console.error('updateHighlightUrls error:', error); throw error; }
  },

  // Self-rating güncelle (kendi puanları)
  async updateRatings(userId, ratings) {
    return Profiles.update(userId, {
      rating_teknik: ratings.teknik,
      rating_sut: ratings.sut,
      rating_pas: ratings.pas,
      rating_hiz: ratings.hiz,
      rating_fizik: ratings.fizik,
      rating_kondisyon: ratings.kondisyon
    });
  }
};

// =====================================================
// 👥 ARKADAŞLIK İŞLEMLERİ
// =====================================================

const Friends = {
  // Arkadaşlarımı getir
  async getMyFriends(userId) {
    const { data, error } = await sb()
      .from('friendships')
      .select(`
        *,
        requester:requester_id(id, username, avatar_url, gen_score, position),
        addressee:addressee_id(id, username, avatar_url, gen_score, position)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (error) { console.error('Friends error:', error); return []; }
    return data || [];
  },

  // Bekleyen istekler
  async getPendingRequests(userId) {
    const { data, error } = await sb()
      .from('friendships')
      .select(`*, requester:requester_id(id, username, avatar_url, gen_score)`)
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    if (error) return [];
    return data || [];
  },

  // Arkadaşlık isteği gönder
  async sendRequest(requesterId, addresseeId) {
    const { data, error } = await sb()
      .from('friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // İsteği kabul et
  async acceptRequest(friendshipId) {
    const { data, error } = await sb()
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Arkadaşlık durumunu kontrol et
  async checkStatus(userId1, userId2) {
    const { data } = await sb()
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),` +
        `and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
      )
      .single();
    return data || null;
  }
};

// =====================================================
// 🏆 TAKIM İŞLEMLERİ
// =====================================================

const Teams = {
  // Tüm takımları getir (Keşfet sayfası için)
  async getAll(limit = 50) {
    const { data, error } = await sb()
      .from('teams')
      .select('*, captain:captain_id(id, username, avatar_url), team_members(count)')
      .eq('is_active', true)
      .order('total_wins', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('Teams.getAll error:', error); return []; }
    return data || [];
  },

  // Tek takım getir
  async get(teamId) {
    const { data, error } = await sb()
      .from('teams')
      .select(`
        *,
        captain:captain_id(id, username, avatar_url, gen_score),
        team_members(
          *,
          player:player_id(id, username, avatar_url, gen_score, position, ana_mevki,
                          rating_teknik, rating_sut, rating_pas, rating_hiz, rating_fizik, rating_kondisyon)
        )
      `)
      .eq('id', teamId)
      .single();
    if (error) return null;
    return data;
  },

  // Takım oluştur
  async create(captainId, teamData) {
    // 1. Takımı oluştur
    const { data, error } = await sb()
      .from('teams')
      .insert({
        captain_id: captainId,
        is_active:  true,
        ...teamData
      })
      .select()
      .single();

    if (error) {
      console.error('Teams.create insert error:', error);
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('not authorized')) {
        throw new Error('Supabase RLS: Takım oluşturma yetkisi yok. Lütfen sprint6-migration.sql dosyasını Supabase\'de çalıştırın.');
      }
      if (error.code === '23505') {
        throw new Error('Bu davet kodu zaten kullanımda. Farklı bir takım adı deneyin.');
      }
      throw error;
    }

    // 2. Kaptanı team_members'a ekle
    const { error: memberError } = await sb()
      .from('team_members')
      .insert({ team_id: data.id, player_id: captainId, role: 'captain' });
    if (memberError) console.warn('team_members insert warning:', memberError);

    // 3. Profili güncelle
    const { error: profileError } = await sb()
      .from('profiles')
      .update({ current_team_id: data.id })
      .eq('id', captainId);
    if (profileError) console.warn('profile current_team_id update warning:', profileError);

    return data;
  },

  // Takımdaki üye sayısını getir
  async getMemberCount(teamId) {
    const { count } = await sb()
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId);
    return count ?? 0;
  },

  // Takıma üye ekle (maks 7 oyuncu)
  async addMember(teamId, playerId, role = 'player') {
    const { count } = await sb()
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId);
    if ((count ?? 0) >= 7) throw new Error('Takım dolu (maksimum 7 oyuncu)');
    const { data, error } = await sb()
      .from('team_members')
      .insert({ team_id: teamId, player_id: playerId, role })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Kullanıcının aktif takımını getir (ilk takım)
  async getMyTeam(userId) {
    const { data, error } = await sb()
      .from('team_members')
      .select(`team:team_id(*)`)
      .eq('player_id', userId)
      .limit(1)
      .single();
    if (error) return null;
    return data?.team || null;
  },

  // Kullanıcının TÜM aktif takımlarını getir
  async getMyTeams(userId) {
    const { data, error } = await sb()
      .from('team_members')
      .select(`role, team:team_id(id, name, slug, city, captain_id, color, is_active)`)
      .eq('player_id', userId);
    if (error) return [];
    return (data || [])
      .filter(d => d.team && d.team.is_active !== false)
      .map(d => ({ role: d.role, ...d.team }));
  },

  // Kullanıcının takımdaki rolünü getir
  async getMyRole(userId) {
    const { data, error } = await sb()
      .from('team_members')
      .select('role, team_id')
      .eq('player_id', userId)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  // Takım üyelerini getir
  async getMembers(teamId) {
    const { data, error } = await sb()
      .from('team_members')
      .select(`
        *,
        player:player_id(id, username, avatar_url, position, ana_mevki, ayak,
                        gen_score, total_matches, total_goals, total_assists,
                        rating_teknik, rating_sut, rating_pas, rating_hiz, rating_fizik, rating_kondisyon)
      `)
      .eq('team_id', teamId)
      .order('role');
    if (error) return [];
    return data || [];
  },

  // Davet koduyla takıma katıl
  async joinByCode(userId, inviteCode) {
    // Davet kodunu slug olarak ara
    const { data: team, error: tErr } = await sb()
      .from('teams')
      .select('id, name, captain_id')
      .eq('slug', inviteCode.toUpperCase())
      .eq('is_active', true)
      .single();
    if (tErr || !team) throw new Error('Geçersiz davet kodu');

    // Zaten üye mi?
    const { data: existing } = await sb()
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('player_id', userId)
      .single();
    if (existing) throw new Error('Zaten bu takımın üyesisiniz');

    // Kaptan kendi takımına geri katılıyorsa 'captain' rolü ver
    const role = team.captain_id === userId ? 'captain' : 'player';
    await sb().from('team_members').insert({ team_id: team.id, player_id: userId, role });
    await sb().from('profiles').update({ current_team_id: team.id }).eq('id', userId);
    return team;
  },

  // Takımı güncelle (kaptan)
  async update(teamId, updates) {
    const { data, error } = await sb()
      .from('teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Takım logosu yükle → avatars bucket (teams/{teamId}/logo.ext)
  async uploadTeamLogo(teamId, file) {
    if (!sb()) throw new Error('Supabase client hazır değil');
    if (!file || !file.type.startsWith('image/')) throw new Error('Geçersiz dosya türü');
    if (file.size > 2 * 1024 * 1024) throw new Error('Dosya 2MB\'den büyük olamaz');

    const ext  = file.name.split('.').pop().toLowerCase() || 'jpg';
    const path = `teams/${teamId}/logo.${ext}`;

    await sb().storage.from('avatars').remove([path]).catch(() => {});

    const { error: upErr } = await sb().storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
    if (upErr) throw upErr;

    const { data: urlData } = sb().storage.from('avatars').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error('Public URL alınamadı');

    const logoUrl = `${publicUrl}?t=${Date.now()}`;

    // teams tablosuna logo_url yaz
    await Teams.update(teamId, { logo_url: logoUrl });

    return logoUrl;
  },

  // Üyeyi çıkar (kaptan yetkisi)
  async removeMember(teamId, playerId) {
    const { error } = await sb()
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId);
    if (error) throw error;
    // Profilinden takımı kaldır
    await sb().from('profiles').update({ current_team_id: null }).eq('id', playerId);
  },

  // Takımdan ayrıl
  async leave(teamId, userId) {
    await sb().from('team_members').delete()
      .eq('team_id', teamId).eq('player_id', userId);
    await sb().from('profiles').update({ current_team_id: null }).eq('id', userId);
  },

  // Takım ara (keşfet / davet kodu)
  async search(query = '', limit = 50) {
    let q = sb()
      .from('teams')
      .select('*, captain:captain_id(id, username, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (query) q = q.ilike('name', `%${query}%`);
    const { data, error } = await q;
    if (error) { console.error('Teams.search error:', error); return []; }
    return data || [];
  },

  // Slug / davet kodu üret (takım adından)
  generateSlug(name) {
    // Türkçe karakterleri normalize et
    const tr = { 'ç':'C','Ç':'C','ğ':'G','Ğ':'G','ı':'I','İ':'I',
                  'ö':'O','Ö':'O','ş':'S','Ş':'S','ü':'U','Ü':'U' };
    const normalized = (name || '').replace(/[çÇğĞıİöÖşŞüÜ]/g, m => tr[m] || m);
    const slug = normalized
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    // Boşsa rastgele 6 harf
    return slug || 'TM' + Math.random().toString(36).slice(2, 8).toUpperCase();
  },

  // Takım istatistiklerini güncelle (kaptan)
  async updateStats(teamId, stats) {
    // stats: { total_wins, total_losses, total_draws, total_goals_scored, total_goals_conceded }
    const { data, error } = await sb()
      .from('teams')
      .update({ ...stats, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Takımı dağıt (kaptan yetkisi — tüm üyelikleri ve takımı sil)
  async dissolve(teamId, captainId, currentSlug) {
    // 1. Tüm üyelerin profilinden takımı kaldır
    const { data: members } = await sb()
      .from('team_members')
      .select('player_id')
      .eq('team_id', teamId);
    if (members && members.length > 0) {
      const ids = members.map(m => m.player_id);
      await sb().from('profiles').update({ current_team_id: null }).in('id', ids);
    }

    // 2. Üyelikleri sil
    await sb().from('team_members').delete().eq('team_id', teamId);

    // 3. Takımı pasif yap + slug'ı serbest bırak (aynı isimde yeni takım kurulabilsin)
    const deletedSlug = `DEL_${Date.now()}_${currentSlug || teamId.slice(0, 8)}`;
    const { data: updated, error } = await sb()
      .from('teams')
      .update({ is_active: false, slug: deletedSlug })
      .eq('id', teamId)
      .select('id');

    if (error) throw error;
    // RLS sessizce 0 satır döndürebilir — bunu da hata say
    if (!updated || updated.length === 0) {
      throw new Error('Takım silinemedi: yetki hatası (RLS). Lütfen Supabase RLS politikasını kontrol edin.');
    }
  },

  // Takımın oynanan maçlarını getir
  async getMatches(teamId, limit = 10) {
    const { data, error } = await sb()
      .from('matches')
      .select(`
        id, home_score, away_score, status, scheduled_at,
        home_team:home_team_id(id, name, color, icon),
        away_team:away_team_id(id, name, color, icon)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'finished')
      .order('scheduled_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('Teams.getMatches error:', error); return []; }
    return data || [];
  },

  // Realtime: takım değişikliklerini dinle
  subscribeToTeam(teamId, callback) {
    return sb()
      .channel(`team:${teamId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
        payload => callback('members', payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'teams', filter: `id=eq.${teamId}` },
        payload => callback('team', payload)
      )
      .subscribe();
  }
};

// =====================================================
// ⚽ MAÇ İŞLEMLERİ
// =====================================================

const Matches = {
  // Yaklaşan maçlar
  async getUpcoming(limit = 10) {
    const { data, error } = await sb()
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url),
        venue:venue_id(id, name, district)
      `)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(limit);
    if (error) return [];
    return data || [];
  },

  // Maç oluştur
  async create(creatorId, matchData) {
    const { data, error } = await sb()
      .from('matches')
      .insert({ created_by: creatorId, ...matchData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Oyuncunun maç geçmişini getir (match_players + matches JOIN)
  async getPlayerHistory(userId, limit = 30) {
    const { data, error } = await sb()
      .from('match_players')
      .select(`
        id, goals, assists, own_goals, performance_rating, team_side, position_played, confirmed,
        match:match_id(
          id, scheduled_at, status, home_score, away_score, match_type, notes,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name),
          venue:venue_id(id, name, district)
        )
      `)
      .eq('player_id', userId)
      .order('match_id', { ascending: false })
      .limit(limit);
    if (error) { console.error('Match history error:', error); return []; }
    return (data || []).filter(d => d.match !== null);
  },

  // Son biten takım maçlarını getir (Spor Gazetesi için)
  async getRecentFinished(limit = 10) {
    const { data, error } = await sb()
      .from('matches')
      .select(`
        id, home_score, away_score, scheduled_at,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name)
      `)
      .eq('status', 'finished')
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null)
      .order('scheduled_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  },

  // Maç sonucu gir
  async updateScore(matchId, homeScore, awayScore, updaterId) {
    const { data, error } = await sb()
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished',
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Maç bitince her iki takımın tüm üyelerini match_players'a ekle (upsert)
  async autoPopulateTeamPlayers(matchId) {
    const { data: match } = await sb()
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .single();
    if (!match) return;

    const entries = [];
    for (const [teamId, side] of [[match.home_team_id, 'home'], [match.away_team_id, 'away']]) {
      if (!teamId) continue;
      const { data: members } = await sb()
        .from('team_members')
        .select('player_id')
        .eq('team_id', teamId);
      (members || []).forEach(m => entries.push({
        match_id: matchId, player_id: m.player_id,
        team_side: side, confirmed: true
      }));
    }
    if (!entries.length) return;
    await sb().from('match_players')
      .upsert(entries, { onConflict: 'match_id,player_id' });
  },

  // Kullanıcının tüm maçlarını getir (hem geçmiş hem yaklaşan)
  async getMyMatches(userId, myTeamIds = [], limit = 50) {
    const matchSelect = `
      id, scheduled_at, status, finished_at, home_score, away_score, match_type, notes, created_by,
      home_team_id, away_team_id,
      home_team:home_team_id(id, name),
      away_team:away_team_id(id, name),
      venue:venue_id(id, name, district)
    `;

    // 1. Kişisel katılımlar (match_players)
    const { data: personal, error } = await sb()
      .from('match_players')
      .select(`id, team_side, confirmed, match:match_id(${matchSelect})`)
      .eq('player_id', userId)
      .limit(limit);
    if (error) console.error('getMyMatches personal error:', error);

    const personalEntries = (personal || []).filter(d => d.match !== null);
    const personalMatchIds = new Set(personalEntries.map(e => e.match.id));

    // 2. Takım maçları (kullanıcının takımı ev/deplasman ama bizzat join etmemiş)
    let teamEntries = [];
    if (myTeamIds.length > 0) {
      const orFilter = myTeamIds
        .flatMap(id => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`])
        .join(',');
      const { data: teamMatches } = await sb()
        .from('matches')
        .select(matchSelect)
        .or(orFilter)
        .order('scheduled_at', { ascending: false })
        .limit(limit);

      teamEntries = (teamMatches || [])
        .filter(m => !personalMatchIds.has(m.id))
        .map(m => {
          const isHome = myTeamIds.includes(m.home_team_id);
          return { id: null, team_side: isHome ? 'home' : 'away', confirmed: false, match: m };
        });
    }

    // Birleştir ve tarihe göre sırala
    const all = [...personalEntries, ...teamEntries];
    all.sort((a, b) => new Date(b.match.scheduled_at) - new Date(a.match.scheduled_at));
    return all.slice(0, limit);
  },

  // Son 5 biten maç + performans notu (form grafiği için)
  async getLastFive(userId) {
    const { data, error } = await sb()
      .from('match_players')
      .select(`
        team_side, goals, assists, performance_rating,
        match:match_id(id, scheduled_at, status, home_score, away_score,
          home_team:home_team_id(name), away_team:away_team_id(name))
      `)
      .eq('player_id', userId)
      .eq('match.status', 'finished')
      .order('match(scheduled_at)', { ascending: false })
      .limit(5);
    if (error) { console.error('getLastFive error:', error); return []; }
    return (data || []).filter(d => d.match !== null);
  },

  // Maça oyuncu olarak katıl
  async joinMatch(matchId, playerId, teamSide = 'home') {
    const { data, error } = await sb()
      .from('match_players')
      .upsert({ match_id: matchId, player_id: playerId, team_side: teamSide, confirmed: true },
               { onConflict: 'match_id,player_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Birden fazla maç için oyuncu sayısını tek sorguda getir
  async getPlayerCounts(matchIds) {
    if (!matchIds || !matchIds.length) return {};
    const { data } = await sb()
      .from('match_players')
      .select('match_id')
      .in('match_id', matchIds);
    const counts = {};
    (data || []).forEach(p => {
      counts[p.match_id] = (counts[p.match_id] || 0) + 1;
    });
    return counts;
  },

  // Maçtaki tüm oyuncuları profil bilgileriyle getir
  async getMatchPlayers(matchId) {
    const { data, error } = await sb()
      .from('match_players')
      .select(`
        id, team_side, goals, assists, own_goals, performance_rating, position_played, confirmed,
        player:player_id(id, username, avatar_url, ana_mevki)
      `)
      .eq('match_id', matchId)
      .order('team_side');
    if (error) { console.error('getMatchPlayers error:', error); return []; }
    return (data || []).filter(d => d.player !== null);
  },

  // Oyuncu maç istatistiklerini güncelle
  async updatePlayerStats(matchPlayerId, stats) {
    const { data, error } = await sb()
      .from('match_players')
      .update({
        goals:              stats.goals ?? 0,
        assists:            stats.assists ?? 0,
        own_goals:          stats.own_goals ?? 0,
        performance_rating: stats.performance_rating || null,
        position_played:    stats.position_played || null
      })
      .eq('id', matchPlayerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Takımın katılınabilir açık maçlarını getir (kullanıcı zaten içinde değilse)
  async getTeamOpenMatches(teamIds, excludePlayerId) {
    if (!teamIds || !teamIds.length) return [];
    const idList = teamIds.join(',');

    const [{ data: joined }, { data: matches, error }] = await Promise.all([
      sb().from('match_players').select('match_id').eq('player_id', excludePlayerId),
      sb().from('matches')
        .select(`
          id, scheduled_at, status, match_type, notes, created_by,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name),
          venue:venue_id(id, name, district)
        `)
        .or(`home_team_id.in.(${idList}),away_team_id.in.(${idList})`)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
    ]);

    if (error) { console.error('getTeamOpenMatches error:', error); return []; }
    const joinedIds = new Set((joined || []).map(j => j.match_id));
    return (matches || []).filter(m => !joinedIds.has(m.id));
  },

  // Maçtan ayrıl
  async leaveMatch(matchId, playerId) {
    const { error } = await sb()
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId);
    if (error) throw error;
  },

  // Maçı iptal et (sadece yaratıcı)
  async cancelMatch(matchId, userId) {
    const { data, error } = await sb()
      .from('matches')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', matchId)
      .eq('created_by', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Form Oku: son N biten maçın galibiyet/mağlubiyet durumunu getir ──
  async getLastResults(userId, limit = 3) {
    const { data, error } = await sb()
      .from('match_players')
      .select(`
        team_side,
        match:match_id(id, status, home_score, away_score, scheduled_at)
      `)
      .eq('player_id', userId)
      .order('match(scheduled_at)', { ascending: false })
      .limit(limit * 3); // fazla çek, filtreleyeceğiz
    if (error) { console.error('getLastResults error:', error); return []; }
    const finished = (data || [])
      .filter(r => r.match && r.match.status === 'finished')
      .slice(0, limit);
    return finished.map(r => {
      const hs = r.match.home_score ?? 0;
      const as = r.match.away_score ?? 0;
      const isHome = r.team_side === 'home';
      const myScore = isHome ? hs : as;
      const oppScore = isHome ? as : hs;
      return myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
    });
  },

  // ── Partner Kimyası: aynı takımda en çok galibiyet alınan 3 oyuncu ──
  async getTopPartners(userId, limit = 3) {
    // 1. Kullanıcının son 40 biten maçını al
    const { data: userRows, error: e1 } = await sb()
      .from('match_players')
      .select('match_id, team_side, match:match_id(id, status, home_score, away_score)')
      .eq('player_id', userId)
      .limit(60);
    if (e1 || !userRows) return [];

    const finished = userRows.filter(r => r.match && r.match.status === 'finished');
    if (!finished.length) return [];

    // Kazanılan maçlar ve takım bilgisi
    const winSet  = new Set();
    const sideMap = {};
    finished.forEach(r => {
      const hs = r.match.home_score ?? 0;
      const as = r.match.away_score ?? 0;
      const isHome = r.team_side === 'home';
      const won = isHome ? hs > as : as > hs;
      sideMap[r.match_id] = r.team_side;
      if (won) winSet.add(r.match_id);
    });

    const matchIds = Object.keys(sideMap);
    if (!matchIds.length) return [];

    // 2. Bu maçlardaki tüm diğer oyuncuları çek
    const { data: teammates, error: e2 } = await sb()
      .from('match_players')
      .select('match_id, player_id, team_side, player:player_id(id, username, avatar_url, ana_mevki)')
      .in('match_id', matchIds)
      .neq('player_id', userId);
    if (e2 || !teammates) return [];

    // 3. Aynı takımda oynamış + galibiyet say
    const stats = {};
    teammates.forEach(t => {
      if (!t.player || t.team_side !== sideMap[t.match_id]) return;
      const pid = t.player_id;
      if (!stats[pid]) stats[pid] = { player: t.player, wins: 0, total: 0 };
      stats[pid].total++;
      if (winSet.has(t.match_id)) stats[pid].wins++;
    });

    return Object.values(stats)
      .filter(s => s.total >= 1)
      .sort((a, b) => b.wins - a.wins || b.total - a.total)
      .slice(0, limit)
      .map(s => ({
        ...s.player,
        wins:    s.wins,
        total:   s.total,
        winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
      }));
  }
};

// =====================================================
// 📡 FEED / SOSYAL İŞLEMLER
// =====================================================

const Feed = {
  // Feed postları getir (takip edilenler + herkese açık)
  async getPosts(userId, limit = 30) {
    const { data, error } = await sb()
      .from('posts')
      .select(`
        *,
        author:author_id(id, username, avatar_url, position),
        related_team:related_team_id(id, name),
        related_venue:related_venue_id(id, name),
        related_player:related_player_id(id, username, avatar_url),
        related_match:related_match_id(id, home_score, away_score, status)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('Feed error:', error); return []; }
    return data || [];
  },

  // Post oluştur
  async createPost(authorId, content, postType = 'status', extras = {}) {
    const { data, error } = await sb()
      .from('posts')
      .insert({
        author_id: authorId,
        content,
        post_type: postType,
        ...extras
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Beğen / Beğeniyi geri al
  async toggleLike(postId, userId) {
    // Önce var mı kontrol et
    const { data: existing } = await sb()
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Beğeniyi geri al
      await sb().from('post_likes').delete()
        .eq('post_id', postId).eq('user_id', userId);
      return false;
    } else {
      // Beğen
      await sb().from('post_likes').insert({ post_id: postId, user_id: userId });
      return true;
    }
  },

  // Yorum ekle
  async addComment(postId, authorId, content) {
    const { data, error } = await sb()
      .from('post_comments')
      .insert({ post_id: postId, author_id: authorId, content })
      .select(`*, author:author_id(id, username, avatar_url)`)
      .single();
    if (error) throw error;
    return data;
  },

  // Yorumları getir
  async getComments(postId) {
    const { data, error } = await sb()
      .from('post_comments')
      .select(`*, author:author_id(id, username, avatar_url)`)
      .eq('post_id', postId)
      .order('created_at');
    if (error) return [];
    return data || [];
  },

  // Realtime aboneliği
  subscribeToFeed(callback) {
    return sb()
      .channel('public:posts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        payload => callback(payload.new)
      )
      .subscribe();
  }
};

// =====================================================
// 🔔 BİLDİRİM İŞLEMLERİ
// =====================================================

const Notifications = {
  // Bildirimlerimi getir
  async getMyNotifications(userId, limit = 20) {
    const { data, error } = await sb()
      .from('notifications')
      .select(`*, actor:actor_id(id, username, avatar_url)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  },

  // Bildirimi okundu yap
  async markRead(notifId) {
    await sb().from('notifications').update({ is_read: true }).eq('id', notifId);
  },

  // Tüm bildirimleri okundu yap
  async markAllRead(userId) {
    await sb().from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  // Bildirim gönder
  async send(userId, type, title, body, actorId = null, relatedId = null) {
    const { data, error } = await sb()
      .from('notifications')
      .insert({ user_id: userId, type, title, body, actor_id: actorId, related_id: relatedId })
      .select()
      .single();
    if (error) console.error('Notification send error:', error);
    return data;
  },

  // Realtime bildirim aboneliği
  subscribeToNotifications(userId, callback) {
    return sb()
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => callback(payload.new)
      )
      .subscribe();
  }
};

// =====================================================
// ⭐ COMMUNITY RATING İŞLEMLERİ
// =====================================================

const Ratings = {
  // Oyuncuya verilen tüm puanlar
  async getPlayerRatings(playerId) {
    const { data, error } = await sb()
      .from('community_ratings')
      .select(`*, rater:rater_id(id, username, avatar_url)`)
      .eq('rated_player_id', playerId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  // Puan ver / güncelle — matchId opsiyonel (maç sonu puanlama için)
  // ratings: { teknik, sut, pas, hiz, fizik, kondisyon } — 1-10 arası stepper değerleri
  // DB'ye 1-10 olarak kaydedilir (dönüşüm yapılmaz).
  // Profiles.rating_* kolonları community ortalaması trigger'ı ile güncellenir.
  async upsertRating(raterId, ratedPlayerId, ratings, comment = '', matchId = null) {
    const clamp = v => Math.min(10, Math.max(1, Math.round(v || 5)));
    const payload = {
      rater_id: raterId,
      rated_player_id: ratedPlayerId,
      rating_teknik:    clamp(ratings.teknik),
      rating_sut:       clamp(ratings.sut),
      rating_pas:       clamp(ratings.pas),
      rating_hiz:       clamp(ratings.hiz),
      rating_fizik:     clamp(ratings.fizik),
      rating_kondisyon: clamp(ratings.kondisyon),
      comment: comment || '',
      updated_at: new Date().toISOString()
    };
    if (matchId) payload.match_id = matchId;

    // Supabase JS onConflict: kolon adı alır, constraint adı değil.
    if (matchId) {
      try {
        const { data, error } = await sb()
          .from('community_ratings')
          .upsert(payload, { onConflict: 'rated_player_id,rater_id,match_id', ignoreDuplicates: false })
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        // match_id kolonu yoksa (SQL migration çalıştırılmamış) → fallback
        if (e.message && (e.message.includes('match_id') || e.message.includes('column'))) {
          const fb = { ...payload };
          delete fb.match_id;
          const { data, error } = await sb()
            .from('community_ratings')
            .upsert(fb, { onConflict: 'rated_player_id,rater_id', ignoreDuplicates: false })
            .select()
            .single();
          if (error) throw error;
          return data;
        }
        throw e;
      }
    } else {
      const { data, error } = await sb()
        .from('community_ratings')
        .upsert(payload, { onConflict: 'rated_player_id,rater_id', ignoreDuplicates: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Puanlayan kişi bu maçta oynadı mı? (güvenlik kontrolü için)
  async isParticipantInMatch(playerId, matchId) {
    if (!playerId || !matchId) return false;
    const { data } = await sb()
      .from('match_players')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle();
    return !!data;
  },

  // Benim bu oyuncuya verdiğim puan
  async getMyRating(raterId, ratedPlayerId) {
    const { data } = await sb()
      .from('community_ratings')
      .select('*')
      .eq('rater_id', raterId)
      .eq('rated_player_id', ratedPlayerId)
      .single();
    return data || null;
  },

  // Bir maçtaki tüm oyuncuları getir (kullanıcı hariç)
  // Önce match_players tablosundan çeker; yetersizse her iki takımın üyelerini de ekler.
  async getMatchParticipants(matchId, excludePlayerId) {
    // 1) match_players'dan çek
    const { data: mpData } = await sb()
      .from('match_players')
      .select(`
        player_id, team_side,
        player:player_id(id, username, avatar_url, ana_mevki, gen_score,
          rating_teknik, rating_sut, rating_pas, rating_hiz, rating_fizik, rating_kondisyon)
      `)
      .eq('match_id', matchId)
      .neq('player_id', excludePlayerId);

    const direct = (mpData || []).filter(d => d.player !== null);
    const directIds = new Set(direct.map(d => d.player_id));

    // 2) Maçın home/away takım ID'lerini çek
    const { data: matchData } = await sb()
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .maybeSingle();

    if (!matchData) return direct;

    const teamIdSideMap = {};
    if (matchData.home_team_id) teamIdSideMap[matchData.home_team_id] = 'home';
    if (matchData.away_team_id) teamIdSideMap[matchData.away_team_id] = 'away';

    const teamIds = Object.keys(teamIdSideMap);
    if (teamIds.length === 0) return direct;

    // 3) Her iki takımın üyelerini çek
    const { data: memberData } = await sb()
      .from('team_members')
      .select(`
        player_id, team_id,
        player:player_id(id, username, avatar_url, ana_mevki, gen_score,
          rating_teknik, rating_sut, rating_pas, rating_hiz, rating_fizik, rating_kondisyon)
      `)
      .in('team_id', teamIds)
      .neq('player_id', excludePlayerId);

    const extra = (memberData || [])
      .filter(m => m.player !== null && !directIds.has(m.player_id))
      .map(m => ({
        player_id: m.player_id,
        team_side: teamIdSideMap[m.team_id] || 'home',
        player: m.player
      }));

    return [...direct, ...extra];
  },

  // Bu maçta hangi oyuncuları puanladım? (Set döndürür)
  async getMyMatchRatings(raterId, matchId) {
    const { data } = await sb()
      .from('community_ratings')
      .select('rated_player_id')
      .eq('rater_id', raterId)
      .eq('match_id', matchId);
    return new Set((data || []).map(r => r.rated_player_id));
  },

  // Bu maç için 24 saatlik oylama penceresi hâlâ açık mı?
  async isVotingOpen(matchId) {
    if (!matchId) return false;
    if (window.TEST_MODE) return true;
    const { data } = await sb()
      .from('matches')
      .select('status, finished_at')
      .eq('id', matchId)
      .maybeSingle();
    if (!data || data.status !== 'finished') return false;
    if (!data.finished_at) return true; // migration henüz çalışmadıysa fail-open
    return (Date.now() - new Date(data.finished_at).getTime()) < 24 * 60 * 60 * 1000;
  },

  // Maç geçmişi tablosu için toplu durum sorgulama
  // Döndürür: { [matchId]: 'pending' | 'done' | 'expired' | null }
  async getMatchRatingStatuses(userId, matchIds) {
    if (!matchIds || matchIds.length === 0) return {};

    // 1) match_players'dan doğrudan katılımcıları çek
    const { data: mpRows } = await sb()
      .from('match_players')
      .select('match_id, player_id')
      .in('match_id', matchIds)
      .neq('player_id', userId);

    // 2) Maçların home/away takım ID'lerini ve finished_at'i çek
    const { data: matchRows } = await sb()
      .from('matches')
      .select('id, home_team_id, away_team_id, finished_at')
      .in('id', matchIds);

    // 3) Takım ID'lerinden üye listesini çek (fallback)
    const teamIds = [];
    const matchTeamMap = {}; // matchId -> [teamId, ...]
    const finishedAtMap = {}; // matchId -> finished_at string | null
    (matchRows || []).forEach(m => {
      matchTeamMap[m.id] = [];
      finishedAtMap[m.id] = m.finished_at || null;
      if (m.home_team_id) { teamIds.push(m.home_team_id); matchTeamMap[m.id].push(m.home_team_id); }
      if (m.away_team_id) { teamIds.push(m.away_team_id); matchTeamMap[m.id].push(m.away_team_id); }
    });

    let memberRows = [];
    if (teamIds.length > 0) {
      const { data: tm } = await sb()
        .from('team_members')
        .select('team_id, player_id')
        .in('team_id', [...new Set(teamIds)])
        .neq('player_id', userId);
      memberRows = tm || [];
    }

    // 4) Her maç için benzersiz oyuncu seti oluştur
    const byMatch = {};
    matchIds.forEach(mid => { byMatch[mid] = new Set(); });

    (mpRows || []).forEach(p => {
      if (byMatch[p.match_id]) byMatch[p.match_id].add(p.player_id);
    });

    // Takım üyelerini de ekle (match_players'da yoksa)
    const teamPlayerTeamMap = {}; // teamId -> Set(player_id)
    memberRows.forEach(m => {
      if (!teamPlayerTeamMap[m.team_id]) teamPlayerTeamMap[m.team_id] = new Set();
      teamPlayerTeamMap[m.team_id].add(m.player_id);
    });

    matchIds.forEach(mid => {
      (matchTeamMap[mid] || []).forEach(tid => {
        (teamPlayerTeamMap[tid] || new Set()).forEach(pid => {
          byMatch[mid].add(pid);
        });
      });
    });

    // 5) Verilen puanları çek
    const { data: given } = await sb()
      .from('community_ratings')
      .select('match_id, rated_player_id')
      .eq('rater_id', userId)
      .in('match_id', matchIds);

    const givenSet = new Set((given || []).map(r => `${r.match_id}:${r.rated_player_id}`));

    // 6) Sonucu hesapla
    const result = {};
    matchIds.forEach(mid => {
      // Oylama penceresi dolmuşsa expired döndür
      const fat = finishedAtMap[mid];
      if (fat && (Date.now() - new Date(fat).getTime()) >= 24 * 60 * 60 * 1000) {
        result[mid] = 'expired';
        return;
      }
      const peers = [...byMatch[mid]];
      if (peers.length === 0) { result[mid] = 'pending'; return; } // takım varsa pending göster
      result[mid] = peers.every(pid => givenSet.has(`${mid}:${pid}`)) ? 'done' : 'pending';
    });
    return result;
  }
};

// =====================================================
// 🏆 ONUR SİSTEMİ
// =====================================================

const Honors = {

  // Maç için onur gönder — selections: [{ rated_id, honor_type }], max 5
  async submitMatchHonors(raterId, matchId, selections) {
    if (!selections || selections.length === 0) return { inserted: 0 };
    if (selections.length > 13) throw new Error('En fazla 13 onur seçilebilir.');
    const rows = selections.map(s => ({
      match_id:   matchId,
      rater_id:   raterId,
      rated_id:   s.rated_id,
      honor_type: s.honor_type
    }));
    const { data, error } = await sb()
      .from('match_honors')
      .upsert(rows, { onConflict: 'match_id,rater_id,rated_id', ignoreDuplicates: true })
      .select();
    if (error) throw error;
    return { inserted: (data || []).length };
  },

  // Bu kullanıcı bu maçta daha önce onur verdi mi?
  async hasGivenHonors(matchId, userId) {
    const { data } = await sb()
      .from('match_honors')
      .select('id')
      .eq('match_id', matchId)
      .eq('rater_id', userId)
      .limit(1)
      .maybeSingle();
    return !!data;
  },

  // Birden fazla maç için onur durumu — getMatchRatingStatuses ile aynı shape döner
  // returns: { [matchId]: 'done' | 'pending' }
  async getMatchHonorStatuses(userId, matchIds) {
    if (!matchIds || matchIds.length === 0) return {};
    const { data } = await sb()
      .from('match_honors')
      .select('match_id')
      .eq('rater_id', userId)
      .in('match_id', matchIds);
    const doneSet = new Set((data || []).map(r => r.match_id));
    const result = {};
    matchIds.forEach(id => {
      result[id] = doneSet.has(id) ? 'done' : 'pending';
    });
    return result;
  }
};

// =====================================================
// 🏟️ SAHA İŞLEMLERİ
// =====================================================

const Venues = {
  // Tüm sahalar
  async getAll(city) {
    let query = sb()
      .from('venues')
      .select('*')
      .order('avg_rating', { ascending: false });
    if (city) query = query.eq('city', city);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  },

  // Saha ekle
  async add(addedBy, venueData) {
    const { data, error } = await sb()
      .from('venues')
      .insert({ added_by: addedBy, ...venueData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Saha puanla
  async rate(venueId, raterId, rating, comment = '') {
    const { data, error } = await sb()
      .from('venue_ratings')
      .upsert({
        venue_id: venueId,
        rater_id: raterId,
        rating,
        comment
      }, { onConflict: 'venue_id,rater_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// =====================================================
// 📷 AVATAR STORAGE İŞLEMLERİ
// =====================================================

const Storage = {
  /**
   * Avatar yükle — Supabase avatars bucket'a
   * @param {string} userId - Kullanıcı UUID
   * @param {File} file - Seçilen dosya
   * @returns {string|null} - Public URL
   */
  async uploadAvatar(userId, file) {
    if (!sb()) throw new Error('Supabase client hazır değil');
    if (!file || !file.type.startsWith('image/')) throw new Error('Geçersiz dosya türü');
    if (file.size > 2 * 1024 * 1024) throw new Error('Dosya 2MB\'den büyük olamaz');

    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const path = `${userId}/avatar.${ext}`;

    // Önce mevcut dosyayı sil (overwrite için)
    await sb().storage.from('avatars').remove([path]).catch(() => {});

    const { data, error } = await sb().storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    if (error) throw error;

    // Public URL al
    const { data: urlData } = sb().storage.from('avatars').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error('Public URL alınamadı');

    // Cache bust için timestamp ekle
    return `${publicUrl}?t=${Date.now()}`;
  },

  /**
   * Avatar URL'ini profile'a kaydet
   */
  async saveAvatarUrl(userId, url) {
    const { error } = await sb()
      .from('profiles')
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    return url;
  }
};

// =====================================================
// 🛠️ YARDIMCI FONKSİYONLAR
// =====================================================

// Hata mesajını Türkçe'ye çevir
function translateSupabaseError(error) {
  const msg = error?.message || '';
  if (msg.includes('duplicate key')) return 'Bu kayıt zaten mevcut.';
  if (msg.includes('violates foreign key')) return 'İlgili kayıt bulunamadı.';
  if (msg.includes('invalid input syntax for type uuid')) return 'Geçersiz ID formatı.';
  if (msg.includes('JWT')) return 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.';
  if (msg.includes('not authorized')) return 'Bu işlem için yetkiniz yok.';
  return msg || 'Beklenmeyen bir hata oluştu.';
}

// Toast göster (script.js'deki showToast'ı kullanır)
function dbError(error, prefix = '') {
  console.error('DB Error:', error);
  const msg = translateSupabaseError(error);
  if (typeof window.showToast === 'function') {
    window.showToast(`❌ ${prefix}${msg}`, 'error');
  }
}

// Supabase'i test et
async function testSupabaseConnection() {
  try {
    const { data, error } = await sb().from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase bağlantısı başarılı!');
    return true;
  } catch (e) {
    console.error('❌ Supabase bağlantı hatası:', e.message);
    return false;
  }
}

// =====================================================
// ⚽ TAKIM KATILIM İSTEKLERİ
// =====================================================

const TeamRequests = {
  // İstek gönder
  async send(teamId, playerId, message = '') {
    const { data, error } = await sb()
      .from('team_join_requests')
      .insert({ team_id: teamId, player_id: playerId, message, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Kullanıcının belirli takıma olan isteğini getir
  async getMyRequest(teamId, playerId) {
    const { data } = await sb()
      .from('team_join_requests')
      .select('*')
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .maybeSingle();
    return data || null;
  },

  // Takıma gelen bekleyen istekleri getir (kaptan görür)
  async getPendingForTeam(teamId) {
    const { data, error } = await sb()
      .from('team_join_requests')
      .select('*, player:player_id(id, username, avatar_url, gen_score, position, ana_mevki, city)')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) return [];
    return data || [];
  },

  // İsteği onayla → takıma üye ekle
  async approve(requestId) {
    const { data, error } = await sb()
      .from('team_join_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('team_id, player_id')
      .single();
    if (error) throw error;
    // team_members ve profil güncelle
    await sb().from('team_members')
      .insert({ team_id: data.team_id, player_id: data.player_id, role: 'player' });
    await sb().from('profiles')
      .update({ current_team_id: data.team_id })
      .eq('id', data.player_id);
    return data;
  },

  // İsteği reddet
  async reject(requestId) {
    const { error } = await sb()
      .from('team_join_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  // Bekleyen isteği iptal et
  async cancel(teamId, playerId) {
    const { error } = await sb()
      .from('team_join_requests')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .eq('status', 'pending');
    if (error) throw error;
  }
};

// =====================================================
// GLOBAL EXPORT
// =====================================================

window.DB = {
  Auth,
  Profiles,
  Friends,
  Teams,
  TeamRequests,
  Matches,
  Feed,
  Notifications,
  Ratings,
  Honors,
  Venues,
  Storage,
  error: dbError,
  test: testSupabaseConnection
};

// Bağlantıyı test et
document.addEventListener('DOMContentLoaded', async () => {
  if (window.sbClient) {
    const ok = await testSupabaseConnection();
    if (ok && typeof window.showToast === 'function') {
      // Sessiz — sadece console'a log
    }
  }
});

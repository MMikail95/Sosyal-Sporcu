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
  async getAll({ city, position, search, limit = 50 } = {}) {
    let query = sb()
      .from('profiles_with_ratings')
      .select('*')
      .order('gen_score', { ascending: false })
      .limit(limit);

    if (city) query = query.eq('city', city);
    if (position) query = query.eq('position', position);
    if (search) query = query.ilike('username', `%${search}%`);

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
  // Tüm takımları getir
  async getAll() {
    const { data, error } = await sb()
      .from('teams')
      .select(`*, captain:captain_id(id, username, avatar_url)`)
      .eq('is_active', true)
      .order('gen_score', { ascending: false });
    if (error) return [];
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
    const { data, error } = await sb()
      .from('teams')
      .insert({ captain_id: captainId, ...teamData })
      .select()
      .single();
    if (error) throw error;

    // Kaptanı üye olarak ekle
    await sb().from('team_members').insert({
      team_id: data.id,
      player_id: captainId,
      role: 'captain'
    });

    // Profili güncelle
    await sb().from('profiles').update({ current_team_id: data.id }).eq('id', captainId);

    return data;
  },

  // Takıma üye ekle
  async addMember(teamId, playerId, role = 'player') {
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

  // Kullanıcının TÜM takımlarını getir (birden fazla takım desteği)
  async getMyTeams(userId) {
    const { data, error } = await sb()
      .from('team_members')
      .select(`role, team:team_id(id, name, slug, city)`)
      .eq('player_id', userId);
    if (error) return [];
    return (data || []).map(d => ({ role: d.role, ...d.team }));
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

    await sb().from('team_members').insert({ team_id: team.id, player_id: userId, role: 'player' });
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

  // Takım ara (keşfet veya davet kodu göster)
  async search(query = '', limit = 20) {
    let q = sb()
      .from('teams')
      .select('*, captain:captain_id(id, username, avatar_url)')
      .eq('is_active', true)
      .order('gen_score', { ascending: false })
      .limit(limit);
    if (query) q = q.ilike('name', `%${query}%`);
    const { data, error } = await q;
    if (error) { console.error('Teams.search error:', error); return []; }
    return data || [];
  },

  // Slug / davet kodu üret (takım adından)
  generateSlug(name) {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8) || 'TEAM' + Math.random().toString(36).slice(2,6).toUpperCase();
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
  async dissolve(teamId, captainId) {
    // Tüm üyelerin profilinden takımı kaldır
    const { data: members } = await sb()
      .from('team_members')
      .select('player_id')
      .eq('team_id', teamId);
    if (members && members.length > 0) {
      const ids = members.map(m => m.player_id);
      await sb().from('profiles').update({ current_team_id: null }).in('id', ids);
    }
    // Takımı pasif yap (soft delete)
    const { error } = await sb()
      .from('teams')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .eq('captain_id', captainId);
    if (error) throw error;
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
        related_venue:related_venue_id(id, name)
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

  // Puan ver / güncelle
  async upsertRating(raterId, ratedPlayerId, ratings, comment = '') {
    const { data, error } = await sb()
      .from('community_ratings')
      .upsert({
        rater_id: raterId,
        rated_player_id: ratedPlayerId,
        rating_teknik: ratings.teknik,
        rating_sut: ratings.sut,
        rating_pas: ratings.pas,
        rating_hiz: ratings.hiz,
        rating_fizik: ratings.fizik,
        rating_kondisyon: ratings.kondisyon,
        comment,
        updated_at: new Date().toISOString()
      }, { onConflict: 'rated_player_id,rater_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
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
// GLOBAL EXPORT
// =====================================================

window.DB = {
  Auth,
  Profiles,
  Friends,
  Teams,
  Matches,
  Feed,
  Notifications,
  Ratings,
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

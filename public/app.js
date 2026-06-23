// ================================
//   NG NONTON — MAIN APP JS
//   By Setya Adi Hutama
// ================================

// ===== TMDB CONFIG =====
const TMDB_KEY = '7a2facd3a1ce9efab918f39d26ad2f8e';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const TMDB_LANG = 'id-ID';

// ===== PLAYER SOURCES (3 sumber, disembunyikan dari user) =====
const STREAM_SOURCES = {
  movie: [
    { name: 'VidLink',     url: (id)       => `https://vidlink.pro/movie/${id}?autoplay=true` },
    { name: 'Videasy',     url: (id)       => `https://player.videasy.net/movie/${id}` },
    { name: 'VidFast',     url: (id)       => `https://vidfast.pro/movie/${id}?autoPlay=true` },
    { name: 'VidSrc',      url: (id)       => `https://vidsrc.me/embed/movie?tmdb=${id}` },
    { name: 'EmbedSu',     url: (id)       => `https://embed.su/embed/movie/${id}` },
    { name: 'MultiEmbed',  url: (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  ],
  tv: [
    { name: 'VidLink',     url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true` },
    { name: 'Videasy',     url: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}` },
    { name: 'VidFast',     url: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true` },
    { name: 'VidSrc',      url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
    { name: 'EmbedSu',     url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
    { name: 'MultiEmbed',  url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
  ]
};

// Pesan status saat mencari sumber
const SOURCE_STATUS_MSGS = [
  'Sedang memilih sumber terbaik...',
  'Mencoba sumber lain...',
  'Mengalihkan ke sumber cadangan...',
];
let sourceRetryTimer = null;

// ===== STATE =====
let currentPage = 'home';
let heroItems = [];
let heroIndex = 0;
let heroTimer = null;
let currentDetailItem = null;
let currentDetailType = null;
let currentCategoryType = 'movie';
let currentCategoryPage = 1;
let currentSeason = 1;
let playerSourceIndex = 0;
let playerAutoSwitching = false;
let playerCurrentId = null;
let playerCurrentType = null;
let playerCurrentSeason = 1;
let playerCurrentEpisode = 1;
let watchlist = JSON.parse(localStorage.getItem('ng_watchlist') || '[]');
let genres = { movie: [], tv: [] };
let searchDebounce = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
  });
  fetchGenres().then(() => loadHome());
}

// ===== API HELPERS =====
async function tmdb(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', TMDB_LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

async function fetchGenres() {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdb('/genre/movie/list'),
      tmdb('/genre/tv/list')
    ]);
    genres.movie = movieGenres.genres || [];
    genres.tv = tvGenres.genres || [];
  } catch (e) { console.error('fetchGenres error:', e); }
}

function getPosterUrl(path, size = 'w342') {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}
function getBackdropUrl(path, size = 'w1280') {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}
function getYear(dateStr) { return dateStr ? dateStr.substring(0, 4) : '—'; }

// ===== HOME =====
async function loadHome() {
  try {
    const [trending, popularTV, topRated, nowPlaying] = await Promise.all([
      tmdb('/trending/movie/week'),
      tmdb('/tv/popular'),
      tmdb('/movie/top_rated'),
      tmdb('/movie/now_playing')
    ]);
    heroItems = (trending.results || []).slice(0, 6);
    setupHero();
    renderSlider('trendingMovies', trending.results || [], 'movie');
    renderSlider('popularSeries', popularTV.results || [], 'tv');
    renderSlider('topRated', topRated.results || [], 'movie');
    renderSlider('nowPlaying', nowPlaying.results || [], 'movie');
  } catch (e) {
    console.error('loadHome error:', e);
    showToast('Gagal memuat konten. Periksa koneksi.', 'error');
  }
}

function setupHero() {
  if (!heroItems.length) return;
  renderHeroItem(heroIndex);
  const ind = document.getElementById('heroIndicators');
  ind.innerHTML = heroItems.slice(0, 6).map((_, i) =>
    `<div class="indicator ${i === 0 ? 'active' : ''}" onclick="goHero(${i})"></div>`
  ).join('');
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % Math.min(heroItems.length, 6);
    renderHeroItem(heroIndex);
    updateIndicators();
  }, 6000);
}

function renderHeroItem(idx) {
  const item = heroItems[idx];
  if (!item) return;
  const bg = getBackdropUrl(item.backdrop_path) || getBackdropUrl(item.poster_path);
  if (bg) document.getElementById('heroBg').style.backgroundImage = `url('${bg}')`;
  document.getElementById('heroTitle').textContent = item.title || item.name || '';
  document.getElementById('heroDesc').textContent = item.overview || 'Deskripsi tidak tersedia.';

  const rating = (item.vote_average || 0).toFixed(1);
  const year = getYear(item.release_date || item.first_air_date);
  const lang = item.original_language ? item.original_language.toUpperCase() : '';

  document.getElementById('heroMeta').innerHTML = `
    <span class="rating">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ${rating}
    </span>
    <span class="meta-dot"></span>
    <span>${year}</span>
    ${lang ? `<span class="meta-dot"></span><span>${lang}</span>` : ''}
  `;
}

function goHero(idx) {
  heroIndex = idx;
  renderHeroItem(idx);
  updateIndicators();
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % Math.min(heroItems.length, 6);
    renderHeroItem(heroIndex);
    updateIndicators();
  }, 6000);
}
function updateIndicators() {
  document.querySelectorAll('.indicator').forEach((el, i) => {
    el.classList.toggle('active', i === heroIndex);
  });
}
function watchHero() {
  const item = heroItems[heroIndex];
  if (!item) return;
  openPlayer(item.id, item.media_type || 'movie', item.title || item.name, 1, 1);
}
function openDetailHero() {
  const item = heroItems[heroIndex];
  if (!item) return;
  openDetail(item.id, item.media_type === 'tv' ? 'tv' : 'movie');
}

// ===== RENDER SLIDER =====
function renderSlider(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(item => createCard(item, type)).join('');
}

// SVG ICONS
const ICON_PLAY = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const ICON_BOOKMARK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const ICON_BOOKMARK_FILLED = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const ICON_STAR = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

function createCard(item, type) {
  const poster = getPosterUrl(item.poster_path);
  const title = item.title || item.name || 'Unknown';
  const year = getYear(item.release_date || item.first_air_date);
  const rating = (item.vote_average || 0).toFixed(1);
  const wl = isInWatchlist(item.id, type);

  return `
    <div class="card" onclick="openDetail(${item.id}, '${type}')">
      ${poster
        ? `<img class="card-poster" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.parentElement.querySelector('.card-poster-placeholder').style.display='flex';this.style.display='none'">`
        : ''
      }
      <div class="card-poster-placeholder" style="display:${poster ? 'none' : 'flex'}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      </div>
      <div class="card-overlay">
        <div class="card-play-btn">${ICON_PLAY}</div>
      </div>
      <div class="card-type-badge">${type === 'tv' ? 'Series' : 'Film'}</div>
      <button class="card-watchlist-btn ${wl ? 'saved' : ''}"
        onclick="toggleWatchlistCard(event, ${item.id}, '${type}', '${escapeHtml(title)}', '${poster || ''}', '${year}', '${rating}')"
        title="${wl ? 'Hapus dari watchlist' : 'Simpan ke watchlist'}">
        ${wl ? ICON_BOOKMARK_FILLED : ICON_BOOKMARK}
      </button>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
        <div class="card-meta">
          <span class="card-rating">${ICON_STAR} ${rating}</span>
          <span>${year}</span>
        </div>
      </div>
    </div>
  `;
}

// ===== DETAIL MODAL =====
async function openDetail(id, type) {
  currentDetailItem = { id, type };
  currentDetailType = type;
  const modal = document.getElementById('detailModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('modalPoster').innerHTML = `<div class="modal-poster-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>`;
  document.getElementById('modalTitle').textContent = 'Memuat...';
  document.getElementById('modalMeta').innerHTML = '';
  document.getElementById('modalOverview').textContent = '';
  document.getElementById('modalBadges').innerHTML = '';
  document.getElementById('modalActions').innerHTML = '';
  document.getElementById('modalCast').innerHTML = '';
  document.getElementById('episodeSection').style.display = 'none';

  try {
    const [detail, credits] = await Promise.all([
      tmdb(`/${type}/${id}`, { append_to_response: 'videos' }),
      tmdb(`/${type}/${id}/credits`)
    ]);

    const title = detail.title || detail.name || '';
    const poster = getPosterUrl(detail.poster_path, 'w500');
    const year = getYear(detail.release_date || detail.first_air_date);
    const rating = (detail.vote_average || 0).toFixed(1);
    const runtime = detail.runtime
      ? `${Math.floor(detail.runtime / 60)}j ${detail.runtime % 60}m`
      : detail.number_of_seasons ? `${detail.number_of_seasons} Season` : '';
    const overview = detail.overview || 'Deskripsi tidak tersedia.';
    const genreList = (detail.genres || []).slice(0, 3);
    const cast = (credits.cast || []).slice(0, 8);
    const wl = isInWatchlist(id, type);

    document.getElementById('modalPoster').innerHTML = poster
      ? `<img src="${poster}" alt="${escapeHtml(title)}" style="width:100%;height:100%;object-fit:cover">`
      : `<div class="modal-poster-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>`;

    document.getElementById('modalBadges').innerHTML = [
      `<span class="badge badge-year">${year}</span>`,
      ...genreList.map(g => `<span class="badge badge-genre">${g.name}</span>`)
    ].join('');

    document.getElementById('modalTitle').textContent = title;

    document.getElementById('modalMeta').innerHTML = `
      <span class="star">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ${rating}
      </span>
      ${runtime ? `<span class="meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${runtime}</span>` : ''}
      ${detail.original_language ? `<span class="meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> ${detail.original_language.toUpperCase()}</span>` : ''}
      ${detail.status ? `<span class="meta-item">${detail.status}</span>` : ''}
    `;

    document.getElementById('modalOverview').textContent = overview;

    document.getElementById('modalActions').innerHTML = `
      <button class="btn-play" onclick="openPlayer(${id}, '${type}', '${escapeHtml(title).replace(/'/g, "\\'")}', 1, 1)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Tonton Sekarang
      </button>
      <button class="btn-watchlist" id="wlBtn" onclick="toggleWatchlistModal(${id}, '${type}', '${escapeHtml(title).replace(/'/g, "\\'")}', '${poster || ''}', '${year}', '${rating}')">
        ${wl
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Tersimpan`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Simpan`
        }
      </button>
    `;

    if (cast.length) {
      document.getElementById('modalCast').innerHTML = `
        <p class="section-label">Pemain Utama</p>
        <div class="cast-list">
          ${cast.map(c => {
            const img = c.profile_path ? `${TMDB_IMG}/w92${c.profile_path}` : '';
            return `
              <div class="cast-item">
                ${img
                  ? `<img class="cast-avatar" src="${img}" alt="${escapeHtml(c.name)}" loading="lazy">`
                  : `<div class="cast-avatar" style="display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`
                }
                <span class="cast-name">${escapeHtml(c.name)}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (type === 'tv' && detail.seasons) {
      const seasons = detail.seasons.filter(s => s.season_number > 0);
      if (seasons.length) {
        document.getElementById('episodeSection').style.display = 'block';
        currentSeason = 1;
        renderSeasonButtons(seasons, id);
        loadEpisodes(id, 1);
      }
    }

  } catch (e) {
    console.error('openDetail error:', e);
    document.getElementById('modalTitle').textContent = 'Gagal memuat detail';
    showToast('Gagal memuat detail konten', 'error');
  }
}

function renderSeasonButtons(seasons, id) {
  document.getElementById('seasonSelector').innerHTML = seasons.map(s => `
    <button class="season-btn ${s.season_number === 1 ? 'active' : ''}"
      onclick="selectSeason(${s.season_number}, ${id})">Season ${s.season_number}</button>
  `).join('');
}

async function selectSeason(num, id) {
  currentSeason = num;
  document.querySelectorAll('.season-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === `Season ${num}`);
  });
  loadEpisodes(id, num);
}

async function loadEpisodes(id, season) {
  const list = document.getElementById('episodeList');
  list.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:8px 0">Memuat episode...</p>';
  try {
    const data = await tmdb(`/tv/${id}/season/${season}`);
    const episodes = data.episodes || [];
    if (!episodes.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:13px">Episode tidak tersedia</p>';
      return;
    }
    list.innerHTML = episodes.map(ep => {
      const title = ep.name || `Episode ${ep.episode_number}`;
      const runtime = ep.runtime ? `${ep.runtime} menit` : '';
      return `
        <div class="episode-item" onclick="openPlayer(${id}, 'tv', '${escapeHtml(title).replace(/'/g, "\\'")}', ${season}, ${ep.episode_number})">
          <div class="ep-num">${ep.episode_number}</div>
          <div class="ep-info">
            <div class="ep-title">${escapeHtml(title)}</div>
            ${runtime ? `<div class="ep-runtime">${runtime}</div>` : ''}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:var(--text3)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = '<p style="color:var(--text3);font-size:13px">Gagal memuat episode</p>';
  }
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== PLAYER =====
function openPlayer(id, type, title, season = 1, episode = 1) {
  closeModal();
  playerSourceIndex = 0;
  playerAutoSwitching = false;
  playerCurrentId = id;
  playerCurrentType = type;
  playerCurrentSeason = season;
  playerCurrentEpisode = episode;
  if (sourceRetryTimer) { clearTimeout(sourceRetryTimer); sourceRetryTimer = null; }

  const modal = document.getElementById('playerModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('playerTitle').textContent = title + (type === 'tv' ? ` — S${season} E${episode}` : '');

  updateSourceBar(0);
  loadSourceAuto(id, type, season, episode, 0);
}

// Update tampilan source bar (nama sumber, counter, disable tombol)
function updateSourceBar(idx) {
  const sources = STREAM_SOURCES[playerCurrentType] || STREAM_SOURCES.movie;
  const nameEl    = document.getElementById('sourceNameEl');
  const counterEl = document.getElementById('sourceCounterEl');
  const prevBtn   = document.getElementById('sourcePrevBtn');
  const nextBtn   = document.getElementById('sourceNextBtn');
  if (nameEl)    { nameEl.style.opacity = '0.4'; setTimeout(() => { nameEl.textContent = sources[idx] ? sources[idx].name : '—'; nameEl.style.opacity = '1'; }, 150); }
  if (counterEl) counterEl.textContent = sources.length ? `${idx + 1}/${sources.length}` : '';
  if (prevBtn)   prevBtn.disabled = idx <= 0;
  if (nextBtn)   nextBtn.disabled = idx >= sources.length - 1;
}

// Manual switch: arah = -1 (prev) atau +1 (next)
function switchSource(dir) {
  const sources = STREAM_SOURCES[playerCurrentType] || STREAM_SOURCES.movie;
  const newIdx = playerSourceIndex + dir;
  if (newIdx < 0 || newIdx >= sources.length) return;
  playerSourceIndex = newIdx;
  playerAutoSwitching = false;
  sourceSuccessFlag = false;
  clearSourceTimers();
  updateSourceBar(newIdx);
  loadSourceAuto(playerCurrentId, playerCurrentType, playerCurrentSeason, playerCurrentEpisode, newIdx);
}

// Tracker: apakah sudah terima sinyal sukses dari iframe saat ini
let sourceSuccessFlag = false;

function setPlayerStatus(text, sub) {
  const statusEl = document.getElementById('playerLoadingText');
  const subEl    = document.getElementById('playerLoadingSubText');
  if (statusEl) statusEl.textContent = text;
  if (subEl)    subEl.textContent    = sub || '';
}

function setPlayerError() {
  const loading = document.getElementById('playerLoading');
  if (loading) loading.classList.remove('hidden');

  const ringWrap = document.querySelector('.loader-ring-wrap');
  if (ringWrap) {
    ringWrap.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;
  }

  const statusEl = document.getElementById('playerLoadingText');
  const subEl    = document.getElementById('playerLoadingSubText');
  if (statusEl) statusEl.textContent = 'Konten tidak tersedia di semua sumber';
  if (subEl) subEl.innerHTML = `Coba ganti sumber secara manual pakai tombol ← → di bawah, atau tutup player.<br>
    <button onclick="closePlayer()" style="margin-top:14px;padding:8px 20px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">
      Tutup Player
    </button>`;
}

function resetPlayerRing() {
  const ringWrap = document.querySelector('.loader-ring-wrap');
  if (ringWrap) {
    ringWrap.innerHTML = `
      <div class="loader-ring"></div>
      <div class="loader-ring-2"></div>
      <div class="loader-dot"></div>
    `;
  }
}

function clearSourceTimers() {
  if (sourceRetryTimer) { clearTimeout(sourceRetryTimer); sourceRetryTimer = null; }
}

function loadSourceAuto(id, type, season, episode, idx) {
  const sources = STREAM_SOURCES[type] || STREAM_SOURCES.movie;

  if (idx >= sources.length) {
    setPlayerError();
    return;
  }

  const src     = sources[idx];
  const frame   = document.getElementById('playerFrame');
  const loading = document.getElementById('playerLoading');

  sourceSuccessFlag = false;
  clearSourceTimers();
  resetPlayerRing();
  loading.classList.remove('hidden');

  if (idx === 0) {
    setPlayerStatus('Sedang memilih sumber terbaik...', 'Harap tunggu sebentar');
  } else {
    const msgs = ['Mencoba sumber lain...', 'Mengalihkan ke sumber cadangan...'];
    setPlayerStatus(msgs[Math.min(idx - 1, msgs.length - 1)], `Sumber ${idx + 1} dari ${sources.length}`);
  }

  const url = type === 'tv' ? src.url(id, season, episode) : src.url(id);

  // Bersihkan state lama
  frame.src = 'about:blank';
  if (frame._msgCleanups) {
    frame._msgCleanups.forEach(fn => window.removeEventListener('message', fn));
    frame._msgCleanups = [];
  }

  const tryNext = () => {
    if (sourceSuccessFlag) return;
    const nextIdx = idx + 1;
    playerSourceIndex = nextIdx;
    updateSourceBar(nextIdx);
    loadSourceAuto(id, type, season, episode, nextIdx);
  };

  // ============================================================
  // STRATEGI: Dual-channel detection
  //
  // 1. postMessage: kalau player kirim pesan → langsung sukses (no wait)
  // 2. Timeout fallback: kalau tidak ada postMessage dalam TIMEOUT_MS → tryNext()
  //
  // Nilai TIMEOUT_MS dipilih berdasarkan behavior nyata:
  //  - Player yang sukses biasanya kirim postMessage dalam 1-4 detik
  //  - Error page tidak pernah kirim postMessage
  //  - Timeout 6 detik: cukup sabar untuk koneksi lambat, cukup cepat untuk UX
  // ============================================================
  const TIMEOUT_MS = 8000;

  const onMessage = (e) => {
    if (sourceSuccessFlag) return;
    // Terima postMessage dari domain manapun yang bukan same-origin
    // Jangan filter per-domain — banyak player pakai subdomain/CDN berbeda
    if (e.origin === window.location.origin) return;
    sourceSuccessFlag = true;
    clearSourceTimers();
    window.removeEventListener('message', onMessage);
    if (frame._msgCleanups) {
      frame._msgCleanups = frame._msgCleanups.filter(fn => fn !== onMessage);
    }
    loading.classList.add('hidden');
  };

  window.addEventListener('message', onMessage);
  if (!frame._msgCleanups) frame._msgCleanups = [];
  frame._msgCleanups.push(onMessage);

  setTimeout(() => {
    if (!document.getElementById('playerModal').classList.contains('open')) return;
    frame.src = url;

    // Tambahan: sembunyikan loading saat iframe selesai load (fallback dari postMessage)
    const onFrameLoad = () => {
      frame.removeEventListener('load', onFrameLoad);
      if (!sourceSuccessFlag && frame.src !== 'about:blank') {
        sourceSuccessFlag = true;
        clearSourceTimers();
        window.removeEventListener('message', onMessage);
        loading.classList.add('hidden');
      }
    };
    frame.addEventListener('load', onFrameLoad);

    sourceRetryTimer = setTimeout(() => {
      if (!sourceSuccessFlag) {
        frame.removeEventListener('load', onFrameLoad);
        window.removeEventListener('message', onMessage);
        tryNext();
      }
    }, TIMEOUT_MS);
  }, 300);
}

// (duplicate switchSource removed — handled by the one above)

function closePlayer() {
  clearSourceTimers();
  sourceSuccessFlag = false;
  const frame = document.getElementById('playerFrame');
  if (frame._loadHandler) { frame.removeEventListener('load', frame._loadHandler); frame._loadHandler = null; }
  if (frame._msgCleanups) { frame._msgCleanups.forEach(fn => window.removeEventListener('message', fn)); frame._msgCleanups = []; }
  frame.src = 'about:blank';
  document.getElementById('playerModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('playerLoading').classList.remove('hidden');
  resetPlayerRing();
  setPlayerStatus('Sedang memilih sumber terbaik...', 'Harap tunggu sebentar');
}

// ===== CATEGORY =====
async function showCategory(type) {
  currentCategoryType = type;
  currentCategoryPage = 1;
  setActivePage('categoryPage');
  setActiveNav(type === 'movie' ? 'navMovies' : 'navSeries');
  document.getElementById('categoryTitle').textContent = type === 'movie' ? 'Semua Film' : 'Semua Series';

  const genreFilter = document.getElementById('genreFilter');
  genreFilter.innerHTML = `<option value="">Semua Genre</option>` +
    (genres[type] || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  await loadCategoryPage();
}

async function loadCategoryPage() {
  const type = currentCategoryType;
  const genreId = document.getElementById('genreFilter')?.value || '';
  const sort = document.getElementById('sortFilter')?.value || 'popularity.desc';
  const grid = document.getElementById('categoryGrid');

  grid.innerHTML = Array(12).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-poster"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');

  try {
    const params = { sort_by: sort, page: currentCategoryPage };
    if (genreId) params.with_genres = genreId;
    const data = await tmdb(`/discover/${type}`, params);
    const items = data.results || [];
    const totalPages = Math.min(data.total_pages || 1, 20);
    grid.innerHTML = items.map(item => createCard(item, type)).join('');
    renderPagination(currentCategoryPage, totalPages);
  } catch (e) {
    grid.innerHTML = '<p style="padding:40px;color:var(--text2)">Gagal memuat konten</p>';
  }
}

function filterCategory() { currentCategoryPage = 1; loadCategoryPage(); }

function renderPagination(current, total) {
  const container = document.getElementById('categoryPagination');
  const pages = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i);
  container.innerHTML = [
    current > 1 ? `<button class="page-btn" onclick="goPage(${current - 1})">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Prev</button>` : '',
    ...pages.map(p => `<button class="page-btn ${p === current ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`),
    current < total ? `<button class="page-btn" onclick="goPage(${current + 1})">Next
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>` : ''
  ].join('');
}

function goPage(page) {
  currentCategoryPage = page;
  loadCategoryPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== SEARCH =====
function handleSearch(e) {
  if (e.key === 'Enter') { doSearch(); return; }
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    if (document.getElementById('searchInput').value.trim().length >= 2) doSearch();
  }, 500);
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  setActivePage('searchPage');
  setActiveNav(null);
  document.getElementById('searchQuery').textContent = q;
  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '<p style="padding:40px;color:var(--text2)">Mencari...</p>';

  try {
    const data = await tmdb('/search/multi', { query: q });
    const items = (data.results || []).filter(i => i.media_type !== 'person');
    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <h3>Tidak ditemukan</h3>
          <p>Coba kata kunci yang berbeda</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = items.map(item => createCard(item, item.media_type || 'movie')).join('');
  } catch (e) {
    grid.innerHTML = '<p style="padding:40px;color:var(--text2)">Gagal mencari</p>';
  }
}

// ===== WATCHLIST =====
function isInWatchlist(id, type) {
  return watchlist.some(i => i.id === id && i.type === type);
}
function toggleWatchlistCard(e, id, type, title, poster, year, rating) {
  e.stopPropagation();
  const idx = watchlist.findIndex(i => i.id === id && i.type === type);
  if (idx > -1) {
    watchlist.splice(idx, 1);
    e.currentTarget.innerHTML = ICON_BOOKMARK;
    e.currentTarget.classList.remove('saved');
    showToast(`"${title}" dihapus dari watchlist`);
  } else {
    watchlist.push({ id, type, title, poster, year, rating });
    e.currentTarget.innerHTML = ICON_BOOKMARK_FILLED;
    e.currentTarget.classList.add('saved');
    showToast(`"${title}" disimpan ke watchlist`, 'success');
  }
  saveWatchlist();
}
function toggleWatchlistModal(id, type, title, poster, year, rating) {
  const idx = watchlist.findIndex(i => i.id === id && i.type === type);
  const btn = document.getElementById('wlBtn');
  if (idx > -1) {
    watchlist.splice(idx, 1);
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Simpan`;
    showToast('Dihapus dari watchlist');
  } else {
    watchlist.push({ id, type, title, poster, year, rating });
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Tersimpan`;
    showToast('Disimpan ke watchlist', 'success');
  }
  saveWatchlist();
}
function saveWatchlist() { localStorage.setItem('ng_watchlist', JSON.stringify(watchlist)); }
function showWatchlist() {
  setActivePage('watchlistPage');
  setActiveNav('navWatchlist');
  const grid = document.getElementById('watchlistGrid');
  const empty = document.getElementById('watchlistEmpty');
  if (!watchlist.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = watchlist.map(item => createCard(item, item.type)).join('');
}

// ===== NAVIGATION =====
function showHome() { setActivePage('homePage'); setActiveNav('navHome'); }
function setActivePage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setActiveNav(id) {
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== UTILS =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('playerModal').classList.contains('open')) closePlayer();
    else if (document.getElementById('detailModal').classList.contains('open')) closeModal();
  }
});
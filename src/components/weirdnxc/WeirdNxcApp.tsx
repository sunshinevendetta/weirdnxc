// @ts-nocheck
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import anime from 'animejs/lib/anime.es.js';
import audioCatalog from '../../../public/music/tracks.json';

gsap.registerPlugin(useGSAP, CustomEase);
/* ============================================================
   weirdnxc — world data (real compilation universe)
   stay weird ✦ founded by gasoiid · co-run by sunshine vendetta
   ============================================================ */

const C = (f) => '/covers/' + f + '.png';

// palettes still used for procedural avatars / fallbacks / accents
const PAL = {
  acid:   ['#ff45c0', '#c79bff', '#34d6ff'],
  sun:    ['#ffe23d', '#ff9a47', '#ff45c0'],
  ice:    ['#34d6ff', '#c79bff', '#ffffff'],
  lime:   ['#aef23a', '#34d6ff', '#c79bff'],
  bubble: ['#ffa6e4', '#ff45c0', '#c79bff'],
  candy:  ['#ff45c0', '#ffe23d', '#34d6ff'],
  mint:   ['#8effc6', '#34d6ff', '#c79bff'],
  perreo: ['#ffe23d', '#ff45c0', '#7a2d86'],
};
const MOTIF = ['orb', 'rings', 'star', 'grid', 'blob', 'heart', 'cross', 'wave'];
const ACT_YEARS = { ACT1: 2018, ACT2: 2019, ACT3: 2020, ACT4: 2021, ACT5: 2022, ACT6: 2023, ACT7: 2024 };

/* ---------------- real catalog state ---------------- */
let ARTISTS = [];
let RELEASES = [];

// Real static catalog from public/music/tracks.json. No runtime fetch/API calls.
const ACT_STYLE = {
  ACT1: { pal: 'lime', motif: 'grid', color: '#aef23a', coverFallback: C('r_act1') },
  ACT2: { pal: 'bubble', motif: 'heart', color: '#ffa6e4', coverFallback: C('r_act2') },
  ACT3: { pal: 'candy', motif: 'star', color: '#ff2d9b', coverFallback: C('r_act3') },
  ACT4: { pal: 'bubble', motif: 'orb', color: '#ff45c0', coverFallback: C('r_act4') },
  ACT5: { pal: 'candy', motif: 'heart', color: '#ff45c0', coverFallback: C('r_act5') },
  ACT6: { pal: 'ice', motif: 'rings', color: '#34d6ff', coverFallback: C('r_act6') },
  ACT7: { pal: 'sun', motif: 'star', color: '#ff8a3d', coverFallback: C('r_act7') },
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    || 'artist';
}

function normalizeAlbumTitle(value, actNumber) {
  return String(value || `WEIRD NXC® - ACT ${actNumber}`)
    .replace(/\s+/g, ' ')
    .replace(/\s+-\s+/g, ' — ')
    .trim();
}

function cleanCreditName(value) {
  return String(value || '')
    .replace(/^\((?:bonus|bonus²|bonus2|surprise[^)]*)\)\s*/iu, '')
    .trim();
}

function buildCatalogFromAudioJson(catalog) {
  let tid = 0;
  return Object.entries(catalog)
    .sort(([a], [b]) => Number(a.replace('ACT', '')) - Number(b.replace('ACT', '')))
    .map(([actKey, actData]) => {
      const actNumber = Number(actKey.replace('ACT', ''));
      const style = ACT_STYLE[actKey] || ACT_STYLE.ACT7;
      const cover = `/music/${actKey}/${actData.cover || 'cover.png'}`;
      const title = normalizeAlbumTitle(actData.tracks?.[0]?.album, actNumber);
      const tracks = (actData.tracks || []).map((track, index) => ({
        id: `${actKey.toLowerCase()}-${track.filename.replace(/\.[^.]+$/, '')}`,
        sourceIndex: ++tid,
        title: track.title,
        artist: cleanCreditName(track.artist),
        album: track.album,
        act: actKey,
        actNumber,
        year: ACT_YEARS[actKey] || '',
        trackNumber: index + 1,
        filename: track.filename,
        duration: track.duration,
        dur: fmt(track.duration),
        audioSrc: `/music/${actKey}/${track.filename}`,
        audioAlbum: actKey,
        cover,
        pal: style.pal,
        motif: style.motif,
        color: style.color,
      }));
      return {
        id: actKey.toLowerCase(),
        act: actKey,
        actNumber,
        actLabel: `ACT ${actNumber}`,
        title,
        artist: 'various artists',
        artistId: 'various-artists',
        type: 'Compilation',
        year: ACT_YEARS[actKey] || '',
        pal: style.pal,
        motif: style.motif,
        cover,
        coverFallback: style.coverFallback,
        color: style.color,
        tag: actNumber === 7 ? 'new' : '',
        blurb: `${title}. ${tracks.length} tracks from the Weird NXC ACT series.`,
        tracks,
      };
    })
    .sort((a, b) => a.actNumber - b.actNumber);
}

function buildRosterFromReleases(releases) {
  const map = new Map();
  releases.forEach((release) => {
    release.tracks.forEach((track) => {
      const name = track.artist;
      const idBase = slugify(name);
      const existing = map.get(idBase) || {
        id: idBase,
        name,
        tag: 'catalog artist',
        genres: ['nxc', 'remix'],
        pal: track.pal,
        motif: track.motif,
        accent: track.color,
        cover: track.cover,
        trackCount: 0,
        acts: new Set(),
        years: new Set(),
        tracks: [],
        bio: '',
      };
      existing.trackCount += 1;
      existing.acts.add(track.act);
      existing.years.add(track.year);
      existing.tracks.push({ ...track, releaseId: release.id });
      map.set(idBase, existing);
    });
  });
  return Array.from(map.values())
    .map((artist) => ({
      ...artist,
      acts: Array.from(artist.acts).sort((a, b) => Number(a.replace('ACT', '')) - Number(b.replace('ACT', ''))),
      years: Array.from(artist.years).sort((a, b) => a - b),
      monthly: `${artist.trackCount} track${artist.trackCount === 1 ? '' : 's'}`,
      city: artist.acts.size === 1 ? artist.acts.values().next().value : `${artist.acts.size} ACTs`,
      bio: `${artist.name} is credited on ${artist.trackCount} Weird NXC track${artist.trackCount === 1 ? '' : 's'} across ${artist.acts.size} ACT${artist.acts.size === 1 ? '' : 's'}.`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en-US', { sensitivity: 'base' }));
}

RELEASES = buildCatalogFromAudioJson(audioCatalog);
ARTISTS = buildRosterFromReleases(RELEASES);

const ALL_TRACKS = RELEASES.flatMap(r => r.tracks.map(t => ({ ...t, releaseId: r.id, color: r.color, pal: r.pal, motif: r.motif, cover: r.cover })));

const STATS = { artists: ARTISTS.length, releases: RELEASES.length, tracks: ALL_TRACKS.length, founded: 2018, streams: `${ALL_TRACKS.length} tracks` };
const CURRENT_YEAR = new Date().getFullYear();

/* ============================================================
   weirdnxc — stores + shared UI
   ============================================================ */

/* ---------------- tiny global store ---------------- */
function createStore(initial) {
  let state = initial;
  const subs = new Set();
  const get = () => state;
  const set = (patch) => {
    state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
    subs.forEach(fn => fn());
  };
  const use = () => {
    const [, force] = useState(0);
    useEffect(() => {
      const fn = () => force(n => n + 1);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);
    return state;
  };
  return { get, set, use };
}

// ROUTER
const navStore = createStore({ route: 'home', param: null, history: ['home'] });
const ROUTE_IDS = new Set(['home', 'roster', 'artist', 'releases', 'release', 'playlist', 'contact']);

function routeHash(route, param = null) {
  const base = ROUTE_IDS.has(route) ? route : 'home';
  return '#' + encodeURIComponent(base) + (param ? '/' + encodeURIComponent(String(param)) : '');
}

function routeFromHash() {
  if (typeof window === 'undefined') return { route: 'home', param: null };
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { route: 'home', param: null };
  const [routePart, ...paramParts] = raw.split('/');
  const route = decodeURIComponent(routePart || 'home');
  if (!ROUTE_IDS.has(route)) return { route: 'home', param: null };
  const param = paramParts.length ? decodeURIComponent(paramParts.join('/')) : null;
  return { route, param };
}

function go(route, param = null) {
  const el = document.querySelector('.scroll-area');
  if (el) el.scrollTop = 0;
  const next = ROUTE_IDS.has(route) ? route : 'home';
  const nextParam = param ? String(param) : null;
  if (typeof window !== 'undefined') {
    const nextHash = routeHash(next, nextParam);
    if (window.location.hash !== nextHash) window.history.pushState(null, '', nextHash);
  }
  navStore.set(s => ({ route: next, param: nextParam, history: [...s.history, next] }));
}

// CART
const cartStore = createStore({ items: [], open: false, lastAdd: null });
function addToCart(item) {
  cartStore.set(s => {
    const key = item.id + (item.variant || '');
    const existing = s.items.find(i => i.key === key);
    let items;
    if (existing) items = s.items.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
    else items = [...s.items, { ...item, key, qty: 1 }];
    return { ...s, items, lastAdd: Date.now() };
  });
}
function removeFromCart(key) { cartStore.set(s => ({ ...s, items: s.items.filter(i => i.key !== key) })); }
function setQty(key, qty) { cartStore.set(s => ({ ...s, items: s.items.map(i => i.key === key ? { ...i, qty: Math.max(1, qty) } : i) })); }
function cartCount(s) { return s.items.reduce((a, i) => a + i.qty, 0); }
function cartTotal(s) { return s.items.reduce((a, i) => a + i.qty * i.price, 0); }

/* ---------------- procedural cover art ---------------- */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

function CoverArt({ palKey = 'acid', motif = 'orb', seed = 'x', round = 16, className = '', style = {}, animated = true, src = null }) {
  if (src) {
    return (
      <div className={`gloss ${className}`} style={{ position: 'relative', overflow: 'hidden', borderRadius: round, aspectRatio: '1/1', background: '#ffd6ef', ...style }}>
        <img src={src} alt="" loading="lazy" draggable="false" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  const cols = (PAL && PAL[palKey]) || ['#ff2bd6', '#9b5cff', '#13e7ff'];
  const h = hashStr(seed + motif);
  const rot = (h % 360);
  const ox = 20 + (h % 60), oy = 20 + ((h >> 3) % 60);
  const [c0, c1, c2] = cols;
  const uid = 'g' + (h % 99999);

  const shapes = [];
  if (motif === 'orb') {
    shapes.push(<circle key="a" cx={ox} cy={oy} r="34" fill={`url(#${uid}r)`} />);
    shapes.push(<circle key="b" cx={ox} cy={oy} r="20" fill="rgba(255,255,255,0.35)" />);
  } else if (motif === 'rings') {
    [38, 28, 18, 9].forEach((r, i) => shapes.push(<circle key={i} cx="50" cy="50" r={r} fill="none" stroke={i % 2 ? c2 : '#fff'} strokeWidth="3" opacity={0.9 - i * 0.12} />));
  } else if (motif === 'star') {
    shapes.push(<path key="s" d={starPath(50, 50, 5, 38, 16)} fill={`url(#${uid}r)`} stroke="#fff" strokeWidth="1.5" />);
  } else if (motif === 'grid') {
    for (let i = 1; i < 6; i++) {
      shapes.push(<line key={'h' + i} x1="0" y1={i * 16.6} x2="100" y2={i * 16.6} stroke="#fff" strokeWidth="1.4" opacity="0.5" />);
      shapes.push(<line key={'v' + i} x1={i * 16.6} y1="0" x2={i * 16.6} y2="100" stroke="#fff" strokeWidth="1.4" opacity="0.5" />);
    }
    shapes.push(<rect key="r" x={ox - 24} y={oy - 24} width="34" height="34" fill={c2} transform={`rotate(${rot} ${ox} ${oy})`} />);
  } else if (motif === 'blob') {
    shapes.push(<path key="b" d="M50 14c16 0 32 10 32 30s-10 42-32 42S18 64 18 44 34 14 50 14Z" fill={`url(#${uid}r)`} transform={`rotate(${rot} 50 50)`} />);
    shapes.push(<circle key="d" cx={ox} cy={oy} r="8" fill="#fff" opacity="0.6" />);
  } else if (motif === 'heart') {
    shapes.push(<path key="h" d="M50 78C24 60 14 44 14 32c0-11 9-18 18-18 7 0 13 4 18 11 5-7 11-11 18-11 9 0 18 7 18 18 0 12-10 28-36 46Z" fill={`url(#${uid}r)`} stroke="#fff" strokeWidth="1.5" />);
  } else if (motif === 'cross') {
    shapes.push(<rect key="v" x="42" y="14" width="16" height="72" rx="4" fill={`url(#${uid}r)`} transform={`rotate(${rot} 50 50)`} />);
    shapes.push(<rect key="h" x="22" y="34" width="56" height="16" rx="4" fill="#fff" opacity="0.85" transform={`rotate(${rot} 50 50)`} />);
  } else if (motif === 'wave') {
    for (let i = 0; i < 4; i++) shapes.push(<path key={i} d={`M0 ${30 + i * 14} Q25 ${14 + i * 14} 50 ${30 + i * 14} T100 ${30 + i * 14}`} fill="none" stroke={i % 2 ? '#fff' : c2} strokeWidth="3" opacity="0.85" />);
  }

  return (
    <div className={`gloss ${className}`} style={{ position: 'relative', overflow: 'hidden', borderRadius: round, aspectRatio: '1/1', ...style }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c0} />
            <stop offset="0.55" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
          <radialGradient id={uid + 'r'} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.3" stopColor={c0} />
            <stop offset="1" stopColor={c1} />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${uid})`} />
        <g className={animated ? 'cover-motif' : ''} style={{ transformOrigin: '50px 50px' }}>{shapes}</g>
      </svg>
    </div>
  );
}
function starPath(cx, cy, spikes, outer, inner) {
  let rot = Math.PI / 2 * 3, path = '', step = Math.PI / spikes;
  path += `M${cx},${cy - outer}`;
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outer, y = cy + Math.sin(rot) * outer; path += `L${x},${y}`; rot += step;
    x = cx + Math.cos(rot) * inner; y = cy + Math.sin(rot) * inner; path += `L${x},${y}`; rot += step;
  }
  return path + 'Z';
}

/* ---------------- chrome / marquee / sticker ---------------- */
function Chrome({ children, className = '', style = {} }) {
  return <span className={`chrome-text ${className}`} style={style}>{children}</span>;
}

function Marquee({ items, sep = '✦', speed = 26, className = '', color }) {
  const content = items.map((t, i) => (
    <span key={i} style={{ padding: '0 22px', display: 'inline-flex', alignItems: 'center', gap: 22, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: color || 'inherit' }}>
      {t}<span style={{ color: 'var(--lime)' }}>{sep}</span>
    </span>
  ));
  return (
    <div className={`ticker ${className}`}>
      <div className="ticker__track" style={{ animationDuration: speed + 's' }}>{content}{content}</div>
    </div>
  );
}

function Sticker({ children, bg = 'var(--lime)', size = 64, rot = -12, style = {} }) {
  return <span className="sticker float" style={{ width: size, height: size, background: bg, fontSize: size * 0.22, transform: `rotate(${rot}deg)`, ...style }}>{children}</span>;
}

/* ---------------- sparkle cursor ---------------- */
function SparkleCursor() {
  useEffect(() => {
    if (matchMedia('(hover: none)').matches) return;
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let rx = 0, ry = 0, x = 0, y = 0, raf, last = 0;
    const sparkChars = ['✦', '✧', '⋆', '✶', '·'];
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      const t = e.target;
      const interactive = t.closest && t.closest('button,a,.card-hover,[data-cursor]');
      ring.classList.toggle('big', !!interactive);
      const now = Date.now();
      if (now - last > 38) {
        last = now;
        const s = document.createElement('div'); s.className = 'spark';
        s.textContent = sparkChars[(Math.random() * sparkChars.length) | 0];
        s.style.color = ['#ff2bd6', '#13e7ff', '#c6ff2e', '#ffe14d'][(Math.random() * 4) | 0];
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.transform = `translate(-50%,-50%) scale(${0.6 + Math.random()})`;
        document.body.appendChild(s);
        const dx = (Math.random() - 0.5) * 40, dy = 20 + Math.random() * 30;
        s.animate([{ opacity: 1, transform: s.style.transform }, { opacity: 0, transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(0.2)` }], { duration: 700, easing: 'cubic-bezier(.3,.8,.4,1)' }).onfinish = () => s.remove();
      }
    };
    const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; raf = requestAnimationFrame(loop); };
    addEventListener('mousemove', move); loop();
    return () => { removeEventListener('mousemove', move); cancelAnimationFrame(raf); dot.remove(); ring.remove(); };
  }, []);
  return null;
}

/* ---------------- equalizer ---------------- */
function EQ({ playing = true, className = '' }) {
  return <span className={`eq ${playing ? '' : 'paused'} ${className}`}>{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</span>;
}

/* ---------------- floating decor blobs ---------------- */
function Decor() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div className="float" style={{ position: 'absolute', top: '8%', right: '6%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ff7ae0, #9b5cff)', filter: 'blur(8px)', opacity: 0.5, animationDuration: '7s' }} />
      <div className="float" style={{ position: 'absolute', bottom: '12%', left: '-4%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #13e7ff, #0a0411)', filter: 'blur(10px)', opacity: 0.45, animationDuration: '9s' }} />
    </div>
  );
}

/* ============================================================
   weirdnxc — persistent local music player
   ============================================================ */
const playerStore = createStore({
  queue: ALL_TRACKS,
  index: 0,
  playing: false,
  t: 0,            // seconds elapsed
  dur: 0,          // seconds total
  shuffle: false,
  repeat: false,
  volume: 0.86,
  muted: false,
  expanded: false, // now-playing overlay
  showQueue: false,
});

function parseDur(s) { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; }
function fmt(s) { s = Math.max(0, Math.floor(s)); const m = (s / 60) | 0; const ss = s % 60; return m + ':' + String(ss).padStart(2, '0'); }

function curTrack() { const s = playerStore.get(); return s.queue[s.index]; }

let _audio = null;
let _audioSrc = null;

function getAudio() {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = document.createElement('audio');
    _audio.preload = 'metadata';
    _audio.style.display = 'none';
    _audio.volume = playerStore.get().volume;
    _audio.muted = playerStore.get().muted;
    document.body.appendChild(_audio);
  }
  return _audio;
}

function syncAudio(s = playerStore.get()) {
  const audio = getAudio();
  const t = s.queue[s.index];
  if (!audio || !t?.audioSrc) {
    if (audio) audio.pause();
    return;
  }
  const absoluteSrc = new URL(t.audioSrc, window.location.href).href;
  if (_audioSrc !== absoluteSrc) {
    _audioSrc = absoluteSrc;
    audio.src = absoluteSrc;
    audio.currentTime = 0;
    audio.load();
  }
  audio.volume = Math.max(0, Math.min(1, s.volume ?? 0.86));
  audio.muted = !!s.muted;
  if (Math.abs(audio.currentTime - s.t) > 1.5) audio.currentTime = s.t || 0;
  if (s.playing) {
    audio.play().catch(() => playerStore.set({ playing: false }));
  } else {
    audio.pause();
  }
}

function playTrack(track, queue) {
  playerStore.set(s => {
    const q = queue || s.queue;
    let idx = q.findIndex(t => t.id === track.id);
    if (idx < 0) { q.unshift(track); idx = 0; }
    return { ...s, queue: q, index: idx, playing: true, t: 0, dur: parseDur(track.dur) };
  });
  syncAudio();
}
function playRelease(release, startId) {
  const q = release.tracks.map(t => ({ ...t, releaseId: release.id, color: release.color, pal: release.pal, motif: release.motif }));
  const start = startId ? q.find(t => t.id === startId) : q[0];
  playTrack(start, q);
}
function togglePlay() { playerStore.set(s => ({ ...s, playing: !s.playing, dur: s.dur || parseDur(s.queue[s.index].dur) })); syncAudio(); }
function next() {
  playerStore.set(s => {
    let i = s.shuffle ? (Math.random() * s.queue.length) | 0 : (s.index + 1) % s.queue.length;
    return { ...s, index: i, t: 0, dur: parseDur(s.queue[i].dur), playing: true };
  });
  syncAudio();
}
function prev() {
  playerStore.set(s => {
    if (s.t > 3) return { ...s, t: 0 };
    let i = (s.index - 1 + s.queue.length) % s.queue.length;
    return { ...s, index: i, t: 0, dur: parseDur(s.queue[i].dur), playing: true };
  });
  syncAudio();
}
function seekTo(frac) {
  playerStore.set(s => ({ ...s, t: frac * (s.dur || parseDur(s.queue[s.index].dur)) }));
  const audio = getAudio();
  const s = playerStore.get();
  if (audio && s.queue[s.index]?.audioSrc) audio.currentTime = s.t;
}
function addToQueue(track) { playerStore.set(s => ({ ...s, queue: [...s.queue, track] })); }
function setVolume(value) {
  const volume = Math.max(0, Math.min(1, Number(value)));
  playerStore.set(s => ({ ...s, volume, muted: volume === 0 ? true : false }));
  syncAudio();
}
function toggleMute() {
  playerStore.set(s => ({ ...s, muted: !s.muted }));
  syncAudio();
}
function playRandomTrack() {
  const queue = ALL_TRACKS.length ? ALL_TRACKS : playerStore.get().queue;
  if (!queue.length) return;
  const track = queue[(Math.random() * queue.length) | 0];
  playTrack(track, queue);
}

// global tick
let _tick = null;
function startEngine() {
  if (_tick) return;
  _tick = setInterval(() => {
    const s = playerStore.get();
    if (!s.playing) return;
    if (s.queue[s.index]?.audioSrc) return;
    const dur = s.dur || parseDur(s.queue[s.index].dur);
    if (s.t >= dur) {
      if (s.repeat) playerStore.set({ t: 0 });
      else next();
    } else {
      playerStore.set({ t: s.t + 0.25, dur });
    }
  }, 250);
}

/* ---------------- waveform ---------------- */
function Waveform({ frac, color, onSeek, height = 38, bars = 64, compact = false }) {
  const ref = useRef(null);
  const seed = useRef([]);
  if (seed.current.length === 0) {
    for (let i = 0; i < bars; i++) {
      const base = Math.sin(i * 0.5) * 0.3 + Math.sin(i * 0.13) * 0.3 + 0.5;
      const jitter = Math.sin((i + 1) * 12.9898 + bars * 78.233) * 43758.5453;
      const normalized = jitter - Math.floor(jitter);
      seed.current.push(Math.max(0.12, Math.min(1, base + (normalized - 0.5) * 0.4)));
    }
  }
  const handle = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    onSeek(Math.max(0, Math.min(1, x / r.width)));
  };
  const playedBars = Math.floor(frac * bars);
  return (
    <div ref={ref} data-cursor onClick={handle} style={{ display: 'flex', alignItems: 'center', gap: 2, height, cursor: 'pointer', flex: 1 }}>
      {seed.current.map((v, i) => {
        const played = i <= playedBars;
        const active = i === playedBars;
        const barHeight = Math.round(v * height * 100) / 100;
        return <div key={i} style={{
          flex: 1, height: barHeight + 'px', borderRadius: 2,
          background: played ? (color || 'var(--pink)') : 'var(--fill-2)',
          boxShadow: active ? `0 0 10px ${color || 'var(--pink)'}` : 'none',
          transform: active ? 'scaleY(1.15)' : 'none',
          transition: 'transform .1s, background .1s',
        }} />;
      })}
    </div>
  );
}

/* ---------------- mini player bar ---------------- */
function PlayerBar() {
  const s = playerStore.use();
  const t = curTrack();
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    const updateTime = () => {
      const current = playerStore.get();
      if (!current.queue[current.index]?.audioSrc) return;
      const duration = Number.isFinite(audio.duration) ? audio.duration : current.dur;
      playerStore.set(state => ({ ...state, t: audio.currentTime, dur: duration || state.dur }));
    };
    const updateDuration = () => {
      if (!Number.isFinite(audio.duration)) return;
      playerStore.set(state => ({ ...state, dur: audio.duration }));
    };
    const handleEnded = () => {
      const current = playerStore.get();
      if (current.repeat) {
        audio.currentTime = 0;
        audio.play().catch(() => playerStore.set({ playing: false }));
      } else {
        next();
      }
    };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  useEffect(() => { syncAudio(playerStore.get()); }, [s.index, s.playing, s.volume, s.muted, t?.audioSrc]);
  if (!t) return null;
  const dur = s.dur || parseDur(t.dur);
  const frac = Math.min(1, s.t / dur);
  return (
    <>
      <div className="player-bar" style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, height: 100, zIndex: 200,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,226,247,0.95))',
        borderTop: '2px solid #fff', backdropFilter: 'blur(22px)',
        boxShadow: '0 -10px 40px rgba(150,40,170,0.22), inset 0 2px 0 rgba(255,255,255,0.95)',
      }}>
        {/* top progress line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--fill-2)' }}>
          <div style={{ height: '100%', width: (frac * 100) + '%', background: 'var(--grad-candy)', backgroundSize: '200% 100%', animation: 'hue-pan 5s linear infinite', boxShadow: `0 0 12px ${t.color}` }} />
        </div>
        <div className="player-inner" style={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) minmax(280px,2.2fr) minmax(180px,1fr)', alignItems: 'center', gap: 16, padding: '0 20px' }}>
          {/* track info */}
          <div className="flex center gap-m" style={{ minWidth: 0, cursor: 'pointer' }} data-cursor onClick={() => playerStore.set({ expanded: true })}>
            <div style={{ width: 58, height: 58, flexShrink: 0, position: 'relative' }}>
              <CoverArt palKey={t.pal} motif={t.motif} seed={t.id} src={t.cover} round={12} />
              {s.playing && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)', borderRadius: 12 }}><EQ /></div>}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
              <div className="link-artist" style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</div>
            </div>
          </div>
          {/* controls + waveform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div className="flex center" style={{ justifyContent: 'center', gap: 18 }}>
              <CtrlBtn onClick={() => playerStore.set(x => ({ shuffle: !x.shuffle }))} active={s.shuffle} title="shuffle">⤮</CtrlBtn>
              <CtrlBtn onClick={prev} title="previous">⏮</CtrlBtn>
              <button data-cursor onClick={togglePlay} className="gloss" style={{
                width: 46, height: 46, borderRadius: '50%', background: 'var(--grad-candy)', backgroundSize: '200% 200%', animation: 'hue-pan 6s linear infinite',
                color: '#fff', fontSize: 20, display: 'grid', placeItems: 'center', boxShadow: '0 4px 16px rgba(255,43,214,0.5)', flexShrink: 0,
              }}>{s.playing ? '❚❚' : '▶'}</button>
              <CtrlBtn onClick={next} title="next">⏭</CtrlBtn>
              <CtrlBtn onClick={() => playerStore.set(x => ({ repeat: !x.repeat }))} active={s.repeat} title="repeat">↻</CtrlBtn>
              <CtrlBtn onClick={playRandomTrack} title="random track">?</CtrlBtn>
            </div>
            <div className="flex center gap-s player-wave" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 34, textAlign: 'right' }}>{fmt(s.t)}</span>
              <Waveform frac={frac} color={t.color} onSeek={seekTo} height={28} bars={48} />
              <span style={{ width: 34 }}>{t.dur}</span>
            </div>
          </div>
          {/* right: queue + volume */}
          <div className="flex center hide-mobile" style={{ justifyContent: 'flex-end', gap: 14 }}>
            <CtrlBtn onClick={() => playerStore.set(x => ({ showQueue: !x.showQueue }))} active={s.showQueue} title="queue" big>☰</CtrlBtn>
            <button data-cursor title={s.muted ? 'unmute' : 'mute'} onClick={toggleMute} style={{ fontSize: 17, width: 28 }}>{s.muted || s.volume === 0 ? '🔇' : '🔊'}</button>
            <input
              aria-label="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={s.muted ? 0 : s.volume}
              onChange={(e) => setVolume(e.currentTarget.value)}
              style={{ width: 92, accentColor: 'var(--cyan)' }}
            />
          </div>
        </div>
      </div>
      {s.showQueue && <QueuePanel />}
      {s.expanded && <NowPlaying />}
    </>
  );
}

function CtrlBtn({ children, onClick, active, title, big }) {
  return <button data-cursor title={title} onClick={onClick} style={{
    fontSize: big ? 18 : 17, color: active ? 'var(--lime)' : 'var(--ink)', opacity: active ? 1 : 0.8,
    width: 30, height: 30, display: 'grid', placeItems: 'center', transition: 'color .15s, transform .12s',
    textShadow: active ? '0 0 12px var(--lime)' : 'none',
  }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{children}</button>;
}

/* ---------------- queue panel ---------------- */
function QueuePanel() {
  const s = playerStore.use();
  const nextTrack = s.queue[(s.index + 1) % Math.max(1, s.queue.length)];
  return (
    <div className="anim-rise" style={{ position: 'fixed', right: 16, bottom: 'calc(var(--player-h) + 12px)', width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: '52vh', zIndex: 210 }}>
      <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="flex between center" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15 }}>PLAYLIST <span style={{ color: 'var(--muted-2)' }}>· {s.queue.length}</span></span>
          <div className="flex center gap-s">
            <button data-cursor onClick={playRandomTrack} className="chip" style={{ fontSize: 10 }}>random</button>
            <button data-cursor onClick={() => { go('playlist'); playerStore.set({ showQueue: false }); }} className="chip" style={{ fontSize: 10 }}>all ACTs</button>
            <button data-cursor onClick={() => playerStore.set({ showQueue: false })} style={{ color: 'var(--muted)', fontSize: 18 }}>✕</button>
          </div>
        </div>
        {nextTrack && (
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            next preview: <b style={{ color: 'var(--ink)' }}>{nextTrack.title}</b> · {nextTrack.artist}
          </div>
        )}
        <div style={{ overflowY: 'auto', padding: 8 }}>
          {s.queue.map((t, i) => (
            <div key={t.id + i} data-cursor onClick={() => { playerStore.set({ index: i, t: 0, playing: true, dur: parseDur(t.dur) }); syncAudio(); }}
              className="q-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 12, cursor: 'pointer', background: i === s.index ? 'rgba(255,43,214,0.12)' : 'transparent' }}>
              <div style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-2)' }}>{i === s.index ? <EQ /> : i + 1}</div>
              <div style={{ width: 38, height: 38, flexShrink: 0 }}><CoverArt palKey={t.pal} motif={t.motif} seed={t.id} src={t.cover} round={8} animated={false} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: i === s.index ? 'var(--pink-deep)' : 'var(--ink)' }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.artist}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{t.dur}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- now playing overlay ---------------- */
function NowPlaying() {
  const s = playerStore.use();
  const t = curTrack();
  const dur = s.dur || parseDur(t.dur);
  const frac = Math.min(1, s.t / dur);
  const rel = RELEASES.find(r => r.id === t.releaseId);
  return (
    <div className="anim-rise" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 30%, rgba(255,235,250,0.86), rgba(225,225,255,0.9))', backdropFilter: 'blur(26px)' }}>
      <div className="noise" style={{ position: 'absolute', inset: 0 }} />
      <button data-cursor onClick={() => playerStore.set({ expanded: false })} style={{ position: 'absolute', top: 24, right: 28, fontSize: 26, color: 'var(--muted)', zIndex: 2 }}>✕⌄</button>
      <div style={{ position: 'relative', width: 'min(460px, 88vw)', textAlign: 'center', zIndex: 1 }}>
        <div className="float" style={{ position: 'relative', margin: '0 auto 28px', width: 'min(360px,72vw)' }}>
          <div style={{ position: 'absolute', inset: -30, background: `radial-gradient(circle, ${t.color}66, transparent 70%)`, filter: 'blur(20px)' }} />
          <div style={{ position: 'relative', boxShadow: `0 30px 80px ${t.color}55` }}><CoverArt palKey={t.pal} motif={t.motif} seed={t.id} src={t.cover} round={24} /></div>
          <div className="spin-slow" style={{ position: 'absolute', top: '50%', right: -26, width: 64, height: 64, marginTop: -32, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, #1a0026 28%, #2a0d4a 30%, #2a0d4a 96%, transparent)', border: '2px solid rgba(255,255,255,0.2)', display: s.playing ? 'block' : 'none' }}>
            <div style={{ position: 'absolute', inset: '46%', borderRadius: '50%', background: t.color }} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 8 }}>NOW PLAYING ✦ weirdnxc</div>
        <h2 className="h-head" style={{ fontSize: 18, marginBottom: 6 }}>{t.title}</h2>
        <div onClick={() => { if (rel) { go('artist', rel.artistId); playerStore.set({ expanded: false }); } }} data-cursor style={{ fontSize: 16, color: 'var(--pink-deep)', cursor: 'pointer', marginBottom: 26 }}>{t.artist}</div>
        <div className="flex center gap-s" style={{ marginBottom: 22 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 40, color: 'var(--muted)' }}>{fmt(s.t)}</span>
          <Waveform frac={frac} color={t.color} onSeek={seekTo} height={44} bars={70} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 40, color: 'var(--muted)' }}>{t.dur}</span>
        </div>
        <div className="flex center" style={{ justifyContent: 'center', gap: 26 }}>
          <CtrlBtn onClick={() => playerStore.set(x => ({ shuffle: !x.shuffle }))} active={s.shuffle} title="shuffle" big>⤮</CtrlBtn>
          <button data-cursor onClick={prev} style={{ fontSize: 26 }}>⏮</button>
          <button data-cursor onClick={togglePlay} className="gloss" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--grad-candy)', backgroundSize: '200% 200%', animation: 'hue-pan 6s linear infinite', color: '#fff', fontSize: 28, display: 'grid', placeItems: 'center', boxShadow: '0 8px 30px rgba(255,43,214,0.6)' }}>{s.playing ? '❚❚' : '▶'}</button>
          <button data-cursor onClick={next} style={{ fontSize: 26 }}>⏭</button>
          <CtrlBtn onClick={() => playerStore.set(x => ({ repeat: !x.repeat }))} active={s.repeat} title="repeat" big>↻</CtrlBtn>
          <CtrlBtn onClick={playRandomTrack} title="random track" big>?</CtrlBtn>
        </div>
        <div className="flex center" style={{ justifyContent: 'center', gap: 12, marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          <button data-cursor onClick={toggleMute} className="chip">{s.muted || s.volume === 0 ? 'unmute' : 'mute'}</button>
          <input aria-label="volume" type="range" min="0" max="1" step="0.01" value={s.muted ? 0 : s.volume} onChange={(e) => setVolume(e.currentTarget.value)} style={{ width: 160, accentColor: 'var(--pink)' }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   weirdnxc — main pages
   ============================================================ */

/* shared bits */
function PlayHover({ onClick, size = 50 }) {
  return (
    <button data-cursor onClick={(e) => { e.stopPropagation(); onClick(); }} className="play-hover gloss" style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--grad-candy)', backgroundSize: '200% 200%', animation: 'hue-pan 6s linear infinite',
      color: '#fff', fontSize: size * 0.38, display: 'grid', placeItems: 'center', boxShadow: '0 6px 20px rgba(255,43,214,0.55)',
    }}>▶</button>
  );
}

function TypeChip({ type }) {
  const map = { Album: 'chip-pink', EP: 'chip-cyan', Single: 'chip-lime', Vinyl: 'chip-pink', Cassette: 'chip-cyan' };
  return <span className={`chip ${map[type] || ''}`}>{type}</span>;
}

function PageHead({ kicker, title, sub, children }) {
  return (
    <div style={{ position: 'relative', marginBottom: 36 }}>
      <div className="section-label anim-rise" style={{ marginBottom: 14 }}>{kicker}</div>
      <h1 className="h-display anim-rise" style={{ fontSize: 'clamp(24px, 4.2vw, 52px)', animationDelay: '.05s' }}>
        <Chrome>{title}</Chrome>
      </h1>
      {sub && <p className="anim-rise" style={{ marginTop: 16, fontSize: 17, color: 'var(--muted)', maxWidth: 620, animationDelay: '.1s' }}>{sub}</p>}
      {children}
    </div>
  );
}

function OfficialLogoHero() {
  const logoRef = useRef(null);
  useGSAP((context, contextSafe) => {
    const root = logoRef.current;
    if (!root) return;

    const liftEase = CustomEase.create('nxc-logo-lift', 'M0,0 C0.11,0.62 0.18,1 1,1');
    const svg = root.querySelector('.official-logo-svg');
    const base = root.querySelector('.official-logo-base');
    const aura = root.querySelector('.official-logo-aura');
    const shine = root.querySelector('.official-logo-shine');
    const streaks = gsap.utils.toArray(root.querySelectorAll('.official-logo-streak'));
    const motes = gsap.utils.toArray(root.querySelectorAll('.official-logo-mote'));
    const animePieces = root.querySelectorAll('.anime-logo-piece');
    const animeOrbiters = root.querySelectorAll('.anime-logo-orbiter');
    const animeSignals = root.querySelectorAll('.anime-logo-signal');

    gsap.set(svg, { transformPerspective: 900, transformOrigin: '50% 55%', force3D: true });
    gsap.set(base, { transformOrigin: '50% 55%', force3D: true });
    gsap.set(shine, { xPercent: -150, autoAlpha: 0, skewX: -16 });
    gsap.set(streaks, { attr: { 'stroke-dasharray': 260, 'stroke-dashoffset': 260 }, autoAlpha: 0 });
    gsap.set(motes, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' });

    const mm = gsap.matchMedia();
    let hoverTl;
    let idleTl;
    let shimmerTl;
    let xTo;
    let yTo;
    let animeIdle;
    let animeOrbit;
    let animeSignalsLoop;

    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        desktop: '(min-width: 881px)',
      },
      ({ conditions }) => {
        const { reduceMotion, desktop } = conditions;

        if (reduceMotion) {
          gsap.set([svg, base, aura], { clearProps: 'all' });
          gsap.set(shine, { autoAlpha: 0 });
          return;
        }

        anime.set(animePieces, { opacity: 0, scale: 0.3 });
        anime.set(animeSignals, { opacity: 0, scaleX: 0.4, transformOrigin: '0% 50%' });
        animeIdle = anime({
          targets: animePieces,
          opacity: [0.18, 0.95],
          scale: [
            { value: 1, duration: 680 },
            { value: 0.78, duration: 820 },
          ],
          translateX: (el, i) => [0, [-10, 12, -7, 9, -12, 8, 5, -9, 11, -6][i] || 0],
          translateY: (el, i) => [0, [-12, 8, 10, -9, 6, -10, 12, -8, 7, 9][i] || 0],
          rotate: (el, i) => [0, i % 2 ? 34 : -34],
          delay: anime.stagger(80, { from: 'center' }),
          duration: 1500,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutSine',
        });
        animeOrbit = anime({
          targets: animeOrbiters,
          rotate: (el, i) => i % 2 ? -360 : 360,
          scale: [
            { value: 1.08, duration: 1500 },
            { value: 0.92, duration: 1500 },
          ],
          duration: (el, i) => 6400 + i * 900,
          direction: 'alternate',
          loop: true,
          easing: 'linear',
        });
        animeSignalsLoop = anime({
          targets: animeSignals,
          opacity: [0.18, 0.86, 0.18],
          scaleX: [0.2, 1, 0.2],
          translateX: [0, 18],
          delay: anime.stagger(160),
          duration: 1800,
          loop: true,
          easing: 'easeInOutQuad',
        });

        gsap.timeline({ defaults: { ease: liftEase } })
          .fromTo(svg, { autoAlpha: 0, y: 34, scale: 0.82, rotation: -3.5 }, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 1.05 })
          .fromTo(aura, { autoAlpha: 0, scale: 0.72 }, { autoAlpha: 0.78, scale: 1, duration: 0.85 }, '<0.08')
          .to(streaks, { attr: { 'stroke-dashoffset': 0 }, autoAlpha: 0.74, duration: 0.72, stagger: { each: 0.055, from: 'center' } }, '<0.14')
          .to(motes, {
            autoAlpha: 0.82,
            scale: 1,
            x: (i) => [-58, -18, 48, 76, 18, -72, 62, -36][i] || 0,
            y: (i) => [-18, -54, -40, 14, 58, 28, -72, 66][i] || 0,
            duration: 0.66,
            stagger: { each: 0.035, from: 'random' },
            ease: 'back.out(2.4)',
          }, '<0.1');

        idleTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
          .to(svg, { y: desktop ? -7 : -4, rotation: desktop ? 0.45 : 0.25, duration: 2.5 })
          .to(aura, { scale: 1.08, autoAlpha: 0.92, duration: 2.5 }, '<')
          .to(streaks, { x: desktop ? 16 : 7, autoAlpha: 0.92, duration: 2.5, stagger: 0.03 }, '<');

        shimmerTl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 })
          .fromTo(shine, { xPercent: -170, autoAlpha: 0, skewX: -18 }, { xPercent: 170, autoAlpha: 0.96, duration: 1.05, ease: 'power3.inOut' })
          .set(shine, { xPercent: -150, autoAlpha: 0 });

        hoverTl = gsap.timeline({ paused: true, defaults: { duration: 0.48, ease: 'power3.out', overwrite: 'auto' } })
          .to(svg, {
            scale: desktop ? 1.055 : 1.025,
            y: desktop ? -10 : -5,
            filter: 'saturate(1.45) brightness(1.08) drop-shadow(0 28px 40px rgba(255,69,192,.48)) drop-shadow(0 0 28px rgba(52,214,255,.38))',
          }, 0)
          .to(aura, { scale: 1.22, autoAlpha: 1 }, 0)
          .to(streaks, { autoAlpha: 1, attr: { 'stroke-dashoffset': 0 }, stagger: { each: 0.025, from: 'center' } }, 0)
          .to(motes, {
            autoAlpha: 1,
            scale: 1.25,
            rotation: (i) => (i % 2 ? 24 : -24),
            stagger: { each: 0.025, from: 'random' },
            ease: 'back.out(2)',
          }, 0.02);

        xTo = gsap.quickTo(svg, 'rotationY', { duration: 0.46, ease: 'power3.out' });
        yTo = gsap.quickTo(svg, 'rotationX', { duration: 0.46, ease: 'power3.out' });
      },
    );

    const sweep = contextSafe(() => {
          gsap.fromTo(shine, { xPercent: -150, autoAlpha: 0 }, {
        xPercent: 170,
        autoAlpha: 1,
        duration: 0.72,
        ease: 'power4.inOut',
        overwrite: true,
        onComplete: () => gsap.set(shine, { xPercent: -150, autoAlpha: 0 }),
      });
      anime.remove([...animePieces, ...animeSignals]);
      anime({
        targets: animePieces,
        opacity: [
          { value: 1, duration: 120 },
          { value: 0.62, duration: 620 },
        ],
        scale: [
          { value: (el, i) => 1.55 + (i % 3) * 0.18, duration: 260 },
          { value: 0.9, duration: 640 },
        ],
        translateX: (el, i) => [0, [-34, -18, 16, 35, 46, -42, 26, -28, 18, 38][i] || 0],
        translateY: (el, i) => [0, [-30, 28, -36, 18, -16, 10, 36, -22, 26, -32][i] || 0],
        rotate: (el, i) => [0, i % 2 ? 180 : -180],
        delay: anime.stagger(28, { from: 'center' }),
        duration: 760,
        easing: 'easeOutElastic(1, .65)',
        complete: () => {
          animeIdle?.restart();
          animeSignalsLoop?.restart();
        },
      });
      anime({
        targets: animeSignals,
        opacity: [0, 1, 0],
        scaleX: [0.1, 1.35, 0.2],
        translateX: [0, 52],
        delay: anime.stagger(55),
        duration: 820,
        easing: 'easeOutExpo',
      });
    });

    const onEnter = contextSafe(() => {
      hoverTl?.play();
      sweep();
    });

    const onLeave = contextSafe(() => {
      hoverTl?.reverse();
      xTo?.(0);
      yTo?.(0);
    });

    const onMove = contextSafe((event) => {
      if (!xTo || !yTo) return;
      const rect = root.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const nx = (px - 0.5) * 2;
      const ny = (py - 0.5) * 2;
      xTo(nx * 10);
      yTo(ny * -7);
    });

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onEnter);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('mousemove', onMove);

    return () => {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onEnter);
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mousemove', onMove);
      anime.remove([...animePieces, ...animeOrbiters, ...animeSignals]);
      animeIdle?.pause?.();
      animeOrbit?.pause?.();
      animeSignalsLoop?.pause?.();
      idleTl?.kill();
      shimmerTl?.kill();
      hoverTl?.kill();
      mm.revert();
    };
  }, { scope: logoRef });
  return (
    <div ref={logoRef} className="official-logo-wrap anim-pop" data-cursor style={{ position: 'relative', width: 'min(760px, 92vw)', marginLeft: '-1.5vw' }}>
      <div className="official-logo-aura" aria-hidden style={{ position: 'absolute', inset: '14% 2% 10%', background: 'var(--grad-rainbow)', backgroundSize: '260% 100%', animation: 'hue-pan 7s linear infinite', filter: 'blur(26px)', opacity: 0.62, borderRadius: '50%' }} />
      <div className="anime-logo-field" aria-hidden>
        {[
          ['✦', '8%', '18%', '#34d6ff'], ['●', '18%', '72%', '#ff45c0'], ['✶', '78%', '18%', '#ffe23d'], ['◆', '84%', '66%', '#aef23a'],
          ['✧', '43%', '4%', '#fff'], ['●', '58%', '92%', '#c79bff'], ['✦', '3%', '58%', '#aef23a'], ['◆', '91%', '42%', '#34d6ff'],
          ['✶', '31%', '88%', '#ff45c0'], ['●', '69%', '7%', '#fff'],
        ].map(([mark, left, top, color], i) => (
          <span key={i} className="anime-logo-piece" style={{ left, top, color }}>{mark}</span>
        ))}
        {[0, 1, 2].map((i) => (
          <span key={i} className={`anime-logo-orbiter anime-logo-orbiter-${i + 1}`} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className="anime-logo-signal" style={{ top: `${21 + i * 15}%`, left: i % 2 ? '74%' : '4%' }} />
        ))}
      </div>
      <svg className="official-logo-svg" viewBox="118 334 752 388" role="img" aria-label="Weird NXC" style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', transformOrigin: '50% 54%' }}>
        <defs>
          <linearGradient id="hero-nxc-rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#aef23a"><animate attributeName="stop-color" values="#aef23a;#34d6ff;#ff45c0;#aef23a" dur="6s" repeatCount="indefinite" /></stop>
            <stop offset="22%" stopColor="#ffe23d"><animate attributeName="stop-color" values="#ffe23d;#aef23a;#c79bff;#ffe23d" dur="7s" repeatCount="indefinite" /></stop>
            <stop offset="44%" stopColor="#ff45c0"><animate attributeName="stop-color" values="#ff45c0;#c79bff;#ffe23d;#ff45c0" dur="5.8s" repeatCount="indefinite" /></stop>
            <stop offset="68%" stopColor="#34d6ff"><animate attributeName="stop-color" values="#34d6ff;#ffe23d;#8effc6;#34d6ff" dur="7.2s" repeatCount="indefinite" /></stop>
            <stop offset="100%" stopColor="#8effc6"><animate attributeName="stop-color" values="#8effc6;#ff45c0;#aef23a;#8effc6" dur="6.2s" repeatCount="indefinite" /></stop>
          </linearGradient>
          <filter id="hero-nxc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur"><animate attributeName="stdDeviation" values="6;12;6" dur="3.8s" repeatCount="indefinite" /></feGaussianBlur>
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 .25  0 0 1 0 .82  0 0 0 .75 0" result="color" />
            <feMerge><feMergeNode in="color" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <mask id="hero-nxc-mask">
            <image href="/weirdnxc-logo-bw.png" width="1024" height="1024" preserveAspectRatio="xMidYMid meet" />
          </mask>
        </defs>
        <g className="official-logo-base">
          <image href="/weirdnxc-logo.png" width="1024" height="1024" preserveAspectRatio="xMidYMid meet" />
          <rect className="official-logo-shine" x="-280" y="280" width="210" height="520" fill="rgba(255,255,255,0.82)" mask="url(#hero-nxc-mask)" />
          <path className="official-logo-streak" d="M154 457 C254 409 362 424 473 396 S708 380 844 330" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
          <path className="official-logo-streak" d="M142 520 C252 487 349 512 460 475 S696 454 822 408" fill="none" stroke="#34d6ff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          <path className="official-logo-streak" d="M292 624 C400 594 524 628 662 585 S778 550 846 560" fill="none" stroke="#ff45c0" strokeWidth="5" strokeLinecap="round" opacity="0.48" />
        </g>
        {[
          [170, 420, '#ffe23d'], [238, 600, '#aef23a'], [378, 380, '#ff45c0'], [512, 676, '#34d6ff'],
          [660, 390, '#c79bff'], [778, 640, '#fff'], [832, 458, '#aef23a'], [444, 544, '#fff'],
        ].map(([cx, cy, fill], i) => (
          <g key={i} className="official-logo-mote">
            <path d={`M${cx} ${cy - 16} L${cx + 5} ${cy - 5} L${cx + 17} ${cy} L${cx + 5} ${cy + 5} L${cx} ${cy + 17} L${cx - 5} ${cy + 5} L${cx - 17} ${cy} L${cx - 5} ${cy - 5} Z`} fill={fill} opacity="0.92" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ============================================================ HOME */
function HomePage() {
  const featured = RELEASES[RELEASES.length - 1];
  return (
    <div>
      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 'min(86vh, 720px)', display: 'flex', alignItems: 'center' }}>
        <Decor />
        <div className="noise" style={{ position: 'absolute', inset: 0 }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <div className="flex center gap-s" style={{ marginBottom: 22 }}>
            <span className="chip chip-lime"><span className="eq" style={{ height: 12 }}><i /><i /><i /></span> EST. {STATS.founded}</span>
            <span className="chip chip-cyan">{STATS.streams} in rotation</span>
          </div>
          <OfficialLogoHero />
          <div className="flex center wrap-flex gap-m" style={{ marginTop: 28 }}>
            <button className="btn btn-candy" data-cursor onClick={() => playRelease(featured)} style={{ fontSize: 16, padding: '16px 28px' }}>▶ play the label</button>
            <button className="btn btn-ghost" data-cursor onClick={() => go('roster')}>meet the roster</button>
            <span className="float" style={{ marginLeft: 6 }}><Sticker bg="var(--lime)" size={84} rot={-14}>STAY<br />WEIRD</Sticker></span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'rgba(255,43,214,0.06)', padding: '14px 0', margin: '10px 0 50px' }}>
        <Marquee items={['hyperpop', 'nightcore', 'stay weird', `founded ${STATS.founded}`, `${ALL_TRACKS.length} tracks`, `${RELEASES.length} ACTs`, 'bubblegum bass', 'glitchcore', 'angelcore']} color="var(--ink)" />
      </div>

      <div className="wrap">
        {/* FEATURED */}
        <FeatureBanner release={featured} />

        {/* RELEASES */}
        <div className="flex between center" style={{ margin: '60px 0 24px' }}>
          <h2 className="h-head" style={{ fontSize: 18 }}>all ACTs <span style={{ color: 'var(--pink)' }}>♥</span></h2>
          <button className="btn btn-ghost" data-cursor onClick={() => go('releases')}>all releases →</button>
        </div>
        <div className="grid grid-4">
          {RELEASES.map((r, i) => <ReleaseCard key={r.id} r={r} delay={i * 0.06} />)}
        </div>

        {/* ROSTER STRIP */}
        <div className="flex between center" style={{ margin: '64px 0 24px' }}>
          <h2 className="h-head" style={{ fontSize: 18 }}>the family</h2>
          <button className="btn btn-ghost" data-cursor onClick={() => go('roster')}>full roster →</button>
        </div>
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 14, scrollSnapType: 'x mandatory' }}>
          {ARTISTS.map((a, i) => <ArtistOrb key={a.id} a={a} delay={i * 0.05} />)}
        </div>

        {/* SPLIT: playlist + contact */}
        <div className="grid grid-2 home-split" style={{ margin: '64px 0', gridTemplateColumns: '1fr 1fr' }}>
          <PromoCard onClick={() => go('playlist')} pal="bubble" motif="star"
            kicker={`${ALL_TRACKS.length} TRACKS`} title="playlist" sub="browse every ACT, queue any track, and play the full Weird NXC run." cta="open playlist" />
          <PromoCard onClick={() => go('contact')} pal="ice" motif="rings"
            kicker="BOOKINGS" title="contact" sub="send demos, press notes, booking ideas, and label business straight to the Weird NXC inbox." cta="contact" />
        </div>
      </div>
    </div>
  );
}

function FeatureBanner({ release }) {
  return (
    <div className="panel gloss card-hover anim-rise" data-cursor onClick={() => go('release', release.id)} style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) 1.4fr' }} className="feature-grid">
        <div style={{ position: 'relative', minHeight: 300 }}>
          <CoverArt palKey={release.pal} motif={release.motif} seed={release.id} src={release.cover} round={0} style={{ height: '100%', position: 'absolute', inset: 0, aspectRatio: 'auto' }} />
        </div>
        <div style={{ padding: 'clamp(24px,4vw,48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div className="flex center gap-s wrap-flex"><span className="chip chip-pink">★ featured release</span><TypeChip type={release.type} /><span className="chip">{release.actLabel}</span></div>
          <h2 className="h-display" style={{ fontSize: 'clamp(18px,2.65vw,34px)', lineHeight: 0.95 }}><Chrome>{release.title}</Chrome></h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 460 }}>{release.blurb}</p>
          <div className="flex center wrap-flex gap-m" style={{ marginTop: 8 }}>
            <button className="btn btn-candy" data-cursor onClick={(e) => { e.stopPropagation(); playRelease(release); }}>▶ play album</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>{release.tracks.length} tracks · by {release.artist}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoCard({ onClick, pal, motif, kicker, title, sub, cta }) {
  return (
    <div className="panel gloss card-hover" data-cursor onClick={onClick} style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', padding: 34, minHeight: 230, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, opacity: 0.55 }}><CoverArt palKey={pal} motif={motif} seed={title} round={999} /></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>{kicker}</div>
        <h3 className="h-display" style={{ fontSize: 23, marginBottom: 10 }}><Chrome>{title}</Chrome></h3>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 320, marginBottom: 18 }}>{sub}</p>
        <span className="btn btn-lime">{cta} →</span>
      </div>
    </div>
  );
}

/* ============================================================ RELEASE CARD */
function ReleaseCard({ r, delay = 0 }) {
  return (
    <div className="card-hover anim-rise" data-cursor onClick={() => go('release', r.id)} style={{ cursor: 'pointer', animationDelay: delay + 's' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ boxShadow: `0 14px 36px ${r.color}30` }}><CoverArt palKey={r.pal} motif={r.motif} seed={r.id} src={r.cover} round={16} /></div>
            <span className="chip chip-lime" style={{ position: 'absolute', top: 10, left: 10 }}>{r.actLabel}</span>
        <div className="play-reveal" style={{ position: 'absolute', right: 10, bottom: 10 }}><PlayHover onClick={() => playRelease(r)} /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 10, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{r.tracks.length} tracks · {r.type}</div>
      </div>
    </div>
  );
}

/* ============================================================ ARTIST ORB */
function ArtistOrb({ a, delay = 0 }) {
  return (
    <div className="anim-rise" data-cursor onClick={() => go('artist', a.id)} style={{ cursor: 'pointer', textAlign: 'center', flexShrink: 0, width: 150, scrollSnapAlign: 'start', animationDelay: delay + 's' }}>
      <div className="card-hover" style={{ position: 'relative', borderRadius: '50%', padding: 4, background: `conic-gradient(from 0deg, ${a.accent}, #13e7ff, #c6ff2e, ${a.accent})` }}>
        <div style={{ borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bg)' }}><CoverArt palKey={a.pal} motif={a.motif} seed={a.id} src={a.cover} round={999} /></div>
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 9, marginTop: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{a.monthly}</div>
    </div>
  );
}

/* ============================================================ ROSTER */
function ArtistActChips({ artist, colorClass = '' }) {
  return artist.acts.map(g => <span key={g} className={`chip ${colorClass}`}>{g.replace('ACT', 'ACT ')}</span>);
}

function RosterPage() {
  const [query, setQuery] = useState('');
  const [actFilter, setActFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortMode, setSortMode] = useState('az');
  const [viewMode, setViewMode] = useState('gallery');
  const acts = useMemo(() => ['All', ...RELEASES.map(r => r.actLabel)], []);
  const years = useMemo(() => ['All', ...Array.from(new Set(RELEASES.map(r => r.year))).sort((a, b) => b - a)], []);
  const visibleArtists = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ARTISTS
      .filter(a => !needle || a.name.toLowerCase().includes(needle))
      .filter(a => actFilter === 'All' || a.acts.includes(actFilter.replace(' ', '')))
      .filter(a => yearFilter === 'All' || a.years.includes(Number(yearFilter)))
      .sort((a, b) => {
        if (sortMode === 'tracks') return b.trackCount - a.trackCount || a.name.localeCompare(b.name, 'en-US', { sensitivity: 'base' });
        if (sortMode === 'year') return Math.max(...b.years) - Math.max(...a.years) || a.name.localeCompare(b.name, 'en-US', { sensitivity: 'base' });
        return a.name.localeCompare(b.name, 'en-US', { sensitivity: 'base' });
      });
  }, [query, actFilter, yearFilter, sortMode]);
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <PageHead kicker="✦ ARTIST ROSTER ✦" title="roster" sub={`${ARTISTS.length} artists across the Weird NXC ACT series. Search by name, filter by era, and jump straight into their tracks.`} />
      <div className="panel gloss" style={{ padding: 18, marginBottom: 24 }}>
        <div className="roster-toolbar" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.3fr) repeat(4, minmax(130px, .7fr))', gap: 12, alignItems: 'center' }}>
          <input value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder="Search roster" className="field-input" style={{ minHeight: 42, borderRadius: 999, border: '1.5px solid var(--line-2)', padding: '0 16px' }} />
          <select value={actFilter} onChange={(e) => setActFilter(e.currentTarget.value)} className="field-input" style={{ minHeight: 42, borderRadius: 999, border: '1.5px solid var(--line-2)', padding: '0 14px' }}>
            {acts.map(a => <option key={a} value={a}>{a === 'All' ? 'All ACTs' : a}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.currentTarget.value)} className="field-input" style={{ minHeight: 42, borderRadius: 999, border: '1.5px solid var(--line-2)', padding: '0 14px' }}>
            {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All years' : y}</option>)}
          </select>
          <select value={sortMode} onChange={(e) => setSortMode(e.currentTarget.value)} className="field-input" style={{ minHeight: 42, borderRadius: 999, border: '1.5px solid var(--line-2)', padding: '0 14px' }}>
            <option value="az">A-Z</option>
            <option value="year">Newest era</option>
            <option value="tracks">Most tracks</option>
          </select>
          <div className="flex center" style={{ gap: 6, justifyContent: 'flex-end' }}>
            {['gallery', 'list'].map(mode => (
              <button key={mode} data-cursor onClick={() => setViewMode(mode)} className="btn" style={{
                padding: '10px 14px',
                background: viewMode === mode ? 'var(--grad-candy)' : 'var(--fill)',
                color: viewMode === mode ? '#fff' : 'var(--ink)',
              }}>{mode}</button>
            ))}
          </div>
        </div>
      </div>
      {visibleArtists.length === 0 ? (
        <div className="panel" style={{ padding: 28, color: 'var(--muted)' }}>No roster matches found.</div>
      ) : viewMode === 'gallery' ? (
        <div className="grid grid-3">
          {visibleArtists.map((a, i) => <RosterArtistCard key={a.id} a={a} delay={i * 0.03} />)}
        </div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          {visibleArtists.map((a, i) => <RosterArtistListRow key={a.id} a={a} i={i} />)}
        </div>
      )}
    </div>
  );
}

function RosterArtistCard({ a, delay = 0 }) {
  return (
    <div className="panel gloss card-hover anim-rise" data-cursor onClick={() => go('artist', a.id)} style={{ overflow: 'hidden', cursor: 'pointer', animationDelay: delay + 's' }}>
      <div style={{ position: 'relative' }}>
        <CoverArt palKey={a.pal} motif={a.motif} seed={a.id} src={a.cover} round={0} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 32%, rgba(255,255,255,0.55) 60%, rgba(255,247,253,0.96))' }} />
        <div className="play-reveal" style={{ position: 'absolute', right: 14, top: 14 }}>
          <PlayHover onClick={() => { if (a.tracks?.[0]) playTrack(a.tracks[0], a.tracks); }} />
        </div>
        <div style={{ position: 'absolute', left: 18, bottom: 14, right: 18 }}>
          <div className="flex center gap-s" style={{ marginBottom: 6 }}>
            <span className="chip chip-lime">{a.trackCount} track{a.trackCount === 1 ? '' : 's'}</span>
            <span className="chip">{a.years[0]}-{a.years[a.years.length - 1]}</span>
          </div>
          <h3 className="h-head" style={{ fontSize: 14 }}>{a.name}</h3>
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div className="flex center gap-s wrap-flex" style={{ marginBottom: 10 }}>
          <ArtistActChips artist={a} />
        </div>
        <div className="flex between center" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          <span>{a.city}</span><span style={{ color: 'var(--lime)' }}>{a.monthly}</span>
        </div>
      </div>
    </div>
  );
}

function RosterArtistListRow({ a, i }) {
  return (
    <div className="track-row" data-cursor onClick={() => go('artist', a.id)} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto', gap: 14, alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}><CoverArt palKey={a.pal} motif={a.motif} seed={a.id} src={a.cover} round={10} animated={false} /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
        <div className="flex center gap-s wrap-flex" style={{ marginTop: 5 }}><ArtistActChips artist={a} /></div>
      </div>
      <span className="chip chip-lime">{a.trackCount} track{a.trackCount === 1 ? '' : 's'}</span>
      <button data-cursor onClick={(e) => { e.stopPropagation(); if (a.tracks?.[0]) playTrack(a.tracks[0], a.tracks); }} className="btn btn-candy" style={{ padding: '9px 14px', fontSize: 12 }}>play</button>
    </div>
  );
}

/* ============================================================ ARTIST PAGE */
function ArtistPage({ id }) {
  const a = ARTISTS.find(x => x.id === id);
  if (!a) return <div className="wrap" style={{ paddingTop: 80 }}>artist not found.</div>;
  const tracks = a.tracks;
  const releases = RELEASES.filter(r => tracks.some(t => t.releaseId === r.id));
  return (
    <div>
      {/* hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}><CoverArt palKey={a.pal} motif={a.motif} seed={a.id + 'bg'} src={a.cover} round={0} style={{ height: '100%', aspectRatio: 'auto' }} /></div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,238,250,0.5) 0%, rgba(255,235,250,0.82) 55%, var(--bg) 94%)', backdropFilter: 'blur(2px)' }} />
        <div className="noise" style={{ position: 'absolute', inset: 0 }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 2, paddingTop: 48, paddingBottom: 28 }}>
          <button className="btn btn-ghost anim-rise" data-cursor onClick={() => go('roster')} style={{ marginBottom: 24, padding: '8px 16px', fontSize: 12 }}>← roster</button>
          <div className="flex center gap-l artist-hero" style={{ gap: 30 }}>
            <div className="anim-pop" style={{ width: 'min(220px, 40vw)', flexShrink: 0, borderRadius: 24, overflow: 'hidden', boxShadow: `0 24px 70px ${a.accent}66`, border: '3px solid rgba(255,255,255,0.15)' }}>
              <CoverArt palKey={a.pal} motif={a.motif} seed={a.id} src={a.cover} round={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="flex center gap-s wrap-flex anim-rise" style={{ marginBottom: 14 }}>
                <span className="chip chip-lime">roster artist</span>
                <ArtistActChips artist={a} colorClass="chip-cyan" />
              </div>
              <h1 className="h-display anim-rise" style={{ fontSize: 'clamp(24px,4.8vw,54px)', lineHeight: 0.85, animationDelay: '.05s' }}><Chrome>{a.name}</Chrome></h1>
              <p className="anim-rise" style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 560, marginTop: 18, animationDelay: '.1s' }}>{a.bio}</p>
              <div className="flex center wrap-flex gap-m anim-rise" style={{ marginTop: 24, animationDelay: '.15s' }}>
                <button className="btn btn-candy" data-cursor onClick={() => tracks[0] && playTrack(tracks[0], tracks)}>▶ play artist tracks</button>
                <button className="btn btn-ghost" data-cursor onClick={() => go('playlist')}>open playlist</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>{a.monthly} · {a.city}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ marginTop: 20 }}>
        {/* credited tracks */}
        <div className="section-label" style={{ marginBottom: 18 }}>TRACKS</div>
        <div className="panel" style={{ overflow: 'hidden', marginBottom: 50 }}>
          {tracks.map((t, i) => <TrackRow key={t.id} t={t} i={i} queue={tracks} />)}
        </div>

        {/* discography */}
        <div className="section-label" style={{ marginBottom: 18 }}>APPEARS ON</div>
        <div className="grid grid-4" style={{ marginBottom: 50 }}>
          {releases.map((r, i) => <ReleaseCard key={r.id} r={r} delay={i * 0.05} />)}
        </div>
      </div>
    </div>
  );
}

function TrackRow({ t, i, queue }) {
  const s = playerStore.use();
  const isCur = curTrack() && curTrack().id === t.id && s.queue.some(q => q.id === t.id);
  return (
    <div className="track-row" data-cursor onClick={() => playTrack(t, queue ? [...queue] : null)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid var(--line)', background: isCur ? 'rgba(255,43,214,0.08)' : 'transparent' }}>
      <div style={{ width: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted-2)' }}>{isCur && s.playing ? <EQ /> : i + 1}</div>
      <div style={{ width: 42, height: 42, flexShrink: 0 }}><CoverArt palKey={t.pal} motif={t.motif} seed={t.id} src={t.cover} round={8} animated={false} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isCur ? 'var(--pink-deep)' : 'var(--ink)' }}>{t.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.artist}</div>
      </div>
      <button data-cursor onClick={(e) => { e.stopPropagation(); addToQueue(t); }} className="row-add" title="add to queue" style={{ fontSize: 18, color: 'var(--muted)', padding: '0 6px' }}>＋</button>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-2)', width: 38, textAlign: 'right' }}>{t.dur}</span>
    </div>
  );
}

/* ============================================================ RELEASES INDEX */
function ReleasesPage() {
  const [filter, setFilter] = useState('All');
  const types = ['All', ...RELEASES.map(r => r.actLabel)];
  const list = filter === 'All' ? RELEASES : RELEASES.filter(r => r.actLabel === filter);
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <PageHead kicker="✦ DISCOGRAPHY ✦" title="releases" sub={`${RELEASES.length} ACT compilations, ${ALL_TRACKS.length} tracks, and the full label run in one place.`} />
      <div className="flex center gap-s wrap-flex" style={{ marginBottom: 28 }}>
        {types.map(ty => (
          <button key={ty} data-cursor onClick={() => setFilter(ty)} className="btn" style={{
            padding: '9px 18px', fontSize: 12,
            background: filter === ty ? 'var(--grad-candy)' : 'var(--fill)',
            color: filter === ty ? '#fff' : 'var(--ink)',
            border: filter === ty ? 'none' : '1.5px solid var(--line-2)',
          }}>{ty}</button>
        ))}
      </div>
      <div className="grid grid-4">
        {list.map((r, i) => <ReleaseCard key={r.id} r={r} delay={i * 0.04} />)}
      </div>
    </div>
  );
}

/* ============================================================ RELEASE DETAIL */
function ReleasePage({ id }) {
  const r = RELEASES.find(x => x.id === id);
  if (!r) return <div className="wrap" style={{ paddingTop: 80 }}>release not found.</div>;
  const tracks = r.tracks.map(t => ({ ...t, releaseId: r.id, color: r.color, pal: r.pal, motif: r.motif }));
  const totalSec = tracks.reduce((s, t) => s + parseDur(t.dur), 0);
  return (
    <div>
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><CoverArt palKey={r.pal} motif={r.motif} seed={r.id + 'bg'} src={r.cover} round={0} style={{ height: '100%', aspectRatio: 'auto' }} /></div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,238,250,0.45) 0%, rgba(255,235,250,0.8) 55%, var(--bg) 92%)', backdropFilter: 'blur(2px)' }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 2, paddingTop: 44, paddingBottom: 30 }}>
          <button className="btn btn-ghost" data-cursor onClick={() => go('releases')} style={{ marginBottom: 24, padding: '8px 16px', fontSize: 12 }}>← releases</button>
          <div className="flex center gap-l artist-hero" style={{ gap: 32, alignItems: 'flex-end' }}>
            <div className="anim-pop" style={{ width: 'min(260px,46vw)', flexShrink: 0, borderRadius: 22, overflow: 'hidden', boxShadow: `0 28px 80px ${r.color}77`, border: '3px solid rgba(255,255,255,0.15)' }}>
              <CoverArt palKey={r.pal} motif={r.motif} seed={r.id} src={r.cover} round={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="flex center gap-s wrap-flex anim-rise" style={{ marginBottom: 14 }}><TypeChip type={r.type} /><span className="chip">{r.actLabel}</span>{r.tag === 'new' && <span className="chip chip-lime">new</span>}</div>
              <h1 className="h-display anim-rise" style={{ fontSize: 'clamp(20px,3.9vw,46px)', lineHeight: 0.88, animationDelay: '.05s' }}><Chrome>{r.title}</Chrome></h1>
              <div className="flex center gap-s anim-rise" style={{ marginTop: 14, animationDelay: '.1s' }}>
                <span className="chip chip-cyan">{r.tracks.length} tracks</span>
                <span className="chip">{fmt(totalSec)}</span>
              </div>
              <div className="flex center wrap-flex gap-m anim-rise" style={{ marginTop: 22, animationDelay: '.15s' }}>
                <button className="btn btn-candy" data-cursor onClick={() => playRelease(r)} style={{ fontSize: 15, padding: '15px 26px' }}>▶ play</button>
                <button className="btn btn-ghost" data-cursor onClick={() => playerStore.set(s => ({ ...s, queue: [...s.queue, ...tracks] }))}>＋ add to queue</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>{tracks.length} tracks · {fmt(totalSec)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ marginTop: 18 }}>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 620, marginBottom: 26 }}>{r.blurb}</p>
        <div className="panel" style={{ overflow: 'hidden', marginBottom: 40 }}>
          {tracks.map((t, i) => <TrackRow key={t.id} t={t} i={i} queue={tracks} />)}
        </div>
      </div>
    </div>
  );
}

function PlaylistPage() {
  const s = playerStore.use();
  const current = curTrack();
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <PageHead kicker="✦ LABEL PLAYER ✦" title="playlist" sub={`${ALL_TRACKS.length} tracks grouped by ACT. Build the queue, jump eras, or run the whole label front to back.`}>
        <div className="flex center gap-s wrap-flex" style={{ marginTop: 18 }}>
          <button className="btn btn-candy" data-cursor onClick={() => { playerStore.set({ queue: ALL_TRACKS, index: 0, t: 0, playing: true }); syncAudio(); }}>▶ play all</button>
          <button className="btn btn-ghost" data-cursor onClick={() => playerStore.set({ showQueue: true })}>open queue</button>
        </div>
      </PageHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {RELEASES.map((release) => (
          <div key={release.id} className="panel gloss anim-rise" style={{ overflow: 'hidden' }}>
            <div className="flex between center wrap-flex" style={{ gap: 14, padding: 18, borderBottom: '1px solid var(--line)' }}>
              <div className="flex center gap-m" style={{ minWidth: 0 }}>
                <div style={{ width: 62, height: 62, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}><CoverArt palKey={release.pal} motif={release.motif} seed={release.id} src={release.cover} round={12} animated={false} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="section-label" style={{ marginBottom: 6 }}>{release.actLabel}</div>
                  <h2 className="h-head" style={{ fontSize: 13 }}>{release.title}</h2>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{release.tracks.length} tracks</div>
                </div>
              </div>
              <button className="btn btn-candy" data-cursor onClick={() => playRelease(release)}>▶ play ACT</button>
            </div>
            {release.tracks.map((track, i) => (
              <TrackRow key={track.id} t={{ ...track, releaseId: release.id, color: release.color, pal: release.pal, motif: release.motif }} i={i} queue={release.tracks.map(t => ({ ...t, releaseId: release.id, color: release.color, pal: release.pal, motif: release.motif }))} />
            ))}
          </div>
        ))}
      </div>
      {current && (
        <div className="panel" style={{ marginTop: 28, padding: 18 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>NOW / NEXT</div>
          <div className="flex between center wrap-flex" style={{ gap: 14 }}>
            <div>
              <b>{current.title}</b>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{current.artist}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>queue: {s.queue.length} tracks</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactWorld() {
  const mountRef = useRef(null);
  useEffect(() => {
    let disposed = false;
    let renderer, scene, camera, frame, group, mixer, controls;
    let mount;
    let loadedModel = null;
    let modelCenter = null;
    let modelMaxDim = 1;
    let groupBaseY = 0;
    let resize, pulse, dragStart, dragMove, dragEnd, zoomWheel;
    const drag = { active: false, lastX: 0, lastY: 0 };
    const clockState = { last: performance.now() };
    async function boot() {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      if (disposed || !mountRef.current) return;
      mount = mountRef.current;
      mount.dataset.interactive = 'orbit-controls';
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d87ff);
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 1.05, 7);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x0d87ff, 1);
      renderer.domElement.setAttribute('aria-label', 'Interactive Weird NXC world');
      renderer.domElement.style.cursor = 'grab';
      renderer.domElement.style.touchAction = 'none';
      mount.appendChild(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.75;
      controls.rotateSpeed = 0.72;
      controls.zoomSpeed = 0.7;
      controls.minPolarAngle = Math.PI * 0.25;
      controls.maxPolarAngle = Math.PI * 0.68;
      controls.minDistance = 4.2;
      controls.maxDistance = 9.4;
      controls.addEventListener('start', () => {
        if (mount) mount.dataset.userInteracted = 'true';
        controls.autoRotate = false;
        renderer.domElement.style.cursor = 'grabbing';
      });
      controls.addEventListener('end', () => {
        renderer.domElement.style.cursor = 'grab';
      });
      const markInteracted = () => {
        if (mount) mount.dataset.userInteracted = 'true';
        if (controls) controls.autoRotate = false;
      };

      const hemi = new THREE.HemisphereLight(0xdaf8ff, 0xffa6e4, 2.5);
      const key = new THREE.DirectionalLight(0xffffff, 3.8);
      key.position.set(3, 5, 4);
      const pink = new THREE.PointLight(0xff45c0, 3.5, 12);
      pink.position.set(-2.4, 1.5, 2.2);
      const cyan = new THREE.PointLight(0x34d6ff, 3, 12);
      cyan.position.set(2.6, 1.2, 2.2);
      scene.add(hemi, key, pink, cyan);

      const texture = await new THREE.TextureLoader().loadAsync('/clouds.jpg');
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;

      group = new THREE.Group();
      scene.add(group);
      const fitScene = () => {
        if (!mount || !camera || !group) return;
        const rect = mount.getBoundingClientRect();
        const isMobileWorld = rect.width < 620;
        camera.fov = isMobileWorld ? 46 : 39;
        camera.position.set(0, isMobileWorld ? 1.0 : 1.2, isMobileWorld ? 7.4 : 6.45);
        camera.updateProjectionMatrix();
        groupBaseY = isMobileWorld ? 1.12 : -0.04;
        group.position.set(isMobileWorld ? 0 : -0.72, groupBaseY, 0);
        if (controls) {
          controls.target.set(group.position.x, group.position.y + (isMobileWorld ? -0.14 : 0.12), 0);
          controls.minDistance = isMobileWorld ? 5.2 : 4.2;
          controls.maxDistance = isMobileWorld ? 10 : 8.8;
          controls.update();
        }
        if (loadedModel && modelCenter) {
          const targetSize = isMobileWorld ? 3.2 : 3.85;
          const scale = targetSize / Math.max(modelMaxDim, 0.001);
          loadedModel.scale.setScalar(scale);
          loadedModel.position.set(
            -modelCenter.x * scale,
            -modelCenter.y * scale + (isMobileWorld ? 0.02 : -0.12),
            -modelCenter.z * scale,
          );
        }
      };
      const loader = new GLTFLoader();
      loader.load('/models/WeirdHQ.glb', (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        let meshCount = 0;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        loadedModel = model;
        modelCenter = center;
        modelMaxDim = Math.max(size.x, size.y, size.z || 1);
        model.traverse((child) => {
          if (child.isMesh) {
            meshCount += 1;
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.15;
              child.material.roughness = Math.min(0.6, child.material.roughness ?? 0.45);
              child.material.metalness = Math.min(0.35, child.material.metalness ?? 0.1);
              if ('emissiveIntensity' in child.material) child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity ?? 0, 0.08);
            }
          }
        });
        if (mount) {
          mount.dataset.model = 'loaded';
          mount.dataset.meshes = String(meshCount);
        }
        group.add(model);
        fitScene();
        gsap.fromTo(group.scale, { x: 0.74, y: 0.74, z: 0.74 }, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
      }, undefined, () => {
        if (disposed) return;
        if (mount) mount.dataset.model = 'fallback';
        const fallback = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.35, 2),
          new THREE.MeshStandardMaterial({ color: 0xff45c0, roughness: 0.35, metalness: 0.2, emissive: 0x35104a, emissiveIntensity: 0.25 }),
        );
        fallback.position.y = 0.15;
        group.add(fallback);
      });

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.018, 12, 160),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.58 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.18;
      group.add(ring);

      resize = () => {
        if (!mount || !renderer) return;
        const rect = mount.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / Math.max(1, rect.height);
        camera.updateProjectionMatrix();
        fitScene();
      };
      pulse = () => {
        if (!group) return;
        markInteracted();
        gsap.fromTo(group.scale, { x: 1, y: 1, z: 1 }, { x: 1.06, y: 1.06, z: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
      };
      dragStart = (event) => {
        if (!group) return;
        markInteracted();
        drag.active = true;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        renderer.domElement.style.cursor = 'grabbing';
        mount.setPointerCapture?.(event.pointerId);
      };
      dragMove = (event) => {
        if (!drag.active || !group) return;
        markInteracted();
        const dx = event.clientX - drag.lastX;
        const dy = event.clientY - drag.lastY;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        group.rotation.y += dx * 0.012;
        group.rotation.x = Math.max(-0.45, Math.min(0.45, group.rotation.x + dy * 0.008));
      };
      dragEnd = (event) => {
        drag.active = false;
        renderer.domElement.style.cursor = 'grab';
        mount.releasePointerCapture?.(event.pointerId);
      };
      zoomWheel = (event) => {
        markInteracted();
        event.preventDefault();
        camera.position.z = Math.max(4.2, Math.min(10, camera.position.z + event.deltaY * 0.003));
        controls?.update();
      };
      mount.addEventListener('pointerdown', dragStart);
      mount.addEventListener('pointermove', dragMove);
      mount.addEventListener('pointerup', dragEnd);
      mount.addEventListener('pointercancel', dragEnd);
      mount.addEventListener('wheel', zoomWheel, { passive: false });
      mount.addEventListener('click', pulse);
      window.addEventListener('resize', resize);
      resize();

      const render = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = (now - clockState.last) / 1000;
        clockState.last = now;
        if (mixer) mixer.update(dt);
        if (group) {
          group.position.y = groupBaseY + Math.sin(now * 0.0012) * 0.08;
          if (mount?.dataset.userInteracted !== 'true') group.rotation.y += 0.0025;
        }
        controls?.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();
    }
    boot();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (mount) {
        if (dragStart) mount.removeEventListener('pointerdown', dragStart);
        if (dragMove) mount.removeEventListener('pointermove', dragMove);
        if (dragEnd) {
          mount.removeEventListener('pointerup', dragEnd);
          mount.removeEventListener('pointercancel', dragEnd);
        }
        if (zoomWheel) mount.removeEventListener('wheel', zoomWheel);
        if (pulse) mount.removeEventListener('click', pulse);
      }
      if (resize) window.removeEventListener('resize', resize);
      controls?.dispose?.();
      if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer?.dispose?.();
    };
  }, []);
  return <div ref={mountRef} className="contact-world" style={{ minHeight: 520, height: 'min(68vh, 680px)', borderRadius: 0, overflow: 'hidden', position: 'relative' }} />;
}

function ContactForm() {
  const [state, setState] = useState({ sending: false, sent: false, error: '' });
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ sending: true, sent: false, error: '' });
    try {
      const response = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Message could not be sent.');
      form.reset();
      setState({ sending: false, sent: true, error: '' });
    } catch (error) {
      setState({ sending: false, sent: false, error: error.message || 'Message could not be sent.' });
    }
  }
  return (
    <form onSubmit={submit} className="panel gloss contact-form" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>A&R / BOOKINGS</div>
        <h2 className="h-head" style={{ fontSize: 17 }}>send it to the label</h2>
      </div>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }} />
      <input required name="name" placeholder="Name" className="field-input" style={{ minHeight: 48, borderRadius: 14, border: '1.5px solid var(--line-2)', padding: '0 14px' }} />
      <input required name="email" type="email" placeholder="Email" className="field-input" style={{ minHeight: 48, borderRadius: 14, border: '1.5px solid var(--line-2)', padding: '0 14px' }} />
      <select name="topic" className="field-input" defaultValue="Demo" style={{ minHeight: 48, borderRadius: 14, border: '1.5px solid var(--line-2)', padding: '0 14px' }}>
        <option>Demo</option>
        <option>Booking</option>
        <option>Press</option>
        <option>Licensing</option>
        <option>General</option>
      </select>
      <textarea required name="message" placeholder="Message" rows={6} className="field-input" style={{ borderRadius: 14, border: '1.5px solid var(--line-2)', padding: 14, resize: 'vertical' }} />
      <button disabled={state.sending} data-cursor className="btn btn-candy" style={{ justifyContent: 'center', minHeight: 48, opacity: state.sending ? 0.68 : 1 }}>
        {state.sending ? 'sending...' : 'send message'}
      </button>
      {state.sent && <div className="chip chip-lime" style={{ justifyContent: 'center' }}>message sent</div>}
      {state.error && <div className="chip chip-pink" style={{ justifyContent: 'center' }}>{state.error}</div>}
    </form>
  );
}

function ContactPage() {
  return (
    <div style={{ paddingTop: 40 }}>
      <div className="wrap">
        <PageHead kicker="✦ CONTACT ✦" title="contact" sub="Demos, bookings, press, licensing, and weird label business." />
      </div>
      <section className="contact-stage" style={{ position: 'relative', overflow: 'hidden', minHeight: 'min(760px, calc(100vh - 120px))', background: 'linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,214,239,.4))' }}>
        <div className="noise" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        <ContactWorld />
        <div className="wrap contact-form-wrap" style={{ position: 'absolute', inset: '0 0 auto 0', zIndex: 2, height: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px, 430px)', alignItems: 'center', gap: 28, pointerEvents: 'none' }}>
          <div />
          <div style={{ pointerEvents: 'auto' }}>
            <ContactForm />
            <div className="flex center gap-s wrap-flex" style={{ marginTop: 14, justifyContent: 'center' }}>
              <a href="https://linktr.ee/weirdnxc" target="_blank" rel="noopener" data-cursor className="chip">linktree</a>
              <a href="https://x.com/weirdnxc" target="_blank" rel="noopener" data-cursor className="chip">x / twitter</a>
              <a href="https://soundcloud.com/weirdnxc" target="_blank" rel="noopener" data-cursor className="chip">soundcloud</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   weirdnxc — app shell + router
   ============================================================ */

const NAV = [
  { id: 'home',     label: 'home',     icon: '★', color: 'var(--pink)' },
  { id: 'roster',   label: 'roster',   icon: '☻', color: 'var(--lime)' },
  { id: 'releases', label: 'releases', icon: '◓', color: 'var(--cyan)' },
  { id: 'playlist', label: 'playlist', icon: '♪', color: 'var(--lav)' },
  { id: 'contact',  label: 'contact',  icon: '✦', color: 'var(--orange)' },
];

/* ---------- floating background stickers ---------- */
function StickerField() {
  const items = [
    { e: '★', t: '12%', l: '6%', s: 30, d: '0s', c: 'var(--lemon)' },
    { e: '♥', t: '24%', l: '90%', s: 26, d: '1.2s', c: 'var(--pink)' },
    { e: '✿', t: '62%', l: '4%', s: 28, d: '.6s', c: 'var(--cyan)' },
    { e: '☻', t: '78%', l: '92%', s: 30, d: '1.8s', c: 'var(--lime)' },
    { e: '✦', t: '44%', l: '95%', s: 22, d: '.3s', c: 'var(--lav)' },
    { e: '♬', t: '88%', l: '40%', s: 24, d: '2.1s', c: 'var(--orange)' },
  ];
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {items.map((it, i) => (
        <span key={i} className="bob" style={{ position: 'absolute', top: it.t, left: it.l, fontSize: it.s, color: it.c, opacity: 0.5, animationDelay: it.d, textShadow: '0 2px 6px rgba(255,255,255,0.8)' }}>{it.e}</span>
      ))}
    </div>
  );
}

/* ---------- desktop sidebar ---------- */
function Sidebar() {
  const nav = navStore.use();
  const p = playerStore.use();
  const t = curTrack();
  return (
    <aside className="desktop-sidebar" style={{ height: '100vh', position: 'sticky', top: 0, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 50 }}>
      <div className="panel" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'hidden' }}>
        {/* logo */}
        <div data-cursor onClick={() => go('home')} style={{ cursor: 'pointer', padding: '4px 6px 10px' }}>
          <img src="/weirdnxc-logo.png" alt="weirdnxc" className="float" style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 4px 10px rgba(255,69,192,0.4))' }} />
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--ink-2)', marginTop: 2, textTransform: 'uppercase' }}>stay weird ✦ est. {STATS.founded}</div>
        </div>

        {/* nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NAV.map(n => {
            const active = nav.route === n.id;
            return (
              <button key={n.id} data-cursor onClick={() => go(n.id)} className="gloss" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 16, textAlign: 'left',
                fontFamily: 'var(--font-head)', fontSize: 15, color: active ? '#fff' : 'var(--ink)',
                background: active ? n.color : 'rgba(255,255,255,0.5)',
                border: active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.7)',
                boxShadow: active ? `0 6px 16px ${n.color.includes('var') ? 'rgba(255,69,192,0.4)' : n.color}, inset 0 2px 0 rgba(255,255,255,0.6)` : 'inset 0 1px 0 rgba(255,255,255,0.8)',
                transform: active ? 'translateX(4px)' : 'none', transition: 'transform .15s, background .15s',
              }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: active ? 'rgba(255,255,255,0.3)' : n.color, color: active ? '#fff' : '#fff', fontSize: 14, boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)' }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* now playing mini */}
        {t && (
          <div data-cursor onClick={() => playerStore.set({ expanded: true })} className="bezel" style={{ borderRadius: 16, padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}><CoverArt seed={t.id} src={t.cover} round={8} animated={false} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 5 }}>{p.playing ? <EQ /> : '❚❚'} now playing</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
            </div>
          </div>
        )}

        {/* credits */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' }}>
          founded {STATS.founded}<br /><b style={{ color: 'var(--pink-deep)' }}>{RELEASES.length} ACTs</b> · <b style={{ color: 'var(--orange)' }}>{ALL_TRACKS.length} cuts</b>
        </div>
        <div className="flex center" style={{ justifyContent: 'center', gap: 8 }}>
          <a href="https://x.com/weirdnxc" target="_blank" rel="noopener" data-cursor className="chip" style={{ fontSize: 10 }}>𝕏</a>
          <a href="https://soundcloud.com/weirdnxc" target="_blank" rel="noopener" data-cursor className="chip" style={{ fontSize: 10 }}>☁ SC</a>
        </div>
      </div>
    </aside>
  );
}

/* ---------- mobile top + bottom nav ---------- */
function MobileNav() {
  const nav = navStore.use();
  const items = NAV;
  return (
    <>
      <header className="mobile-nav" style={{ position: 'sticky', top: 0, zIndex: 100, padding: 10, alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', borderBottom: '2px solid #fff' }}>
        <img src="/weirdnxc-logo.png" alt="weirdnxc" data-cursor onClick={() => go('home')} style={{ height: 42, width: 112, objectFit: 'contain', opacity: nav.route === 'home' ? 0 : 1, pointerEvents: nav.route === 'home' ? 'none' : 'auto', transition: 'opacity .2s ease' }} />
        <button data-cursor onClick={() => playerStore.set({ showQueue: true })} className="btn btn-ghost" style={{ padding: '8px 14px', position: 'relative' }}>♪ playlist</button>
      </header>
      <nav className="mobile-nav" style={{ position: 'fixed', left: 8, right: 8, bottom: 'calc(var(--player-h) + 8px)', zIndex: 150, padding: 6, justifyContent: 'space-around', borderRadius: 20, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', border: '2px solid #fff', boxShadow: '0 8px 24px rgba(150,40,170,0.25)' }}>
        {items.map(n => {
          const active = nav.route === n.id;
          return (
            <button key={n.id} data-cursor onClick={() => go(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 8px', borderRadius: 12, position: 'relative', background: active ? n.color : 'transparent', color: active ? '#fff' : 'var(--ink)', minWidth: 40 }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ---------- router ---------- */
function Router() {
  const nav = navStore.use();
  const { route, param } = nav;
  switch (route) {
    case 'home': return <HomePage />;
    case 'roster': return <RosterPage />;
    case 'artist': return <ArtistPage id={param} />;
    case 'releases': return <ReleasesPage />;
    case 'release': return <ReleasePage id={param} />;
    case 'playlist': return <PlaylistPage />;
    case 'contact': return <ContactPage />;
    default: return <HomePage />;
  }
}

/* ---------- app ---------- */
function App() {
  const appRef = useRef(null);
  useEffect(() => {
    startEngine();
    const applyRoute = () => {
      const next = routeFromHash();
      navStore.set(s => ({ ...s, route: next.route, param: next.param, history: [...s.history, next.route] }));
      const el = document.querySelector('.scroll-area');
      if (el) el.scrollTop = 0;
    };
    applyRoute();
    window.addEventListener('popstate', applyRoute);
    window.addEventListener('hashchange', applyRoute);
    return () => {
      window.removeEventListener('popstate', applyRoute);
      window.removeEventListener('hashchange', applyRoute);
    };
  }, []);
  const nav = navStore.use();
  useGSAP((context, contextSafe) => {
    const root = appRef.current;
    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        desktop: '(min-width: 881px)',
      },
      (context) => {
        const { reduceMotion, desktop } = context.conditions;
        if (reduceMotion) {
          gsap.set('.anim-rise,.anim-pop,.card-hover,.section-label', { clearProps: 'all' });
          return;
        }

        const routeTl = gsap.timeline({
          defaults: { ease: 'power3.out', overwrite: 'auto' },
        });

        routeTl
          .fromTo('.section-label', { autoAlpha: 0, y: 16, x: -8 }, {
            autoAlpha: 1,
            y: 0,
            x: 0,
            duration: 0.42,
            stagger: { each: 0.035, from: 'start' },
          }, 0)
          .fromTo('.h-display', { autoAlpha: 0, y: desktop ? 34 : 20, scale: 0.94, rotation: desktop ? -1.6 : 0 }, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.72,
            ease: 'expo.out',
          }, 0.04)
          .fromTo('.anim-rise', { autoAlpha: 0, y: desktop ? 34 : 20, scale: 0.985 }, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.64,
            stagger: { each: 0.045, from: 'start' },
          }, 0.12)
          .fromTo('.anim-pop', { autoAlpha: 0, scale: 0.82, rotation: desktop ? -2.5 : 0 }, {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.72,
            ease: 'back.out(1.85)',
            stagger: { each: 0.04, from: 'center' },
          }, 0.14)
          .fromTo('.card-hover', {
            autoAlpha: 0,
            y: desktop ? 32 : 16,
            rotationX: desktop ? -8 : 0,
            rotationY: desktop ? 4 : 0,
            scale: 0.975,
            transformOrigin: '50% 70%',
          }, {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.62,
            stagger: { amount: desktop ? 0.28 : 0.16, from: 'start' },
          }, 0.2);
      },
      appRef,
    );

    if (!root) return () => mm.revert();

    const onPointerEnter = contextSafe((event) => {
      const target = event.target;
      const card = target.closest?.('.card-hover');
      const button = target.closest?.('.btn');
      if (card && root.contains(card)) {
        gsap.to(card, {
          y: -9,
          scale: 1.018,
          rotationX: -2.5,
          rotationY: 2.5,
          duration: 0.34,
          ease: 'back.out(1.45)',
          overwrite: 'auto',
        });
      }
      if (button && root.contains(button)) {
        gsap.to(button, {
          y: -3,
          scale: 1.045,
          filter: 'saturate(1.18) brightness(1.04)',
          duration: 0.24,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    });

    const onPointerLeave = contextSafe((event) => {
      const target = event.target;
      const card = target.closest?.('.card-hover');
      const button = target.closest?.('.btn');
      if (card && root.contains(card)) {
        gsap.to(card, {
          y: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          duration: 0.42,
          ease: 'elastic.out(1, 0.6)',
          overwrite: 'auto',
          clearProps: 'filter',
        });
      }
      if (button && root.contains(button)) {
        gsap.to(button, {
          y: 0,
          scale: 1,
          filter: 'none',
          duration: 0.28,
          ease: 'power3.out',
          overwrite: 'auto',
          clearProps: 'filter',
        });
      }
    });

    root.addEventListener('pointerenter', onPointerEnter, true);
    root.addEventListener('pointerleave', onPointerLeave, true);

    return () => {
      root.removeEventListener('pointerenter', onPointerEnter, true);
      root.removeEventListener('pointerleave', onPointerLeave, true);
      mm.revert();
    };
  }, { dependencies: [nav.route, nav.param], scope: appRef, revertOnUpdate: true });
  return (
    <>
      <SparkleCursor />
      <StickerField />
      <div ref={appRef} className="app" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar />
        <main style={{ minWidth: 0, position: 'relative' }}>
          <MobileNav />
          <div className="scroll-area" key={nav.route + (nav.param || '')}>
            <Router />
            <Footer />
          </div>
        </main>
      </div>
      <PlayerBar />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div style={{ height: 2, background: 'var(--grad-rainbow)', backgroundSize: '200% 100%', animation: 'hue-pan 8s linear infinite', margin: '0 24px 24px', borderRadius: 2 }} />
      <div className="wrap flex between center wrap-flex" style={{ gap: 16 }}>
        <img src="/weirdnxc-logo.png" alt="weirdnxc" style={{ height: 54, width: 144, objectFit: 'contain' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.7 }}>
          <div>weirdnxc® {CURRENT_YEAR} — stay weird · founded {STATS.founded} by Gasoiid - Sunshine Vendetta</div>
          <div>site by: Sunshine Vendetta®</div>
        </div>
      </div>
    </footer>
  );
}


export default App;


import rawAudioCatalog from "../../../public/music/tracks.json";

export type WeirdNxcRawCatalog = typeof rawAudioCatalog;
export type WeirdNxcAct = keyof WeirdNxcRawCatalog;

export type WeirdNxcTrack = {
  id: string;
  act: WeirdNxcAct;
  releaseId: string;
  trackNumber: number;
  filename: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  duration: number;
  durationLabel: string;
  audioSrc: string;
  coverSrc: string;
};

export type WeirdNxcRelease = {
  id: string;
  act: WeirdNxcAct;
  title: string;
  album: string;
  albums: string[];
  coverFilename: string;
  coverSrc: string;
  trackCount: number;
  duration: number;
  durationLabel: string;
  tracks: WeirdNxcTrack[];
};

export type WeirdNxcArtist = {
  id: string;
  name: string;
  sourceNames: string[];
  trackCount: number;
  acts: WeirdNxcAct[];
  releaseIds: string[];
  trackIds: string[];
  bonusOnly: boolean;
};

export type WeirdNxcStats = {
  founded: 2018;
  acts: number;
  releases: number;
  tracks: number;
  artists: number;
  totalDuration: number;
  totalDurationLabel: string;
};

type RawTrack = WeirdNxcRawCatalog[WeirdNxcAct]["tracks"][number];

type ArtistAccumulator = {
  id: string;
  name: string;
  sourceNames: Set<string>;
  trackIds: Set<string>;
  acts: Set<WeirdNxcAct>;
  releaseIds: Set<string>;
  trackCount: number;
  bonusOnly: boolean;
};

export const WEIRDNXC_FOUNDED_YEAR = 2018 as const;

export const WEIRDNXC_ACTS = Object.keys(rawAudioCatalog).sort(
  (left, right) => actNumber(left) - actNumber(right),
) as WeirdNxcAct[];

const BONUS_PREFIX_PATTERN = /^\((bonus(?:\u00b2|2)?|surprise[^)]*)\)\s*/iu;

function actNumber(act: string) {
  return Number(act.replace(/\D/g, ""));
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "artist";
}

function normalizeArtistName(artist: string) {
  return artist.replace(BONUS_PREFIX_PATTERN, "").trim();
}

function artistSortKey(artist: string) {
  return normalizeArtistName(artist).toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function uniqueInOrder<T>(values: Iterable<T>) {
  return [...new Set(values)];
}

function compareActs(left: WeirdNxcAct, right: WeirdNxcAct) {
  return actNumber(left) - actNumber(right);
}

function compareReleases(left: string, right: string) {
  return actNumber(left) - actNumber(right);
}

function buildTrack(act: WeirdNxcAct, releaseId: string, coverSrc: string, track: RawTrack, index: number) {
  const normalizedArtist = normalizeArtistName(track.artist);

  return {
    id: `${releaseId}-${track.filename.replace(/\.[^.]+$/, "")}`,
    act,
    releaseId,
    trackNumber: index + 1,
    filename: track.filename,
    title: track.title,
    artist: normalizedArtist,
    artistId: slugify(normalizedArtist),
    album: track.album,
    duration: track.duration,
    durationLabel: formatDuration(track.duration),
    audioSrc: `/music/${act}/${track.filename}`,
    coverSrc,
  } satisfies WeirdNxcTrack;
}

function buildReleases() {
  return WEIRDNXC_ACTS.map((act) => {
    const rawRelease = rawAudioCatalog[act];
    const releaseId = act.toLowerCase();
    const coverSrc = `/music/${act}/${rawRelease.cover}`;
    const tracks = rawRelease.tracks.map((track, index) => buildTrack(act, releaseId, coverSrc, track, index));
    const albums = uniqueInOrder(tracks.map((track) => track.album));
    const duration = tracks.reduce((total, track) => total + track.duration, 0);

    return {
      id: releaseId,
      act,
      title: albums[0] ?? act,
      album: albums[0] ?? act,
      albums,
      coverFilename: rawRelease.cover,
      coverSrc,
      trackCount: tracks.length,
      duration,
      durationLabel: formatDuration(duration),
      tracks,
    } satisfies WeirdNxcRelease;
  });
}

function buildArtists(tracks: WeirdNxcTrack[]) {
  const artists = new Map<string, ArtistAccumulator>();

  tracks.forEach((track) => {
    const normalizedName = normalizeArtistName(track.artist);
    const sortKey = artistSortKey(track.artist);
    const existing = artists.get(sortKey);
    const artist = existing ?? {
      id: slugify(normalizedName),
      name: normalizedName,
      sourceNames: new Set<string>(),
      trackIds: new Set<string>(),
      acts: new Set<WeirdNxcAct>(),
      releaseIds: new Set<string>(),
      trackCount: 0,
      bonusOnly: true,
    };

    artist.sourceNames.add(track.artist);
    artist.trackIds.add(track.id);
    artist.acts.add(track.act);
    artist.releaseIds.add(track.releaseId);
    artist.trackCount += 1;
    artist.bonusOnly = artist.bonusOnly && BONUS_PREFIX_PATTERN.test(track.artist);

    artists.set(sortKey, artist);
  });

  return [...artists.values()]
    .map((artist) => ({
      id: artist.id,
      name: artist.name,
      sourceNames: [...artist.sourceNames],
      trackCount: artist.trackCount,
      acts: [...artist.acts].sort(compareActs),
      releaseIds: [...artist.releaseIds].sort(compareReleases),
      trackIds: [...artist.trackIds],
      bonusOnly: artist.bonusOnly,
    }) satisfies WeirdNxcArtist)
    .sort((left, right) => left.name.localeCompare(right.name, "en-US", { sensitivity: "base" }));
}

function mapById<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;
}

function mapTracksByAct(tracks: WeirdNxcTrack[]) {
  return WEIRDNXC_ACTS.reduce(
    (byAct, act) => {
      byAct[act] = tracks.filter((track) => track.act === act);
      return byAct;
    },
    {} as Record<WeirdNxcAct, WeirdNxcTrack[]>,
  );
}

function mapTracksByArtistId(artists: WeirdNxcArtist[], trackById: Record<string, WeirdNxcTrack>) {
  return Object.fromEntries(
    artists.map((artist) => [
      artist.id,
      artist.trackIds.map((trackId) => trackById[trackId]).filter(Boolean),
    ]),
  ) as Record<string, WeirdNxcTrack[]>;
}

function mapReleasesByArtistId(artists: WeirdNxcArtist[], releaseById: Record<string, WeirdNxcRelease>) {
  return Object.fromEntries(
    artists.map((artist) => [
      artist.id,
      artist.releaseIds.map((releaseId) => releaseById[releaseId]).filter(Boolean),
    ]),
  ) as Record<string, WeirdNxcRelease[]>;
}

export const WEIRDNXC_RELEASES = buildReleases();
export const WEIRDNXC_TRACKS = WEIRDNXC_RELEASES.flatMap((release) => release.tracks);
export const WEIRDNXC_ARTISTS = buildArtists(WEIRDNXC_TRACKS);

export const WEIRDNXC_RELEASE_BY_ID = mapById(WEIRDNXC_RELEASES);
export const WEIRDNXC_RELEASE_BY_ACT = Object.fromEntries(
  WEIRDNXC_RELEASES.map((release) => [release.act, release]),
) as Record<WeirdNxcAct, WeirdNxcRelease>;
export const WEIRDNXC_TRACK_BY_ID = mapById(WEIRDNXC_TRACKS);
export const WEIRDNXC_TRACKS_BY_ACT = mapTracksByAct(WEIRDNXC_TRACKS);
export const WEIRDNXC_ARTIST_BY_ID = mapById(WEIRDNXC_ARTISTS);
export const WEIRDNXC_TRACKS_BY_ARTIST_ID = mapTracksByArtistId(WEIRDNXC_ARTISTS, WEIRDNXC_TRACK_BY_ID);
export const WEIRDNXC_RELEASES_BY_ARTIST_ID = mapReleasesByArtistId(WEIRDNXC_ARTISTS, WEIRDNXC_RELEASE_BY_ID);

export const WEIRDNXC_STATS = {
  founded: WEIRDNXC_FOUNDED_YEAR,
  acts: WEIRDNXC_ACTS.length,
  releases: WEIRDNXC_RELEASES.length,
  tracks: WEIRDNXC_TRACKS.length,
  artists: WEIRDNXC_ARTISTS.length,
  totalDuration: WEIRDNXC_TRACKS.reduce((total, track) => total + track.duration, 0),
  totalDurationLabel: formatDuration(WEIRDNXC_TRACKS.reduce((total, track) => total + track.duration, 0)),
} satisfies WeirdNxcStats;

export const weirdNxcCatalog = {
  acts: WEIRDNXC_ACTS,
  releases: WEIRDNXC_RELEASES,
  tracks: WEIRDNXC_TRACKS,
  artists: WEIRDNXC_ARTISTS,
  stats: WEIRDNXC_STATS,
  releaseById: WEIRDNXC_RELEASE_BY_ID,
  releaseByAct: WEIRDNXC_RELEASE_BY_ACT,
  trackById: WEIRDNXC_TRACK_BY_ID,
  tracksByAct: WEIRDNXC_TRACKS_BY_ACT,
  artistById: WEIRDNXC_ARTIST_BY_ID,
  tracksByArtistId: WEIRDNXC_TRACKS_BY_ARTIST_ID,
  releasesByArtistId: WEIRDNXC_RELEASES_BY_ARTIST_ID,
};

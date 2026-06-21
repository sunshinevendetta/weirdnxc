'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type LocalAudioRepeatMode = 'off' | 'all' | 'one'

export type LocalAudioCatalogTrack = {
  filename: string
  title: string
  artist: string
  album?: string
  duration?: number
}

export type LocalAudioCatalogAct = {
  cover?: string
  tracks: readonly LocalAudioCatalogTrack[]
}

export type LocalAudioCatalog = Readonly<Record<string, LocalAudioCatalogAct>>

export type LocalAudioTrackInput = {
  id?: string
  act?: string
  filename?: string
  src?: string
  title: string
  artist: string
  album?: string
  duration?: number
  cover?: string
  trackNumber?: number
}

export type LocalAudioTrack = {
  id: string
  act: string
  filename?: string
  src: string
  title: string
  artist: string
  album?: string
  duration: number
  cover?: string
  trackNumber: number
}

export type LocalAudioTracksInput =
  | LocalAudioCatalog
  | readonly LocalAudioTrackInput[]

export type LocalAudioTrackGroup = {
  act: string
  cover?: string
  tracks: LocalAudioTrack[]
}

export type UseLocalAudioPlayerOptions = {
  tracks: LocalAudioTracksInput
  sourceBasePath?: string
  initialTrackId?: string
  initialVolume?: number
}

const DEFAULT_SOURCE_BASE_PATH = '/music'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeBasePath(basePath = DEFAULT_SOURCE_BASE_PATH) {
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function hasUnsafePathSegment(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('//') ||
    value.includes('..')
  )
}

function toLocalPath(value: string | undefined) {
  if (!value || hasUnsafePathSegment(value)) return undefined
  return value.startsWith('/') ? value : `/${value}`
}

function buildMusicPath(
  basePath: string,
  act: string,
  filename: string | undefined,
) {
  if (!filename || hasUnsafePathSegment(filename) || hasUnsafePathSegment(act)) {
    return undefined
  }

  return `${basePath}/${act}/${filename}`
}

function isCatalogInput(input: LocalAudioTracksInput): input is LocalAudioCatalog {
  return !Array.isArray(input)
}

function resolveInitialIndex(
  tracks: readonly LocalAudioTrack[],
  initialTrackId: string | undefined,
) {
  if (!tracks.length) return 0
  if (!initialTrackId) return 0

  const foundIndex = tracks.findIndex((track) => track.id === initialTrackId)
  return foundIndex >= 0 ? foundIndex : 0
}

function getRandomDifferentIndex(currentIndex: number, length: number) {
  if (length <= 1) return currentIndex

  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * length)
  }

  return nextIndex
}

function getForwardIndex(
  currentIndex: number,
  length: number,
  shuffle: boolean,
  repeatMode: LocalAudioRepeatMode,
  fromEnded: boolean,
) {
  if (length === 0) return 0
  if (repeatMode === 'one' && fromEnded) return currentIndex
  if (shuffle) return getRandomDifferentIndex(currentIndex, length)
  if (currentIndex < length - 1) return currentIndex + 1
  if (repeatMode === 'all' || !fromEnded) return 0
  return currentIndex
}

export function normalizeLocalAudioTracks(
  input: LocalAudioTracksInput,
  sourceBasePath = DEFAULT_SOURCE_BASE_PATH,
) {
  const basePath = normalizeBasePath(sourceBasePath)

  if (isCatalogInput(input)) {
    return Object.entries(input).flatMap(([act, actData]) => {
      const actCover = buildMusicPath(basePath, act, actData.cover)

      return actData.tracks.flatMap((track, index) => {
        const src = buildMusicPath(basePath, act, track.filename)
        if (!src) return []

        return [
          {
            id: `${act}:${track.filename}`,
            act,
            filename: track.filename,
            src,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration ?? 0,
            cover: actCover,
            trackNumber: index + 1,
          },
        ]
      })
    })
  }

  return input.flatMap((track, index) => {
    const act = track.act ?? 'MUSIC'
    const src =
      track.src && track.src.startsWith(`${basePath}/`)
        ? toLocalPath(track.src)
        : buildMusicPath(basePath, act, track.filename)

    if (!src) return []

    return [
      {
        id: track.id ?? `${act}:${track.filename ?? index}`,
        act,
        filename: track.filename,
        src,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration ?? 0,
        cover: toLocalPath(track.cover),
        trackNumber: track.trackNumber ?? index + 1,
      },
    ]
  })
}

export function groupLocalAudioTracks(tracks: readonly LocalAudioTrack[]) {
  const groups = new Map<string, LocalAudioTrackGroup>()

  tracks.forEach((track) => {
    const existingGroup = groups.get(track.act)
    if (existingGroup) {
      existingGroup.tracks.push(track)
      if (!existingGroup.cover && track.cover) existingGroup.cover = track.cover
      return
    }

    groups.set(track.act, {
      act: track.act,
      cover: track.cover,
      tracks: [track],
    })
  })

  return Array.from(groups.values())
}

export function formatLocalAudioTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function useLocalAudioPlayer({
  tracks: tracksInput,
  sourceBasePath,
  initialTrackId,
  initialVolume = 0.86,
}: UseLocalAudioPlayerOptions) {
  const tracks = useMemo(
    () => normalizeLocalAudioTracks(tracksInput, sourceBasePath),
    [sourceBasePath, tracksInput],
  )

  const [currentIndex, setCurrentIndex] = useState(() =>
    resolveInitialIndex(tracks, initialTrackId),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(tracks[currentIndex]?.duration ?? 0)
  const [volume, setVolumeState] = useState(() => clamp(initialVolume, 0, 1))
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<LocalAudioRepeatMode>('off')
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tracksRef = useRef(tracks)
  const currentIndexRef = useRef(currentIndex)
  const currentTimeRef = useRef(currentTime)
  const durationRef = useRef(duration)
  const isPlayingRef = useRef(isPlaying)
  const shuffleRef = useRef(shuffle)
  const repeatModeRef = useRef(repeatMode)
  const volumeRef = useRef(volume)
  const mutedRef = useRef(muted)

  const resolvedCurrentIndex = tracks.length
    ? clamp(currentIndex, 0, tracks.length - 1)
    : 0
  const currentTrack = tracks[resolvedCurrentIndex] ?? null
  const effectiveDuration = duration || currentTrack?.duration || 0
  const progress = effectiveDuration > 0 ? currentTime / effectiveDuration : 0

  const selectIndex = useCallback((nextIndex: number, playAfterSelect = true) => {
    const activeTracks = tracksRef.current
    if (!activeTracks.length) return

    const safeIndex = clamp(nextIndex, 0, activeTracks.length - 1)
    const audio = audioRef.current

    setPlaybackError(null)
    setCurrentIndex(safeIndex)
    setCurrentTime(0)
    setDuration(activeTracks[safeIndex]?.duration ?? 0)
    if (audio) audio.currentTime = 0
    if (playAfterSelect) setIsPlaying(true)
  }, [])

  const next = useCallback(
    (fromEnded = false) => {
      const activeTracks = tracksRef.current
      if (!activeTracks.length) return

      const nextIndex = getForwardIndex(
        currentIndexRef.current,
        activeTracks.length,
        shuffleRef.current,
        repeatModeRef.current,
        fromEnded,
      )

      const isNaturalEndWithoutRepeat =
        fromEnded &&
        nextIndex === currentIndexRef.current &&
        repeatModeRef.current === 'off' &&
        !shuffleRef.current

      if (isNaturalEndWithoutRepeat) {
        setIsPlaying(false)
        setCurrentTime(activeTracks[currentIndexRef.current]?.duration ?? 0)
        return
      }

      selectIndex(nextIndex, true)
    },
    [selectIndex],
  )

  const previous = useCallback(() => {
    const activeTracks = tracksRef.current
    if (!activeTracks.length) return

    if (currentTimeRef.current > 3) {
      const audio = audioRef.current
      if (audio) audio.currentTime = 0
      setCurrentTime(0)
      return
    }

    const previousIndex =
      currentIndexRef.current === 0
        ? activeTracks.length - 1
        : currentIndexRef.current - 1

    selectIndex(previousIndex, isPlayingRef.current)
  }, [selectIndex])

  const play = useCallback(() => {
    if (!tracksRef.current.length) return
    setPlaybackError(null)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (!tracksRef.current.length) return
    setPlaybackError(null)
    setIsPlaying((playing) => !playing)
  }, [])

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current
    const maxDuration =
      durationRef.current ||
      tracksRef.current[currentIndexRef.current]?.duration ||
      0
    const nextTime = clamp(seconds, 0, Math.max(0, maxDuration))

    if (audio) audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const seekToProgress = useCallback(
    (nextProgress: number) => {
      const maxDuration =
        durationRef.current ||
        tracksRef.current[currentIndexRef.current]?.duration ||
        0
      seekTo(clamp(nextProgress, 0, 1) * maxDuration)
    },
    [seekTo],
  )

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = clamp(nextVolume, 0, 1)
    setVolumeState(safeVolume)
    if (safeVolume > 0) setMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((isMuted) => !isMuted)
  }, [])

  const toggleShuffle = useCallback(() => {
    setShuffle((isShuffling) => !isShuffling)
  }, [])

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => {
      if (mode === 'off') return 'all'
      if (mode === 'all') return 'one'
      return 'off'
    })
  }, [])

  const selectTrack = useCallback(
    (trackId: string, playAfterSelect = true) => {
      const nextIndex = tracksRef.current.findIndex((track) => track.id === trackId)
      if (nextIndex >= 0) selectIndex(nextIndex, playAfterSelect)
    },
    [selectIndex],
  )

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    currentIndexRef.current = resolvedCurrentIndex
  }, [resolvedCurrentIndex])

  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    shuffleRef.current = shuffle
  }, [shuffle])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.volume = volumeRef.current
    audio.muted = mutedRef.current
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      next(true)
    }

    const handleError = () => {
      setIsPlaying(false)
      setPlaybackError("This track couldn't play. Try another.")
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audioRef.current = null
    }
  }, [next])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const nextSrc = new URL(currentTrack.src, window.location.href).href
    if (audio.src === nextSrc) return

    audio.src = nextSrc
    audio.currentTime = 0
    audio.load()
    setCurrentTime(0)
    setDuration(currentTrack.duration)
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.muted = muted
  }, [muted, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (!isPlaying) {
      audio.pause()
      return
    }

    audio.play().catch(() => {
      setIsPlaying(false)
      setPlaybackError('Playback was blocked by the browser. Try pressing play again.')
    })
  }, [currentTrack, isPlaying])

  const nextPreviewTrack = useMemo(() => {
    if (!tracks.length || !currentTrack) return null
    const nextIndex =
      resolvedCurrentIndex < tracks.length - 1
        ? resolvedCurrentIndex + 1
        : repeatMode === 'all'
          ? 0
          : -1

    return nextIndex >= 0 ? tracks[nextIndex] : null
  }, [resolvedCurrentIndex, currentTrack, repeatMode, tracks])

  const groups = useMemo(() => groupLocalAudioTracks(tracks), [tracks])

  return {
    tracks,
    groups,
    currentTrack,
    nextPreviewTrack,
    currentIndex: resolvedCurrentIndex,
    isPlaying,
    currentTime,
    duration: effectiveDuration,
    progress,
    volume,
    muted,
    shuffle,
    repeatMode,
    playbackError,
    canPlay: tracks.length > 0,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seekTo,
    seekToProgress,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    selectTrack,
  }
}

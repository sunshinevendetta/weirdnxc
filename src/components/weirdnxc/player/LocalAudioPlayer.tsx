'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  formatLocalAudioTime,
  type LocalAudioTrack,
  type LocalAudioTracksInput,
  useLocalAudioPlayer,
} from '@/hooks/useLocalAudioPlayer'
import styles from './LocalAudioPlayer.module.css'

export type LocalAudioPlayerProps = {
  tracks: LocalAudioTracksInput
  title?: string
  className?: string
  sourceBasePath?: string
  initialTrackId?: string
  initialVolume?: number
  defaultPlaylistOpen?: boolean
}

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function TrackArtwork({
  track,
  size,
  mini = false,
}: {
  track: LocalAudioTrack | null
  size: number
  mini?: boolean
}) {
  const label = track ? `${track.title} cover` : 'Album cover'

  return (
    <div className={mini ? styles.miniArt : styles.art}>
      {track?.cover ? (
        <Image
          alt={label}
          className={styles.artImage}
          fill
          sizes={`${size}px`}
          src={track.cover}
        />
      ) : (
        <div className={styles.fallbackArt} aria-hidden="true">
          {track?.act.slice(0, 3) ?? 'NXC'}
        </div>
      )}
    </div>
  )
}

export function LocalAudioPlayer({
  tracks,
  title = 'WEIRD NXC Player',
  className,
  sourceBasePath,
  initialTrackId,
  initialVolume,
  defaultPlaylistOpen = false,
}: LocalAudioPlayerProps) {
  const [playlistOpen, setPlaylistOpen] = useState(defaultPlaylistOpen)
  const player = useLocalAudioPlayer({
    tracks,
    sourceBasePath,
    initialTrackId,
    initialVolume,
  })

  const currentTrack = player.currentTrack
  const nextTrack = player.nextPreviewTrack
  const repeatLabel =
    player.repeatMode === 'off'
      ? 'Repeat off'
      : player.repeatMode === 'all'
        ? 'Repeat all'
        : 'Repeat one'

  return (
    <section className={joinClassNames(styles.root, className)} aria-label={title}>
      <div className={styles.shell}>
        {player.tracks.length === 0 ? (
          <div className={styles.empty}>No tracks are ready yet.</div>
        ) : (
          <>
            <div className={styles.topGrid}>
              <div className={styles.now}>
                <TrackArtwork track={currentTrack} size={88} />
                <div>
                  <div className={styles.eyebrow}>{currentTrack?.act ?? 'ACT'}</div>
                  <h2 className={styles.title}>{currentTrack?.title ?? title}</h2>
                  <div className={styles.meta}>
                    {currentTrack?.artist ?? 'Unknown artist'}
                    {currentTrack?.album ? ` / ${currentTrack.album}` : ''}
                  </div>
                </div>
              </div>

              <aside className={styles.nextPanel} aria-label="Now and next">
                <div className={styles.eyebrow}>Next</div>
                {nextTrack ? (
                  <div className={styles.nextTrack}>
                    <TrackArtwork track={nextTrack} size={46} mini />
                    <div>
                      <div className={styles.trackLine}>{nextTrack.title}</div>
                      <div className={styles.trackSubline}>
                        {nextTrack.artist} / {nextTrack.act}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.trackSubline}>End of playlist</div>
                )}
              </aside>
            </div>

            <div className={styles.progressRow}>
              <span className={styles.time}>
                {formatLocalAudioTime(player.currentTime)}
              </span>
              <input
                aria-label="Seek"
                className={styles.range}
                max={Math.max(player.duration, 0)}
                min={0}
                onChange={(event) => player.seekTo(Number(event.currentTarget.value))}
                step={1}
                type="range"
                value={Math.min(player.currentTime, player.duration)}
              />
              <span className={styles.time}>
                {formatLocalAudioTime(player.duration)}
              </span>
            </div>

            <div className={styles.controls}>
              <button
                className={styles.button}
                onClick={() => player.previous()}
                type="button"
              >
                Prev
              </button>
              <button
                className={joinClassNames(styles.button, styles.primaryButton)}
                onClick={player.togglePlay}
                type="button"
              >
                {player.isPlaying ? 'Pause' : 'Play'}
              </button>
              <button className={styles.button} onClick={() => player.next()} type="button">
                Next
              </button>
              <button
                aria-pressed={player.shuffle}
                className={styles.button}
                onClick={player.toggleShuffle}
                type="button"
              >
                Shuffle
              </button>
              <button
                aria-pressed={player.repeatMode !== 'off'}
                className={styles.button}
                onClick={player.cycleRepeatMode}
                title={repeatLabel}
                type="button"
              >
                {repeatLabel}
              </button>
              <button
                aria-expanded={playlistOpen}
                className={styles.button}
                onClick={() => setPlaylistOpen((isOpen) => !isOpen)}
                type="button"
              >
                Playlist
              </button>

              <div className={styles.volumeRow}>
                <button
                  aria-pressed={player.muted}
                  className={styles.button}
                  onClick={player.toggleMute}
                  type="button"
                >
                  {player.muted ? 'Muted' : 'Volume'}
                </button>
                <input
                  aria-label="Volume"
                  className={styles.range}
                  max={1}
                  min={0}
                  onChange={(event) => player.setVolume(Number(event.currentTarget.value))}
                  step={0.01}
                  type="range"
                  value={player.muted ? 0 : player.volume}
                />
              </div>
            </div>

            {player.playbackError ? (
              <div className={styles.error} role="status">
                {player.playbackError}
              </div>
            ) : null}
          </>
        )}
      </div>

      {playlistOpen && player.tracks.length > 0 ? (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <h3 className={styles.drawerTitle}>Playlist</h3>
            <button
              className={styles.button}
              onClick={() => setPlaylistOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          {player.groups.map((group) => (
            <div className={styles.group} key={group.act}>
              <div className={styles.groupTitle}>{group.act}</div>
              {group.tracks.map((track) => {
                const active = track.id === currentTrack?.id

                return (
                  <button
                    className={joinClassNames(
                      styles.trackButton,
                      active && styles.trackButtonActive,
                    )}
                    key={track.id}
                    onClick={() => player.selectTrack(track.id, true)}
                    type="button"
                  >
                    <span className={styles.trackNumber}>
                      {String(track.trackNumber).padStart(2, '0')}
                    </span>
                    <span>
                      <span className={styles.trackLine}>{track.title}</span>
                      <span className={styles.trackSubline}>{track.artist}</span>
                    </span>
                    <span className={styles.time}>
                      {formatLocalAudioTime(track.duration)}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

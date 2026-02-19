import { useRef, useEffect, useCallback } from 'react';

export default function Player({ streamData, title, thumbnail, audioOnly }) {
  if (!streamData) return null;

  if (audioOnly) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <audio
          key={streamData.audioUrl}
          src={streamData.audioUrl}
          controls
          style={{ width: '100%' }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {title && (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>
          {title}
        </div>
      )}
      <SyncedVideo
        videoUrl={streamData.videoUrl}
        audioUrl={streamData.audioUrl}
        title={title}
      />
    </div>
  );
}

/**
 * Audio-driven synced playback.
 * The <audio> element is the source of truth — browsers never throttle audio
 * in background tabs. The <video> simply follows the audio's state.
 * User interacts with the video controls; those events are forwarded to audio.
 * Audio drives the actual playback clock.
 */
function SyncedVideo({ videoUrl, audioUrl, title }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'YouTube Tool',
        artist: 'YouTube Tool',
      });
      navigator.mediaSession.setActionHandler('play', () => { audio.play(); });
      navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); });
    }

    // --- User interacts with video controls → forward to audio ---

    const onVideoPlay = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      audio.currentTime = video.currentTime;
      audio.play().catch(() => {});
      isSyncingRef.current = false;
    };

    const onVideoPause = () => {
      if (isSyncingRef.current) return;
      // Only pause audio if the tab is visible (user-initiated).
      // If hidden, the browser is throttling the video — ignore it.
      if (document.visibilityState === 'visible') {
        isSyncingRef.current = true;
        audio.pause();
        isSyncingRef.current = false;
      }
    };

    const onVideoSeeked = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      audio.currentTime = video.currentTime;
      isSyncingRef.current = false;
    };

    const onVideoRateChange = () => {
      audio.playbackRate = video.playbackRate;
    };

    const onVideoVolumeChange = () => {
      audio.volume = video.volume;
      audio.muted = video.muted;
    };

    // --- Audio drives video position ---

    const onAudioTimeUpdate = () => {
      if (isSyncingRef.current) return;
      if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
        video.currentTime = audio.currentTime;
      }
    };

    const onAudioPlay = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      if (video.paused) video.play().catch(() => {});
      isSyncingRef.current = false;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const onAudioPause = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      if (!video.paused) video.pause();
      isSyncingRef.current = false;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    // --- Re-sync video when tab becomes visible again ---

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !audio.paused) {
        video.currentTime = audio.currentTime;
        if (video.paused) video.play().catch(() => {});
      }
    };

    video.addEventListener('play', onVideoPlay);
    video.addEventListener('pause', onVideoPause);
    video.addEventListener('seeked', onVideoSeeked);
    video.addEventListener('ratechange', onVideoRateChange);
    video.addEventListener('volumechange', onVideoVolumeChange);

    audio.addEventListener('timeupdate', onAudioTimeUpdate);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      video.removeEventListener('play', onVideoPlay);
      video.removeEventListener('pause', onVideoPause);
      video.removeEventListener('seeked', onVideoSeeked);
      video.removeEventListener('ratechange', onVideoRateChange);
      video.removeEventListener('volumechange', onVideoVolumeChange);

      audio.removeEventListener('timeupdate', onAudioTimeUpdate);
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('pause', onAudioPause);

      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [videoUrl, audioUrl, title]);

  return (
    <>
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        controls
        style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
      />
      <audio ref={audioRef} key={audioUrl} src={audioUrl} preload="auto" />
    </>
  );
}

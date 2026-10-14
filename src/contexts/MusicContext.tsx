import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  isMobile: boolean;
  volume: number;
  isRevealed: boolean;
  autoplayBlocked: boolean;
  trackTitle: string;
  artistTitle: string;
  notifyReveal: () => void;
  togglePlay: () => void;
  playMusic: () => void;
  stopMusic: () => void;
  toggleMute: () => void;
  changeVolume: (vol: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Primary audio path (new full 4.9MB track)
const AUDIO_TRACK_URL =
  '/audio/non-stop-mandli-garba-2025-latest-gujarati-navratri-garba-sangeet-music_mZBJVAYG.mp3';

const checkIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState<boolean>(checkIsMobile);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Default unmuted on load
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userManuallyStoppedRef = useRef<boolean>(false);
  const targetVolumeRef = useRef<number>(0.8);
  const fadeIntervalRef = useRef<number | null>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth audio volume fade in
  const startSmoothFadeIn = useCallback((targetVol: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
    }

    audio.volume = 0.1;
    const step = (targetVol - 0.1) / 10;
    let current = 0.1;

    fadeIntervalRef.current = window.setInterval(() => {
      current += step;
      if (current >= targetVol) {
        audio.volume = targetVol;
        if (fadeIntervalRef.current) {
          window.clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      } else {
        audio.volume = Math.max(0, Math.min(1, current));
      }
    }, 60);
  }, []);

  // Play audio unmuted automatically across all devices including mobile
  const internalPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // By default unmuted everywhere (desktop and mobile)
    audio.muted = false;
    setIsMuted(false);
    audio.volume = targetVolumeRef.current;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setAutoplayBlocked(false);
        startSmoothFadeIn(targetVolumeRef.current);
      })
      .catch((err) => {
        console.log(
          '[Music] Mobile/browser autoplay policy prevented instant unmuted sound. Attaching mobile touch unlock:',
          err
        );
        setAutoplayBlocked(true);

        // Preload/buffer in background so audio begins instantly on user's first touch
        try {
          audio.muted = true;
          audio.play().catch(() => {});
        } catch {}

        // Fallback: unlock and un-mute audio on user's first touch/tap anywhere on screen
        const unlockAudioOnGesture = () => {
          if (userManuallyStoppedRef.current) {
            cleanupGestureListeners();
            return;
          }

          if (audioRef.current) {
            const currentAudio = audioRef.current;
            currentAudio.muted = false;
            currentAudio.volume = targetVolumeRef.current;

            currentAudio
              .play()
              .then(() => {
                setIsPlaying(true);
                setIsMuted(false);
                setAutoplayBlocked(false);
                startSmoothFadeIn(targetVolumeRef.current);
                cleanupGestureListeners();
              })
              .catch((playErr) => {
                console.log('[Music] Awaiting qualifying touch interaction:', playErr);
              });
          }
        };

        const cleanupGestureListeners = () => {
          const targets = [window, document, document.body];
          const events = [
            'touchstart',
            'touchend',
            'pointerdown',
            'pointerup',
            'click',
            'keydown',
          ];
          targets.forEach((target) => {
            if (!target) return;
            events.forEach((evt) => {
              target.removeEventListener(evt, unlockAudioOnGesture);
            });
          });
        };

        const targets = [window, document, document.body];
        const events = [
          'touchstart',
          'touchend',
          'pointerdown',
          'pointerup',
          'click',
          'keydown',
        ];
        targets.forEach((target) => {
          if (!target) return;
          events.forEach((evt) => {
            target.addEventListener(evt, unlockAudioOnGesture, { passive: true });
          });
        });
      });
  }, [startSmoothFadeIn]);

  // Initialize and play unmuted on page load
  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_TRACK_URL;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = targetVolumeRef.current;
    audio.muted = false;

    audio.onplay = () => {
      setIsPlaying(true);
      setIsMuted(false);
    };
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    // Start playing unmuted automatically on page load!
    internalPlay();

    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [internalPlay]);

  // Stop music manually anytime
  const stopMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    userManuallyStoppedRef.current = true;
    audio.pause();
    setIsPlaying(false);
    setAutoplayBlocked(false);
  }, []);

  // Play music manually anytime
  const playMusic = useCallback(() => {
    userManuallyStoppedRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.muted = false;
      setIsMuted(false);
      audio.volume = targetVolumeRef.current;
    }
    internalPlay();
  }, [internalPlay]);

  // 1-tap toggle in navbar
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else {
      playMusic();
    }
  }, [isPlaying, stopMusic, playMusic]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !isMuted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && !isPlaying) {
      playMusic();
    }
  }, [isMuted, isPlaying, playMusic]);

  const changeVolume = useCallback((newVol: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    targetVolumeRef.current = clamped;
    setVolumeState(clamped);

    if (audio) {
      audio.volume = clamped;
      if (clamped > 0 && audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      }
    }
  }, []);

  // When landing page reveals after loader countdown
  const notifyReveal = useCallback(() => {
    setIsRevealed(true);
    if (!userManuallyStoppedRef.current && !isPlaying) {
      internalPlay();
    }
  }, [internalPlay, isPlaying]);

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        isMuted,
        isMobile,
        volume,
        isRevealed,
        autoplayBlocked,
        trackTitle: 'Non-Stop Mandli Garba',
        artistTitle: 'Navratri Garba Sangeet 2025',
        notifyReveal,
        togglePlay,
        playMusic,
        stopMusic,
        toggleMute,
        changeVolume,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

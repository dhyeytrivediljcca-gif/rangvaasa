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
  const [isMuted, setIsMuted] = useState<boolean>(() => checkIsMobile());
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userManuallyStoppedRef = useRef<boolean>(false);
  const targetVolumeRef = useRef<number>(0.75);
  const fadeIntervalRef = useRef<number | null>(null);

  // Resize listener to track mobile screen status
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

    audio.volume = 0.05;
    const step = (targetVol - 0.05) / 15;
    let current = 0.05;

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
    }, 80);
  }, []);

  // Helper to start playback
  const internalPlay = useCallback(
    (forceUnmute = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      const mobile = checkIsMobile();

      if (forceUnmute || !mobile) {
        audio.muted = false;
        setIsMuted(false);
      } else {
        // Mobile starts MUTED by default
        audio.muted = true;
        setIsMuted(true);
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          if (!audio.muted) {
            startSmoothFadeIn(targetVolumeRef.current);
          }
        })
        .catch(() => {
          setAutoplayBlocked(true);

          // On mobile or blocked desktop, attach one-time unlock listener
          const unlockOnGesture = () => {
            if (!userManuallyStoppedRef.current && audioRef.current) {
              const currentMob = checkIsMobile();
              if (currentMob) {
                audioRef.current.muted = true;
                setIsMuted(true);
              }
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setAutoplayBlocked(false);
                })
                .catch(() => null);
            }
            cleanup();
          };

          const cleanup = () => {
            window.removeEventListener('click', unlockOnGesture);
            window.removeEventListener('touchstart', unlockOnGesture);
            window.removeEventListener('keydown', unlockOnGesture);
          };

          window.addEventListener('click', unlockOnGesture, { once: true, passive: true });
          window.addEventListener('touchstart', unlockOnGesture, { once: true, passive: true });
          window.addEventListener('keydown', unlockOnGesture, { once: true, passive: true });
        });
    },
    [startSmoothFadeIn]
  );

  // Initialize audio on mount
  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_TRACK_URL;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = targetVolumeRef.current;

    const mobile = checkIsMobile();
    if (mobile) {
      // Mobile device: by default mute!
      audio.muted = true;
      setIsMuted(true);
    } else {
      audio.muted = false;
      setIsMuted(false);
    }

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    // Start playback by default (muted on mobile, audible on desktop)
    internalPlay(false);

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
    audio.muted = true;
    setIsPlaying(false);
    setIsMuted(true);
    setAutoplayBlocked(false);
  }, []);

  // Play and un-mute music manually
  const playMusic = useCallback(() => {
    userManuallyStoppedRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.muted = false;
      setIsMuted(false);
      audio.volume = targetVolumeRef.current;
    }
    internalPlay(true);
  }, [internalPlay]);

  // Seamless 1-tap toggle (plays & un-mutes if off, mutes & pauses if on)
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && !isMuted) {
      // Sound is actively playing -> Stop/Mute it
      stopMusic();
    } else {
      // Muted or stopped -> Unmute and Play!
      playMusic();
    }
  }, [isPlaying, isMuted, stopMusic, playMusic]);

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

  const notifyReveal = useCallback(() => {
    setIsRevealed(true);
    if (!userManuallyStoppedRef.current && !isPlaying) {
      internalPlay(false);
    }
  }, [internalPlay, isPlaying]);

  return (
    <MusicContext.Provider
      value={{
        isPlaying: isPlaying && !isMuted,
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

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

// Primary audio path
const AUDIO_TRACK_URL =
  '/audio/non-stop-mandli-garba-2025-latest-gujarati-navratri-garba-sangeet-music_mZBJVAYG.mp3';

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userManuallyStoppedRef = useRef<boolean>(false);
  const targetVolumeRef = useRef<number>(0.75);
  const fadeIntervalRef = useRef<number | null>(null);

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

  // Internal helper to start playing
  const internalPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
        startSmoothFadeIn(targetVolumeRef.current);
      })
      .catch((err) => {
        console.log('[MusicPlayer] Browser autoplay policy prevented instant audio:', err);
        setAutoplayBlocked(true);

        // Fallback: unlock audio on ANY user gesture anywhere on window/document
        const unlockAudioOnGesture = () => {
          if (!userManuallyStoppedRef.current && audioRef.current) {
            audioRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
                startSmoothFadeIn(targetVolumeRef.current);
              })
              .catch(console.warn);
          }
          cleanupGestureListeners();
        };

        const cleanupGestureListeners = () => {
          window.removeEventListener('click', unlockAudioOnGesture);
          window.removeEventListener('pointerdown', unlockAudioOnGesture);
          window.removeEventListener('touchstart', unlockAudioOnGesture);
          window.removeEventListener('keydown', unlockAudioOnGesture);
          window.removeEventListener('scroll', unlockAudioOnGesture);
          window.removeEventListener('wheel', unlockAudioOnGesture);
        };

        window.addEventListener('click', unlockAudioOnGesture, { once: true, passive: true });
        window.addEventListener('pointerdown', unlockAudioOnGesture, { once: true, passive: true });
        window.addEventListener('touchstart', unlockAudioOnGesture, { once: true, passive: true });
        window.addEventListener('keydown', unlockAudioOnGesture, { once: true, passive: true });
        window.addEventListener('scroll', unlockAudioOnGesture, { once: true, passive: true });
        window.addEventListener('wheel', unlockAudioOnGesture, { once: true, passive: true });
      });
  }, [startSmoothFadeIn]);

  // Initialize audio and start playback by default when website is opened
  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_TRACK_URL;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = targetVolumeRef.current;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    // Start playing music by default when website opens!
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
    internalPlay();
  }, [internalPlay]);

  // Toggle play/stop anytime
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
  }, [isMuted]);

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

  // Landing page reveal trigger (if not already playing and not manually stopped)
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

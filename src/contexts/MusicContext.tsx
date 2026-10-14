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
  pauseMusic: () => void;
  toggleMute: () => void;
  changeVolume: (vol: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Primary audio path
const AUDIO_TRACK_URL =
  '/audio/non-stop-mandli-garba-2025-latest-gujarati-navratri-garba-sangeet-music_Uv21Son8.mp3';

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
  const userOptedOutRef = useRef<boolean>(false);
  const targetVolumeRef = useRef<number>(0.75);
  const fadeIntervalRef = useRef<number | null>(null);

  // Initialize audio element once
  useEffect(() => {
    // Check saved user preference if any
    const savedPref = localStorage.getItem('rangvaasa_music_enabled');
    if (savedPref === 'false') {
      userOptedOutRef.current = true;
    }

    const savedVolume = localStorage.getItem('rangvaasa_music_volume');
    if (savedVolume !== null) {
      const v = parseFloat(savedVolume);
      if (!isNaN(v) && v >= 0 && v <= 1) {
        targetVolumeRef.current = v;
        setVolumeState(v);
      }
    }

    const audio = new Audio();
    audio.src = AUDIO_TRACK_URL;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = targetVolumeRef.current;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Smooth audio fade in
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

  // Safe Play trigger with browser autoplay handling
  const playMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    userOptedOutRef.current = false;
    localStorage.setItem('rangvaasa_music_enabled', 'true');

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        console.log('[MusicPlayer] Play request prevented by browser policy:', err);
        setAutoplayBlocked(true);

        // Attach one-time global listeners for user's next gesture
        const handleGesture = () => {
          if (!userOptedOutRef.current && audioRef.current) {
            audioRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
              })
              .catch(console.warn);
          }
          cleanupGestureListeners();
        };

        const cleanupGestureListeners = () => {
          window.removeEventListener('click', handleGesture);
          window.removeEventListener('touchstart', handleGesture);
          window.removeEventListener('keydown', handleGesture);
          window.removeEventListener('scroll', handleGesture);
        };

        window.addEventListener('click', handleGesture, { once: true, passive: true });
        window.addEventListener('touchstart', handleGesture, { once: true, passive: true });
        window.addEventListener('keydown', handleGesture, { once: true, passive: true });
        window.addEventListener('scroll', handleGesture, { once: true, passive: true });
      });
  }, []);

  const pauseMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    userOptedOutRef.current = true;
    localStorage.setItem('rangvaasa_music_enabled', 'false');
    audio.pause();
    setIsPlaying(false);
    setAutoplayBlocked(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isPlaying, playMusic, pauseMusic]);

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
    localStorage.setItem('rangvaasa_music_volume', clamped.toString());

    if (audio) {
      audio.volume = clamped;
      if (clamped > 0 && audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      }
    }
  }, []);

  // Called when landing page reveals (after loader finishes)
  const notifyReveal = useCallback(() => {
    setIsRevealed(true);

    // If user has not explicitly disabled music in past, start playing on reveal!
    if (!userOptedOutRef.current && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          startSmoothFadeIn(targetVolumeRef.current);
        })
        .catch((err) => {
          // Autoplay policy blocked; mark as blocked so gesture trigger takes over
          console.log('[MusicPlayer] Reveal autoplay blocked by browser policy:', err);
          setAutoplayBlocked(true);

          const unlockOnGesture = () => {
            if (!userOptedOutRef.current && audioRef.current) {
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setAutoplayBlocked(false);
                  startSmoothFadeIn(targetVolumeRef.current);
                })
                .catch(console.warn);
            }
            window.removeEventListener('click', unlockOnGesture);
            window.removeEventListener('touchstart', unlockOnGesture);
            window.removeEventListener('keydown', unlockOnGesture);
            window.removeEventListener('scroll', unlockOnGesture);
          };

          window.addEventListener('click', unlockOnGesture, { once: true, passive: true });
          window.addEventListener('touchstart', unlockOnGesture, { once: true, passive: true });
          window.addEventListener('keydown', unlockOnGesture, { once: true, passive: true });
          window.addEventListener('scroll', unlockOnGesture, { once: true, passive: true });
        });
    }
  }, [startSmoothFadeIn]);

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
        pauseMusic,
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

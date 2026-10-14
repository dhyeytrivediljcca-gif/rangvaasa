import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Disc3,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import './MusicPlayer.css';

export const MusicPlayer: React.FC = () => {
  const {
    isPlaying,
    isMuted,
    volume,
    autoplayBlocked,
    trackTitle,
    artistTitle,
    togglePlay,
    playMusic,
    toggleMute,
    changeVolume,
  } = useMusic();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      className="music-player-fixed"
      role="region"
      aria-label="Festive Garba Music Player"
    >
      {/* Autoplay Notice Pill (appears if browser policy prevented automatic playback) */}
      <AnimatePresence>
        {autoplayBlocked && !isPlaying && (
          <motion.button
            type="button"
            className="music-autoplay-notice"
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={playMusic}
            title="Click to start festive background music"
          >
            <Sparkles size={14} className="music-notice-sparkle" />
            <span>Tap to play Garba music</span>
            <span className="music-notice-badge">▶</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Floating Pill / Widget */}
      <motion.div
        className={`music-player-pill ${isPlaying ? 'music-player-pill--playing' : ''} ${
          isExpanded ? 'music-player-pill--expanded' : ''
        }`}
        layout
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Vinyl / Dhol Spinning Icon Badge */}
        <button
          type="button"
          onClick={togglePlay}
          className="music-disc-btn"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          title={isPlaying ? 'Music ON (Click to turn off)' : 'Music OFF (Click to turn on)'}
        >
          <div className={`music-disc-wrap ${isPlaying ? 'music-disc--spinning' : ''}`}>
            <Disc3 size={24} className="music-disc-icon" />
            <div className="music-disc-center" />
          </div>

          <span className="music-play-overlay">
            {isPlaying ? <Pause size={12} /> : <Play size={12} className="music-play-arrow" />}
          </span>
        </button>

        {/* Track & Equalizer Summary Info */}
        <div className="music-info-group" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="music-title-row">
            <span className="music-badge-status">
              {isPlaying ? (
                <>
                  <span className="music-dot-pulse" />
                  MUSIC ON
                </>
              ) : (
                'MUSIC OFF'
              )}
            </span>
            <span className="music-track-name">{trackTitle}</span>
          </div>

          {/* Sonic Equalizer Bars */}
          <div className="music-equalizer" aria-hidden="true">
            <span className={`music-bar music-bar--1 ${isPlaying ? 'active' : ''}`} />
            <span className={`music-bar music-bar--2 ${isPlaying ? 'active' : ''}`} />
            <span className={`music-bar music-bar--3 ${isPlaying ? 'active' : ''}`} />
            <span className={`music-bar music-bar--4 ${isPlaying ? 'active' : ''}`} />
          </div>
        </div>

        {/* Controls Toggle (Expand Volume / Settings) */}
        <button
          type="button"
          className="music-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Close volume settings' : 'Open volume settings'}
          title="Audio Settings"
        >
          {isExpanded ? <ChevronDown size={16} /> : <SlidersHorizontal size={15} />}
        </button>
      </motion.div>

      {/* Expanded Audio Drawer (Volume & Mute) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="music-drawer"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="music-drawer-header">
              <span className="music-drawer-tag font-display">RANGVAASA 2026 SOUNDTRACK</span>
              <span className="music-drawer-artist">{artistTitle}</span>
            </div>

            <div className="music-drawer-controls">
              {/* Primary ON/OFF toggle switch */}
              <div className="music-toggle-row">
                <span className="music-toggle-label">Garba Music</span>
                <button
                  type="button"
                  className={`music-switch ${isPlaying ? 'music-switch--on' : ''}`}
                  onClick={togglePlay}
                  role="switch"
                  aria-checked={isPlaying}
                >
                  <span className="music-switch-handle" />
                </button>
              </div>

              {/* Volume Slider & Mute button */}
              <div className="music-volume-row">
                <button
                  type="button"
                  className="music-mute-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="music-slider"
                  aria-label="Volume slider"
                />

                <span className="music-volume-pct">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicPlayer;

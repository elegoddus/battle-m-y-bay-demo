'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronRight, RefreshCw, Image, Sparkles } from 'lucide-react';

interface Sheep {
  url: string;
  keyword: string;
}

export default function Home() {
  const [currentSheep, setCurrentSheep] = useState<Sheep | null>(null);
  const [history, setHistory] = useState<Sheep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [mode, setMode] = useState<1 | 2>(1); // Mode 1: Static, Mode 2: Jumping Animation
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; speedClass: string; delay: string }[]>([]);
  const [activeSheepUrl, setActiveSheepUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (currentSheep) {
      setImageLoaded(false);
      setActiveSheepUrl(currentSheep.url);
    }
  }, [currentSheep]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background sleep music
  useEffect(() => {
    const audio = new Audio('/sleep_music.mp3');
    audio.loop = true;
    audio.volume = 0.05; // Soft, ambient sleep volume
    bgMusicRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  // Manage background music playback based on play/pause and mute/unmute states
  useEffect(() => {
    const bgMusic = bgMusicRef.current;
    if (!bgMusic) return;

    if (!isMuted && !isPaused) {
      bgMusic.play().catch(e => console.log('Background music autoplay block:', e));
    } else {
      bgMusic.pause();
    }
  }, [isMuted, isPaused]);

  // Generate random stars on client mount
  useEffect(() => {
    const starList = Array.from({ length: 40 }).map((_, i) => {
      const sizeRandom = Math.random();
      const size = sizeRandom < 0.6 ? 'star-sm' : sizeRandom < 0.9 ? 'star-md' : 'star-lg';
      
      const speedRandom = Math.random();
      const speedClass = speedRandom < 0.33 ? 'animate-twinkle-1' : speedRandom < 0.66 ? 'animate-twinkle-2' : 'animate-twinkle-3';
      
      return {
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size,
        speedClass,
        delay: `${(Math.random() * 5).toFixed(1)}s`
      };
    });
    setStars(starList);
  }, []);

  // Play real sheep bleat sound (cut off at 4 seconds) with 10 random presets across 4 distinct audio files
  const playSheepSound = () => {
    if (isMuted) return;
    try {
      // Prevent overlapping sounds by stopping the previous one instantly
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }

      // 10 distinct sound presets using 4 different audio files and pitch shifts
      // 5 of these are high-pitched baby lamb sounds (pitch > 1.35 or using the natural baby lamb file)
      const soundPresets = [
        // 5 Baby Lamb sounds:
        { name: 'Baby Lamb 1', file: '/sheep_baa_2.mp3', pitch: 1.05 }, // Natural baby lamb
        { name: 'Baby Lamb 2', file: '/sheep_baa_2.mp3', pitch: 1.25 }, // Natural baby lamb high
        { name: 'Baby Lamb 3', file: '/sheep_baa_2.mp3', pitch: 0.92 }, // Natural baby lamb low
        { name: 'Baby Lamb 4', file: '/sheep_baa.mp3',   pitch: 1.55 }, // Standard baa shifted to lamb
        { name: 'Baby Lamb 5', file: '/sheep_baa_3.mp3',   pitch: 1.38 }, // "Meh" shifted to lamb
        
        // 5 Older Sheep sounds:
        { name: 'Young Sheep 1', file: '/sheep_baa.mp3',   pitch: 1.18 }, // Standard baa shifted slightly higher
        { name: 'Young Sheep 2', file: '/sheep_baa_3.mp3',   pitch: 1.00 }, // Natural "Meh" standard
        { name: 'Adult Sheep 1', file: '/sheep_baa.mp3',   pitch: 1.00 }, // Original adult baa standard
        { name: 'Adult Sheep 2', file: '/sheep_baa_4.mp3',   pitch: 1.00 }, // Long adult bleat standard
        { name: 'Deep Ram',      file: '/sheep_baa_4.mp3',   pitch: 0.80 }  // Long adult bleat shifted lower
      ];

      // Pick a preset randomly
      const selectedPreset = soundPresets[Math.floor(Math.random() * soundPresets.length)];

      const audio = new Audio(selectedPreset.file);
      
      // Set volume slightly lower for higher pitches to keep them cozy and non-piercing
      audio.volume = selectedPreset.pitch > 1.30 ? 0.20 : 0.26;
      
      // Configure playback rate before playing
      audio.defaultPlaybackRate = selectedPreset.pitch;
      audio.playbackRate = selectedPreset.pitch;
      
      audioRef.current = audio;
      audio.play().catch(e => console.log('Audio autoplay block:', e));
      
      // Stop after 4 seconds max
      audioTimeoutRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 4000);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const fetchNextSheep = async (isManual = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheep', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const nextSheep: Sheep = {
          url: data.url,
          keyword: data.keyword
        };
        
        setCurrentSheep(nextSheep);
        
        // Add to history if unique
        setHistory(prev => {
          if (prev.some(item => item.url === nextSheep.url)) return prev;
          return [nextSheep, ...prev].slice(0, 20); // limit history to 20 items for sizing
        });

        // Trigger sheep sound
        if (!isManual) {
          playSheepSound();
        }
      }
    } catch (error) {
      console.error('Failed to load sheep:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNextSheep();
  }, []);

  // Interval-based automatic rotation
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!isPaused) {
      const intervalDuration = mode === 2 ? 5000 : 4500; // Mode 2 requires 5 seconds as requested
      timerRef.current = setInterval(() => {
        fetchNextSheep();
      }, intervalDuration);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, isMuted, mode]);

  const handleManualSkip = () => {
    playSheepSound();
    fetchNextSheep(true);
  };

  const selectFromHistory = (sheep: Sheep) => {
    playSheepSound();
    setCurrentSheep(sheep);
    setIsPaused(true);
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center p-4 md:p-6 h-screen max-h-screen min-h-screen relative overflow-hidden select-none">
      
      {/* Background Twinkling Sky */}
      <div className="dream-sky">
        {stars.map(star => (
          <div
            key={star.id}
            className={`star ${star.size} ${star.speedClass}`}
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay
            }}
          />
        ))}
      </div>

      {/* Floating Translucent Ambient Clouds */}
      <div className="absolute top-[10%] left-[-20%] w-64 h-16 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none animate-drift-slow" />
      <div className="absolute top-[50%] left-[-30%] w-96 h-24 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none animate-drift-fast" />

      {/* 1. Header with the SINGLE text label "counting shleep" */}
      <header className="w-full flex justify-between items-center max-w-sm z-20 mt-2">
        <h1 className="text-lg md:text-xl font-bold tracking-[0.25em] text-indigo-200/90 select-none drop-shadow-[0_0_10px_rgba(165,180,252,0.35)] animate-float">
          counting shleep
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(prev => prev === 1 ? 2 : 1)}
            className={`p-2 rounded-full border ${mode === 2 ? 'border-indigo-400 text-indigo-200 bg-indigo-900/30' : 'border-indigo-500/15 text-indigo-300/80'} hover:border-indigo-400/35 bg-indigo-950/20 backdrop-blur-md hover:text-indigo-200 hover:scale-105 active:scale-95 transition-all duration-300`}
          >
            {mode === 1 ? <Sparkles className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-full border border-indigo-500/15 hover:border-indigo-400/35 bg-indigo-950/20 backdrop-blur-md text-indigo-300/80 hover:text-indigo-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-2 rounded-full border border-indigo-500/15 hover:border-indigo-400/35 bg-indigo-950/20 backdrop-blur-md text-indigo-300/80 hover:text-indigo-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* 2. Main Sheep Display Area (Resized smaller, aspect-square for layout compactness) */}
      <main className="flex-1 flex flex-col justify-center items-center w-full z-20 my-2">
        <div 
          onClick={handleManualSkip}
          className={`relative rounded-2xl overflow-hidden border border-indigo-500/15 bg-indigo-950/10 backdrop-blur-sm shadow-[0_0_40px_rgba(99,102,241,0.08)] hover:shadow-[0_0_50px_rgba(165,180,252,0.12)] hover:border-indigo-400/30 transition-all duration-500 group cursor-pointer ${
            mode === 2 ? 'jumping-container-box' : 'main-img-box'
          }`}
        >
          {mode === 1 ? (
            // Mode 1: Static Image View
            <>
              {currentSheep ? (
                <img
                  src={currentSheep.url}
                  alt="sheep"
                  className={`w-full h-full object-cover select-none transition-all duration-700 ease-in-out ${
                    loading ? 'scale-105 blur-sm opacity-80' : 'scale-100 blur-0 opacity-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center bg-indigo-950/10">
                  <RefreshCw className="w-6 h-6 text-indigo-400/30 animate-spin" />
                </div>
              )}
              {/* Vignette edge blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            // Mode 2: Jumping Animation View
            <div className="relative w-full h-full bg-indigo-950/10 overflow-hidden flex flex-col justify-end">
              {/* Ground layer */}
              <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-emerald-950/40 to-transparent border-t border-emerald-900/10" />
              
              {/* Minecraft Fence in the middle */}
              <img src="/minecraft_fence.png" alt="fence" className="minecraft-fence-img select-none" />
              
              {/* Jumping Cartoon Sheep */}
              {activeSheepUrl ? (
                <img
                  key={activeSheepUrl} // Reset animation key to restart the 5-second jump on sheep change
                  src={activeSheepUrl}
                  alt="jumping sheep"
                  onLoad={() => setImageLoaded(true)}
                  className={`jumping-sheep-img rounded-xl border border-indigo-400/20 shadow-md select-none transition-opacity duration-300 ${
                    imageLoaded ? 'animate-sheep-jump opacity-100' : 'opacity-0'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center">
                  <RefreshCw className="w-6 h-6 text-indigo-400/30 animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Quick spinner indicator */}
          <div className="absolute top-2 right-2 z-20">
            {loading && currentSheep && (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
            )}
          </div>

          {/* Visual hover skip icon */}
          <div className="absolute inset-0 bg-indigo-950/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <div className="p-3 rounded-full bg-indigo-900/40 border border-indigo-300/20 text-indigo-200 scale-90 group-hover:scale-100 transition-transform duration-300 shadow-md">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </main>

      {/* 3. Compact History Bar (No text labels) */}
      <footer className="w-full max-w-sm z-20 mb-2">
        {history.length > 0 && (
          <div className="w-full bg-indigo-950/10 backdrop-blur-md border border-indigo-500/10 rounded-xl p-2.5 shadow-lg">
            <div className="flex gap-2.5 overflow-x-auto custom-scrollbar py-0.5">
              {history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => selectFromHistory(item)}
                  className={`flex-shrink-0 history-thumb-box rounded-lg overflow-hidden border cursor-pointer transition-all duration-300 hover:scale-105 ${
                    currentSheep?.url === item.url
                      ? 'border-indigo-400/80 shadow-[0_0_8px_rgba(165,180,252,0.3)] scale-102 opacity-100'
                      : 'border-transparent opacity-45 hover:opacity-85'
                  }`}
                >
                  <img
                    src={item.url}
                    alt="history sheep"
                    className="history-thumb-img select-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </footer>

    </div>
  );
}

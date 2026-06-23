'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronRight, RefreshCw } from 'lucide-react';

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
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; speedClass: string; delay: string }[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Web Audio chime note
  const playCozyChime = () => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
      const randomFrequency = notes[Math.floor(Math.random() * notes.length)];
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomFrequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {
      console.warn('Audio Context block/error:', e);
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

        // Trigger chime
        if (!isManual) {
          playCozyChime();
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
      timerRef.current = setInterval(() => {
        fetchNextSheep();
      }, 4500);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, isMuted]);

  const handleManualSkip = () => {
    playCozyChime();
    fetchNextSheep(true);
  };

  const selectFromHistory = (sheep: Sheep) => {
    playCozyChime();
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
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-xs z-20 my-2">
        <div 
          onClick={handleManualSkip}
          className="relative main-img-box rounded-2xl overflow-hidden border border-indigo-500/15 bg-indigo-950/10 backdrop-blur-sm shadow-[0_0_40px_rgba(99,102,241,0.08)] hover:shadow-[0_0_50px_rgba(165,180,252,0.12)] hover:border-indigo-400/30 transition-all duration-500 group cursor-pointer"
        >
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

          {/* Quick spinner indicator */}
          <div className="absolute top-2 right-2">
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

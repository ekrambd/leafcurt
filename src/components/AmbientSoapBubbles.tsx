import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface ActiveBubble {
  id: string;
  size: number;
  left: number;
  duration: number;
  delay: number;
  animType: 1 | 2 | 3 | 4;
  opacity: number;
  isPopping?: boolean;
}

interface SparkleParticle {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
}

// Gentle Web Audio API Synthesized Bubble "Pop" sound (0 bytes downloaded, instant, soft)
const playSoftPopSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Drops from 750Hz to 180Hz over 70ms for an authentic bubble pop
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Audio contexts can be blocked until first user gesture; silently ignore
  }
};

export default function AmbientSoapBubbles() {
  const [isVisible, setIsVisible] = useState(false);
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([]);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [scores, setScores] = useState<FloatingScore[]>([]);
  const [popCount, setPopCount] = useState(0);
  const lastWaveTimeRef = useRef<number>(0);
  const isGeneratingRef = useRef<boolean>(false);

  // Spawns a natural, graceful wave of 7-10 iridescent bubbles
  const triggerBubbleWave = useCallback((count = 8) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    lastWaveTimeRef.current = Date.now();

    const newBubbles: ActiveBubble[] = [];
    const waveId = Date.now();

    for (let i = 0; i < count; i++) {
      const size = Math.floor(Math.random() * 38) + 22; // 22px to 60px
      // Distribute evenly across screen width with organic jitter
      const baseLeft = (i / count) * 88 + 4;
      const left = Math.min(94, Math.max(4, baseLeft + (Math.random() * 8 - 4)));
      const duration = Math.floor(Math.random() * 5) + 12; // 12s to 16s float time
      const delay = Math.random() * 3.5; // Staggered launch 0 to 3.5s
      const animType = ((i % 4) + 1) as 1 | 2 | 3 | 4;
      const opacity = 0.55 + Math.random() * 0.3; // 0.55 to 0.85

      newBubbles.push({
        id: `bubble-${waveId}-${i}`,
        size,
        left,
        duration,
        delay,
        animType,
        opacity
      });
    }

    setBubbles(newBubbles);

    // After this wave completes its flight (18s), clear bubbles so screen rests in clean calm
    setTimeout(() => {
      setBubbles([]);
      isGeneratingRef.current = false;
    }, 18000);
  }, []);

  // Periodic Natural Waves ("Not all the time, sometimes can")
  // Releases a fresh breeze every 32 seconds, then leaves the page serene
  useEffect(() => {
    const handleScroll = () => {
      const pastHero = window.scrollY > 280;
      setIsVisible(pastHero);

      // If user scrolls past hero and no wave has triggered in 25s, release a welcoming burst
      if (pastHero && Date.now() - lastWaveTimeRef.current > 25000 && !isGeneratingRef.current) {
        triggerBubbleWave(8);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Natural 32-second breathing cycle (18s floating wave + 14s peaceful pause)
    const interval = setInterval(() => {
      if (window.scrollY > 280 && !isGeneratingRef.current) {
        triggerBubbleWave(7);
      }
    }, 32000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [triggerBubbleWave]);

  // Handle Interactive Bubble Pop on Click or Tap
  const handlePop = (e: React.MouseEvent | React.TouchEvent, bubbleId: string) => {
    e.stopPropagation();
    e.preventDefault();

    // Sound effect
    playSoftPopSound();

    // Get click coordinates for sparkle burst
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Mark bubble as popping
    setBubbles((prev) =>
      prev.map((b) => (b.id === bubbleId ? { ...b, isPopping: true } : b))
    );

    // Create 6 iridescent micro-sparkles
    const newSparkles: SparkleParticle[] = [];
    const burstId = Date.now();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 24 + Math.random() * 20;
      newSparkles.push({
        id: `sparkle-${burstId}-${i}`,
        x: clientX,
        y: clientY,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance
      });
    }
    setSparkles((prev) => [...prev, ...newSparkles]);

    // Creative feedback floating text
    const words = ['Fresh!', 'Clean!', 'Sparkle! 🫧', 'Pure!'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const scoreId = `score-${burstId}`;
    setScores((prev) => [...prev, { id: scoreId, x: clientX, y: clientY, text: randomWord }]);
    setPopCount((c) => c + 1);

    // Clean up sparkles and score after 450ms
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !s.id.startsWith(`sparkle-${burstId}`)));
      setScores((prev) => prev.filter((sc) => sc.id !== scoreId));
      setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
    }, 400);
  };

  return (
    <>
      {/* Ambient Rising Soap Bubbles Canvas */}
      <div 
        className={`fixed inset-0 pointer-events-none z-20 overflow-hidden transition-opacity duration-700 select-none ${
          isVisible && bubbles.length > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        {bubbles.map((b) => (
          <div
            key={b.id}
            onClick={(e) => handlePop(e, b.id)}
            onTouchStart={(e) => handlePop(e, b.id)}
            className={`soap-bubble pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
              b.isPopping ? 'animate-bubble-pop' : `animate-bubble-rise-once-${b.animType}`
            }`}
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              opacity: b.opacity
            }}
            title="Tap to pop!"
          />
        ))}

        {/* Iridescent Sparkle Particles upon popping */}
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="bubble-sparkle"
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              '--tx': `${s.tx}px`,
              '--ty': `${s.ty}px`
            } as React.CSSProperties}
          />
        ))}

        {/* Floating Playful Text "+1 Fresh!" */}
        {scores.map((sc) => (
          <div
            key={sc.id}
            className="fixed pointer-events-none text-xs font-bold text-sky-600 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md animate-in fade-in zoom-in slide-out-to-top duration-500 z-50 border border-sky-200"
            style={{
              left: `${sc.x - 24}px`,
              top: `${sc.y - 28}px`
            }}
          >
            {sc.text}
          </div>
        ))}
      </div>

      {/* Creative "Fresh Breeze" Quick Trigger Pill (Subtle, Bottom Left) */}
      {isVisible && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-30 select-none hidden sm:flex items-center">
          <button
            type="button"
            onClick={() => triggerBubbleWave(10)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0093d0] border border-slate-200/80 shadow-md hover:shadow-lg backdrop-blur-md text-[11px] font-semibold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Click to release a fresh breeze of bubbles! Tap them to pop!"
          >
            <span className="text-base leading-none group-hover:rotate-12 transition-transform">🫧</span>
            <span>Fresh Breeze</span>
            {popCount > 0 && (
              <span className="bg-sky-100 text-sky-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                {popCount}
              </span>
            )}
            <Sparkles className="w-3 h-3 text-amber-500 group-hover:animate-spin opacity-80" />
          </button>
        </div>
      )}
    </>
  );
}

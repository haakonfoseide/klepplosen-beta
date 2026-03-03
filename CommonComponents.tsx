
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Timer, Play, Square, RefreshCcw, BellRing } from 'lucide-react';
import { getLines } from './helpers';

// New wrapper for consistent page transitions
export const PageTransition: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out w-full ${className}`}>
    {children}
  </div>
);

export const SafeImage: React.FC<{ src: string, alt: string, className?: string }> = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <div className={`flex items-center justify-center bg-indigo-50 text-indigo-400 ${className}`}><UserIcon size={24} /></div>;
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
};

export const SvgIllustration: React.FC<{ type: string, color?: string, className?: string }> = ({ type, color = "#4f46e5", className = "w-full h-auto" }) => {
  const renderDots = (count: number, positions: {x: number, y: number}[]) => (
    positions.map((pos, i) => <circle key={i} cx={pos.x} cy={pos.y} r="8" fill={color} opacity={0.3 + (i % 2) * 0.7} />)
  );

  const commonProps = {
    viewBox: "0 0 100 100",
    className: `${className} animate-in zoom-in-50 duration-500`,
    style: { maxHeight: '100%', maxWidth: '100%' } // Ensure it fits but maintains aspect ratio
  };

  switch (type) {
    case 'circle':
      return (
        <svg {...commonProps}>
          <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
          {renderDots(8, [
            {x: 50, y: 15}, {x: 85, y: 50}, {x: 50, y: 85}, {x: 15, y: 50},
            {x: 75, y: 25}, {x: 75, y: 75}, {x: 25, y: 75}, {x: 25, y: 25}
          ])}
          {renderDots(8, [
            {x: 50, y: 25}, {x: 75, y: 50}, {x: 50, y: 75}, {x: 25, y: 50},
            {x: 68, y: 32}, {x: 68, y: 68}, {x: 32, y: 68}, {x: 32, y: 32}
          ])}
        </svg>
      );
    case 'pairs':
      return (
        <svg {...commonProps}>
          {[0, 1, 2, 3].map(i => (
            <g key={i} transform={`translate(${15 + (i % 2) * 45}, ${15 + Math.floor(i / 2) * 45})`}>
               <rect x="0" y="0" width="30" height="30" rx="8" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
               <circle cx="10" cy="15" r="6" fill={color} />
               <circle cx="20" cy="15" r="6" fill={color} opacity="0.6" />
               <path d="M10 15 L20 15" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
            </g>
          ))}
        </svg>
      );
    case 'grid':
      return (
        <svg {...commonProps}>
          {[0, 1, 2, 3].map(i => (
            <g key={i} transform={`translate(${15 + (i % 2) * 45}, ${15 + Math.floor(i / 2) * 45})`}>
               <circle cx="8" cy="8" r="6" fill={color} />
               <circle cx="22" cy="8" r="6" fill={color} />
               <circle cx="8" cy="22" r="6" fill={color} />
               <circle cx="22" cy="22" r="6" fill={color} />
            </g>
          ))}
        </svg>
      );
    case 'expert':
      return (
        <svg {...commonProps}>
          <circle cx="50" cy="50" r="10" fill={color} />
          {[0, 1, 2, 3].map(i => {
            const angle = (i * 90) * Math.PI / 180;
            const x = 50 + 35 * Math.cos(angle);
            const y = 50 + 35 * Math.sin(angle);
            return (
              <g key={i}>
                <line x1="50" y1="50" x2={x} y2={y} stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                <circle cx={x} cy={y} r="8" fill={color} opacity={0.5} />
              </g>
            );
          })}
        </svg>
      );
    case 'line':
      return (
        <svg width="100%" height="auto" viewBox="0 0 100 30" className={className}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <circle key={i} cx={10 + i * 16} cy="15" r="6" fill={color} opacity={0.2 + i * 0.15} />
          ))}
          <line x1="10" y1="15" x2="90" y2="15" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
};

export const BulletList: React.FC<{ 
  text: any; 
  className?: string; 
  style?: React.CSSProperties; 
  markerColor?: string;
  isPrint?: boolean;
}> = ({ text, className, style, markerColor = "bg-indigo-400", isPrint = false }) => {
  const lines = getLines(text);
  if (lines.length === 0) return null;

  return (
    <ul className={`space-y-3 list-none p-0 m-0 ${className}`} style={style}>
      {lines.map((item, i) => (
        <li key={i} className="flex items-start gap-3 break-words overflow-hidden">
          <div className={`mt-[0.6em] flex-shrink-0 w-1.5 h-1.5 rounded-full ${isPrint ? 'bg-black print:bg-black' : markerColor}`} />
          <span className="leading-relaxed flex-grow min-w-0">{item.replace(/^[-*•]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
};

export const TimerComponent: React.FC<{ t: any }> = ({ t }) => {
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setIsFinished(true);
            audioRef.current?.play().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggle = () => {
    if (isFinished) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setIsFinished(false);
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setIsFinished(false);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setTimeLeft(minutes * 60 + seconds);
  };

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;

  return (
    <div className={`p-6 rounded-[2.5rem] border-4 transition-all duration-500 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden w-full max-w-sm mx-auto ${isFinished ? 'bg-red-600 border-white animate-pulse' : 'bg-white border-indigo-100'}`}>
      {isFinished && (
        <div className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center text-white z-20 animate-in fade-in zoom-in duration-300">
          <BellRing size={64} className="mb-4 animate-bounce" />
          <h4 className="text-4xl font-black uppercase text-center tracking-tighter">STOPP!</h4>
          <button onClick={reset} className="mt-8 px-8 py-3 bg-white text-red-600 rounded-2xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">Nullstill</button>
        </div>
      )}
      <div className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] ${isFinished ? 'text-white' : 'text-indigo-600'}`}>
        <Timer size={14} /> {t.timerLabel}
      </div>
      <div className={`text-6xl font-black tracking-tighter tabular-nums ${isFinished ? 'text-white' : 'text-slate-900'}`}>
        {displayMinutes.toString().padStart(2, '0')}:{displaySeconds.toString().padStart(2, '0')}
      </div>
      {!isActive && !isFinished && (
        <div className="flex items-center gap-3 no-print">
          <input type="number" min="0" max="60" value={minutes} onChange={e => { const m = parseInt(e.target.value) || 0; setMinutes(m); setTimeLeft(m * 60 + seconds); }} className="w-14 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-center font-black text-lg focus:border-indigo-500 transition-all outline-none" />
          <span className="font-black text-xl text-slate-300">:</span>
          <input type="number" min="0" max="59" value={seconds} onChange={e => { const s = parseInt(e.target.value) || 0; setSeconds(s); setTimeLeft(minutes * 60 + s); }} className="w-14 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-center font-black text-lg focus:border-indigo-500 transition-all outline-none" />
        </div>
      )}
      <div className="flex items-center gap-3 no-print w-full px-4">
        <button onClick={toggle} className={`flex-grow py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${isActive ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isActive ? <><Square size={12} fill="currentColor" /> {t.timerStop}</> : <><Play size={12} fill="currentColor" /> {t.timerStart}</>}
        </button>
        <button onClick={reset} className="p-3.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-colors active:scale-95"><RefreshCcw size={18} /></button>
      </div>
    </div>
  );
};

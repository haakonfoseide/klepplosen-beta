
import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Music, Sparkles, Volume2 } from 'lucide-react';

const KAI_VIDEO_URL = "https://sfuwzuifxvovowoicrcp.supabase.co/storage/v1/object/public/egg/Kai%20musikkvideo.mp4";

interface EasterEggViewProps {
  onBack: () => void;
}

export const EasterEggView: React.FC<EasterEggViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Forsøk å starte avspilling manuelt etter mount
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay ble blokkert eller feilet:", error);
        });
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="absolute top-8 left-8 z-10">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-white/50 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ChevronLeft size={20} /> LUKK VIDEO
        </button>
      </div>

      <div className="w-full h-full max-w-6xl max-h-[80vh] px-4 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-3">
                <Sparkles className="text-amber-400 animate-pulse" size={24} />
                <h2 className="text-white text-3xl font-black uppercase tracking-tighter">Kais Offisielle Musikkvideo</h2>
                <Music className="text-indigo-400 animate-bounce" size={24} />
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">Du fant den hemmelige skatten!</p>
        </div>

        <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.3)] border-4 border-white/10 bg-slate-900">
          <video 
            ref={videoRef}
            src={KAI_VIDEO_URL} 
            className="w-full h-full object-cover" 
            controls 
            autoPlay 
            playsInline
            preload="auto"
            crossOrigin="anonymous"
          >
            Din nettleser støtter ikke videoavspilling. Prøv å sjekke om filen "kai_musikkvideo.mp4" ligger i "egg"-mappen i Supabase.
          </video>
        </div>
        
        <div className="flex items-center gap-3 text-white/30 animate-pulse no-print">
            <Volume2 size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Husk lyd for den fulle Kai-opplevelsen!</p>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
        © 2026 KLEPPLOSEN STUDIOS
      </div>
    </div>
  );
};

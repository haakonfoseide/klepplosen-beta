
import React from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw } from 'lucide-react';

interface StudentResultProps {
  answerCorrect: boolean | null;
  playerScore: number;
  playerStreak: number;
  playerRank: number | null;
  explanation?: string;
  onSync: () => void;
  sessionStatus?: string;
}

export const StudentResult: React.FC<StudentResultProps> = ({ answerCorrect, playerScore, playerStreak, playerRank, explanation, onSync, sessionStatus }) => {
  if (sessionStatus === 'reflection') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-indigo-600 text-white transition-colors duration-700 overflow-y-auto">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(255,255,255,0.2)] mb-8 animate-in zoom-in-50 duration-500 relative flex-shrink-0">
                  <Lightbulb size={48} className="text-yellow-300 z-10 animate-pulse" />
              </div>
              <h2 className="text-4xl font-black uppercase mb-8 tracking-tighter drop-shadow-lg">Refleksjon</h2>
              
              <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 backdrop-blur-md w-full max-w-md mb-8 text-left animate-in slide-in-from-bottom shadow-2xl">
                  <p className="font-bold text-xl leading-relaxed text-white italic text-center">"{explanation}"</p>
              </div>

              <div className="mt-8 opacity-80 bg-black/20 px-8 py-4 rounded-full backdrop-blur-sm border border-white/10">
                  <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Diskuter med sidemannen</p>
              </div>
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${answerCorrect ? 'bg-emerald-600' : 'bg-rose-600'} text-white transition-colors duration-700 overflow-y-auto`}>
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(255,255,255,0.4)] mb-6 animate-in zoom-in-50 duration-500 relative flex-shrink-0">
            {answerCorrect ? (
                <>
                    <CheckCircle size={48} className="text-emerald-600 z-10" />
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                </>
            ) : (
                <XCircle size={48} className="text-rose-600" />
            )}
        </div>
        <h2 className="text-4xl font-black uppercase mb-8 tracking-tighter drop-shadow-lg">{answerCorrect ? 'Riktig!' : 'Bomtur...'}</h2>
        
        {explanation && (
            <div className="bg-black/20 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md w-full max-w-sm mb-6 text-left animate-in slide-in-from-bottom shadow-xl">
                <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Lightbulb size={18} className="text-yellow-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-100">Læring</p>
                </div>
                <p className="font-bold text-sm leading-relaxed text-white">{explanation}</p>
            </div>
        )}

        <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md w-full max-w-sm space-y-4 shadow-2xl flex-shrink-0">
            <div className="flex items-center justify-between px-2">
                <div className="text-left flex items-center gap-4">
                    {playerRank && (
                        <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-xl font-black text-xs uppercase tracking-tighter flex flex-col items-center justify-center border-b-2 border-amber-600">
                            <span className="text-[8px] opacity-70 leading-none mb-0.5">Plass</span>
                            <span className="leading-none">#{playerRank}</span>
                        </div>
                    )}
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Total score</p>
                        <p className="text-4xl font-black tracking-tighter tabular-nums drop-shadow-lg">{playerScore}</p>
                    </div>
                </div>
                {playerStreak > 1 && (
                    <div className="flex flex-col items-center justify-center bg-orange-500 text-white px-4 py-2 rounded-2xl shadow-lg animate-bounce">
                        <span className="text-xl">🔥</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{playerStreak}</span>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-8 opacity-60">
            <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Venter på neste spørsmål...</p>
        </div>
        
        <button onClick={onSync} className="mt-4 flex items-center gap-2 text-white/30 hover:text-white/60 font-black uppercase text-[10px] tracking-widest transition-all p-4">
            <RefreshCw size={12} className="flex-shrink-0" /> Oppdater manuelt
        </button>
    </div>
  );
};

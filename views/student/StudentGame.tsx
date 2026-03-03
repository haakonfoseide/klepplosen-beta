
import React from 'react';
import { Monitor, Smartphone, Zap, Anchor, Clock } from 'lucide-react';
import { QuizSession } from '../../types';
import { TEAMS } from '../../constants';

interface StudentGameProps {
  session: QuizSession;
  playerScore: number;
  playerRank: number | null;
  hasAnswered: boolean;
  submitAnswer: (index: number) => void;
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  avatar: string;
  nickname: string;
  team: string;
}

export const StudentGame: React.FC<StudentGameProps> = ({ 
  session, playerScore, playerRank, hasAnswered, submitAnswer, 
  showIntro, setShowIntro, avatar, nickname, team 
}) => {
  const currentQ = session.questions[session.currentQuestionIndex];
  const isTrueFalse = currentQ.type === 'true-false';
  const myTeam = TEAMS.find(t => t.id === team);

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col overflow-hidden text-center relative">
        {/* Intro Wizard Overlay */}
        {showIntro && (
            <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500 text-white">
                <div className="max-w-md w-full space-y-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-center">Slik spiller du!</h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-6 bg-white/10 p-4 rounded-3xl border border-white/10">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Monitor size={28} /></div>
                            <div className="text-left"><p className="font-black uppercase text-xs tracking-widest text-indigo-300 mb-1">Steg 1</p><p className="font-bold text-sm leading-tight">Se på storskjermen for spørsmålet.</p></div>
                        </div>
                        <div className="flex items-center gap-6 bg-white/10 p-4 rounded-3xl border border-white/10">
                            <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg"><Smartphone size={28} /></div>
                            <div className="text-left"><p className="font-black uppercase text-xs tracking-widest text-pink-300 mb-1">Steg 2</p><p className="font-bold text-sm leading-tight">Trykk på symbolet som matcher riktig svar.</p></div>
                        </div>
                        <div className="flex items-center gap-6 bg-white/10 p-4 rounded-3xl border border-white/10">
                            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><Zap size={28} /></div>
                            <div className="text-left"><p className="font-black uppercase text-xs tracking-widest text-amber-300 mb-1">Steg 3</p><p className="font-bold text-sm leading-tight">Vær rask! Raskere svar gir flere poeng.</p></div>
                        </div>
                    </div>
                    <button onClick={() => setShowIntro(false)} className="w-full py-6 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-widest hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-900/50 active:scale-95 border-b-8 border-emerald-700">JEG ER KLAR!</button>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6 bg-white/10 p-4 rounded-3xl border border-white/5 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3">
                <span className="text-3xl bg-white/10 p-2 rounded-2xl flex-shrink-0">{avatar}</span>
                <div className="text-left">
                    <p className="font-black text-sm text-white uppercase leading-none">{nickname}</p>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1 tracking-widest">{myTeam ? myTeam.name : 'Individuelt'}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {playerRank && (
                    <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-xl font-black text-xs uppercase tracking-tighter flex flex-col items-center justify-center border-b-2 border-amber-600">
                        <span className="text-[8px] opacity-70 leading-none mb-0.5">Plass</span>
                        <span className="leading-none">#{playerRank}</span>
                    </div>
                )}
                <div className="bg-black/40 px-4 py-2 rounded-2xl flex flex-col items-end border border-white/10">
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">Poeng</span>
                    <span className="font-black text-xl text-white tabular-nums leading-none">{playerScore}</span>
                </div>
            </div>
        </div>

        {hasAnswered ? (
            <div className="flex-grow flex flex-col items-center justify-center text-white space-y-8 animate-in fade-in zoom-in">
                <div className="w-32 h-32 bg-indigo-600/20 rounded-full flex items-center justify-center border-4 border-indigo-500/30 animate-pulse shadow-[0_0_50px_rgba(79,70,229,0.3)] flex-shrink-0 relative">
                    <Anchor size={64} className="text-indigo-400" />
                    <div className="absolute inset-0 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Svar registrert!</h2>
                    <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                        <Clock size={12} /> Venter på de andre...
                    </p>
                </div>
            </div>
        ) : (
            <div className={`flex-grow grid ${isTrueFalse ? 'grid-cols-1 h-full' : 'grid-cols-1 sm:grid-cols-2'} gap-4 pb-4`}>
                {currentQ.options.map((opt, i) => {
                    if (isTrueFalse) {
                        return (
                            <button 
                                key={i} 
                                onClick={() => submitAnswer(i)} 
                                className={`${i === 0 ? 'bg-emerald-500 border-emerald-700 active:bg-emerald-600' : 'bg-red-500 border-red-700 active:bg-red-600'} rounded-[2.5rem] flex items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-2xl active:shadow-none h-full group`}
                            >
                                <span className="text-4xl sm:text-6xl font-black text-white/95 drop-shadow-xl uppercase tracking-widest group-hover:scale-110 transition-transform">{opt}</span>
                            </button>
                        );
                    }
                    return (
                        <button 
                            key={i} 
                            onClick={() => submitAnswer(i)} 
                            className={`${['bg-red-500 border-red-700', 'bg-blue-500 border-blue-700', 'bg-amber-500 border-amber-700', 'bg-emerald-500 border-emerald-700'][i]} rounded-[2.5rem] flex items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-2xl active:shadow-none hover:brightness-110`}
                        >
                            <span className="text-7xl sm:text-8xl text-white/95 drop-shadow-xl transform transition-transform active:scale-95">{(['▲', '◆', '●', '■'] as any)[i]}</span>
                        </button>
                    );
                })}
            </div>
        )}
    </div>
  );
};

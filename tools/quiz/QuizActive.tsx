import React from 'react';
import { Users, Trophy, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { QuizSession, QuizPlayer, QuizQuestion } from '../../types';
import { TEAMS } from '../../constants';

interface QuizActiveProps {
    session: QuizSession | null;
    players: QuizPlayer[];
    currentQuestionIndex: number;
    questions: QuizQuestion[];
    gameStatus: 'question' | 'reveal' | 'scoreboard' | 'reflection';
    timeLeft: number;
    answersCount: number;
    showLiveLeaderboard: boolean;
    setShowLiveLeaderboard: (show: boolean) => void;
    handleTimeUp: () => void;
    nextQuestion: () => void;
    goToScoreboard: () => void;
    goToReflection: () => void;
    finishGame: () => void;
    t: any;
}

export const QuizActive: React.FC<QuizActiveProps> = ({
    session, players, currentQuestionIndex, questions, gameStatus, timeLeft, answersCount,
    showLiveLeaderboard, setShowLiveLeaderboard, handleTimeUp, nextQuestion, goToScoreboard, goToReflection, finishGame, t
}) => {
    const q = questions[currentQuestionIndex];
    const isTimeUp = gameStatus !== 'question';
    
    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-[3rem] overflow-hidden relative">
            {/* Header with PIN */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center px-8 shadow-md relative z-10">
                <span className="font-black text-xs uppercase tracking-widest text-indigo-300">Spørsmål {currentQuestionIndex + 1} / {questions.length}</span>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Game PIN:</span>
                    <span className="font-black text-xl tracking-widest">{session?.pin}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={14} className="text-indigo-400"/> <span className="font-bold text-sm">{players.length}</span>
                    <div className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-black uppercase text-emerald-400 ml-2">
                        {answersCount} Svar
                    </div>
                    <button 
                        onClick={() => setShowLiveLeaderboard(!showLiveLeaderboard)} 
                        className={`ml-4 p-2 rounded-xl border transition-all flex items-center gap-2 ${showLiveLeaderboard ? 'bg-amber-400 border-amber-500 text-slate-900' : 'bg-white/10 border-white/20 text-white'}`}
                        title="Vis/skjul live toppliste"
                    >
                        <Trophy size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Toppliste</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 w-full">
                <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>

            {/* Question Area */}
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center gap-8 bg-white relative overflow-hidden">
                
                {/* Live Leaderboard Sidebar */}
                {showLiveLeaderboard && players.length > 0 && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 hidden xl:flex flex-col gap-2 animate-in slide-in-from-left duration-700 z-10">
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <Trophy size={14} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Toppliste</span>
                        </div>
                        {players
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 5)
                            .map((p, i) => (
                                <div key={p.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-left" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="font-bold text-xs truncate max-w-[80px] text-slate-700">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                    </div>
                                    <span className="font-black font-mono text-[10px] text-purple-600">{p.score}</span>
                                </div>
                            ))}
                    </div>
                )}
                
                {gameStatus === 'question' ? (
                    <>
                        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight max-w-4xl">{q.question}</h2>
                        <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center text-4xl font-black text-slate-700 shadow-xl relative animate-in zoom-in">
                            {timeLeft}
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in flex flex-col items-center gap-6">
                        <h2 className="text-3xl font-black text-slate-900">Riktig svar:</h2>
                        <div className="p-6 bg-emerald-100 text-emerald-800 rounded-3xl text-2xl font-black shadow-lg border-4 border-emerald-200">
                            {q.options[q.correctIndex]}
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-2xl max-w-2xl text-left border border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                <BookOpen size={20} />
                                <h4 className="font-black uppercase text-xs tracking-widest">Forklaring</h4>
                            </div>
                            <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">{q.explanation}</p>
                        </div>
                    </div>
                )}
                
                {/* Player Answer Status */}
                {gameStatus === 'question' && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
                        {players.map(p => {
                            const hasAnswered = p.answer_for_index === currentQuestionIndex;
                            return (
                                <div key={p.id} className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${hasAnswered ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                    <span>{p.nickname.split(' ').slice(1).join(' ')}</span>
                                    {p.streak > 2 && <span className="text-orange-500 animate-pulse">🔥{p.streak}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Options Grid */}
                <div className={`grid ${q.type === 'true-false' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-4 w-full max-w-5xl mt-4 ${isTimeUp ? 'opacity-50 pointer-events-none' : ''}`}>
                    {q.options.map((opt, i) => {
                        const isCorrect = i === q.correctIndex;
                        const bg = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'][i % 4];
                        
                        return (
                            <div key={i} className={`p-8 rounded-[2rem] text-white font-black text-xl sm:text-2xl shadow-lg transition-all flex items-center gap-4 ${bg} ${isTimeUp && !isCorrect ? 'opacity-20' : 'opacity-100'} ${isTimeUp && isCorrect ? 'scale-105 shadow-xl ring-4 ring-emerald-300' : ''}`}>
                                <span className="text-3xl opacity-50">{(['▲', '◆', '●', '■'] as any)[i]}</span>
                                <span>{opt}</span>
                                {isTimeUp && isCorrect && <CheckCircle2 size={32} className="ml-auto text-white animate-bounce" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Next Button Overlay */}
            {gameStatus === 'reveal' && (
                <div className="absolute bottom-8 right-8 z-50 animate-in slide-in-from-bottom flex gap-4">
                    <button onClick={goToReflection} className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black uppercase text-lg tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                        <BookOpen size={20} /> Refleksjon
                    </button>
                    <button onClick={goToScoreboard} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-lg tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                        Se Poeng <ArrowRight size={20} />
                    </button>
                </div>
            )}

            {/* Reflection Overlay */}
            {gameStatus === 'reflection' && (
                <div className="absolute inset-0 bg-indigo-600 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-500 p-12">
                    <div className="max-w-3xl w-full space-y-8 text-center">
                        <div className="inline-flex p-4 bg-white/20 rounded-3xl mb-4">
                            <BookOpen size={48} />
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter leading-tight">Ankerfeste: Refleksjon</h2>
                        <div className="bg-white/10 p-10 rounded-[3rem] border border-white/20 backdrop-blur-md">
                            <p className="text-2xl font-bold leading-relaxed italic">
                                "{q.explanation}"
                            </p>
                        </div>
                        <div className="pt-8">
                            <p className="text-sm font-black uppercase tracking-[0.3em] opacity-60 mb-6">Diskuter med sidemannen</p>
                            <button onClick={goToScoreboard} className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xl tracking-widest hover:scale-105 transition-transform flex items-center gap-3 mx-auto shadow-2xl">
                                Gå Videre <ArrowRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scoreboard Overlay */}
            {gameStatus === 'scoreboard' && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white animate-in slide-in-from-bottom p-8">
                    <Trophy size={64} className="text-yellow-400 mb-6 animate-bounce" />
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">
                        {session?.config?.playMode === 'teams' ? 'Skutekampen' : 'Topp 5'}
                    </h2>
                    <div className="w-full max-w-md space-y-3">
                        {session?.config?.playMode === 'teams' ? (
                            TEAMS.map(team => {
                                const teamPlayers = players.filter(p => p.team === team.id);
                                const totalScore = teamPlayers.reduce((sum, p) => sum + p.score, 0);
                                return { ...team, score: totalScore, playerCount: teamPlayers.length };
                            })
                            .sort((a, b) => b.score - a.score)
                            .map((team, i) => (
                                <div key={team.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2" style={{animationDelay: `${i*100}ms`}}>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-black text-xl ${i===0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i+1}</span>
                                        <span className="text-2xl">{team.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="font-bold uppercase text-sm">{team.name}</span>
                                            <span className="text-[10px] opacity-50 uppercase font-black">{team.playerCount} matroser</span>
                                        </div>
                                    </div>
                                    <span className="font-black font-mono text-xl">{team.score}</span>
                                </div>
                            ))
                        ) : (
                            players.sort((a,b) => b.score - a.score).slice(0, 5).map((p, i) => (
                                <div key={p.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2" style={{animationDelay: `${i*100}ms`}}>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-black text-xl ${i===0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i+1}</span>
                                        <span className="font-bold">{p.nickname}</span>
                                    </div>
                                    <span className="font-black font-mono">{p.score}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={nextQuestion} className="mt-12 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xl tracking-widest hover:scale-105 transition-transform flex items-center gap-3">
                        Neste Spørsmål <ArrowRight size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

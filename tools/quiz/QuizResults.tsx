import React from 'react';
import { Trophy, RefreshCw, Users } from 'lucide-react';
import { QuizSession, QuizPlayer } from '../../types';
import { TEAMS } from '../../constants';

interface QuizResultsProps {
    session: QuizSession | null;
    players: QuizPlayer[];
    setPhase: (phase: 'setup' | 'lobby' | 'game' | 'result') => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ session, players, setPhase }) => {
    const isTeams = session?.config?.playMode === 'teams';

    const getSortedPlayers = () => {
        return [...players].sort((a, b) => b.score - a.score);
    };

    const getTeamScores = () => {
        const scores: Record<string, number> = {};
        players.forEach(p => {
            if (p.team) {
                scores[p.team] = (scores[p.team] || 0) + p.score;
            }
        });
        return Object.entries(scores)
            .map(([teamId, score]) => ({ teamId, score }))
            .sort((a, b) => b.score - a.score);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 animate-in zoom-in-95 max-w-4xl mx-auto py-12">
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-yellow-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                    <Trophy size={48} />
                </div>
                <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-900 drop-shadow-sm">Resultater</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-lg">
                    {isTeams ? 'Vinnende lag' : 'Topp 3 Elever'}
                </p>
            </div>

            <div className="w-full bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                {isTeams ? (
                    <div className="space-y-6">
                        {getTeamScores().map((team, index) => {
                            const teamInfo = TEAMS.find(t => t.id === team.teamId);
                            return (
                                <div key={team.teamId} className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${index === 0 ? 'bg-amber-50 border-amber-200 scale-105 shadow-xl z-10' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: teamInfo?.color }}>
                                            {teamInfo?.icon}
                                        </div>
                                        <div>
                                            {index === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">Vinner!</span>}
                                            <span className="text-2xl font-black text-slate-800">{teamInfo?.name}</span>
                                        </div>
                                    </div>
                                    <div className={`text-4xl font-black tabular-nums ${index === 0 ? 'text-amber-500' : 'text-slate-400'}`}>{team.score}</div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {getSortedPlayers().slice(0, 3).map((p, index) => (
                            <div key={p.id} className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${index === 0 ? 'bg-amber-50 border-amber-200 scale-105 shadow-xl z-10' : index === 1 ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm ${index === 0 ? 'bg-amber-400 text-amber-900' : index === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-200 text-orange-800'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        {index === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">Vinner!</span>}
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-1">{p.nickname.split(' ')[0]}</span>
                                        <span className="text-2xl font-black text-slate-800">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                    </div>
                                </div>
                                <div className={`text-4xl font-black tabular-nums ${index === 0 ? 'text-amber-500' : 'text-slate-400'}`}>{p.score}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-8">
                <button onClick={() => setPhase('setup')} className="flex items-center gap-3 px-8 py-4 bg-white text-slate-600 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-slate-50 transition-all shadow-md border border-slate-200">
                    <RefreshCw size={18} /> Ny Quiz
                </button>
                <button onClick={() => setPhase('lobby')} className="flex items-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-purple-700 transition-all shadow-md">
                    <Users size={18} /> Samme Lobby
                </button>
            </div>
        </div>
    );
};

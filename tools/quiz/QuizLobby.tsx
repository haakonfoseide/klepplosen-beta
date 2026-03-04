import React from 'react';
import { Users, Play, UserMinus, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { QuizSession, QuizPlayer } from '../../types';

interface QuizLobbyProps {
    session: QuizSession | null;
    players: QuizPlayer[];
    handleStartGame: () => void;
    handleKickPlayer: (id: string) => void;
    topic: string;
    grade: string;
}

export const QuizLobby: React.FC<QuizLobbyProps> = ({
    session, players, handleStartGame, handleKickPlayer, topic, grade
}) => {
    const [copied, setCopied] = React.useState(false);
    const joinUrl = `${window.location.origin}?view=join&pin=${session?.pin_code}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in zoom-in-95 max-w-6xl mx-auto py-8">
            <div className="absolute top-8 left-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Quiz Lobby</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tema: {topic} • {grade}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-16 w-full">
                <div className="text-center space-y-8 flex-1">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-purple-50 inline-block transform hover:scale-105 transition-transform duration-500 relative group">
                        <QRCode value={joinUrl} size={300} className="mx-auto" />
                        <button 
                            onClick={handleCopy}
                            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            {copied ? 'Kopiert!' : 'Kopier lenke'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Gå til klepplosen.no</p>
                        <div className="text-7xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{session?.pin_code}</div>
                    </div>
                </div>

                <div className="w-full max-w-md h-[500px] flex flex-col bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-purple-500" size={28} />
                            <span className="text-3xl font-black text-slate-900">{players.length}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Elever klare</span>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {players.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 border-2 border-dashed border-slate-100 rounded-3xl">
                                <Users size={48} className="opacity-50" />
                                <p className="font-bold text-sm uppercase tracking-widest">Venter på elever...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl shadow-sm">
                                                {p.nickname.split(' ')[0]}
                                            </div>
                                            <span className="font-bold text-slate-700 text-lg">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleKickPlayer(p.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                            title="Fjern spiller"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <button 
                            onClick={handleStartGame} 
                            disabled={players.length === 0} 
                            className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-lg tracking-widest hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                        >
                            <Play size={24} /> Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

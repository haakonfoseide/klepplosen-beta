
import React from 'react';
import { Wifi, WifiOff, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { TEAMS } from '../../constants';

interface StudentLobbyProps {
  avatar: string;
  nickname: string;
  team: string;
  isOnline: boolean;
  onSync: () => void;
  onLogout: () => void;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({ avatar, nickname, team, isOnline, onSync, onLogout }) => {
  const myTeam = TEAMS.find(t => t.id === team);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-white text-center ${myTeam?.color || 'bg-slate-900'}`}>
        <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
            {isOnline ? <><Wifi size={14} className="text-emerald-400" /> Tilkoblet</> : <><WifiOff size={14} className="text-red-400" /> Kobler til...</>}
        </div>
        
        <div className="animate-bounce mb-8 bg-white/20 p-6 rounded-full backdrop-blur-md shadow-2xl border border-white/20 flex-shrink-0">
            <div className="text-7xl sm:text-8xl">{avatar}</div>
        </div>
        
        <h2 className="text-4xl font-black uppercase mb-2 drop-shadow-lg">{nickname}</h2>
        
        {myTeam && (
            <div className="bg-black/20 px-6 py-2 rounded-full font-bold text-sm border border-white/20 mb-12 flex items-center gap-2 backdrop-blur-sm">
                <span className="flex-shrink-0">{myTeam.icon}</span> <span>{myTeam.name}</span>
            </div>
        )}
        
        <div className="space-y-4">
            <Loader2 size={32} className="animate-spin mx-auto text-white/50 flex-shrink-0" />
            <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">Venter på avgang fra kapteinen...</p>
        </div>
        
        <div className="mt-20 flex flex-col items-center gap-6">
            <button onClick={onSync} className="flex items-center gap-2 text-white/40 hover:text-white/70 font-black uppercase text-[10px] tracking-widest transition-all">
                <RefreshCw size={12} className="flex-shrink-0" /> Oppdater status
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-white/20 hover:text-red-300 font-black uppercase text-[10px] tracking-widest transition-all">
                <LogOut size={12} className="flex-shrink-0" /> Ikkje deg? Logg ut
            </button>
        </div>
    </div>
  );
};

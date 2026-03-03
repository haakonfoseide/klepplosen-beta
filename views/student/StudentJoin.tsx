
import React from 'react';
import { Ship, Waves, Play, Loader2, ArrowRight, XCircle, Dice3, AlertCircle } from 'lucide-react';
import { SEA_EMOJIS, TEAMS } from '../../constants';

interface StudentJoinProps {
  status: 'loading' | 'enter_pin' | 'ready_to_join' | 'enter_name' | 'select_team';
  pin: string;
  setPin: (p: string) => void;
  nickname: string;
  setNickname: (n: string) => void;
  avatar: string;
  setAvatar: (a: string) => void;
  selectedTeam: string;
  setSelectedTeam: (t: string) => void;
  onJoin: () => void;
  onConfirmJoin: () => void;
  onRegister: () => void;
  onPreRegister: () => void;
  onGenerateName: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  sessionPin?: string;
  useSeaNames?: boolean;
}

export const StudentJoin: React.FC<StudentJoinProps> = ({ 
  status, pin, setPin, nickname, setNickname, avatar, setAvatar, 
  selectedTeam, setSelectedTeam, onJoin, onConfirmJoin, onRegister, onPreRegister,
  onGenerateName, onBack, isLoading, error, sessionPin, useSeaNames 
}) => {

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="animate-spin w-12 h-12 flex-shrink-0" />
        <p className="mt-4 font-black uppercase tracking-widest text-xs">Mønstrer på...</p>
      </div>
    );
  }

  if (status === 'enter_pin') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <Ship className="mb-6 animate-float flex-shrink-0 w-16 h-16" />
        <h1 className="text-4xl font-black uppercase mb-8">Kunnskaps-Tokt</h1>
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <input 
              type="number" 
              placeholder="PIN" 
              className="w-full p-5 bg-white rounded-2xl text-center text-slate-900 font-black text-3xl mb-4 outline-none" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
            />
            <button 
              onClick={onJoin} 
              disabled={isLoading} 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-black transition-all active:scale-95 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Bli med'}
            </button>
            {error && (
              <div className="mt-4 text-red-300 font-bold bg-red-900/40 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
                <AlertCircle size={18} className="flex-shrink-0" /> {error}
              </div>
            )}
        </div>
      </div>
    );
  }

  if (status === 'ready_to_join') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><Waves size={400} className="absolute -top-20 -left-20" /></div>
          <div className="relative z-10 space-y-10 animate-in zoom-in-95">
              <div className="space-y-4">
                  <Ship className="mx-auto w-24 h-24 text-white drop-shadow-2xl animate-float" />
                  <h1 className="text-5xl font-black uppercase tracking-tighter">Land i sikte!</h1>
                  <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">Du er klar for tokt med kaptein {sessionPin}</p>
              </div>
              
              <button 
                  onClick={onConfirmJoin}
                  className="group relative w-full max-w-xs mx-auto py-8 bg-white text-indigo-950 rounded-[2.5rem] font-black uppercase text-xl tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-8 border-indigo-200"
              >
                  BLI MED PÅ TOKT <Play fill="currentColor" size={24} />
              </button>
          </div>
      </div>
    );
  }

  if (status === 'enter_name') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
          <button onClick={onBack} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors"><XCircle size={24} className="flex-shrink-0"/></button>
          <h1 className="text-2xl font-black uppercase mb-8">Hvem er du?</h1>
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-5 gap-2">
                {SEA_EMOJIS.map(a => (
                  <button 
                    key={a} 
                    onClick={() => setAvatar(a)} 
                    className={`text-2xl p-2 rounded-xl transition-all ${avatar === a ? 'bg-indigo-100 ring-4 ring-indigo-50 scale-110' : 'hover:bg-slate-50'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              
              {useSeaNames ? (
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border-2 border-indigo-200 rounded-2xl font-black text-indigo-900 text-xl shadow-inner">{nickname || "???"}</div>
                      <button onClick={onGenerateName} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-100 text-indigo-600 rounded-xl font-black uppercase text-xs hover:bg-indigo-200 transition-all"><Dice3 size={16} className="flex-shrink-0"/> NYTT NAVN</button>
                  </div>
              ) : (
                  <input type="text" placeholder="Ditt Navn" className="w-full p-4 bg-slate-50 rounded-xl text-center text-slate-900 font-black text-xl outline-none focus:ring-4 ring-indigo-100" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={12} disabled={isLoading} />
              )}
              
              <button onClick={onPreRegister} disabled={!nickname || isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Mønstre på <ArrowRight size={16} className="flex-shrink-0"/></>}
              </button>
              {error && <div className="text-red-600 text-xs font-bold">{error}</div>}
          </div>
      </div>
    );
  }

  if (status === 'select_team') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
          <h1 className="text-2xl font-black uppercase mb-8">Velg Skute</h1>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md animate-in zoom-in-95">
              {TEAMS.map(team => (
                  <button key={team.id} onClick={() => setSelectedTeam(team.id)} disabled={isLoading} className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 ${selectedTeam === team.id ? 'bg-white border-white scale-105 shadow-2xl' : `${team.color} border-transparent opacity-90 hover:opacity-100`}`}>
                      <span className="text-4xl flex-shrink-0">{team.icon}</span>
                      <span className={`font-black uppercase text-xs ${selectedTeam === team.id ? 'text-slate-900' : 'text-white'}`}>{team.name}</span>
                  </button>
              ))}
          </div>
          <button onClick={onRegister} disabled={isLoading} className="w-full max-w-md mt-8 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black active:scale-95 shadow-xl disabled:opacity-50">{isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'KLAR!'}</button>
          {error && <div className="mt-4 text-red-300 font-bold">{error}</div>}
      </div>
    );
  }

  return null;
};

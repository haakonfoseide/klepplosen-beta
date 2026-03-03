
import React, { useState } from 'react';
import { ChevronLeft, User as UserIcon, LogOut, Heart, Target, ChevronRight, ShieldCheck, Edit2, Check, X, GraduationCap, Key, Mail, ShieldAlert, Loader2, Calendar, Users } from 'lucide-react';
import { User } from './types';
import { ClassManager } from './views/ClassManager';

interface MyPageViewProps {
  user: User | null;
  onBack: () => void;
  onLogout: () => void;
  onUpdateName: (newName: string) => void;
  onUpdatePassword: (password: string) => Promise<void>;
  stats: {
    totalPlans: number;
    totalLikes: number;
  };
  isGuestMode?: boolean;
  onLogin?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ user, onBack, onLogout, onUpdateName, onUpdatePassword, stats, isGuestMode, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'classes'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  
  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveName = () => {
    if (newName.trim() && user && newName.trim() !== user.name) {
      onUpdateName(newName.trim());
    }
    setIsEditingName(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwords.new.length < 6) {
      setPasswordError("Passordet må vere minst 6 teikn.");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordError("Passorda er ikkje like.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await onUpdatePassword(passwords.new);
      setIsChangingPassword(false);
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      setPasswordError(err.message || "Kunne ikkje endre passord.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleCancelName = () => {
    setNewName(user?.name || '');
    setIsEditingName(false);
  };

  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Ukjent';

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Lærer';
  const roleColor = user?.role === 'admin' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
  const RoleIcon = user?.role === 'admin' ? ShieldCheck : GraduationCap;

  if (isGuestMode || !user) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 max-w-4xl mx-auto w-full space-y-8 no-print pb-20 px-4">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
              <ChevronLeft size={18} /> Tilbake
          </button>
        </div>

        <div className="bg-white p-8 sm:p-14 rounded-[3.5rem] shadow-2xl border border-slate-50 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <UserIcon size={48} />
           </div>
           
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Du seiler som gjest</h2>
              <p className="text-slate-400 font-medium max-w-md mx-auto">Som gjest kan du bruke alle verktøy, men dine opplegg blir ikkje lagra permanent på din eigen profil.</p>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <button 
                onClick={onLogin}
                className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
              >
                Logg inn / Registrer <ChevronRight size={20} />
              </button>
              <button 
                onClick={onBack}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Hald fram som gjest
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 max-w-4xl mx-auto w-full space-y-8 no-print pb-20 px-4">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
            <ChevronLeft size={18} /> Tilbake
        </button>
        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Profil</button>
            <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Users size={14} /> Klasser</button>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 overflow-hidden relative min-h-[500px]">
        
        {activeTab === 'classes' ? (
            <ClassManager />
        ) : (
            <>
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/30 rounded-bl-full -mr-24 -mt-24 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-100 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl border-4 border-slate-50 group relative flex-shrink-0">
                    <UserIcon size={40} className="group-hover:scale-110 transition-transform" />
                    {user.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white animate-bounce">
                        <ShieldCheck size={14} />
                    </div>
                    )}
                </div>
                
                <div className="flex-grow text-center md:text-left space-y-3">
                    <div className="space-y-1">
                    {isEditingName ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 w-full justify-center md:justify-start">
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)}
                            autoFocus
                            className="max-w-xs text-xl font-black text-slate-900 tracking-tight uppercase bg-slate-50 border-b-2 border-indigo-500 outline-none px-3 py-1 rounded-t-xl"
                        />
                        <button onClick={handleSaveName} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <Check size={18} />
                        </button>
                        <button onClick={handleCancelName} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all shadow-sm">
                            <X size={18} />
                        </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group justify-center md:justify-start">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">{user.name}</h2>
                        <button 
                            onClick={() => setIsEditingName(true)}
                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Endre namn"
                        >
                            <Edit2 size={14} />
                        </button>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                        <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border flex items-center gap-1.5 w-fit ${roleColor}`}>
                            <RoleIcon size={10} /> {roleLabel}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                            <Mail size={12} /> {user.username}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                            <Calendar size={12} /> Medlem siden {joinDate}
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16 relative z-10">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center border-2 border-transparent hover:border-indigo-100 transition-all shadow-inner group">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Target size={28} />
                    </div>
                    <p className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{stats.totalPlans}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Opplegg laga</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center border-2 border-transparent hover:border-pink-100 transition-all shadow-inner group">
                    <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Heart size={28} />
                    </div>
                    <p className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{stats.totalLikes}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Likes mottatt</p>
                </div>
                </div>

                {/* SECURITY SECTION */}
                <div className="space-y-6 mb-16 relative z-10">
                <div className="flex items-center gap-3 px-2">
                    <Key size={18} className="text-slate-400" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Sikkerheit</h3>
                </div>

                <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                    {!isChangingPassword ? (
                    <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full flex items-center justify-between p-6 hover:bg-white transition-all group"
                    >
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="text-left">
                            <p className="font-black uppercase text-xs tracking-widest text-slate-700">Endre passord</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Oppdater passordet ditt via Supabase Auth</p>
                        </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                    </button>
                    ) : (
                    <div className="p-8 space-y-6 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-between">
                        <h4 className="font-black uppercase text-xs tracking-widest text-indigo-600">Nytt passord</h4>
                        <button onClick={() => { setIsChangingPassword(false); setPasswordError(null); }} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        </div>
                        
                        <form onSubmit={handleSavePassword} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Nytt passord</label>
                            <input 
                                required
                                type="password" 
                                placeholder="Minst 6 teikn"
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            />
                            </div>
                            <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Bekreft passord</label>
                            <input 
                                required
                                type="password" 
                                placeholder="Skriv på nytt"
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            />
                            </div>
                        </div>

                        {passwordError && (
                            <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 flex items-center gap-2 animate-in shake duration-300">
                            <ShieldAlert size={16} /> {passwordError}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button 
                            type="submit" 
                            disabled={isPasswordLoading}
                            className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                            {isPasswordLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            Oppdater Passord
                            </button>
                            <button 
                            type="button"
                            onClick={() => { setIsChangingPassword(false); setPasswordError(null); }}
                            className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all"
                            >
                            Avbryt
                            </button>
                        </div>
                        </form>
                    </div>
                    )}
                </div>
                </div>

                <button 
                onClick={onLogout} 
                className="w-full flex items-center justify-between p-8 bg-red-50 text-red-600 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all group active:scale-95 shadow-lg border border-red-100 hover:border-red-600 relative z-10"
                >
                <div className="flex items-center gap-5">
                    <LogOut size={24} /> LOGG UT FRA KAIA
                </div>
                <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </>
        )}
      </div>

      <div className="text-center space-y-2 opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Medlems-ID: {user.id.substring(0, 8)}...</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Takk for at du brukar KleppLosen i undervisninga di.</p>
      </div>
    </div>
  );
};

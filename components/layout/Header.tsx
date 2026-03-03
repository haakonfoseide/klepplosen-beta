
import React from 'react';
import { User as UserIcon, Globe, ShieldCheck } from 'lucide-react';
import { SafeImage } from '../../CommonComponents';

const KAI_CLOSE_URL = "https://sfuwzuifxvovowoicrcp.supabase.co/storage/v1/object/public/Bilder/kaiclose.png";

interface HeaderProps {
  t: any;
  view: string;
  setView: (view: string) => void;
  currentUser: any;
  isGuestMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ t, view, setView, currentUser, isGuestMode }) => {
  return (
    <header className="sticky top-0 z-50 px-6 py-4 sm:px-8 sm:py-5 flex justify-between items-center no-print bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <button onClick={() => setView('menu')} className="flex items-center gap-3 sm:gap-4 group outline-none">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <SafeImage src={KAI_CLOSE_URL} alt="Kai" className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-sm transition-transform group-hover:scale-105 group-hover:-rotate-3" />
          </div>
          <div className="text-left hidden xs:block">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-indigo-700 transition-colors">{t.appName}</h1>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5 group-hover:text-indigo-400 transition-colors">Digital Los V 4.0</p>
          </div>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
           {currentUser?.role === 'admin' && view !== 'admin' && (
             <button onClick={() => setView('admin')} className="p-2 sm:p-2.5 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-95" title="Admin Panel">
                <Globe size={18} />
             </button>
           )}
           <button 
             onClick={() => setView('mypage')} 
             className="flex items-center gap-3 pl-1 pr-1 py-1 bg-slate-100/50 border border-slate-200/50 rounded-2xl hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group active:scale-95"
           >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all relative">
                {currentUser?.role === 'admin' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
              </div>
              <div className="flex flex-col items-start pr-3 hidden sm:flex">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{isGuestMode ? t.guest : currentUser?.name?.split(' ')[0]}</span>
                    {currentUser?.role === 'admin' && (
                        <span className="bg-amber-500 text-white text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shadow-sm">
                            ADMIN
                        </span>
                    )}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{isGuestMode ? t.guestName : currentUser?.role === 'admin' ? 'Kaptein' : 'Matros'}</span>
              </div>
           </button>
           
           {currentUser?.role === 'admin' && (
             <button 
               onClick={() => setView('test-dashboard')} 
               className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100"
               title="Systemdiagnose"
             >
                <span className="text-lg leading-none">🧪</span>
             </button>
           )}
        </div>
      </header>
  );
};

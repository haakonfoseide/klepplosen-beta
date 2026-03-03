import React, { useState } from 'react';
import { Loader2, AlertCircle, Key, Mail } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';

interface LoginFormProps {
  t: any;
  onLogin: (user: User) => void;
  onForgotPassword: () => void;
  onMagicLink: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ t, onLogin, onForgotPassword, onMagicLink, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const { data, error } = await storageService.signIn(email, password);
      
      if (error) {
         console.error("Login error:", error);
         if (error.message && error.message.includes("Invalid login credentials")) {
           setFormError("Feil e-post eller passord.");
         } else if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("Network request failed"))) {
           setFormError("Får ikke kontakt med serveren. Sjekk internettforbindelsen din.");
         } else if (error.message && error.message.includes("Missing API Key")) {
           setFormError("Systemfeil: Mangler API-nøkkel. Kontakt administrator.");
         } else {
           setFormError(error?.message || "Det oppstod en feil.");
         }
      } else if (data?.user) {
        const fullUser = await storageService.getCurrentUser();
        if (fullUser) {
          onLogin(fullUser);
        } else {
          setFormError("Innlogging lyktes, men fant ikke brukerprofilen. Prøv igjen.");
        }
      } else {
        setFormError("Ingen respons fra serveren. Sjekk internett.");
      }
    } catch (err: any) {
      console.error("Auth exception:", err);
      if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("Network request failed"))) {
         setFormError("Får ikke kontakt med serveren. Sjekk internettforbindelsen din.");
      } else {
         setFormError("Nettverksfeil: Sjekk at du har internett-tilgang.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">
        {t.loginTitle}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{t.emailLabel}</label>
          <input 
            required 
            type="email" 
            placeholder="kai@skule.no" 
            autoComplete="email"
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm shadow-sm" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{t.passwordLabel}</label>
          <input 
            required 
            type="password" 
            placeholder="••••••••" 
            autoComplete="current-password"
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm shadow-sm" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>

        {formError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            {formError}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-xl shadow-indigo-200 mt-6">
          {isLoading ? <Loader2 className="animate-spin" /> : t.goForward}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
        <button 
          onClick={onForgotPassword} 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors w-fit px-1"
        >
          <Key size={14} /> {t.forgotPassword}
        </button>
        <button 
          onClick={onMagicLink} 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors w-fit px-1"
        >
          <Mail size={14} /> {t.magicLink}
        </button>
      </div>
    </>
  );
};

import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';

interface RegisterFormProps {
  t: any;
  onLogin: (user: User) => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ t, onLogin, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError(t.passwordsDoNotMatch || "Passordene er ikkje like.");
      return;
    }

    if (password.length < 6) {
      setFormError(t.passwordTooShort || "Passordet må vere minst 6 teikn.");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await storageService.signUp(email, password, name);
      
      if (error) {
        console.error("Signup error:", error);
        if (error.message && error.message.includes("User already registered")) {
          setFormError("Denne e-posten er allereie i bruk.");
        } else if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("Network request failed"))) {
           setFormError("Får ikke kontakt med serveren. Sjekk internettforbindelsen din.");
        } else if (error.message && error.message.includes("Missing API Key")) {
           setFormError("Systemfeil: Mangler API-nøkkel. Kontakt administrator.");
        } else {
          setFormError(error?.message || "Feil ved registrering.");
        }
      } else {
        setTimeout(async () => {
          const fullUser = await storageService.getCurrentUser();
          if (fullUser) {
            onLogin(fullUser); 
          } else {
            onSuccess();
          }
        }, 1000);
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
        {t.registerTitle}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{t.nameLabel}</label>
          <input 
            required 
            type="text" 
            placeholder="Navn Navnesen" 
            autoComplete="name"
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm shadow-sm" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
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
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{t.confirmPasswordLabel}</label>
          <input 
            required 
            type="password" 
            placeholder="••••••••" 
            autoComplete="new-password"
            className={`w-full p-4 bg-slate-50 rounded-2xl border-2 font-bold outline-none focus:bg-white transition-all text-sm shadow-sm ${confirmPassword && password !== confirmPassword ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-indigo-500'}`} 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
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
    </>
  );
};


import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, CheckCircle, User as UserIcon } from 'lucide-react';
import { SafeImage } from './CommonComponents';
import { User } from './types';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { MagicLinkForm } from './components/auth/MagicLinkForm';

const KAI_IMAGE_URL = "https://sfuwzuifxvovowoicrcp.supabase.co/storage/v1/object/public/Bilder/kaibrygge.png";

interface AuthViewProps {
  onLogin: (user: User) => void;
  onAccessGranted: () => void;
  accessGranted: boolean;
  t: any;
  onGuestLogin: () => void;
}

type AuthStep = 'none' | 'login' | 'register' | 'forgot-password' | 'magic-link' | 'register-success';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onAccessGranted, accessGranted, t, onGuestLogin }) => {
  const [authStep, setAuthStep] = useState<AuthStep>('none');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Kleppu') {
      onAccessGranted();
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
    }
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mx-auto mb-8 rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden transform rotate-3">
             <SafeImage src={KAI_IMAGE_URL} alt="Kai" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{t.appName}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">{t.enterCode}</p>
          
          <form onSubmit={handleAccessSubmit} className="space-y-6">
            <div className="relative">
                <input 
                type="password" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                className={`w-full p-5 bg-white border-2 rounded-2xl text-center text-xl font-black tracking-[0.5em] outline-none transition-all shadow-inner focus:shadow-md ${authError ? 'border-red-400 animate-shake text-red-500' : 'border-slate-100 focus:border-indigo-500 text-slate-800'}`} 
                placeholder={t.codePlaceholder} 
                />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-500/20">{t.unlock}</button>
            {authError && (
              <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                {t.tryAgainLandcrab}
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="bg-white/90 backdrop-blur-xl p-10 sm:p-14 rounded-[3.5rem] shadow-2xl max-w-md w-full border border-white/50 text-center relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Decorative elements inside card */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {authStep === 'none' ? (
          <>
            <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border-4 border-slate-50 overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <SafeImage src={KAI_IMAGE_URL} alt="Kai" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Velkommen ombord!</h2>
            <p className="text-slate-500 font-medium mb-12 leading-relaxed text-sm px-4">
              {t.kaiAuthGreeting}
            </p>
            <div className="space-y-4">
              <button onClick={() => setAuthStep('login')} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-indigo-600 transition-all active:scale-95 shadow-lg group flex items-center justify-center gap-2">
                  <span>{t.loginTitle}</span> <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button onClick={() => setAuthStep('register')} className="w-full bg-white text-slate-900 border-2 border-slate-200 p-5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95">{t.createAccount}</button>
              
              <div className="pt-6 mt-2">
                <button onClick={onGuestLogin} className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors w-full group">
                   <UserIcon size={14} className="group-hover:scale-110 transition-transform" /> {t.continueGuest || "Fortsett uten konto"}
                </button>
              </div>
            </div>
          </>
        ) : authStep === 'register-success' ? (
          <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center py-8">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce">
              <CheckCircle size={56} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Fantastisk!</h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-10 text-sm max-w-xs mx-auto">
              {t.accountCreatedCheckEmail}
            </p>
            <button 
              onClick={() => setAuthStep('login')} 
              className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
            >
              TIL INNLOGGING <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="text-left animate-in fade-in slide-in-from-right-4">
            <button 
              onClick={() => { 
                const prev = (authStep === 'forgot-password' || authStep === 'magic-link') ? 'login' : 'none';
                setAuthStep(prev); 
              }} 
              className="mb-8 flex items-center gap-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest hover:text-indigo-600 transition-colors pl-1"
            >
              <ChevronLeft size={14} strokeWidth={3} /> {t.backToAuth}
            </button>

            {authStep === 'login' && (
              <LoginForm 
                t={t}
                onLogin={onLogin}
                onForgotPassword={() => setAuthStep('forgot-password')}
                onMagicLink={() => setAuthStep('magic-link')}
                onSwitchToRegister={() => setAuthStep('register')}
              />
            )}

            {authStep === 'register' && (
              <RegisterForm 
                t={t}
                onLogin={onLogin}
                onSuccess={() => setAuthStep('register-success')}
              />
            )}

            {authStep === 'forgot-password' && (
              <ForgotPasswordForm 
                t={t}
                onSuccess={() => setAuthStep('login')}
                onBack={() => setAuthStep('login')}
              />
            )}

            {authStep === 'magic-link' && (
              <MagicLinkForm 
                t={t}
                onSuccess={() => setAuthStep('login')}
                onBack={() => setAuthStep('login')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

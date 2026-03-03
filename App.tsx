
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Check, ShieldAlert, AlertTriangle, Globe, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from './translations';
import { useAppLogic } from './useAppLogic';
import { AuthView } from './AuthView';
import { StudentView } from './StudentView'; 
import { Header } from './components/layout/Header';
import { AppRoutes } from './components/layout/AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Main content wrapper to consume Auth Context
const AppContent: React.FC = () => {
  const getInitialStudentData = () => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const isJoin = params.get('view') === 'join' || path.includes('/bli-med') || path.includes('/join');
    return {
      isStudent: isJoin,
      pin: params.get('pin') || ''
    };
  };

  const initialStudentData = useMemo(() => getInitialStudentData(), []);
  const [isStudentMode, setIsStudentMode] = useState(initialStudentData.isStudent);
  const [studentPin, setStudentPin] = useState(initialStudentData.pin);

  const { 
    currentUser, isGuestMode, accessGranted, isLoading: isAuthLoading, 
    disclaimerAccepted, grantAccess, signIn, enterGuestMode, acceptDisclaimer 
  } = useAuth();

  const appLogic = useAppLogic();
  const { state, setState, saveStatus, refreshStructures, view, setView } = appLogic;

  useEffect(() => {
    const handleUrlChange = () => {
      const data = getInitialStudentData();
      if (data.isStudent !== isStudentMode) {
        setIsStudentMode(data.isStudent);
        setStudentPin(data.pin);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isStudentMode]);

  if (isStudentMode) {
      return (
        <ErrorBoundary>
          <StudentView initialPin={studentPin} />
        </ErrorBoundary>
      );
  }

  const selectedLang = (TRANSLATIONS as any)[state.languageForm];
  const t = { ...TRANSLATIONS.nynorsk, ...(selectedLang || {}) };

  if (isAuthLoading) return <div className="min-h-screen bg-indigo-950 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>;

  if (!accessGranted || (!currentUser && !isGuestMode)) {
    return (
      <AuthView 
        accessGranted={accessGranted} 
        onAccessGranted={grantAccess} 
        onLogin={signIn}
        t={t}
        languageForm={state.languageForm}
        setLanguageForm={(lang) => setState({...state, languageForm: lang})}
        onGuestLogin={enterGuestMode}
      />
    );
  }

  if (!disclaimerAccepted) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl border-4 border-white p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <ShieldAlert size={40} />
           </div>
           
           <h2 className="text-2xl font-black text-slate-900 text-center uppercase tracking-tight mb-6">{t.disclaimerTitle}</h2>
           
           <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <div className="space-y-1">
                    <p className="font-black text-amber-900 uppercase text-[10px] tracking-widest">{t.disclaimerResponsibilityTitle}</p>
                    <p className="text-xs leading-relaxed">{t.disclaimerResponsibilityText}</p>
                </div>
             </div>
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
                <Globe className="text-indigo-600 flex-shrink-0" size={20} />
                <div className="space-y-1">
                    <p className="font-black text-indigo-900 uppercase text-[10px] tracking-widest">{t.disclaimerPrivacyTitle}</p>
                    <p className="text-xs leading-relaxed">{t.disclaimerPrivacyText}</p>
                </div>
             </div>
           </div>

           <button 
             onClick={acceptDisclaimer}
             className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
           >
             {t.disclaimerAccept} <ArrowRight size={20} />
           </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col w-full selection:bg-indigo-100 selection:text-indigo-900 relative">
        <Header 
          t={t} 
          view={view} 
          setView={setView} 
          currentUser={currentUser} 
          isGuestMode={isGuestMode} 
        />

        <main className="flex-grow flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-0">
          <AppRoutes appLogic={appLogic} t={t} refreshStructures={refreshStructures} />
        </main>

        <div className="fixed bottom-6 left-6 z-50 no-print flex gap-2 pointer-events-none">
            {/* Legacy save message, kept for saveStatus inside hooks */}
            {saveStatus.message && (
                <div className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-2xl animate-in slide-in-from-left-4 duration-500 flex items-center gap-3 border ${saveStatus.type === 'shared' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-white border-slate-800'}`}>
                    <div className="bg-white/20 p-1 rounded-full"><Check size={10} strokeWidth={4} /></div> 
                    {saveStatus.message}
                </div>
            )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Root App Component Wrapping Providers
export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </React.StrictMode>
  );
};

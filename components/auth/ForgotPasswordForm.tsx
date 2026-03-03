import React, { useState } from 'react';
import { Key, Loader2, Send } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useToast } from '../../contexts/ToastContext';

interface ForgotPasswordFormProps {
  t: any;
  onSuccess: () => void;
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ t, onSuccess, onBack }) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    const { error } = await storageService.resetPassword(email);
    setIsLoading(false);
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast(t.resetPasswordEmailSent || "Sjekk e-posten din for instruksar.", 'success');
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 rounded-2xl inline-flex text-indigo-600 mb-2 shadow-sm"><Key size={24} /></div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t.resetPasswordTitle}</h2>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">
        {t.resetPasswordText}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg shadow-indigo-200 mt-4">
          {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2" /> {t.sendInstructions}</>}
        </button>
      </form>
    </div>
  );
};

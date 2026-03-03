import React from 'react';
import { Shield, Check, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface DisclaimerModalProps {
  onAccept: () => void;
  isGuest: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept, isGuest }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-in zoom-in-95 duration-300 border-2 border-indigo-100 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Shield size={32} className="text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Personvern & Vilkår
          </h2>
          
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Vennligst les før du fortsetter
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Velkommen til KleppLosen. Vi tar ditt personvern på alvor.
            </p>
            
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-600">
                <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Vi lagrer kun nødvendig informasjon for at tjenesten skal fungere.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Dine data deles ikke med tredjeparter uten ditt samtykke.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Vi bruker AI-tjenester for å generere innhold. Ikke del sensitiv personinformasjon i verktøyene.</span>
              </li>
            </ul>

            {isGuest && (
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong className="block font-black uppercase mb-1">Gjestemodus Advarsel</strong>
                  Ingenting du gjør i denne økten vil bli lagret permanent. Når du lukker nettleseren eller logger ut, forsvinner alt innhold.
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={onAccept} 
            className="w-full py-4 text-xs"
            variant="primary"
            icon={Check}
          >
            JEG FORSTÅR OG AKSEPTERER
          </Button>
        </div>
      </Card>
    </div>
  );
};

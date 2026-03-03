
import React, { useState } from 'react';
import { GraduationCap, Search, Check, ArrowRight, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const PlanningStep2 = ({ state, setState, t, onNext }: any) => {
  const [customAim, setCustomAim] = useState('');

  const addCustomAim = () => {
    if (!customAim.trim()) return;
    const newAim = { id: `custom-${Date.now()}`, text: customAim.trim() };
    
    // Add to selectedAims directly
    setState((prev: any) => ({
        ...prev,
        selectedAims: [newAim, ...prev.selectedAims]
    }));
    setCustomAim('');
  };

  return (
  <Card className="flex flex-col h-[75vh] sm:h-[650px] relative overflow-hidden border-slate-50">
    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 flex-shrink-0">
      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><GraduationCap size={24} /></div>
      <div className="space-y-0.5">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">{t.step2}</h2>
        <p className="text-indigo-500 font-bold uppercase text-[9px] tracking-[0.2em]">{t.step2Sub}</p>
      </div>
    </div>
    
    {/* Custom Aim Input */}
    <div className="mb-6 flex gap-2">
        <input 
            type="text" 
            value={customAim} 
            onChange={(e) => setCustomAim(e.target.value)} 
            placeholder="Skriv inn eget kompetansemål..." 
            className="flex-grow p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && addCustomAim()}
        />
        <Button onClick={addCustomAim} disabled={!customAim.trim()} variant="primary" className="px-6 rounded-2xl" icon={Plus} />
    </div>

    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-24 sm:pb-8">
      {state.selectedAims.length > 0 && (
          <div className="mb-4 space-y-2">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest px-2">Valgte mål</p>
              {state.selectedAims.map((aim: any) => (
                <button key={aim.id} onClick={() => setState({...state, selectedAims: state.selectedAims.filter((a: any) => a.id !== aim.id)})} className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 ease-out flex items-start gap-4 group hover:shadow-lg active:scale-[0.98] border-indigo-600 bg-indigo-50 shadow-md">
                    <div className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all shadow-sm border-2 bg-indigo-600 border-indigo-600 text-white"><Check size={16} strokeWidth={4} /></div>
                    <span className="text-xs sm:text-sm font-bold leading-relaxed text-slate-900">{aim.text}</span>
                </button>
              ))}
              <div className="h-px bg-slate-100 my-4 mx-2"></div>
          </div>
      )}

      {state.aims.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full animate-pulse flex items-center justify-center"><Search size={20} className="text-slate-200" /></div>
            <p className="opacity-30 font-black uppercase text-[10px] tracking-widest">{t.loadingAims}</p>
        </div>
      ) : state.aims.filter((a: any) => !state.selectedAims.find((sa:any) => sa.id === a.id)).map((aim: any) => {
        return (
          <button key={aim.id} onClick={() => setState({...state, selectedAims: [...state.selectedAims, aim]})} className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 ease-out flex items-start gap-4 group hover:shadow-lg active:scale-[0.98] border-slate-50 bg-slate-50 hover:border-indigo-200 hover:bg-white">
            <div className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all shadow-sm border-2 bg-white border-slate-200 group-hover:border-indigo-300"></div>
            <span className="text-xs sm:text-sm font-bold leading-relaxed text-slate-500">{aim.text}</span>
          </button>
        );
      })}
    </div>
    
    {/* Sticky Footer */}
    <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-md border-t border-slate-100 sm:relative sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none sm:pt-4">
        <Button onClick={onNext} disabled={state.selectedAims.length === 0} className="w-full" size="lg" icon={ArrowRight}>
            {t.nextStepCustomize}
        </Button>
    </div>
  </Card>
  );
};

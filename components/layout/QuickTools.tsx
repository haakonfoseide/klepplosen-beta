import React, { useState } from 'react';
import { Wrench, X, Timer, Siren, Users } from 'lucide-react';
import { TimerComponent } from '../../CommonComponents';
import { NoiseMeter } from '../../tools/NoiseMeter';

interface QuickToolsProps {
  t: any;
}

export const QuickTools: React.FC<QuickToolsProps> = ({ t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: 'timer', icon: Timer, label: 'Tidtaker', color: 'bg-amber-500' },
    { id: 'noise', icon: Siren, label: 'Lydmåler', color: 'bg-rose-500' },
    { id: 'groups', icon: Users, label: 'Grupper', color: 'bg-emerald-500' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 no-print">
        {isOpen && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 mb-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setIsOpen(false); }}
                className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 hover:scale-105 transition-transform group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">{tool.label}</span>
                <div className={`p-2 rounded-xl text-white shadow-md ${tool.color}`}>
                  <tool.icon size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-[1.5rem] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen ? 'bg-slate-900 text-white rotate-45' : 'bg-white text-indigo-600 border-2 border-indigo-50'}`}
          aria-label="Hurtigverktøy"
        >
          {isOpen ? <X size={24} /> : <Wrench size={24} />}
        </button>
      </div>

      {/* Tool Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-2 relative animate-in zoom-in-95 duration-300">
            <div className="absolute top-6 right-6 z-10">
              <button onClick={() => setActiveTool(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8">
              {activeTool === 'timer' && <TimerComponent t={t} />}
              {activeTool === 'noise' && <NoiseMeter t={t} />}
              {activeTool === 'groups' && (
                <div className="text-center py-10">
                  <Users size={48} className="mx-auto text-emerald-200 mb-4" />
                  <p className="font-black uppercase text-slate-400">Gruppe-generator kommer her</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

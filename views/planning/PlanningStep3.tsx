
import React, { useState, useMemo } from 'react';
import { Settings, Search, Star, Sparkles, Loader2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../../constants';
import { Card } from '../../components/ui/Card';

export const PlanningStep3 = ({ state, setState, dbStructures, onNext, t }: any) => {
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    const result = dbStructures.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
    
    return result.sort((a: any, b: any) => {
        const aRec = state.recommendedStructureIds.includes(a.id) ? 1 : 0;
        const bRec = state.recommendedStructureIds.includes(b.id) ? 1 : 0;
        if (aRec !== bRec) return bRec - aRec;
        return 0;
    });
  }, [dbStructures, search, state.recommendedStructureIds]);
  
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-20">
      {/* Structure Grid */}
      <Card className="flex flex-col min-h-[600px] border-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-[1.2rem] shadow-inner"><Settings size={24} /></div>
             <div className="space-y-0.5">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.step3}</h2>
                <p className="text-indigo-500 font-bold uppercase text-[9px] tracking-[0.2em]">{t.step3Sub}</p>
             </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" />
          </div>
        </div>

        {state.isFetchingRecommendations && (
            <div className="flex items-center justify-center p-4 mb-4 bg-indigo-50 rounded-2xl animate-pulse text-indigo-600 font-bold text-xs gap-3">
                <Loader2 className="animate-spin" size={16} />
                <span>Kai tenker ut smarte anbefalinger...</span>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-32">
          {filtered.map((structure: any) => {
            const isRec = state.recommendedStructureIds.includes(structure.id);
            const reasoning = state.recommendationReasons?.[structure.id];
            const CatColor = (CATEGORY_COLORS as any)[structure.category || 'samtale'].split(' ')[0];
            
            return (
              <button 
                key={structure.id} 
                onClick={() => onNext(structure.id)} 
                className={`group p-4 rounded-3xl border transition-all text-left relative flex flex-col gap-2 hover:-translate-y-1 shadow-sm hover:shadow-md ${isRec ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
              >
                {isRec && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-sm z-10 animate-in zoom-in">
                        <Star size={10} fill="currentColor" />
                    </div>
                )}
                
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:rotate-6 flex-shrink-0 ${CatColor.replace('bg-', 'bg-').replace('text-', 'text-')} bg-opacity-10`}>
                        {structure.name.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-indigo-600 transition-colors truncate">{structure.name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2 italic">"{structure.description}"</p>
                    </div>
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-500 border border-slate-200">{structure.groupSize}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-500 border border-slate-200">{structure.setupTime}</span>
                </div>

                {reasoning && (
                    <div className="mt-2 p-2 bg-white/80 rounded-xl border border-amber-100 text-[9px] font-medium text-amber-800 flex gap-2 items-start animate-in fade-in">
                        <Sparkles size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{reasoning}</span>
                    </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

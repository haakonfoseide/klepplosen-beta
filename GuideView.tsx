
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, Search, ArrowRight, Layers, Filter, Clock, Star, User2, Users2, Building2, Edit, Plus, Zap, Users } from 'lucide-react';
import { CATEGORY_COLORS } from './constants';
import { CLStructure } from './types';
import { storageService } from './services/storageService';
import { StructureDetailModal } from './StructureDetailModal';
import { useToast } from './contexts/ToastContext';

interface GuideViewProps {
  onBack: () => void;
  t: any;
  dbStructures: CLStructure[];
  language?: string;
  currentUser?: any;
  onRefresh?: () => void;
}

type SortOption = 'alphabetical' | 'duration' | 'popularity' | 'favorites';

export const GuideView: React.FC<GuideViewProps> = ({ onBack, t, dbStructures, language = 'bokmål', currentUser, onRefresh }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedStructure, setSelectedStructure] = useState<CLStructure | null>(null);
  
  const [sortOption, setSortOption] = useState<SortOption>('favorites');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [selectedSize, setSelectedSize] = useState<string>('alle');
  const [selectedDuration, setSelectedDuration] = useState<string>('alle');
  
  const [favorites, setFavorites] = useState<string[]>(() => storageService.local.getFavorites());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const getLocalizedContent = useCallback((s: CLStructure) => {
    if (language === 'bokmål' || !s.translations) return s;
    const trans = (s.translations as any)[language];
    if (!trans) return s;

    return {
      ...s,
      name: trans.name || s.name,
      description: trans.description || s.description,
      steps: trans.steps || s.steps,
      studentInstructions: trans.studentInstructions || s.studentInstructions,
      tips: trans.tips || s.tips
    };
  }, [language]);

  const categories = ['alle', 'samtale', 'repetisjon', 'kunnskap', 'produksjon', 'teambygging'];

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavs = storageService.local.toggleFavorite(id);
    setFavorites(newFavs);
  };

  const filtered = useMemo(() => {
    if (!dbStructures || dbStructures.length === 0) return [];
    
    const result = dbStructures.filter(rawStructure => {
      const s = getLocalizedContent(rawStructure);
      const matchesSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
                           (s.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'alle' || s.category === selectedCategory;
      
      const matchesSize = selectedSize === 'alle' || s.groupSize === selectedSize;
      let matchesDuration = true;
      if (selectedDuration === 'short') matchesDuration = (s.durationMinutes || 0) <= 10;
      if (selectedDuration === 'medium') matchesDuration = (s.durationMinutes || 0) > 10 && (s.durationMinutes || 0) <= 20;
      if (selectedDuration === 'long') matchesDuration = (s.durationMinutes || 0) > 20;

      return matchesSearch && matchesCategory && matchesSize && matchesDuration;
    });

    result.sort((a, b) => {
      if (sortOption === 'favorites') {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        if (bFav !== aFav) return bFav - aFav;
      }

      const sA = getLocalizedContent(a);
      const sB = getLocalizedContent(b);

      switch (sortOption) {
        case 'alphabetical':
          return (sA.name || '').localeCompare(sB.name || '');
        case 'duration':
          return (sA.durationMinutes || 0) - (sB.durationMinutes || 0);
        case 'popularity':
          return (sB.popularity || 0) - (sA.popularity || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [search, selectedCategory, selectedSize, selectedDuration, favorites, dbStructures, sortOption, getLocalizedContent]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (pendingDeleteId !== id) { setPendingDeleteId(id); return; }
    setPendingDeleteId(null);
    try {
      await storageService.deleteCLStructure(id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      addToast("Feil: " + err.message, 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent, s: CLStructure) => {
    e.stopPropagation();
    setSelectedStructure(s);
  };

  const handleNew = () => {
    const empty: CLStructure = {
      id: "ny-" + Date.now(),
      name: t.newStructure,
      description: "",
      category: "samtale",
      setupTime: "rask",
      groupSize: "par",
      durationMinutes: 5,
      steps: [""],
      studentInstructions: [""],
      tips: [""],
      bestFor: [""],
      subjects: ["Alle"]
    };
    setSelectedStructure(empty);
  };

  const handleSave = async (updatedStructure: CLStructure) => {
    try {
      await storageService.upsertCLStructure(updatedStructure);
      if (onRefresh) onRefresh();
      setSelectedStructure(updatedStructure);
    } catch (err: any) {
      addToast("Feil ved lagring: " + err.message, 'error');
    }
  };

  const localizedSelectedStructure = selectedStructure ? getLocalizedContent(selectedStructure) : null;

  // Quick Filters Helper
  const setQuickFilter = (type: 'par' | 'kjapp' | 'bevegelse' | 'alle') => {
      setSelectedCategory('alle');
      setSelectedSize('alle');
      setSelectedDuration('alle');
      
      if (type === 'par') setSelectedSize('par');
      if (type === 'kjapp') setSelectedDuration('short');
      // For movement we might need a tag, but for now reset
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 w-full no-print pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
          <ChevronLeft size={18} /> {t.back}
        </button>
        {currentUser?.role === 'admin' && (
          <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
            <Plus size={16} /> {t.newStructure}
          </button>
        )}
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-2xl border border-slate-50 min-h-[700px] overflow-hidden">
        
        {/* Search & Filter Header */}
        <div className="space-y-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">{t.clGuide}</h2>
              <p className="text-indigo-500 font-bold uppercase text-[10px] tracking-[0.2em]">Metodebibliotek for aktiv læring</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Søk etter metode..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:shadow-lg transition-all border-2 border-slate-50 focus:border-indigo-100" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'}`}>
                <Filter size={14} /> <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setQuickFilter('alle')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSize === 'alle' && selectedDuration === 'alle' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>Alle</button>
              <button onClick={() => setQuickFilter('par')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 whitespace-nowrap ${selectedSize === 'par' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}><User2 size={12}/> Par-arbeid</button>
              <button onClick={() => setQuickFilter('kjapp')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 whitespace-nowrap ${selectedDuration === 'short' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}><Zap size={12}/> Kjappe (5-10 min)</button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Kategori</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3 rounded-xl font-bold text-xs bg-white border border-slate-200 outline-none">{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Gruppestørrelse</label>
                    <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} className="w-full p-3 rounded-xl font-bold text-xs bg-white border border-slate-200 outline-none"><option value="alle">Alle</option><option value="par">Par</option><option value="4">Gruppe (4)</option><option value="klasse">Hele klassen</option></select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Varighet</label>
                    <select value={selectedDuration} onChange={e => setSelectedDuration(e.target.value)} className="w-full p-3 rounded-xl font-bold text-xs bg-white border border-slate-200 outline-none"><option value="alle">Alle</option><option value="short">Kort (0-10 min)</option><option value="medium">Middels (10-20 min)</option><option value="long">Lang (20+ min)</option></select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Sortering</label>
                    <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="w-full p-3 rounded-xl font-bold text-xs bg-white border border-slate-200 outline-none"><option value="favorites">Favoritter først</option><option value="alphabetical">Alfabetisk A-Å</option><option value="duration">Kortest tid først</option></select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid Content */}
        {filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><Layers size={40} /></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Ingen metoder funnet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(raw => {
              const s = getLocalizedContent(raw);
              const catColor = (CATEGORY_COLORS as any)[s.category || 'samtale'].split(' ')[0];
              const textColor = (CATEGORY_COLORS as any)[s.category || 'samtale'].split(' ')[1];
              
              return (
              <button 
                key={s.id} 
                onClick={() => setSelectedStructure(raw)} 
                className="group relative bg-white rounded-[2.5rem] border-2 border-slate-50 p-6 flex flex-col text-left transition-all hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-1 h-full overflow-hidden"
              >
                {/* Decoration */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${catColor} opacity-10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none`}></div>
                
                {/* Admin Actions */}
                <div className="absolute top-4 right-4 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                   {currentUser?.role === 'admin' && (
                     <div onClick={(e) => handleEdit(e, raw)} className="p-1.5 bg-white rounded-full shadow-sm text-slate-400 hover:text-indigo-600"><Edit size={12}/></div>
                   )}
                   <div onClick={(e) => toggleFavorite(e, s.id)} className={`p-1.5 bg-white rounded-full shadow-sm transition-colors ${favorites.includes(s.id) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-400'}`}><Star size={12} fill="currentColor"/></div>
                </div>

                <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${catColor} ${textColor} bg-opacity-20`}>{s.category}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3 group-hover:text-indigo-700 transition-colors">{s.name}</h3>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6 flex-grow">{s.description}</p>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1.5 text-slate-400" title="Gruppestørrelse">
                            {s.groupSize === 'par' ? <Users size={14}/> : s.groupSize === 'klasse' ? <Building2 size={14}/> : <Users2 size={14}/>}
                            <span className="text-[9px] font-bold uppercase">{s.groupSize === 'par' ? 'Par' : s.groupSize === 'klasse' ? 'Klasse' : 'Gruppe'}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div className="flex items-center gap-1.5 text-slate-400" title="Varighet">
                            <Clock size={14}/>
                            <span className="text-[9px] font-bold uppercase">{s.durationMinutes} min</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={16} />
                    </div>
                </div>
              </button>
            )})}
          </div>
        )}
      </div>

      {localizedSelectedStructure && (
        <StructureDetailModal 
            structure={localizedSelectedStructure} 
            onClose={() => setSelectedStructure(null)} 
            onSave={handleSave} 
            t={t} 
            currentUser={currentUser} 
        />
      )}
    </div>
  );
};

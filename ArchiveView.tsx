
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, Loader2, Share2, ThumbsUp, UserRound, Trash2, Archive, BookOpen, Edit, Calendar, Heart, Filter, GraduationCap, RotateCcw, PenTool, LayoutGrid, Layers, RefreshCw, Eye, Mic2, LifeBuoy, Grid3X3 } from 'lucide-react';
import { GRADES, COMMON_SUBJECTS, LANGUAGE_SUBJECTS, ELECTIVE_SUBJECTS } from './constants';

interface ArchiveViewProps {
  archiveTab: 'mine' | 'shared';
  setArchiveTab: (t: 'mine' | 'shared') => void;
  archiveSearch: string;
  setArchiveSearch: (s: string) => void;
  isLoading: boolean;
  plans: any[];
  currentUser: any;
  onToggleShare: (p: any) => void;
  onLike: (p: any) => void;
  onDelete: (id: string) => void;
  onViewPlan: (p: any) => void;
  onBack: () => void;
  t: any;
  onRefresh?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ 
  archiveTab, setArchiveTab, archiveSearch, setArchiveSearch, isLoading, plans, currentUser, onToggleShare, onLike, onDelete, onViewPlan, onBack, t, onRefresh
}) => {
  const [sortOption, setSortOption] = useState<'date' | 'likes' | 'topic'>('date');
  const [filterType, setFilterType] = useState<'all' | 'plan' | 'project' | 'tool' | 'lesson_study'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('alle');
  const [selectedGrade, setSelectedGrade] = useState<string>('alle');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const subjectsList = ['alle', ...COMMON_SUBJECTS, ...LANGUAGE_SUBJECTS, ...ELECTIVE_SUBJECTS];

  const filteredAndSortedPlans = useMemo(() => {
    const result = plans.filter(p => {
      const searchLower = archiveSearch.toLowerCase();
      const matchesSearch = (
        (p.task?.title || '').toLowerCase().includes(searchLower) ||
        (p.subject || '').toLowerCase().includes(searchLower) ||
        (p.topic || '').toLowerCase().includes(searchLower) ||
        (p.grade || '').toLowerCase().includes(searchLower)
      );

      const matchesSubject = selectedSubject === 'alle' || p.subject === selectedSubject;
      const matchesGrade = selectedGrade === 'alle' || p.grade === selectedGrade;
      
      const pType = p.task?.planType || 'plan';
      const matchesType = filterType === 'all' || pType === filterType;

      return matchesSearch && matchesSubject && matchesGrade && matchesType;
    });

    result.sort((a, b) => {
      if (sortOption === 'likes') {
        const diff = (b.likes || 0) - (a.likes || 0);
        if (diff !== 0) return diff;
      }
      
      if (sortOption === 'topic') {
        const topicA = (a.topic || '').toLowerCase();
        const topicB = (b.topic || '').toLowerCase();
        return topicA.localeCompare(topicB);
      }
      
      const dateA = a.date ? a.date.split('.').reverse().join('') : '';
      const dateB = b.date ? b.date.split('.').reverse().join('') : '';
      return dateB.localeCompare(dateA);
    });

    return result;
  }, [plans, archiveSearch, sortOption, selectedSubject, selectedGrade, filterType]);

  const activeFiltersCount = [
    selectedSubject !== 'alle',
    selectedGrade !== 'alle'
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedSubject('alle');
    setSelectedGrade('alle');
    setArchiveSearch('');
    setFilterType('all');
  };

  const getTypeConfig = (p: any) => {
      if (p.task?.planType === 'project') return { label: 'Prosjekt', icon: Layers, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', accent: 'bg-teal-500' };
      if (p.task?.planType === 'lesson_study') return { label: 'Lesson Study', icon: GraduationCap, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', accent: 'bg-blue-500' };
      if (p.task?.planType === 'tool') {
          if (p.task?.toolType === 'substitute_plan') return { label: 'Vikarplan', icon: LifeBuoy, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' };
          if (p.task?.toolType === 'student_talk') return { label: 'Elevsamtale', icon: Mic2, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' };
          if (p.task?.toolType === 'crossword') return { label: 'Kryssord', icon: Grid3X3, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', accent: 'bg-violet-500' };
          return { label: p.task?.toolType === 'alias' ? 'Ordbank' : 'Verktøy', icon: LayoutGrid, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' };
      }
      if (p.task?.planType === 'quiz') return { label: 'Quiz', icon: LayoutGrid, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', accent: 'bg-purple-500' };
      return { label: 'Timeplan', icon: PenTool, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' };
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 space-y-8 w-full no-print pb-20">
      <div className="flex justify-between items-center px-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors"><ChevronLeft size={18} /> {t.back}</button>
        <button onClick={onRefresh} className={`p-2 text-slate-400 hover:text-indigo-600 transition-all ${isLoading ? 'animate-spin' : ''}`} title="Oppdater arkiv"><RefreshCw size={18}/></button>
      </div>
      <div className="bg-white p-8 sm:p-14 rounded-[4rem] shadow-2xl border border-slate-50 min-h-[700px]">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
           <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-tight">{t.archive}</h2>
           <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full shadow-inner overflow-x-auto max-w-full">
              <button onClick={() => { setArchiveTab('mine'); setSortOption('date'); }} className={`py-2.5 px-6 sm:px-8 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${archiveTab === 'mine' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{t.myPlans}</button>
              <button onClick={() => { setArchiveTab('shared'); setSortOption('likes'); }} className={`py-2.5 px-6 sm:px-8 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${archiveTab === 'shared' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{t.communityArena}</button>
           </div>
         </div>

         {/* Type Filters */}
         <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterType === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>Alle</button>
            <button onClick={() => setFilterType('plan')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filterType === 'plan' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}`}><PenTool size={12}/> Undervisning</button>
            <button onClick={() => setFilterType('project')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filterType === 'project' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white text-slate-400 border-slate-200 hover:border-teal-200'}`}><Layers size={12}/> Prosjekter</button>
            <button onClick={() => setFilterType('lesson_study')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filterType === 'lesson_study' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200'}`}><GraduationCap size={12}/> Lesson Study</button>
            <button onClick={() => setFilterType('tool')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filterType === 'tool' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-200'}`}><LayoutGrid size={12}/> Verktøy</button>
         </div>

         <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="p-2 pl-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center relative shadow-inner flex-grow">
              <Search size={18} className="text-slate-400 mr-4 flex-shrink-0" />
              <input 
                type="text" 
                placeholder={t.search} 
                className="w-full py-2 bg-transparent font-bold text-sm outline-none text-slate-700 placeholder:text-slate-300" 
                value={archiveSearch} 
                onChange={(e) => setArchiveSearch(e.target.value)} 
              />
            </div>
            
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm flex-shrink-0">
               <button 
                 onClick={() => setShowFilters(!showFilters)} 
                 className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-white/50'}`}
               >
                 <Filter size={14} /> 
                 <span className="hidden sm:inline">{t.filter}</span>
                 {activeFiltersCount > 0 && <span className="ml-1 bg-white text-indigo-600 px-1.5 rounded-md text-[9px]">{activeFiltersCount}</span>}
               </button>
               
               <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

               <button onClick={() => setSortOption('date')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOption === 'date' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                 <Calendar size={14} /> <span className="hidden sm:inline">{t.newest}</span>
               </button>
               <button onClick={() => setSortOption('likes')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOption === 'likes' ? 'bg-white text-pink-600 shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                 <Heart size={14} /> <span className="hidden sm:inline">{t.mostLiked}</span>
               </button>
            </div>
         </div>

         {showFilters && (
           <div className="mb-10 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-in slide-in-from-top-4 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                   <BookOpen size={12} /> {t.selectSubject}
                 </label>
                 <select 
                   value={selectedSubject} 
                   onChange={(e) => setSelectedSubject(e.target.value)}
                   className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500 shadow-sm appearance-none cursor-pointer"
                 >
                   <option value="alle">{t.allSubjects}</option>
                   {subjectsList.filter(s => s !== 'alle').map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               
               <div className="space-y-3">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                   <GraduationCap size={12} /> {t.grade}
                 </label>
                 <select 
                   value={selectedGrade} 
                   onChange={(e) => setSelectedGrade(e.target.value)}
                   className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500 shadow-sm appearance-none cursor-pointer"
                 >
                   <option value="alle">{t.allGrades}</option>
                   {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
               </div>
             </div>
             
             {activeFiltersCount > 0 && (
               <div className="flex justify-end">
                 <button 
                   onClick={resetFilters}
                   className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                 >
                   <RotateCcw size={12} /> {t.resetFilters}
                 </button>
               </div>
             )}
           </div>
         )}

         {isLoading ? (
           <div className="py-48 flex flex-col items-center justify-center gap-5 text-slate-400 uppercase font-extrabold text-[11px] tracking-[0.3em]"><Loader2 className="animate-spin" size={32} />{t.loading || '...'}</div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPlans.map(plan => {
                const config = getTypeConfig(plan);
                const isOwner = currentUser && plan.creatorId === currentUser.id;
                
                return (
                <div key={plan.id} onClick={() => onViewPlan(plan)} className={`relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all flex flex-col shadow-sm group hover:shadow-2xl h-full animate-in fade-in zoom-in-95 duration-300 cursor-pointer ${config.bg} ${config.border} hover:border-slate-300`}>
                   
                   {/* Card Header / Badge */}
                   <div className="flex items-center justify-between mb-6">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/60 border border-white/50 ${config.text} flex items-center gap-1.5`}>
                          <config.icon size={10} /> {config.label}
                      </span>
                      <div className="flex items-center gap-2">
                          {archiveTab === 'mine' && <button onClick={(e) => { e.stopPropagation(); onToggleShare(plan); }} className={`p-2 rounded-xl transition-all shadow-sm ${plan.isShared ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-600'}`} title={plan.isShared ? "Delt i fellesarena" : "Privat"}><Share2 size={12} /></button>}
                          {archiveTab === 'shared' && <button onClick={(e) => { e.stopPropagation(); onLike(plan); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm ${plan.likedBy?.includes(currentUser?.id || '') ? 'bg-pink-500 text-white' : 'bg-white border text-slate-400 hover:text-pink-500'}`}><ThumbsUp size={10} /> {plan.likes || 0}</button>}
                      </div>
                   </div>

                   {/* Main Content */}
                   <h3 className="text-base font-extrabold text-slate-900 mb-2 uppercase tracking-tight leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">{plan.task?.title || 'Uten tittel'}</h3>
                   
                   {/* Subject/Grade Tags */}
                   <div className="flex flex-wrap gap-2 mt-2">
                       <span className="text-[9px] font-bold bg-white/50 px-2 py-1 rounded text-slate-500">{plan.subject}</span>
                       <span className="text-[9px] font-bold bg-white/50 px-2 py-1 rounded text-slate-500">{plan.grade}</span>
                   </div>

                   {/* Footer */}
                   <div className="pt-6 mt-auto flex items-center justify-between border-t border-slate-200/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-300 border shadow-sm"><UserRound size={12} /></div>
                        <div className="flex flex-col">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate max-w-[80px]">{plan.creator}</p>
                           <p className="text-[8px] font-medium text-slate-400">{plan.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); onViewPlan(plan); }} className={`p-2 rounded-xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isOwner ? 'bg-indigo-600' : 'bg-slate-700'}`} title={isOwner ? "Åpne" : "Se innhold (Lesemodus)"}>
                             {isOwner ? <Edit size={14} /> : <Eye size={14} />}
                         </button>
                        {(archiveTab === 'mine' || currentUser?.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (pendingDeleteId === plan.id) { onDelete(plan.id); setPendingDeleteId(null); }
                              else setPendingDeleteId(plan.id);
                            }}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${pendingDeleteId === plan.id ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-300 hover:text-red-500'}`}
                            title={pendingDeleteId === plan.id ? "Klikk igjen for å bekrefte sletting" : "Slett"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                   </div>
                </div>
              )})}
              {filteredAndSortedPlans.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Archive size={40} /></div>
                  <div className="space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        {archiveSearch || activeFiltersCount > 0 ? t.noResultsFound : t.noPlansFound}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Gå til Planleggeren for å lage nytt innhold.</p>
                  </div>
                </div>
              )}
           </div>
         )}
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { PenTool, BookOpen, UploadCloud, X, GraduationCap, ChevronDown, Wand2, Target, FileText, ClipboardCheck, MessageCircle, ArrowRight, Layers, RefreshCw, BarChart, Rocket, CheckCircle2 } from 'lucide-react';
import { GRADES, SUBJECT_ICONS, COMMON_SUBJECTS, LANGUAGE_SUBJECTS, ELECTIVE_SUBJECTS } from '../../constants';
import { SavedPlan, Subject } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface PlanningStep1Props {
    state: any;
    setState: any;
    t: any;
    onNext: () => void;
    handleImageUpload: (files: FileList) => void;
    removeImage: (index: number) => void;
    myPlans?: SavedPlan[];
    availableSubjects?: Subject[];
}

export const PlanningStep1: React.FC<PlanningStep1Props> = ({ state, setState, t, onNext, handleImageUpload, removeImage, myPlans = [], availableSubjects = [] }) => {
  const [dragActive, setDragActive] = useState(false);
  
  // Filter subjects based on visibility
  const { gridSubjects, langSubjects, electiveSubjects } = useMemo(() => {
      if (!availableSubjects || availableSubjects.length === 0) {
          return { 
              gridSubjects: COMMON_SUBJECTS, 
              langSubjects: LANGUAGE_SUBJECTS, 
              electiveSubjects: ELECTIVE_SUBJECTS 
          };
      }

      const visible = availableSubjects.filter(s => s.isVisible);
      const visibleNames = visible.map(s => s.subject);

      return {
          gridSubjects: visibleNames.filter(s => !LANGUAGE_SUBJECTS.includes(s) && !ELECTIVE_SUBJECTS.includes(s)),
          langSubjects: visibleNames.filter(s => LANGUAGE_SUBJECTS.includes(s)),
          electiveSubjects: visibleNames.filter(s => ELECTIVE_SUBJECTS.includes(s))
      };
  }, [availableSubjects]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files);
  };

  const toggleOption = (key: string) => {
    setState({
      ...state,
      options: { ...state.options, [key]: !state.options[key as keyof typeof state.options] }
    });
  };

  const updateOptionValue = (key: string, value: any) => {
    setState({
        ...state,
        options: { ...state.options, [key]: value }
    });
  };

  const toggleOracyDomain = (domain: string) => {
      const current = state.options.oracyDomains || [];
      const updated = current.includes(domain) ? current.filter((d:string) => d !== domain) : [...current, domain];
      updateOptionValue('oracyDomains', updated);
  };

  const toggleOracyOption = (key: 'starters' | 'terms' | 'rules') => {
      setState({
          ...state,
          options: {
              ...state.options,
              oracyOptions: {
                  ...state.options.oracyOptions,
                  [key]: !state.options.oracyOptions?.[key]
              }
          }
      });
  };

  const handleReusePlan = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const planId = e.target.value;
      if (!planId) return;
      const plan = myPlans.find(p => p.id === planId);
      if (plan) {
          setState({
              ...state,
              subject: plan.subject,
              grade: plan.grade,
              topic: plan.topic + " (Kopi)",
              options: { ...state.options, ...(plan.task || {}) } // Attempt to merge task settings if stored
          });
      }
  };

  return (
    <Card className="space-y-8 flex flex-col min-h-fit border-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><PenTool size={24} /></div>
          <div className="space-y-0.5">
             <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">{t.step1}</h2>
             <p className="text-indigo-500 font-bold uppercase text-[9px] tracking-[0.2em]">{t.step1Sub}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           {myPlans.length > 0 && (
               <div className="relative w-full sm:w-auto">
                   <select onChange={handleReusePlan} className="w-full pl-8 pr-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-transparent hover:bg-white hover:border-indigo-200 outline-none transition-all appearance-none cursor-pointer">
                       <option value="">Gjenbruk plan...</option>
                       {myPlans.slice(0, 5).map(p => <option key={p.id} value={p.id}>{p.task.title || p.topic}</option>)}
                   </select>
                   <RefreshCw size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
           )}
           <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
               <button onClick={()=>setState({...state, languageForm: 'bokmål'})} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.languageForm==='bokmål'?'bg-white text-indigo-600 shadow-sm':'text-slate-500'}`}>Bokmål</button>
               <button onClick={()=>setState({...state, languageForm: 'nynorsk'})} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.languageForm==='nynorsk'?'bg-white text-indigo-600 shadow-sm':'text-slate-500'}`}>Nynorsk</button>
           </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* GRADE SELECTION */}
        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 text-indigo-800">
                <div className="p-2 bg-white rounded-xl shadow-sm"><GraduationCap size={24} /></div>
                <label className="text-xs font-black uppercase tracking-widest">{t.grade}</label>
            </div>
            <div className="relative flex-grow w-full">
                <select 
                    value={state.grade} 
                    onChange={e => setState({...state, grade: e.target.value})} 
                    className="w-full py-3 px-6 bg-white border-2 border-indigo-100 rounded-xl font-bold text-sm text-indigo-900 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm hover:border-indigo-300"
                >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none"/>
            </div>
        </div>

        {/* Subject Grid */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-1 flex items-center gap-2"><BookOpen size={12} /> {t.selectSubject}</label>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {gridSubjects.map((sub: string) => {
              const Icon = SUBJECT_ICONS[sub] || BookOpen;
              const isSelected = state.subject === sub;
              return (
                <button key={sub} onClick={() => setState({...state, subject: sub})} className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg transform scale-105' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:bg-white'}`}>
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="text-[9px] font-black uppercase leading-tight break-words w-full">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Subject Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 relative">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-2">{t.languageSubjectsLabel}</label>
             <div className="relative">
                <select value={langSubjects.includes(state.subject) ? state.subject : ''} onChange={e => setState({...state, subject: e.target.value})} className="w-full py-3 px-4 rounded-xl border-2 border-slate-50 bg-slate-50 font-bold text-xs outline-none focus:border-indigo-500 transition-all focus:bg-white appearance-none cursor-pointer shadow-sm"><option value="" disabled>Velg språk...</option>{langSubjects.sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
             </div>
          </div>
          <div className="space-y-1.5 relative">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-2">{t.electiveSubjectsLabel}</label>
             <div className="relative">
                <select value={electiveSubjects.includes(state.subject) ? state.subject : ''} onChange={e => setState({...state, subject: e.target.value})} className="w-full py-3 px-4 rounded-xl border-2 border-slate-50 bg-slate-50 font-bold text-xs outline-none focus:border-indigo-500 transition-all focus:bg-white appearance-none cursor-pointer shadow-sm"><option value="" disabled>Velg valgfag...</option>{electiveSubjects.sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
             </div>
          </div>
        </div>
      
        {/* --- CUSTOMIZATIONS SECTION --- */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-700">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Wand2 size={18} /></div>
                <h3 className="font-black uppercase text-xs tracking-widest">{t.kaiCustomizations}</h3>
            </div>

            {/* Differentiation Level Selector - NEW */}
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">{t.differentiationLevel}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { id: 'support', label: t.differentiationSupport, icon: CheckCircle2, desc: 'Forenklet språk, mer stillas' },
                        { id: 'standard', label: t.differentiationStandard, icon: BarChart, desc: 'Blandet nivå (Standard)' },
                        { id: 'challenge', label: t.differentiationChallenge, icon: Rocket, desc: 'Høyere nivå, mer refleksjon' }
                    ].map(lvl => (
                        <button 
                            key={lvl.id}
                            onClick={() => updateOptionValue('differentiationLevel', lvl.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all group flex flex-col gap-2 ${state.options.differentiationLevel === lvl.id ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-100' : 'bg-white/50 border-slate-200 hover:border-indigo-200'}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${state.options.differentiationLevel === lvl.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500'}`}>
                                    <lvl.icon size={16} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${state.options.differentiationLevel === lvl.id ? 'text-indigo-900' : 'text-slate-500'}`}>{lvl.label}</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-400 leading-tight">{lvl.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Learning Goals */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between items-center px-1">
                    <span className="flex items-center gap-2"><Target size={14} /> Antall læringsmål</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-slate-700">{state.options.learningGoalsAmount || 3}</span>
                </label>
                <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    value={state.options.learningGoalsAmount || 3} 
                    onChange={(e) => updateOptionValue('learningGoalsAmount', parseInt(e.target.value))} 
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
               <button 
                 onClick={() => toggleOption('generateWorksheet')}
                 className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${state.options.generateWorksheet ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}
               >
                 <FileText size={16} className="flex-shrink-0" /> <span className="truncate">{t.generateWorksheet}</span>
               </button>

               <button 
                 onClick={() => toggleOption('generateRubric')}
                 className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${state.options.generateRubric ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'}`}
               >
                 <ClipboardCheck size={16} className="flex-shrink-0" /> <span className="truncate">{t.generateRubric}</span>
               </button>

               <button 
                 onClick={() => toggleOption('includeOracy')}
                 className={`col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${state.options.includeOracy ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-pink-200'}`}
               >
                 <MessageCircle size={16} className="flex-shrink-0" /> <span className="truncate">{t.includeOracy}</span>
               </button>

               <button 
                 onClick={() => toggleOption('differentiatedTasks')}
                 className={`col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${state.options.differentiatedTasks ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200'}`}
               >
                 <Layers size={16} className="flex-shrink-0" /> <span className="truncate">Nivådelte oppgaver</span>
               </button>
            </div>

            {/* Detailed Configuration */}
            {(state.options.generateWorksheet || state.options.generateRubric || state.options.includeOracy) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
                    {state.options.generateWorksheet && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-3">
                            <label className="text-[9px] font-black uppercase text-blue-500 tracking-widest flex justify-between items-center">
                                <span>Antall oppgaver</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-blue-100">{state.options.worksheetAmount || 5}</span>
                            </label>
                            <input type="range" min="1" max="10" value={state.options.worksheetAmount || 5} onChange={(e) => updateOptionValue('worksheetAmount', parseInt(e.target.value))} className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                        </div>
                    )}
                    {state.options.generateRubric && (
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                            <label className="text-[9px] font-black uppercase text-emerald-500 tracking-widest flex justify-between items-center">
                                <span>Kriterier</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-emerald-100">{state.options.rubricCriteria || 4}</span>
                            </label>
                            <input type="range" min="2" max="6" value={state.options.rubricCriteria || 4} onChange={(e) => updateOptionValue('rubricCriteria', parseInt(e.target.value))} className="w-full h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"/>
                        </div>
                    )}
                    {state.options.includeOracy && (
                        <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 md:col-span-2 xl:col-span-1 flex flex-col gap-3">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'Fysisk', label: t.oracyPhysical },
                                    { id: 'Språklig', label: t.oracyLinguistic },
                                    { id: 'Kognitivt', label: t.oracyCognitive },
                                    { id: 'Sosialt', label: t.oracySocial }
                                ].map(domain => (
                                    <button key={domain.id} onClick={() => toggleOracyDomain(domain.id)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${state.options.oracyDomains?.includes(domain.id) ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-100 text-pink-300'}`}>{domain.label}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-pink-100">
                                {['starters', 'terms', 'rules'].map(k => (
                                    <label key={k} className="flex items-center gap-2 text-[9px] font-black text-pink-700 uppercase cursor-pointer select-none">
                                        <input type="checkbox" checked={state.options.oracyOptions?.[k]} onChange={() => toggleOracyOption(k as any)} className="w-3 h-3 accent-pink-600" />
                                        <span className="truncate">{k === 'starters' ? 'Startere' : k === 'terms' ? 'Begrep' : 'Regler'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-3">
               <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-2 flex justify-between"><span>{t.topicLabel}</span> <span className="text-[9px] opacity-60 text-red-400">{t.topicRequired}</span></label>
               <textarea 
                placeholder={t.topicPlaceholder}
                value={state.topic} 
                onChange={e => setState({...state, topic: e.target.value})} 
                className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner resize-none"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-2 flex items-center gap-2"><UploadCloud size={14}/> {t.imagesLabel}</label>
               <div className={`relative border-2 border-dashed rounded-[2rem] p-4 transition-all text-center h-32 flex flex-col justify-center ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`} onDragOver={handleDrag} onDrop={handleDrop}>
                 <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                 {state.uploadedImages.length === 0 ? (
                   <div className="space-y-1 pointer-events-none">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dropImages}</p>
                     <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{t.contextInfo}</p>
                   </div>
                 ) : (
                   <div className="flex gap-3 justify-center flex-wrap px-2 overflow-y-auto max-h-full">
                     {state.uploadedImages.map((img: any, i: number) => (
                       <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-md group z-20">
                         <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                         <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
        </div>
      </div>

      {/* Button with responsive behavior */}
      <div className="pt-4">
        <Button onClick={onNext} disabled={!state.subject || !state.topic} className="w-full" size="lg" icon={ArrowRight}>
            {t.fetchAimsBtn}
        </Button>
      </div>
    </Card>
  );
};

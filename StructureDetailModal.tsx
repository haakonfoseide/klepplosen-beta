
import React, { useState } from 'react';
import { X, Layers, ZoomIn, ZoomOut, Edit, Save, Plus, Trash2, Clock, Users, GraduationCap, Play, Monitor, ArrowRight, Lightbulb, ChevronRight, ChevronLeft, List } from 'lucide-react';
import { TimerComponent, SvgIllustration } from './CommonComponents';
import { CLStructure } from './types';
import { CATEGORY_COLORS } from './constants';

interface StructureDetailModalProps {
    structure: CLStructure;
    onClose: () => void;
    onSave: (updatedStructure: CLStructure) => Promise<void>;
    t: any;
    currentUser: any;
}

export const StructureDetailModal: React.FC<StructureDetailModalProps> = ({ structure, onClose, onSave, t, currentUser }) => {
    const [mode, setMode] = useState<'teacher' | 'student' | 'edit'>('teacher');
    const [editForm, setEditForm] = useState<CLStructure>(structure);
    const [studentFontScale, setStudentFontScale] = useState(1);
    
    // UX State for Teacher View
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [viewAllSteps, setViewAllSteps] = useState(false);

    const handleSave = async () => {
        await onSave(editForm);
        setMode('teacher');
    };

    const updateEditForm = (field: keyof CLStructure, value: any) => {
        setEditForm({ ...editForm, [field]: value });
    };

    const handleArrayUpdate = (field: 'steps' | 'studentInstructions' | 'tips', index: number, value: string) => {
        const arr = [...(editForm[field] || [])];
        arr[index] = value;
        updateEditForm(field, arr);
    };

    const addArrayItem = (field: 'steps' | 'studentInstructions' | 'tips') => {
        const arr = [...(editForm[field] || []), ""];
        updateEditForm(field, arr);
    };

    const removeArrayItem = (field: 'steps' | 'studentInstructions' | 'tips', index: number) => {
        const arr = [...(editForm[field] || [])].filter((_, i) => i !== index);
        updateEditForm(field, arr);
    };

    const catColor = (CATEGORY_COLORS as any)[structure.category || 'samtale'] || 'bg-indigo-100 text-indigo-700 border-indigo-200';
    const bgClass = catColor.split(' ')[0];
    const textClass = catColor.split(' ')[1];

    const totalSteps = structure.steps?.length || 0;

    const nextStep = () => {
        if (activeStepIndex < totalSteps - 1) setActiveStepIndex(prev => prev + 1);
    };

    const prevStep = () => {
        if (activeStepIndex > 0) setActiveStepIndex(prev => prev - 1);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 no-print animate-in fade-in duration-300">
            <div className={`bg-white w-full max-w-7xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 h-[90vh] relative`}>
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-white z-20">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${bgClass} ${textClass}`}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">{structure.name}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{structure.category}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {mode !== 'edit' && (
                            <div className="bg-slate-100 p-1 rounded-xl flex mr-4">
                                <button onClick={() => setMode('teacher')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <GraduationCap size={14}/> Lærer
                                </button>
                                <button onClick={() => setMode('student')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Monitor size={14}/> Storskjerm
                                </button>
                            </div>
                        )}
                        
                        {currentUser?.role === 'admin' && (
                            <button onClick={() => mode === 'edit' ? handleSave() : setMode('edit')} className={`p-3 rounded-xl transition-all ${mode === 'edit' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}>
                                {mode === 'edit' ? <Save size={18} /> : <Edit size={18} />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-grow overflow-hidden relative">
                    
                    {/* TEACHER VIEW */}
                    {mode === 'teacher' && (
                        <div className="h-full flex flex-col lg:flex-row overflow-hidden animate-in slide-in-from-right-4">
                            {/* Left Panel: Context & Visuals */}
                            <div className="lg:w-1/3 bg-slate-50/50 border-r border-slate-100 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 pb-32">
                                
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1">
                                        <Clock size={20} className="text-slate-300 mb-1" />
                                        <span className="text-lg font-black text-slate-700">{structure.durationMinutes} min</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tid</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1">
                                        <Users size={20} className="text-slate-300 mb-1" />
                                        <span className="text-lg font-black text-slate-700 capitalize">{structure.groupSize}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grupper</span>
                                    </div>
                                </div>

                                {/* Main Visual - Fixed container to show full image */}
                                <div className="bg-white rounded-[2.5rem] border-4 border-slate-100 p-10 flex flex-col items-center text-center shadow-sm relative overflow-visible group">
                                    <div className={`absolute top-0 left-0 w-full h-2 rounded-t-full ${bgClass}`}></div>
                                    <div className="w-full aspect-square flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                                        <SvgIllustration type={structure.illustrationType || 'circle'} color="#6366f1" className="w-full h-full" />
                                    </div>
                                    <h4 className="font-black uppercase text-xs tracking-widest text-slate-400 mt-6 mb-2">Formasjon</h4>
                                    <p className="text-sm font-medium text-slate-500 italic">"{structure.description}"</p>
                                </div>

                                {/* Pedagogical Purpose */}
                                <div className="space-y-3">
                                    <h4 className="font-black uppercase text-xs tracking-widest text-indigo-900 flex items-center gap-2">
                                        <Lightbulb size={16} className="text-amber-500" /> Pedagogisk Formål
                                    </h4>
                                    <div className="bg-indigo-50 p-5 rounded-2xl text-indigo-900 text-sm font-bold leading-relaxed border-l-4 border-indigo-400">
                                        {structure.bestFor && structure.bestFor.length > 0 
                                            ? structure.bestFor.join(". ") 
                                            : "Aktiviserer alle elever samtidig og sikrer likeverdig deltakelse."}
                                    </div>
                                </div>

                                <button onClick={() => setMode('student')} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 group">
                                    <Play size={16} fill="currentColor" /> Start Aktivitet <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>

                            {/* Right Panel: The Steps (Interactive Carousel) */}
                            <div className="lg:w-2/3 bg-white p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col h-full relative">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Gjennomføring</h3>
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                                            {viewAllSteps ? "Full oversikt" : `Steg ${activeStepIndex + 1} av ${totalSteps}`}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setViewAllSteps(!viewAllSteps)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    >
                                        <List size={14} /> {viewAllSteps ? "Vis Karusell" : "Vis Liste"}
                                    </button>
                                </div>

                                {viewAllSteps ? (
                                    // List View
                                    <div className="relative space-y-8 pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 animate-in fade-in pb-20">
                                        {(structure.steps || []).map((step, i) => (
                                            <div key={i} className="relative group">
                                                <div className="absolute -left-[34px] w-8 h-8 rounded-full bg-white border-4 border-indigo-100 flex items-center justify-center z-10 group-hover:border-indigo-500 transition-all">
                                                    <span className="font-black text-xs text-indigo-600">{i + 1}</span>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm group-hover:border-indigo-50 transition-all">
                                                    <p className="text-base font-bold text-slate-800 leading-relaxed">{step}</p>
                                                </div>
                                                {structure.tips && structure.tips[i] && (
                                                    <div className="mt-3 ml-4 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-300 text-amber-900 text-xs font-bold flex gap-3 items-start">
                                                        <Lightbulb size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                                                        <span>{structure.tips[i]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Carousel View (Focus Mode)
                                    <div className="flex-grow flex flex-col justify-center max-w-2xl mx-auto w-full pb-20">
                                        <div className="relative bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl p-8 sm:p-12 min-h-[300px] flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-300" key={activeStepIndex}>
                                            <div className="absolute -top-6 bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white transform rotate-3">
                                                {activeStepIndex + 1}
                                            </div>
                                            
                                            <p className="text-xl sm:text-2xl font-black text-slate-800 leading-relaxed mb-8">
                                                {structure.steps ? structure.steps[activeStepIndex] : "Ingen steg definert."}
                                            </p>

                                            {structure.tips && structure.tips[activeStepIndex] && (
                                                <div className="bg-amber-50 p-4 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-3 border border-amber-100 max-w-md mx-auto">
                                                    <Lightbulb size={18} className="flex-shrink-0 text-amber-500" />
                                                    <span>{structure.tips[activeStepIndex]}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Navigation Controls */}
                                        <div className="flex justify-between items-center mt-10 gap-4">
                                            <button 
                                                onClick={prevStep} 
                                                disabled={activeStepIndex === 0}
                                                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <ChevronLeft size={16} /> Forrige
                                            </button>
                                            
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalSteps }).map((_, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => setActiveStepIndex(idx)}
                                                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${idx === activeStepIndex ? 'bg-indigo-600 w-6' : 'bg-slate-200 hover:bg-indigo-300'}`}
                                                    />
                                                ))}
                                            </div>

                                            <button 
                                                onClick={nextStep} 
                                                disabled={activeStepIndex === totalSteps - 1}
                                                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                Neste <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STUDENT VIEW (PRESENTATION MODE) */}
                    {mode === 'student' && (
                        <div className="absolute inset-0 bg-indigo-950 flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Toolbar */}
                            <div className="absolute top-6 right-6 flex items-center gap-4 z-20 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 no-print">
                                <button onClick={() => setStudentFontScale(Math.max(0.4, studentFontScale - 0.1))} className="p-2 text-indigo-300 hover:text-white"><ZoomOut size={20}/></button>
                                <span className="text-xs font-black text-white w-8 text-center">{Math.round(studentFontScale*100)}%</span>
                                <button onClick={() => setStudentFontScale(Math.min(2, studentFontScale + 0.1))} className="p-2 text-indigo-300 hover:text-white"><ZoomIn size={20}/></button>
                            </div>

                            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 sm:p-16 flex flex-col items-center">
                                <div className="max-w-5xl w-full pb-20" style={{ gap: `${3 * studentFontScale}rem`, display: 'flex', flexDirection: 'column' }}>
                                    <div className="text-center space-y-6">
                                        <h2 className="font-black text-white uppercase tracking-tighter leading-none" style={{ fontSize: `${4 * studentFontScale}rem` }}>{structure.name}</h2>
                                        <div className="h-2 w-32 bg-amber-400 rounded-full mx-auto" style={{ height: `${0.5 * studentFontScale}rem`, width: `${8 * studentFontScale}rem` }}></div>
                                    </div>

                                    <div className="grid" style={{ gap: `${2 * studentFontScale}rem` }}>
                                        {(structure.studentInstructions || []).map((instr, i) => (
                                            <div 
                                                key={i} 
                                                className="flex items-start bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                                                style={{ 
                                                    padding: `${2 * studentFontScale}rem`, 
                                                    borderRadius: `${2 * studentFontScale}rem`,
                                                    gap: `${2 * studentFontScale}rem`
                                                }}
                                            >
                                                <div 
                                                    className="bg-amber-500 text-white flex items-center justify-center font-black shadow-lg flex-shrink-0" 
                                                    style={{ 
                                                        width: `${4 * studentFontScale}rem`, 
                                                        height: `${4 * studentFontScale}rem`, 
                                                        fontSize: `${1.5 * studentFontScale}rem`,
                                                        borderRadius: `${1 * studentFontScale}rem`
                                                    }}
                                                >
                                                    {i+1}
                                                </div>
                                                <p className="font-bold text-white leading-tight" style={{ fontSize: `${2.5 * studentFontScale}rem` }}>{instr}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center pt-10">
                                        <div style={{ transform: `scale(${1 + (studentFontScale - 1) * 0.5})` }}>
                                            <TimerComponent t={t} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EDIT MODE */}
                    {mode === 'edit' && (
                        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50 p-8 sm:p-14">
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Beskrivelse</label>
                                        <textarea className="w-full h-40 p-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-sm resize-none" value={editForm.description} onChange={e => updateEditForm('description', e.target.value)} />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kategori</label>
                                            <select className="w-full p-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold text-sm" value={editForm.category} onChange={e => updateEditForm('category', e.target.value as any)}>
                                                {['samtale', 'repetisjon', 'kunnskap', 'produksjon', 'teambygging'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tid (min)</label>
                                            <input type="number" className="w-full p-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold text-sm" value={editForm.durationMinutes} onChange={e => updateEditForm('durationMinutes', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {['steps', 'studentInstructions', 'tips'].map((field: any) => (
                                        <section key={field} className="space-y-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900">{field === 'steps' ? 'Steg for gjennomføring' : field === 'studentInstructions' ? 'Elevinstruksjoner' : 'Lærertips'}</h4>
                                                <button onClick={() => addArrayItem(field)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 flex items-center gap-1"><Plus size={12} /> Legg til</button>
                                            </div>
                                            <div className="space-y-3">
                                                {(editForm[field as keyof CLStructure] as string[] || []).map((item, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400 flex-shrink-0">{i+1}</div>
                                                        <textarea className="flex-grow p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium text-sm resize-none" rows={2} value={item} onChange={e => handleArrayUpdate(field, i, e.target.value)} />
                                                        <button onClick={() => removeArrayItem(field, i)} className="text-slate-300 hover:text-red-500 self-center"><Trash2 size={18} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Save, Maximize2, Minimize2, Play, Trash2 } from 'lucide-react';
import { generateFourCorners } from '../services/geminiService';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { useToast } from '../contexts/ToastContext';

export const FourCorners = ({ t, language }: any) => {
    const { addToast } = useToast();
    const [corners, setCorners] = useState(['Alternativ A', 'Alternativ B', 'Alternativ C', 'Alternativ D']);
    const [question, setQuestion] = useState('');
    const [mode, setMode] = useState<'input' | 'display'>('input');
    
    // AI Config
    const [grade, setGrade] = useState(GRADES[0]);
    const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // List Management
    const [savedSets, setSavedSets] = useState<{id: string, question: string, corners: string[]}[]>(() => {
        try {
            const saved = localStorage.getItem('cl_four_corners_sets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('cl_four_corners_sets', JSON.stringify(savedSets));
    }, [savedSets]);

    const cornerColors = [
        'bg-rose-500 border-rose-300 text-white',
        'bg-blue-500 border-blue-300 text-white', 
        'bg-emerald-500 border-emerald-300 text-white', 
        'bg-amber-500 border-amber-300 text-white'
    ];

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateFourCorners(subject, grade, topic, language);
            if (result) {
                setQuestion(result.question);
                const newCorners = [...result.corners, "", "", "", ""].slice(0, 4);
                setCorners(newCorners);
            }
        } catch (e) {
            addToast("Kunne ikke generere. Prøv igjen.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSet = () => {
        if (!question.trim()) return;
        const newSet = { id: Date.now().toString(), question, corners };
        setSavedSets([newSet, ...savedSets]);
    };

    const handleDeleteSet = (id: string) => {
        setSavedSets(savedSets.filter(s => s.id !== id));
    };

    const handleLoadSet = (set: any) => {
        setQuestion(set.question);
        setCorners(set.corners);
    };

    const handlePlaySet = (set: any) => {
        setQuestion(set.question);
        setCorners(set.corners);
        setMode('display');
    };

    if (mode === 'display') {
        return (
        <div className="flex flex-col h-full bg-slate-900 fixed inset-0 z-50">
            <div className="p-6 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/10">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight text-center w-full">{question || "Hva velger du?"}</h2>
            <button onClick={() => setMode('input')} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><Minimize2 size={24} /></button>
            </div>
            <div className="flex-grow grid grid-cols-2 h-full">
            {corners.map((c, i) => (
                <div key={i} className={`flex items-center justify-center p-8 text-center border-4 border-white/20 ${cornerColors[i]}`}>
                    <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight break-words">{c}</h3>
                </div>
            ))}
            </div>
        </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-full h-full">
            {/* AI GENERATOR SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 sm:p-6 rounded-[2rem] border border-slate-100">
                <select value={subject} onChange={e=>setSubject(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <select value={grade} onChange={e=>setGrade(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder={t.themePlaceholder} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0" />
                <button onClick={handleGenerate} disabled={isGenerating||!topic} className="p-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {t.generateContent}
                </button>
            </div>

            {/* EDITOR SECTION */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.questionPlaceholder}</label>
                <input 
                className="w-full p-6 text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 transition-all" 
                placeholder={t.questionPlaceholder} 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {corners.map((c, i) => (
                <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{t.corner} {i+1}</label>
                    <input 
                        className={`w-full p-4 font-bold border-l-8 rounded-2xl outline-none focus:shadow-lg transition-all ${cornerColors[i].replace('text-white', 'text-slate-800 bg-white border-opacity-50')}`} 
                        value={c} 
                        onChange={e => {
                        const newCorners = [...corners];
                        newCorners[i] = e.target.value;
                        setCorners(newCorners);
                        }} 
                    />
                </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={handleSaveSet} disabled={!question} className="flex-1 py-4 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-100 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16} /> {t.saveToList}
                </button>
                <button onClick={() => setMode('display')} className="flex-[2] py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                    <Maximize2 size={16} /> {t.showOnScreen}
                </button>
            </div>

            {/* SAVED LIST SECTION */}
            <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">{t.plannedQuestions} ({savedSets.length})</h4>
                {savedSets.length === 0 ? (
                    <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest">{t.noSavedQuestions}</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {savedSets.map((set) => (
                            <div key={set.id} className="p-4 bg-white border-2 border-slate-50 rounded-3xl flex items-center justify-between gap-4 shadow-sm hover:border-indigo-100 transition-all group">
                                <div className="min-w-0 flex-grow cursor-pointer" onClick={() => handleLoadSet(set)}>
                                    <p className="font-bold text-sm text-slate-700 truncate">{set.question}</p>
                                    <div className="flex gap-2 mt-1">
                                        {set.corners.map((c, i) => c && <span key={i} className="text-[9px] text-slate-400 truncate max-w-[60px] inline-block bg-slate-50 px-1.5 rounded">{c}</span>)}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handlePlaySet(set)} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md active:scale-95" title={t.showDirectly}>
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                    <button onClick={() => handleDeleteSet(set.id)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

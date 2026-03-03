import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../../services/storageService';
import { fetchSubjectCodeFromUDIR, fetchAllCompetenceAims } from '../../services/aiCurriculumService';
import { Loader2, Search, Save, RefreshCw, BookOpen, Trash2, Plus, Target, CheckCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { GRADES, DEFAULT_SUBJECT_CODES } from '../../constants';
import { Subject } from '../../types';

export const CurriculumManager: React.FC = () => {
    const [viewMode, setViewMode] = useState<'codes' | 'aims'>('aims');
    
    // Codes State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingSubject, setProcessingSubject] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, string>>({});

    // Aims Editing State
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>(GRADES[0]);
    const [loadingAims, setLoadingAims] = useState(false);
    const [aims, setAims] = useState<string[]>([]);
    const [aimsSaved, setAimsSaved] = useState(false);

    const loadSubjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await storageService.getUniqueSubjects();
            
            // Merge with defaults if not present in DB
            const merged: Subject[] = [...data].map(s => ({
                ...s,
                isVisible: s.isVisible ?? true // Default to visible if not set
            }));

            Object.keys(DEFAULT_SUBJECT_CODES).forEach(defSub => {
                if (!merged.find(s => s.subject === defSub)) {
                    merged.push({ 
                        subject: defSub, 
                        code: DEFAULT_SUBJECT_CODES[defSub],
                        isVisible: true
                    });
                }
            });
            
            // Sort
            merged.sort((a, b) => a.subject.localeCompare(b.subject));
            
            setSubjects(merged);
            if (!selectedSubject && merged.length > 0) setSelectedSubject(merged[0].subject);
            
            // Init edit state
            const initialEdits: Record<string, string> = {};
            merged.forEach(s => { initialEdits[s.subject] = s.code || ''; });
            setEditValues(initialEdits);
        } catch {
            console.error("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    }, [selectedSubject]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    // --- CODES LOGIC ---
    const handleAutoFetchCode = async (subject: string) => {
        setProcessingSubject(subject);
        try {
            const code = await fetchSubjectCodeFromUDIR(subject);
            if (code) {
                setEditValues(prev => ({ ...prev, [subject]: code }));
                await handleSaveCode(subject, code);
            }
        } catch (e) {
            alert(`Kunne ikke hente kode for ${subject}`);
        } finally {
            setProcessingSubject(null);
        }
    };

    const handleSaveCode = async (subject: string, code: string) => {
        setProcessingSubject(subject);
        try {
            await storageService.updateSubjectCode(subject, code);
            setSubjects(prev => prev.map(s => s.subject === subject ? { ...s, code } : s));
        } catch (e) {
            console.error("Failed to save code", e);
        } finally {
            setProcessingSubject(null);
        }
    };

    const handleToggleVisibility = async (subject: string, currentVisibility: boolean) => {
        setProcessingSubject(subject);
        try {
            const newVisibility = !currentVisibility;
            await storageService.updateSubjectVisibility(subject, newVisibility);
            setSubjects(prev => prev.map(s => s.subject === subject ? { ...s, isVisible: newVisibility } : s));
        } catch (e) {
            console.error("Failed to toggle visibility", e);
        } finally {
            setProcessingSubject(null);
        }
    };

    // --- AIMS LOGIC ---
    const handleFetchAims = useCallback(async () => {
        if (!selectedSubject || !selectedGrade) return;
        setLoadingAims(true);
        setAimsSaved(false);
        try {
            const result = await storageService.getCompetenceAims(selectedSubject, selectedGrade);
            setAims(result.map(r => r.text));
        } catch (e) {
            console.error("Failed to fetch aims", e);
            setAims([]);
        } finally {
            setLoadingAims(false);
        }
    }, [selectedSubject, selectedGrade]);

    const handleSaveAims = async () => {
        setLoadingAims(true);
        try {
            // Retrieve code if exists
            const subjectData = subjects.find(s => s.subject === selectedSubject);
            
            await storageService.upsertCompetenceAims({
                subject: selectedSubject,
                grade: selectedGrade,
                aims: aims.filter(a => a.trim().length > 0),
                code: subjectData?.code || undefined
            });
            setAimsSaved(true);
            setTimeout(() => setAimsSaved(false), 3000);
        } catch {
            alert("Kunne ikke lagre mål.");
        } finally {
            setLoadingAims(false);
        }
    };

    const updateAim = (index: number, val: string) => {
        const newAims = [...aims];
        newAims[index] = val;
        setAims(newAims);
        setAimsSaved(false);
    };

    const removeAim = (index: number) => {
        const newAims = aims.filter((_, i) => i !== index);
        setAims(newAims);
        setAimsSaved(false);
    };

    const addAim = () => {
        setAims([...aims, ""]);
        setAimsSaved(false);
    };

    const handleAutoFillAims = async () => {
        if (!selectedSubject || !selectedGrade) return;
        if (aims.length > 0 && !window.confirm("Dette vil overskrive eksisterende mål. Er du sikker?")) return;
        
        setLoadingAims(true);
        try {
            const newAims = await fetchAllCompetenceAims(selectedSubject, selectedGrade);
            if (newAims && newAims.length > 0) {
                setAims(newAims);
                setAimsSaved(false);
            } else {
                alert("Fant ingen mål for dette faget/trinnet.");
            }
        } catch (e) {
            console.error("Failed to fetch aims", e);
            alert("Kunne ikke hente mål.");
        } finally {
            setLoadingAims(false);
        }
    };

    // Auto-fetch aims when selection changes
    useEffect(() => {
        if (viewMode === 'aims' && selectedSubject) {
            handleFetchAims();
        }
    }, [selectedSubject, selectedGrade, viewMode, handleFetchAims]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in h-full">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('aims')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'aims' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Target size={14} className="inline mr-2" /> Kompetansemål
                    </button>
                    <button onClick={() => setViewMode('codes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'codes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <BookOpen size={14} className="inline mr-2" /> Fagkoder
                    </button>
                </div>
                <button onClick={loadSubjects} className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            {viewMode === 'aims' ? (
                <div className="flex flex-col gap-6 h-full">
                    {/* Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">Velg Fag</label>
                            <select 
                                value={selectedSubject} 
                                onChange={e => setSelectedSubject(e.target.value)} 
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                            >
                                {subjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2">Velg Trinn</label>
                            <select 
                                value={selectedGrade} 
                                onChange={e => setSelectedGrade(e.target.value)} 
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                            >
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Aims Editor */}
                    <div className="bg-slate-50 rounded-[2rem] border border-slate-100 flex-grow flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/50">
                            <h4 className="font-black uppercase text-xs tracking-widest text-slate-500 pl-2">Mål for {selectedGrade}</h4>
                            <div className="flex gap-2">
                                <button onClick={handleAutoFillAims} disabled={loadingAims} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50">
                                    <Sparkles size={14}/> Hent fra Udir (AI)
                                </button>
                                <button onClick={handleSaveAims} disabled={loadingAims} className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-md flex items-center gap-2 ${aimsSaved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}>
                                    {loadingAims ? <Loader2 size={14} className="animate-spin"/> : aimsSaved ? <CheckCircle size={14}/> : <Save size={14}/>}
                                    {aimsSaved ? 'Lagret!' : 'Lagre Endringer'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {loadingAims && aims.length === 0 ? (
                                <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin"/></div>
                            ) : (
                                <>
                                    {aims.map((aim, i) => (
                                        <div key={i} className="flex gap-2 group">
                                            <div className="flex-grow">
                                                <textarea 
                                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all resize-none"
                                                    rows={2}
                                                    value={aim}
                                                    onChange={(e) => updateAim(i, e.target.value)}
                                                />
                                            </div>
                                            <button onClick={() => removeAim(i)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-start mt-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={addAim} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                        <Plus size={14} /> Legg til nytt mål
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden flex-grow overflow-y-auto custom-scrollbar relative">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest">Fag</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest">Fagkode (Grep)</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Synlig</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Handling</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {subjects.map(item => {
                                const isProcessing = processingSubject === item.subject;
                                const hasChanged = editValues[item.subject] !== item.code && (editValues[item.subject] || item.code);
                                
                                return (
                                    <tr key={item.subject} className="group hover:bg-white transition-colors">
                                        <td className="p-6 font-bold text-sm text-slate-700">
                                            {item.subject}
                                        </td>
                                        <td className="p-6">
                                            <input 
                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-mono text-xs text-slate-600 focus:bg-white/50 p-1 transition-all"
                                                value={editValues[item.subject] || ''}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, [item.subject]: e.target.value }))}
                                                placeholder="F.eks. NOR1-06"
                                            />
                                        </td>
                                        <td className="p-6 text-center">
                                            <button 
                                                onClick={() => handleToggleVisibility(item.subject, item.isVisible)}
                                                disabled={isProcessing}
                                                className={`p-2 rounded-lg transition-all ${item.isVisible ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                title={item.isVisible ? "Synlig i planlegger" : "Skjult i planlegger"}
                                            >
                                                {isProcessing && processingSubject === item.subject ? <Loader2 size={16} className="animate-spin"/> : item.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </td>
                                        <td className="p-6 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleAutoFetchCode(item.subject)}
                                                disabled={isProcessing}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                                                title="Hent kode automatisk med AI"
                                            >
                                                {isProcessing ? <Loader2 size={14} className="animate-spin"/> : <Search size={14} />}
                                            </button>
                                            
                                            {hasChanged && (
                                                <button 
                                                    onClick={() => handleSaveCode(item.subject, editValues[item.subject])}
                                                    disabled={isProcessing}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50 animate-in zoom-in"
                                                    title="Lagre endring"
                                                >
                                                    <Save size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

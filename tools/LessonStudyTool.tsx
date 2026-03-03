
import React, { useState, useEffect, useRef } from 'react';
import { Microscope, ChevronLeft, ArrowRight, Save, Loader2, FileText, Search, BrainCircuit, Eye, MessageCircle, BarChart3, ExternalLink, Sparkles, BookOpen, GraduationCap, Clock, Plus, Trash2, Printer, Camera, X, FolderOpen, ListChecks, Mic, RotateCcw, TrendingUp, Users, User, Wifi, RefreshCw } from 'lucide-react';
import { SavedPlan, LessonStudyData, LessonStudySession } from '../types';
import { storageService, supabase } from '../services/storageService';
import { analyzeLessonStudyObservation, generateLessonStudyQuestions, findPedagogicalResearch, generateLessonStudyMeasures, generateObservationChecklist, generateInterviewQuestions } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { COMMON_SUBJECTS, GRADES } from '../constants';

interface LessonStudyToolProps {
    t: any;
    onBack: () => void;
    currentUser?: any;
}

const createNewSession = (index: number): LessonStudySession => ({
    id: crypto.randomUUID(),
    name: `Time ${index + 1}`,
    targets: [],
    generalNotes: '',
    timeLog: [],
    images: [],
    checklist: []
});

const INITIAL_LS_DATA: LessonStudyData = {
    step: 1,
    subject: COMMON_SUBJECTS[0],
    grade: GRADES[5],
    topic: '',
    researchQuestion: '',
    researchNotes: '',
    researchLinks: [],
    gapAnalysis: { currentSituation: '', desiredSituation: '', gap: '', teacherLearningGoal: '', studentLearningGoal: '' },
    planning: { lessonName: '', description: '', curriculumLinks: '', prediction: '' },
    observation: { sessions: [createNewSession(0)] },
    reflection: { significantFindings: '', studentQuotes: '', ethicalDilemmas: '', practiceChanges: '', interviewQuestions: [], interviewNotes: '' }
};

export const LessonStudyTool: React.FC<LessonStudyToolProps> = ({ t, onBack, currentUser }) => {
    const { addToast } = useToast();
    
    const [mode, setMode] = useState<'dashboard' | 'workspace' | 'report'>('dashboard');
    const [projects, setProjects] = useState<SavedPlan[]>([]);
    const [currentProject, setCurrentProject] = useState<SavedPlan | null>(null);
    const [data, setData] = useState<LessonStudyData>(INITIAL_LS_DATA);
    const [activeSessionIndex, setActiveSessionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Collaboration State
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLive, setIsLive] = useState(false);
    const autoSaveTimerRef = useRef<any>(null);
    const subscriptionRef = useRef<any>(null);
    const isRemoteUpdate = useRef(false); // Flag to prevent auto-save loop on remote updates

    // AI Assistance
    const [aiAnalysis, setAiAnalysis] = useState<{analysis: string, advice: string} | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [questionSuggestions, setQuestionSuggestions] = useState<string[]>([]);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [isSearchingResearch, setIsSearchingResearch] = useState(false);
    const [isGeneratingMeasures, setIsGeneratingMeasures] = useState(false);
    const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
    const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);

    // UI States
    const [logInput, setLogInput] = useState('');
    const [showResourceModal, setShowResourceModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [resourceFiles, setResourceFiles] = useState<{name: string, url: string}[]>([]);

    useEffect(() => {
        loadProjects();
        loadResources();
        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    // Ensure session structure exists when loading old data
    useEffect(() => {
        if (data && (!data.observation.sessions || data.observation.sessions.length === 0)) {
            setData(prev => ({
                ...prev,
                observation: {
                    ...prev.observation,
                    sessions: [createNewSession(0)]
                }
            }));
        }
    }, [data]);

    // --- AUTO SAVE & REALTIME SYNC LOGIC ---
    
    // Subscribe when a project is opened
    useEffect(() => {
        if (currentProject && currentProject.id) {
            // Unsubscribe previous
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

            // Subscribe new
            const sub = storageService.subscribeToPlan(currentProject.id, (remotePlan) => {
                // Check if the update is newer or different to avoid overwriting local work instantly if conflict
                // For this implementation, we assume "Last Write Wins" from DB to sync everyone
                if (remotePlan.task.lessonStudy) {
                    isRemoteUpdate.current = true; // Set flag to block auto-save triggering
                    setData(remotePlan.task.lessonStudy);
                    setLastSaved(new Date());
                    // Reset flag after a short delay to allow rendering
                    setTimeout(() => { isRemoteUpdate.current = false; }, 500);
                }
            });
            subscriptionRef.current = sub;
            setIsLive(true);
        } else {
            setIsLive(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject?.id]);

    // Auto-save Effect
    useEffect(() => {
        if (!currentProject || mode !== 'workspace' || isRemoteUpdate.current) return;

        // Debounce save
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        setIsAutoSaving(true);
        autoSaveTimerRef.current = setTimeout(async () => {
            await saveProject(true); // silent save
            setIsAutoSaving(false);
        }, 2000); // Save 2 seconds after last change

        return () => clearTimeout(autoSaveTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, mode]); // Trigger on data change

    const activeSession = data.observation.sessions?.[activeSessionIndex] || createNewSession(0);

    const loadProjects = async () => {
        if (!currentUser) return;
        setLoading(true);
        const allPlans = await storageService.getMyPlans(currentUser.id);
        const lsPlans = allPlans.filter(p => p.task.planType === 'lesson_study');
        setProjects(lsPlans);
        setLoading(false);
    };

    const loadResources = async () => {
        const { data } = await supabase.storage.from('lesson-study').list();
        if (data) {
            const files = data.map(f => ({
                name: f.name,
                url: supabase.storage.from('lesson-study').getPublicUrl(f.name).data.publicUrl
            }));
            setResourceFiles(files);
        }
    };

    const createNewProject = () => {
        const newProject: SavedPlan = {
            id: crypto.randomUUID(),
            task: {
                title: 'Nytt Lesson Study Prosjekt',
                description: 'Utviklingsarbeid',
                planType: 'lesson_study',
                lessonStudy: INITIAL_LS_DATA
            } as any,
            subject: 'Skoleutvikling',
            grade: 'Lærerteam',
            topic: 'Lesson Study',
            date: new Date().toLocaleDateString('no-NO'),
            creator: currentUser?.name || 'Lærer',
            creatorId: currentUser?.id || '',
            isShared: false,
            isImported: false,
            likes: 0,
            likedBy: []
        };
        setCurrentProject(newProject);
        setData(INITIAL_LS_DATA);
        setActiveSessionIndex(0);
        setQuestionSuggestions([]);
        setMode('workspace');
    };

    const startNextCycle = async () => {
        if (!currentProject || !data.reflection.practiceChanges) {
            addToast("Kan ikke starte ny syklus uten konklusjon.", 'warning');
            return;
        }

        const newTitle = `Syklus 2: ${data.planning.lessonName || data.topic}`;
        const newGapCurrent = `Basert på forrige syklus: ${data.reflection.significantFindings}`;
        const newPrediction = `Vi tror at ved å innføre "${data.reflection.practiceChanges}" vil vi se...`;

        const nextCycleData: LessonStudyData = {
            ...INITIAL_LS_DATA,
            step: 1,
            subject: data.subject,
            grade: data.grade,
            topic: data.topic,
            researchQuestion: data.researchQuestion, // Ofte samme forskningsspørsmål, men ny hypotese
            gapAnalysis: {
                ...INITIAL_LS_DATA.gapAnalysis,
                currentSituation: newGapCurrent,
                desiredSituation: data.gapAnalysis.desiredSituation // Målet er ofte det samme
            },
            planning: {
                ...INITIAL_LS_DATA.planning,
                lessonName: newTitle,
                prediction: newPrediction
            },
            observation: { sessions: [createNewSession(0)] }
        };

        const newProject: SavedPlan = {
            id: crypto.randomUUID(),
            task: {
                title: newTitle,
                description: 'Oppfølgingssyklus',
                planType: 'lesson_study',
                lessonStudy: nextCycleData
            } as any,
            subject: data.subject || 'Skoleutvikling',
            grade: data.grade || 'Lærerteam',
            topic: data.topic || 'Lesson Study',
            date: new Date().toLocaleDateString('no-NO'),
            creator: currentUser?.name || 'Lærer',
            creatorId: currentUser?.id || '',
            isShared: false,
            isImported: false,
            likes: 0,
            likedBy: []
        };

        await storageService.savePlan(newProject);
        setCurrentProject(newProject);
        setData(nextCycleData);
        setActiveSessionIndex(0);
        addToast("Ny syklus opprettet!", 'success');
        loadProjects();
    };

    const openProject = (p: SavedPlan) => {
        setCurrentProject(p);
        const loadedData = p.task.lessonStudy || INITIAL_LS_DATA;
        if (!loadedData.observation.sessions) {
            loadedData.observation.sessions = [createNewSession(0)];
        }
        setData(loadedData);
        setActiveSessionIndex(0);
        setQuestionSuggestions([]);
        setMode('workspace');
    };

    const saveProject = async (silent = false) => {
        if (!currentProject || !currentUser) return;
        
        const updatedProject = {
            ...currentProject,
            task: {
                ...currentProject.task,
                title: data.planning.lessonName || data.topic || currentProject.task.title,
                lessonStudy: data
            },
            subject: data.subject || currentProject.subject,
            grade: data.grade || currentProject.grade,
            topic: data.topic || currentProject.topic
        };

        await storageService.savePlan(updatedProject);
        setLastSaved(new Date());
        
        if (!silent) {
            addToast("Prosjekt lagret!", 'success');
            setCurrentProject(updatedProject);
            loadProjects();
        }
    };

    const deleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Er du sikker på at du vil slette dette prosjektet?")) return;
        try {
            await storageService.deletePlan(id);
            addToast("Prosjekt slettet", 'info');
            loadProjects();
        } catch (error) { addToast("Kunne ikke slette prosjektet", 'error'); }
    };

    // --- SESSION MGMT ---
    const addSession = () => {
        setData(prev => ({
            ...prev,
            observation: {
                ...prev.observation,
                sessions: [...prev.observation.sessions, createNewSession(prev.observation.sessions.length)]
            }
        }));
        setActiveSessionIndex(data.observation.sessions.length);
    };

    const updateActiveSession = (updates: Partial<LessonStudySession>) => {
        const newSessions = [...data.observation.sessions];
        newSessions[activeSessionIndex] = { ...newSessions[activeSessionIndex], ...updates };
        setData(prev => ({ ...prev, observation: { ...prev.observation, sessions: newSessions } }));
    };

    const addTarget = (type: 'student' | 'group') => {
        const newTarget = {
            id: crypto.randomUUID(),
            name: type === 'student' ? 'Elev X' : `Gruppe ${activeSession.targets.filter(t => t.type === 'group').length + 1}`,
            type,
            notes: ''
        };
        updateActiveSession({ targets: [...activeSession.targets, newTarget] });
    };

    const updateTarget = (id: string, field: string, value: string) => {
        const newTargets = activeSession.targets.map(t => t.id === id ? { ...t, [field]: value } : t);
        updateActiveSession({ targets: newTargets });
    };

    const removeTarget = (id: string) => {
        if(!confirm("Slett dette observasjonsobjektet?")) return;
        updateActiveSession({ targets: activeSession.targets.filter(t => t.id !== id) });
    };

    // --- AI Handlers ---
    const handleGenerateQuestions = async () => {
        if (!data.subject || !data.topic || !data.grade) { addToast("Vennligst fyll ut Fag, Trinn og Tema først.", 'warning'); return; }
        setIsGeneratingQuestions(true);
        try {
            const qs = await generateLessonStudyQuestions(data.subject, data.topic, data.grade, 'nynorsk');
            setQuestionSuggestions(qs);
        } catch (e) { addToast("Kunne ikke generere forslag.", 'error'); } finally { setIsGeneratingQuestions(false); }
    };

    const handleFetchResearch = async () => {
        if (!data.subject || !data.topic) { addToast("Angi fag og tema for å finne forskning.", 'warning'); return; }
        setIsSearchingResearch(true);
        try {
            const research = await findPedagogicalResearch(data.subject, data.topic, data.grade || '', 'nynorsk');
            setData(prev => ({ ...prev, researchNotes: research.text, researchLinks: research.links }));
        } catch (e) { addToast("Kunne ikke hente forskning.", 'error'); } finally { setIsSearchingResearch(false); }
    };

    const handleAIAnalyzeObservation = async () => {
        if (!data.planning.prediction || !activeSession.generalNotes) { addToast("Fyll ut prediksjon og observasjon først.", 'warning'); return; }
        setIsAiThinking(true);
        const res = await analyzeLessonStudyObservation(data.planning.prediction, activeSession.generalNotes, data.planning.description, 'nynorsk');
        setAiAnalysis(res);
        setIsAiThinking(false);
    };

    const handleGenerateMeasures = async () => {
        if (!data.reflection.significantFindings) { addToast("Beskriv funn først.", 'warning'); return; }
        setIsGeneratingMeasures(true);
        try {
            const advice = await generateLessonStudyMeasures(data.reflection.significantFindings, 'nynorsk');
            setData(prev => ({ ...prev, reflection: { ...prev.reflection, practiceChanges: advice } }));
        } catch(e) { addToast("Kunne ikke generere tiltak", 'error'); } finally { setIsGeneratingMeasures(false); }
    };

    const handleGenerateChecklist = async () => {
        if (!data.researchQuestion || !data.planning.prediction) { addToast("Trenger forskningsspørsmål og prediksjon.", 'warning'); return; }
        setIsGeneratingChecklist(true);
        try {
            const items = await generateObservationChecklist(data.researchQuestion, data.planning.prediction, 'nynorsk');
            updateActiveSession({ checklist: items });
        } catch(e) { addToast("Feil ved generering.", 'error'); } finally { setIsGeneratingChecklist(false); }
    };

    const handleGenerateInterview = async () => {
        if (!data.researchQuestion) { addToast("Mangler forskningsspørsmål.", 'warning'); return; }
        setIsGeneratingInterview(true);
        try {
            const qs = await generateInterviewQuestions(data.researchQuestion, data.grade || 'elever', 'nynorsk');
            setData(prev => ({ ...prev, reflection: { ...prev.reflection, interviewQuestions: qs } }));
        } catch(e) { addToast("Feil ved generering.", 'error'); } finally { setIsGeneratingInterview(false); }
    };

    const incrementChecklist = (index: number) => {
        const newList = [...(activeSession.checklist || [])];
        newList[index].count += 1;
        updateActiveSession({ checklist: newList });
    };
    
    const decrementChecklist = (index: number) => {
        const newList = [...(activeSession.checklist || [])];
        if (newList[index].count > 0) {
            newList[index].count -= 1;
            updateActiveSession({ checklist: newList });
        }
    };

    const addLogEntry = () => {
        if (!logInput.trim()) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
        const newEntry = { time: timeStr, step: 'observasjon', predicted: '', observed: logInput };
        const newLog = [...(activeSession.timeLog || []), newEntry];
        updateActiveSession({ timeLog: newLog });
        setLogInput('');
    };

    const deleteLogEntry = (index: number) => {
        const newLog = [...(activeSession.timeLog || [])];
        newLog.splice(index, 1);
        updateActiveSession({ timeLog: newLog });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                const newImage = { data: base64, mimeType: file.type };
                updateActiveSession({ images: [...(activeSession.images || []), newImage] });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        updateActiveSession({ images: (activeSession.images || []).filter((_, i) => i !== index) });
    };

    const renderStep = () => {
        // ... (Step 1, 2, 3 content remains same, just returned inside switch)
        switch (data.step) {
            case 1: return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 text-teal-700"><Search size={24} /><h3 className="text-xl font-black uppercase tracking-tight">Fase 1: GAP-analyse & Planlegging</h3></div>
                    <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1">Fag</label><select value={data.subject} onChange={e => setData({...data, subject: e.target.value})} className="w-full p-3 rounded-2xl border-0 shadow-sm text-sm font-bold bg-white outline-none focus:ring-2 ring-teal-200">{COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1">Trinn</label><select value={data.grade} onChange={e => setData({...data, grade: e.target.value})} className="w-full p-3 rounded-2xl border-0 shadow-sm text-sm font-bold bg-white outline-none focus:ring-2 ring-teal-200">{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1">Tema</label><input value={data.topic} onChange={e => setData({...data, topic: e.target.value})} placeholder="Tema..." className="w-full p-3 rounded-2xl border-0 shadow-sm text-sm font-bold bg-white outline-none focus:ring-2 ring-teal-200" /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">GAP-Analyse</h4>
                            <textarea className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-0 resize-none" rows={3} value={data.gapAnalysis.currentSituation} onChange={e => setData({...data, gapAnalysis: {...data.gapAnalysis, currentSituation: e.target.value}})} placeholder="Nå-situasjon..." />
                            <textarea className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-0 resize-none" rows={3} value={data.gapAnalysis.desiredSituation} onChange={e => setData({...data, gapAnalysis: {...data.gapAnalysis, desiredSituation: e.target.value}})} placeholder="Ønsket situasjon..." />
                            <div className="space-y-2"><label className="text-xs font-bold text-teal-600">Forskningsspørsmål</label><div className="flex gap-2"><input className="w-full p-4 bg-teal-50 rounded-2xl text-sm font-bold border-0" value={data.researchQuestion} onChange={e => setData({...data, researchQuestion: e.target.value})} placeholder="Hva vil vi undersøke?" /><button onClick={handleGenerateQuestions} disabled={isGeneratingQuestions || !data.topic} className="p-3 bg-teal-600 text-white rounded-xl shadow-lg">{isGeneratingQuestions ? <Loader2 className="animate-spin"/> : <Sparkles/>}</button></div></div>
                            {questionSuggestions.length > 0 && <div className="grid gap-2">{questionSuggestions.map((q,i)=><button key={i} onClick={()=>setData({...data, researchQuestion: q})} className="text-left p-3 rounded-xl bg-teal-50 text-xs font-bold text-teal-800 hover:bg-teal-100">{q}</button>)}</div>}
                        </div>
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
                                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Planlegging</h4>
                                <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-0" value={data.planning.lessonName} onChange={e => setData({...data, planning: {...data.planning, lessonName: e.target.value}})} placeholder="Navn på time..." />
                                <textarea className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-0 resize-none" rows={3} value={data.planning.description} onChange={e => setData({...data, planning: {...data.planning, description: e.target.value}})} placeholder="Beskrivelse..." />
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><label className="text-xs font-bold text-indigo-600 flex items-center gap-2 mb-2"><BrainCircuit size={14}/> Predikering (Viktig!)</label><textarea className="w-full p-3 bg-white rounded-xl text-sm font-medium border-0 resize-none" rows={3} value={data.planning.prediction} onChange={e => setData({...data, planning: {...data.planning, prediction: e.target.value}})} placeholder="Hva tror vi skjer?" /></div>
                            </div>
                            <div className="bg-sky-50 p-8 rounded-[2.5rem] border border-sky-100 shadow-xl space-y-4">
                                <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-sky-800 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={18}/> Teori</h4><button onClick={handleFetchResearch} disabled={isSearchingResearch} className="p-2 bg-white text-sky-600 rounded-xl shadow-sm">{isSearchingResearch ? <Loader2 className="animate-spin" size={14}/> : <BookOpen size={14}/>}</button></div>
                                <textarea className="w-full p-4 bg-white rounded-2xl text-sm font-medium border-0 resize-none h-24" value={data.researchNotes} onChange={e => setData({...data, researchNotes: e.target.value})} placeholder="Notater / AI funn..." />
                                {data.researchLinks && <div className="flex flex-wrap gap-2">{data.researchLinks.map((l,i)=><a key={i} href={l.url} target="_blank" className="text-[10px] bg-white px-2 py-1 rounded border border-sky-200 text-sky-600 truncate max-w-[200px]">{l.title}</a>)}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3 text-amber-700">
                            <Eye size={24} /><h3 className="text-xl font-black uppercase tracking-tight">Fase 2: Observasjon</h3>
                        </div>
                        {/* Session Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto max-w-xs">
                            {data.observation.sessions.map((s, i) => (
                                <button 
                                    key={s.id} 
                                    onClick={() => setActiveSessionIndex(i)} 
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === activeSessionIndex ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {s.name}
                                </button>
                            ))}
                            <button onClick={addSession} className="px-2 rounded-lg hover:bg-slate-200 text-slate-400"><Plus size={14}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Live Logger & Checklist */}
                        <div className="space-y-6">
                            <div className="bg-amber-50 p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-black text-sm text-amber-800 uppercase tracking-widest flex items-center gap-2"><Clock size={16}/> Live-Logg ({activeSession.name})</h4>
                                    <span className="text-[9px] font-bold text-amber-500 bg-white px-2 py-1 rounded-lg">Enter for å lagre</span>
                                </div>
                                <div className="flex gap-2"><input value={logInput} onChange={e => setLogInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLogEntry()} placeholder={`Logghendelse for ${activeSession.name}...`} className="flex-grow p-4 rounded-2xl border-0 shadow-inner bg-white font-bold text-sm outline-none focus:ring-2 ring-amber-300"/><button onClick={addLogEntry} disabled={!logInput} className="p-4 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 shadow-md active:scale-95 disabled:opacity-50"><Plus size={20}/></button></div>
                                <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">{activeSession.timeLog?.map((log, i) => (<div key={i} className="bg-white p-3 rounded-xl border border-amber-50 flex gap-3 items-start group"><span className="text-[10px] font-black text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">{log.time}</span><p className="text-xs font-bold text-slate-700 flex-grow">{log.observed}</p><button onClick={() => deleteLogEntry(i)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button></div>))}</div>
                            </div>

                            {/* Structured Checklist */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-black text-sm text-slate-600 uppercase tracking-widest flex items-center gap-2"><ListChecks size={16}/> Tellekorps</h4>
                                    <button onClick={handleGenerateChecklist} disabled={isGeneratingChecklist} className="text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex gap-1 items-center">{isGeneratingChecklist ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Generer fra prediksjon</button>
                                </div>
                                {(!activeSession.checklist || activeSession.checklist.length === 0) ? (
                                    <div className="text-center py-6 opacity-40"><p className="text-xs font-bold uppercase tracking-widest">Ingen indikatorer laget</p></div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {activeSession.checklist.map((item, i) => (
                                            <div key={i} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-between gap-3 shadow-sm hover:border-indigo-100 transition-all">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase text-center leading-tight h-8 flex items-center justify-center">{item.item}</p>
                                                <div className="flex items-center gap-4 w-full justify-between bg-white rounded-xl p-1 border border-slate-100">
                                                    <button onClick={() => decrementChecklist(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all"><X size={14}/></button>
                                                    <span className="text-2xl font-black text-indigo-600">{item.count}</span>
                                                    <button onClick={() => incrementChecklist(i)} className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg active:scale-95 transition-all shadow-sm"><Plus size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bilder</label><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"><Camera size={14}/> Last opp</button><input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} multiple /></div>
                                {activeSession.images && activeSession.images.length > 0 && <div className="flex gap-4 overflow-x-auto pb-2">{activeSession.images.map((img, i) => (<div key={i} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden group border border-slate-200 shadow-sm"><img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" /><button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button></div>))}</div>}
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 block">Generelle Notater ({activeSession.name})</label>
                                <textarea className="w-full h-24 p-4 bg-slate-50 rounded-xl text-sm font-medium border-0 focus:ring-2 ring-amber-100" value={activeSession.generalNotes} onChange={e => updateActiveSession({ generalNotes: e.target.value })} placeholder="Oppsummering..." />
                            </div>
                        </div>

                        {/* Focus Students & Groups */}
                        <div className="space-y-6">
                            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-800 mb-2"><BrainCircuit size={18} /><h4 className="font-black text-xs uppercase tracking-widest">Prediksjon</h4></div>
                                <p className="text-sm font-medium text-slate-600 bg-white p-4 rounded-xl border border-indigo-50 shadow-sm italic">"{data.planning.prediction}"</p>
                            </div>
                            
                            <div className="flex justify-between items-center px-1">
                                <h4 className="font-black text-sm text-slate-600 uppercase tracking-widest">Observasjonsobjekter</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => addTarget('group')} className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"><Users size={12}/> Gruppe</button>
                                    <button onClick={() => addTarget('student')} className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"><User size={12}/> Elev</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {activeSession.targets.map((target) => (
                                    <div key={target.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 group">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                {target.type === 'group' ? <Users size={14} className="text-indigo-400"/> : <User size={14} className="text-emerald-400"/>}
                                                <input 
                                                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-transparent outline-none border-b border-transparent focus:border-slate-300" 
                                                    value={target.name} 
                                                    onChange={e => updateTarget(target.id, 'name', e.target.value)}
                                                />
                                            </div>
                                            <button onClick={() => removeTarget(target.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                                        </div>
                                        <textarea 
                                            className="w-full h-20 p-3 bg-slate-50 rounded-xl text-xs font-medium border-0 resize-none focus:bg-white focus:ring-1 ring-slate-200 transition-all" 
                                            value={target.notes} 
                                            onChange={e => updateTarget(target.id, 'notes', e.target.value)} 
                                            placeholder={`Observasjoner for ${target.name}...`} 
                                        />
                                    </div>
                                ))}
                                {activeSession.targets.length === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ingen objekter valgt</p>
                                        <p className="text-[10px] text-slate-300 mt-1">Legg til en gruppe eller elev for å observere.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 3: return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3 text-indigo-700"><BarChart3 size={24} /><h3 className="text-xl font-black uppercase tracking-tight">Fase 3: Refleksjon & Analyse</h3></div></div>
                    
                    {/* Visual Data Dashboard */}
                    {data.observation.sessions.some(s => s.checklist.length > 0) && (
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-bottom-2">
                            <h4 className="font-black text-sm text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16}/> Data fra Tellekorpset (Totalt)</h4>
                            <div className="flex items-end gap-4 h-40 px-4">
                                {data.observation.sessions[0].checklist.map((item, i) => {
                                    // Aggregate count across sessions
                                    const totalCount = data.observation.sessions.reduce((acc, s) => acc + (s.checklist[i]?.count || 0), 0);
                                    const max = Math.max(1, ...data.observation.sessions[0].checklist.map((_, idx) => data.observation.sessions.reduce((acc, s) => acc + (s.checklist[idx]?.count || 0), 0)));
                                    const height = Math.max(10, (totalCount / max) * 100);
                                    
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full bg-indigo-100 rounded-t-xl overflow-hidden transition-all group-hover:bg-indigo-200" style={{ height: `${height}%` }}>
                                                <div className="absolute inset-x-0 bottom-0 top-0 bg-indigo-500 opacity-20"></div>
                                                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-black text-indigo-900">{totalCount}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase text-center leading-tight">{item.item}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">Funn & Bevis</h4>
                                <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 ring-indigo-100" rows={4} value={data.reflection.significantFindings} onChange={e => setData({...data, reflection: {...data.reflection, significantFindings: e.target.value}})} placeholder="Hva var det viktigste vi lærte?" />
                                <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 ring-indigo-100" rows={3} value={data.reflection.studentQuotes} onChange={e => setData({...data, reflection: {...data.reflection, studentQuotes: e.target.value}})} placeholder="Elevsitater..." />
                            </div>
                            
                            <div className="bg-sky-50 p-6 rounded-[2rem] border border-sky-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-sky-800 uppercase tracking-widest flex items-center gap-2"><Mic size={16}/> Elevstemmen (Intervju)</h4>
                                    <button onClick={handleGenerateInterview} disabled={isGeneratingInterview} className="px-3 py-1.5 bg-white text-sky-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-sky-100 flex gap-1 items-center">{isGeneratingInterview ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Generer Spørsmål</button>
                                </div>
                                {data.reflection.interviewQuestions && data.reflection.interviewQuestions.length > 0 && (
                                    <div className="space-y-2">
                                        {data.reflection.interviewQuestions.map((q, i) => (
                                            <div key={i} className="p-3 bg-white rounded-xl border border-sky-100 text-xs font-bold text-sky-900">{q}</div>
                                        ))}
                                    </div>
                                )}
                                <textarea className="w-full p-4 bg-white rounded-xl text-sm font-medium border-0 focus:ring-2 ring-sky-200 resize-none" rows={4} value={data.reflection.interviewNotes} onChange={e => setData({...data, reflection: {...data.reflection, interviewNotes: e.target.value}})} placeholder="Notater fra elevintervjuet..." />
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-emerald-800 uppercase tracking-widest flex items-center gap-2"><ArrowRight size={16}/> Endring av praksis</h4>
                                    <button onClick={handleGenerateMeasures} disabled={isGeneratingMeasures || !data.reflection.significantFindings} className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-white hover:bg-emerald-100 px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50">{isGeneratingMeasures ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Foreslå tiltak</button>
                                </div>
                                <textarea className="w-full p-4 bg-white rounded-xl text-sm font-medium border-0 focus:ring-2 ring-emerald-200" rows={4} value={data.reflection.practiceChanges} onChange={e => setData({...data, reflection: {...data.reflection, practiceChanges: e.target.value}})} placeholder="Hvordan endrer dette vår undervisning?" />
                            </div>

                            {/* Cycle Button */}
                            <button onClick={startNextCycle} disabled={!data.reflection.practiceChanges} className="w-full py-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                <RotateCcw size={18} /> Start ny syklus basert på funn
                            </button>
                        </div>

                        {/* AI Analysis Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg">
                                <div className="flex items-center gap-3 mb-4"><Sparkles size={20} className="text-yellow-300" /><h4 className="font-black uppercase text-xs tracking-widest">Kai Analyserer</h4></div>
                                {aiAnalysis ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Analyse</p><p className="text-sm font-medium leading-relaxed">{aiAnalysis.analysis}</p></div>
                                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Råd</p><p className="text-sm font-bold leading-relaxed text-yellow-100 italic">"{aiAnalysis.advice}"</p></div>
                                        <button onClick={() => setAiAnalysis(null)} className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase transition-all">Ny analyse</button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 space-y-4"><p className="text-xs font-medium opacity-80 leading-relaxed">Få hjelp til å tolke gapet.</p><button onClick={handleAIAnalyzeObservation} disabled={isAiThinking} className="w-full py-3 bg-white text-indigo-900 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">{isAiThinking ? <Loader2 className="animate-spin" size={14}/> : <MessageCircle size={14}/>} Analyser Funn</button></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    if (mode === 'report') {
        // ... (Report rendering code stays same)
        return (
            <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in fade-in">
                <div className="max-w-4xl mx-auto p-8 sm:p-16 min-h-screen relative print:p-0">
                    <button onClick={() => setMode('workspace')} className="fixed top-6 right-6 p-3 bg-slate-100 rounded-full hover:bg-slate-200 no-print z-50"><X size={24} /></button>
                    {/* ... (Header) ... */}
                    <div className="border-b-4 border-slate-900 pb-8 mb-12"><h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{data.planning.lessonName}</h1><div className="grid grid-cols-2 gap-4 text-sm font-bold uppercase tracking-widest"><p>Fag: {data.subject}</p><p>Tema: {data.topic}</p></div></div>
                    
                    <div className="space-y-12">
                        {/* Sections ... */}
                        <section className="space-y-4"><h2 className="text-xl font-black uppercase tracking-tight border-b border-slate-200 pb-2">1. Forskning</h2><p className="text-lg italic">"{data.researchQuestion}"</p></section>
                        
                        <section className="space-y-8 break-inside-avoid">
                            <h2 className="text-xl font-black uppercase tracking-tight border-b border-slate-200 pb-2">2. Observasjon (Oppsummert)</h2>
                            <div className="grid grid-cols-2 gap-6"><div className="bg-amber-50 p-4 rounded-xl"><h5 className="font-bold text-xs uppercase text-amber-700">Prediksjon</h5><p>{data.planning.prediction}</p></div>
                            <div className="bg-slate-50 p-4 rounded-xl"><h5 className="font-bold text-xs uppercase text-slate-500">Antall økter</h5><p>{data.observation.sessions.length}</p></div></div>
                            
                            {data.observation.sessions.map((session, i) => (
                                <div key={i} className="mt-4 border p-6 rounded-xl break-inside-avoid">
                                    <h5 className="font-black text-sm uppercase mb-4 text-slate-800">{session.name}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div><h6 className="text-[10px] font-bold uppercase text-slate-400">Notater</h6><p className="text-sm">{session.generalNotes}</p></div>
                                        <div><h6 className="text-[10px] font-bold uppercase text-slate-400">Objekter</h6><p className="text-sm">{session.targets.map(t => t.name).join(', ')}</p></div>
                                    </div>
                                    {session.checklist.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg">
                                            {session.checklist.map((c, idx) => (
                                                <div key={idx} className="flex justify-between text-xs px-2"><span>{c.item}</span><span className="font-bold">{c.count}</span></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>

                        <section className="space-y-4 break-inside-avoid"><h2 className="text-xl font-black uppercase tracking-tight border-b border-slate-200 pb-2">3. Refleksjon</h2>
                            <div className="bg-sky-50 p-6 rounded-xl"><h5 className="font-bold text-xs uppercase text-sky-800 mb-2">Elevstemmen</h5><p>{data.reflection.interviewNotes || "Ingen notater."}</p></div>
                            <div className="bg-emerald-50 p-6 rounded-xl"><h5 className="font-bold text-xs uppercase text-emerald-800 mb-2">Endring av praksis</h5><p className="font-bold text-emerald-900">{data.reflection.practiceChanges}</p></div>
                        </section>
                    </div>
                    <div className="fixed bottom-8 right-8 no-print"><button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 shadow-2xl flex items-center gap-3"><Printer size={18} /> Skriv ut</button></div>
                </div>
            </div>
        );
    }

    if (mode === 'dashboard') {
        // ... (Dashboard remains same)
        return (
            <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-10 w-full animate-in fade-in">
                <div className="flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors p-2"><ChevronLeft size={18} /> {t.back}</button></div>
                <div className="bg-gradient-to-br from-teal-800 to-emerald-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Microscope size={200} /></div>
                    <div className="relative z-10 space-y-6"><h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter">Lesson Study Lab</h1><p className="text-teal-200 font-black uppercase text-xs tracking-[0.3em] max-w-xl leading-relaxed">Systematisk skoleutvikling: Planlegg, Observer, Reflekter.</p><div className="flex gap-4 pt-4"><button onClick={createNewProject} className="px-8 py-4 bg-white text-teal-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-lg flex items-center gap-3">Ny Syklus <ArrowRight size={16} /></button></div></div>
                </div>
                {/* ... Projects Grid ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-teal-600" size={40}/></div> : projects.length === 0 ? <div className="col-span-full py-20 text-center opacity-40"><Microscope size={64} className="mx-auto mb-4"/><p className="font-black uppercase tracking-widest text-xs">Ingen prosjekter enda.</p></div> : projects.map(p => (
                        <div key={p.id} onClick={() => openProject(p)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full"><div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div><div className="relative z-10 flex justify-between items-start mb-4"><h3 className="font-black text-lg text-slate-900 uppercase tracking-tight line-clamp-2">{p.task.title}</h3><button onClick={(e) => deleteProject(e, p.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 bg-white rounded-full shadow-sm"><Trash2 size={14}/></button></div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">{p.date} • {p.creator}</p><div className="mt-auto relative z-10"><div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${p.task.lessonStudy?.step === 3 ? 'bg-emerald-500 w-full' : p.task.lessonStudy?.step === 2 ? 'bg-amber-500 w-2/3' : 'bg-teal-500 w-1/3'}`}></div></div><div className="flex justify-between items-end"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.task.lessonStudy?.step === 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{p.task.lessonStudy?.step === 1 ? 'Planlegging' : p.task.lessonStudy?.step === 2 ? 'Observasjon' : 'Refleksjon'}</span><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors"><ArrowRight size={14} /></div></div></div></div>
                    ))}
                </div>
                {/* ... Resources ... */}
                {resourceFiles.length > 0 && <div className="mt-12"><h3 className="font-black text-slate-400 uppercase text-xs tracking-widest mb-6 px-2">Maler & Ressurser</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">{resourceFiles.map((file, i) => (<a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"><div className="p-2 bg-white rounded-xl text-teal-600 shadow-sm group-hover:text-teal-700"><FileText size={18}/></div><span className="text-xs font-bold text-slate-600 truncate">{file.name}</span><ExternalLink size={12} className="ml-auto text-slate-300 group-hover:text-teal-400"/></a>))}</div></div>}
            </div>
        );
    }

    // WORKSPACE MODE (Main UI)
    return (
        <div className="flex flex-col h-full max-w-full pb-20 animate-in slide-in-from-bottom-8">
            <div className="bg-white border-b border-slate-100 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => {saveProject(); setMode('dashboard');}} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-500"><ChevronLeft size={20} /></button>
                    <div>
                        <input className="font-black text-lg uppercase tracking-tight text-slate-900 bg-transparent outline-none placeholder:text-slate-300 w-64 md:w-96" value={data.planning.lessonName} onChange={e => setData({...data, planning: {...data.planning, lessonName: e.target.value}})} placeholder="Prosjektnavn..." />
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lesson Study • {currentUser?.name}</p>
                            {isLive && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                    <Wifi size={10} className="animate-pulse" /> Live
                                </span>
                            )}
                            {isAutoSaving && <span className="text-[9px] text-slate-300 flex items-center gap-1"><RefreshCw size={10} className="animate-spin"/> Lagrer...</span>}
                            {!isAutoSaving && lastSaved && <span className="text-[9px] text-slate-300">Lagret {lastSaved.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-1 mr-4">{[1,2,3].map(s => (<button key={s} onClick={() => setData({...data, step: s})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${data.step === s ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{s === 1 ? 'Plan' : s === 2 ? 'Obs' : 'Refleksjon'}</button>))}</div>
                    {resourceFiles.length > 0 && <div className="relative"><button onClick={() => setShowResourceModal(!showResourceModal)} className="px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-slate-200"><FolderOpen size={14} /> Maler</button>{showResourceModal && <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[200px] z-50 animate-in slide-in-from-top-2">{resourceFiles.map((file, i) => (<a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700"><FileText size={14} className="text-teal-500" /><span className="truncate">{file.name}</span></a>))}</div>}</div>}
                    <button onClick={() => {saveProject(); setMode('report');}} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"><FileText size={14} /> Rapport</button>
                    <button onClick={() => saveProject()} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center gap-2"><Save size={14} /> Lagre</button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-10 max-w-6xl mx-auto w-full">
                {renderStep()}
            </div>
        </div>
    );
};

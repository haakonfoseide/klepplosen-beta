
import React, { useState } from 'react';
import { Loader2, Sparkles, Printer, LifeBuoy, Clock, Box, Target, Save, Check, Copy } from 'lucide-react';
import { generateSubstitutePlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { SavedPlan, GeneratedTask } from '../types';

export const SubstitutePlanGenerator = ({ t, language, currentUser, isOwner = true, initialData, currentPlanId }: any) => {
    const [subject, setSubject] = useState(initialData?.subject || COMMON_SUBJECTS[0]);
    const [grade, setGrade] = useState(initialData?.grade || GRADES[0]);
    const [duration, setDuration] = useState(initialData?.duration || '45 min');
    const [topic, setTopic] = useState(initialData?.topic || '');
    const [equipment, setEquipment] = useState(initialData?.equipment || 'Standard (Papir/Blyant)');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [result, setResult] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        setSaveStatus(null);
        setStatusMessage("Sjekker læreplaner...");
        
        try {
            // First, try to get aims from DB
            let availableAims: string[] = [];
            try {
                const dbAims = await storageService.getCompetenceAims(subject, grade);
                if (dbAims && dbAims.length > 0) {
                    availableAims = dbAims.map(a => a.text);
                    setStatusMessage("Fant mål i database, genererer...");
                } else {
                    setStatusMessage("Henter mål via UDIR, genererer...");
                }
            } catch (err) {
                console.warn("Could not fetch aims from DB, proceeding with AI search", err);
                setStatusMessage("Søker etter mål og genererer...");
            }

            const res = await generateSubstitutePlan({ subject, grade, duration, topic, equipment, notes }, language, availableAims);
            setResult(res);
        } catch (e) {
            alert("Feil ved generering: " + e);
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    const handleSaveToArchive = async () => {
        if (!currentUser || !result) return;
        setSaveStatus('saving');
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(),
                task: {
                    ...result,
                    title: `Vikarplan: ${subject} (${grade})`,
                    clStructureId: 'tool',
                    planType: 'tool',
                    toolType: 'substitute_plan',
                    subject,
                    grade,
                    topic,
                    duration,
                    equipment,
                    notes
                } as GeneratedTask,
                subject,
                grade,
                topic: topic || 'Vikarplan',
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: false,
                isImported: false,
                likes: 0,
                likedBy: []
            };
            await storageService.savePlan(planToSave as any);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (e) {
            setSaveStatus('error');
        }
    };

    return (
        <div className="flex flex-col h-full gap-8 max-w-full">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-6 no-print shadow-sm">
                <div className="flex items-center gap-4 text-rose-600 mb-2">
                    <div className="p-2 bg-rose-100 rounded-xl"><LifeBuoy size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Vikarredderen</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Når krisen rammer og du trenger en plan NÅ.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Fag</label>
                        <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">{COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Trinn</label>
                        <select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Varighet</label>
                        <select value={duration} onChange={e=>setDuration(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">
                            <option value="45 min">45 min (Enkeltime)</option>
                            <option value="60 min">60 min</option>
                            <option value="90 min">90 min (Dobbeltime)</option>
                            <option value="Halv dag">Halv dag</option>
                            <option value="Hel dag">Hel dag</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Utstyr tilgjengelig</label>
                        <select value={equipment} onChange={e=>setEquipment(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">
                            <option value="Standard (Papir/Blyant)">Kun papir/blyant</option>
                            <option value="Chromebook/iPad">Digitale enheter</option>
                            <option value="Smartboard">Smartboard</option>
                            <option value="Gymsal">Gymsal</option>
                            <option value="Uteområde">Uteområde</option>
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Tema (Valgfritt)</label>
                        <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="F.eks. Multiplikasjon, Vikingtiden..." className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 outline-none focus:ring-2 ring-rose-100" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-1">Beskjed til vikar (Valgfritt)</label>
                        <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="F.eks. 'Klassen kan være urolig', 'Husk luftepause'..." className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 outline-none focus:ring-2 ring-rose-100" />
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} Generer Redningsplan
                </button>
            </div>

            <div className="flex-grow min-h-0">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                        <Loader2 className="animate-spin text-rose-600" size={48}/>
                        <div className="text-center">
                            <p className="font-black uppercase text-xs animate-pulse text-rose-900 tracking-widest">Kai redder dagen...</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{statusMessage}</p>
                        </div>
                    </div>
                ) : result ? (
                    <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl border border-slate-50 space-y-8 animate-in fade-in zoom-in-95 print:shadow-none print:border-0 print:p-0">
                        
                        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 print:border-black">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Vikarplan</h2>
                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 print:text-black">
                                    <span>{subject}</span> • <span>{grade}</span> • <span>{duration}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 no-print">
                                {currentUser && (
                                    <button 
                                        onClick={handleSaveToArchive} 
                                        disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-red-500 text-white' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                                    >
                                        {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : isOwner ? <Save size={14} /> : <Copy size={14} />} 
                                        {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? 'Lagre' : 'Kopier'}
                                    </button>
                                )}
                                <button onClick={() => window.print()} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-slate-500">
                                    <Printer size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Competence Aims */}
                        {result.competenceAims && result.competenceAims.length > 0 && (
                            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 break-inside-avoid print:border-2 print:border-black print:bg-white">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 mb-3 flex items-center gap-2 print:text-black">
                                    <Target size={14}/> Læringsmål (LK20)
                                </h4>
                                <ul className="space-y-2">
                                    {result.competenceAims.map((aim: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-xs font-bold text-indigo-900 print:text-black">
                                            <span className="text-indigo-400 print:text-black">•</span> {aim}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Message to Substitute */}
                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 shadow-sm print:bg-white print:border-2 print:border-black">
                            <h4 className="text-xs font-black uppercase tracking-widest text-rose-700 mb-3 flex items-center gap-2 print:text-black"><LifeBuoy size={14}/> Til Vikaren</h4>
                            <p className="text-sm font-bold text-rose-900 leading-relaxed italic print:text-black">"{result.messageToSubstitute}"</p>
                        </div>

                        {/* Activities */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 print:text-black"><Clock size={14}/> Tidsplan</h4>
                            <div className="space-y-4">
                                {result.activities.map((act: any, i: number) => (
                                    <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 print:bg-white print:border-2 print:border-slate-300 break-inside-avoid">
                                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 print:border-black">
                                            <span className="text-lg font-black text-slate-900">{act.duration}</span>
                                        </div>
                                        <div className="flex-grow">
                                            <h5 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{act.title}</h5>
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed print:text-black">{act.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Backup Plan */}
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 border-dashed print:bg-white print:border-2 print:border-black print:border-dashed break-inside-avoid">
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2 print:text-black"><Box size={14}/> Reserveaktivitet</h4>
                            <p className="text-sm font-bold text-indigo-900 leading-relaxed print:text-black">{result.backupPlan}</p>
                        </div>

                        <div className="text-center pt-8 border-t border-slate-100 print:hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Lykke til!</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20 text-center">
                        <LifeBuoy size={64} />
                        <div className="max-w-xs">
                            <p className="font-black uppercase text-xs tracking-widest">Klar for oppdrag</p>
                            <p className="text-[10px] font-bold mt-2 leading-relaxed">Fyll inn feltene over så lager Kai en komplett timeplan på sekunder.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

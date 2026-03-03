
import React, { useState, useRef } from 'react';
import { Loader2, Sparkles, Check, X, Camera, Printer, Copy, Save, Info, BrainCircuit, Heart, MessageSquare, ListChecks, HeartHandshake, Share2 } from 'lucide-react';
import { GRADES } from '../constants';
import { generateStudentTalk } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { SavedPlan, GeneratedTask } from '../types';

export const StudentTalkGenerator = ({ t, language, currentUser, isOwner = true, initialData, currentPlanId, isShared: initialIsShared = false }: any) => {
    const [grade, setGrade] = useState(initialData?.grade || GRADES[0]);
    const [topic, setTopic] = useState(initialData?.topic || '');
    const [uploadedImage, setUploadedImage] = useState<{data: string, mimeType: string} | null>(null);
    const [result, setResult] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [isShared, setIsShared] = useState(initialIsShared);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        setSaveStatus(null);
        try {
            const res = await generateStudentTalk({ grade, topic }, language, uploadedImage || undefined);
            setResult(res);
        } catch (e) {
            alert("Feil ved generering: " + e);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            setUploadedImage({ data: base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveToArchive = async () => {
        if (!currentUser || !result) return;
        setSaveStatus('saving');
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(),
                task: {
                    ...result,
                    title: `Elevsamtale: ${grade}`,
                    clStructureId: 'tool',
                    planType: 'tool',
                    toolType: 'student_talk',
                    subject: 'Elevsamtale',
                    grade,
                    topic: topic || 'Standard samtale'
                } as GeneratedTask,
                subject: 'Elevsamtale',
                grade,
                topic: topic || 'Standard samtale',
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: isShared,
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
            {/* Header & Config */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-[3rem] border border-slate-100 space-y-6 no-print shadow-inner">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="space-y-4 flex-grow w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 px-2">Klassetrinn</label>
                                <select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 focus:ring-4 ring-rose-50 outline-none cursor-pointer">
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 px-2">Ekstra fokus (Valgfritt)</label>
                                <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="T.d. trivsel, uro, fagleg veg..." className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 focus:ring-4 ring-rose-50 outline-none" />
                            </div>
                        </div>
                        <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} GENERER SAMTALEGUIDE
                        </button>
                    </div>

                    <div className="w-full md:w-64 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2">Bruk eksisterande skjema</label>
                        <div className={`relative border-2 border-dashed rounded-3xl p-4 transition-all text-center h-[108px] flex flex-col justify-center items-center gap-1 ${uploadedImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            {uploadedImage ? (
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                                    <Check size={16}/> Bilde lasta <button onClick={(e)=>{e.stopPropagation(); setUploadedImage(null)}} className="p-1 hover:bg-indigo-100 rounded-lg text-rose-500"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <Camera size={24} className="text-slate-300" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ta bilde av skjema</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-rose-600 mb-4" size={64}/>
                        <p className="font-black uppercase text-xs animate-pulse text-rose-900 tracking-widest">Kai skreddersyr samtalen...</p>
                    </div>
                ) : result ? (
                    <div className="space-y-12 animate-in fade-in zoom-in-95 print:space-y-8">
                        {/* Actions */}
                        <div className="flex justify-end gap-2 no-print">
                            {currentUser && (
                                <>
                                    <button 
                                        onClick={() => setIsShared(!isShared)} 
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${isShared ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                                    >
                                        <Share2 size={14} /> {isShared ? 'Delt' : 'Del'}
                                    </button>
                                    <button onClick={handleSaveToArchive} disabled={saveStatus==='saved'||saveStatus==='saving'} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                        {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : isOwner ? <Save size={14} /> : <Copy size={14} />} 
                                        {saveStatus === 'saved' ? 'Lagra i kista' : isOwner ? 'Lagre i arkiv' : 'Lagre Kopi'}
                                    </button>
                                </>
                            )}
                            <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                <Printer size={16} /> Skriv ut guide
                            </button>
                        </div>

                        {/* Intro Tips */}
                        <div className="bg-rose-50/50 p-8 rounded-[3rem] border-2 border-rose-100 flex items-start gap-6 relative overflow-hidden break-inside-avoid shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><Info size={120} /></div>
                            <div className="p-4 bg-white rounded-2xl text-rose-600 shadow-md flex-shrink-0"><BrainCircuit size={32} /></div>
                            <div className="space-y-3 relative z-10">
                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-rose-900">Kais rammefortelling for samtalen</h4>
                                <p className="text-base font-bold text-rose-800 leading-relaxed italic">"{result.introTips}"</p>
                            </div>
                        </div>

                        {/* Question Categories */}
                        <div className="grid grid-cols-1 gap-8">
                            {result.categories.map((cat: any, i: number) => (
                                <div key={i} className="space-y-6 break-inside-avoid">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${['bg-rose-500', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500'][i % 4]}`}>
                                            {i === 0 ? <Heart size={24}/> : i === 1 ? <BrainCircuit size={24}/> : i === 2 ? <Sparkles size={24}/> : <MessageSquare size={24}/>}
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-black uppercase tracking-tight text-slate-900">{cat.title}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spørsmål til elev på {grade}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cat.questions.map((q: string, idx: number) => (
                                            <div key={idx} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm hover:border-rose-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center font-black text-xs flex-shrink-0 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">{idx + 1}</div>
                                                    <p className="text-sm font-bold text-slate-700 leading-snug pt-1 pr-6">{q}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Outro Tips */}
                        <div className="p-8 bg-indigo-950 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden break-inside-avoid">
                            <div className="absolute bottom-0 right-0 p-8 opacity-10"><MessageSquare size={150} /></div>
                            <div className="flex items-center gap-3 text-indigo-300">
                                <ListChecks size={24} />
                                <h4 className="text-sm font-black uppercase tracking-[0.2em]">Oppsummering og veg vidare</h4>
                            </div>
                            <p className="text-lg font-bold text-indigo-50 leading-relaxed italic relative z-10">"{result.outroTips}"</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20 text-center">
                        <HeartHandshake size={64} />
                        <div className="max-w-xs">
                            <p className="font-black uppercase text-xs tracking-widest">Klar for elevsamtalen</p>
                            <p className="text-[10px] font-bold mt-2 leading-relaxed">Vel trinn for å få skreddarsydde spørsmål, eller ta bilde av eit eksisterande skjema for å forbetre det.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

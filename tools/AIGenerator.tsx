
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Printer, CheckSquare, X, Flag, Star, Edit, Save, Check, Copy } from 'lucide-react';
import { generateClassroomTool } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { COMMON_SUBJECTS, LANGUAGE_SUBJECTS, ELECTIVE_SUBJECTS, GRADES } from '../constants';
import { SavedPlan, GeneratedTask } from '../types';
import { useToast } from '../contexts/ToastContext';

export const AIGenerator = ({ type, placeholder, icon: Icon, color, t, language, currentUser, isOwner = true, initialData, currentPlanId }: any) => {
    const { addToast } = useToast();
    const [subjectCat, setSubjectCat] = useState('common');
    const [topic, setTopic] = useState(initialData?.topic || '');
    const [grade, setGrade] = useState(initialData?.grade || GRADES[0]);
    const [subject, setSubject] = useState(initialData?.subject || COMMON_SUBJECTS[0]);
    const [style, setStyle] = useState<'praktisk'|'leken'|'dyp'>('praktisk');
    const [amount, setAmount] = useState(type === 'icebreaker' ? 5 : 3);
    const [result, setResult] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(false);

    // Save State
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editedResult, setEditedResult] = useState<any>(null);

    const subjects = subjectCat === 'language' ? LANGUAGE_SUBJECTS : subjectCat === 'elective' ? ELECTIVE_SUBJECTS : COMMON_SUBJECTS;

    useEffect(() => {
        if (result) {
            setEditedResult(JSON.parse(JSON.stringify(result)));
        }
    }, [result]);

    const handleGenerate = async () => {
        setLoading(true); setResult(null); setIsEditing(false); setSaveStatus(null);
        try { const res = await generateClassroomTool(type, { subject, grade, topic, style, amount }, language); setResult(res); } 
        catch { addToast("Feil ved generering.", 'error'); } finally { setLoading(false); }
    };

    const handleSaveEdit = () => {
        setResult(editedResult);
        setIsEditing(false);
    };

    const handleArrayChange = (field: string, index: number, value: string) => {
        const newArray = [...editedResult[field]];
        newArray[index] = value;
        setEditedResult({ ...editedResult, [field]: newArray });
    };

    const handleTaskChange = (index: number, field: string, value: any) => {
        const newTasks = [...editedResult.tasks];
        newTasks[index] = { ...newTasks[index], [field]: value };
        setEditedResult({ ...editedResult, tasks: newTasks });
    };

    const handleTaskInstructionChange = (taskIndex: number, instrIndex: number, value: string) => {
        const newTasks = [...editedResult.tasks];
        const newInstructions = [...newTasks[taskIndex].instructions];
        newInstructions[instrIndex] = value;
        newTasks[taskIndex].instructions = newInstructions;
        setEditedResult({ ...editedResult, tasks: newTasks });
    };

    const handleSaveToArchive = async () => {
        if (!currentUser) return;
        setSaveStatus('saving');
        
        try {
            const planToSave: SavedPlan = {
                // If not owner, force new ID (Save as Copy)
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(), 
                task: {
                    ...result,
                    title: topic,
                    clStructureId: 'tool',
                    studentTask: '',
                    objective: '',
                    studentMaterials: '',
                    teacherTips: '',
                    instructions: '',
                    planType: 'tool',
                    toolType: type,
                    subject,
                    grade,
                    topic
                } as GeneratedTask,
                subject,
                grade,
                topic,
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: false,
                isImported: false,
            };

            await storageService.savePlan(planToSave as any); // Type cast due to optional ID in logic
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    return (
        <div className="flex flex-col h-full gap-8 max-w-full">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-4 no-print">
                <div className="flex p-1 bg-slate-200 rounded-2xl w-fit">
                    <button onClick={()=>{setSubjectCat('common'); setSubject(COMMON_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='common' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Fellesfag</button>
                    <button onClick={()=>{setSubjectCat('language'); setSubject(LANGUAGE_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='language' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Språkfag</button>
                    <button onClick={()=>{setSubjectCat('elective'); setSubject(ELECTIVE_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='elective' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Valgfag</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.selectSubject}</label>
                        <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.grade}</label>
                        <select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.style}</label>
                        <select value={style} onChange={e=>setStyle(e.target.value as any)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0"><option value="praktisk">{t.practical}</option><option value="leken">{t.playful}</option><option value="dyp">{t.deep}</option></select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1 flex justify-between gap-2"><span>{t.amount}</span><span className="text-indigo-600 font-black">{amount}</span></label>
                        <div className="px-2 py-4 bg-white rounded-2xl shadow-sm"><input type="range" min="1" max="15" value={amount} onChange={e=>setAmount(parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 appearance-none bg-slate-100 rounded-full" /></div>
                    </div>
                    <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                        <input type="text" className="flex-grow p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 min-w-0" value={topic} onChange={e=>setTopic(e.target.value)} placeholder={placeholder} />
                        <button onClick={handleGenerate} disabled={loading||(type!=='icebreaker'&&!topic)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-indigo-600 transition-all flex-shrink-0">{loading ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}</button>
                    </div>
                </div>
            </div>
            
            <div className="flex-grow min-h-0 print:overflow-visible">
                {loading ? <div className="h-full flex flex-col items-center justify-center space-y-4 py-20"><Loader2 className="animate-spin text-indigo-600" size={48}/><p className="font-black uppercase text-xs animate-pulse">{t.loadingTask}</p></div> : result ? (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 max-w-full py-4">
                        <div className="flex justify-between items-center no-print sticky top-0 bg-white/90 backdrop-blur-sm p-2 z-20 rounded-xl border border-slate-100 shadow-sm">
                            <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest pl-2">{type === 'debater' ? 'Argumenter' : t.generateContent}</h4>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md">
                                            <Check size={14} /> Ferdig
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {currentUser && (
                                            <button 
                                                onClick={handleSaveToArchive} 
                                                disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                            >
                                                {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : isOwner ? <Save size={14} /> : <Copy size={14} />} 
                                                {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? t.save : 'Lagre Kopi'}
                                            </button>
                                        )}
                                        {isOwner && (
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                                <Edit size={14} /> {t.edit}
                                            </button>
                                        )}
                                        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md">
                                            <Printer size={14} /> {t.print}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {type === 'debater' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:gap-4">
                                <div className="space-y-4">
                                    <h5 className="font-black text-emerald-600 text-xs flex items-center gap-2 print:text-black"><CheckSquare size={16}/> {t.argumentsFor}</h5>
                                    {(isEditing ? editedResult : result).pros?.map((p:any,i:number)=>(
                                        <div key={i} className="p-5 bg-white rounded-2xl shadow-sm border-l-4 border-emerald-500 font-bold text-sm leading-relaxed break-words print:border print:border-slate-300 print:shadow-none break-inside-avoid">
                                            {isEditing ? (
                                                <textarea 
                                                    className="w-full bg-transparent outline-none resize-none h-20"
                                                    value={p} 
                                                    onChange={(e) => handleArrayChange('pros', i, e.target.value)} 
                                                />
                                            ) : p}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-rose-600 text-xs flex items-center gap-2 print:text-black"><X size={16}/> {t.argumentsAgainst}</h5>
                                    {(isEditing ? editedResult : result).cons?.map((p:any,i:number)=>(
                                        <div key={i} className="p-5 bg-white rounded-2xl shadow-sm border-l-4 border-rose-500 font-bold text-sm leading-relaxed break-words print:border print:border-slate-300 print:shadow-none break-inside-avoid">
                                            {isEditing ? (
                                                <textarea 
                                                    className="w-full bg-transparent outline-none resize-none h-20"
                                                    value={p} 
                                                    onChange={(e) => handleArrayChange('cons', i, e.target.value)} 
                                                />
                                            ) : p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : type === 'general_tasks' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 print:grid-cols-1 print:gap-6 print:pb-0">
                                {(isEditing ? editedResult : result).tasks?.map((task:any, i:number)=>(
                                    <div key={i} className="p-8 sm:p-10 bg-white rounded-[3.5rem] shadow-2xl border-2 border-slate-50 flex flex-col gap-6 relative group hover:border-indigo-200 transition-all overflow-hidden break-words print:shadow-none print:border-slate-800 print:rounded-xl break-inside-avoid">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"></div>
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl transform group-hover:scale-110 transition-transform print:bg-black print:shadow-none print:text-white">#{i+1}</div>
                                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 print:hidden"><Flag size={24}/></div>
                                        </div>

                                        <div className="space-y-6 relative z-10 flex-grow">
                                            <div className="space-y-2">
                                                <h5 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.3em] print:text-black">{t.task}</h5>
                                                {isEditing ? (
                                                    <input 
                                                        className="w-full text-2xl font-black text-slate-900 uppercase bg-slate-50 border-b border-indigo-200 outline-none p-1"
                                                        value={task.title}
                                                        onChange={(e) => handleTaskChange(i, 'title', e.target.value)}
                                                    />
                                                ) : (
                                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight print:text-black">
                                                        {task.title}
                                                    </h3>
                                                )}
                                            </div>

                                            <div className="h-1.5 w-16 bg-amber-400 rounded-full print:bg-black"></div>

                                            <div className="space-y-4">
                                                {(task.instructions||[]).map((instr:string, idx:number) => (
                                                    <div key={idx} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-2xl hover:bg-indigo-50/30 transition-colors group/item print:bg-white print:p-0">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0 group-hover/item:scale-125 transition-transform print:bg-black"></div>
                                                        {isEditing ? (
                                                            <textarea 
                                                                className="w-full bg-white border border-slate-200 rounded p-1 text-sm font-bold"
                                                                value={instr}
                                                                onChange={(e) => handleTaskInstructionChange(i, idx, e.target.value)}
                                                            />
                                                        ) : (
                                                            <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed min-w-0 print:text-black">
                                                                {instr.replace(/^[-*•]\s*/, '')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-50 flex justify-between items-center relative z-10 print:border-black">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] print:text-black">{t.kaiGenerated}</span>
                                            {task.difficulty && (
                                              <div className="flex gap-1 text-amber-400 print:text-black" title={`Vanskelighetsgrad: ${task.difficulty}/3`}>
                                                  {Array(task.difficulty).fill(0).map((_, starIdx) => (
                                                      <Star key={starIdx} size={16} fill="currentColor" className="drop-shadow-sm" />
                                                  ))}
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-2xl mx-auto pb-10 print:max-w-full">
                                {(isEditing ? editedResult : result).questions?.map((q:any,i:number)=>(
                                    <div key={i} className="p-6 sm:p-8 bg-white rounded-[2.5rem] shadow-xl flex gap-4 sm:gap-6 items-start border-4 border-slate-50 break-words print:shadow-none print:border-2 print:border-slate-300 print:rounded-xl break-inside-avoid">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg flex-shrink-0 print:bg-black print:text-white">{i+1}</div>
                                        {isEditing ? (
                                            <textarea 
                                                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-base font-bold text-slate-800"
                                                value={q}
                                                onChange={(e) => handleArrayChange('questions', i, e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug pt-1 min-w-0 flex-grow print:text-black">{q}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : <div className="h-full flex items-center justify-center opacity-20 py-20"><p className="font-black uppercase tracking-widest text-[10px]">{t.readyToUse}</p></div>}
            </div>
        </div>
    );
};

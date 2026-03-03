
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Target as TargetIcon, BookOpen, ListOrdered, CheckSquare, Award, Layers, Edit, Printer, Save, X, Check, Copy, Share2 } from 'lucide-react';
import { generateProjectPlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { COMMON_SUBJECTS, LANGUAGE_SUBJECTS, ELECTIVE_SUBJECTS, GRADES } from '../constants';
import { BulletList } from '../CommonComponents';
import { SavedPlan, GeneratedTask } from '../types';

export const ProjectPlanner = ({ t, language, currentUser, isOwner = true, initialData, currentPlanId, isShared: initialIsShared = false }: any) => {
    const [subjectCat, setSubjectCat] = useState('common');
    const [subject, setSubject] = useState(initialData?.subject || COMMON_SUBJECTS[0]);
    const [grade, setGrade] = useState(initialData?.grade || GRADES[5]);
    const [topic, setTopic] = useState(initialData?.topic || '');
    const [product, setProduct] = useState(initialData?.product || '');
    const [result, setResult] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(false);
    
    // Save State
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [isShared, setIsShared] = useState(initialIsShared);

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
        try { const res = await generateProjectPlan(subject, grade, topic, product || 'Valgfritt produkt', language); setResult(res); } 
        catch { alert("Feil ved generering."); } finally { setLoading(false); }
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

    const handleRubricChange = (index: number, key: string, value: string) => {
        const newRubric = [...editedResult.assessmentRubric];
        newRubric[index] = { ...newRubric[index], [key]: value };
        setEditedResult({ ...editedResult, assessmentRubric: newRubric });
    };

    const handleSaveToArchive = async () => {
        if (!currentUser) return;
        setSaveStatus('saving');
        
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(), // New ID if not owner
                task: {
                    ...result,
                    clStructureId: 'project',
                    studentMaterials: '',
                    teacherTips: '',
                    instructions: '',
                    planType: 'project',
                    subject,
                    grade,
                    topic,
                    product
                } as GeneratedTask,
                subject,
                grade,
                topic,
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
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    return (
        <div className="flex flex-col h-full gap-8 max-w-full">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6 no-print">
                <div className="flex p-1 bg-slate-200 rounded-2xl w-fit">
                    <button onClick={()=>{setSubjectCat('common'); setSubject(COMMON_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='common' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Fellesfag</button>
                    <button onClick={()=>{setSubjectCat('language'); setSubject(LANGUAGE_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='language' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Språkfag</button>
                    <button onClick={()=>{setSubjectCat('elective'); setSubject(ELECTIVE_SUBJECTS[0])}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subjectCat==='elective' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Valgfag</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select value={subject} onChange={e=>setSubject(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    <select value={grade} onChange={e=>setGrade(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                    <input type="text" value={product} onChange={e=>setProduct(e.target.value)} placeholder={t.productPlaceholder} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0" />
                    <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder={t.themePlaceholder} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0" />
                </div>
                <button onClick={handleGenerate} disabled={loading||!topic} className="w-full p-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-teal-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} {t.createProject}
                </button>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-2 print:overflow-visible">
                {result ? (
                    <div className="space-y-8 pb-10 print:pb-0">
                        {/* Action Bar */}
                        <div className="flex justify-end gap-2 no-print sticky top-0 bg-white/90 backdrop-blur-sm p-2 z-10 rounded-xl border border-slate-100 shadow-sm">
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
                                        <>
                                            <button 
                                                onClick={() => setIsShared(!isShared)} 
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${isShared ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                                            >
                                                <Share2 size={14} /> {isShared ? 'Delt' : 'Del'}
                                            </button>
                                            <button 
                                                onClick={handleSaveToArchive} 
                                                disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : isOwner ? <Save size={14} /> : <Copy size={14} />} 
                                            {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? t.save : 'Lagre Kopi'}
                                        </button>
                                    </>
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

                        <div className="text-center space-y-2 border-b-4 border-slate-900 pb-6 mb-8 print:border-black">
                            {isEditing ? (
                                <input 
                                    className="w-full text-center text-3xl font-black uppercase tracking-tighter text-slate-900 border-b-2 border-teal-200 focus:border-teal-500 outline-none bg-transparent"
                                    value={editedResult.title}
                                    onChange={(e) => setEditedResult({...editedResult, title: e.target.value})}
                                />
                            ) : (
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 print:text-black">{result.title}</h2>
                            )}
                            <p className="text-teal-600 font-bold uppercase text-[10px] tracking-widest print:text-black">{subject} • {grade}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Kompetansemål */}
                                <div className="p-6 bg-teal-50 rounded-[2rem] border border-teal-100 print:bg-white print:border-black print:rounded-lg break-inside-avoid">
                                    <div className="flex items-center gap-2 mb-4 text-teal-700 print:text-black">
                                        <TargetIcon size={18} />
                                        <h4 className="font-black uppercase text-xs tracking-widest">Kompetansemål</h4>
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {editedResult.competenceAims.map((aim: string, i: number) => (
                                                <input 
                                                    key={i}
                                                    className="w-full p-2 text-sm font-bold text-teal-900 bg-white border border-teal-200 rounded-lg outline-none focus:border-teal-500"
                                                    value={aim}
                                                    onChange={(e) => handleArrayChange('competenceAims', i, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <BulletList text={result.competenceAims} className="font-bold text-teal-900 text-sm print:text-black" markerColor="bg-teal-500" isPrint />
                                    )}
                                </div>

                                {/* Beskrivelse */}
                                <div className="space-y-4 break-inside-avoid">
                                    <div className="flex items-center gap-2 text-slate-400 print:text-black"><BookOpen size={18} /><h4 className="font-black uppercase text-xs tracking-widest">Beskrivelse</h4></div>
                                    {isEditing ? (
                                        <textarea 
                                            className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-teal-500"
                                            value={editedResult.description}
                                            onChange={(e) => setEditedResult({...editedResult, description: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-line print:text-black">{result.description}</p>
                                    )}
                                </div>

                                {/* Oppdrag */}
                                <div className="space-y-4 break-inside-avoid">
                                    <div className="flex items-center gap-2 text-slate-400 print:text-black"><ListOrdered size={18} /><h4 className="font-black uppercase text-xs tracking-widest">{t.task}</h4></div>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {editedResult.studentTask && (Array.isArray(editedResult.studentTask) ? editedResult.studentTask : [editedResult.studentTask]).map((item: string, i: number) => (
                                                <textarea 
                                                    key={i}
                                                    className="w-full p-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 resize-none h-20"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const newVal = Array.isArray(editedResult.studentTask) ? [...editedResult.studentTask] : [editedResult.studentTask];
                                                        newVal[i] = e.target.value;
                                                        setEditedResult({...editedResult, studentTask: newVal});
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <BulletList text={result.studentTask} className="font-bold text-slate-700 text-sm print:text-black" markerColor="bg-slate-300" isPrint />
                                    )}
                                </div>
                            </div>

                            {/* Krav til produkt */}
                            <div className="space-y-8 print:mt-8 break-inside-avoid">
                                <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-lg print:shadow-none print:border-black print:rounded-lg">
                                    <div className="flex items-center gap-2 mb-4 text-slate-400 print:text-black">
                                        <CheckSquare size={18} />
                                        <h4 className="font-black uppercase text-xs tracking-widest">{t.requirements}</h4>
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {editedResult.productRequirements.map((req: string, i: number) => (
                                                <input 
                                                    key={i}
                                                    className="w-full p-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                                                    value={req}
                                                    onChange={(e) => handleArrayChange('productRequirements', i, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <BulletList text={result.productRequirements} className="font-bold text-slate-700 text-xs print:text-black" markerColor="bg-indigo-500" isPrint />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vurderingsskjema */}
                        {result.assessmentRubric && (
                            <div className="space-y-4 break-inside-avoid print:mt-8">
                                <div className="flex items-center gap-2 text-slate-400 print:text-black"><Award size={18} /><h4 className="font-black uppercase text-xs tracking-widest">{t.assessmentRubric}</h4></div>
                                <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-x-auto no-print-scrollbar print:border-black print:rounded-lg print:shadow-none">
                                    <table className="w-full text-left border-collapse min-w-[600px] print:min-w-full">
                                        <thead className="bg-slate-900 text-white print:bg-slate-200 print:text-black">
                                            <tr>
                                                <th className="p-4 text-[10px] uppercase font-black tracking-widest print:border print:border-black">Kriterier</th>
                                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-slate-400 print:text-black print:border print:border-black">Lav</th>
                                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-indigo-300 print:text-black print:border print:border-black">Middels</th>
                                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-emerald-400 print:text-black print:border print:border-black">Høy</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 print:divide-black">
                                            {(isEditing ? editedResult : result).assessmentRubric.map((r:any, i:number)=>(
                                                <tr key={i} className="hover:bg-slate-50 print:bg-white">
                                                    <td className="p-4 font-black text-xs print:border print:border-black align-top">
                                                        {isEditing ? <textarea className="w-full p-1 border rounded bg-transparent text-xs" value={r.criteria} onChange={(e) => handleRubricChange(i, 'criteria', e.target.value)} /> : r.criteria}
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-slate-500 italic print:text-black print:border print:border-black align-top">
                                                        {isEditing ? <textarea className="w-full p-1 border rounded bg-transparent text-xs" value={r.low} onChange={(e) => handleRubricChange(i, 'low', e.target.value)} /> : r.low}
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-slate-700 italic print:text-black print:border print:border-black align-top">
                                                        {isEditing ? <textarea className="w-full p-1 border rounded bg-transparent text-xs" value={r.medium} onChange={(e) => handleRubricChange(i, 'medium', e.target.value)} /> : r.medium}
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-emerald-700 italic print:text-black print:border print:border-black align-top">
                                                        {isEditing ? <textarea className="w-full p-1 border rounded bg-transparent text-xs" value={r.high} onChange={(e) => handleRubricChange(i, 'high', e.target.value)} /> : r.high}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                        <Layers size={48} />
                        <p className="font-black uppercase text-xs tracking-widest">{t.readyToUse}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

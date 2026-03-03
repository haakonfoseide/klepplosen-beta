
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Check, Save, Copy, Printer, BrainCircuit, MessageSquare, Edit, X, Gamepad2, Play, Trash2, Plus } from 'lucide-react';
import { generateOracyContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { SavedPlan, GeneratedTask } from '../types';
import { AliasGame } from './AliasGame';

export const UnifiedOracyGenerator = ({ type, t, language, currentUser, initialData, isOwner = true, currentPlanId }: { type: any, t: any, language: string, currentUser?: any, initialData?: any, isOwner?: boolean, currentPlanId?: string }) => {
    const [config, setConfig] = useState({ 
        subject: initialData?.subject || COMMON_SUBJECTS[0], 
        grade: initialData?.grade || GRADES[5], 
        topic: initialData?.topic || '', 
        style: 'praktisk' as any, 
        amount: (type === 'alias' ? initialData?.aliasCards?.length : 
                 type === 'starters' ? initialData?.categories?.length : 
                 type === 'terms' ? initialData?.terms?.length : null) || (type === 'alias' ? 20 : 10), 
        includeFunWords: true 
    });
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(initialData || null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedResult, setEditedResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Game State
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeRound, setActiveRound] = useState(1);
    const [rounds, setRounds] = useState<{ round1: any[], round2: any[] }>({ round1: [], round2: [] });

    // Sync editing state
    useEffect(() => {
        if (result) {
            setEditedResult(JSON.parse(JSON.stringify(result)));
        }
    }, [result]);

    // Håndter balansert oppdeling av ord for Alias
    useEffect(() => {
        const cards = isEditing ? editedResult?.aliasCards : result?.aliasCards;
        if (type === 'alias' && cards && cards.length > 0) {
            const allCards = [...cards];
            const bonusCards = allCards.filter((c: any) => c.category === 'gøy');
            const fagCards = allCards.filter((c: any) => c.category !== 'gøy');

            // Enkel fordeling: Bland alt og del i to
            const mixed = [...fagCards, ...bonusCards].sort(() => Math.random() - 0.5);
            const mid = Math.ceil(mixed.length / 2);
            
            setRounds({ 
                round1: mixed.slice(0, mid), 
                round2: mixed.slice(mid) 
            });
        }
    }, [result, editedResult, type, isEditing]);

    const handleGenerate = async () => {
        setIsGenerating(true); 
        setResult(null); 
        setIsEditing(false);
        setError(null);
        setSaveStatus('idle');
        try { 
            const data = await generateOracyContent(type, config, language); 
            let processedData = data;
            
            // Normalize data structure if AI returns array directly
            if (Array.isArray(data)) {
                if (type === 'alias') processedData = { aliasCards: data };
                else if (type === 'starters') processedData = { categories: data };
                else if (type === 'terms') processedData = { terms: data };
                else if (type === 'roles') processedData = { roles: data };
                else if (type === 'assessment') processedData = { rubric: data };
                else if (type === 'rhetoric') processedData = { devices: data };
            }
            setResult(processedData); 
        } 
        catch (err: any) { 
            setError("Feil ved generering: " + err.message);
        } finally { 
            setIsGenerating(false); 
        }
    };

    const handleCreateBlank = () => {
        let emptyData: any = {};
        if (type === 'alias') emptyData = { aliasCards: [] };
        else if (type === 'starters') emptyData = { categories: [] };
        else if (type === 'terms') emptyData = { terms: [] };
        else if (type === 'roles') emptyData = { roles: [] };
        else if (type === 'assessment') emptyData = { rubric: [] };
        else if (type === 'rhetoric') emptyData = { devices: [] };
        
        setResult(emptyData);
        setEditedResult(emptyData);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        setResult(editedResult);
        setIsEditing(false);
    };

    const handleSaveToArchive = async () => {
        if (!currentUser || !result) return;
        setSaveStatus('saving');
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(),
                task: {
                    ...result,
                    title: `${getToolTitle(type)}: ${config.topic || config.subject}`,
                    clStructureId: 'tool',
                    planType: 'tool',
                    toolType: type,
                    subject: config.subject,
                    grade: config.grade,
                    topic: config.topic || ''
                } as GeneratedTask,
                subject: config.subject,
                grade: config.grade,
                topic: config.topic || '',
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: false,
                isImported: false,
            };
            await storageService.savePlan(planToSave as any);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            setSaveStatus('error');
        }
    };

    const getToolTitle = (t: string) => {
        switch(t) {
            case 'alias': return 'Fag-Alias';
            case 'starters': return 'Setningsstartere';
            case 'terms': return 'Ordbank';
            case 'roles': return 'Rollekort';
            case 'assessment': return 'Vurderingsskjema';
            case 'rhetoric': return 'Retorikk';
            default: return 'Oracy Verktøy';
        }
    };

    // Render Game View
    if (isPlaying && type === 'alias') {
        const currentCards = activeRound === 1 ? rounds.round1 : rounds.round2;
        return (
            <AliasGame 
                cards={currentCards} 
                onClose={() => { setIsPlaying(false); setActiveRound(1); }} 
                onShuffle={() => {
                    const shuffled = [...currentCards].sort(() => Math.random() - 0.5);
                    const newRounds = { ...rounds };
                    if (activeRound === 1) newRounds.round1 = shuffled;
                    else newRounds.round2 = shuffled;
                    setRounds(newRounds);
                }} 
                t={t}
                round={activeRound}
                totalRounds={2}
                onNextRound={activeRound === 1 && rounds.round2.length > 0 ? () => setActiveRound(2) : undefined}
            />
        );
    }

    // Main Render
    return (
        <div className="flex flex-col h-full gap-8 max-w-full">
            {/* Configuration Section */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-4 no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Fag / Kategori</label>
                        <select value={config.subject} onChange={e=>setConfig({...config, subject: e.target.value})} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer outline-none focus:ring-2 ring-indigo-500/20">
                            <option value="Trivia">✨ Trivia / Fakta</option>
                            <option value="Nyheter">📰 Dagens Nyheter</option>
                            <optgroup label="Skolefag">
                                {COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Trinn</label>
                        <select value={config.grade} onChange={e=>setConfig({...config, grade: e.target.value})} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer outline-none focus:ring-2 ring-indigo-500/20">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                    </div>
                    
                    {type === 'alias' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Gøy-ord?</label>
                            <button onClick={()=>setConfig({...config, includeFunWords: !config.includeFunWords})} className={`w-full p-4 rounded-2xl font-bold text-xs shadow-sm border-0 flex items-center justify-between ${config.includeFunWords ? 'bg-purple-100 text-purple-700' : 'bg-white text-slate-400'}`}>
                                <span>Inkluder bonusord</span>
                                {config.includeFunWords ? <Check size={16} /> : <X size={16} />}
                            </button>
                        </div>
                    )}

                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tema / Fokus</label>
                        <div className="flex gap-2">
                            <input type="text" className="flex-grow p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 min-w-0 outline-none focus:ring-2 ring-indigo-500/20" value={config.topic} onChange={e=>setConfig({...config, topic: e.target.value})} placeholder={config.subject === 'Trivia' ? 'Eks: Verdensrommet' : config.subject === 'Nyheter' ? 'Eks: Klima' : "Eks: Demokrati..."} />
                            <button onClick={handleGenerate} disabled={isGenerating || (!config.topic && config.subject !== 'Trivia' && config.subject !== 'Nyheter')} className="px-6 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-indigo-600 transition-all flex-shrink-0 disabled:opacity-50 active:scale-95 flex items-center gap-2">
                                {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Generer</span>
                            </button>
                            <button onClick={handleCreateBlank} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex-shrink-0 active:scale-95" title="Lag tom bank">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Amount Slider for Alias */}
                {(type === 'alias' || type === 'starters' || type === 'terms') && (
                    <div className="space-y-2 mt-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between px-1">
                            <span>Antall kort/ord</span>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">{config.amount}</span>
                        </label>
                        <input type="range" min="5" max="40" value={config.amount} onChange={e => setConfig({...config, amount: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div className="flex-grow min-h-0">
                {isGenerating ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                        <Loader2 className="animate-spin text-indigo-600" size={48}/>
                        <p className="font-black uppercase text-xs animate-pulse text-indigo-400">Kai klekker ut innhold...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center font-bold text-sm">
                        {error}
                    </div>
                ) : result ? (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 max-w-full pb-20">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center no-print sticky top-0 bg-white/90 backdrop-blur-md p-2 z-20 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 pl-2">
                                <span className="font-black text-slate-900 uppercase text-xs tracking-widest">{getToolTitle(type)}</span>
                                {isEditing && <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Redigerer</span>}
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md">
                                            <Check size={14} /> Ferdig
                                        </button>
                                        <button onClick={() => { setIsEditing(false); setEditedResult(JSON.parse(JSON.stringify(result))); }} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
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
                                                {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? 'Lagre' : 'Kopier'}
                                            </button>
                                        )}
                                        {isOwner && (
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                                <Edit size={14} /> Rediger
                                            </button>
                                        )}
                                        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md">
                                            <Printer size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* CONTENT RENDERERS */}
                        
                        {/* ALIAS */}
                        {type === 'alias' && (editedResult?.aliasCards || result?.aliasCards) && (
                            <div className="space-y-6">
                                {!isEditing && (
                                    <div className="bg-purple-600 p-6 rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group no-print">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Gamepad2 size={120} /></div>
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-black uppercase tracking-tight">Klar for spel?</h3>
                                            <p className="text-purple-200 font-bold text-xs uppercase tracking-widest mt-1">
                                                {rounds.round1.length + rounds.round2.length} kort fordelt på 2 sider
                                            </p>
                                        </div>
                                        <div className="flex gap-3 relative z-10">
                                            <button onClick={() => setIsEditing(true)} className="px-6 py-4 bg-purple-700/50 text-white border border-white/20 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2">
                                                <Edit size={16} /> Rediger ord
                                            </button>
                                            <button onClick={() => setIsPlaying(true)} className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3">
                                                <Play size={16} fill="currentColor" /> Start Spill
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
                                    {(isEditing ? editedResult : result).aliasCards.map((card: any, i: number) => (
                                        <div key={i} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 relative transition-all break-inside-avoid ${card.category === 'gøy' ? 'bg-pink-50 border-pink-100' : 'bg-white border-slate-100'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${card.category === 'gøy' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>{card.category === 'gøy' ? 'Bonus' : 'Fag'}</span>
                                                {isEditing && <button onClick={() => {const nc = [...editedResult.aliasCards]; nc.splice(i, 1); setEditedResult({...editedResult, aliasCards: nc})}} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>}
                                            </div>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <input className="w-full font-black uppercase text-sm bg-white/50 border-b border-slate-200 outline-none" value={card.word} onChange={e => {const nc=[...editedResult.aliasCards]; nc[i].word=e.target.value; setEditedResult({...editedResult, aliasCards: nc})}} />
                                                    <textarea className="w-full text-[10px] bg-white/50 border border-slate-200 rounded p-1 outline-none" value={card.definition} onChange={e => {const nc=[...editedResult.aliasCards]; nc[i].definition=e.target.value; setEditedResult({...editedResult, aliasCards: nc})}} />
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-black text-sm uppercase tracking-tight text-slate-900">{card.word}</h4>
                                                    <p className="text-[10px] font-medium text-slate-500 italic leading-snug">{card.definition}</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {isEditing && (
                                        <button onClick={() => setEditedResult({...editedResult, aliasCards: [...editedResult.aliasCards, {word: 'Nytt ord', category: 'fag', definition: ''}]})} className="p-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-all">
                                            <Plus size={24} /> <span className="text-[10px] font-black uppercase">Legg til</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STARTERS */}
                        {type === 'starters' && (editedResult?.categories || result?.categories) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(isEditing ? editedResult : result).categories.map((cat: any, i: number) => (
                                    <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-pink-200 transition-all break-inside-avoid">
                                        <div className="flex items-center gap-3 mb-4 text-pink-600">
                                            <MessageSquare size={20} />
                                            {isEditing ? (
                                                <input className="font-black uppercase text-xs tracking-widest bg-transparent border-b border-pink-200 w-full outline-none" value={cat.name} onChange={e => {const nc=[...editedResult.categories]; nc[i].name=e.target.value; setEditedResult({...editedResult, categories: nc})}} />
                                            ) : (
                                                <h4 className="font-black uppercase text-xs tracking-widest">{cat.name}</h4>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {cat.starters.map((s: string, idx: number) => (
                                                <div key={idx} className="p-3 bg-pink-50/50 rounded-xl flex gap-3 items-start group">
                                                    <span className="text-pink-400 font-black">"</span>
                                                    {isEditing ? (
                                                        <div className="flex-grow flex gap-2">
                                                            <input className="flex-grow bg-white border border-pink-100 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none" value={s} onChange={e => {const nc=[...editedResult.categories]; nc[i].starters[idx]=e.target.value; setEditedResult({...editedResult, categories: nc})}} />
                                                            <button onClick={() => {const nc=[...editedResult.categories]; nc[i].starters.splice(idx, 1); setEditedResult({...editedResult, categories: nc})}} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs sm:text-sm font-bold text-slate-700 italic">{s}</p>
                                                    )}
                                                </div>
                                            ))}
                                            {isEditing && <button onClick={() => {const nc=[...editedResult.categories]; nc[i].starters.push("Ny setning..."); setEditedResult({...editedResult, categories: nc})}} className="text-[10px] font-black uppercase text-pink-400 flex items-center gap-1 hover:text-pink-600"><Plus size={12}/> Legg til</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* GENERIC LISTS (Terms, Roles, Rhetoric) */}
                        {['terms', 'roles', 'devices'].map(key => {
                            const list = (isEditing ? editedResult : result)?.[key];
                            if (!list) return null;
                            const colorClass = key === 'terms' ? 'emerald' : key === 'roles' ? 'amber' : 'cyan';
                            
                            return (
                                <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {list.map((item: any, i: number) => (
                                        <div key={i} className={`p-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2 break-inside-avoid hover:border-${colorClass}-200 transition-all`}>
                                            <div className="flex justify-between items-start gap-2">
                                                {isEditing ? (
                                                    <input className="font-black text-sm uppercase tracking-tight w-full bg-slate-50 border-b border-slate-200 outline-none" value={item.word || item.name} onChange={e => {const nl=[...list]; nl[i][item.word !== undefined ? 'word' : 'name'] = e.target.value; setEditedResult({...editedResult, [key]: nl})}} />
                                                ) : (
                                                    <h4 className={`font-black text-sm uppercase tracking-tight text-${colorClass}-700`}>{item.word || item.name}</h4>
                                                )}
                                                {isEditing && <button onClick={() => {const nl=[...list]; nl.splice(i, 1); setEditedResult({...editedResult, [key]: nl})}} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>}
                                            </div>
                                            
                                            {/* Extra fields for roles */}
                                            {key === 'roles' && (
                                                isEditing ? <input className="text-[10px] font-black uppercase bg-slate-50 w-full p-1" value={item.action} onChange={e => {const nl=[...list]; nl[i].action=e.target.value; setEditedResult({...editedResult, [key]: nl})}} /> 
                                                : <p className={`text-[10px] font-black uppercase tracking-widest text-${colorClass}-500`}>{item.action}</p>
                                            )}

                                            {isEditing ? (
                                                <textarea className="text-xs font-medium text-slate-600 w-full h-16 bg-slate-50 p-2 rounded-lg resize-none outline-none" value={item.definition || item.description} onChange={e => {const nl=[...list]; nl[i][item.definition !== undefined ? 'definition' : 'description'] = e.target.value; setEditedResult({...editedResult, [key]: nl})}} />
                                            ) : (
                                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.definition || item.description}</p>
                                            )}

                                            {/* Extra field for rhetoric */}
                                            {key === 'devices' && item.example && (
                                                <div className={`mt-2 p-3 bg-${colorClass}-50/50 rounded-xl`}>
                                                    {isEditing ? <input className="w-full bg-transparent text-xs font-bold italic" value={item.example} onChange={e => {const nl=[...list]; nl[i].example=e.target.value; setEditedResult({...editedResult, [key]: nl})}} />
                                                    : <p className={`text-xs font-bold italic text-${colorClass}-800`}>"{item.example}"</p>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isEditing && (
                                        <button onClick={() => {const nl=[...list]; nl.push({word: 'Nytt', name: 'Nytt', definition: '...', description: '...', action: '...', example: '...'}); setEditedResult({...editedResult, [key]: nl})}} className={`p-6 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-all`}>
                                            <Plus size={24} /> <span className="text-[10px] font-black uppercase">Legg til</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* ASSESSMENT RUBRIC */}
                        {type === 'assessment' && (editedResult?.rubric || result?.rubric) && (
                            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm bg-white break-inside-avoid">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white border-b-4 border-indigo-500">
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-1/4">Område</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-1/4 text-slate-400">Lav måloppnåelse</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-1/4 text-indigo-300">Middels måloppnåelse</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-1/4 text-emerald-400">Høy måloppnåelse</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(isEditing ? editedResult : result).rubric.map((row: any, i: number) => (
                                            <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                                <td className="p-4 align-top font-black text-xs text-slate-900 uppercase">
                                                    {isEditing ? <input className="w-full bg-slate-100 p-1 rounded" value={row.area} onChange={e => {const nr=[...editedResult.rubric]; nr[i].area=e.target.value; setEditedResult({...editedResult, rubric: nr})}} /> : row.area}
                                                </td>
                                                <td className="p-4 align-top text-xs text-slate-500 font-medium italic">
                                                    {isEditing ? <textarea className="w-full bg-slate-100 p-1 rounded resize-none h-20" value={row.low} onChange={e => {const nr=[...editedResult.rubric]; nr[i].low=e.target.value; setEditedResult({...editedResult, rubric: nr})}} /> : row.low}
                                                </td>
                                                <td className="p-4 align-top text-xs text-slate-700 font-bold italic">
                                                    {isEditing ? <textarea className="w-full bg-slate-100 p-1 rounded resize-none h-20" value={row.medium} onChange={e => {const nr=[...editedResult.rubric]; nr[i].medium=e.target.value; setEditedResult({...editedResult, rubric: nr})}} /> : row.medium}
                                                </td>
                                                <td className="p-4 align-top text-xs text-emerald-700 font-black italic">
                                                    {isEditing ? <textarea className="w-full bg-slate-100 p-1 rounded resize-none h-20" value={row.high} onChange={e => {const nr=[...editedResult.rubric]; nr[i].high=e.target.value; setEditedResult({...editedResult, rubric: nr})}} /> : row.high}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20">
                        <BrainCircuit size={64} />
                        <div className="max-w-xs text-center">
                            <p className="font-black uppercase text-xs tracking-widest">Klar for generering</p>
                            <p className="text-[10px] font-bold mt-2 leading-relaxed">Velg fag og tema over for å lage skreddersydde verktøy.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

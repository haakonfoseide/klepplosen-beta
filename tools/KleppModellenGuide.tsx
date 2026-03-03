
import React, { useState, useRef, useEffect } from 'react';
import { Compass, ArrowRight, MessageCircle, FileText, CheckCircle2, Anchor, HelpCircle, ExternalLink, Lightbulb, Loader2, Clock, ChevronLeft, Ship, Map, Send, X, ShieldAlert, Sparkles, MessageSquare, ClipboardList, Mail, LayoutGrid, ScrollText, Heart, PenLine, Eye, ThumbsUp, User, Bot, GraduationCap, PlayCircle, BrainCircuit, CheckSquare, Microscope, Ear } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type ConcernType = 'fagleg' | 'sosial' | 'heim' | 'fraver' | 'atferd';
type SubView = 'main' | 'observation_helper' | 'parent_talk' | 'hypothesis_helper' | 'resource_hub';
type ParentMode = 'template' | 'roleplay';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
}

interface KleppModellenGuideProps {
    t: any;
    onBack: () => void;
}

export const KleppModellenGuide = ({ t, onBack }: KleppModellenGuideProps) => {
    const [subView, setSubView] = useState<SubView>('main');
    
    // Checklist State
    const [checklist, setChecklist] = useState({
        observed: false,
        talkedToStudent: false,
        strengthsMapped: false,
        logStarted: false
    });
    
    // Kai Chat & AI Tool State
    const [isKaiModalOpen, setIsKaiModalOpen] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isKaiThinking, setIsKaiThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Observation Wizard State
    const [obsStep, setObsStep] = useState(1);
    const [obsData, setObsData] = useState({
        context: '',
        observation: '',
        frequency: '',
        strength: ''
    });

    // Hypothesis Helper State
    const [hypoTags, setHypoTags] = useState<string[]>([]);
    const [hypoContext, setHypoContext] = useState('');
    const [hypoResult, setHypoResult] = useState<any[] | null>(null);

    // Parent Talk / Roleplay State
    const [parentMode, setParentMode] = useState<ParentMode>('template');
    const [roleplayHistory, setRoleplayHistory] = useState<ChatMessage[]>([]);
    const [roleplayScenario, setRoleplayScenario] = useState('worried');
    const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
    const roleplayScrollRef = useRef<HTMLDivElement>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    const RESOURCE_HUB = [
        { title: "Kjerne-verktøy", links: [
            { name: "Undringsprotokoll (Word)", url: "https://klepp.betreinnsats.no/wp-content/uploads/sites/20/2023/06/Undringsprotokoll-Klepp-kommune-1.docx" },
            { name: "Stafettloggen (Innlogging)", url: "https://www.stafettloggen.no/" },
            { name: "Barnets stemme (Samtaleskjema)", url: "https://klepp.betreinnsats.no/verktoy/samtaleverktoy/" },
            { name: "Samtykkeskjema", url: "https://klepp.betreinnsats.no/verktoy/skjema-og-maler/" }
        ]},
        { title: "Handlingsveiledere", links: [
            { name: "Skulefråvær og nærvær", url: "https://klepp.betreinnsats.no/verktoy/skulefraver/" },
            { name: "Bekymring for barnet", url: "https://klepp.betreinnsats.no/bti-modellen/niva-0/" },
            { name: "Sorg og krise", url: "https://klepp.betreinnsats.no/tema/sorg-og-krise/" },
            { name: "Vold og overgrep", url: "https://klepp.betreinnsats.no/tema/vald-og-overgrep/" }
        ]}
    ];

    const HYPOTHESIS_TAGS = ["Uro", "Passivitet", "Utagering", "Konsentrasjonsvansker", "Sosial tilbaketrekning", "Konflikter", "Skolevegring", "Trøtthet", "Manglende lekser", "Manglende utstyr"];
    const HYPOTHESIS_CONTEXTS = ["Klasserom", "Friminutt", "Overganger", "Gruppearbeid", "Ustrukturert tid", "Spesifikke fag", "Garderobe"];

    const handleAITask = async (taskType: 'formulate_observation' | 'parent_template' | 'analyze_hypothesis') => {
        setIsAILoading(true);
        setAiResult(null);
        setHypoResult(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            let prompt = "";

            if (taskType === 'analyze_hypothesis') {
                prompt = `Du er ein pedagogisk rettleiar (KleppLosen Kai).
                Læraren observerer følgjande atferd: ${hypoTags.join(', ')}.
                I situasjonen: ${hypoContext}.
                
                Oppgåve:
                Gi 3 moglege pedagogiske hypoteser (IKKJE diagnoser) på kvifor dette skjer. Fokuser på meistring, relasjon, og rammer.
                For kvar hypotese, gi eit konkret refleksjonsspørsmål læraren kan stille seg sjølv.
                
                Svarformat JSON: [{"hypothesis": "...", "question": "..."}, ...]`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                
                const data = JSON.parse(response.text || '[]');
                setHypoResult(data);

            } else if (taskType === 'formulate_observation') {
                prompt = `Du er KleppLosen Kai. Hjelp ein lærar med å formulere tekst til "Undringsprotokollen" (Nivå 0 i BTI/Kleppmodellen). 
                   Strukturert observasjon:
                   1. Kontekst: "${obsData.context}"
                   2. Observasjon: "${obsData.observation}"
                   3. Varigheit: "${obsData.frequency}"
                   4. Ressursar: "${obsData.strength}"

                   Oppgåve: Skriv ein samla, profesjonell og objektiv tekst. Nynorsk.`;
                   
                const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
                setAiResult(response.text?.replace(/\*/g, '') || "Feil.");

            } else {
                if (!userInput.trim()) return;
                prompt = `Lag invitasjon til undringssamtale. Bakgrunn: "${userInput}". Tone: Vennleg, samarbeidande. Nynorsk.`;
                const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
                setAiResult(response.text?.replace(/\*/g, '') || "Feil.");
            }

        } catch (e) {
            setError("Feil ved kontakt med AI-motoren.");
        } finally {
            setIsAILoading(false);
        }
    };

    // --- PARENT ROLEPLAY LOGIC ---
    const startRoleplay = async () => {
        setIsAILoading(true);
        setRoleplayHistory([]);
        setRoleplayFeedback(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Du er ein rollespel-bot. Du skal spele rolla som ein forelder til eleven "Alex".
            Læraren (brukaren) har invitert deg til ein samtale.
            
            Scenario: ${roleplayScenario === 'worried' ? 'Du er bekymra for at Alex ikkje har vener.' : roleplayScenario === 'angry' ? 'Du er irritert fordi du meiner skulen er for streng.' : 'Du er open, men travel og litt stressa.'}
            
            Din oppgåve:
            Start samtalen med ein kort replikk der du kjem inn i rommet eller tek telefonen.
            Ver naturleg, litt skeptisk men høfleg. Svar på nynorsk.
            IKKJE inkluder "Forelder:" i teksten.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setRoleplayHistory([{ role: 'model', text: response.text?.trim() || "Hei, eg kom så fort eg kunne." }]);
        } catch (e) { setError("Kunne ikkje starte rollespel."); } finally { setIsAILoading(false); }
    };

    const handleRoleplaySend = async () => {
        if (!userInput.trim()) return;
        const userMsg: ChatMessage = { role: 'user', text: userInput };
        const newHistory = [...roleplayHistory, userMsg];
        setRoleplayHistory(newHistory);
        setUserInput('');
        setIsAILoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Vi er i eit rollespel. Du er forelder, eg er lærar (din motpart).
            Scenario: ${roleplayScenario}.
            
            Historikk:
            ${newHistory.map(m => `${m.role === 'user' ? 'Lærar' : 'Forelder'}: ${m.text}`).join('\n')}
            
            Oppgåve: Svar som forelderen. Ver kort (1-2 setningar). Reager på det læraren seier. 
            Svar på nynorsk.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setRoleplayHistory([...newHistory, { role: 'model', text: response.text?.trim() || "..." }]);
        } catch (e) { setError("Feil."); } finally { setIsAILoading(false); }
    };

    const finishRoleplay = async () => {
        setIsAILoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Analyser denne samtalen mellom ein lærar og ein forelder.
            Gi kort pedagogisk feedback til læraren (Nynorsk).`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setRoleplayFeedback(response.text || "Feil.");
        } catch (e) { setError("Feil."); } finally { setIsAILoading(false); }
    };

    useEffect(() => { if (roleplayScrollRef.current) roleplayScrollRef.current.scrollTop = roleplayScrollRef.current.scrollHeight; }, [roleplayHistory]);

    // --- GENERAL CHAT LOGIC ---
    const sendMessageToKai = async (customMessage?: string) => {
        const messageToSend = customMessage || userInput;
        if (!messageToSend.trim()) return;
        
        const newUserMessage: ChatMessage = { role: 'user', text: messageToSend };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsKaiThinking(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Du er KleppLosen Kai (BTI-ekspert). Svar kort på nynorsk. Spørsmål: ${messageToSend}`,
            });
            setChatHistory(prev => [...prev, { role: 'model', text: response.text?.replace(/\*/g, '') || "Feil." }]);
        } catch (e) { setChatHistory(prev => [...prev, { role: 'model', text: "Feil.", isError: true }]); } finally { setIsKaiThinking(false); }
    };

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatHistory, isKaiThinking]);

    const reset = () => {
        setAiResult(null); setSubView('main');
        setObsStep(1); setObsData({context: '', observation: '', frequency: '', strength: ''});
        setParentMode('template'); setRoleplayHistory([]); setRoleplayFeedback(null);
        setHypoResult(null); setHypoTags([]); setHypoContext('');
        setChecklist({ observed: false, talkedToStudent: false, strengthsMapped: false, logStarted: false });
    };

    return (
        <div className="flex flex-col gap-6 max-w-full animate-in fade-in duration-500 pb-10 w-full">
            {/* Nav Bar */}
            <div className="flex items-center justify-between no-print px-2">
                <button onClick={subView === 'main' ? onBack : reset} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors p-2">
                    <ChevronLeft size={18} /> {subView === 'main' ? t.back : "Tilbake til oversikt"}
                </button>
            </div>

            {/* Main Header - Only visible on main dashboard */}
            {subView === 'main' && (
                <div className="bg-gradient-to-br from-sky-900 to-indigo-900 p-8 sm:p-12 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-b-4 border-sky-200/20 no-print">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Compass size={300} className="animate-pulse" /></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <Ship size={32} className="text-sky-200 animate-float" />
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter drop-shadow-lg">Navigasjon</h2>
                        </div>
                        <p className="text-sky-200 font-black uppercase text-xs tracking-[0.3em]">Kleppmodellen: Din guide i elevsaker</p>
                    </div>
                </div>
            )}

            {subView === 'main' ? (
                <div className="space-y-12">
                    {/* Process Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* PHASE 1 */}
                        <div className="space-y-4 group">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">1</div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 group-hover:text-teal-700 transition-colors">Undring & Kartlegging</h3>
                            </div>
                            <div className="bg-white p-2 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-teal-200 transition-all flex flex-col gap-2">
                                <button onClick={() => setSubView('observation_helper')} className="p-6 bg-teal-50/50 hover:bg-teal-50 rounded-[2rem] text-left transition-all group/btn border border-transparent hover:border-teal-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-3 bg-white text-teal-600 rounded-2xl shadow-sm"><Microscope size={24} /></div>
                                        <ArrowRight size={16} className="text-teal-300 group-hover/btn:text-teal-600 transition-colors" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm mb-1">Observasjon</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Få hjelp til objektiv beskrivelse for undringsprotokollen.</p>
                                </button>
                                <button onClick={() => setSubView('hypothesis_helper')} className="p-6 bg-slate-50 hover:bg-white rounded-[2rem] text-left transition-all group/btn border border-transparent hover:border-slate-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm"><BrainCircuit size={24} /></div>
                                        <ArrowRight size={16} className="text-slate-300 group-hover/btn:text-slate-600 transition-colors" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm mb-1">Hypotese-hjelp</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Hva ligger bak atferden? Utforsk pedagogiske hypoteser.</p>
                                </button>
                            </div>
                        </div>

                        {/* PHASE 2 */}
                        <div className="space-y-4 group">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">2</div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-700 transition-colors">Dialog & Involvering</h3>
                            </div>
                            <div className="bg-white p-2 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-indigo-200 transition-all flex flex-col gap-2">
                                <button onClick={() => setSubView('parent_talk')} className="p-6 bg-indigo-50/50 hover:bg-indigo-50 rounded-[2rem] text-left transition-all group/btn border border-transparent hover:border-indigo-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm"><Ear size={24} /></div>
                                        <ArrowRight size={16} className="text-indigo-300 group-hover/btn:text-indigo-600 transition-colors" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm mb-1">Den gode samtalen</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Mal for invitasjon og trening på vanskelige samtaler.</p>
                                </button>
                                
                                {/* Quick Checklist embedded directly */}
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-transparent">
                                    <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2"><CheckSquare size={12}/> Sjekkliste før Nivå 1</h4>
                                    <div className="space-y-2">
                                        {[
                                            {k: 'observed', l: 'Observert over tid'},
                                            {k: 'talkedToStudent', l: 'Barnets stemme'},
                                            {k: 'logStarted', l: 'Starta loggføring'}
                                        ].map(i => (
                                            <div key={i.k} onClick={() => setChecklist(p => ({...p, [i.k]: !p[i.k as keyof typeof checklist]}))} className="flex items-center gap-2 cursor-pointer group/check">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${checklist[i.k as keyof typeof checklist] ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                                    {checklist[i.k as keyof typeof checklist] && <CheckCircle2 size={10}/>}
                                                </div>
                                                <span className={`text-[10px] font-bold ${checklist[i.k as keyof typeof checklist] ? 'text-indigo-900' : 'text-slate-400'}`}>{i.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PHASE 3 */}
                        <div className="space-y-4 group">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">3</div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 group-hover:text-amber-700 transition-colors">Tiltak & Veien videre</h3>
                            </div>
                            <div className="bg-white p-2 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-amber-200 transition-all flex flex-col gap-2">
                                <button onClick={() => setSubView('resource_hub')} className="p-6 bg-amber-50/50 hover:bg-amber-50 rounded-[2rem] text-left transition-all group/btn border border-transparent hover:border-amber-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm"><LayoutGrid size={24} /></div>
                                        <ArrowRight size={16} className="text-amber-300 group-hover/btn:text-amber-600 transition-colors" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm mb-1">Ressurs-hub</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Direktelenker til Stafettlogg, rutiner og skjema.</p>
                                </button>
                                
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-transparent relative overflow-hidden group/chat cursor-pointer" onClick={() => setIsKaiModalOpen(true)}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><MessageCircle size={60} /></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                            <Bot size={20} />
                                            <h4 className="font-black uppercase text-xs">Spør Kai</h4>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                            "Er du usikker på neste steg? Jeg kan hjelpe deg å navigere i BTI-modellen."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // SUB-VIEWS RENDERED HERE
                <>
                    {subView === 'hypothesis_helper' && (
                        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 no-print">
                                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl"><BrainCircuit size={32} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hypotese-hjelp</h3>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Utforsk kva som ligg bak atferden</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    {/* Symptom Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">1. Kva ser du? (Observerbar atferd)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {HYPOTHESIS_TAGS.map(tag => (
                                                <button 
                                                    key={tag}
                                                    onClick={() => setHypoTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${hypoTags.includes(tag) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300'}`}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Context Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">2. I kva situasjon?</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {HYPOTHESIS_CONTEXTS.map(ctx => (
                                                <button 
                                                    key={ctx}
                                                    onClick={() => setHypoContext(ctx)}
                                                    className={`px-4 py-3 rounded-xl text-left text-[10px] font-black uppercase tracking-widest border transition-all ${hypoContext === ctx ? 'bg-teal-50 text-teal-800 border-teal-200 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    {ctx}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleAITask('analyze_hypothesis')}
                                        disabled={isAILoading || hypoTags.length === 0 || !hypoContext}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isAILoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                        Generer Hypoteser
                                    </button>
                                </div>

                                {/* Result Display */}
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative min-h-[400px]">
                                    {hypoResult ? (
                                        <div className="space-y-6 animate-in fade-in">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 mb-4 flex items-center gap-2"><Lightbulb size={16}/> Pedagogiske Hypoteser</h4>
                                            {hypoResult.map((item: any, i: number) => (
                                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-200 transition-all">
                                                    <h5 className="font-bold text-slate-800 text-sm mb-2">{item.hypothesis}</h5>
                                                    <div className="flex gap-3 items-start bg-teal-50/50 p-3 rounded-xl">
                                                        <HelpCircle size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs font-medium text-teal-800 italic">Refleksjon: {item.question}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4 text-center">
                                            <BrainCircuit size={64} />
                                            <p className="font-black uppercase tracking-widest text-[10px] max-w-[200px]">Velg atferd og kontekst for å få hjelp til å forstå årsaken.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {subView === 'observation_helper' && (
                        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 no-print"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><ClipboardList size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Undrings-støtte</h3><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Kai hjelper deg å formulere profesjonelle observasjonar til Undringsprotokollen</p></div></div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-6 no-print">
                                    <div className="flex gap-2 mb-4">
                                        {[1,2,3,4].map(s => (
                                            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${obsStep >= s ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                        ))}
                                    </div>
                                    
                                    {obsStep === 1 && (
                                        <div className="space-y-4 animate-in slide-in-from-right-4">
                                            <div className="flex items-center gap-2 text-indigo-600"><Map size={18}/><h4 className="text-sm font-black uppercase tracking-widest">Kontekst</h4></div>
                                            <p className="text-xs font-bold text-slate-500">Kor og når oppstår bekymringa? (Friminutt, klasserom, overgangar, spesielle fag?)</p>
                                            <textarea value={obsData.context} onChange={(e) => setObsData({...obsData, context: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Eks: I overgangen mellom friminutt og time, spesielt etter storefri..." autoFocus />
                                            <button onClick={() => setObsStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-600 transition-all flex justify-center gap-2">Neste <ArrowRight size={14} /></button>
                                        </div>
                                    )}
                                    
                                    {obsStep === 2 && (
                                        <div className="space-y-4 animate-in slide-in-from-right-4">
                                            <div className="flex items-center gap-2 text-indigo-600"><Eye size={18}/><h4 className="text-sm font-black uppercase tracking-widest">Observasjon</h4></div>
                                            <p className="text-xs font-bold text-slate-500">Kva ser du konkret? Beskriv åtferd utan å tolke årsak. (F.eks: 'Slår andre' istadenfor 'Er aggressiv')</p>
                                            <textarea value={obsData.observation} onChange={(e) => setObsData({...obsData, observation: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Eks: Eleven skubbar medelevar i køen..." autoFocus />
                                            <div className="flex gap-2">
                                                <button onClick={() => setObsStep(1)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200">Tilbake</button>
                                                <button onClick={() => setObsStep(3)} className="flex-grow py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-600 transition-all flex justify-center gap-2">Neste <ArrowRight size={14} /></button>
                                            </div>
                                        </div>
                                    )}

                                    {obsStep === 3 && (
                                        <div className="space-y-4 animate-in slide-in-from-right-4">
                                            <div className="flex items-center gap-2 text-indigo-600"><Clock size={18}/><h4 className="text-sm font-black uppercase tracking-widest">Omfang</h4></div>
                                            <p className="text-xs font-bold text-slate-500">Kor lenge har dette vart? Kor ofte skjer det?</p>
                                            <textarea value={obsData.frequency} onChange={(e) => setObsData({...obsData, frequency: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Eks: Dagleg siste to veker..." autoFocus />
                                            <div className="flex gap-2">
                                                <button onClick={() => setObsStep(2)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200">Tilbake</button>
                                                <button onClick={() => setObsStep(4)} className="flex-grow py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-600 transition-all flex justify-center gap-2">Neste <ArrowRight size={14} /></button>
                                            </div>
                                        </div>
                                    )}

                                    {obsStep === 4 && (
                                        <div className="space-y-4 animate-in slide-in-from-right-4">
                                            <div className="flex items-center gap-2 text-indigo-600"><ThumbsUp size={18}/><h4 className="text-sm font-black uppercase tracking-widest">Ressursar</h4></div>
                                            <p className="text-xs font-bold text-slate-500">Kva fungerer bra? Kva tid meistrar eleven seg?</p>
                                            <textarea value={obsData.strength} onChange={(e) => setObsData({...obsData, strength: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Eks: Eleven er veldig god i praktiske fag og når han får jobbe aleine..." autoFocus />
                                            <div className="flex gap-2">
                                                <button onClick={() => setObsStep(3)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200">Tilbake</button>
                                                <button onClick={() => handleAITask('formulate_observation')} disabled={isAILoading} className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 transition-all flex justify-center gap-2 shadow-lg">
                                                    {isAILoading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} Formuler Undring
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div id="print-protocol" className="bg-indigo-50/50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-inner flex flex-col relative min-h-[300px] print:bg-white print:border-none print:shadow-none print:p-0 print:absolute print:top-0 print:left-0 print:w-full print:h-full print:z-[1000]">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-6 flex items-center gap-2 print:text-black print:text-lg print:border-b-2 print:border-black print:pb-2 print:mb-8"><ScrollText size={14}/> Undringsprotokoll - Utkast</h4>
                                    {aiResult ? (
                                        <div className="animate-in fade-in space-y-6 h-full flex flex-col">
                                            <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex-grow print:border-none print:shadow-none print:p-0 print:text-base print:text-black">
                                                {aiResult}
                                            </div>
                                            <button onClick={() => window.print()} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm no-print">
                                                <FileText size={16} /> Last ned / Skriv ut
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-grow flex flex-col items-center justify-center opacity-30 gap-4 no-print">
                                            <PenLine size={48} className="text-indigo-300"/>
                                            <p className="text-xs font-bold text-indigo-300 text-center max-w-[200px]">Fyll ut stega til venstre så skriv Kai ein profesjonell tekst for deg.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {subView === 'parent_talk' && (
                        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4"><div className="p-4 bg-pink-50 text-pink-600 rounded-2xl"><Heart size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Samtale-maler</h3><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Terskel-senkar for dialog med heimen</p></div></div>
                                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                    <button onClick={() => { setParentMode('template'); setRoleplayHistory([]); }} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${parentMode === 'template' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'}`}>Skriv Invitasjon</button>
                                    <button onClick={() => setParentMode('roleplay')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${parentMode === 'roleplay' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'}`}><User size={12}/> Øv på samtalen</button>
                                </div>
                            </div>

                            {parentMode === 'template' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-4 animate-in slide-in-from-left-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2">Beskriv undringa di (Anonymt)</label>
                                        <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="T.d. 'Eg er bekymra for trivselen til eleven i friminutta...'" className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-500 transition-all shadow-inner resize-none" />
                                        <button onClick={() => handleAITask('parent_template')} disabled={isAILoading || !userInput} className="w-full py-5 bg-pink-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-pink-700 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                                            {isAILoading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />} Lag invitasjons-mal
                                        </button>
                                    </div>
                                    <div className="bg-pink-50/50 p-8 rounded-[2.5rem] border-2 border-pink-100 shadow-inner flex flex-col min-h-[300px]">
                                        <h4 className="text-[10px] font-black uppercase text-pink-400 tracking-widest mb-6 flex items-center gap-2"><Mail size={14}/> Forslag til melding/e-post</h4>
                                        {aiResult ? <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-2xl border border-pink-100 shadow-sm animate-in fade-in">"{aiResult}"</div> : <div className="flex-grow flex items-center justify-center opacity-20"><Anchor size={64}/></div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 h-[600px] flex flex-col animate-in slide-in-from-right-4">
                                    {roleplayHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg text-pink-500"><Bot size={40} /></div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Rollereise</h4>
                                                <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">Øv deg på den vanskelege samtalen i eit trygt rom. Vel eit scenario, og Kai spelar rolla som forelder.</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                                                <button onClick={() => setRoleplayScenario('worried')} className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-105 ${roleplayScenario === 'worried' ? 'bg-white border-pink-500 shadow-lg' : 'bg-white border-slate-100 hover:border-pink-200'}`}>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Scenario 1</span>
                                                    <span className="font-bold text-slate-800 text-sm">Bekymra for trivsel</span>
                                                </button>
                                                <button onClick={() => setRoleplayScenario('angry')} className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-105 ${roleplayScenario === 'angry' ? 'bg-white border-pink-500 shadow-lg' : 'bg-white border-slate-100 hover:border-pink-200'}`}>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Scenario 2</span>
                                                    <span className="font-bold text-slate-800 text-sm">Kritisk til undervisning</span>
                                                </button>
                                                <button onClick={() => setRoleplayScenario('busy')} className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-105 ${roleplayScenario === 'busy' ? 'bg-white border-pink-500 shadow-lg' : 'bg-white border-slate-100 hover:border-pink-200'}`}>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Scenario 3</span>
                                                    <span className="font-bold text-slate-800 text-sm">Travel og stressa</span>
                                                </button>
                                            </div>
                                            <button onClick={startRoleplay} disabled={isAILoading} className="px-8 py-4 bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-pink-700 transition-all shadow-xl flex items-center gap-2">
                                                {isAILoading ? <Loader2 className="animate-spin" size={16}/> : <PlayCircle size={16} />} Start Simulering
                                            </button>
                                        </div>
                                    ) : roleplayFeedback ? (
                                        <div className="h-full overflow-y-auto custom-scrollbar p-4 animate-in zoom-in-95">
                                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                                                <div className="flex items-center gap-3 text-pink-600">
                                                    <GraduationCap size={28} />
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Evaluering</h3>
                                                </div>
                                                <div className="prose prose-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {roleplayFeedback}
                                                </div>
                                                <button onClick={() => { setRoleplayHistory([]); setRoleplayFeedback(null); }} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Prøv igjen</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div ref={roleplayScrollRef} className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
                                                {roleplayHistory.map((msg, i) => (
                                                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 px-2">{msg.role === 'user' ? 'Deg (Lærer)' : 'Forelder'}</span>
                                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-pink-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isAILoading && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm"><Loader2 className="animate-spin text-slate-400" size={16}/></div></div>}
                                            </div>
                                            <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm rounded-b-[2rem] flex gap-2">
                                                <input 
                                                    value={userInput} 
                                                    onChange={e => setUserInput(e.target.value)} 
                                                    onKeyDown={e => e.key === 'Enter' && handleRoleplaySend()}
                                                    placeholder="Skriv svaret ditt her..." 
                                                    className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-400 transition-all"
                                                    autoFocus
                                                />
                                                <button onClick={handleRoleplaySend} disabled={!userInput.trim() || isAILoading} className="p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all disabled:opacity-50"><Send size={18} /></button>
                                                <button onClick={finishRoleplay} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all" title="Avslutt og få feedback"><CheckCircle2 size={18} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {subView === 'resource_hub' && (
                        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><LayoutGrid size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ressurs-hub</h3><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Hurtiglenker til Kleppmodellen sine verktøy</p></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {RESOURCE_HUB.map((cat, i) => (
                                    <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-3">{cat.title}</h4>
                                        <div className="space-y-3">
                                            {cat.links.map((l, idx) => (
                                                <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:border-emerald-400 border-2 border-transparent transition-all group">
                                                    <span className="text-xs font-black uppercase text-slate-700">{l.name}</span>
                                                    <ExternalLink size={16} className="text-slate-200 group-hover:text-emerald-500" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Kai Chat Modal */}
            {isKaiModalOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 no-print">
                    <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                            <div className="flex items-center gap-4"><div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><MessageSquare size={24} /></div><div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rettleiing frå Losen</h3></div></div>
                            <button onClick={() => { setIsKaiModalOpen(false); setChatHistory([]); }} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div ref={scrollRef} className="flex-grow p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/50">
                            {chatHistory.length === 0 && <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4"><Ship size={64}/><p className="text-xs font-black uppercase tracking-widest">Skildre di undring for å starte...</p></div>}
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}><p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p></div>
                                </div>
                            ))}
                            {isKaiThinking && <div className="flex justify-start"><div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-3"><Loader2 className="animate-spin text-amber-500" size={20} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kai navigerer...</span></div></div>}
                        </div>
                        <div className="p-6 sm:p-8 bg-white border-t border-slate-100">
                            <div className="mb-4 flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"><ShieldAlert size={16} /><p className="text-[8px] font-black uppercase tracking-wider">Hugs anonymisering! Ingen personopplysningar.</p></div>
                            <div className="flex gap-4 items-end">
                                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Skildre situasjonen..." className="flex-grow bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all resize-none max-h-32" />
                                <button onClick={() => sendMessageToKai()} disabled={!userInput.trim() || isKaiThinking} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"><Send size={24} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

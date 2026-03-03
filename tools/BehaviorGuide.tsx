
import React, { useState } from 'react';
import { CloudRain, CheckCircle2, Activity, HeartHandshake, Loader2, Sparkles, ArrowRight, ShieldCheck, ClipboardList, PenLine } from 'lucide-react';
import { Type } from "@google/genai";
import { generateContentWithRetry, parseResponse, AI_MODELS } from '../services/aiUtils';

interface AnalysisResult {
    functionHypothesis: string;
    triggers: string[];
    strategies: string[];
    logDraft: string;
}

export const BehaviorGuide = ({ t, language }: any) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [observation, setObservation] = useState('');
    const [context, setContext] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!observation || !context) return;
        setIsAnalyzing(true);
        
        try {
            const prompt = `Du er en spesialpedagogisk ekspert som bruker R.A.I.N-modellen (Recognize, Assess, Intervene, Notify).

            Observasjon (Recognize): "${observation}"
            Kontekst/Vurdering (Assess): "${context}"

            Basert på dette, generer følgende strukturert i JSON:
            1. En hypotese om atferdens funksjon (f.eks. oppmerksomhet, unngåelse, sansing, materielt).
            2. Mulige utløsende faktorer (triggers) basert på kontekst.
            3. 3-5 konkrete, pedagogiske lavterskel-tiltak (Intervene) for læreren i klasserommet.
            4. Et utkast til en objektiv, profesjonell loggføring (Notify) klar for systemet.

            Språk: ${language}.`;

            const response = await generateContentWithRetry(AI_MODELS.FLASH, prompt, {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        functionHypothesis: { type: Type.STRING },
                        triggers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        logDraft: { type: Type.STRING }
                    },
                    required: ["functionHypothesis", "triggers", "strategies", "logDraft"]
                }
            });

            const parsed = parseResponse(response.text);
            if (parsed) {
                setResult(parsed);
                setStep(3);
            }
        } catch (e) {
            console.error("BehaviorGuide analyze error:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-full gap-6 pb-20">
            {/* Header */}
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-inner no-print">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-teal-100 text-teal-700 rounded-[1.5rem] shadow-sm">
                        <CloudRain size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Atferds-losen</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">R.A.I.N. - Strukturert håndtering</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-100'}`}>
                            {step > s ? <CheckCircle2 size={16} /> : s}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 p-8 sm:p-12 overflow-y-auto custom-scrollbar relative">
                
                {step === 1 && (
                    <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-right-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Steg 1: Gjenkjenn (Recognize)</h3>
                            <p className="text-slate-500 font-medium text-sm">Beskriv den observerbare atferden så objektivt som mulig.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 flex items-center gap-2"><Activity size={14}/> Hva skjedde?</label>
                            <textarea 
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 text-sm outline-none focus:border-teal-500 transition-all resize-none shadow-inner placeholder:text-slate-300"
                                placeholder="Eks: Eleven reiste seg brått, dyttet stolen i gulvet og ropte 'Dette gidder jeg ikke'..."
                            />
                        </div>

                        <button 
                            onClick={() => setStep(2)} 
                            disabled={!observation.trim()}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            Gå til Kartlegging <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-right-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Steg 2: Kartlegg (Assess)</h3>
                            <p className="text-slate-500 font-medium text-sm">Hva er konteksten? Hva skjedde rett før? Hvordan reagerte omgivelsene?</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 opacity-70">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Din observasjon:</p>
                                <p className="text-xs font-bold text-slate-700 italic">"{observation}"</p>
                            </div>

                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 flex items-center gap-2"><ClipboardList size={14}/> Kontekst & Foranledning</label>
                            <textarea 
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 text-sm outline-none focus:border-teal-500 transition-all resize-none shadow-inner placeholder:text-slate-300"
                                placeholder="Eks: Vi skulle starte med matematikk. Det var mye støy i rommet. Eleven hadde nettopp kommet inn fra friminutt..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                                Tilbake
                            </button>
                            <button 
                                onClick={handleAnalyze} 
                                disabled={!context.trim() || isAnalyzing}
                                className="flex-grow py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-teal-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} 
                                Analyser & Foreslå Tiltak
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8">
                        {/* Summary & Hypothesis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-teal-50 p-8 rounded-[2.5rem] border border-teal-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 text-teal-700">
                                    <ShieldCheck size={24} />
                                    <h4 className="font-black uppercase text-sm tracking-widest">Hypotese: Funksjon</h4>
                                </div>
                                <p className="text-sm font-bold text-teal-900 leading-relaxed italic border-l-4 border-teal-300 pl-4">
                                    {result.functionHypothesis}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Activity size={24} />
                                    <h4 className="font-black uppercase text-sm tracking-widest">Mulige Triggers</h4>
                                </div>
                                <ul className="space-y-2">
                                    {result.triggers.map((t, i) => (
                                        <li key={i} className="flex gap-2 text-xs font-bold text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Interventions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><HeartHandshake size={20} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Steg 3: Tiltak (Intervene)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {result.strategies.map((strat, i) => (
                                    <div key={i} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-lg hover:border-teal-200 transition-all group">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4 shadow-md group-hover:bg-teal-600 transition-colors">{i+1}</div>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{strat}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Log Draft */}
                        <div className="space-y-6 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><PenLine size={20} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Steg 4: Dokumentasjon (Notify)</h3>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 relative group">
                                <div className="absolute top-0 right-0 px-4 py-2 bg-slate-200 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest text-slate-500">Utkast til logg</div>
                                <p className="text-sm font-medium text-slate-700 leading-loose font-mono whitespace-pre-wrap">{result.logDraft}</p>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button onClick={() => {setStep(1); setObservation(''); setContext(''); setResult(null);}} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 hover:text-slate-600 transition-all">
                                Start ny vurdering
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

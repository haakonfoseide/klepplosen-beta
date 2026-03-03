
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Sparkles, MessageCircle, ClipboardCheck, Users, BookOpen, Loader2, Printer, Plus, Check, ArrowRight, Edit, Save, Trash2, Wand2, Gamepad2, AlertCircle, Camera, Dice3, RefreshCcw } from 'lucide-react';
import { generateOracyContent, extractKeywordsFromImage } from './services/geminiService';
import { GRADES, COMMON_SUBJECTS } from './constants';
import { AliasGame } from './tools/AliasGame';

interface OracyToolboxProps {
  onBack: () => void;
  grade: string;
  language?: string;
}

type GeneratorType = 'starters' | 'assessment' | 'roles' | 'terms' | 'rhetoric' | 'alias';

export const OracyToolbox: React.FC<OracyToolboxProps> = ({ onBack, grade, language = 'nynorsk' }) => {
  const [activeTool, setActiveTool] = useState<GeneratorType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Game Mode State for Alias
  const [isPlayingAlias, setIsPlayingAlias] = useState(false);
  
  // Form States
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [theme, setTheme] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState(grade);
  const [includeFunWords, setIncludeFunWords] = useState(false);
  const [amount, setAmount] = useState(10);

  const tools = [
    { id: 'starters', title: 'Setningsstartere', icon: MessageCircle, color: 'bg-pink-100 text-pink-600', description: 'Fagspesifikke startere som hjelper samtalen i gang.' },
    { id: 'assessment', title: 'Vurderingsskjema', icon: ClipboardCheck, color: 'bg-indigo-100 text-indigo-600', description: 'Skreddersydd skjema basert på trinn og fokusområder.' },
    { id: 'roles', title: 'Rollekort', icon: Users, color: 'bg-amber-100 text-amber-600', description: 'Digitale kort som fordeler ansvar i gruppa.' },
    { id: 'alias', title: 'Fag-Alias', icon: Gamepad2, color: 'bg-purple-100 text-purple-600', description: 'Forklar fagord og tulleord uten å si selve ordet.' },
    { id: 'terms', title: 'Ordbank', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', description: 'Må-bruke-ord for å styrke faglig ordforråd.' },
    { id: 'rhetoric', title: 'Retoriske Virkemidler', icon: Wand2, color: 'bg-cyan-100 text-cyan-600', description: 'Eksempler på metaforer og grep i faglig diskurs.' }
  ];

  useEffect(() => {
    if (result) {
      setEditedResult(JSON.parse(JSON.stringify(result)));
    }
  }, [result]);

  useEffect(() => {
    if (activeTool === 'alias') setAmount(20);
    else if (activeTool === 'starters') setAmount(10);
    else if (activeTool === 'terms') setAmount(10);
    else if (activeTool === 'rhetoric') setAmount(6);
    else setAmount(10);
  }, [activeTool]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleScanPensum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
            const keywords = await extractKeywordsFromImage(base64Data, file.type, subject, selectedGrade);
            setResult({ terms: keywords });
        } catch (err) {
            setError("Kai klarte ikke å lese pensumbildet. Prøv et tydeligere bilde.");
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (type: GeneratorType) => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    setIsEditing(false);
    setIsPlayingAlias(false);
    try {
      const data = await generateOracyContent(type, {
        subject, topic, grade: selectedGrade, focusAreas, theme, includeFunWords, amount
      }, language);
      setResult(data);
    } catch (err: any) {
      setError("Det oppstod ein feil under generering. Prøv igjen om litt. (Feil: " + err.message + ")");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    setResult(editedResult);
    setIsEditing(false);
  };

  const shuffleAliasCards = () => {
    if (!editedResult?.aliasCards) return;
    const shuffled = [...editedResult.aliasCards].sort(() => Math.random() - 0.5);
    setEditedResult({ ...editedResult, aliasCards: shuffled });
    setResult({ ...result, aliasCards: shuffled });
  };

  if (isPlayingAlias && editedResult?.aliasCards) {
    return (
        <AliasGame 
            cards={editedResult.aliasCards} 
            onClose={() => setIsPlayingAlias(false)} 
            onShuffle={shuffleAliasCards} 
            t={{}} // Pass t props if needed for internal translations
        />
    );
  }

  const currentToolTitle = tools.find(t => t.id === activeTool)?.title || "Verktøy";

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-8 w-full pb-20 max-w-full">
      <div className="flex items-center justify-between no-print px-4">
        <button onClick={activeTool ? () => { setActiveTool(null); setResult(null); setError(null); setIsEditing(false); } : onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
          <ChevronLeft size={18} /> {activeTool ? 'Tilbake til verktøy' : 'Tilbake til guide'}
        </button>
        <div className="flex items-center gap-3">
          {result && (
            <>
              <button 
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${isEditing ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {isEditing ? <><Save size={16} /> Ferdig</> : <><Edit size={16} /> Rediger</>}
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                <Printer size={16} /> Skriv ut
              </button>
            </>
          )}
        </div>
      </div>

      {!activeTool ? (
        <div className="space-y-10 animate-in fade-in zoom-in-95 no-print max-w-full">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-6"><Sparkles size={36} /></div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">Oracy-generator</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">AI-drevet verktøykasse for læreren</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
            {tools.map(tool => (
              <button 
                key={tool.id} 
                onClick={() => setActiveTool(tool.id as GeneratorType)}
                className="bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-slate-50 shadow-xl hover:shadow-2xl hover:border-indigo-100 transition-all text-left group flex flex-col h-full overflow-hidden"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${tool.color} group-hover:scale-110 transition-transform`}>
                  <tool.icon size={28} />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 uppercase tracking-tight group-hover:text-indigo-600 transition-colors break-words">{tool.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-bold italic leading-relaxed mb-8 flex-grow">"{tool.description}"</p>
                <div className="mt-auto flex justify-end">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 max-w-full">
          <div className="lg:col-span-1 no-print">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8 sticky top-24">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <div className={`p-2 rounded-xl ${(tools.find(t => t.id === activeTool) as any).color}`}><Sparkles size={18} /></div>
                <span className="truncate">{currentToolTitle}</span>
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trinn</label>
                  <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {(activeTool === 'starters' || activeTool === 'rhetoric' || activeTool === 'alias' || activeTool === 'terms') && (
                    <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fag</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                        {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    </div>
                )}

                {(activeTool === 'starters' || activeTool === 'rhetoric' || activeTool === 'alias') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema</label>
                      <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Eks: Argumentasjon, Bærekraft..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 transition-all" />
                    </div>
                )}

                {(activeTool === 'starters' || activeTool === 'terms' || activeTool === 'rhetoric' || activeTool === 'alias') && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <span>Antall</span>
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100">{amount}</span>
                    </label>
                    <input type="range" min={activeTool === 'alias' ? 10 : 3} max={activeTool === 'alias' ? 40 : 25} value={amount} onChange={e => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>
                )}

                {activeTool === 'alias' && (
                  <button onClick={() => setIncludeFunWords(!includeFunWords)} className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-xs uppercase ${includeFunWords ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}>
                    <span className="flex items-center gap-2 truncate"><Dice3 size={16} className="flex-shrink-0" /> Gøy-ord</span>
                    {includeFunWords ? <Check size={16} strokeWidth={3} className="flex-shrink-0" /> : <Plus size={16} className="flex-shrink-0" />}
                  </button>
                )}

                {activeTool === 'assessment' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fokusområder</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Fysisk', 'Språklig', 'Kognitivt', 'Sosialt'].map(area => (
                        <button key={area} onClick={() => toggleFocusArea(area)} className={`p-3 rounded-xl border-2 text-left font-bold text-[10px] uppercase transition-all flex justify-between items-center ${focusAreas.includes(area) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}`}>
                          <span className="truncate">{area}</span>
                          {focusAreas.includes(area) ? <Check size={12} strokeWidth={3} className="flex-shrink-0" /> : <Plus size={12} className="flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === 'terms' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema</label>
                        <div className="relative">
                            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleScanPensum} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">
                                {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Skann
                            </button>
                        </div>
                      </div>
                      <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="Eks: Fotosyntesen..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                )}

                <button onClick={() => handleGenerate(activeTool)} disabled={isGenerating || isScanning || (activeTool === 'assessment' && focusAreas.length === 0) || (activeTool === 'terms' && !theme && !isScanning) || ((activeTool === 'rhetoric' || activeTool === 'alias') && !topic)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  {isGenerating || isScanning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {isScanning ? 'Kai leser bilde...' : 'Generer'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 max-w-full min-w-0">
            <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-slate-50 min-h-[600px] flex flex-col relative overflow-hidden print:p-0 print:shadow-none print:border-none print:bg-white print:rounded-none">
              {error && (
                <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[2rem] text-red-600 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 no-print">
                   <AlertCircle className="flex-shrink-0 mt-1" size={24} />
                   <div className="space-y-1 min-w-0 flex-grow"><p className="font-black uppercase text-xs tracking-widest">Oisann!</p><p className="text-sm font-bold leading-relaxed break-words">{error}</p></div>
                </div>
              )}

              {!result && !isGenerating && !isScanning ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 opacity-30 no-print py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"><Sparkles size={40} /></div>
                  <p className="font-black uppercase tracking-widest text-[10px] max-w-xs leading-relaxed">Klar til å generere {currentToolTitle.toLowerCase()}...</p>
                </div>
              ) : (isGenerating || isScanning) ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 no-print py-20">
                  <Loader2 className="animate-spin text-indigo-600" size={48} />
                  <p className="font-black uppercase tracking-widest text-xs animate-pulse">{isScanning ? 'Kai skanner bildet og finner begreper...' : 'Kai tenker så det knaker...'}</p>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 space-y-12 print:space-y-6 overflow-hidden max-w-full">
                  <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-black uppercase tracking-tight mb-1">{currentToolTitle}</h1>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest"><span>Fag: {subject}</span><span>Trinn: {selectedGrade}</span><span>Tema: {topic || theme}</span></div>
                  </div>

                  <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end no-print gap-4">
                    <div className="max-w-full min-w-0 flex-grow">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-slate-900 print:text-xl break-words">{currentToolTitle}</h2>
                      <p className="text-indigo-600 font-bold uppercase text-[9px] tracking-widest mt-2">{selectedGrade} • {activeTool === 'starters' || activeTool === 'alias' || activeTool === 'terms' ? subject : activeTool === 'rhetoric' ? topic : 'Oracy'}</p>
                    </div>
                  </div>

                  {activeTool === 'alias' && (editedResult?.aliasCards || result?.aliasCards) && (
                    <div className="space-y-8 max-w-full">
                        <div className="p-6 bg-purple-50 rounded-[2rem] border-2 border-purple-100 flex flex-col md:flex-row items-center justify-between gap-6 no-print shadow-sm overflow-hidden">
                           <div className="flex items-center gap-4 min-w-0">
                             <div className="p-3 bg-white text-purple-600 rounded-xl shadow-sm flex-shrink-0"><Gamepad2 size={24} /></div>
                             <div className="min-w-0"><h4 className="font-black text-purple-900 uppercase text-sm truncate">Spillmodus</h4><p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest break-words">Vis ordene stort på tavlen for klassen.</p></div>
                           </div>
                           <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                             <button onClick={shuffleAliasCards} className="flex-1 md:flex-none px-4 py-3 bg-white text-purple-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-100 transition-all border border-purple-200 shadow-sm flex items-center justify-center gap-2"><RefreshCcw size={14} /> Bland</button>
                             <button onClick={() => setIsPlayingAlias(true)} className="flex-1 md:flex-none px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"><Gamepad2 size={14} /> Start Spill</button>
                           </div>
                        </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                        {(editedResult?.aliasCards || result?.aliasCards || []).map((card: any, i: number) => (
                          <div key={i} className={`p-4 sm:p-6 rounded-2xl border-2 flex flex-col gap-2 relative group transition-all overflow-hidden break-inside-avoid break-words hyphens-auto print:p-3 print:rounded-lg ${card.category === 'gøy' ? 'bg-pink-50 border-pink-100 print:bg-slate-50' : 'bg-white border-slate-100 shadow-sm hover:border-purple-200 print:border-slate-300'}`}>
                             <div className="flex justify-between items-start gap-2">
                               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex-shrink-0 ${card.category === 'gøy' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-50 text-indigo-600'} print:text-black print:bg-white print:border`}>{card.category === 'gøy' ? 'Bonus' : 'Fag'}</span>
                               {isEditing && <button onClick={() => setEditedResult({...editedResult, aliasCards: editedResult.aliasCards.filter((_:any, idx:number) => idx !== i)})} className="text-slate-300 hover:text-red-500 transition-colors no-print flex-shrink-0"><Trash2 size={12} /></button>}
                             </div>
                             
                             {isEditing ? (
                               <div className="space-y-2">
                                 <input className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none text-sm font-black uppercase tracking-tight text-slate-800" value={card.word} onChange={(e) => { const nc = [...editedResult.aliasCards]; nc[i].word = e.target.value; setEditedResult({...editedResult, aliasCards: nc}); }} />
                                 <textarea className="w-full bg-transparent border border-slate-200 rounded p-1 text-[10px]" value={card.definition || ''} placeholder="Definisjon..." onChange={(e) => { const nc = [...editedResult.aliasCards]; nc[i].definition = e.target.value; setEditedResult({...editedResult, aliasCards: nc}); }} />
                               </div>
                             ) : (
                               <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-800 leading-tight print:text-[10px]">{card.word}</h4>
                             )}
                          </div>
                        ))}
                        {isEditing && (
                          <button onClick={() => setEditedResult({...editedResult, aliasCards: [...editedResult.aliasCards, {word: "Nytt ord", category: "fag", definition: "Forklaring..."}]})} className="p-4 sm:p-6 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center gap-2 text-indigo-400 hover:bg-indigo-50 transition-all font-black uppercase text-[10px] tracking-widest no-print"><Plus size={16} /> Legg til</button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeTool === 'starters' && (editedResult?.starters || result?.starters) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-3">
                      {(editedResult?.starters || result?.starters || []).map((s: string, i: number) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 italic flex items-start gap-4 shadow-sm group print:bg-white print:border-slate-300 print:p-4 print:rounded-lg overflow-hidden break-inside-avoid">
                          <span className="text-indigo-500 font-black text-xl leading-none print:text-black flex-shrink-0">“</span>
                          {isEditing ? (
                            <div className="flex-grow flex gap-2 min-w-0">
                              <input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold min-w-0" value={s} onChange={(e) => { const ns = [...editedResult.starters]; ns[i] = e.target.value; setEditedResult({...editedResult, starters: ns}); }} />
                              <button onClick={() => setEditedResult({...editedResult, starters: editedResult.starters.filter((_:any, idx:number) => idx !== i)})} className="p-2 text-red-500 hover:bg-red-50 rounded-lg no-print flex-shrink-0"><Trash2 size={16} /></button>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm leading-relaxed print:text-[11px] break-words flex-grow min-w-0">{s}</span>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <button onClick={() => setEditedResult({...editedResult, starters: [...editedResult.starters, "Ny starter..."]})} className="p-5 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center gap-2 text-indigo-400 hover:bg-indigo-50 transition-all font-black uppercase text-[10px] tracking-widest no-print"><Plus size={16} /> Legg til starter</button>
                      )}
                    </div>
                  )}

                  {activeTool === 'assessment' && (editedResult?.rubric || result?.rubric) && (
                    <div className="overflow-x-auto rounded-[1.5rem] border-2 border-slate-100 shadow-xl print:shadow-none print:border-slate-900 print:rounded-none no-print-scrollbar">
                      <table className="w-full text-left border-collapse print:text-[9pt] min-w-[500px] print:min-w-full">
                        <thead className="bg-slate-900 text-white print:bg-slate-100 print:text-black">
                          <tr><th className="p-4 text-[9px] font-black uppercase tracking-widest print:border print:p-2">Område</th><th className="p-4 text-[9px] font-black uppercase tracking-widest print:border print:p-2">I utvikling</th><th className="p-4 text-[9px] font-black uppercase tracking-widest text-indigo-300 print:text-black print:border print:p-2">Mestret</th><th className="p-4 text-[9px] font-black uppercase tracking-widest text-emerald-400 print:text-black print:border print:p-2">Eks.</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                          {(editedResult?.rubric || result?.rubric || []).map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors print:bg-white break-inside-avoid">
                              <td className="p-4 font-black text-slate-900 text-[10px] sm:text-xs min-w-[100px] print:border print:p-2 break-words">{isEditing ? <input className="w-full p-2 border rounded text-[10px] min-w-0" value={r.area} onChange={e => { const nr = [...editedResult.rubric]; nr[i].area = e.target.value; setEditedResult({...editedResult, rubric: nr}); }} /> : r.area}</td>
                              <td className="p-4 text-[9px] sm:text-xs text-slate-500 italic font-medium print:border print:p-2 print:text-black break-words">{isEditing ? <textarea className="w-full p-2 border rounded text-[9px] min-h-[60px] min-w-0" value={r.low} onChange={e => { const nr = [...editedResult.rubric]; nr[i].low = e.target.value; setEditedResult({...editedResult, rubric: nr}); }} /> : r.low}</td>
                              <td className="p-4 text-[9px] sm:text-xs text-slate-700 italic font-bold print:border print:p-2 print:text-black break-words">{isEditing ? <textarea className="w-full p-2 border rounded text-[9px] min-h-[60px] min-w-0" value={r.medium} onChange={e => { const nr = [...editedResult.rubric]; nr[i].medium = e.target.value; setEditedResult({...editedResult, rubric: nr}); }} /> : r.medium}</td>
                              <td className="p-4 text-[9px] sm:text-xs text-slate-900 italic font-black print:border print:p-2 print:text-black break-words">{isEditing ? <textarea className="w-full p-2 border rounded text-[9px] min-h-[60px] min-w-0" value={r.high} onChange={e => { const nr = [...editedResult.rubric]; nr[i].high = e.target.value; setEditedResult({...editedResult, rubric: nr}); }} /> : r.high}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTool === 'roles' && (editedResult?.roles || result?.roles) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                      {(editedResult?.roles || result?.roles || []).map((role: any, i: number) => (
                        <div key={i} className="p-6 bg-white border-4 border-slate-100 rounded-[2.5rem] shadow-lg space-y-4 relative overflow-hidden group hover:border-amber-400 transition-all print:shadow-none print:border-2 print:p-4 print:rounded-xl break-inside-avoid break-words">
                          <div className="absolute top-0 left-0 w-full h-2 bg-amber-400 print:bg-black"></div>
                          <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-base leading-tight">{isEditing ? <input className="w-full p-2 border rounded min-w-0" value={role.name} onChange={e => { const nr = [...editedResult.roles]; nr[i].name = e.target.value; setEditedResult({...editedResult, roles: nr}); }} /> : role.name}</h4>
                          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex items-start gap-3 print:bg-slate-50 print:border-slate-200"><Check size={16} className="text-amber-600 flex-shrink-0 mt-0.5 print:text-black" />{isEditing ? <textarea className="w-full p-2 border rounded text-xs min-w-0" value={role.action} onChange={e => { const nr = [...editedResult.roles]; nr[i].action = e.target.value; setEditedResult({...editedResult, roles: nr}); }} /> : <p className="text-xs font-black text-amber-900 leading-tight uppercase tracking-wide print:text-black min-w-0">{role.action}</p>}</div>
                          {isEditing ? <textarea className="w-full p-2 border rounded text-[10px] min-w-0" value={role.description} onChange={e => { const nr = [...editedResult.roles]; nr[i].description = e.target.value; setEditedResult({...editedResult, roles: nr}); }} /> : <p className="text-[10px] text-slate-400 font-bold leading-relaxed print:text-[9px] print:text-slate-600 min-w-0">{role.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTool === 'terms' && (editedResult?.terms || result?.terms) && (
                    <div className="space-y-3 print:space-y-2">
                      {(editedResult?.terms || result?.terms || []).map((t: any, i: number) => (
                        <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-50 transition-all group print:bg-white print:border-slate-300 print:p-3 print:rounded-lg overflow-hidden break-inside-avoid">
                           <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-base shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all flex-shrink-0 print:border-black print:text-black print:w-8 print:h-8 print:text-xs">{i + 1}</div>
                           <div className="flex-grow min-w-0 flex flex-col gap-1">
                             {isEditing ? (
                               <div className="space-y-2 min-w-0"><input className="w-full p-2 border rounded font-black text-xs min-w-0" value={t.word} onChange={e => { const nt = [...editedResult.terms]; nt[i].word = e.target.value; setEditedResult({...editedResult, terms: nt}); }} /><textarea className="w-full p-2 border rounded text-[10px] min-w-0" value={t.definition} onChange={e => { const nt = [...editedResult.terms]; nt[i].definition = e.target.value; setEditedResult({...editedResult, terms: nt}); }} /></div>
                             ) : (
                               <><h4 className="text-sm font-black uppercase tracking-tight text-slate-900 print:text-xs break-words">{t.word}</h4><p className="text-[10px] text-slate-500 font-bold italic break-words print:text-[9px] print:text-slate-700">"{t.definition}"</p></>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeTool === 'rhetoric' && (editedResult?.devices || result?.devices) && (
                    <div className="space-y-5 print:space-y-4 max-w-full">
                      {(editedResult?.devices || result?.devices || []).map((device: any, i: number) => (
                        <div key={i} className="p-6 bg-cyan-50 rounded-[2rem] sm:rounded-[2.5rem] border border-cyan-100 hover:bg-white hover:shadow-xl transition-all print:bg-white print:border-slate-400 print:p-4 print:rounded-xl overflow-hidden break-inside-avoid break-words">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start gap-4 min-w-0">
                                    <h4 className="text-lg font-black uppercase tracking-tight text-cyan-900 print:text-sm print:text-black break-words leading-tight flex-grow min-w-0">{isEditing ? <input className="w-full p-2 border rounded min-w-0" value={device.name} onChange={e => { const nd = [...editedResult.devices]; nd[i].name = e.target.value; setEditedResult({...editedResult, devices: nd}); }} /> : device.name}</h4>
                                    {isEditing && <button onClick={() => setEditedResult({...editedResult, devices: editedResult.devices.filter((_:any, idx:number) => idx !== i)})} className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors no-print"><Trash2 size={16} /></button>}
                                </div>
                                {isEditing ? <textarea className="w-full p-2 border rounded text-[10px] min-w-0" value={device.definition} onChange={e => { const nd = [...editedResult.devices]; nd[i].definition = e.target.value; setEditedResult({...editedResult, devices: nd}); }} placeholder="Forklaring..." /> : <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed print:text-black print:text-[10px] min-w-0">{device.definition}</p>}
                                <div className="p-4 bg-white rounded-2xl border-l-4 border-cyan-400 shadow-sm print:bg-slate-50 print:border-slate-800 print:p-3 print:rounded-lg overflow-hidden">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-1 print:text-black">Eksempel</p>
                                    {isEditing ? <textarea className="w-full p-2 border rounded text-xs font-bold min-w-0" value={device.example} onChange={e => { const nd = [...editedResult.devices]; nd[i].example = e.target.value; setEditedResult({...editedResult, devices: nd}); }} placeholder="Eksempelsetning..." /> : <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug print:text-[11px] min-w-0">"{device.example}"</p>}
                                </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-12 pt-8 border-t border-slate-100 text-center opacity-30 text-[9px] font-black uppercase tracking-[0.4em] hidden print:block">Generert av KleppLosen Kai AI</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { fetchCompetenceAims, matchStructuresToAim } from '../services/geminiService';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { Search, Compass, Loader2, Sparkles, Anchor, ArrowRight, Lightbulb, BookOpen, Layers } from 'lucide-react';
import { CLStructure } from '../types';

export const AimMatcher = ({ dbStructures, t }: { dbStructures: CLStructure[], t: any }) => {
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[5]);
  const [topic, setTopic] = useState('');
  const [aims, setAims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingAimId, setMatchingAimId] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  const handleFetchAims = async () => {
    setLoading(true); 
    setAims([]); 
    setMatches([]);
    setMatchingAimId(null);
    try { 
        const data = await fetchCompetenceAims(subject, grade, topic, 'nynorsk'); 
        setAims(data); 
    } 
    catch { alert("Feil ved henting."); } 
    finally { setLoading(false); }
  };

  const handleMatch = async (aim: any) => {
    setMatchingAimId(aim.id);
    setMatches([]);
    setLoading(true);
    try { 
        const data = await matchStructuresToAim(aim, dbStructures); 
        setMatches(data); 
    } 
    catch { alert("Feil ved matching."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full gap-8 max-w-full animate-in fade-in duration-500 pb-10">
      {/* Search Header */}
      <div className="bg-slate-50 p-6 sm:p-10 rounded-[3rem] border border-slate-100 space-y-8 no-print shadow-inner">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm"><Compass size={28} /></div>
            <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Mål-losen</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Finn rett kurs mellom læreplan og metode</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Fag</label>
                <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 focus:ring-4 ring-rose-50 outline-none appearance-none cursor-pointer">{COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Trinn</label>
                <select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 focus:ring-4 ring-rose-50 outline-none appearance-none cursor-pointer">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
            </div>
            <div className="space-y-1 lg:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Tema</label>
                <div className="flex gap-2">
                    <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Hva handler timen om?" className="flex-grow p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 focus:ring-4 ring-rose-50 outline-none" />
                    <button onClick={handleFetchAims} disabled={loading||!topic} className="px-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                        {loading && !matchingAimId ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                        Hent Mål
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow min-h-0 overflow-visible">
        {/* Aims List */}
        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 px-4 flex items-center gap-2"><BookOpen size={16}/> Velg et kompetansemål:</h4>
          <div className="space-y-3 px-2">
            {aims.length === 0 && !loading && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 gap-4">
                    <Compass size={64} />
                    <p className="font-black uppercase tracking-widest text-[10px]">Sett kursen over for å se kompetansemål</p>
                </div>
            )}
            {aims.map(aim=>(
                <button 
                    key={aim.id} 
                    onClick={()=>handleMatch(aim)} 
                    className={`w-full p-6 sm:p-8 border-4 text-left font-bold text-sm sm:text-base leading-relaxed shadow-sm transition-all relative overflow-hidden group rounded-[2.5rem] ${matchingAimId === aim.id ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xl scale-[1.02]' : 'bg-white border-white hover:border-rose-100 hover:shadow-lg text-slate-600'}`}
                >
                    {matchingAimId === aim.id && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/50 rounded-bl-full flex items-center justify-center pl-4 pb-4"><Anchor size={20} className="text-rose-600 animate-bounce" /></div>}
                    <p className="pr-10">{aim.text}</p>
                    <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Klikk for å finne metoder</span>
                        <ArrowRight size={14} className="text-rose-400" />
                    </div>
                </button>
            ))}
          </div>
        </div>

        {/* Matches Results */}
        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 px-4 flex items-center gap-2"><Layers size={16}/> Anbefalte CL-metoder:</h4>
          <div className="space-y-6 px-2">
            {loading && matchingAimId ? (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                    <Loader2 className="animate-spin text-rose-500" size={48} />
                    <p className="font-black uppercase tracking-widest text-xs text-rose-600">Kai navigerer i metodearkivet...</p>
                </div>
            ) : matches.length > 0 ? (
                matches.map((m, i) => {
                    const s = dbStructures.find((st:any) => st.id === m.structureId);
                    if (!s) return null;
                    return (
                        <div key={i} className="p-8 sm:p-10 bg-white border-4 border-slate-50 rounded-[3rem] shadow-xl animate-in slide-in-from-right-4 duration-500 hover:border-indigo-100 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">#{i+1}</div>
                                <div>
                                    <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight">{s.name}</h5>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Metode-match</span>
                                </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-900/40"><Lightbulb size={16} /><h6 className="text-[11px] font-black uppercase tracking-widest">Hvorfor den passer?</h6></div>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4">{m.justification}</p>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group-hover:bg-indigo-50/50 transition-colors">
                                    <div className="flex items-center gap-2 text-indigo-900/40 mb-3"><Sparkles size={16} /><h6 className="text-[11px] font-black uppercase tracking-widest">Idé til aktivitet</h6></div>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{m.activityIdea}</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                                    Se fullstendig metode <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : matchingAimId ? (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                    <Sparkles size={48} />
                    <p className="font-black uppercase text-xs tracking-widest">Kais visdom kommer snart...</p>
                </div>
            ) : (
                <div className="py-20 text-center opacity-10 flex flex-col items-center gap-3">
                    <Layers size={80} />
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

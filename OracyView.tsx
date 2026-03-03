
import React, { useState, useMemo } from 'react';
import { ChevronLeft, MessageCircle, Lightbulb, Check, Baby, Smile, GraduationCap, Wrench, ListChecks, Info, Quote, BookOpen, Clock, UserCheck, Compass, Waves, Anchor, Ship } from 'lucide-react';
import { ORACY_DOMAINS, ORACY_LEVEL_GOALS, ORACY_RULES, ORACY_SENTENCE_STARTERS, ORACY_TEACHER_STRATEGIES } from './constants';
import { OracyResource } from './types';

interface OracyViewProps {
  onBack: () => void;
  t: any;
  dbOracyResources?: OracyResource[]; 
}

const IconMap: Record<string, any> = {
  UserCheck: UserCheck,
  Clock: Clock,
  MessageSquarePlus: MessageCircle,
  Baby: Baby,
  Smile: Smile,
  GraduationCap: GraduationCap,
  Lightbulb: Lightbulb
};

export const OracyView: React.FC<OracyViewProps> = ({ onBack, t, dbOracyResources = [] }) => {
  const [tab, setTab] = useState<'framework' | 'progression' | 'toolbox'>('framework');

  const data = useMemo(() => {
    const getDbContent = (cat: string) => dbOracyResources.filter(r => r.category === cat).map(r => r.content);

    const dbFramework = getDbContent('framework');
    const dbProgression = getDbContent('progression');
    const dbStrategies = getDbContent('strategy');
    
    const dbToolbox = getDbContent('toolbox');
    const dbRules = dbToolbox.filter((i: any) => i.type === 'rule');
    const dbStarters = dbToolbox.filter((i: any) => i.type === 'starter');

    return {
      domains: dbFramework.length > 0 ? dbFramework : ORACY_DOMAINS,
      levels: dbProgression.length > 0 ? dbProgression : ORACY_LEVEL_GOALS,
      strategies: dbStrategies.length > 0 ? dbStrategies : ORACY_TEACHER_STRATEGIES,
      rules: dbRules.length > 0 ? dbRules : ORACY_RULES,
      starters: dbStarters.length > 0 ? dbStarters : ORACY_SENTENCE_STARTERS
    };
  }, [dbOracyResources]);

  const isFramework = tab === 'framework';
  const isProgression = tab === 'progression';
  const isToolbox = tab === 'toolbox';

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-8 w-full no-print pb-20">
      <div className="flex items-center justify-between px-2">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors p-2">
          <ChevronLeft size={18} /> {t.back}
        </button>
      </div>

      <div className="bg-white p-6 sm:p-12 rounded-[3rem] shadow-2xl border border-slate-50 relative overflow-hidden">
        {/* Maritime Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
          <Waves size={300} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl shadow-sm"><Anchor size={32} /></div>
                <div className="space-y-1">
                    <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase leading-none">{t.oracyGuide}</h2>
                    <p className="text-pink-600 font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs">Navigasjon for god samtale</p>
                </div>
            </div>
            <p className="max-w-xl text-slate-500 font-medium text-sm leading-relaxed">
                Oracy handlar om elevane si evne til å bruke språket for å lære, tenkje og kommunisere. 
                I Kleppskulen ser vi på god taleevne som ein nøkkel til både fagleg meistring og sosial inkludering.
            </p>
          </div>
          
          <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-[2rem] shadow-inner overflow-x-auto scrollbar-hide no-print">
            {[
              { id: 'framework', label: 'Rammeverket', icon: Compass },
              { id: 'progression', label: 'Progresjon', icon: Ship },
              { id: 'toolbox', label: 'Verktøykista', icon: Wrench }
            ].map(item => {
                // Fix: Assign lowercase property item.icon to capitalized variable for valid JSX rendering
                const ItemIcon = item.icon;
                return (
                <button 
                  key={item.id}
                  onClick={() => setTab(item.id as any)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${tab === item.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {ItemIcon && <ItemIcon size={14} />} {item.label}
                </button>
            )})}
          </div>
        </div>

        {isFramework && (
          <div className="space-y-16 animate-in slide-in-from-bottom-4">
            {/* Intro: Kva og Kvifor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-indigo-50 p-8 sm:p-10 rounded-[2.5rem] border border-indigo-100 space-y-6">
                    <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight flex items-center gap-3">
                        <Lightbulb className="text-indigo-600" /> Kva er Oracy?
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm flex-shrink-0">1</div>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                <span className="text-indigo-900">Å lære Å snakke:</span> Utvikle verbale ferdigheter som ordforråd, stemmebruk og kroppsspråk.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm flex-shrink-0">2</div>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                <span className="text-indigo-900">Å lære GJENNOM tale:</span> Bruke dialog som reiskap for å utforske fagstoff, kritisk tenking og refleksjon.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-pink-50 p-8 sm:p-10 rounded-[2.5rem] border border-pink-100 space-y-6">
                    <h3 className="text-xl font-black text-pink-900 uppercase tracking-tight flex items-center gap-3">
                        <Compass className="text-pink-600" /> Korleis implementere?
                    </h3>
                    <ul className="space-y-3">
                        {['Etabler samtalereglar i kvart klasserom.', 'Bruk Cooperative Learning for å gi alle taletid.', 'Modeller bruk av setningsstartarar.', 'Gi tilbakemelding på korleis elevane snakkar saman.'].map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm font-bold text-slate-700">
                                <Check size={18} className="text-pink-600 flex-shrink-0" /> {step}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* The 4 Lanterns (Domains) */}
            <div className="space-y-8">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-[0.2em]">Dei fire lyktene</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Domenene som belyser munnleg kommunikasjon</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.domains.map((domain: any, idx: number) => (
                    <div key={idx} className={`p-8 rounded-[3rem] bg-white border-2 ${domain.borderColor || 'border-slate-100'} shadow-xl flex flex-col h-full hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 ${domain.color || 'bg-slate-400'} opacity-[0.03] rounded-bl-full pointer-events-none`}></div>
                    
                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter mb-1">{domain.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{domain.subtitle}</p>
                    
                    <div className="space-y-8 flex-grow">
                        {domain.sections?.map((section: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                            <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-indigo-50 pb-1">
                            {section.title}
                            </h4>
                            <ul className="space-y-2">
                            {section.items?.map((item: string, i: number) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-600 font-bold leading-tight group-hover:text-slate-900 transition-colors">
                                <div className={`w-1 h-1 rounded-full mt-1.5 ${domain.color || 'bg-slate-400'}`}></div> {item}
                                </li>
                            ))}
                            </ul>
                        </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><Lightbulb size={14} /></div>
                        <span className="text-[9px] font-black uppercase text-amber-700 tracking-widest">Losen tipsar:</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">"{domain.usageTips}"</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            
            <div className="bg-indigo-950 p-8 sm:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute bottom-0 right-0 p-12 opacity-10"><Quote size={200} /></div>
               <div className="max-w-2xl space-y-6 relative z-10">
                 <h4 className="text-pink-400 font-black uppercase tracking-[0.3em] text-xs">Motto for Oracy i Kleppskulen</h4>
                 <p className="text-3xl sm:text-5xl font-black leading-[1.1] italic tracking-tight">
                   "Vi snakkar ikkje for å fylle rommet, men for å bygge forståing."
                 </p>
                 <div className="h-1 w-20 bg-pink-500 rounded-full"></div>
                 <p className="text-slate-400 font-medium text-base leading-relaxed">
                   Når kvar elev får verktøya til å uttrykke seg og lytte aktivt, skapar vi eit klasserom der alle stemmer tel, og der læring skjer i fellesskap.
                 </p>
               </div>
            </div>
          </div>
        )}

        {isProgression && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-50 p-8 sm:p-12 rounded-[3rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-8 shadow-inner overflow-hidden relative">
              <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none"><Ship size={200}/></div>
              <div className="p-5 bg-white rounded-[2rem] text-indigo-600 shadow-xl flex-shrink-0 border-4 border-indigo-50"><Info size={40} /></div>
              <div className="space-y-2">
                  <h4 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Veksttrappa</h4>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                    Oracy er ein ferdigheit som må trenast over tid. Denne stigen viser korleis vi flyttar oss frå grunnleggjande tryggleik til avansert akademisk samtale og refleksjon.
                  </p>
              </div>
            </div>

            <div className="space-y-8">
              {data.levels.map((level: any, idx: number) => {
                const Icon = IconMap[level.icon] || IconMap[level.level?.includes('1.') ? 'Baby' : level.level?.includes('5.') ? 'Smile' : 'GraduationCap'] || Smile;
                return (
                  <div key={idx} className={`p-8 sm:p-12 rounded-[3.5rem] ${level.color || 'bg-slate-50'} border-4 border-white shadow-2xl group hover:scale-[1.01] transition-all duration-500 relative overflow-hidden`}>
                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                      <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white flex-shrink-0 bg-white ${level.textColor || 'text-slate-600'} group-hover:rotate-6 transition-transform`}>
                        <Icon size={48} />
                      </div>
                      <div className="space-y-6 flex-grow">
                        <div className="space-y-1">
                          <p className={`text-[11px] font-black uppercase tracking-[0.5em] ${level.textColor || 'text-slate-500'}`}>{level.level}</p>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{level.focus}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {level.goals.map((goal: string, i: number) => (
                            <div key={i} className="flex gap-4 bg-white/60 p-5 rounded-2xl backdrop-blur-md border border-white/80 shadow-sm group-hover:bg-white/90 transition-all">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-600 text-white shadow-lg`}>
                                <Check size={14} strokeWidth={4} />
                              </div>
                              <p className="text-xs sm:text-sm font-black text-slate-700 leading-tight">{goal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isToolbox && (
          <div className="max-w-6xl mx-auto space-y-16 animate-in slide-in-from-bottom-4 pb-12">
            
            {/* Samtalereglar */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                <div className="w-14 h-14 bg-pink-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-pink-100"><MessageCircle size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{t.oracyRules}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Sjøvettsreglar for klasserommet</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.rules.map((rule: any, idx: number) => (
                  <div key={idx} className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-50 flex flex-col gap-4 hover:bg-white hover:shadow-2xl hover:border-pink-200 transition-all group shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">{idx+1}</div>
                    <h4 className="text-xl font-black text-pink-700 uppercase tracking-tight leading-none">{rule.title}</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed group-hover:text-slate-700 italic">"{rule.text}"</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Setningsstartarar */}
            <section className="space-y-10">
              <div className="flex items-center gap-4 px-2">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-amber-100"><Quote size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{t.sentenceStarters}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Stillas for samtalen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data.starters.map((starter: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col hover:border-amber-300 transition-all hover:shadow-2xl group">
                    <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-center">
                       <h5 className="font-black uppercase text-xs text-amber-700 tracking-[0.2em]">{starter.category}</h5>
                    </div>
                    <div className="p-8 space-y-4 flex-grow">
                      {starter.examples.map((ex: string, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-600 italic border-l-4 border-amber-400 group-hover:bg-white transition-all shadow-sm">
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Vurderingsform */}
            <section className="space-y-10">
              <div className="flex items-center gap-4 px-2">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-emerald-100"><ListChecks size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{t.assessmentForm}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Observasjon og tilbakemelding</p>
                </div>
              </div>
              <div className="bg-white rounded-[4rem] border-4 border-slate-50 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b-4 border-emerald-500">
                        <th className="p-8 text-[11px] font-black uppercase tracking-[0.3em]">Ferdighet</th>
                        <th className="p-8 text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em]">Nivå: I utvikling</th>
                        <th className="p-8 text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em]">Nivå: Mestret</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'Turtaking', low: 'Avbryter ofte eller tar ikke ordet uoppfordret.', high: 'Venter på tur og inviterer andre inn i samtalen med spørsmål.' },
                        { label: 'Aktiv lytting', low: 'Viser lite tegn til å ha fått med seg innholdet.', high: 'Bygger direkte videre på det andre har sagt med henvisning.' },
                        { label: 'Begrunnelse', low: 'Sier meningen sin uten forklaring.', high: 'Bruker eksempler, kilder eller logikk for å underbygge.' }
                      ].map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-8 font-black text-slate-800 text-sm uppercase tracking-tight">{item.label}</td>
                            <td className="p-8 text-xs sm:text-sm font-bold text-slate-500 italic leading-relaxed">{item.low}</td>
                            <td className="p-8 text-xs sm:text-sm font-bold text-slate-700 italic leading-relaxed">{item.high}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Lærarstrategiar */}
            <section className="space-y-10 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-4 px-2">
                <div className="w-14 h-14 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-indigo-100"><BookOpen size={32} /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{t.teacherStrategies}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Korleis leie samtalen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data.strategies.map((strategy: any, idx: number) => {
                  const Icon = IconMap[strategy.icon] || Lightbulb;
                  return (
                    <div key={idx} className="p-10 bg-indigo-50/50 rounded-[3.5rem] border-2 border-indigo-100 flex flex-col gap-6 hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all group">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:rotate-6 transition-all border-2 border-indigo-50">
                         <Icon size={32} />
                      </div>
                      <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tight leading-none">{strategy.title}</h4>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{strategy.description}"</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

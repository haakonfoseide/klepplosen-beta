
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Printer, Settings, Layout, Zap, Plus, X, Trash2, Edit2, Link as LinkIcon, ExternalLink, Check, BookOpen } from 'lucide-react';
import { CalendarEvent, AnnualPlanItem, TimeSlot, SavedPlan, DayMemo, CLStructure } from './types';
import { COMMON_SUBJECTS, SUBJECT_ICONS } from './constants';
import { storageService } from './services/storageService';
import { SeilasTools } from './components/seilas/SeilasTools';
import { Loader2 } from 'lucide-react';

interface SeilasplanViewProps {
  onBack: () => void;
}

const DEFAULT_SLOTS: TimeSlot[] = [
    { id: 's1', label: '1. Økt', start: '08:30', end: '09:15' },
    { id: 's2', label: '2. Økt', start: '09:15', end: '10:00' },
    { id: 'b1', label: 'Friminutt', start: '10:00', end: '10:15' },
    { id: 's3', label: '3. Økt', start: '10:15', end: '11:15' },
    { id: 'b2', label: 'Lunsj', start: '11:15', end: '11:45' },
    { id: 's4', label: '4. Økt', start: '11:45', end: '12:45' },
    { id: 's5', label: '5. Økt', start: '13:00', end: '14:00' },
];

const STORAGE_KEY_EVENTS = 'klepplosen_seilas_events_v3';
const STORAGE_KEY_SLOTS = 'klepplosen_seilas_slots_v3';
const STORAGE_KEY_ANNUAL = 'klepplosen_seilas_annual_v3';
const STORAGE_KEY_MEMOS = 'klepplosen_seilas_memos_v1';
const STORAGE_KEY_TODO = 'klepplosen_seilas_todo_v1';

const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

const EVENT_TYPE_COLORS: Record<string, string> = {
    lesson: 'border-indigo-200 bg-white text-indigo-900 shadow-indigo-100/50',
    meeting: 'border-amber-200 bg-amber-50 text-amber-900 shadow-amber-100/50',
    duty: 'border-rose-200 bg-rose-50 text-rose-900 shadow-rose-100/50',
    admin: 'border-slate-200 bg-slate-50 text-slate-900 shadow-slate-100/50',
    break: 'border-transparent bg-slate-100/50 text-slate-400'
};

export const SeilasplanView: React.FC<SeilasplanViewProps> = ({ onBack }) => {
  const [currentWeek, setCurrentWeek] = useState(getWeekNumber(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      return saved ? JSON.parse(saved) : [];
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_SLOTS);
      return saved ? JSON.parse(saved) : DEFAULT_SLOTS;
  });
  const [annualPlan] = useState<AnnualPlanItem[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_ANNUAL);
      return saved ? JSON.parse(saved) : [];
  });
  const [memos, setMemos] = useState<DayMemo[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_MEMOS);
      return saved ? JSON.parse(saved) : [];
  });
  const [todos, setTodos] = useState<{id:string, text:string, done:boolean}[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_TODO);
      return saved ? JSON.parse(saved) : [];
  });
  const [dbStructures, setDbStructures] = useState<CLStructure[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  
  // Library / Archive Data
  const [myPlans, setMyPlans] = useState<SavedPlan[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent>>({});
  const [isNewEvent, setIsNewEvent] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadLibrary = async () => {
        const user = await storageService.getCurrentUser();
        if (user) {
            const plans = await storageService.getMyPlans(user.id);
            setMyPlans(plans);
            setIsGuest(false);
        } else {
            setIsGuest(true);
            setMyPlans([]);
        }
        setLoadingLibrary(false);
    };

    const loadStructures = async () => {
        const structs = await storageService.getCLStructures();
        setDbStructures(structs);
    };

    loadLibrary();
    loadStructures();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(timeSlots)); }, [timeSlots]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_ANNUAL, JSON.stringify(annualPlan)); }, [annualPlan]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos)); }, [memos]);
  
  // Callback for child component to save todos
  const handleTodosChange = (newTodos: {id:string, text:string, done:boolean}[]) => {
      setTodos(newTodos);
      localStorage.setItem(STORAGE_KEY_TODO, JSON.stringify(newTodos));
  };

  // --- HANDLERS ---
  const toggleEventDone = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isDone: !ev.isDone } : ev));
  };

  const updateMemo = (day: string, text: string) => {
      setMemos(prev => {
          const filtered = prev.filter(m => !(m.day === day && m.week === currentWeek));
          if (!text.trim()) return filtered;
          return [...filtered, { id: crypto.randomUUID(), day, week: currentWeek, text }];
      });
  };

  const handleOpenModal = (event?: CalendarEvent, day?: string, slotId?: string) => {
    if (event) {
        setEditingEvent({ ...event });
        setIsNewEvent(false);
    } else {
        setEditingEvent({
            id: crypto.randomUUID(),
            day: day as any || 'Mandag',
            slotId: slotId || timeSlots[0].id,
            type: 'lesson',
            subject: 'Norsk',
            title: '',
            topic: '',
            notes: '',
            isDone: false,
            resources: []
        });
        setIsNewEvent(true);
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!editingEvent.day || !editingEvent.slotId) return;
    const eventToSave = { ...editingEvent, title: editingEvent.title || editingEvent.topic || (editingEvent.type === 'lesson' ? editingEvent.subject : 'Ny Hendelse') } as CalendarEvent;
    setEvents(prev => {
        const filtered = isNewEvent ? prev : prev.filter(e => e.id !== eventToSave.id);
        return [...filtered, eventToSave];
    });
    setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
      if (editingEvent.id) setEvents(prev => prev.filter(e => e.id !== editingEvent.id));
      setIsModalOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, plan: SavedPlan) => {
      e.dataTransfer.setData('planId', plan.id);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent, day: string, slotId: string) => {
      e.preventDefault();
      const planId = e.dataTransfer.getData('planId');
      const plan = myPlans.find(p => p.id === planId);
      if (plan) {
          setEvents(prev => [...prev, {
              id: crypto.randomUUID(),
              day: day as any,
              slotId,
              type: 'lesson',
              subject: plan.subject,
              topic: plan.topic,
              title: plan.task?.title || plan.topic || 'Uten tittel',
              linkedPlanId: plan.id,
              clStructureId: plan.task?.clStructureId,
              isDone: false
          }]);
      }
  };

  const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];
  const weekTopic = annualPlan.find(p => p.week === currentWeek);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in slide-in-from-right-8 pb-4 bg-slate-50/50">
      {/* Top Navigation */}
      <div className="flex items-center justify-between no-print mb-6 px-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
            <ChevronLeft size={24} className="text-slate-400" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Kais Seilasplan</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Ukeoversikt & Planlegging</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={() => setShowTools(!showTools)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showTools ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
             <Zap size={14} /> Kommandobru
           </button>
           <button onClick={() => setShowLibrary(!showLibrary)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showLibrary ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
             <Layout size={14} /> Bibliotek
           </button>
           <div className="h-10 w-px bg-slate-200 mx-2" />
           <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
             <Settings size={20} />
           </button>
           <button onClick={() => window.print()} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg">
             <Printer size={20} />
           </button>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0 px-4 pb-2">
          
          {/* TOOLBAR SIDEBAR (LEFT) - Extracted for performance */}
          <SeilasTools show={showTools} initialTodos={todos} onTodosChange={handleTodosChange} />

          {/* MAIN CALENDAR AREA */}
          <div className="flex-grow bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 flex flex-col overflow-hidden relative">
            
            {/* Calendar Header Control */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"><ChevronLeft size={20} /></button>
                        <div className="flex flex-col items-center min-w-[100px]">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">UKE {currentWeek}</h2>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em]">Semester 2026</span>
                        </div>
                        <button onClick={() => setCurrentWeek(Math.min(52, currentWeek + 1))} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"><ChevronLeft size={20} className="rotate-180" /></button>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tema fra årsplan:</span>
                        <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{weekTopic ? weekTopic.topic : 'INGEN TEMA LAGT INN'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {COMMON_SUBJECTS.slice(0, 5).map(s => (
                            <div key={s} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 shadow-sm" title={s}>
                                {React.createElement(SUBJECT_ICONS[s] || BookOpen, { size: 14 })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-grow overflow-auto custom-scrollbar p-8 bg-slate-50/30 relative">
                <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-5 min-w-[1000px]">
                    
                    {/* Headers */}
                    <div className="sticky top-0 z-10"></div>
                    {days.map(day => (
                        <div key={day} className="text-center sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-[1.5rem] mb-4 shadow-sm border border-slate-100 p-4">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{day}</h4>
                            <p className="text-[9px] font-bold text-indigo-500 mt-1 uppercase">Tokt-dag</p>
                        </div>
                    ))}

                    {/* Grid Rows */}
                    {timeSlots.map(slot => (
                        <React.Fragment key={slot.id}>
                            {/* Time Slot Label */}
                            <div className="flex flex-col justify-center items-end pr-6 border-r-2 border-slate-100 border-dashed py-4">
                                <span className="text-[11px] font-black text-slate-900">{slot.start}</span>
                                <span className="text-[9px] font-bold text-slate-400">{slot.end}</span>
                                <span className="text-[8px] font-black text-indigo-400 uppercase mt-2 tracking-widest text-right">{slot.label}</span>
                            </div>

                            {/* Cells */}
                            {days.map(day => {
                                const event = events.find(e => e.day === day && e.slotId === slot.id);
                                const isBreak = slot.label.toLowerCase().includes('fri') || slot.label.toLowerCase().includes('lunsj') || slot.label.toLowerCase().includes('pause');
                                const clStruct = event?.clStructureId ? dbStructures.find(s => s.id === event.clStructureId) : null;

                                return (
                                    <div 
                                        key={`${day}-${slot.id}`}
                                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                        onDrop={(e) => handleDrop(e, day, slot.id)}
                                        onClick={() => handleOpenModal(event, day, slot.id)}
                                        className={`
                                            min-h-[100px] rounded-[1.8rem] border-2 transition-all p-4 cursor-pointer relative group flex flex-col gap-2
                                            ${event 
                                                ? `${EVENT_TYPE_COLORS[event.type]} ${event.isDone ? 'opacity-40 border-slate-200' : 'shadow-xl'}` 
                                                : isBreak 
                                                    ? 'bg-slate-100/50 border-transparent border-dashed' 
                                                    : 'bg-white border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/5 hover:scale-[1.02]'
                                            }
                                        `}
                                    >
                                        {event ? (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        {event.subject && <div className="p-1.5 bg-white/50 rounded-lg shadow-sm">{React.createElement(SUBJECT_ICONS[event.subject] || BookOpen, { size: 14 })}</div>}
                                                        {event.clStructureId && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200 animate-pulse" title={`CL: ${clStruct?.name || 'Metode'}`} />}
                                                    </div>
                                                    <button onClick={(e) => toggleEventDone(e, event.id)} className={`p-1 rounded-full transition-colors ${event.isDone ? 'text-emerald-600 bg-emerald-50' : 'text-slate-200 hover:text-emerald-500'}`}>
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                                <p className="font-black text-xs leading-tight uppercase tracking-tight break-words pr-4">{event.title}</p>
                                                <div className="flex flex-wrap gap-1 mt-auto">
                                                    {event.room && <span className="text-[8px] font-black uppercase text-slate-400 bg-white/40 px-1.5 py-0.5 rounded-md border border-slate-200/50">{event.room}</span>}
                                                    {event.linkedPlanId && <div className="text-emerald-500 p-0.5"><LinkIcon size={10} /></div>}
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="p-1.5 bg-white/80 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100"><Edit2 size={12} /></div>
                                                </div>
                                            </>
                                        ) : (
                                            !isBreak && (
                                                <div className="h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Plus size={20} className="text-indigo-300" />
                                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-2">Ny Økt</span>
                                                </div>
                                            )
                                        )}
                                        {isBreak && !event && <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] text-center mt-6 rotate-0">{slot.label}</p>}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    
                    {/* DAILY MEMOS ROW */}
                    <div className="sticky bottom-0 z-10"></div>
                    {days.map(day => {
                        const memo = memos.find(m => m.day === day && m.week === currentWeek);
                        return (
                            <div key={`memo-${day}`} className="bg-amber-50 rounded-[1.5rem] border-2 border-amber-100 p-3 mt-4 shadow-sm group relative">
                                <div className="flex items-center gap-2 mb-2 text-amber-700">
                                    <BookOpen size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Dagens Logg</span>
                                </div>
                                <textarea 
                                    value={memo?.text || ''} 
                                    onChange={e => updateMemo(day, e.target.value)}
                                    placeholder="Notater for dagen..."
                                    className="w-full bg-transparent text-[10px] font-bold text-amber-900 placeholder:text-amber-200 outline-none resize-none h-16 custom-scrollbar"
                                />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">!</div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>

          {/* LIBRARY SIDEBAR (RIGHT) */}
          {showLibrary && (
              <div className="w-80 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 flex-shrink-0">
                  <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
                      <h3 className="font-black uppercase text-xs tracking-widest text-emerald-900 flex items-center gap-2">
                        <Layout size={16} /> Bibliotek
                      </h3>
                      <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Dra planer inn i kalenderen:</p>
                      {loadingLibrary ? (
                          <div className="text-center py-10 opacity-50"><Loader2 className="animate-spin mx-auto mb-2 text-emerald-500" /> <span className="text-xs font-bold uppercase">Laster skattekisten...</span></div>
                      ) : isGuest ? (
                          <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                              <p className="text-xs font-bold text-slate-400 mb-2">Du seiler som gjest</p>
                              <p className="text-[9px] text-slate-300 uppercase tracking-widest">Logg inn for å se dine lagrede planer her.</p>
                          </div>
                      ) : myPlans.length === 0 ? (
                          <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                              <p className="text-xs font-bold text-slate-400 mb-2">Tom skattekiste!</p>
                              <p className="text-[9px] text-slate-300 uppercase tracking-widest">Lag planer i Planleggeren for å se dem her.</p>
                          </div>
                      ) : (
                          myPlans.map(plan => (
                              <div 
                                key={plan.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, plan)}
                                className="p-5 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm hover:border-emerald-400 hover:shadow-lg cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden"
                              >
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{plan.subject}</span>
                                  </div>
                                  <h4 className="font-black text-xs text-slate-800 line-clamp-2 mb-1 uppercase tracking-tight">{plan.task?.title || 'Uten tittel'}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 truncate">{plan.topic}</p>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* EVENT EDIT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                          {isNewEvent ? <Plus size={24} /> : <Edit2 size={24} />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                            {isNewEvent ? 'Planlegg Ny Økt' : 'Rediger Økt'}
                        </h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                          {/* Type Selector */}
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Type Hendelse</label>
                              <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto gap-1">
                                  {['lesson', 'meeting', 'duty', 'admin'].map(type => (
                                      <button 
                                        key={type}
                                        onClick={() => setEditingEvent({...editingEvent, type: type as any})}
                                        className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editingEvent.type === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                      >
                                          {type === 'lesson' ? 'Fag' : type === 'meeting' ? 'Møte' : type === 'duty' ? 'Vakt' : 'Admin'}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {editingEvent.type === 'lesson' && (
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Fag</label>
                                  <select 
                                    value={editingEvent.subject} 
                                    onChange={e => setEditingEvent({...editingEvent, subject: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm border-2 border-transparent focus:border-indigo-500 outline-none transition-all shadow-inner"
                                  >
                                      {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                          )}

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Metode (CL)</label>
                              <select 
                                value={editingEvent.clStructureId || ''} 
                                onChange={e => setEditingEvent({...editingEvent, clStructureId: e.target.value})}
                                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm border-2 border-transparent focus:border-indigo-500 outline-none transition-all shadow-inner"
                              >
                                  <option value="">Velg metode...</option>
                                  {dbStructures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Tittel / Innhold</label>
                              <input 
                                type="text" 
                                value={editingEvent.title} 
                                onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                                placeholder="Eks: Brøkrekning"
                                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm border-2 border-transparent focus:border-indigo-500 outline-none shadow-inner"
                              />
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Rom / Sted</label>
                              <input 
                                type="text" 
                                value={editingEvent.room || ''} 
                                onChange={e => setEditingEvent({...editingEvent, room: e.target.value})}
                                placeholder="Eks: A204"
                                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xs border-2 border-transparent focus:border-indigo-500 outline-none shadow-inner"
                              />
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Ressurser (Lenker)</label>
                              <div className="flex gap-2">
                                <input 
                                    placeholder="https://..." 
                                    className="flex-grow p-4 bg-slate-50 rounded-2xl font-bold text-[10px] border-2 border-transparent focus:border-indigo-500 outline-none shadow-inner"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if (val) setEditingEvent({...editingEvent, resources: [...(editingEvent.resources || []), val]});
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <button className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl"><Plus size={18}/></button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {(editingEvent.resources || []).map((res, i) => (
                                      <div key={i} className="px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-bold flex items-center gap-2">
                                          <ExternalLink size={10}/> <span className="truncate max-w-[100px]">{res}</span>
                                          <button onClick={() => setEditingEvent({...editingEvent, resources: editingEvent.resources?.filter((_, idx) => idx !== i)})}><X size={10}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-10 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Gjøremål / Notater</label>
                      <textarea 
                        value={editingEvent.notes || ''} 
                        onChange={e => setEditingEvent({...editingEvent, notes: e.target.value})}
                        placeholder="Husk å ta med kopier, bøker, etc..."
                        className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold text-sm border-2 border-transparent focus:border-indigo-500 outline-none shadow-inner h-32 resize-none"
                      />
                  </div>

                  <div className="flex gap-3 mt-10">
                      {!isNewEvent && (
                          <button onClick={handleDeleteEvent} className="p-5 bg-red-50 text-red-500 rounded-[1.5rem] hover:bg-red-100 transition-all shadow-sm">
                              <Trash2 size={24} />
                          </button>
                      )}
                      <button onClick={handleSaveEvent} className="flex-grow py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                          <Edit2 size={18} /> Lagre Hendelse
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <Settings className="text-indigo-600" /> Skolens Tidstabell
                      </h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                      {timeSlots.map((slot, idx) => (
                          <div key={slot.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner group">
                              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</div>
                              <input 
                                value={slot.label} 
                                onChange={e => { const ns = [...timeSlots]; ns[idx].label = e.target.value; setTimeSlots(ns); }}
                                className="flex-grow bg-transparent font-black text-xs text-slate-700 outline-none uppercase"
                                placeholder="Økt-navn"
                              />
                              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                  <input type="time" value={slot.start} onChange={e => { const ns = [...timeSlots]; ns[idx].start = e.target.value; setTimeSlots(ns); }} className="bg-transparent text-[10px] font-black outline-none w-14" />
                                  <span className="text-slate-300">-</span>
                                  <input type="time" value={slot.end} onChange={e => { const ns = [...timeSlots]; ns[idx].end = e.target.value; setTimeSlots(ns); }} className="bg-transparent text-[10px] font-black outline-none w-14" />
                              </div>
                              <button onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                          </div>
                      ))}
                      <button onClick={() => setTimeSlots([...timeSlots, { id: crypto.randomUUID(), label: 'Ny Økt', start: '14:00', end: '15:00' }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                          <Plus size={16} /> Legg til ny økt
                      </button>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setIsSettingsOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-[1.2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
                          Ferdig
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

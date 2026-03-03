
import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Target, MessageSquare, Volume2, VolumeX, Moon, Sun, Maximize, Minimize, RotateCcw, Plus, Trash2, CloudRain, Music, Dices, User, Siren, Users, Grid3X3, Zap, Ticket, Link, BrainCircuit, Wind, Edit, Move, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TeacherDashboardProps {
    t: any;
    onClose: () => void;
    onSwitchTool: (toolId: string) => void;
}

// TYPES
interface WidgetConfig {
    id: string;
    type: 'agenda' | 'goals' | 'smartboard' | 'timer' | 'sound' | 'traffic' | 'shortcuts';
    colSpan: number; // 1 to 12 (grid system)
    order: number;
    isVisible: boolean;
    isCollapsed?: boolean;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
    { id: 'agenda', type: 'agenda', colSpan: 6, order: 0, isVisible: true, isCollapsed: false },
    { id: 'timer', type: 'timer', colSpan: 6, order: 1, isVisible: true, isCollapsed: false },
    { id: 'goals', type: 'goals', colSpan: 6, order: 2, isVisible: true, isCollapsed: false },
    { id: 'sound', type: 'sound', colSpan: 6, order: 3, isVisible: true, isCollapsed: false },
    { id: 'smartboard', type: 'smartboard', colSpan: 6, order: 4, isVisible: true, isCollapsed: false },
    { id: 'traffic', type: 'traffic', colSpan: 6, order: 5, isVisible: true, isCollapsed: false },
    { id: 'shortcuts', type: 'shortcuts', colSpan: 12, order: 6, isVisible: true, isCollapsed: false }
];

// Available tools for shortcuts
const SHORTCUT_TOOLS = [
    { id: 'noise', icon: Siren, label: 'Støymåler' },
    { id: 'groups', icon: Users, label: 'Grupper' },
    { id: 'picker', icon: Dices, title: 'Lykkehjul', label: 'Lykkehjul' },
    { id: 'seating_chart', icon: Grid3X3, label: 'Klassekart' },
    { id: 'icebreaker', icon: Zap, label: 'Isbryter' },
    { id: 'exit', icon: Ticket, label: 'Exit Ticket' },
];

const WONDER_QUESTIONS = [
    "Hva ville skjedd om alle mennesker mistet evnen til å lyve?",
    "Er det alltid galt å stjele? Hva om du stjeler brød til en som sulter?",
    "Hvis dyr kunne snakke, hvilket dyr ville vært frekkest?",
    "Hva er forskjellen på å være smart og å være vis?",
    "Ville du helst reist 100 år frem i tid eller 100 år tilbake?",
    "Hva betyr det egentlig å være en god venn?",
    "Er fargen du ser som 'rød' den samme som jeg ser?",
    "Hva er det viktigste du har lært utenfor skolen?",
    "Hvis du kunne endret én lov i Norge, hvilken ville det vært?",
    "Hvorfor drømmer vi når vi sover?"
];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ t, onClose, onSwitchTool }) => {
    // --- GLOBAL STATE ---
    const [isDark, setIsDark] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard_layout_v3');
            const parsed = saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
            // Ensure backwards compatibility with isCollapsed
            return parsed.map((w: any) => ({ ...w, isCollapsed: w.isCollapsed ?? false }));
        } catch { return DEFAULT_LAYOUT; }
    });

    // --- WIDGET SPECIFIC STATES (Persisted or Local) ---
    
    // Agenda
    const [agenda, setAgenda] = useState<string[]>(() => JSON.parse(localStorage.getItem('dashboard_agenda') || '["Samling", "Innsats", "Oppsummering"]'));
    // Goals
    const [goal, setGoal] = useState(() => localStorage.getItem('dashboard_goal') || 'Vi skal lære å...');
    // Smart Board
    const [boardMode, setBoardMode] = useState<'message' | 'wonder' | 'breath'>('message');
    const [message, setMessage] = useState(() => localStorage.getItem('dashboard_message') || '');
    const [wonderText, setWonderText] = useState("Klikk for dagens undring...");
    const [breathPhase, setBreathPhase] = useState<'inn' | 'hold' | 'ut'>('inn');
    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const timerRef = useRef<any>(null);
    const [timerFocusMode, setTimerFocusMode] = useState(false); // Only internal focus within widget
    // Sound
    const [activeSound, setActiveSound] = useState<'rain' | 'focus' | null>(null);
    const ambienceAudio = useRef<HTMLAudioElement | null>(null);
    // Traffic / Picker
    const [activeLight, setActiveLight] = useState<'red' | 'yellow' | 'green' | null>(null);
    const [pickerNames, setPickerNames] = useState(() => localStorage.getItem('dashboard_picker_names') || '');
    const [pickedStudent, setPickedStudent] = useState<string | null>(null);
    const [showPickerSettings, setShowPickerSettings] = useState(false);
    // Shortcuts
    const [shortcuts, setShortcuts] = useState<string[]>(() => JSON.parse(localStorage.getItem('dashboard_shortcuts') || '["noise", "groups"]'));
    const [showShortcutMenu, setShowShortcutMenu] = useState(false);

    const alarmAudio = useRef<HTMLAudioElement | null>(null);

    // --- EFFECTS ---
    
    // Save Layout
    useEffect(() => {
        localStorage.setItem('dashboard_layout_v3', JSON.stringify(widgets));
    }, [widgets]);

    // Clock
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Persist Content
    useEffect(() => { localStorage.setItem('dashboard_agenda', JSON.stringify(agenda)); }, [agenda]);
    useEffect(() => { localStorage.setItem('dashboard_goal', goal); }, [goal]);
    useEffect(() => { localStorage.setItem('dashboard_message', message); }, [message]);
    useEffect(() => { localStorage.setItem('dashboard_picker_names', pickerNames); }, [pickerNames]);
    useEffect(() => { localStorage.setItem('dashboard_shortcuts', JSON.stringify(shortcuts)); }, [shortcuts]);

    // Timer Logic
    useEffect(() => {
        alarmAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft(p => {
                    if (p <= 1) {
                        setTimerActive(false);
                        alarmAudio.current?.play().catch(() => {});
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return p - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    // Breathing Animation
    useEffect(() => {
        let timeout: any;
        if (boardMode === 'breath') {
            const cycle = () => {
                setBreathPhase('inn');
                timeout = setTimeout(() => {
                    setBreathPhase('hold');
                    timeout = setTimeout(() => {
                        setBreathPhase('ut');
                        timeout = setTimeout(() => { cycle(); }, 4000); // Ut
                    }, 4000); // Hold
                }, 4000); // Inn
            };
            cycle();
        }
        return () => clearTimeout(timeout);
    }, [boardMode]);

    // Sound Logic
    useEffect(() => {
        if (ambienceAudio.current) {
            ambienceAudio.current.pause();
            ambienceAudio.current = null;
        }
        if (activeSound) {
            const url = activeSound === 'rain' 
                ? 'https://assets.mixkit.co/active_storage/sfx/1136/1136-preview.mp3' 
                : 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'; 
            ambienceAudio.current = new Audio(url);
            ambienceAudio.current.loop = true;
            ambienceAudio.current.volume = 0.6;
            ambienceAudio.current.play().catch(e => console.log("Audio play failed", e));
        }
    }, [activeSound]);

    // --- LAYOUT HANDLERS ---

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("widgetId", id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData("widgetId");
        if (sourceId === targetId) return;

        const sourceIndex = widgets.findIndex(w => w.id === sourceId);
        const targetIndex = widgets.findIndex(w => w.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) return;

        const newWidgets = [...widgets];
        // Swap orders
        const tempOrder = newWidgets[sourceIndex].order;
        newWidgets[sourceIndex].order = newWidgets[targetIndex].order;
        newWidgets[targetIndex].order = tempOrder;

        setWidgets(newWidgets.sort((a,b) => a.order - b.order));
    };

    const handleResize = (id: string, delta: number) => {
        setWidgets(prev => prev.map(w => {
            if (w.id === id) {
                // Steps of 3 (1/4 width) roughly
                let newSpan = w.colSpan + delta;
                if (newSpan < 3) newSpan = 3;
                if (newSpan > 12) newSpan = 12;
                return { ...w, colSpan: newSpan };
            }
            return w;
        }));
    };

    const toggleWidgetVisibility = (id: string) => {
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, isVisible: !w.isVisible } : w));
    };

    const toggleWidgetCollapse = (id: string) => {
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w));
    };

    // --- FUNCTIONS ---

    const generateWonder = () => {
        const random = WONDER_QUESTIONS[Math.floor(Math.random() * WONDER_QUESTIONS.length)];
        setWonderText(random);
    };

    const handleTimerSet = (minutes: number) => {
        setTimeLeft(minutes * 60);
        setTimerActive(false);
    };

    const handlePickStudent = () => {
        const names = pickerNames.split(/[\n,;]+/).map(n => n.trim()).filter(Boolean);
        if (names.length > 0) {
            setPickedStudent(names[Math.floor(Math.random() * names.length)]);
        } else {
            setPickedStudent("Ingen navn");
        }
    };

    // --- COMPONENT RENDERERS ---

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const theme = isDark ? {
        bg: 'bg-slate-950',
        card: 'bg-slate-900/50 border-slate-800',
        text: 'text-white',
        subText: 'text-slate-400',
        accent: 'text-indigo-400',
        button: 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700',
        input: 'bg-transparent text-white'
    } : {
        bg: 'bg-slate-50',
        card: 'bg-white border-slate-200 shadow-sm',
        text: 'text-slate-900',
        subText: 'text-slate-500',
        accent: 'text-indigo-600',
        button: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
        input: 'bg-transparent text-slate-800'
    };

    const renderWidgetContent = (widget: WidgetConfig) => {
        const collapseBtn = (
            <button onClick={() => toggleWidgetCollapse(widget.id)} className={`p-1 rounded hover:bg-white/10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {widget.isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
            </button>
        );

        switch (widget.type) {
            case 'agenda':
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`flex justify-between items-center mb-2 pb-2 border-b border-white/5`}>
                            <div className={`flex items-center gap-3 ${theme.accent}`}>
                                <CheckSquare size={20} />
                                <h2 className="text-sm font-black uppercase tracking-widest">Agenda</h2>
                            </div>
                            {collapseBtn}
                        </div>
                        {!widget.isCollapsed ? (
                            <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar">
                                {agenda.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 group/item">
                                        <input type="checkbox" className="w-5 h-5 mt-1 rounded border-2 border-current accent-indigo-500 cursor-pointer opacity-50 hover:opacity-100" />
                                        <div className="flex-grow flex items-center gap-2">
                                            <input 
                                                className={`w-full text-lg font-bold outline-none border-b border-transparent focus:border-indigo-500/50 bg-transparent ${isDark ? 'focus:bg-white/5' : 'focus:bg-slate-50'} rounded px-2`}
                                                value={item}
                                                onChange={(e) => { const n = [...agenda]; n[i] = e.target.value; setAgenda(n); }}
                                                placeholder="..."
                                            />
                                            <button onClick={() => setAgenda(agenda.filter((_, idx) => idx !== i))} className="opacity-0 group-hover/item:opacity-100 text-red-400"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setAgenda([...agenda, ""])} className="flex items-center gap-2 px-2 text-xs font-bold opacity-60 hover:opacity-100"><Plus size={12} /> Legg til</button>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 font-bold">{agenda.length} punkter</div>
                        )}
                    </div>
                );
            case 'goals':
                return (
                    <div className="flex flex-col h-full">
                        <div className={`flex justify-between items-center mb-2 pb-1 border-b border-white/5`}>
                            <div className={`flex items-center gap-3 ${theme.accent}`}>
                                <Target size={20} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Mål</h3>
                            </div>
                            {collapseBtn}
                        </div>
                        {!widget.isCollapsed ? (
                            <textarea 
                                className={`w-full h-full bg-transparent text-lg font-bold outline-none resize-none overflow-hidden placeholder-opacity-50 leading-tight ${theme.text}`}
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="Dagens mål..."
                            />
                        ) : (
                            <div className="text-xs text-slate-500 truncate">{goal}</div>
                        )}
                    </div>
                );
            case 'smartboard':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                            <div className="flex gap-2 items-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 mr-2">{boardMode === 'message' ? 'Tavle' : boardMode === 'wonder' ? 'Undring' : 'Pust'}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => setBoardMode('message')} className={`p-1.5 rounded-lg ${boardMode==='message' ? (isDark?'bg-white/20':'bg-slate-200') : ''}`}><MessageSquare size={14}/></button>
                                    <button onClick={() => setBoardMode('wonder')} className={`p-1.5 rounded-lg ${boardMode==='wonder' ? (isDark?'bg-white/20':'bg-slate-200') : ''}`}><BrainCircuit size={14}/></button>
                                    <button onClick={() => setBoardMode('breath')} className={`p-1.5 rounded-lg ${boardMode==='breath' ? (isDark?'bg-white/20':'bg-slate-200') : ''}`}><Wind size={14}/></button>
                                </div>
                            </div>
                            {collapseBtn}
                        </div>
                        {!widget.isCollapsed ? (
                            <div className="flex-grow relative min-h-[100px]">
                                {boardMode === 'message' && <textarea className={`w-full h-full bg-transparent text-lg font-bold outline-none resize-none ${isDark ? 'text-yellow-100' : 'text-slate-800'}`} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Beskjed..."/>}
                                {boardMode === 'wonder' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                                        <p className="text-base font-bold italic opacity-90">{wonderText}</p>
                                        <button onClick={generateWonder} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-white/10 hover:bg-white/20">Ny</button>
                                    </div>
                                )}
                                {boardMode === 'breath' && (
                                    <div className="flex flex-col items-center justify-center h-full relative">
                                        <div className={`w-16 h-16 rounded-full border-4 border-cyan-400/50 absolute transition-all duration-[4000ms] ease-in-out ${breathPhase === 'inn' ? 'scale-150 opacity-100 bg-cyan-500/20' : breathPhase === 'hold' ? 'scale-150 opacity-80' : 'scale-50 opacity-50'}`}></div>
                                        <p className="text-sm font-black uppercase tracking-widest relative z-10">{breathPhase}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500">{boardMode} aktiv</div>
                        )}
                    </div>
                );
            case 'timer':
                return (
                    <div className="flex flex-col h-full relative overflow-hidden">
                        {timerActive && !widget.isCollapsed && <div className="absolute top-0 right-8 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                        <div className="flex justify-between items-center mb-2">
                            <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.subText}`}>Tidtaker</h3>
                            {collapseBtn}
                        </div>
                        
                        {!widget.isCollapsed ? (
                            <div className="flex flex-col items-center justify-center text-center flex-grow">
                                <div className={`text-6xl lg:text-7xl font-black tabular-nums tracking-tighter mb-4 ${timeLeft===0 && !timerActive ? 'opacity-30' : 'opacity-100'}`}>{formatTime(timeLeft)}</div>
                                <div className="flex gap-2 mb-4 w-full justify-center">
                                    {[5, 10, 15, 20].map(m => <button key={m} onClick={()=>handleTimerSet(m)} className={`px-3 py-2 rounded-xl font-bold text-xs border ${theme.button}`}>{m}</button>)}
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button onClick={()=>setTimerActive(!timerActive)} className={`flex-grow py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-white ${timerActive ? 'bg-amber-500' : 'bg-indigo-600'}`}>{timerActive ? 'Pause' : 'Start'}</button>
                                    <button onClick={()=>{setTimerActive(false); setTimeLeft(0);}} className={`px-4 rounded-xl border ${theme.button}`}><RotateCcw size={16}/></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className={`text-2xl font-black tabular-nums ${timerActive ? 'text-amber-500' : 'text-slate-500'}`}>{formatTime(timeLeft)}</span>
                                {timerActive && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>}
                            </div>
                        )}
                    </div>
                );
            case 'sound':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${theme.subText}`}><Volume2 size={14}/> Fokus-lyd {activeSound && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>}</h3>
                            {collapseBtn}
                        </div>
                        {!widget.isCollapsed ? (
                            <div className="grid grid-cols-3 gap-2 h-full">
                                <button onClick={()=>setActiveSound(activeSound==='focus'?null:'focus')} className={`flex flex-col items-center justify-center gap-1 rounded-xl border ${activeSound==='focus'?'bg-indigo-600 border-indigo-600 text-white':'bg-transparent border-slate-700 hover:bg-white/5'}`}><Music size={18}/><span className="text-[8px] font-black uppercase">Lo-Fi</span></button>
                                <button onClick={()=>setActiveSound(activeSound==='rain'?null:'rain')} className={`flex flex-col items-center justify-center gap-1 rounded-xl border ${activeSound==='rain'?'bg-cyan-600 border-cyan-600 text-white':'bg-transparent border-slate-700 hover:bg-white/5'}`}><CloudRain size={18}/><span className="text-[8px] font-black uppercase">Regn</span></button>
                                <button onClick={()=>setActiveSound(null)} className={`flex flex-col items-center justify-center gap-1 rounded-xl border ${!activeSound?'bg-slate-700 text-white':'bg-transparent border-slate-700'}`}><VolumeX size={18}/><span className="text-[8px] font-black uppercase">Av</span></button>
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-slate-500">{activeSound ? (activeSound === 'rain' ? 'Regn spiller' : 'Lo-Fi spiller') : 'Lyd av'}</div>
                        )}
                    </div>
                );
            case 'traffic':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.subText}`}>Arbeidsro</h3>
                                <button onClick={() => setShowPickerSettings(!showPickerSettings)} className="text-slate-400 hover:text-indigo-400"><User size={14}/></button>
                            </div>
                            {collapseBtn}
                        </div>
                        {!widget.isCollapsed ? (
                            <div className="flex gap-4 items-center justify-center flex-grow">
                                <div className="flex flex-col gap-2 bg-black/20 p-2 rounded-full">
                                    <button onClick={()=>setActiveLight('red')} className={`w-8 h-8 rounded-full border-2 border-black/10 ${activeLight==='red'?'bg-red-500 shadow-[0_0_15px_red] scale-110':'bg-red-900/30'}`} />
                                    <button onClick={()=>setActiveLight('yellow')} className={`w-8 h-8 rounded-full border-2 border-black/10 ${activeLight==='yellow'?'bg-amber-400 shadow-[0_0_15px_orange] scale-110':'bg-amber-900/30'}`} />
                                    <button onClick={()=>setActiveLight('green')} className={`w-8 h-8 rounded-full border-2 border-black/10 ${activeLight==='green'?'bg-emerald-500 shadow-[0_0_15px_green] scale-110':'bg-emerald-900/30'}`} />
                                </div>
                                <div className="flex flex-col items-center flex-grow">
                                    {showPickerSettings ? (
                                        <textarea className="w-full h-20 text-[10px] bg-white/10 rounded p-2" value={pickerNames} onChange={e=>setPickerNames(e.target.value)} placeholder="Navn..." />
                                    ) : (
                                        <>
                                            <p className="text-lg font-black uppercase tracking-tight truncate w-full text-center">{pickedStudent || "?"}</p>
                                            <button onClick={handlePickStudent} className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500">Trekk</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${activeLight ? (activeLight==='red'?'bg-red-500':activeLight==='yellow'?'bg-amber-400':'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                <span className="text-xs font-bold text-slate-500">{activeLight ? activeLight.toUpperCase() : 'AV'}</span>
                            </div>
                        )}
                    </div>
                );
            case 'shortcuts':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.subText} flex items-center gap-2`}><Link size={12} /> Snarveier</h3>
                                <button onClick={() => setShowShortcutMenu(!showShortcutMenu)} className="text-slate-400 hover:text-indigo-400"><Plus size={14}/></button>
                            </div>
                            {collapseBtn}
                        </div>
                        {showShortcutMenu && (
                            <div className="mb-2 grid grid-cols-3 gap-2 bg-slate-800 p-2 rounded-xl absolute z-10 w-full shadow-xl top-8">
                                {SHORTCUT_TOOLS.map(t => (
                                    <button key={t.id} onClick={() => { setShortcuts(prev => prev.includes(t.id)?prev.filter(s=>s!==t.id):[...prev,t.id]); }} className={`text-[8px] p-2 rounded ${shortcuts.includes(t.id)?'bg-indigo-600 text-white':'bg-slate-700 text-slate-300'}`}>{t.label}</button>
                                ))}
                            </div>
                        )}
                        {!widget.isCollapsed && (
                            <div className="grid grid-cols-6 gap-2 h-full items-center">
                                {shortcuts.map(id => {
                                    const tool = SHORTCUT_TOOLS.find(t => t.id === id);
                                    if (!tool) return null;
                                    return (
                                        <button key={id} onClick={() => onSwitchTool(id)} className={`h-full flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${theme.button}`}>
                                            <tool.icon size={14}/>
                                            <span className="text-[8px] font-black uppercase truncate w-full px-1">{tool.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className={`fixed inset-0 z-[200] ${theme.bg} ${theme.text} flex flex-col overflow-hidden transition-colors duration-500 animate-in fade-in`}>
            
            {/* TOP BAR */}
            <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className={`px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all border ${theme.button}`}>Lukk</button>
                    <div className="flex bg-white/5 rounded-xl p-1 gap-1 border border-white/5">
                        <button onClick={() => setIsDark(false)} className={`p-2 rounded-lg transition-all ${!isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-white'}`}><Sun size={18} /></button>
                        <button onClick={() => setIsDark(true)} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Moon size={18} /></button>
                    </div>
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center gap-2 ${isEditMode ? 'bg-indigo-600 border-indigo-600 text-white' : theme.button}`}>
                        {isEditMode ? <Check size={16} /> : <Edit size={16} />} 
                        <span className="hidden sm:inline">{isEditMode ? 'Ferdig' : 'Rediger'}</span>
                    </button>
                </div>
                
                <div className="text-right">
                    <h1 className="text-3xl sm:text-5xl font-black tabular-nums tracking-tight leading-none">
                        {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </h1>
                </div>
            </div>

            {/* WIDGET GRID */}
            <div className="flex-grow p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                {isEditMode && (
                    <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Skjul/Vis moduler:</span>
                            {widgets.map(w => (
                                <button 
                                    key={w.id} 
                                    onClick={() => toggleWidgetVisibility(w.id)}
                                    className={`text-[10px] font-black uppercase px-2 py-1 rounded ${w.isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 line-through'}`}
                                >
                                    {w.id}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Dra for å flytte. Bruk +/- for størrelse.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-min pb-20">
                    {widgets.filter(w => w.isVisible).map(widget => (
                        <div 
                            key={widget.id}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, widget.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, widget.id)}
                            className={`
                                relative rounded-[2rem] border-2 flex flex-col overflow-hidden transition-all duration-300
                                ${theme.card}
                                ${isEditMode ? 'border-dashed border-indigo-500/50 cursor-move animate-pulse' : ''}
                            `}
                            style={{ gridColumn: `span ${widget.colSpan} / span ${widget.colSpan}` }}
                        >
                            {isEditMode && (
                                <div className="absolute top-2 right-2 z-20 flex gap-1">
                                    <button onClick={() => handleResize(widget.id, -1)} className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700"><Minimize size={12}/></button>
                                    <button onClick={() => handleResize(widget.id, 1)} className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700"><Maximize size={12}/></button>
                                    <div className="p-1 bg-indigo-600 text-white rounded cursor-move"><Move size={12}/></div>
                                </div>
                            )}
                            <div className={`p-6 ${widget.isCollapsed ? 'h-auto pb-4' : 'h-full min-h-[180px]'}`}>
                                {renderWidgetContent(widget)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

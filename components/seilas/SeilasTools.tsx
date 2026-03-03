
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Timer, X, Dices, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';

interface SeilasToolsProps {
    show: boolean;
    initialTodos: {id:string, text:string, done:boolean}[];
    onTodosChange: (todos: {id:string, text:string, done:boolean}[]) => void;
}

export const SeilasTools: React.FC<SeilasToolsProps> = ({ show, initialTodos, onTodosChange }) => {
    const [miniTimer, setMiniTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [pickerName, setPickerName] = useState<string | null>(null);
    const [todos, setTodos] = useState(initialTodos);
    const timerRef = useRef<any>(null);

    // Sync local todos with parent when they change
    useEffect(() => {
        onTodosChange(todos);
    }, [todos, onTodosChange]);

    // Timer Logic
    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setMiniTimer(prev => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    const drawStudent = () => {
        // Use todos as a simple roster fallback for the demo
        const names = todos.map(t => t.text).filter(t => t.length > 1); 
        if (names.length > 0) setPickerName(names[Math.floor(Math.random() * names.length)]);
        else setPickerName("Legg til navn i lista!");
    };

    if (!show) return null;

    return (
        <div className="w-72 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300 flex-shrink-0 h-full">
            <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
                <h3 className="font-black uppercase text-xs tracking-widest text-indigo-900 flex items-center gap-2">
                <Zap size={16} /> Kommandobru
                </h3>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* MINI TIMER */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Rask Timer</h4>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
                        <span className="text-3xl font-black text-slate-900 tabular-nums">
                            {Math.floor(miniTimer/60)}:{(miniTimer%60).toString().padStart(2, '0')}
                        </span>
                        <div className="flex gap-2 w-full">
                            <button onClick={() => { setMiniTimer(300); setTimerActive(true); }} className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-50">5m</button>
                            <button onClick={() => { setMiniTimer(600); setTimerActive(true); }} className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-50">10m</button>
                            <button onClick={() => { setTimerActive(!timerActive); }} className={`p-2 rounded-xl text-white shadow-sm transition-all ${timerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {timerActive ? <X size={16}/> : <Timer size={16}/>}
                            </button>
                        </div>
                    </div>
                </section>

                {/* MINI PICKER */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Lykkehjulet</h4>
                    <div className="bg-indigo-600 p-5 rounded-[2rem] text-white flex flex-col items-center gap-4 shadow-lg shadow-indigo-100">
                        <div className="w-full text-center py-3 bg-white/10 rounded-2xl border border-white/10 min-h-[50px] flex items-center justify-center">
                            <span className="font-black uppercase tracking-tight text-lg break-words px-2">{pickerName || '???'}</span>
                        </div>
                        <button onClick={drawStudent} className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all">
                            <Dices size={16} /> Trekk Elev
                        </button>
                    </div>
                </section>

                {/* TODO LIST */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Dagens Sjekkliste</h4>
                    <div className="space-y-2">
                        {todos.map((todo) => (
                            <div key={todo.id} className="flex items-center gap-3 group bg-white p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                                <button onClick={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} className={`flex-shrink-0 transition-colors ${todo.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'}`}>
                                    {todo.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </button>
                                <input 
                                    value={todo.text} 
                                    onChange={e => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, text: e.target.value } : t))}
                                    className={`flex-grow bg-transparent text-xs font-bold outline-none transition-all w-full ${todo.done ? 'text-slate-300 line-through' : 'text-slate-700'}`}
                                    placeholder="Ny oppgave..."
                                />
                                <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        <button onClick={() => setTodos(prev => [...prev, { id: Date.now().toString(), text: '', done: false }])} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-400 transition-all">
                            <Plus size={14} /> Legg til oppgave
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, PartyPopper, Dices, Loader2, Play, History, Camera, Volume2, VolumeX, Trash2, Users } from 'lucide-react';
import { extractNamesFromImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { storageService } from '../services/storageService';
import { Class } from '../types';

export const RandomPicker = ({ t }: any) => {
    const { addToast } = useToast();
    const [namesText, setNamesText] = useState('');
    const [winner, setWinner] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [removeAfterPick, setRemoveAfterPick] = useState(false);
    const [pickHistory, setPickHistory] = useState<string[]>([]);
    const [displayCandidate, setDisplayCandidate] = useState<string>('?');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Classes
    const [myClasses, setMyClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    
    // For visual rotation effect
    const [rotation, setRotation] = useState(0);
    
    // Refs
    const tickSoundRef = useRef<HTMLAudioElement | null>(null);
    const winSoundRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        tickSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
        winSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        // Preload sounds
        if(tickSoundRef.current) tickSoundRef.current.volume = 0.5;
        if(winSoundRef.current) winSoundRef.current.volume = 0.5;
        
        loadClasses();
    }, []);

    const loadClasses = async () => {
        const user = await storageService.getCurrentUser();
        if (user) {
            const classes = await storageService.getMyClasses();
            setMyClasses(classes);
        }
    };

    const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedClassId(id);
        if (id) {
            try {
                const students = await storageService.getStudents(id);
                const names = students.map(s => s.name).join('\n');
                setNamesText(names);
                addToast(`${students.length} elever hentet`, 'success');
            } catch (err) {
                addToast("Kunne ikke hente elever", 'error');
            }
        }
    };

    const getCandidates = () => {
        return namesText.split(/[\n,;]+/).map(n=>n.trim()).filter(Boolean);
    };

    const getAvailableCandidates = () => {
        const all = getCandidates();
        if (!removeAfterPick) return all;
        return all.filter(n => !pickHistory.includes(n));
    };

    // Calculate dynamic font size based on name length to keep circle stable
    const getFontSize = (text: string) => {
        if (!text) return 'text-6xl';
        const len = text.length;
        if (len > 30) return 'text-lg sm:text-xl leading-tight';
        if (len > 20) return 'text-xl sm:text-2xl leading-tight';
        if (len > 12) return 'text-2xl sm:text-4xl leading-none';
        if (len > 6) return 'text-4xl sm:text-5xl leading-none';
        return 'text-5xl sm:text-7xl leading-none';
    };

    const runSpinLogic = (candidates: string[], currentDelay: number, lastCandidate: string) => {
        // Stop condition: If delay is too long (wheel stopped)
        if (currentDelay > 400) {
            finalizePick(lastCandidate);
            return;
        }

        // Pick a random candidate
        let nextCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        // Prevent same name twice in a row for visual flow, unless only 1 candidate
        if (candidates.length > 1) {
            while (nextCandidate === lastCandidate) {
                nextCandidate = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }

        setDisplayCandidate(nextCandidate);
        // Add random rotation to wheel background
        setRotation(prev => prev + 45 + Math.random() * 45);

        // Play tick
        if (soundEnabled && tickSoundRef.current) {
            tickSoundRef.current.currentTime = 0;
            tickSoundRef.current.play().catch(() => {});
        }

        // Calculate next delay (Deceleration factor)
        const nextDelay = Math.max(50, currentDelay * 1.1);

        timeoutRef.current = setTimeout(() => {
            runSpinLogic(candidates, nextDelay, nextCandidate);
        }, currentDelay);
    };

    const handlePick = () => {
        const available = getAvailableCandidates();
        if (available.length === 0) {
            addToast(removeAfterPick ? "Alle er trukket! Nullstill historikk for å starte på nytt." : "Legg til navn først!", 'warning');
            return;
        }
        
        setIsSpinning(true);
        setWinner(null);
        
        // Start fast
        runSpinLogic(available, 50, '');
    };

    const finalizePick = (finalWinner: string) => {
        setWinner(finalWinner);
        setIsSpinning(false);
        setPickHistory(prev => [finalWinner, ...prev]);
        if (soundEnabled && winSoundRef.current) winSoundRef.current.play().catch(() => {});
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const resetHistory = () => {
        if(confirm("Vil du nullstille historikken? Alle navn blir tilgjengelige igjen.")) {
            setPickHistory([]);
            setWinner(null);
            setDisplayCandidate('?');
        }
    };

    const handleScanList = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const extractedNames = await extractNamesFromImage(base64Data, file.type);
                if (extractedNames.length > 0) {
                    setNamesText(prev => {
                        const current = prev.trim();
                        return current ? current + '\n' + extractedNames.join('\n') : extractedNames.join('\n');
                    });
                    addToast(`Fant ${extractedNames.length} navn!`, 'success');
                } else {
                    addToast("Fant ingen navn i bildet.", 'error');
                }
            } catch (err) {
                addToast("Kunne ikke analysere bildet.", 'error');
            } finally {
                setIsAnalyzing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col h-full gap-6 py-4 max-w-full">
            {/* Top Bar: Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-purple-50 p-4 rounded-2xl border border-purple-100 no-print">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setRemoveAfterPick(!removeAfterPick)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${removeAfterPick ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                    >
                        {removeAfterPick ? <Lock size={14} /> : <Unlock size={14} />}
                        {removeAfterPick ? "Frys vinnere" : "Behold vinnere"}
                    </button>
                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-2 rounded-xl border transition-all ${soundEnabled ? 'bg-white text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>
                
                <div className="flex gap-2">
                    {pickHistory.length > 0 && (
                        <button onClick={resetHistory} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition-colors bg-white px-3 py-2 rounded-xl border border-purple-100">
                            <RotateCcw size={14} /> Nullstill
                        </button>
                    )}
                    {namesText && (
                        <button onClick={() => { if(confirm('Slette alle navn?')) setNamesText(''); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 flex-grow min-h-0">
                {/* Left: Input */}
                <div className="w-full md:w-1/3 flex flex-col gap-2 min-h-0 no-print">
                    <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">{t.writeNames}</label>
                        <div className="relative flex gap-2">
                            {myClasses.length > 0 && (
                                <div className="relative">
                                    <select 
                                        value={selectedClassId} 
                                        onChange={handleClassChange}
                                        className="appearance-none pl-8 pr-4 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-indigo-600 uppercase tracking-wide cursor-pointer focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Velg klasse...</option>
                                        {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <Users size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleScanList} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors">
                                {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Skann
                            </button>
                        </div>
                    </div>
                    <textarea 
                        className="flex-grow w-full p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-purple-500 transition-all shadow-inner resize-none" 
                        placeholder="Ola, Kari, Per..." 
                        value={namesText} 
                        onChange={e=>setNamesText(e.target.value)} 
                    />
                    <div className="text-[10px] font-bold text-slate-400 text-right px-2">
                        {getCandidates().length} navn registrert
                    </div>
                </div>

                {/* Right: Action & Result */}
                <div className="w-full md:w-2/3 flex flex-col items-center justify-center gap-8 py-4">
                    
                    {/* THE WHEEL CONTAINER */}
                    <div className="relative group">
                        {/* Static indicator arrow */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-400 rotate-45 border-4 border-white shadow-md z-30"></div>

                        {/* Fixed Size Circle Container */}
                        <div className={`w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full shadow-2xl border-8 border-white relative overflow-hidden transition-all duration-300 ${winner ? 'shadow-purple-400 ring-8 ring-purple-100 scale-105' : 'shadow-xl'}`}>
                            
                            {/* Rotating Background (Spokes) */}
                            <div 
                                className="absolute inset-0 w-full h-full"
                                style={{ 
                                    background: `conic-gradient(
                                        #7c3aed 0deg 45deg, 
                                        #6d28d9 45deg 90deg, 
                                        #7c3aed 90deg 135deg, 
                                        #6d28d9 135deg 180deg, 
                                        #7c3aed 180deg 225deg, 
                                        #6d28d9 225deg 270deg, 
                                        #7c3aed 270deg 315deg, 
                                        #6d28d9 315deg 360deg
                                    )`,
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isSpinning ? 'transform 0.1s linear' : 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            ></div>

                            {/* Inner Circle Overlay for Text */}
                            <div className="absolute inset-4 sm:inset-6 bg-purple-900 rounded-full flex flex-col items-center justify-center text-center p-6 shadow-inner border-4 border-purple-800 z-10">
                                {isSpinning ? (
                                    <>
                                        <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.4em] mb-2 animate-pulse">{t.drawing}</p>
                                        <div className="flex-grow flex items-center justify-center w-full overflow-hidden">
                                            <h3 className={`${getFontSize(displayCandidate)} font-black text-white uppercase tracking-tighter break-words text-center drop-shadow-lg`}>
                                                {displayCandidate}
                                            </h3>
                                        </div>
                                    </>
                                ) : winner ? (
                                    <div className="animate-in zoom-in duration-300 flex flex-col items-center w-full h-full justify-center">
                                        <PartyPopper size={32} className="text-yellow-400 mb-2 animate-bounce" />
                                        <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.4em] mb-1">{t.winnerIs}</p>
                                        <div className="flex-grow flex items-center justify-center w-full overflow-hidden">
                                            <h3 className={`${getFontSize(winner)} font-black text-white uppercase tracking-tighter break-words text-center text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 drop-shadow-sm`}>
                                                {winner}
                                            </h3>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in flex flex-col items-center justify-center opacity-30">
                                        <Dices size={64} className="mb-2" />
                                        <p className="font-black uppercase text-xs tracking-widest">Klar til dyst</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePick} 
                        disabled={isSpinning || !namesText.trim()} 
                        className={`w-full max-w-xs py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${isSpinning ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-purple-600'}`}
                    >
                        {isSpinning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
                        {isSpinning ? "Hjulet går..." : t.drawWinner}
                    </button>

                    {/* History List */}
                    {pickHistory.length > 0 && (
                        <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-auto no-print">
                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <History size={14} />
                                <h5 className="text-[9px] font-black uppercase tracking-widest">Trukket hittil ({pickHistory.length})</h5>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                {pickHistory.map((name, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

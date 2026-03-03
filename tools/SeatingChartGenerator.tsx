
import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Users, Shuffle, RotateCcw, Monitor, GripVertical, Plus, BarChart3, Info, Eye, EyeOff, UserCircle, Camera, Loader2, Move, Trash2, RotateCw } from 'lucide-react';
import { extractNamesFromImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Class, Student } from '../types';
import { useToast } from '../contexts/ToastContext';

interface Desk {
    id: string;
    student: Student | null;
    x?: number; // Used for free mode (percentage)
    y?: number; // Used for free mode (percentage)
    rotation?: number; // Rotation in degrees
}

export const SeatingChartGenerator = ({ t }: any) => {
    const { addToast } = useToast();
    const [inputNames, setInputNames] = useState('');
    const [cols, setCols] = useState(4);
    const [rows, setRows] = useState(6);
    const [mode, setMode] = useState<'rows' | 'groups' | 'free'>('rows');
    const [desks, setDesks] = useState<Desk[]>([]);
    const [bench, setBench] = useState<Student[]>([]);
    
    // Classes
    const [myClasses, setMyClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loadingClass, setLoadingClass] = useState(false);
    
    // UI State
    const [showGenderColors, setShowGenderColors] = useState(true);
    const [showFocusMarks, setShowFocusMarks] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    
    // Drag state
    const [draggedItem, setDraggedItem] = useState<{ type: 'desk' | 'bench' | 'desk_position', index: number, startX?: number, startY?: number } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
            setLoadingClass(true);
            try {
                const students = await storageService.getStudents(id);
                // Populate the inputNames for manual edits if needed, but primarily use the students array directly in generate
                const namesStr = students.map(s => s.name).join('\n');
                setInputNames(namesStr);
                
                // Directly set bench with full student objects (preserving gender/focus)
                setBench(students);
                setDesks([]); // Clear existing arrangement
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingClass(false);
            }
        }
    };

    const parseNames = (text: string): Student[] => {
        return text.split(/[\n,;]+/).map((n, i) => {
            const cleanName = n.trim();
            if (!cleanName) return null;
            return {
                id: `student-${Date.now()}-${i}`,
                name: cleanName,
                gender: 'X', // Default unknown if just pasting text
                needsFocus: false
            };
        }).filter(Boolean) as Student[];
    };

    const generateDesks = () => {
        // Use bench if populated (from class selection), otherwise parse input
        let students: Student[] = [];
        
        if (selectedClassId && bench.length > 0 && !inputNames) {
             students = [...bench, ...desks.map(d => d.student).filter(Boolean) as Student[]];
        } else {
             students = parseNames(inputNames);
        }
        
        if (mode === 'free') {
            // Keep existing desks in free mode, just update bench
            const existingStudents = desks.map(d => d.student).filter(Boolean) as Student[];
            const studentIds = new Set(existingStudents.map(s => s.name));
            
            const newBench = students.filter(s => !studentIds.has(s.name));
            setBench(newBench);
            return;
        }

        const totalDesks = cols * rows;
        const newDesks: Desk[] = Array(totalDesks).fill(null).map((_, i) => ({
            id: `desk-${i}`,
            student: null
        }));
        
        // Fill desks
        for (let i = 0; i < Math.min(newDesks.length, students.length); i++) {
            newDesks[i].student = students[i];
        }

        // Put remainder in bench
        if (students.length > newDesks.length) {
            setBench(students.slice(newDesks.length));
        } else {
            setBench([]);
        }

        setDesks(newDesks);
    };

    // Free Mode: Add a desk
    const addFreeDesk = () => {
        const newDesk: Desk = {
            id: `desk-free-${Date.now()}`,
            student: null,
            x: 50,
            y: 50,
            rotation: 0
        };
        setDesks(prev => [...prev, newDesk]);
    };

    const clearDesks = () => {
        const studentsInDesks = desks.map(d => d.student).filter(Boolean) as Student[];
        setBench(prev => [...prev, ...studentsInDesks]);
        setDesks([]);
        addToast("Alle pulter er fjernet.", 'success');
    };

    const rotateDesk = (index: number) => {
        const newDesks = [...desks];
        newDesks[index].rotation = (newDesks[index].rotation || 0) + 45;
        setDesks(newDesks);
    };

    const removeDesk = (index: number) => {
        const desk = desks[index];
        if (desk.student) {
            setBench(prev => [...prev, desk.student!]);
        }
        setDesks(prev => prev.filter((_, i) => i !== index));
    };

    // Toggle Student Properties
    const handleStudentClick = (student: Student, fromBench: boolean, index: number) => {
        const nextGender: Student['gender'] = student.gender === 'X' ? 'M' : student.gender === 'M' ? 'F' : 'X';
        const updatedStudent: Student = { ...student, gender: nextGender };
        
        if (fromBench) {
            const newBench = [...bench];
            newBench[index] = updatedStudent;
            setBench(newBench);
        } else {
            const newDesks = [...desks];
            newDesks[index].student = updatedStudent;
            setDesks(newDesks);
        }
    };

    const handleStudentRightClick = (e: React.MouseEvent, student: Student, fromBench: boolean, index: number) => {
        e.preventDefault();
        const updatedStudent = { ...student, needsFocus: !student.needsFocus };
        
        if (fromBench) {
            const newBench = [...bench];
            newBench[index] = updatedStudent;
            setBench(newBench);
        } else {
            const newDesks = [...desks];
            newDesks[index].student = updatedStudent;
            setDesks(newDesks);
        }
    };

    const shuffleSeats = (smart: boolean) => {
        const allStudents = [
            ...desks.map(d => d.student).filter(Boolean),
            ...bench
        ] as Student[];

        let shuffled: Student[];

        if (smart) {
            const boys = allStudents.filter(s => s.gender === 'M').sort(() => Math.random() - 0.5);
            const girls = allStudents.filter(s => s.gender === 'F').sort(() => Math.random() - 0.5);
            const others = allStudents.filter(s => s.gender === 'X').sort(() => Math.random() - 0.5);
            
            shuffled = [];
            const maxLength = Math.max(boys.length, girls.length, others.length);
            
            for (let i = 0; i < maxLength; i++) {
                if (boys[i]) shuffled.push(boys[i]);
                if (girls[i]) shuffled.push(girls[i]);
            }
            shuffled = [...shuffled, ...others];
        } else {
            shuffled = [...allStudents];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }

        const newDesks = [...desks];
        const newBench: Student[] = [];

        newDesks.forEach(d => d.student = null);

        shuffled.forEach((student, i) => {
            if (i < newDesks.length) {
                newDesks[i].student = student;
            } else {
                newBench.push(student);
            }
        });

        setDesks(newDesks);
        setBench(newBench);
    };

    // Scan Logic
    const handleScanList = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const extractedNames = await extractNamesFromImage(base64Data, file.type);
                if (extractedNames.length > 0) {
                    // Filter to only keep first names (first word)
                    const firstNames = extractedNames.map(n => n.trim().split(' ')[0]);
                    setInputNames(prev => {
                        const current = prev.trim();
                        return current ? current + '\n' + firstNames.join('\n') : firstNames.join('\n');
                    });
                } else {
                    addToast("Fant ingen navn i bildet.", 'error');
                }
            } catch (err) {
                addToast("Kunne ikke analysere bildet.", 'error');
            } finally {
                setIsScanning(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, type: 'desk' | 'bench' | 'desk_position', index: number) => {
        setDraggedItem({ type, index });
        e.dataTransfer.effectAllowed = "move";
        
        // For free mode desk moving
        if (type === 'desk_position') {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            e.dataTransfer.setDragImage(new Image(), 0, 0); // Hide ghost
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetType: 'desk' | 'bench' | 'canvas', targetIndex?: number) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Handle moving desk position in free mode
        if (targetType === 'canvas' && draggedItem.type === 'desk_position' && mode === 'free' && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const newDesks = [...desks];
            newDesks[draggedItem.index].x = Math.max(0, Math.min(100, x));
            newDesks[draggedItem.index].y = Math.max(0, Math.min(100, y));
            setDesks(newDesks);
            setDraggedItem(null);
            return;
        }

        // Handle swapping students
        if (draggedItem.type === 'desk_position') return; // Cannot drop a desk onto a student slot

        const newDesks = [...desks];
        const newBench = [...bench];
        let sourceStudent: Student | null = null;

        if (draggedItem.type === 'desk') {
            sourceStudent = newDesks[draggedItem.index].student;
            newDesks[draggedItem.index].student = null;
        } else {
            sourceStudent = newBench[draggedItem.index];
            newBench.splice(draggedItem.index, 1);
        }

        if (!sourceStudent) return;

        if (targetType === 'desk' && typeof targetIndex === 'number') {
            const targetStudent = newDesks[targetIndex].student;
            newDesks[targetIndex].student = sourceStudent;

            if (targetStudent) {
                if (draggedItem.type === 'desk') {
                    newDesks[draggedItem.index].student = targetStudent;
                } else {
                    newBench.push(targetStudent);
                }
            }
        } else {
            newBench.push(sourceStudent);
        }

        setDesks(newDesks);
        setBench(newBench);
        setDraggedItem(null);
    };

    const getStats = () => {
        const all = [...desks.map(d => d.student).filter(Boolean), ...bench] as Student[];
        const boys = all.filter(s => s.gender === 'M').length;
        const girls = all.filter(s => s.gender === 'F').length;
        const focus = all.filter(s => s.needsFocus).length;
        return { total: all.length, boys, girls, focus };
    };

    const stats = getStats();

    const getGenderColor = (gender: string) => {
        if (!showGenderColors) return 'bg-white border-slate-200 text-slate-800';
        if (gender === 'M') return 'bg-blue-50 border-blue-200 text-blue-900';
        if (gender === 'F') return 'bg-pink-50 border-pink-200 text-pink-900';
        return 'bg-slate-50 border-slate-200 text-slate-700'; 
    };

    return (
        <div className="flex flex-col h-full gap-6 pb-20 max-w-full">
            {/* Header / Config */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col xl:flex-row gap-8 no-print">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <Users className="text-cyan-600" size={20} />
                            <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Elevliste</h3>
                        </div>
                        <div className="relative flex gap-2">
                            {myClasses.length > 0 && (
                                <div className="relative">
                                    <select 
                                        value={selectedClassId} 
                                        onChange={handleClassChange}
                                        className="appearance-none pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-indigo-600 uppercase tracking-wide cursor-pointer focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Velg klasse...</option>
                                        {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <Users size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanList} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                                {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} {t.scScan || "Skann"}
                            </button>
                        </div>
                    </div>
                    <textarea 
                        className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-cyan-500 resize-none" 
                        placeholder="Lim inn navn (ett per linje)..." 
                        value={inputNames} 
                        onChange={e => setInputNames(e.target.value)} 
                    />
                    <div className="text-[10px] font-bold text-slate-400 text-right">{loadingClass ? 'Henter klasse...' : `${bench.length + desks.filter(d=>d.student).length} elever`}</div>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="text-cyan-600" size={20} />
                            <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Oppsett</h3>
                        </div>
                        <button onClick={() => setShowStats(!showStats)} className={`p-2 rounded-xl transition-all ${showStats ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <BarChart3 size={18} />
                        </button>
                    </div>
                    
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                        <button onClick={() => setMode('rows')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'rows' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-400'}`}>{t.scModeRows || "Rader"}</button>
                        <button onClick={() => setMode('groups')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'groups' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-400'}`}>{t.scModeGroups || "Grupper"}</button>
                        <button onClick={() => setMode('free')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'free' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-400'}`}>{t.scModeFree || "Fritt"}</button>
                    </div>

                    {mode !== 'free' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Kolonner</label>
                                <input type="number" min="1" max="10" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl font-black text-sm border-0" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Rader</label>
                                <input type="number" min="1" max="12" value={rows} onChange={e => setRows(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl font-black text-sm border-0" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        {mode === 'free' ? (
                            <>
                                <button onClick={addFreeDesk} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"><Plus size={14}/> {t.scAddDesk || "Pult"}</button>
                                <button onClick={clearDesks} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100" title={t.scClearDesks}><Trash2 size={18} /></button>
                            </>
                        ) : (
                            <button onClick={generateDesks} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-600 transition-all shadow-lg active:scale-95">Generer</button>
                        )}
                        
                        {(desks.length > 0 || mode === 'free') && (
                            <>
                                <button onClick={() => shuffleSeats(false)} className="px-4 py-3 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-all shadow-sm border border-cyan-200" title="Tilfeldig bland">
                                    <Shuffle size={18} />
                                </button>
                                <button onClick={() => shuffleSeats(true)} className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all shadow-sm border border-indigo-200" title={t.scSmartShuffleDesc || "Smart bland (Gutt/Jente)"}>
                                    <UserCircle size={18} />
                                </button>
                            </>
                        )}
                        <button onClick={() => { setDesks([]); setBench([]); }} className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Panel */}
            {showStats && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg animate-in slide-in-from-top-4 grid grid-cols-2 md:grid-cols-4 gap-6 no-print">
                    <div className="text-center"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.scTotalStudents}</p><p className="text-2xl font-black text-slate-900">{stats.total}</p></div>
                    <div className="text-center"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.scBoys}</p><p className="text-2xl font-black text-blue-600">{stats.boys}</p></div>
                    <div className="text-center"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.scGirls}</p><p className="text-2xl font-black text-pink-600">{stats.girls}</p></div>
                    <div className="text-center"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.scFocus}</p><p className="text-2xl font-black text-red-500">{stats.focus}</p></div>
                </div>
            )}

            {/* Main Workspace */}
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
                
                {/* The Classroom Grid / Canvas */}
                <div className="flex-grow bg-slate-100/50 border-4 border-slate-200 rounded-[2.5rem] p-4 md:p-8 relative flex flex-col overflow-hidden">
                    
                    {/* Control Bar */}
                    <div className="flex justify-between items-center mb-6 no-print relative z-10 pointer-events-none">
                        <div className="bg-slate-800 h-2 w-32 md:w-64 rounded-full opacity-20 absolute left-1/2 -translate-x-1/2 pointer-events-auto" title="Tavle"></div>
                        <div className="flex gap-2 pointer-events-auto">
                            <button onClick={() => setShowGenderColors(!showGenderColors)} className={`p-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${showGenderColors ? 'bg-white border-slate-200 text-indigo-600' : 'bg-slate-100 text-slate-400'}`} title="Vis/Skjul farger">
                                {showGenderColors ? <Eye size={14}/> : <EyeOff size={14}/>}
                            </button>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-2 pointer-events-auto">
                            <Info size={12} /> {mode === 'free' ? "Dra pult for å flytte. Dra navn for å bytte." : t.scClickTip}
                        </div>
                    </div>

                    <div 
                        ref={containerRef}
                        className={`flex-grow relative ${mode === 'free' ? 'cursor-crosshair' : 'grid gap-4 place-content-center overflow-auto custom-scrollbar p-2'}`}
                        style={mode === 'free' ? {} : { 
                            gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))`,
                            gap: mode === 'groups' ? '2rem 1rem' : '1rem'
                        }}
                        onDragOver={handleDragOver}
                        onDrop={mode === 'free' ? (e) => handleDrop(e, 'canvas') : undefined}
                    >
                        {desks.map((desk, i) => (
                            <div 
                                key={desk.id}
                                draggable={mode === 'free'}
                                onDragStart={(e) => mode === 'free' ? handleDragStart(e, 'desk_position', i) : undefined}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'desk', i)}
                                style={mode === 'free' ? {
                                    position: 'absolute',
                                    left: `${desk.x}%`,
                                    top: `${desk.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${desk.rotation || 0}deg)`,
                                    width: '100px',
                                    height: '75px'
                                } : {}}
                                className={`
                                    rounded-xl border-2 flex items-center justify-center relative transition-all group/desk
                                    ${mode !== 'free' ? 'aspect-[4/3]' : ''}
                                    ${desk.student ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-200/50 border-slate-300 border-dashed'}
                                    ${mode === 'groups' && (i % 2 === 1) ? 'mr-4' : ''} 
                                    ${mode === 'free' ? 'hover:border-cyan-400 hover:z-20' : ''}
                                `}
                            >
                                {mode === 'free' && (
                                    <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover/desk:opacity-100 transition-opacity z-30">
                                        <button onClick={() => rotateDesk(i)} className="p-1 bg-white rounded-full shadow-md text-slate-400 hover:text-cyan-600"><RotateCw size={10}/></button>
                                        <button onClick={() => removeDesk(i)} className="p-1 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500"><Trash2 size={10}/></button>
                                    </div>
                                )}
                                {mode === 'free' && <Move size={12} className="absolute top-1 left-1 text-slate-300 opacity-0 group-hover/desk:opacity-100 pointer-events-none" />}

                                {desk.student ? (
                                    <div 
                                        draggable
                                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, 'desk', i); }}
                                        onClick={(e) => { e.stopPropagation(); handleStudentClick(desk.student!, false, i); }}
                                        onContextMenu={(e) => { e.stopPropagation(); handleStudentRightClick(e, desk.student!, false, i); }}
                                        className={`
                                            w-[90%] h-[80%] rounded-lg flex items-center justify-center text-center p-1 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md border-2 transition-all group relative
                                            ${getGenderColor(desk.student.gender)}
                                            ${desk.student.needsFocus && showFocusMarks ? 'border-red-400 ring-2 ring-red-100' : 'border-transparent'}
                                        `}
                                    >
                                        <GripVertical size={12} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-current" />
                                        {desk.student.needsFocus && showFocusMarks && <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                                        <span className="font-bold text-xs sm:text-sm leading-tight break-words hyphens-auto select-none pointer-events-none">{desk.student.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-bold text-slate-300 uppercase select-none pointer-events-none">Ledig</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* The Bench (Unassigned students) */}
                <div 
                    className="w-full lg:w-64 bg-slate-50 border-l-0 lg:border-l-2 border-slate-100 p-6 flex flex-col gap-4 overflow-y-auto no-print"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'bench', bench.length)} 
                >
                    <h4 className="font-black uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2">
                        <Monitor size={14} /> Reservebenk ({bench.length})
                    </h4>
                    <div className="flex flex-wrap lg:flex-col gap-2">
                        {bench.map((student, i) => (
                            <div 
                                key={i}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'bench', i)}
                                onClick={() => handleStudentClick(student, true, i)}
                                onContextMenu={(e) => handleStudentRightClick(e, student, true, i)}
                                className={`
                                    px-4 py-3 border-2 rounded-xl text-xs font-bold shadow-sm cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group
                                    ${getGenderColor(student.gender)}
                                    ${student.needsFocus && showFocusMarks ? 'border-red-400' : 'border-transparent'}
                                `}
                            >
                                {student.name}
                                <GripVertical size={12} className="opacity-50 group-hover:opacity-100" />
                            </div>
                        ))}
                        {bench.length === 0 && <p className="text-[10px] text-slate-300 italic">Tom benk</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

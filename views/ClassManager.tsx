
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Eye, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Class, Student } from '../types';
import { useToast } from '../contexts/ToastContext';
import { GRADES } from '../constants';

export const ClassManager: React.FC = () => {
    const { addToast } = useToast();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create/Edit Class State
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassGrade, setNewClassGrade] = useState(GRADES[0]);
    
    // Add Students State
    const [studentInput, setStudentInput] = useState('');
    const [isAddingStudents, setIsAddingStudents] = useState(false);

    const loadClasses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await storageService.getMyClasses();
            setClasses(data);
        } catch (e) {
            console.error(e);
            addToast("Kunne ikke hente klasser", 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const loadStudents = useCallback(async (classId: string) => {
        try {
            const data = await storageService.getStudents(classId);
            setStudents(data);
        } catch (e) {
            addToast("Kunne ikke hente elever", 'error');
        }
    }, [addToast]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass.id);
        } else {
            setStudents([]);
        }
    }, [selectedClass, loadStudents]);

    const handleCreateClass = async () => {
        if (!newClassName.trim()) return;
        try {
            const newClass = await storageService.createClass(newClassName, newClassGrade, 'Generell');
            if (newClass) {
                setClasses(prev => [newClass, ...prev]);
                setSelectedClass(newClass);
                setIsCreating(false);
                setNewClassName('');
                addToast("Klasse opprettet!", 'success');
            }
        } catch (e) {
            addToast("Feil ved oppretting", 'error');
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm("Er du sikker? Dette sletter klassen og alle elever.")) return;
        try {
            await storageService.deleteClass(id);
            setClasses(prev => prev.filter(c => c.id !== id));
            if (selectedClass?.id === id) setSelectedClass(null);
            addToast("Klasse slettet", 'info');
        } catch (e) {
            addToast("Kunne ikke slette klasse", 'error');
        }
    };

    const handleAddStudents = async () => {
        if (!selectedClass || !studentInput.trim()) return;
        const names = studentInput.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
        if (names.length === 0) return;

        setIsAddingStudents(true);
        try {
            await storageService.addStudentsToClass(selectedClass.id, names);
            await loadStudents(selectedClass.id);
            await loadClasses(); // Refresh counts
            setStudentInput('');
            addToast(`${names.length} elever lagt til`, 'success');
        } catch (e) {
            addToast("Feil ved lagring av elever", 'error');
        } finally {
            setIsAddingStudents(false);
        }
    };

    const handleUpdateStudent = async (student: Student, updates: Partial<Student>) => {
        const updated = { ...student, ...updates };
        // Optimistic update
        setStudents(prev => prev.map(s => s.id === student.id ? updated : s));
        try {
            await storageService.updateStudent(updated);
        } catch (e) {
            addToast("Kunne ikke oppdatere elev", 'error');
            loadStudents(selectedClass!.id); // Revert
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!confirm("Fjerne elev fra klassen?")) return;
        try {
            await storageService.deleteStudent(id);
            setStudents(prev => prev.filter(s => s.id !== id));
            loadClasses(); // Update counts
        } catch (e) {
            addToast("Kunne ikke slette elev", 'error');
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in">
            {/* Header / Class List */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase text-slate-700 tracking-tight">Mine Klasser</h3>
                    <button onClick={() => setIsCreating(!isCreating)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
                        {isCreating ? <X size={20} /> : <Plus size={20} />}
                    </button>
                </div>

                {isCreating && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row gap-3 animate-in slide-in-from-top-2">
                        <input 
                            placeholder="Klassenavn (eks: 5A)" 
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            className="flex-grow p-3 rounded-xl border border-indigo-200 outline-none focus:border-indigo-500 font-bold text-sm"
                        />
                        <select 
                            value={newClassGrade}
                            onChange={e => setNewClassGrade(e.target.value)}
                            className="p-3 rounded-xl border border-indigo-200 outline-none bg-white font-bold text-sm"
                        >
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <button onClick={handleCreateClass} disabled={!newClassName} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md">
                            Lagre
                        </button>
                    </div>
                )}

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {classes.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setSelectedClass(c)}
                            className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all flex flex-col items-start min-w-[120px] group relative ${selectedClass?.id === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                        >
                            <span className="font-black text-sm uppercase">{c.name}</span>
                            <span className={`text-[10px] font-bold ${selectedClass?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>{c.studentCount} elever</span>
                            
                            {selectedClass?.id === c.id && (
                                <div onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110">
                                    <Trash2 size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                    {classes.length === 0 && !loading && (
                        <div className="p-4 text-slate-400 text-xs font-bold italic">Ingen klasser funnet. Opprett en ny!</div>
                    )}
                </div>
            </div>

            {/* Student List */}
            {selectedClass && (
                <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    {/* Add Students Panel */}
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <h4 className="font-black uppercase text-xs tracking-widest text-slate-500">Legg til elever</h4>
                        <textarea 
                            value={studentInput}
                            onChange={e => setStudentInput(e.target.value)}
                            placeholder="Lim inn navneliste her (ett navn per linje)..."
                            className="flex-grow p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 outline-none resize-none font-medium text-sm"
                        />
                        <button 
                            onClick={handleAddStudents}
                            disabled={!studentInput.trim() || isAddingStudents}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md flex justify-center gap-2"
                        >
                            {isAddingStudents ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16} />} Legg til
                        </button>
                    </div>

                    {/* Student Grid */}
                    <div className="w-full md:w-2/3 flex flex-col gap-4 min-h-0">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black uppercase text-xs tracking-widest text-slate-500">Elever ({students.length})</h4>
                            <div className="flex gap-2 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/> Gutt</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"/> Jente</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-red-500"/> Fokus</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2 content-start">
                            {students.map(student => (
                                <div key={student.id} className={`p-3 rounded-xl border bg-white shadow-sm flex items-center justify-between group transition-all ${student.needsFocus ? 'ring-2 ring-red-400 border-red-100' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <button 
                                            onClick={() => handleUpdateStudent(student, { gender: student.gender === 'M' ? 'F' : student.gender === 'F' ? 'X' : 'M' })}
                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${student.gender === 'M' ? 'bg-blue-500' : student.gender === 'F' ? 'bg-pink-500' : 'bg-slate-300'}`}
                                            title="Klikk for å endre kjønn"
                                        />
                                        <span className="font-bold text-xs truncate">{student.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleUpdateStudent(student, { needsFocus: !student.needsFocus })} className={`p-1 rounded hover:bg-slate-100 ${student.needsFocus ? 'text-red-500' : 'text-slate-300'}`} title="Marker for fokus">
                                            <Eye size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteStudent(student.id)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <div className="col-span-full py-10 text-center text-slate-400 text-xs italic">Ingen elever i denne klassen ennå.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Users } from 'lucide-react';
import { extractNamesFromImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Class } from '../types';
import { useToast } from '../contexts/ToastContext';

export const GroupGenerator = ({ t }: any) => {
    const { addToast } = useToast();
    const [names, setNames] = useState('');
    const [groupSize, setGroupSize] = useState(4);
    const [groups, setGroups] = useState<string[][]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Classes
    const [myClasses, setMyClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

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
            try {
                const students = await storageService.getStudents(id);
                const namesStr = students.map(s => s.name).join('\n');
                setNames(namesStr);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleGenerate = () => {
        const list = names.split(/[\n,;]+/).map(n=>n.trim()).filter(Boolean).sort(()=>Math.random()-0.5);
        const res = []; while(list.length) res.push(list.splice(0, groupSize));
        setGroups(res);
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
                    setNames(prev => {
                        const current = prev.trim();
                        return current ? current + '\n' + extractedNames.join('\n') : extractedNames.join('\n');
                    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full max-w-full">
            <div className="space-y-4">
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
                        <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors">
                            {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Skann
                        </button>
                    </div>
                </div>
                <textarea 
                    className="w-full h-40 sm:h-64 p-6 bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner resize-none" 
                    placeholder={t.pasteText} 
                    value={names} 
                    onChange={e=>setNames(e.target.value)} 
                />
            </div>
            <div className="space-y-6 min-h-0 flex flex-col">
                <div className="flex items-center justify-between px-2 gap-4"><span className="text-[10px] font-black uppercase text-slate-400 truncate">{t.groupSize}: {groupSize}</span><input type="range" min="2" max="10" value={groupSize} onChange={e=>setGroupSize(parseInt(e.target.value))} className="w-24 sm:w-32 h-2 accent-indigo-600" /></div>
                <button onClick={handleGenerate} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex-shrink-0">{t.createGroups}</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-grow min-h-0">
                    {groups.map((g, i) => (
                        <div key={i} className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm animate-in zoom-in-95 break-words h-fit">
                            <h5 className="text-[9px] font-black text-indigo-500 uppercase mb-2 border-b pb-1">{t.group} {i+1}</h5>
                            <div className="space-y-1">{g.map((n, idx)=><p key={idx} className="text-xs font-bold text-slate-700">{n}</p>)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

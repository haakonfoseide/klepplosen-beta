
import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { generateDifferentiation } from '../services/geminiService';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { useToast } from '../contexts/ToastContext';

export const DifferentiationGenerator = ({ t, language }: any) => {
    const { addToast } = useToast();
    const [task, setTask] = useState('');
    const [grade, setGrade] = useState(GRADES[5]);
    const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
    const [images, setImages] = useState<any[]>([]);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try { const res = await generateDifferentiation(task, subject, grade, images, language); setResult(res); } 
        catch { addToast("Feil ved generering.", 'error'); } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col h-full gap-8 max-w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 sm:p-6 rounded-[2rem] border border-slate-100">
                <select value={subject} onChange={e=>setSubject(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <select value={grade} onChange={e=>setGrade(e.target.value)} className="p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                <div className="flex gap-2"><input type="text" value={task} onChange={e=>setTask(e.target.value)} placeholder={t.pasteText} className="flex-grow p-4 rounded-2xl text-xs font-bold bg-white shadow-sm border-0" /><button onClick={()=>fileInputRef.current?.click()} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all"><Camera size={18}/></button><input type="file" ref={fileInputRef} className="hidden" multiple onChange={e=>{const files=e.target.files; if(files) Array.from(files).forEach((f: any)=>{const r=new FileReader(); r.onloadend=()=>{setImages(prev=>[...prev, {data:(r.result as string).split(',')[1], mimeType:f.type}]);}; r.readAsDataURL(f as Blob);})}} /></div>
            </div>
            {loading ? <div className="flex-grow flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="font-black uppercase text-xs mt-4 animate-pulse">{t.kaiAnalyzing}</p></div> : result ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10 pr-2 min-h-0 flex-grow">
                {[
                  {k:'low', t: t.lowThreshold, c:'border-emerald-100 bg-emerald-50/20'}, 
                  {k:'medium', t: t.expected, c:'border-amber-100 bg-amber-50/20'}, 
                  {k:'high', t: t.challenge, c:'border-blue-100 bg-blue-50/20'}
                ].map(lv => (
                  <div key={lv.k} className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border-2 shadow-xl animate-in zoom-in-95 ${lv.c} overflow-hidden break-words`}>
                    <h4 className="font-black uppercase mb-6 text-sm tracking-widest">{lv.t}</h4>
                    <div className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{(result as any)[lv.k]}</div>
                  </div>
                ))}
              </div>
            ) : <button onClick={handleGenerate} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">{t.analyzeDiff}</button>}
        </div>
    );
};

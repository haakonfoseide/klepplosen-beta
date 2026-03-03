
import React, { useState, useRef, useEffect } from 'react';
import { Activity, BarChart3, Clock, Sparkles, MessageSquare, Loader2, Mic } from 'lucide-react';
import { generateNoiseAdvice } from '../services/geminiService';
import { GRADES } from '../constants';

export const NoiseMeter = ({ t = {}, language = 'nynorsk' }: any) => {
    const [isListening, setIsListening] = useState(false);
    const [volume, setVolume] = useState(0);
    const [threshold, setThreshold] = useState(70);
    const [grade, setGrade] = useState(GRADES[0]);
    const [activity, setActivity] = useState(t?.groupWork || 'Gruppearbeid');
    const [aiAdvice, setAiAdvice] = useState<string[]>([]);
    const [analyzingNoise, setAnalyzingNoise] = useState(false);
    const [autoMode, setAutoMode] = useState(true);
    const [stats, setStats] = useState({ peak: 0, avg: 0, samples: 0 });
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [nextCheck, setNextCheck] = useState(30);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    const dataRef = useRef({ 
        peak: 0, 
        total: 0, 
        count: 0, 
        windowTotal: 0, 
        windowCount: 0,
        startTime: 0
    });

    const toggleMicrophone = async () => { if (isListening) stopMicrophone(); else await startMicrophone(); };
    
    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);
            
            dataRef.current = { peak: 0, total: 0, count: 0, windowTotal: 0, windowCount: 0, startTime: Date.now() };
            setStats({ peak: 0, avg: 0, samples: 0 });
            setTimeElapsed(0);
            setNextCheck(30);
            
            setIsListening(true);
            updateVolume();
        } catch { alert("Mikrofontilgang mangler."); }
    };
    
    const stopMicrophone = () => { 
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); 
        setIsListening(false); 
        setVolume(0); 
    };
    
    const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0; 
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const normalized = Math.min(100, Math.pow(sum / dataArray.length, 1.2) * 0.8); 
        
        dataRef.current.peak = Math.max(dataRef.current.peak, normalized);
        dataRef.current.total += normalized;
        dataRef.current.count += 1;
        dataRef.current.windowTotal += normalized;
        dataRef.current.windowCount += 1;

        setVolume(prev => prev * 0.7 + normalized * 0.3);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    useEffect(() => {
        let interval: any;
        if (isListening) {
            interval = setInterval(() => {
                const now = Date.now();
                setTimeElapsed(Math.floor((now - dataRef.current.startTime) / 1000));
                
                if (dataRef.current.count > 0) {
                    setStats({
                        peak: dataRef.current.peak,
                        avg: dataRef.current.total / dataRef.current.count,
                        samples: dataRef.current.count
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isListening]);

    useEffect(() => {
        let interval: any;
        if (isListening && autoMode) {
            interval = setInterval(async () => {
                setNextCheck(prev => {
                    if (prev <= 1) {
                        const windowAvg = dataRef.current.windowCount > 0 
                            ? dataRef.current.windowTotal / dataRef.current.windowCount 
                            : 0;
                        
                        dataRef.current.windowTotal = 0;
                        dataRef.current.windowCount = 0;

                        handleGetAdvice(windowAvg);
                        return 30;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setNextCheck(30);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isListening, autoMode, threshold, grade, activity]);

    const handleGetAdvice = async (currentAvgVolume: number) => {
        setAnalyzingNoise(true);
        try {
            const level = currentAvgVolume > threshold ? 'high' : 'low';
            const result = await generateNoiseAdvice(grade, activity, level, language);
            if (result && result.advice) {
                setAiAdvice(result.advice);
            }
        } catch (e) {
            console.error("Kunne ikke hente råd", e);
        } finally {
            setAnalyzingNoise(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center gap-10 h-full py-8 max-w-full">
            <div className={`w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-all duration-300 border-8 border-white shadow-2xl relative ${volume > threshold ? 'bg-red-500 scale-110 shadow-red-200' : isListening ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-100'}`}>
                {volume > threshold && <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></div>}
                <div className="text-white font-black text-5xl sm:text-7xl drop-shadow-lg z-10">{Math.round(volume)}</div>
                {isListening && autoMode && (
                    <div className="absolute -bottom-8 bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm border border-slate-100 flex items-center gap-2">
                        <Clock size={12} /> {t.autoAdvice.replace('(30 sek)', '')} {nextCheck}s
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-2xl px-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><Activity size={10} /> Maks</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-700">{Math.round(stats.peak)}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><BarChart3 size={10} /> Snitt</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-700">{Math.round(stats.avg)}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><Clock size={10} /> Tid</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-700">{formatTime(timeElapsed)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                <div className="space-y-6">
                    <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">{t.classAndActivity}</label>
                            <div className="flex gap-2">
                                <select value={grade} onChange={e=>setGrade(e.target.value)} className="flex-1 p-3 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                                <select value={activity} onChange={e=>setActivity(e.target.value)} className="flex-1 p-3 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer">
                                    <option value="Gruppearbeid">{t.groupWork}</option>
                                    <option value="Individuelt arbeid">{t.individualWork}</option>
                                    <option value="Prøve">{t.test}</option>
                                    <option value="Plenum">{t.plenum}</option>
                                    <option value="Friminutt">{t.recess}</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">{t.limit}: {threshold}</label>
                            <input type="range" min="10" max="100" value={threshold} onChange={e=>setThreshold(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                        </div>

                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2 flex items-center gap-2">
                                <Sparkles size={14} className={autoMode ? "text-orange-500" : "text-slate-300"} />
                                {t.autoAdvice}
                            </label>
                            <button 
                                onClick={() => setAutoMode(!autoMode)} 
                                className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 ${autoMode ? 'bg-orange-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoMode ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={toggleMicrophone} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-lg active:scale-95 ${isListening ? 'bg-slate-900 hover:bg-slate-800' : 'bg-orange-500 hover:bg-orange-600'}`}>
                            {isListening ? t.stopMic : t.startMic}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8 shadow-lg flex flex-col relative overflow-hidden min-h-[250px]">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquare size={120} /></div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 flex items-center gap-2">
                        {analyzingNoise ? <Loader2 size={12} className="animate-spin text-orange-500" /> : <Sparkles size={12} className="text-orange-400" />} 
                        {analyzingNoise ? t.kaiAnalyzing : t.kaiFeedback}
                    </h4>
                    
                    {aiAdvice.length > 0 ? (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2">
                            {aiAdvice.map((advice, i) => (
                                <div key={i} className="flex gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                    <div className="w-5 h-5 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center font-black text-[10px] flex-shrink-0 mt-0.5">{i+1}</div>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{advice}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-40 gap-3">
                            <Mic size={32} />
                            <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">
                                {isListening && autoMode ? t.listeningWaiting : t.startMicAdvice}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

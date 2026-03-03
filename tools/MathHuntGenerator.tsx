import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../services/storageService';
import { Play, Users, Trophy, X, RefreshCw, Activity, AlertTriangle, CheckCircle2, Calculator, Settings, ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import { TimerComponent } from '../CommonComponents';
import QRCode from 'react-qr-code';

interface MathHuntGeneratorProps {
    t: any;
    language: string;
    currentUser?: any;
}

export const MathHuntGenerator: React.FC<MathHuntGeneratorProps> = ({ t, language, currentUser }) => {
    const [step, setStep] = useState<'config' | 'lobby' | 'active' | 'summary'>('config');
    const [mode, setMode] = useState<'standard' | 'custom'>('standard');
    const [topic, setTopic] = useState('addition');
    const [customTopic, setCustomTopic] = useState('');
    const [grade, setGrade] = useState('5. trinn');
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const cleanupSubscriptionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        return () => { cleanupSubscriptionRef.current?.(); };
    }, []);

    const GRADES = ['1. trinn', '2. trinn', '3. trinn', '4. trinn', '5. trinn', '6. trinn', '7. trinn', '8. trinn', '9. trinn', '10. trinn'];

    const fetchPlayers = useCallback(async (sessionId: string) => {
        const { data } = await supabase.from('quiz_players').select('*').eq('session_id', sessionId);
        if (data) setPlayers(data);
    }, []);

    const subscribeToPlayers = useCallback((sessionId: string) => {
        const channel = supabase.channel(`mathhunt_lobby_${sessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'quiz_players',
                filter: `session_id=eq.${sessionId}` 
            }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    setPlayers(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                } else if (payload.eventType === 'DELETE') {
                    setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleCreateSession = async () => {
        if (mode === 'custom' && !customTopic.trim()) return;
        
        setIsLoading(true);
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            const { data, error } = await supabase.from('quiz_sessions').insert({
                pin_code: pin,
                status: 'lobby',
                current_question_index: 0,
                quiz_data: [],
                config: { 
                    playMode: 'math_hunt', 
                    topic: mode === 'custom' ? customTopic : topic,
                    grade: grade
                }
            }).select().single();

            if (error) throw error;

            if (data) {
                setSession(data);
                setStep('lobby');
                cleanupSubscriptionRef.current?.();
                cleanupSubscriptionRef.current = subscribeToPlayers(data.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartGame = async () => {
        if (!session) return;
        await supabase.from('quiz_sessions').update({ status: 'active' }).eq('id', session.id);
        setSession({ ...session, status: 'active' });
        setStep('active');
    };

    const handleEndGame = async () => {
        if (!session) return;
        await supabase.from('quiz_sessions').update({ status: 'finished' }).eq('id', session.id);
        await fetchPlayers(session.id);
        setSession({ ...session, status: 'finished' });
        cleanupSubscriptionRef.current?.();
        cleanupSubscriptionRef.current = null;
        setStep('summary');
    };

    if (step === 'config') {
        return (
            <Card className="max-w-2xl mx-auto border-slate-50">
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calculator size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">MatteJakt</h2>
                        <p className="text-slate-400 font-medium text-sm">Adaptiv mengdetrening med AI-støtte</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tema</label>
                            
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                                <button 
                                    onClick={() => setMode('standard')}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'standard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Calculator size={16} /> Standard
                                </button>
                                <button 
                                    onClick={() => setMode('custom')}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'custom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Sparkles size={16} /> Eget Tema (AI)
                                </button>
                            </div>

                            {mode === 'standard' ? (
                                <select 
                                    value={topic} 
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="addition">Addisjon</option>
                                    <option value="subtraction">Subtraksjon</option>
                                    <option value="multiplication">Multiplikasjon</option>
                                    <option value="division">Divisjon</option>
                                    <option value="mixed">Blandet</option>
                                </select>
                            ) : (
                                <div className="relative animate-in fade-in zoom-in-95">
                                    <input 
                                        type="text" 
                                        value={customTopic} 
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        placeholder="Skriv inn tema (f.eks. Brøk, Geometri, Minecraft...)"
                                        className="w-full p-4 pl-12 bg-white border-2 border-indigo-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        autoFocus
                                    />
                                    <BrainCircuit className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Trinn</label>
                            <select 
                                value={grade} 
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                            >
                                {GRADES.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <Button 
                            onClick={handleCreateSession} 
                            disabled={isLoading} 
                            className="w-full mt-4" 
                            size="lg" 
                            icon={ArrowRight}
                        >
                            {isLoading ? 'Oppretter...' : 'Gå til Lobby'}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (step === 'lobby') {
        const joinUrl = `${window.location.origin}?view=join&pin=${session?.pin_code}`;
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in zoom-in-95">
                {/* Header */}
                <div className="absolute top-8 left-8 flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Calculator size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">MatteJakt Lobby</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tema: {topic === 'custom' ? customTopic : topic} • {grade}</p>
                     </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-16">
                    {/* QR Code Section */}
                    <div className="text-center space-y-8">
                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-indigo-50 inline-block transform hover:scale-105 transition-transform duration-500">
                            <QRCode value={joinUrl} size={300} className="mx-auto" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Gå til klepplosen.no</p>
                            <div className="text-6xl font-black text-slate-900 tracking-tighter">{session?.pin_code}</div>
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="w-full max-w-md h-[500px] flex flex-col">
                        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                                <Users className="text-indigo-500" size={28} />
                                <span className="text-3xl font-black text-slate-900">{players.length}</span>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Elever klare</span>
                            </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {players.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 border-2 border-dashed border-slate-200 rounded-3xl">
                                    <Users size={48} className="opacity-50" />
                                    <p className="font-bold text-sm uppercase tracking-widest">Venter på elever...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {players.map(p => (
                                        <div key={p.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-right-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-xl">
                                                {p.nickname.split(' ')[0]}
                                            </div>
                                            <span className="font-bold text-slate-700 text-lg">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <Button 
                                onClick={handleStartGame} 
                                disabled={players.length === 0} 
                                size="lg" 
                                className="w-full py-6 text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                                icon={Play}
                            >
                                Start Jakten
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'active') {
        return (
            <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">MatteJakt pågår</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tema: {session?.config?.topic || topic} • PIN: {session?.pin_code}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <TimerComponent t={t} />
                        <Button variant="secondary" onClick={handleEndGame} icon={X}>Avslutt</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {players.map(p => {
                        const statusColor = p.team === 'red' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                          p.team === 'yellow' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                          'bg-emerald-50 border-emerald-200 text-emerald-700';
                        const StatusIcon = p.team === 'red' ? AlertTriangle : 
                                         p.team === 'yellow' ? RefreshCw : CheckCircle2;
                        
                        return (
                            <div key={p.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all ${statusColor}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-black truncate">{p.nickname}</span>
                                    <StatusIcon size={16} className={p.team === 'yellow' ? 'animate-spin-slow' : ''} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-white/50 p-2 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Nivå</p>
                                        <p className="text-lg font-black">{p.last_answer || 1}</p>
                                    </div>
                                    <div className="bg-white/50 p-2 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Løst</p>
                                        <p className="text-lg font-black">{p.score || 0}</p>
                                    </div>
                                </div>
                                {p.team === 'red' && (
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-center bg-rose-100 p-1 rounded-lg">
                                        Trenger hjelp!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (step === 'summary') {
        const totalSolved = players.reduce((sum, p) => sum + (p.score || 0), 0);
        const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy size={40} />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Jakt Fullført!</h1>
                    <p className="text-slate-500 font-medium text-lg">Klassen løste totalt <span className="font-black text-indigo-600">{totalSolved}</span> oppgaver!</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Resultattavle</h3>
                    <div className="space-y-3">
                        {sortedPlayers.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-400'}`}>
                                        {i + 1}
                                    </div>
                                    <span className="font-bold text-slate-700">{p.nickname}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Slutt-nivå</span>
                                        <span className="font-black text-indigo-600">{p.last_answer || 1}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Løst</span>
                                        <span className="font-black text-emerald-600">{p.score || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button onClick={() => setStep('config')} size="lg" icon={RefreshCw}>
                        Ny MatteJakt
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};

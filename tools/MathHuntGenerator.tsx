import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { storageService } from '../services/storageService';
import { Play, Users, Trophy, X, RefreshCw, Activity, AlertTriangle, CheckCircle2, Calculator } from 'lucide-react';
import { TimerComponent } from '../CommonComponents';
import QRCode from 'react-qr-code';

interface MathHuntGeneratorProps {
    t: any;
    language: string;
    currentUser?: any;
}

export const MathHuntGenerator: React.FC<MathHuntGeneratorProps> = ({ t, language, currentUser }) => {
    const [step, setStep] = useState<'config' | 'lobby' | 'active' | 'summary'>('config');
    const [topic, setTopic] = useState('addition');
    const [customTopic, setCustomTopic] = useState('');
    const [startLevel, setStartLevel] = useState(1);
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const cleanupSubscriptionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        return () => { cleanupSubscriptionRef.current?.(); };
    }, []);

    const fetchPlayers = useCallback(async (sessionId: string) => {
        const data = await storageService.fetchSessionPlayers(sessionId);
        setPlayers(data);
    }, []);

    const subscribeToPlayers = useCallback((sessionId: string) => {
        return storageService.subscribeToSessionPlayers(sessionId, () => {
            fetchPlayers(sessionId);
        });
    }, [fetchPlayers]);

    const handleCreateSession = async () => {
        setIsLoading(true);
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            const data = await storageService.createMathHuntSession(
                pin,
                topic === 'custom' ? customTopic : topic,
                startLevel
            );
            setSession(data);
            setStep('lobby');
            cleanupSubscriptionRef.current?.();
            cleanupSubscriptionRef.current = subscribeToPlayers(data.id);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartGame = async () => {
        if (!session) return;
        await storageService.updateQuizSessionStatus(session.id, 'active');
        setSession({ ...session, status: 'active' });
        setStep('active');
    };

    const handleEndGame = async () => {
        if (!session) return;
        await storageService.updateQuizSessionStatus(session.id, 'finished');
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
                                <option value="custom">Eget tema (AI)</option>
                            </select>
                            {topic === 'custom' && (
                                <input 
                                    type="text" 
                                    value={customTopic} 
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    placeholder="Skriv inn tema (f.eks. Brøk, Geometri...)"
                                    className="w-full p-4 mt-2 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Startnivå (1-10)</label>
                            <input 
                                type="number" 
                                min="1" max="10"
                                value={startLevel} 
                                onChange={(e) => setStartLevel(parseInt(e.target.value, 10) || 1)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <Button 
                            onClick={handleCreateSession} 
                            disabled={isLoading} 
                            className="w-full mt-4" 
                            size="lg" 
                            icon={Play}
                        >
                            {isLoading ? 'Oppretter...' : 'Start MatteJakt'}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (step === 'lobby') {
        const joinUrl = `${window.location.origin}?view=join&pin=${session?.pin_code}`;
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-in zoom-in-95">
                <div className="text-center space-y-6">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">Bli med på MatteJakt</h2>
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-indigo-50 inline-block">
                        <QRCode value={joinUrl} size={300} className="mx-auto" />
                    </div>
                    <p className="text-slate-500 font-medium text-lg">Scan koden med kameraet på iPaden</p>
                    <p className="text-slate-400 text-sm">Eller gå til klepplosen.no og bruk kode: <span className="font-black text-slate-700">{session?.pin_code}</span></p>
                </div>

                <div className="w-full max-w-4xl space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-indigo-500" />
                            <span className="text-xl font-black text-slate-700">{players.length} Elever</span>
                        </div>
                        <Button onClick={handleStartGame} disabled={players.length === 0} size="lg" icon={Play}>
                            Start Jakt
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {players.map(p => (
                            <div key={p.id} className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-700 animate-in slide-in-from-bottom-4">
                                {p.nickname}
                            </div>
                        ))}
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
                                        <p className="text-lg font-black">{p.last_answer || startLevel}</p>
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
                                        <span className="font-black text-indigo-600">{p.last_answer || startLevel}</span>
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

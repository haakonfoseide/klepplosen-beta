import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../services/storageService';
import { generateMathHint, generateMathReport, generateMathProblem } from '../../services/geminiService';
import { Check, X, HelpCircle, Trophy, Loader2, Sparkles, Target } from 'lucide-react';

interface StudentMathHuntProps {
    session: any;
    playerId: string;
    playerScore: number;
    playerStreak: number;
    avatar: string;
    nickname: string;
    onSync: () => void;
}

export const StudentMathHunt: React.FC<StudentMathHuntProps> = ({
    session, playerId, playerScore, playerStreak, avatar, nickname, onSync
}) => {
    const [problem, setProblem] = useState<{ q: string, a: number } | null>(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [hint, setHint] = useState<string | null>(null);
    const [isLoadingHint, setIsLoadingHint] = useState(false);
    
    // Level selection state
    const [hasSelectedLevel, setHasSelectedLevel] = useState(false);
    const [level, setLevel] = useState(1);
    
    const [report, setReport] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isLoadingProblem, setIsLoadingProblem] = useState(false);

    const generateProblem = useCallback(async (currentLevel: number) => {
        const topic = session.config?.topic || 'addition';
        const grade = session.config?.grade || '5. trinn';
        let num1, num2, ans, q;
        
        // Difficulty scaling based on grade
        let gradeMultiplier = 1;
        if (grade.startsWith('1.') || grade.startsWith('2.')) gradeMultiplier = 0.5;
        else if (grade.startsWith('3.') || grade.startsWith('4.')) gradeMultiplier = 1;
        else if (grade.startsWith('5.') || grade.startsWith('6.') || grade.startsWith('7.')) gradeMultiplier = 5;
        else gradeMultiplier = 10;

        const max = Math.ceil(currentLevel * 10 * gradeMultiplier);
        
        // Standard topics
        if (['addition', 'subtraction', 'multiplication', 'division', 'mixed'].includes(topic)) {
            let effectiveTopic = topic;
            if (topic === 'mixed') {
                const types = ['addition', 'subtraction', 'multiplication', 'division'];
                effectiveTopic = types[Math.floor(Math.random() * types.length)];
            }

            switch (effectiveTopic) {
                case 'addition':
                    num1 = Math.floor(Math.random() * max) + 1;
                    num2 = Math.floor(Math.random() * max) + 1;
                    ans = num1 + num2;
                    q = `${num1} + ${num2}`;
                    break;
                case 'subtraction':
                    num1 = Math.floor(Math.random() * max) + currentLevel;
                    num2 = Math.floor(Math.random() * num1);
                    ans = num1 - num2;
                    q = `${num1} - ${num2}`;
                    break;
                case 'multiplication':
                    // Adjust multiplication for lower grades
                    const mMax1 = gradeMultiplier < 1 ? 5 : (currentLevel + 2) * Math.sqrt(gradeMultiplier);
                    const mMax2 = gradeMultiplier < 1 ? 5 : 10 * Math.sqrt(gradeMultiplier);
                    num1 = Math.floor(Math.random() * mMax1) + 1;
                    num2 = Math.floor(Math.random() * mMax2) + 1;
                    ans = num1 * num2;
                    q = `${num1} × ${num2}`;
                    break;
                case 'division':
                    num2 = Math.floor(Math.random() * 10) + 1;
                    ans = Math.floor(Math.random() * (currentLevel + 2) * Math.sqrt(gradeMultiplier)) + 1;
                    num1 = num2 * ans;
                    q = `${num1} ÷ ${num2}`;
                    break;
                default:
                    num1 = Math.floor(Math.random() * max) + 1;
                    num2 = Math.floor(Math.random() * max) + 1;
                    ans = num1 + num2;
                    q = `${num1} + ${num2}`;
            }
            
            setProblem({ q, a: ans });
            setAnswer('');
            setFeedback('idle');
            setHint(null);
        } else {
            // Custom AI topic
            setIsLoadingProblem(true);
            try {
                const aiProblem = await generateMathProblem(topic, currentLevel, grade);
                if (aiProblem) {
                    setProblem(aiProblem);
                    setAnswer('');
                    setFeedback('idle');
                    setHint(null);
                } else {
                    throw new Error("AI returned null");
                }
            } catch (e) {
                console.error("AI Generation failed, falling back to addition", e);
                // Fallback to simple addition if AI fails
                num1 = Math.floor(Math.random() * max) + 1;
                num2 = Math.floor(Math.random() * max) + 1;
                ans = num1 + num2;
                q = `${num1} + ${num2}`;
                setProblem({ q, a: ans });
                setAnswer('');
                setFeedback('idle');
                setHint(null);
            } finally {
                setIsLoadingProblem(false);
            }
        }
    }, [session.config?.topic, session.config?.grade]);

    useEffect(() => {
        if (hasSelectedLevel && !problem && session.status === 'active') {
            generateProblem(level);
        }
    }, [problem, session.status, level, generateProblem, hasSelectedLevel]);

    useEffect(() => {
        if (session.status === 'finished' && !report && !isGeneratingReport) {
            generateReport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.status]);

    const generateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const res = await generateMathReport(nickname, playerScore, level, session.config?.topic || 'matematikk');
            setReport(res);
        } catch (e) {
            setReport("Klarte ikke å generere rapporten. Men du gjorde en kjempeinnsats!");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleSubmit = async () => {
        if (!problem || !answer) return;
        
        const numAnswer = parseInt(answer);
        const isCorrect = numAnswer === problem.a;
        
        setFeedback(isCorrect ? 'correct' : 'wrong');
        
        let newScore = playerScore;
        let newStreak = playerStreak;
        let newLevel = level;
        let newTeam = 'green'; // status color
        
        if (isCorrect) {
            newScore += 1;
            newStreak += 1;
            if (newStreak >= 3) {
                newLevel += 1;
                newStreak = 0;
            }
            newTeam = 'green';
        } else {
            newStreak = 0;
            newTeam = 'red';
        }

        setLevel(newLevel);
        
        // Update Supabase
        await supabase.from('quiz_players').update({
            score: newScore,
            streak: newStreak,
            team: newTeam,
            last_answer: newLevel.toString()
        }).eq('id', playerId);
        
        onSync();

        if (isCorrect) {
            setTimeout(() => {
                generateProblem(newLevel);
            }, 1500);
        }
    };

    const handleGetHint = async () => {
        if (!problem) return;
        setIsLoadingHint(true);
        try {
            const h = await generateMathHint(problem.q, answer, session.config?.topic || 'matematikk');
            setHint(h);
        } catch (e) {
            setHint("Prøv å tegne oppgaven, eller bruk fingrene!");
        } finally {
            setIsLoadingHint(false);
        }
    };

    const handleSelectLevel = (lvl: number) => {
        setLevel(lvl);
        setHasSelectedLevel(true);
        // Update initial level in DB so teacher sees it
        supabase.from('quiz_players').update({ last_answer: lvl.toString() }).eq('id', playerId).then(() => onSync());
    };

    if (session.status === 'finished') {
        return (
            <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
                <Card className="w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                        <Trophy size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Bra jobba, {avatar} {nickname}!</h1>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Løst</p>
                            <p className="text-3xl font-black text-emerald-600">{playerScore}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nivå</p>
                            <p className="text-3xl font-black text-indigo-600">{level}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-2xl text-left space-y-3">
                        <h3 className="font-black text-indigo-900 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-500" />
                            Din Læringsrapport
                        </h3>
                        {isGeneratingReport ? (
                            <div className="flex items-center gap-3 text-indigo-600 font-medium">
                                <Loader2 className="animate-spin" size={18} />
                                Kai analyserer innsatsen din...
                            </div>
                        ) : (
                            <p className="text-indigo-800 text-sm leading-relaxed">{report}</p>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    if (!hasSelectedLevel) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
                <Card className="w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Target size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Velg startnivå</h2>
                    <p className="text-slate-500">Hvor vanskelig vil du ha det?</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => handleSelectLevel(lvl)}
                                className="p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 font-black text-lg transition-all"
                            >
                                Nivå {lvl}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                            {avatar}
                        </div>
                        <span className="font-bold text-slate-700">{nickname}</span>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nivå</span>
                            <span className="font-black text-indigo-600">{level}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Løst</span>
                            <span className="font-black text-emerald-600">{playerScore}</span>
                        </div>
                    </div>
                </div>

                <Card className="p-8 text-center space-y-8">
                    {isLoadingProblem ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-indigo-600" size={48} />
                            <p className="text-indigo-600 font-bold animate-pulse">Lager ny oppgave...</p>
                        </div>
                    ) : (
                        <div className="text-6xl font-black text-slate-900 tracking-tighter">
                            {problem?.q} = ?
                        </div>
                    )}

                    <div className="space-y-4">
                        <input 
                            type="number" 
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className={`w-full text-center text-4xl font-black p-6 rounded-3xl border-4 outline-none transition-all ${
                                feedback === 'correct' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' :
                                feedback === 'wrong' ? 'bg-rose-50 border-rose-400 text-rose-700' :
                                'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                            }`}
                            placeholder="Svar"
                            disabled={feedback === 'correct'}
                            autoFocus
                        />

                        {feedback === 'idle' && (
                            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!answer}>
                                Svar
                            </Button>
                        )}

                        {feedback === 'correct' && (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-xl animate-in zoom-in">
                                <Check size={28} /> Riktig!
                            </div>
                        )}

                        {feedback === 'wrong' && (
                            <div className="space-y-4 animate-in shake">
                                <div className="flex items-center justify-center gap-2 text-rose-600 font-black text-xl">
                                    <X size={28} /> Prøv igjen!
                                </div>
                                {!hint && (
                                    <Button variant="secondary" onClick={handleGetHint} disabled={isLoadingHint} className="w-full" icon={HelpCircle}>
                                        {isLoadingHint ? 'Spør Kai...' : 'Trenger du et hint?'}
                                    </Button>
                                )}
                            </div>
                        )}

                        {hint && (
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-800 text-sm font-medium text-left flex gap-3 animate-in slide-in-from-top-2">
                                <Sparkles className="shrink-0 text-indigo-500" size={20} />
                                <p>{hint}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

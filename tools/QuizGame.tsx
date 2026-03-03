
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, storageService } from '../services/storageService';
import { generateQuizQuestions } from '../services/geminiService';
import { QuizQuestion, QuizSession, QuizPlayer, SavedPlan } from '../types';
import { COMMON_SUBJECTS, GRADES } from '../constants';
import { Play, Users, Settings, Loader2, Sparkles, Trash2, ArrowRight, Trophy, RefreshCw, CheckCircle2, ScanLine, Save, Copy, Check, FolderOpen, X, Calendar, BookOpen, Edit3, UserMinus } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useToast } from '../contexts/ToastContext';
import { TEAMS } from '../constants';

interface QuizGameProps {
    t: any;
    language: string;
    currentUser?: any;
    isOwner?: boolean;
    initialData?: any;
    currentPlanId?: string;
}

export const QuizGame: React.FC<QuizGameProps> = ({ t, language, currentUser, isOwner = true, initialData, currentPlanId }) => {
    const { addToast } = useToast();
    
    // Phases: setup (AI gen), lobby (PIN/Players), game (Active question), result (Leaderboard)
    const [phase, setPhase] = useState<'setup' | 'lobby' | 'game' | 'result'>('setup');
    const [isLoading, setIsLoading] = useState(false);
    
    // Setup State
    const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
    const [grade, setGrade] = useState(GRADES[5]);
    const [topic, setTopic] = useState('');
    const [amount, setAmount] = useState(5);
    const [gameMode, setGameMode] = useState<'classic' | 'teams'>('classic');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    
    // Load Saved State
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedQuizzes, setSavedQuizzes] = useState<SavedPlan[]>([]);
    
    // Session State
    const [session, setSession] = useState<QuizSession | null>(null);
    const [players, setPlayers] = useState<QuizPlayer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameStatus, setGameStatus] = useState<'question' | 'reveal' | 'scoreboard' | 'reflection'>('question');
    const [showLiveLeaderboard, setShowLiveLeaderboard] = useState(true);
    const [answersCount, setAnswersCount] = useState(0);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [tempQuestion, setTempQuestion] = useState<QuizQuestion | null>(null);

    const timerRef = useRef<any>(null);
    const subscriptionRef = useRef<any>(null);
    const currentQIndexRef = useRef(0);

    // Load initial data if opened from archive
    useEffect(() => {
        if (initialData) {
            if (initialData.questions) setQuestions(initialData.questions);
            if (initialData.subject) setSubject(initialData.subject);
            if (initialData.grade) setGrade(initialData.grade);
            if (initialData.topic) setTopic(initialData.topic);
        }
    }, [initialData]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
        };
    }, []);

    const fetchPlayers = useCallback(async (sessionId: string) => {
        const { data } = await supabase.from('quiz_players').select('*').eq('session_id', sessionId);
        if (data) {
            setPlayers(data as QuizPlayer[]);
        }
    }, []);

    const subscribeToPlayers = useCallback((sessionId: string) => {
        if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
        
        const channel = supabase.channel(`quiz_lobby_${sessionId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'quiz_players', 
                filter: `session_id=eq.${sessionId}` 
            }, () => {
                fetchPlayers(sessionId);
            })
            .subscribe();
        
        subscriptionRef.current = channel;
        fetchPlayers(sessionId);
    }, [fetchPlayers]);

    // --- SETUP LOGIC ---
    const handleGenerate = async () => {
        setIsLoading(true);
        setSaveStatus('idle');
        try {
            const qs = await generateQuizQuestions(subject, grade, topic, language, amount);
            setQuestions(qs);
            addToast("Quiz generert!", 'success');
        } catch (e) {
            addToast("Kunne ikke generere quiz.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchSavedQuizzes = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const plans = await storageService.getMyPlans(currentUser.id);
            const quizzes = plans.filter(p => p.task.planType === 'quiz' || p.task.toolType === 'quiz');
            setSavedQuizzes(quizzes);
            setShowLoadModal(true);
        } catch (e) {
            console.error("Could not fetch quizzes", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadQuiz = (plan: SavedPlan) => {
        if (plan.task?.questions) {
            setQuestions(plan.task.questions as QuizQuestion[]);
            setSubject(plan.subject);
            setGrade(plan.grade);
            setTopic(plan.topic);
            setAmount(plan.task.questions.length);
            setShowLoadModal(false);
        }
    };

    const handleSaveToArchive = async () => {
        if (!currentUser || questions.length === 0) return;
        setSaveStatus('saving');
        
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(), 
                task: {
                    title: `Quiz: ${topic || subject}`,
                    description: `Quiz med ${questions.length} spørsmål om ${topic}.`,
                    questions: questions,
                    clStructureId: 'tool',
                    planType: 'quiz',
                    toolType: 'quiz',
                    subject,
                    grade,
                    topic
                } as any, 
                subject,
                grade,
                topic: topic || 'Quiz',
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: false,
                isImported: false,
                likes: 0,
                likedBy: []
            };

            await storageService.savePlan(planToSave);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
        }
    };

    const handleCreateSession = async () => {
        setIsLoading(true);
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            const { data, error } = await supabase.from('quiz_sessions').insert({
                pin_code: pin,
                status: 'lobby',
                current_question_index: 0,
                quiz_data: questions,
                config: { 
                    playMode: gameMode, 
                    seaNames: true,
                    autoTeams: true 
                }
            }).select().single();

            if (error) throw error;

            if (data) {
                setSession({ ...data, id: data.id, pin: data.pin_code, status: 'lobby', currentQuestionIndex: 0, questions: questions, players: [], config: data.config });
                setPhase('lobby');
                subscribeToPlayers(data.id);
                addToast("Lobby opprettet!", 'success');
            }
        } catch (e: any) {
            addToast("Feil ved opprettelse: " + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKickPlayer = async (playerId: string) => {
        try {
            await supabase.from('quiz_players').delete().eq('id', playerId);
            addToast("Spiller fjernet", 'info');
            if (session) fetchPlayers(session.id);
        } catch (e) {
            addToast("Kunne ikke fjerne spiller", 'error');
        }
    };

    const handleEditQuestion = (index: number) => {
        setEditingQuestionIndex(index);
        setTempQuestion({ ...questions[index] });
    };

    const saveEditedQuestion = () => {
        if (editingQuestionIndex !== null && tempQuestion) {
            const newQuestions = [...questions];
            newQuestions[editingQuestionIndex] = tempQuestion;
            setQuestions(newQuestions);
            setEditingQuestionIndex(null);
            setTempQuestion(null);
            addToast("Spørsmål oppdatert", 'success');
        }
    };

    const updateSessionStatus = useCallback(async (status: string, qIndex: number) => {
        if (!session) return;
        await supabase.from('quiz_sessions').update({ status, current_question_index: qIndex }).eq('id', session.id);
    }, [session]);

    const handleTimeUp = useCallback(async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        // Move to REVEAL phase (show correct answer + explanation)
        setGameStatus('reveal');
        await updateSessionStatus('reveal', currentQIndexRef.current);
    }, [updateSessionStatus]);

    const finishGame = useCallback(async () => {
        setPhase('result');
        await updateSessionStatus('finished', currentQIndexRef.current);
        if (session) fetchPlayers(session.id); // Final scores
    }, [session, updateSessionStatus, fetchPlayers]);

    const startQuestion = useCallback(async (index: number) => {
        if (!session) return;
        
        // 1. Reset state
        currentQIndexRef.current = index;
        setCurrentQuestionIndex(index);
        setGameStatus('question');
        setAnswersCount(0);
        
        // 2. Set Time
        const q = questions[index];
        setTimeLeft(q.timeLimit || 30);
        
        // 3. Reset player answer status in DB for this question
        await supabase.from('quiz_players').update({ 
            last_answer: null,
            answer_for_index: -1 
        }).eq('session_id', session.id);

        // 4. Update DB to trigger clients
        await updateSessionStatus('active', index);
        
        // 5. Start Timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [questions, session, updateSessionStatus, handleTimeUp]);

    useEffect(() => {
        if (session && phase === 'game') {
            const answered = players.filter(p => p.answer_for_index === currentQuestionIndex).length;
            setAnswersCount(answered);
            
            // Auto-reveal if all answered (and more than 0 players)
            if (players.length > 0 && answered >= players.length && gameStatus === 'question') {
                handleTimeUp();
            }
        }
    }, [players, session, gameStatus, currentQuestionIndex, phase, handleTimeUp]);

    // --- GAME CONTROL LOGIC ---
    const startGame = async () => {
        if (!session) return;
        setPhase('game');
        startQuestion(0);
    };

    const goToReflection = async () => {
        setGameStatus('reflection');
        await updateSessionStatus('reflection', currentQuestionIndex);
    };

    const goToScoreboard = async () => {
        // Move to SCOREBOARD phase
        if (session) fetchPlayers(session.id); // Ensure latest scores
        setGameStatus('scoreboard');
        await updateSessionStatus('scoreboard', currentQuestionIndex);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            startQuestion(currentQuestionIndex + 1);
        } else {
            finishGame();
        }
    };

    // --- RENDERERS ---

    if (phase === 'setup') {
        return (
            <div className="flex flex-col h-full gap-8 max-w-4xl mx-auto py-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 text-purple-600">
                            <div className="p-3 bg-purple-100 rounded-2xl"><Settings size={24} /></div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Quiz Oppsett</h2>
                        </div>
                        {currentUser && (
                            <button onClick={handleFetchSavedQuizzes} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm">
                                <FolderOpen size={14} /> Åpne lagret
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Fag / Kategori</label>
                            <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer outline-none focus:ring-2 ring-purple-100">
                                <option value="Trivia">✨ Trivia / Fakta</option>
                                <option value="Nyheter">📰 Dagens Nyheter</option>
                                <optgroup label="Skolefag">
                                    {COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Trinn</label>
                            <select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 cursor-pointer outline-none focus:ring-2 ring-purple-100">{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tema</label>
                            <input 
                                value={topic} 
                                onChange={e=>setTopic(e.target.value)} 
                                placeholder={subject === 'Trivia' ? 'F.eks. Verdensrommet, Sport, Dyr...' : subject === 'Nyheter' ? 'F.eks. Sport, Politikk, Klima...' : 'F.eks. Brøk, Vikingtiden...'} 
                                className="w-full p-4 rounded-2xl font-bold text-xs bg-white shadow-sm border-0 outline-none focus:ring-2 ring-purple-100" 
                            />
                        </div>
                        
                        <div className="md:col-span-2 pt-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-1 mb-2 block">Spillmodus</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setGameMode('classic')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'classic' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-white opacity-60'}`}
                                >
                                    <Trophy size={20} className={gameMode === 'classic' ? 'text-purple-600' : 'text-slate-400'} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${gameMode === 'classic' ? 'text-purple-900' : 'text-slate-500'}`}>Konkurranse</span>
                                </button>
                                <button 
                                    onClick={() => setGameMode('teams')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'teams' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-white opacity-60'}`}
                                >
                                    <Users size={20} className={gameMode === 'teams' ? 'text-purple-600' : 'text-slate-400'} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${gameMode === 'teams' ? 'text-purple-900' : 'text-slate-500'}`}>Lagkonkurranse</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleGenerate} disabled={isLoading || (!topic && subject !== 'Nyheter' && subject !== 'Trivia')} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generer Quiz
                    </button>
                </div>

                {questions.length > 0 && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-8">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-black uppercase text-sm text-slate-500 tracking-widest">{questions.length} Spørsmål klar</h3>
                            <div className="flex gap-2">
                                {currentUser && (
                                    <button 
                                        onClick={handleSaveToArchive} 
                                        disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm border ${saveStatus === 'saved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600'}`}
                                    >
                                        {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : isOwner ? <Save size={14} /> : <Copy size={14} />} 
                                        {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? 'Lagre Quiz' : 'Lagre Kopi'}
                                    </button>
                                )}
                                <button onClick={handleCreateSession} disabled={isLoading} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center gap-2">
                                    {isLoading ? <Loader2 className="animate-spin" size={14}/> : <Play size={14}/>} Start Lobby
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {questions.map((q, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start group">
                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-400 flex-shrink-0">{i+1}</div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm text-slate-800">{q.question}</p>
                                        <div className="flex gap-2 mt-2">
                                            {q.options.map((opt, idx) => (
                                                 <span key={idx} className={`px-2 py-1 rounded text-[10px] font-bold ${idx === q.correctIndex ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>{opt}</span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 italic">{q.explanation}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditQuestion(i)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                                        <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EDIT QUESTION MODAL */}
                {editingQuestionIndex !== null && tempQuestion && (
                    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <Edit3 className="text-purple-600" /> Rediger spørsmål
                                </h3>
                                <button onClick={() => setEditingQuestionIndex(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 pr-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Spørsmål</label>
                                    <textarea 
                                        value={tempQuestion.question} 
                                        onChange={e => setTempQuestion({...tempQuestion, question: e.target.value})}
                                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-0 focus:ring-2 ring-purple-100 outline-none min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Svaralternativer (Marker riktig)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {tempQuestion.options.map((opt, idx) => (
                                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${tempQuestion.correctIndex === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                                <button 
                                                    onClick={() => setTempQuestion({...tempQuestion, correctIndex: idx})}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${tempQuestion.correctIndex === idx ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}
                                                >
                                                    {tempQuestion.correctIndex === idx && <Check size={14} strokeWidth={4} />}
                                                </button>
                                                <input 
                                                    value={opt} 
                                                    onChange={e => {
                                                        const newOpts = [...tempQuestion.options];
                                                        newOpts[idx] = e.target.value;
                                                        setTempQuestion({...tempQuestion, options: newOpts});
                                                    }}
                                                    className="bg-transparent font-bold text-xs w-full outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Forklaring (Pedagogisk tips)</label>
                                    <textarea 
                                        value={tempQuestion.explanation} 
                                        onChange={e => setTempQuestion({...tempQuestion, explanation: e.target.value})}
                                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-0 focus:ring-2 ring-purple-100 outline-none min-h-[80px] resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tid (sekunder)</label>
                                        <input 
                                            type="number"
                                            value={tempQuestion.timeLimit} 
                                            onChange={e => setTempQuestion({...tempQuestion, timeLimit: parseInt(e.target.value, 10)})}
                                            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-0 focus:ring-2 ring-purple-100 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Type</label>
                                        <select 
                                            value={tempQuestion.type} 
                                            onChange={e => {
                                                const type = e.target.value as any;
                                                const options = type === 'true-false' ? ["Sant", "Usant"] : ["", "", "", ""];
                                                setTempQuestion({...tempQuestion, type, options, correctIndex: 0});
                                            }}
                                            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-0 focus:ring-2 ring-purple-100 outline-none"
                                        >
                                            <option value="multiple-choice">Flervalg (4)</option>
                                            <option value="true-false">Sant / Usant</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setEditingQuestionIndex(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Avbryt</button>
                                <button onClick={saveEditedQuestion} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all shadow-lg">Lagre endringer</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* LOAD QUIZ MODAL */}
                {showLoadModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <FolderOpen className="text-purple-600" /> Dine Quizer
                                </h3>
                                <button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {savedQuizzes.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-bold text-sm">Ingen lagrede quizer funnet.</div>
                                ) : (
                                    savedQuizzes.map(plan => (
                                        <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleLoadQuiz(plan)}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{plan.task?.title || plan.topic || 'Uten tittel'}</h4>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{plan.subject}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {plan.date}</span>
                                                    </div>
                                                </div>
                                                <button className="p-2 bg-white rounded-xl text-slate-300 group-hover:text-purple-600 shadow-sm transition-colors">
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'lobby') {
        const joinUrl = `${window.location.origin}?view=join&pin=${session?.pin}`;
        
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 opacity-50"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 shadow-2xl animate-in zoom-in">
                        <div className="text-center px-4">
                            <p className="font-black uppercase text-xs tracking-[0.4em] text-indigo-300 mb-2">Game PIN:</p>
                            <h1 className="text-8xl font-black tracking-tighter drop-shadow-2xl">{session?.pin}</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-4">Gå til klepplosen.no</p>
                        </div>
                        
                        <div className="h-48 w-px bg-white/10 hidden md:block"></div>
                        
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-white p-4 rounded-2xl shadow-inner">
                                <QRCode value={joinUrl} size={140} />
                            </div>
                            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                                <ScanLine size={14} /> Skann for å bli med
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        {players.map(p => (
                            <div key={p.id} className="bg-white/20 backdrop-blur-sm pl-4 pr-2 py-2 rounded-full font-bold text-sm flex items-center gap-3 animate-in zoom-in group">
                                <div className="flex items-center gap-2">
                                    <span>{p.nickname.split(' ')[0]}</span>
                                    <span className="uppercase tracking-widest text-[10px] opacity-80">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                </div>
                                <button 
                                    onClick={() => handleKickPlayer(p.id)}
                                    className="p-1.5 bg-white/10 hover:bg-red-500/80 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="Fjern spiller"
                                >
                                    <UserMinus size={12} />
                                </button>
                            </div>
                        ))}
                        {players.length === 0 && <p className="text-white/40 animate-pulse font-bold uppercase tracking-widest text-sm">Venter på matroser...</p>}
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                        <div className="px-6 py-3 bg-black/30 rounded-xl font-black text-xl flex items-center gap-3">
                            <Users size={24} className="text-indigo-400" /> {players.length}
                        </div>
                        <button 
                            onClick={startGame} 
                            disabled={players.length === 0}
                            className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xl tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none"
                        >
                            Start Toktet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'game') {
        const q = questions[currentQuestionIndex];
        const isTimeUp = gameStatus !== 'question';
        
        return (
            <div className="flex flex-col h-full bg-slate-50 rounded-[3rem] overflow-hidden relative">
                {/* Header with PIN */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center px-8 shadow-md relative z-10">
                    <span className="font-black text-xs uppercase tracking-widest text-indigo-300">Spørsmål {currentQuestionIndex + 1} / {questions.length}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Game PIN:</span>
                        <span className="font-black text-xl tracking-widest">{session?.pin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-400"/> <span className="font-bold text-sm">{players.length}</span>
                        <div className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-black uppercase text-emerald-400 ml-2">
                            {answersCount} Svar
                        </div>
                        <button 
                            onClick={() => setShowLiveLeaderboard(!showLiveLeaderboard)} 
                            className={`ml-4 p-2 rounded-xl border transition-all flex items-center gap-2 ${showLiveLeaderboard ? 'bg-amber-400 border-amber-500 text-slate-900' : 'bg-white/10 border-white/20 text-white'}`}
                            title="Vis/skjul live toppliste"
                        >
                            <Trophy size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Toppliste</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-200 w-full">
                    <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>

                {/* Question Area */}
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center gap-8 bg-white relative overflow-hidden">
                    
                    {/* Live Leaderboard Sidebar */}
                    {showLiveLeaderboard && players.length > 0 && (
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 hidden xl:flex flex-col gap-2 animate-in slide-in-from-left duration-700 z-10">
                            <div className="flex items-center gap-2 mb-2 px-2">
                                <Trophy size={14} className="text-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Toppliste</span>
                            </div>
                            {players
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 5)
                                .map((p, i) => (
                                    <div key={p.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-left" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {i + 1}
                                            </span>
                                            <span className="font-bold text-xs truncate max-w-[80px] text-slate-700">{p.nickname.split(' ').slice(1).join(' ')}</span>
                                        </div>
                                        <span className="font-black font-mono text-[10px] text-purple-600">{p.score}</span>
                                    </div>
                                ))}
                        </div>
                    )}
                    
                    {gameStatus === 'question' ? (
                        <>
                            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight max-w-4xl">{q.question}</h2>
                            <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center text-4xl font-black text-slate-700 shadow-xl relative animate-in zoom-in">
                                {timeLeft}
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in zoom-in flex flex-col items-center gap-6">
                            <h2 className="text-3xl font-black text-slate-900">Riktig svar:</h2>
                            <div className="p-6 bg-emerald-100 text-emerald-800 rounded-3xl text-2xl font-black shadow-lg border-4 border-emerald-200">
                                {q.options[q.correctIndex]}
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-2xl max-w-2xl text-left border border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                    <BookOpen size={20} />
                                    <h4 className="font-black uppercase text-xs tracking-widest">Forklaring</h4>
                                </div>
                                <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">{q.explanation}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Player Answer Status */}
                    {gameStatus === 'question' && (
                        <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
                            {players.map(p => {
                                const hasAnswered = p.answer_for_index === currentQuestionIndex;
                                return (
                                    <div key={p.id} className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${hasAnswered ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                        <span>{p.nickname.split(' ').slice(1).join(' ')}</span>
                                        {p.streak > 2 && <span className="text-orange-500 animate-pulse">🔥{p.streak}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Options Grid */}
                    <div className={`grid ${q.type === 'true-false' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-4 w-full max-w-5xl mt-4 ${isTimeUp ? 'opacity-50 pointer-events-none' : ''}`}>
                        {q.options.map((opt, i) => {
                            const isCorrect = i === q.correctIndex;
                            const bg = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'][i % 4];
                            
                            return (
                                <div key={i} className={`p-8 rounded-[2rem] text-white font-black text-xl sm:text-2xl shadow-lg transition-all flex items-center gap-4 ${bg} ${isTimeUp && !isCorrect ? 'opacity-20' : 'opacity-100'} ${isTimeUp && isCorrect ? 'scale-105 shadow-xl ring-4 ring-emerald-300' : ''}`}>
                                    <span className="text-3xl opacity-50">{(['▲', '◆', '●', '■'] as any)[i]}</span>
                                    <span>{opt}</span>
                                    {isTimeUp && isCorrect && <CheckCircle2 size={32} className="ml-auto text-white animate-bounce" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Next Button Overlay */}
                {gameStatus === 'reveal' && (
                    <div className="absolute bottom-8 right-8 z-50 animate-in slide-in-from-bottom flex gap-4">
                        <button onClick={goToReflection} className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black uppercase text-lg tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                            <BookOpen size={20} /> Refleksjon
                        </button>
                        <button onClick={goToScoreboard} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-lg tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                            Se Poeng <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* Reflection Overlay */}
                {gameStatus === 'reflection' && (
                    <div className="absolute inset-0 bg-indigo-600 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-500 p-12">
                        <div className="max-w-3xl w-full space-y-8 text-center">
                            <div className="inline-flex p-4 bg-white/20 rounded-3xl mb-4">
                                <BookOpen size={48} />
                            </div>
                            <h2 className="text-5xl font-black uppercase tracking-tighter leading-tight">Ankerfeste: Refleksjon</h2>
                            <div className="bg-white/10 p-10 rounded-[3rem] border border-white/20 backdrop-blur-md">
                                <p className="text-2xl font-bold leading-relaxed italic">
                                    "{q.explanation}"
                                </p>
                            </div>
                            <div className="pt-8">
                                <p className="text-sm font-black uppercase tracking-[0.3em] opacity-60 mb-6">Diskuter med sidemannen</p>
                                <button onClick={goToScoreboard} className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xl tracking-widest hover:scale-105 transition-transform flex items-center gap-3 mx-auto shadow-2xl">
                                    Gå Videre <ArrowRight size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scoreboard Overlay */}
                {gameStatus === 'scoreboard' && (
                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white animate-in slide-in-from-bottom p-8">
                        <Trophy size={64} className="text-yellow-400 mb-6 animate-bounce" />
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">
                            {session?.config?.playMode === 'teams' ? 'Skutekampen' : 'Topp 5'}
                        </h2>
                        <div className="w-full max-w-md space-y-3">
                            {session?.config?.playMode === 'teams' ? (
                                TEAMS.map(team => {
                                    const teamPlayers = players.filter(p => p.team === team.id);
                                    const totalScore = teamPlayers.reduce((sum, p) => sum + p.score, 0);
                                    return { ...team, score: totalScore, playerCount: teamPlayers.length };
                                })
                                .sort((a, b) => b.score - a.score)
                                .map((team, i) => (
                                    <div key={team.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2" style={{animationDelay: `${i*100}ms`}}>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black text-xl ${i===0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i+1}</span>
                                            <span className="text-2xl">{team.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="font-bold uppercase text-sm">{team.name}</span>
                                                <span className="text-[10px] opacity-50 uppercase font-black">{team.playerCount} matroser</span>
                                            </div>
                                        </div>
                                        <span className="font-black font-mono text-xl">{team.score}</span>
                                    </div>
                                ))
                            ) : (
                                [...players].sort((a,b) => b.score - a.score).slice(0, 5).map((p, i) => (
                                    <div key={p.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2" style={{animationDelay: `${i*100}ms`}}>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black text-xl ${i===0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i+1}</span>
                                            <span className="font-bold">{p.nickname}</span>
                                        </div>
                                        <span className="font-black font-mono">{p.score}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={nextQuestion} className="mt-12 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xl tracking-widest hover:scale-105 transition-transform flex items-center gap-3">
                            Neste Spørsmål <ArrowRight size={24} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'result') {
        const isTeamMode = session?.config?.playMode === 'teams';
        
        let displayData: any[] = [];
        if (isTeamMode) {
            displayData = TEAMS.map(team => {
                const teamPlayers = players.filter(p => p.team === team.id);
                const totalScore = teamPlayers.reduce((sum, p) => sum + p.score, 0);
                return { id: team.id, name: team.name, icon: team.icon, score: totalScore };
            }).sort((a, b) => b.score - a.score).slice(0, 3);
        } else {
            displayData = [...players].sort((a,b) => b.score - a.score).slice(0, 3);
        }

        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <Trophy size={120} className="text-yellow-400 mb-8 drop-shadow-[0_0_50px_rgba(250,204,21,0.5)]" />
                <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Gratulerer!</h1>
                <p className="text-xl text-slate-400 font-bold mb-12 uppercase tracking-widest">Toktet er fullført</p>
                
                <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 w-full max-w-4xl h-64 pb-4">
                    {displayData.map((item, i) => {
                        const height = i === 0 ? '100%' : i === 1 ? '70%' : '50%';
                        const color = i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : 'bg-amber-700';
                        const name = isTeamMode ? item.name : item.nickname;
                        const icon = isTeamMode ? item.icon : item.nickname.split(' ')[0];
                        const displayName = isTeamMode ? item.name : item.nickname.split(' ').slice(1).join(' ');

                        return (
                            <div key={item.id} className="flex flex-col items-center justify-end w-1/3 h-full animate-in slide-in-from-bottom duration-700" style={{ animationDelay: `${i * 200}ms` }}>
                                <div className="mb-2 font-black text-xl truncate w-full flex flex-col items-center">
                                    <span className="text-3xl mb-1">{icon}</span>
                                    <span className="uppercase text-xs tracking-widest opacity-80">{displayName}</span>
                                </div>
                                <div className={`w-full ${color} rounded-t-3xl shadow-2xl flex items-end justify-center p-4 text-slate-900 font-black text-2xl`} style={{ height }}>
                                    {item.score}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button onClick={() => setPhase('setup')} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase text-sm tracking-widest transition-all flex items-center gap-2 relative z-10">
                    <RefreshCw size={16} /> Ny Quiz
                </button>
            </div>
        );
    }

    return null;
};

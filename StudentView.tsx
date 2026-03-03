
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './services/storageService';
import { QuizSession } from './types';
import { AVATARS, SEA_NOUNS, TEAMS } from './constants';
import { StudentJoin } from './views/student/StudentJoin';
import { StudentLobby } from './views/student/StudentLobby';
import { StudentGame } from './views/student/StudentGame';
import { StudentMathHunt } from './views/student/StudentMathHunt';
import { StudentResult } from './views/student/StudentResult';
import { Loader2 } from 'lucide-react';

interface StudentViewProps {
    initialPin?: string;
}

const STORAGE_KEY_PLAYER_ID = 'klepplosen_quiz_player_id';
const STORAGE_KEY_SESSION_ID = 'klepplosen_quiz_session_id';

export const StudentView: React.FC<StudentViewProps> = ({ initialPin }) => {
    const [pin, setPin] = useState(initialPin || '');
    const [nickname, setNickname] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0] || '😀');
    const [selectedTeam, setSelectedTeam] = useState<string>('blue');
    const [status, setStatus] = useState<'loading' | 'enter_pin' | 'ready_to_join' | 'enter_name' | 'confirm_join' | 'lobby' | 'game' | 'result' | 'kicked' | 'select_team'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<QuizSession | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [playerStreak, setPlayerStreak] = useState(0);
    const [playerRank, setPlayerRank] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [isOnline, setIsOnline] = useState(true);
    
    // Intro / Tutorial State
    const [showIntro, setShowIntro] = useState(false);
    const [introSeen, setIntroSeen] = useState(false);

    const subscriptionRef = useRef<any>(null);
    const pollIntervalRef = useRef<any>(null);

    const generateSeaName = () => {
        const adj = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        const noun = SEA_NOUNS[Math.floor(Math.random() * SEA_NOUNS.length)];
        setNickname(`${adj} ${noun}`);
    };

    const clearStorageAndReset = () => {
        localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
        localStorage.removeItem(STORAGE_KEY_SESSION_ID);
        setPlayerId(null);
        setSession(null);
        setNickname('');
        setPlayerScore(0);
        setPlayerStreak(0);
        setStatus('enter_pin');
        setShowIntro(false);
        setIntroSeen(false);
    };

    const fetchMyScore = useCallback(async (pId: string) => {
        const sId = session?.id || localStorage.getItem(STORAGE_KEY_SESSION_ID);
        if (!sId) return;
        
        try {
            const { data: allPlayers, error } = await supabase.from('quiz_players').select('id, score, streak').eq('session_id', sId);
            
            if (error) {
                console.warn("Error fetching score:", error);
                return;
            }

            if (allPlayers) {
                const sorted = [...allPlayers].sort((a,b) => b.score - a.score);
                const myIndex = sorted.findIndex(p => p.id === pId);
                if (myIndex !== -1) {
                    const myData = sorted[myIndex];
                    setPlayerScore(myData.score);
                    setPlayerStreak(myData.streak);
                    setPlayerRank(myIndex + 1);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch score", e);
        }
    }, [session?.id]);

    const syncUIToSessionStatus = useCallback((sessStatus: string, qIndex: number) => {
        if (sessStatus === 'active') {
            setStatus('game');
            setHasAnswered(false);
            setAnswerCorrect(null);
            setQuestionStartTime(Date.now());
        } else if (sessStatus === 'reveal' || sessStatus === 'scoreboard' || sessStatus === 'finished' || sessStatus === 'reflection') {
            setStatus('result');
            if (playerId) fetchMyScore(playerId);
        } else if (sessStatus === 'lobby') {
            if (playerId) {
                setStatus('lobby');
            }
        }
    }, [playerId, fetchMyScore]);

    useEffect(() => {
        if (session?.status === 'active' && !introSeen && status === 'game') {
            setShowIntro(true);
            setIntroSeen(true);
        }
    }, [session?.status, status, introSeen]);

    // Robust Polling and Sync
    const handleSyncStatus = async () => {
        const sId = session?.id || localStorage.getItem(STORAGE_KEY_SESSION_ID);
        if (!sId) return;

        try {
            const { data, error } = await supabase.from('quiz_sessions').select('*').eq('id', sId).maybeSingle();
            if (data && !error) {
                setIsOnline(true);
                const updatedSession: QuizSession = {
                    id: data.id,
                    pin: data.pin_code,
                    status: data.status,
                    currentQuestionIndex: data.current_question_index,
                    questions: data.quiz_data,
                    players: [],
                    config: data.config
                };
                
                // Update local state if server state is different (Question change or status change)
                if (session?.status !== updatedSession.status || session?.currentQuestionIndex !== updatedSession.currentQuestionIndex) {
                    setSession(updatedSession);
                    // Explicitly reset answered state if new question index
                    if (session?.currentQuestionIndex !== updatedSession.currentQuestionIndex) {
                        setHasAnswered(false);
                    }
                    syncUIToSessionStatus(updatedSession.status, updatedSession.currentQuestionIndex);
                }
            } else if (error) {
                console.warn("Sync error:", error);
                setIsOnline(false);
            }
        } catch (e) {
            console.warn("Connection failed:", e);
            setIsOnline(false);
        }
    };

    const subscribeToSession = (sessId: string) => {
        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
        }
        
        const channel = supabase.channel(`session_status_${sessId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'quiz_sessions', 
                filter: `id=eq.${sessId}` 
            }, (payload) => {
                const newSess = payload.new as any;
                setSession(prev => {
                    if (!prev) return null;
                    return { 
                        ...prev, 
                        status: newSess.status, 
                        currentQuestionIndex: newSess.current_question_index 
                    };
                });
                syncUIToSessionStatus(newSess.status, newSess.current_question_index);
            })
            .subscribe((status) => {
                setIsOnline(status === 'SUBSCRIBED');
            });

        subscriptionRef.current = channel;
        
        // Setup Polling Fallback (Crucial for schools with blocked websockets)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(handleSyncStatus, 2000); // Check every 2s
    };

    useEffect(() => {
        const validateAndJoin = async () => {
            const savedPlayerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
            const savedSessionId = localStorage.getItem(STORAGE_KEY_SESSION_ID);

            if (initialPin) {
                handleJoinSession(initialPin);
                return;
            }

            if (savedPlayerId && savedSessionId) {
                try {
                    const { data: sessData } = await supabase.from('quiz_sessions').select('*').eq('id', savedSessionId).maybeSingle();
                    if (sessData && sessData.status !== 'finished') {
                        const { data: pData } = await supabase.from('quiz_players').select('*').eq('id', savedPlayerId).maybeSingle();
                        if (pData) {
                            restoreSession(sessData, pData);
                        } else {
                            clearStorageAndReset();
                        }
                    } else {
                        clearStorageAndReset();
                    }
                } catch (e) {
                    setStatus('enter_pin');
                }
            } else {
                setStatus('enter_pin');
            }
        };

        validateAndJoin();

        return () => {
            if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPin]);

    const restoreSession = (sessData: any, pData: any) => {
        const restoredSess: QuizSession = {
            id: sessData.id,
            pin: sessData.pin_code,
            status: sessData.status,
            currentQuestionIndex: sessData.current_question_index,
            questions: sessData.quiz_data,
            players: [],
            config: sessData.config
        };
        setSession(restoredSess);
        setPlayerId(pData.id);
        setPlayerScore(pData.score);
        setPlayerStreak(pData.streak);
        setSelectedTeam(pData.team);
        
        const nameParts = pData.nickname.split(' ');
        if (nameParts.length > 1) {
            setSelectedAvatar(nameParts[0]);
            setNickname(nameParts.slice(1).join(' '));
        } else {
            setNickname(pData.nickname);
        }

        subscribeToSession(sessData.id);
        
        // If restoring in middle of question, check if we answered
        if (sessData.current_question_index === pData.answer_for_index) {
            setHasAnswered(true);
            // Check correctness based on stored last answer text matching option
            const currentQ = sessData.quiz_data[sessData.current_question_index];
            const correctOpt = currentQ.options[currentQ.correctIndex];
            setAnswerCorrect(pData.last_answer === correctOpt);
        }

        syncUIToSessionStatus(sessData.status, sessData.current_question_index);
    };

    const handleJoinSession = async (targetPin?: string) => {
        const pinToUse = targetPin || pin;
        if (!pinToUse || pinToUse.length < 4) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('quiz_sessions').select('*').eq('pin_code', pinToUse).neq('status', 'finished').maybeSingle();
            if (data && !error) {
                setSession({ id: data.id, pin: data.pin_code, status: data.status, currentQuestionIndex: data.current_question_index, questions: data.quiz_data, players: [], config: data.config });
                setPin(data.pin_code);
                setStatus('ready_to_join');
            } else {
                setError("Fant ingen aktiv quiz med denne koden.");
                setStatus('enter_pin');
            }
        } catch (e) {
            setError("Tilkoblingsfeil mot databasen.");
            setStatus('enter_pin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmJoin = async () => {
        if (!session) return;
        setStatus('enter_name');
        if (session.config?.seaNames) generateSeaName();
    };

    const handleRegisterPlayer = async (teamOverride?: string) => {
        if (isLoading || !nickname.trim() || !session || !session.id) return;
        
        setIsLoading(true);
        setError(null);
        
        let finalTeam = teamOverride || selectedTeam;
        
        try {
            if (session.config?.playMode === 'teams' && session.config?.autoTeams && !teamOverride) {
                const { data: currentPlayers } = await supabase.from('quiz_players').select('team').eq('session_id', session.id);
                const counts = TEAMS.map(t => ({ id: t.id, count: currentPlayers?.filter(p => p.team === t.id).length || 0 }));
                finalTeam = counts.sort((a,b) => a.count - b.count)[0].id as any;
            } else if (session.config?.playMode === 'classic') {
                finalTeam = 'individual';
            }

            const fullName = `${selectedAvatar} ${nickname.trim()}`;
            
            const { data, error: insertError } = await supabase.from('quiz_players').insert({ 
                session_id: session.id, 
                nickname: fullName, 
                score: 0, 
                streak: 0, 
                team: finalTeam 
            }).select().single();

            if (insertError) throw insertError;

            if (data) {
                setPlayerId(data.id);
                setSelectedTeam(finalTeam);
                localStorage.setItem(STORAGE_KEY_PLAYER_ID, data.id);
                localStorage.setItem(STORAGE_KEY_SESSION_ID, session.id);
                
                subscribeToSession(session.id);
                setStatus('lobby');
            }
        } catch (err: any) {
            console.error("Registreringsfeil:", err);
            setError("Kunne ikke mønstre på. Prøv igjen.");
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async (answerIndex: number) => {
        if (hasAnswered || !session || !playerId) return;
        setHasAnswered(true);
        
        const currentQ = session.questions[session.currentQuestionIndex];
        const isCorrect = currentQ.correctIndex === answerIndex;
        setAnswerCorrect(isCorrect);
        
        let newScore = playerScore;
        const newStreak = isCorrect ? playerStreak + 1 : 0;

        if (isCorrect) {
            const totalTime = currentQ.timeLimit || 30;
            const timeElapsed = (Date.now() - questionStartTime) / 1000;
            const speedFactor = Math.max(0.1, (totalTime - timeElapsed) / totalTime);
            newScore += Math.round(1000 * speedFactor) + (newStreak * 100);
        }

        setPlayerScore(newScore);
        setPlayerStreak(newStreak);
        
        await supabase.from('quiz_players').update({ 
            score: newScore, 
            streak: newStreak, 
            last_answer: currentQ.options[answerIndex],
            answer_for_index: session.currentQuestionIndex
        }).eq('id', playerId);
    };

    const handlePreRegister = () => {
        if (isLoading) return;
        if (session?.config?.playMode === 'teams' && !session?.config?.autoTeams) {
            setStatus('select_team');
        } else {
            handleRegisterPlayer();
        }
    };

    // --- VIEW RENDERING ---

    if (status === 'loading') {
        return <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center"><Loader2 className="animate-spin w-12 h-12 flex-shrink-0" /><p className="mt-4 font-black uppercase tracking-widest text-xs">Mønstrer på...</p></div>;
    }

    if (['enter_pin', 'ready_to_join', 'enter_name', 'select_team'].includes(status)) {
        return (
            <StudentJoin 
                status={status as any}
                pin={pin}
                setPin={setPin}
                nickname={nickname}
                setNickname={setNickname}
                avatar={selectedAvatar}
                setAvatar={setSelectedAvatar}
                selectedTeam={selectedTeam}
                setSelectedTeam={setSelectedTeam}
                onJoin={() => handleJoinSession()}
                onConfirmJoin={handleConfirmJoin}
                onRegister={() => handleRegisterPlayer()}
                onPreRegister={handlePreRegister}
                onGenerateName={generateSeaName}
                onBack={() => setStatus('enter_pin')}
                isLoading={isLoading}
                error={error}
                sessionPin={session?.pin}
                useSeaNames={session?.config?.seaNames}
            />
        );
    }

    if (status === 'lobby') {
        return (
            <StudentLobby 
                avatar={selectedAvatar}
                nickname={nickname}
                team={selectedTeam}
                isOnline={isOnline}
                onSync={handleSyncStatus}
                onLogout={clearStorageAndReset}
            />
        );
    }

    if (status === 'game' && session) {
        if (session.config?.playMode === 'math_hunt') {
            return (
                <StudentMathHunt
                    session={session}
                    playerId={playerId!}
                    playerScore={playerScore}
                    playerStreak={playerStreak}
                    avatar={selectedAvatar}
                    nickname={nickname}
                    onSync={handleSyncStatus}
                />
            );
        }

        return (
            <StudentGame 
                session={session}
                playerScore={playerScore}
                playerRank={playerRank}
                hasAnswered={hasAnswered}
                submitAnswer={submitAnswer}
                showIntro={showIntro}
                setShowIntro={setShowIntro}
                avatar={selectedAvatar}
                nickname={nickname}
                team={selectedTeam}
            />
        );
    }

    if (status === 'result') {
        if (session?.config?.playMode === 'math_hunt') {
            return (
                <StudentMathHunt
                    session={session}
                    playerId={playerId!}
                    playerScore={playerScore}
                    playerStreak={playerStreak}
                    avatar={selectedAvatar}
                    nickname={nickname}
                    onSync={handleSyncStatus}
                />
            );
        }

        return (
            <StudentResult 
                answerCorrect={answerCorrect}
                playerScore={playerScore}
                playerStreak={playerStreak}
                playerRank={playerRank}
                explanation={session?.questions[session.currentQuestionIndex]?.explanation}
                onSync={handleSyncStatus}
                sessionStatus={session?.status}
            />
        );
    }

    return null;
};

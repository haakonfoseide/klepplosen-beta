import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase, storageService } from "../services/storageService";
import { generateQuizQuestions } from "../services/geminiService";
import { QuizQuestion, QuizSession, QuizPlayer, SavedPlan } from "../types";
import { COMMON_SUBJECTS, GRADES } from "../constants";
import { useToast } from "../contexts/ToastContext";

import { QuizSetup } from "./quiz/QuizSetup";
import { QuizLobby } from "./quiz/QuizLobby";
import { QuizActive } from "./quiz/QuizActive";
import { QuizResults } from "./quiz/QuizResults";

interface QuizGameProps {
  t: any;
  language: string;
  currentUser?: any;
  isOwner?: boolean;
  initialData?: any;
  currentPlanId?: string;
  isShared?: boolean;
}

export const QuizGame: React.FC<QuizGameProps> = ({
  t,
  language,
  currentUser,
  isOwner = true,
  initialData,
  currentPlanId,
  isShared = false,
}) => {
  const { addToast } = useToast();

  // Phases: setup (AI gen), lobby (PIN/Players), game (Active question), result (Leaderboard)
  const [phase, setPhase] = useState<"setup" | "lobby" | "game" | "result">(
    "setup",
  );
  const [isLoading, setIsLoading] = useState(false);

  // Setup State
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[5]);
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState(5);
  const [gameMode, setGameMode] = useState<"classic" | "teams">("classic");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Load Saved State
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedPlan[]>([]);

  // Session State
  const [session, setSession] = useState<QuizSession | null>(null);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState<
    "question" | "reveal" | "scoreboard" | "reflection"
  >("question");
  const [showLiveLeaderboard, setShowLiveLeaderboard] = useState(true);
  const [answersCount, setAnswersCount] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);
  const [tempQuestion, setTempQuestion] = useState<QuizQuestion | null>(null);

  const timerRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

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
      if (subscriptionRef.current)
        supabase.removeChannel(subscriptionRef.current);
    };
  }, []);

  const fetchPlayers = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("quiz_players")
      .select("*")
      .eq("session_id", sessionId);
    if (data) {
      setPlayers(data as QuizPlayer[]);
    }
  }, []);

  const subscribeToPlayers = useCallback(
    (sessionId: string) => {
      if (subscriptionRef.current)
        supabase.removeChannel(subscriptionRef.current);

      const channel = supabase
        .channel(`quiz_lobby_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "quiz_players",
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            fetchPlayers(sessionId);
          },
        )
        .subscribe();

      subscriptionRef.current = channel;
      fetchPlayers(sessionId);
    },
    [fetchPlayers],
  );

  // --- SETUP LOGIC ---
  const handleGenerate = async () => {
    setIsLoading(true);
    setSaveStatus("idle");
    try {
      const qs = await generateQuizQuestions(
        subject,
        grade,
        topic,
        language,
        amount,
      );
      setQuestions(qs);
      addToast("Quiz generert!", "success");
    } catch (e) {
      addToast("Kunne ikke generere quiz.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSavedQuizzes = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const plans = await storageService.getMyPlans(currentUser.id);
      const quizzes = plans.filter(
        (p) => p.task.planType === "quiz" || p.task.toolType === "quiz",
      );
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
    setSaveStatus("saving");

    try {
      const planToSave: SavedPlan = {
        id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(),
        task: {
          title: `Quiz: ${topic || subject}`,
          description: `Quiz med ${questions.length} spørsmål om ${topic}.`,
          questions: questions,
          clStructureId: "tool",
          planType: "quiz",
          toolType: "quiz",
          subject,
          grade,
          topic,
        } as any,
        subject,
        grade,
        topic: topic || "Quiz",
        date: new Date().toLocaleDateString("no-NO"),
        creator: currentUser.name,
        creatorId: currentUser.id,
        isShared: isShared,
        isImported: false,
        likes: 0,
        likedBy: [],
      };

      await storageService.savePlan(planToSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  };

  const handleCreateSession = async () => {
    setIsLoading(true);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({
          pin_code: pin,
          status: "lobby",
          current_question_index: 0,
          quiz_data: questions,
          config: {
            playMode: gameMode,
            seaNames: true,
            autoTeams: true,
          },
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSession({
          ...data,
          id: data.id,
          pin: data.pin_code,
          status: "lobby",
          currentQuestionIndex: 0,
          questions: questions,
          players: [],
          config: data.config,
        });
        setPhase("lobby");
        subscribeToPlayers(data.id);
        addToast("Lobby opprettet!", "success");
      }
    } catch (e: any) {
      addToast("Feil ved opprettelse: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    try {
      await supabase.from("quiz_players").delete().eq("id", playerId);
      addToast("Spiller fjernet", "info");
      if (session) fetchPlayers(session.id);
    } catch (e) {
      addToast("Kunne ikke fjerne spiller", "error");
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
      addToast("Spørsmål oppdatert", "success");
    }
  };

  const updateSessionStatus = useCallback(
    async (status: string, qIndex: number) => {
      if (!session) return;
      await supabase
        .from("quiz_sessions")
        .update({ status, current_question_index: qIndex })
        .eq("id", session.id);
    },
    [session],
  );

  const handleTimeUp = useCallback(async () => {
    // Move to REVEAL phase (show correct answer + explanation)
    setGameStatus("reveal");
    await updateSessionStatus("reveal", currentQuestionIndex);
  }, [currentQuestionIndex, updateSessionStatus]);

  const finishGame = useCallback(async () => {
    setPhase("result");
    await updateSessionStatus("finished", currentQuestionIndex);
    if (session) fetchPlayers(session.id); // Final scores
  }, [currentQuestionIndex, session, updateSessionStatus, fetchPlayers]);

  const startQuestion = useCallback(
    async (index: number) => {
      if (!session) return;

      // 1. Reset state
      setCurrentQuestionIndex(index);
      setGameStatus("question");
      setAnswersCount(0);

      // 2. Set Time
      const q = questions[index];
      setTimeLeft(q.timeLimit || 30);

      // 3. Reset player answer status in DB for this question
      await supabase
        .from("quiz_players")
        .update({
          last_answer: null,
          answer_for_index: -1,
        })
        .eq("session_id", session.id);

      // 4. Update DB to trigger clients
      await updateSessionStatus("active", index);

      // 5. Start Timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [questions, session, updateSessionStatus, handleTimeUp],
  );

  useEffect(() => {
    if (session && phase === "game") {
      const answered = players.filter(
        (p) => p.answer_for_index === currentQuestionIndex,
      ).length;
      setAnswersCount(answered);

      // Auto-reveal if all answered (and more than 0 players)
      if (
        players.length > 0 &&
        answered >= players.length &&
        gameStatus === "question"
      ) {
        handleTimeUp();
      }
    }
  }, [players, session, gameStatus, currentQuestionIndex, phase, handleTimeUp]);

  // --- GAME CONTROL LOGIC ---
  const startGame = async () => {
    if (!session) return;
    setPhase("game");
    startQuestion(0);
  };

  const goToReflection = async () => {
    setGameStatus("reflection");
    await updateSessionStatus("reflection", currentQuestionIndex);
  };

  const goToScoreboard = async () => {
    // Move to SCOREBOARD phase
    if (session) fetchPlayers(session.id); // Ensure latest scores
    setGameStatus("scoreboard");
    await updateSessionStatus("scoreboard", currentQuestionIndex);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      startQuestion(currentQuestionIndex + 1);
    } else {
      finishGame();
    }
  };

  // --- RENDERERS ---

  if (phase === "setup") {
    return (
      <QuizSetup
        subject={subject}
        setSubject={setSubject}
        grade={grade}
        setGrade={setGrade}
        topic={topic}
        setTopic={setTopic}
        gameMode={gameMode}
        setGameMode={setGameMode}
        isLoading={isLoading}
        handleGenerate={handleGenerate}
        currentUser={currentUser}
        handleFetchSavedQuizzes={handleFetchSavedQuizzes}
        questions={questions}
        setQuestions={setQuestions}
        handleCreateSession={handleCreateSession}
        saveStatus={saveStatus}
        handleSaveToArchive={handleSaveToArchive}
        editingQuestionIndex={editingQuestionIndex}
        setEditingQuestionIndex={setEditingQuestionIndex}
        tempQuestion={tempQuestion}
        setTempQuestion={setTempQuestion}
        saveEditedQuestion={saveEditedQuestion}
        showLoadModal={showLoadModal}
        setShowLoadModal={setShowLoadModal}
        savedQuizzes={savedQuizzes}
        handleLoadQuiz={handleLoadQuiz}
        isOwner={isOwner}
      />
    );
  }

  if (phase === "lobby") {
    return (
      <QuizLobby
        session={session}
        players={players}
        handleStartGame={startGame}
        handleKickPlayer={handleKickPlayer}
        topic={topic}
        grade={grade}
      />
    );
  }

  if (phase === "game") {
    return (
      <QuizActive
        session={session}
        players={players}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
        gameStatus={gameStatus}
        timeLeft={timeLeft}
        answersCount={answersCount}
        showLiveLeaderboard={showLiveLeaderboard}
        setShowLiveLeaderboard={setShowLiveLeaderboard}
        handleTimeUp={handleTimeUp}
        nextQuestion={nextQuestion}
        goToScoreboard={goToScoreboard}
        goToReflection={goToReflection}
        finishGame={finishGame}
        t={t}
      />
    );
  }

  if (phase === "result") {
    return (
      <QuizResults session={session} players={players} setPhase={setPhase} />
    );
  }

  return null;
};

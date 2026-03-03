
export type LanguageForm = 'bokmål' | 'nynorsk';

export interface Subject {
    subject: string;
    code: string | null;
    isVisible: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    role: 'admin' | 'user';
    createdAt: string;
    lastActive?: string;
}

export interface CLStructure {
    id: string;
    name: string;
    description: string;
    category: 'samtale' | 'repetisjon' | 'kunnskap' | 'produksjon' | 'teambygging' | 'annet';
    setupTime: string;
    groupSize: string;
    durationMinutes: number;
    steps: string[];
    studentInstructions: string[];
    tips: string[];
    bestFor: string[];
    subjects: string[];
    popularity?: number;
    illustrationType?: string;
    translations?: Record<string, any>;
}

export interface OracyResource {
    id: string;
    category: string;
    type: string;
    content: any;
}

export interface CompetenceAim {
    id: string;
    text: string;
    category?: string;
}

export interface DbCompetenceAimSet {
    subject: string;
    grade: string;
    aims: string[];
    code?: string;
}

export interface GeneratedTask {
    title: string;
    description: string;
    learningGoals: string[];
    studentTask: string[] | string;
    teacherTips: string[];
    studentMaterials: string[];
    clStructureId?: string;
    planType?: 'plan' | 'tool' | 'project' | 'quiz' | 'lesson_study';
    toolType?: string;
    
    // Optional fields for various tool types
    worksheetQuestions?: string[];
    printableMaterial?: any;
    assessmentRubric?: AssessmentRubricRow[];
    oracyTips?: string[];
    differentiatedTasks?: { low: string, medium: string, high: string };
    answerKey?: string[];
    instructions?: string[];
    
    // Project specific
    productRequirements?: string[];
    
    // Quiz specific
    questions?: QuizQuestion[];
    
    // Lesson Study
    lessonStudy?: LessonStudyData;
}

export interface AssessmentRubricRow {
    criteria: string;
    low: string;
    medium: string;
    high: string;
    area?: string; // For Oracy assessment
}

export interface SavedPlan {
    id: string;
    task: GeneratedTask;
    subject: string;
    grade: string;
    topic: string;
    date: string;
    creator: string;
    creatorId: string;
    isShared: boolean;
    isImported: boolean;
    likes: number;
    likedBy: string[];
}

export interface ObservationTarget {
    id: string;
    name: string;
    type: 'student' | 'group';
    notes: string;
}

export interface LessonStudySession {
    id: string;
    name: string;
    targets: ObservationTarget[];
    generalNotes: string;
    timeLog: { time: string, step: string, predicted: string, observed: string }[];
    images: { data: string, mimeType: string, caption?: string }[];
    checklist: { item: string, count: number }[];
}

export interface LessonStudyData {
    step: number;
    subject?: string;
    grade?: string;
    topic?: string;
    researchQuestion: string;
    researchNotes?: string;
    researchLinks?: { title: string, url: string }[]; 
    gapAnalysis: {
        currentSituation: string;
        desiredSituation: string;
        gap: string;
        teacherLearningGoal: string;
        studentLearningGoal: string;
    };
    planning: {
        lessonName: string;
        description: string;
        curriculumLinks: string;
        prediction: string; 
    };
    observation: {
        // Legacy fields for backward compatibility
        focusStudent1?: string;
        focusStudent2?: string;
        focusStudent3?: string;
        generalNotes?: string;
        timeLog?: { time: string, step: string, predicted: string, observed: string }[];
        images?: { data: string, mimeType: string, caption?: string }[];
        observationChecklist?: { item: string, count: number }[];
        
        // New multi-session structure
        sessions: LessonStudySession[];
    };
    reflection: {
        significantFindings: string;
        studentQuotes: string;
        ethicalDilemmas: string;
        practiceChanges: string;
        interviewQuestions?: string[];
        interviewNotes?: string;
    };
}

export interface AppState {
    languageForm: LanguageForm;
    subject: string;
    grade: string;
    topic: string;
    uploadedImages: { data: string, mimeType: string, name?: string }[];
    aims: CompetenceAim[];
    selectedAims: CompetenceAim[];
    recommendedStructureIds: string[];
    recommendationReasons: Record<string, string>;
    isFetchingRecommendations: boolean;
    selectedStructureId: string | null;
    generatedTask: GeneratedTask | null;
    generatingTask: boolean;
    fetchingAims: boolean;
    currentPlanId: string | null;
    currentPlanOwnerId: string | null;
    isViewingArchived: boolean;
    activeToolId: string | null;
    options: {
        generateWorksheet: boolean;
        worksheetAmount: number;
        generateRubric: boolean;
        rubricCriteria: number;
        includeOracy: boolean;
        learningGoalsAmount: number;
        differentiationLevel: 'support' | 'standard' | 'challenge';
        differentiatedTasks?: boolean;
        oracyDomains?: string[];
        oracyOptions?: { starters?: boolean, terms?: boolean, rules?: boolean };
    };
}

export interface SystemStats {
    totalVisits: number;
    totalUsers: number;
    totalPlans: number;
    visitsToday: number;
    activeNow: number;
    recentLogs: any[];
    trafficGraph: { date: string, count: number }[];
}

export interface Class {
    id: string;
    userId: string;
    name: string;
    grade: string;
    subject: string;
    studentCount: number;
}

export interface Student {
    id: string;
    classId?: string;
    name: string;
    gender: 'M' | 'F' | 'X';
    needsFocus: boolean;
}

// Oracy constants types
export interface OracySentenceStarter {
    category: string;
    examples: string[];
}

export interface OracyTeacherStrategy {
    title: string;
    description: string;
    icon: string;
}

// Seilasplan types
export interface TimeSlot {
    id: string;
    label: string;
    start: string;
    end: string;
}

export interface CalendarEvent {
    id: string;
    day: 'Mandag' | 'Tirsdag' | 'Onsdag' | 'Torsdag' | 'Fredag';
    slotId: string;
    type: 'lesson' | 'meeting' | 'duty' | 'admin';
    subject?: string;
    title: string;
    topic?: string;
    room?: string;
    resources?: string[];
    notes?: string;
    isDone: boolean;
    linkedPlanId?: string;
    clStructureId?: string;
}

export interface AnnualPlanItem {
    week: number;
    topic: string;
    subject: string;
}

export interface DayMemo {
    id: string;
    week: number;
    day: string;
    text: string;
}

// Quiz Types
export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    timeLimit?: number;
    type?: 'multiple-choice' | 'true-false';
    image?: string;
}

export interface QuizSession {
    id: string;
    pin: string;
    status: 'lobby' | 'active' | 'reveal' | 'scoreboard' | 'finished';
    currentQuestionIndex: number;
    questions: QuizQuestion[];
    players: QuizPlayer[];
    config?: {
        playMode?: 'classic' | 'teams';
        seaNames?: boolean;
        autoTeams?: boolean;
    };
}

export interface QuizPlayer {
    id: string;
    nickname: string;
    score: number;
    streak: number;
    team: string; // 'red', 'blue', 'green', 'yellow' or 'individual'
    last_answer?: string;
    answer_for_index?: number;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

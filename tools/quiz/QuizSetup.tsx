import React from 'react';
import { Settings, FolderOpen, Trophy, Users, Loader2, Sparkles, Save, Check, Edit3, Trash2 } from 'lucide-react';
import { COMMON_SUBJECTS, GRADES } from '../../constants';
import { QuizQuestion } from '../../types';

interface QuizSetupProps {
    subject: string;
    setSubject: (s: string) => void;
    grade: string;
    setGrade: (g: string) => void;
    topic: string;
    setTopic: (t: string) => void;
    gameMode: 'classic' | 'teams';
    setGameMode: (m: 'classic' | 'teams') => void;
    isLoading: boolean;
    handleGenerate: () => void;
    currentUser: any;
    handleFetchSavedQuizzes: () => void;
    questions: QuizQuestion[];
    setQuestions: (q: QuizQuestion[]) => void;
    handleCreateSession: () => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    handleSaveToArchive: () => void;
    editingQuestionIndex: number | null;
    setEditingQuestionIndex: (i: number | null) => void;
    tempQuestion: QuizQuestion | null;
    setTempQuestion: (q: QuizQuestion | null) => void;
    saveEditedQuestion: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({
    subject, setSubject, grade, setGrade, topic, setTopic, gameMode, setGameMode,
    isLoading, handleGenerate, currentUser, handleFetchSavedQuizzes,
    questions, setQuestions, handleCreateSession, saveStatus, handleSaveToArchive,
    editingQuestionIndex, setEditingQuestionIndex, tempQuestion, setTempQuestion, saveEditedQuestion
}) => {
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
                                    disabled={saveStatus !== 'idle'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                        saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                        saveStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        'bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200'
                                    }`}
                                >
                                    {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : 
                                     saveStatus === 'saved' ? <Check size={14} /> : 
                                     <Save size={14} />}
                                    {saveStatus === 'saving' ? 'Lagrer...' : saveStatus === 'saved' ? 'Lagret!' : 'Lagre i arkiv'}
                                </button>
                            )}
                            <button onClick={handleCreateSession} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                                {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Trophy size={16}/>} Start Spill
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {questions.map((q, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                                {editingQuestionIndex === i ? (
                                    <div className="space-y-4">
                                        <input 
                                            value={tempQuestion?.q || ''} 
                                            onChange={e => setTempQuestion({...tempQuestion!, q: e.target.value})}
                                            className="w-full p-3 border-2 border-purple-100 rounded-xl font-bold text-slate-800"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            {tempQuestion?.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name={`correct-${i}`} 
                                                        checked={tempQuestion.a === oIdx}
                                                        onChange={() => setTempQuestion({...tempQuestion, a: oIdx})}
                                                        className="w-5 h-5 text-purple-600"
                                                    />
                                                    <input 
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...tempQuestion.options];
                                                            newOpts[oIdx] = e.target.value;
                                                            setTempQuestion({...tempQuestion, options: newOpts});
                                                        }}
                                                        className={`w-full p-2 border-2 rounded-xl text-sm font-bold ${tempQuestion.a === oIdx ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100'}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button onClick={() => setEditingQuestionIndex(null)} className="px-4 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl">Avbryt</button>
                                            <button onClick={saveEditedQuestion} className="px-4 py-2 bg-purple-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-purple-700">Lagre</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingQuestionIndex(i)} className="p-2 bg-slate-100 text-slate-500 hover:text-purple-600 rounded-xl transition-colors"><Edit3 size={16} /></button>
                                            <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="p-2 bg-slate-100 text-slate-500 hover:text-red-600 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                        <h4 className="font-black text-lg text-slate-800 mb-4 pr-20">{q.q}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-3 rounded-xl text-sm font-bold border-2 ${q.a === oIdx ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-100 text-slate-500'}`}>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

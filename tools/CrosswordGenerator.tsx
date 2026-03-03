import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { generateCrosswordData, generateCrosswordWordList } from '../services/geminiService';
import { COMMON_SUBJECTS } from '../constants';
import { Printer, RefreshCw, Grid3X3, Type, ArrowRight, Check, Plus, Trash2, List, Save, Copy, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SavedPlan, GeneratedTask } from '../types';
import { useToast } from '../contexts/ToastContext';

interface CrosswordGeneratorProps {
    language?: string;
    t: any;
    currentUser?: any;
    isOwner?: boolean;
    initialData?: any;
    currentPlanId?: string;
    isShared?: boolean;
}

export const CrosswordGenerator: React.FC<CrosswordGeneratorProps> = ({ 
    language = 'no', 
    t,
    currentUser,
    isOwner = true,
    initialData,
    currentPlanId,
    isShared = false
}) => {
    const [step, setStep] = useState<'config' | 'words' | 'loading' | 'result'>('config');
    const [subject, setSubject] = useState(initialData?.subject || COMMON_SUBJECTS[0]);
    const [topic, setTopic] = useState(initialData?.topic || '');
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Medium');
    const [gridSize, setGridSize] = useState(initialData?.gridSize || 15);
    const [gameType, setGameType] = useState<'crossword' | 'wordsearch' | 'both'>(initialData?.gameType || 'both');
    const [gameData, setGameData] = useState<any>(initialData || null);
    const [activeTab, setActiveTab] = useState<'wordsearch' | 'crossword'>(initialData?.gameType === 'crossword' ? 'crossword' : 'wordsearch');
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [crosswordAnswers, setCrosswordAnswers] = useState<Record<number, string>>({});
    const [wordList, setWordList] = useState<{word: string, definition: string}[]>(initialData?.wordList || []);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isGenerating = step === 'loading';
    const { addToast } = useToast();

    React.useEffect(() => {
        if (initialData) {
            setGameData(initialData);
            setSubject(initialData.subject || COMMON_SUBJECTS[0]);
            setTopic(initialData.topic || '');
            setDifficulty(initialData.difficulty || 'Medium');
            setGridSize(initialData.gridSize || 15);
            setGameType(initialData.gameType || 'both');
            setWordList(initialData.wordList || []);
            setActiveTab(initialData.gameType === 'crossword' ? 'crossword' : 'wordsearch');
            setStep('result');
        }
    }, [initialData]);

    const handleGenerateWordList = async () => {
        if (!topic.trim()) return;
        setStep('loading');
        try {
            const list = await generateCrosswordWordList(subject, topic, difficulty, language);
            setWordList(list);
            setStep('words');
        } catch (err) {
            setStep('config');
            addToast("Kunne ikke generere ordliste. Prøv igjen.", 'error');
        }
    };

    const handleCreateBlank = () => {
        setWordList([]);
        setStep('words');
    };

    const handleSaveToArchive = async () => {
        if (!currentUser || !gameData) return;
        setSaveStatus('saving');
        try {
            const planToSave: SavedPlan = {
                id: isOwner && currentPlanId ? currentPlanId : crypto.randomUUID(),
                task: {
                    ...gameData,
                    title: `Kryssord/Ordleter: ${topic || subject}`,
                    clStructureId: 'tool',
                    planType: 'tool',
                    toolType: 'crossword',
                    subject,
                    grade: difficulty, // Using difficulty as grade for consistency
                    topic: topic || '',
                    wordList,
                    gridSize,
                    gameType,
                    difficulty
                } as GeneratedTask,
                subject,
                grade: difficulty,
                topic: topic || '',
                date: new Date().toLocaleDateString('no-NO'),
                creator: currentUser.name,
                creatorId: currentUser.id,
                isShared: isShared,
                isImported: false,
                likes: 0,
                likedBy: []
            };
            await storageService.savePlan(planToSave as any);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            setSaveStatus('error');
        }
    };

    const handleGenerateGame = async () => {
        setStep('loading');
        setSelectedCells(new Set());
        setCrosswordAnswers({});
        try {
            const data = await generateCrosswordData(subject, topic, difficulty, gridSize, language, gameType, wordList);
            if (data) {
                setGameData(data);
                setStep('result');
                if (gameType === 'crossword' || (!data.wordsearchGrid && data.crossword)) {
                    setActiveTab('crossword');
                } else {
                    setActiveTab('wordsearch');
                }
            } else {
                setStep('words');
                addToast("Kunne ikke generere spilldata. Prøv igjen.", 'error');
            }
        } catch (err) {
            setStep('words');
            addToast("En feil oppstod under generering. Prøv igjen.", 'error');
        }
    };

    const addWord = () => {
        setWordList([...wordList, { word: '', definition: '' }]);
    };

    const removeWord = (index: number) => {
        setWordList(wordList.filter((_, i) => i !== index));
    };

    const updateWord = (index: number, field: 'word' | 'definition', value: string) => {
        const newList = [...wordList];
        newList[index][field] = value;
        setWordList(newList);
    };

    const toggleCell = (r: number, c: number) => {
        const key = `${r}-${c}`;
        const newSelected = new Set(selectedCells);
        if (newSelected.has(key)) newSelected.delete(key);
        else newSelected.add(key);
        setSelectedCells(newSelected);
    };

    const handleCrosswordInput = (idx: number, val: string) => {
        setCrosswordAnswers(prev => ({ ...prev, [idx]: val.toUpperCase() }));
    };

    const handlePrint = () => {
        window.print();
    };

    const renderCrosswordGrid = () => {
        if (!gameData?.crossword || gameData.crossword.length === 0) return null;

        let maxRow = 0;
        let maxCol = 0;
        let hasValidCoords = false;
        
        gameData.crossword.forEach((item: any) => {
            const row = parseInt(item.row);
            const col = parseInt(item.col);
            if (!isNaN(row) && !isNaN(col) && row >= 0 && col >= 0 && item.answer) {
                hasValidCoords = true;
                const dir = item.direction?.toLowerCase();
                if (dir === 'across' || !dir) {
                    maxRow = Math.max(maxRow, row);
                    maxCol = Math.max(maxCol, col + item.answer.length - 1);
                } else {
                    maxRow = Math.max(maxRow, row + item.answer.length - 1);
                    maxCol = Math.max(maxCol, col);
                }
            }
        });

        if (!hasValidCoords || maxRow > 50 || maxCol > 50) {
            return (
                <div className="text-center p-8 bg-amber-50 text-amber-700 rounded-3xl border border-amber-200 shadow-sm max-w-2xl mx-auto mb-12">
                    <p className="font-bold">Kunne ikke generere et visuelt rutenett for dette kryssordet.</p>
                    <p className="text-sm mt-2 opacity-80">Du kan fortsatt løse oppgavene ved å skrive inn svarene nedenfor!</p>
                </div>
            );
        }

        const grid: any[][] = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(null));
        
        gameData.crossword.forEach((item: any) => {
            const originalIdx = gameData.crossword.indexOf(item);
            const row = parseInt(item.row);
            const col = parseInt(item.col);
            if (isNaN(row) || isNaN(col) || row < 0 || col < 0 || !item.answer) return;
            
            for (let i = 0; i < item.answer.length; i++) {
                const dir = item.direction?.toLowerCase();
                const r = (dir === 'across' || !dir) ? row : row + i;
                const c = (dir === 'across' || !dir) ? col + i : col;
                
                if (r <= maxRow && c <= maxCol) {
                    if (!grid[r][c]) {
                        grid[r][c] = { 
                            letter: item.answer[i], 
                            number: i === 0 ? originalIdx + 1 : null,
                            wordIndices: [originalIdx]
                        };
                    } else {
                        if (i === 0) grid[r][c].number = originalIdx + 1;
                        grid[r][c].wordIndices.push(originalIdx);
                    }
                }
            }
        });

        return (
            <div className="flex justify-center mb-16 overflow-x-auto pb-4 custom-scrollbar">
                <div className="inline-grid gap-0 border-2 border-slate-800 bg-slate-800 shadow-xl" style={{ gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))` }}>
                    {grid.map((row, r) => (
                        row.map((cell, c) => {
                            if (!cell) {
                                return <div key={`${r}-${c}`} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-transparent"></div>;
                            }
                            
                            const isCorrect = cell.wordIndices.some((idx: number) => {
                                const item = gameData.crossword[idx];
                                return item && item.answer && crosswordAnswers[idx] === item.answer.toUpperCase();
                            });
                            
                            return (
                                <div key={`${r}-${c}`} className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white border border-slate-300 flex items-center justify-center transition-all">
                                    {cell.number && <span className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-black text-slate-500">{cell.number}</span>}
                                    {isCorrect && <span className="text-sm sm:text-base md:text-lg font-black text-indigo-700 uppercase animate-in zoom-in">{cell.letter}</span>}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
        );
    };

    if (step === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                    <div className="bg-white p-8 rounded-full shadow-2xl border-4 border-indigo-50 relative z-10">
                        <Grid3X3 size={56} className="text-indigo-600 animate-bounce" />
                    </div>
                </div>
                <div className="text-center space-y-3 max-w-sm mx-auto">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Genererer...</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Kai analyserer "{topic}" og bygger et skreddersydd spill for elevene dine.</p>
                </div>
            </div>
        );
    }

    if (step === 'words') {
        return (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setStep('config')} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <ArrowRight size={20} className="rotate-180" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <List size={20} className="text-indigo-600" /> Ordliste
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{topic}</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={addWord} icon={Plus} className="w-full sm:w-auto">
                        Legg til ord
                    </Button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
                    {wordList.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                            <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-sm font-black text-indigo-600">
                                {idx + 1}
                            </div>
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                <input 
                                    type="text" 
                                    value={item.word} 
                                    onChange={(e) => updateWord(idx, 'word', e.target.value)}
                                    placeholder="Ord"
                                    className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase tracking-wide"
                                />
                                <input 
                                    type="text" 
                                    value={item.definition} 
                                    onChange={(e) => updateWord(idx, 'definition', e.target.value)}
                                    placeholder="Definisjon / Hint"
                                    className="sm:col-span-2 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-slate-600 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => removeWord(idx)}
                                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-auto"
                                title="Slett ord"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {wordList.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Ingen ord lagt til enda.</p>
                            <Button variant="ghost" onClick={addWord} className="mt-4 text-indigo-600">Legg til ditt første ord</Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-4 sticky bottom-4">
                    <Button 
                        onClick={handleGenerateGame} 
                        size="lg" 
                        icon={RefreshCw}
                        disabled={wordList.length < 3}
                        className="w-full sm:w-auto px-12 shadow-xl shadow-indigo-200"
                    >
                        Generer Spill ({wordList.length} ord)
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 'result' && gameData) {
        return (
            <div className={`space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-900 overflow-y-auto p-4 sm:p-10' : ''}`}>
                <div className="flex flex-wrap justify-between items-center gap-4 no-print bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex gap-2">
                        {!isFullscreen && (
                            <>
                                <button onClick={() => setStep('config')} className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                                    <ArrowRight size={16} className="rotate-180" /> Nytt tema
                                </button>
                                <button onClick={() => setStep('words')} className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                                    <List size={16} /> Endre ord
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        {currentUser && !isFullscreen && (
                            <button 
                                onClick={handleSaveToArchive} 
                                disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}`}
                            >
                                {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={16} /> : isOwner ? <Save size={16} /> : <Copy size={16} />} 
                                {saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil' : isOwner ? 'Lagre' : 'Kopier'}
                            </button>
                        )}
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(gameType === 'wordsearch' || gameType === 'both') && (
                                <button onClick={() => setActiveTab('wordsearch')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'wordsearch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Ordleter
                                </button>
                            )}
                            {(gameType === 'crossword' || gameType === 'both') && (
                                <button onClick={() => setActiveTab('crossword')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'crossword' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Kryssord
                                </button>
                            )}
                        </div>
                        
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Fullskjerm">
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        {!isFullscreen && (
                            <button onClick={handlePrint} className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Skriv ut">
                                <Printer size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={`print-container bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[800px] ${isFullscreen ? 'max-w-6xl mx-auto' : ''}`}>
                    <div className="text-center mb-12 space-y-3">
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter">{gameData.title || topic}</h1>
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{subject}</span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{difficulty}</span>
                        </div>
                    </div>

                    {activeTab === 'wordsearch' && gameData.wordsearchGrid && (
                        <div className="space-y-12">
                            <div className="flex justify-center">
                                <div className="inline-grid gap-1 sm:gap-1.5 p-3 sm:p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner" style={{ gridTemplateColumns: `repeat(${gameData.wordsearchGrid[0]?.length || 0}, minmax(0, 1fr))` }}>
                                    {gameData.wordsearchGrid.map((row: string[], rowIndex: number) => (
                                        row.map((cell: string, colIndex: number) => {
                                            const isSelected = selectedCells.has(`${rowIndex}-${colIndex}`);
                                            return (
                                                <button 
                                                    key={`${rowIndex}-${colIndex}`} 
                                                    onClick={() => toggleCell(rowIndex, colIndex)}
                                                    className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-sm sm:text-base md:text-lg font-black rounded-xl border-2 transition-all uppercase no-print-button ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110 z-10' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:scale-105'}`}
                                                >
                                                    {cell}
                                                </button>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100/50 max-w-4xl mx-auto">
                                <h3 className="text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-2 justify-center">
                                    <Type size={16} /> Finn disse ordene:
                                </h3>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {gameData.words?.map((word: string, i: number) => (
                                        <span key={i} className="px-4 py-2 bg-white rounded-xl text-indigo-700 font-bold text-sm shadow-sm border border-indigo-100 uppercase tracking-wide">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'crossword' && (
                        <div className="space-y-12 max-w-5xl mx-auto">
                             {renderCrosswordGrid()}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-slate-400 border-b-2 border-slate-200 pb-4 flex items-center gap-2"><ArrowRight size={16} /> Vannrett</h3>
                                    <ul className="space-y-6">
                                        {gameData.crossword?.filter((i: any) => i.direction === 'across' || !i.direction).map((item: any, idx: number) => {
                                            const originalIdx = gameData.crossword.indexOf(item);
                                            const isCorrect = item.answer && crosswordAnswers[originalIdx] === item.answer.toUpperCase();
                                            return (
                                                <li key={idx} className="space-y-3 group">
                                                    <div className="text-sm leading-relaxed">
                                                        <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-1 rounded-lg">{originalIdx + 1}</span>
                                                        <span className="text-slate-700 font-medium">{item.clue}</span>
                                                        <span className="ml-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">({item.answer?.length || 0})</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 no-print">
                                                        <input 
                                                            type="text" 
                                                            maxLength={item.answer?.length || 10}
                                                            value={crosswordAnswers[originalIdx] || ''}
                                                            onChange={(e) => handleCrosswordInput(originalIdx, e.target.value)}
                                                            className={`w-full max-w-[240px] p-3 bg-white border-2 rounded-xl font-black text-sm outline-none transition-all uppercase tracking-[0.3em] shadow-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-700'}`}
                                                            placeholder="SVAR..."
                                                        />
                                                        {isCorrect && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in"><Check size={16} className="text-emerald-600" /></div>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                <div className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-slate-400 border-b-2 border-slate-200 pb-4 flex items-center gap-2"><ArrowRight size={16} className="rotate-90" /> Loddrett</h3>
                                    <ul className="space-y-6">
                                        {gameData.crossword?.filter((i: any) => i.direction === 'down').map((item: any, idx: number) => {
                                            const originalIdx = gameData.crossword.indexOf(item);
                                            const isCorrect = item.answer && crosswordAnswers[originalIdx] === item.answer.toUpperCase();
                                            return (
                                                <li key={idx} className="space-y-3 group">
                                                    <div className="text-sm leading-relaxed">
                                                        <span className="font-black text-indigo-600 mr-2 bg-indigo-50 px-2 py-1 rounded-lg">{originalIdx + 1}</span>
                                                        <span className="text-slate-700 font-medium">{item.clue}</span>
                                                        <span className="ml-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">({item.answer?.length || 0})</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 no-print">
                                                        <input 
                                                            type="text" 
                                                            maxLength={item.answer?.length || 10}
                                                            value={crosswordAnswers[originalIdx] || ''}
                                                            onChange={(e) => handleCrosswordInput(originalIdx, e.target.value)}
                                                            className={`w-full max-w-[240px] p-3 bg-white border-2 rounded-xl font-black text-sm outline-none transition-all uppercase tracking-[0.3em] shadow-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-700'}`}
                                                            placeholder="SVAR..."
                                                        />
                                                        {isCorrect && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in"><Check size={16} className="text-emerald-600" /></div>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Card className="max-w-3xl mx-auto border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
            <div className="p-8 sm:p-12 space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100/50">
                        <Grid3X3 size={32} />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter">Kryssord & Ordleter</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-md mx-auto leading-relaxed">Generer engasjerende og pedagogiske ordspill tilpasset din undervisning på sekunder.</p>
                </div>

                <div className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Velg Fag</label>
                        <select 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        >
                            {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Tema / Emne</label>
                        <input 
                            type="text" 
                            value={topic} 
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="F.eks. Vikingtiden, Fotosyntese, Verbbøying..."
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm placeholder:text-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Spilltype</label>
                            <select 
                                value={gameType} 
                                onChange={(e) => setGameType(e.target.value as any)}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            >
                                <option value="both">Begge deler</option>
                                <option value="crossword">Kun Kryssord</option>
                                <option value="wordsearch">Kun Ordleter</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Nivå</label>
                            <select 
                                value={difficulty} 
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            >
                                <option value="Easy">Lett (1.-4. trinn)</option>
                                <option value="Medium">Middels (5.-7. trinn)</option>
                                <option value="Hard">Vanskelig (8.-10. trinn)</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Størrelse</label>
                            <select 
                                value={gridSize} 
                                onChange={(e) => setGridSize(parseInt(e.target.value))}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            >
                                <option value={10}>10x10 (Liten)</option>
                                <option value={15}>15x15 (Standard)</option>
                                <option value={20}>20x20 (Stor)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button 
                            onClick={handleGenerateWordList} 
                            disabled={isGenerating || !topic.trim()} 
                            className="flex-grow shadow-xl shadow-indigo-200" 
                            size="lg" 
                            icon={RefreshCw}
                        >
                            {isGenerating ? 'Genererer...' : 'Generer Ordliste med AI'}
                        </Button>
                        <Button 
                            onClick={handleCreateBlank} 
                            variant="secondary"
                            className="px-8 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600" 
                            size="lg" 
                            icon={Plus}
                        >
                            Lag tom
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

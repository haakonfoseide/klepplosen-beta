
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCcw, X, ArrowRight, Gamepad2, Maximize2, Minimize2, Info, Sparkles, Users, Eye, Play, Repeat } from 'lucide-react';

interface AliasGameProps {
    cards: any[];
    onClose: () => void;
    onShuffle: () => void;
    t: any;
    round?: number;
    totalRounds?: number;
    onNextRound?: () => void;
}

export const AliasGame: React.FC<AliasGameProps> = ({ cards, onClose, onShuffle, t, round, totalRounds, onNextRound }) => {
    // Game phases: 'intro' (rules) -> 'playing' (the grid)
    const [gamePhase, setGamePhase] = useState<'intro' | 'playing'>('intro');
    const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
    const [focusedCardIdx, setFocusedCardIdx] = useState<number | null>(null);
    
    // Revealed cards
    const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Håndter fullskjerm-veksling
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Toggle-funksjon for kort
    const toggleCard = (idx: number) => {
        if (viewMode === 'grid') {
            const newSet = new Set(revealedCards);
            if (newSet.has(idx)) {
                newSet.delete(idx);
            } else {
                newSet.add(idx);
            }
            setRevealedCards(newSet);
        } else {
            setFocusedCardIdx(idx);
            const newSet = new Set(revealedCards);
            newSet.add(idx);
            setRevealedCards(newSet);
        }
    };

    const handleShuffle = () => {
        onShuffle();
        setRevealedCards(new Set()); // Nullstill ved blanding
    };

    const handleNextRound = () => {
        if (onNextRound) {
            onNextRound();
            setRevealedCards(new Set()); // Nullstill ved neste runde
        }
    };

    // Lytt på esc-tast for å oppdatere state hvis bruker går ut av fullskjerm
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Hjelpefunksjon for å beregne skriftstørrelse basert på ordlengde
    const getFontSize = (word: string) => {
        if (!word) return 'text-xl';
        const len = word.length;
        if (len > 30) return 'text-sm sm:text-base lg:text-lg'; // Veldig lange ord
        if (len > 20) return 'text-base sm:text-lg lg:text-xl';
        if (len > 12) return 'text-lg sm:text-xl lg:text-2xl';
        return 'text-2xl sm:text-3xl lg:text-4xl';
    };

    return (
      <div 
        ref={containerRef}
        className={`fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 overflow-hidden transition-all duration-500`}
      >
        {/* Dekorative bakgrunnselementer i fullskjerm */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

        {/* INTRO SCREEN */}
        {gamePhase === 'intro' ? (
            <div className="flex-grow flex flex-col items-center justify-center relative z-20 text-white p-8 animate-in slide-in-from-bottom-8 duration-500">
                <button onClick={onClose} className="absolute top-8 left-8 p-2 text-white/50 hover:text-white bg-white/10 rounded-full">
                    <X size={24} />
                </button>
                
                <div className="max-w-4xl w-full text-center space-y-12">
                    <div className="space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-6 border-4 border-white/10">
                            <Gamepad2 size={48} className="text-white drop-shadow-md" />
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter drop-shadow-2xl">Fag-Alias</h1>
                        <p className="text-indigo-200 font-bold uppercase tracking-[0.3em] text-sm sm:text-lg">Slik spiller dere</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Users, title: "Lag Par", desc: "Gå sammen to og to." },
                            { icon: Eye, title: "Ryggen Til", desc: "En ser mot tavla, en ser bort." },
                            { icon: Message, title: "Forklar", desc: "Forklar ordet uten å si det!" },
                            { icon: Repeat, title: "Bytt Rolle", desc: "Bytt plass når runden er over." }
                        ].map((rule, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-indigo-300 mb-2">
                                    <rule.icon size={24} />
                                </div>
                                <h3 className="font-black uppercase text-sm tracking-widest">{rule.title}</h3>
                                <p className="text-xs font-medium text-indigo-100/80 leading-relaxed">{rule.desc}</p>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => setGamePhase('playing')} 
                        className="group relative inline-flex items-center gap-4 px-10 py-6 bg-white text-indigo-950 rounded-[2.5rem] font-black uppercase text-xl tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-white/50 border-b-8 border-indigo-200"
                    >
                        KLAR, FERDIG, GÅ! <Play fill="currentColor" size={24} />
                    </button>
                </div>
            </div>
        ) : (
            // GAME SCREEN
            <>
                {/* Header Bar - Compact */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10 z-20 shrink-0">
                  <div className="flex gap-4 items-center">
                    <button onClick={onClose} className="p-3 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/10" title="Avslutt">
                        <X size={24} />
                    </button>
                    <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
                    <div className="flex flex-col">
                        <h2 className="text-white font-black uppercase tracking-[0.2em] text-sm sm:text-base">
                            Fag-Alias {round && <span className="text-indigo-400 ml-1">• SIDE {round} av {totalRounds}</span>}
                        </h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{cards.length} ord på denne siden</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                        onClick={() => setViewMode(viewMode === 'grid' ? 'focus' : 'grid')} 
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${viewMode === 'focus' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/10 border-white/10 text-white/50 hover:text-white'}`}
                        title={viewMode === 'grid' ? "Fokus-modus" : "Rutenett-modus"}
                    >
                        {viewMode === 'grid' ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                            {viewMode === 'grid' ? 'Fokus' : 'Rutenett'}
                        </span>
                    </button>
                    <button onClick={handleShuffle} className="p-3 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/10 border border-white/10" title="Bland på nytt">
                        <RefreshCcw size={20} />
                    </button>
                    <button onClick={toggleFullscreen} className="p-3 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/10 border border-white/10" title="Fullskjerm">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                  </div>
                </div>
                
                {/* Game Area */}
                <div className="flex-grow flex flex-col p-4 sm:p-8 overflow-hidden relative z-10">
                  
                  {viewMode === 'focus' ? (
                    <div className="flex-grow flex flex-col items-center justify-center gap-8 animate-in zoom-in-95 duration-500">
                        {/* Focus Mode Card */}
                        <div className="w-full max-w-4xl aspect-[16/9] relative perspective-1000">
                            {focusedCardIdx !== null ? (
                                <div className="w-full h-full relative preserve-3d transition-all duration-700" style={{ transform: revealedCards.has(focusedCardIdx) ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                                    {/* Front */}
                                    <div 
                                        onClick={() => toggleCard(focusedCardIdx)}
                                        className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-[3rem] border-4 border-white/20 shadow-2xl cursor-pointer ${cards[focusedCardIdx].category === 'gøy' ? 'bg-gradient-to-br from-pink-600 to-rose-700' : 'bg-gradient-to-br from-indigo-700 to-slate-900'}`}
                                    >
                                        <div className="absolute top-10 left-10 opacity-20"><Gamepad2 size={64} /></div>
                                        <h3 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter text-center px-12 drop-shadow-2xl">
                                            {cards[focusedCardIdx].word}
                                        </h3>
                                        <div className="absolute bottom-10 animate-bounce text-white/40 font-black uppercase tracking-[0.3em] text-sm">Klikk for å se hint</div>
                                    </div>
                                    {/* Back */}
                                    <div 
                                        onClick={() => toggleCard(focusedCardIdx)}
                                        className="absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-[3rem] border-4 border-indigo-400 bg-white shadow-2xl cursor-pointer"
                                        style={{ transform: 'rotateY(180deg)' }}
                                    >
                                        <div className="absolute top-10 left-10 text-indigo-100"><Info size={64} /></div>
                                        <div className="max-w-3xl text-center space-y-6 px-12">
                                            <p className="text-2xl sm:text-4xl font-bold text-slate-700 leading-tight italic">
                                                "{cards[focusedCardIdx].definition || "Forklar ordet uten å nevne det!"}"
                                            </p>
                                            <div className="pt-8 border-t border-slate-100">
                                                <p className="text-xl font-black uppercase text-indigo-600 tracking-widest">{cards[focusedCardIdx].word}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center rounded-[3rem] border-4 border-dashed border-white/10 bg-white/5 backdrop-blur-sm">
                                    <p className="text-white/30 font-black uppercase tracking-[0.4em] text-xl">Velg et ord fra bunnen</p>
                                </div>
                            )}
                        </div>

                        {/* Focus Mode Selector (Horizontal Scroll) */}
                        <div className="w-full max-w-6xl flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-4">
                            {cards.map((card, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setFocusedCardIdx(idx)}
                                    className={`flex-shrink-0 w-40 h-24 rounded-2xl border-2 transition-all flex items-center justify-center p-3 text-center ${focusedCardIdx === idx ? 'border-white bg-white/20 scale-105 shadow-xl' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                >
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-2">{card.word}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                  ) : (
                    /* Grid View */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 auto-rows-fr overflow-y-auto custom-scrollbar pr-2">
                      {cards.map((card: any, idx: number) => {
                          const isRevealed = revealedCards.has(idx);
                          return (
                              <button 
                              key={idx} 
                              onClick={() => toggleCard(idx)}
                              className={`aspect-[4/3] flex items-center justify-center rounded-2xl sm:rounded-3xl shadow-lg border-2 transition-all active:scale-95 group overflow-hidden relative ${
                                  isRevealed 
                                      ? 'border-indigo-400 bg-white ring-4 ring-indigo-500/20' 
                                      : card.category === 'gøy' 
                                          ? 'bg-gradient-to-br from-pink-600 to-rose-700 border-white/10 hover:border-pink-300 hover:shadow-pink-500/20' 
                                          : 'bg-gradient-to-br from-indigo-700 to-slate-900 border-white/10 hover:border-indigo-400 hover:shadow-indigo-500/20'
                              }`}
                              >
                              {isRevealed ? (
                                  <div className="animate-in fade-in zoom-in-95 absolute inset-0 bg-white p-4 flex flex-col items-center justify-center text-slate-800">
                                      <div className="flex items-center gap-1 mb-2 flex-shrink-0 opacity-50">
                                          <Info size={12} className="text-indigo-500" />
                                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Hint</p>
                                      </div>
                                      <div className="flex-grow flex items-center justify-center w-full overflow-hidden">
                                          <p className="text-sm sm:text-base font-bold leading-tight text-center break-words italic text-slate-700 px-2">
                                              {card.definition || "Forklar ordet uten å nevne det!"}
                                          </p>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-slate-100 w-full text-center">
                                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">{card.word}</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative">
                                      <div className="absolute top-3 left-3 opacity-20">
                                          {card.category === 'gøy' ? <Sparkles size={24} className="text-white" /> : <Gamepad2 size={24} className="text-white" />}
                                      </div>
                                      <h3 className={`${getFontSize(card.word)} font-black text-white uppercase tracking-tight text-center leading-tight drop-shadow-lg w-full break-words hyphens-auto px-2`}>
                                      {card.word}
                                      </h3>
                                      <div className="absolute bottom-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                          <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                                              <p className="text-[8px] font-black text-white uppercase tracking-widest">Vis definisjon</p>
                                          </div>
                                      </div>
                                  </div>
                              )}
                              {card.category === 'gøy' && !isRevealed && (
                                  <div className="absolute top-3 right-3">
                                      <div className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-md font-black text-[7px] uppercase tracking-widest shadow-lg">Bonus</div>
                                  </div>
                              )}
                              </button>
                          );
                      })}
                    </div>
                  )}
                </div>

                {/* Navigation Footer - Classroom Visibility */}
                <div className="p-6 bg-white/5 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20 shrink-0 px-10">
                    <div className="flex items-center gap-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Fag-Alias</span>
                            <p className="text-white/60 text-xs font-bold">Trykk på ordene for å vise forklaring.</p>
                         </div>
                    </div>

                    <div className="flex gap-4">
                        {onNextRound ? (
                            <button 
                                onClick={handleNextRound}
                                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-white/40"
                            >
                                Neste Side ({round && round + 1} av {totalRounds}) <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-slate-800 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl border border-white/10"
                            >
                                Avslutt Spill <X size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </>
        )}
      </div>
    );
};

// Helper component for icon
const Message = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

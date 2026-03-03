
import React, { useState } from 'react';

export const TrafficLight = ({ t }: any) => {
    const [activeLight, setActiveLight] = useState<'red' | 'yellow' | 'green' | null>(null);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 py-8 w-full">
            <div className="bg-slate-900 p-8 rounded-[4rem] shadow-2xl flex flex-col gap-6 border-4 border-slate-800">
                <button 
                    onClick={() => setActiveLight('red')}
                    className={`w-32 h-32 rounded-full border-4 border-black/20 transition-all duration-300 shadow-inner ${activeLight === 'red' ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] scale-105' : 'bg-red-900/30'}`}
                />
                <button 
                    onClick={() => setActiveLight('yellow')}
                    className={`w-32 h-32 rounded-full border-4 border-black/20 transition-all duration-300 shadow-inner ${activeLight === 'yellow' ? 'bg-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] scale-105' : 'bg-amber-900/30'}`}
                />
                <button 
                    onClick={() => setActiveLight('green')}
                    className={`w-32 h-32 rounded-full border-4 border-black/20 transition-all duration-300 shadow-inner ${activeLight === 'green' ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.6)] scale-105' : 'bg-emerald-900/30'}`}
                />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                    {activeLight === 'red' ? t.quiet : activeLight === 'yellow' ? t.whisper : activeLight === 'green' ? t.indoorVoice : t.selectMode}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {activeLight ? t.activeSignal : t.clickToActivate}
                </p>
            </div>
        </div>
    );
};

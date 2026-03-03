
import React, { useState } from 'react';
import { Server, Cpu, Loader2, Stethoscope } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { checkAIHealth } from '../../services/geminiService';

export const SystemHealth: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<{
        db: { status: 'idle' | 'ok' | 'error' | 'loading', latency: number, message?: string },
        ai: { status: 'idle' | 'ok' | 'error' | 'loading', latency: number, message?: string }
    }>({
        db: { status: 'idle', latency: 0 },
        ai: { status: 'idle', latency: 0 }
    });

    const runDiagnostics = async () => {
        setHealthStatus(prev => ({ 
            db: { ...prev.db, status: 'loading' }, 
            ai: { ...prev.ai, status: 'loading' } 
        }));

        const dbRes = await storageService.checkConnection();
        setHealthStatus(prev => ({ ...prev, db: { ...dbRes, status: dbRes.status } }));

        const aiRes = await checkAIHealth();
        setHealthStatus(prev => ({ ...prev, ai: { ...aiRes, status: aiRes.status } }));
    };

    return (
        <div className="space-y-8 animate-in fade-in h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 h-full justify-center items-center text-center">
                    <div className={`p-6 rounded-3xl transition-colors ${healthStatus.db.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : healthStatus.db.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                        <Server size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Database</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {healthStatus.db.status === 'loading' ? 'Kobler til...' : healthStatus.db.status === 'idle' ? 'Venter på test' : healthStatus.db.status === 'ok' ? 'Tilkoblet' : 'Ingen kontakt'}
                        </p>
                    </div>
                    {healthStatus.db.status !== 'idle' && (
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm w-full max-w-xs">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500">Latency:</span>
                                <span className="text-slate-900">{healthStatus.db.latency} ms</span>
                            </div>
                            {healthStatus.db.message && <div className="text-[10px] font-mono text-red-500 bg-red-50 p-2 rounded-lg mt-2 break-all">{healthStatus.db.message}</div>}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 h-full justify-center items-center text-center">
                    <div className={`p-6 rounded-3xl transition-colors ${healthStatus.ai.status === 'ok' ? 'bg-blue-100 text-blue-600' : healthStatus.ai.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                        <Cpu size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">AI Motor</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {healthStatus.ai.status === 'loading' ? 'Ping...' : healthStatus.ai.status === 'idle' ? 'Venter på test' : healthStatus.ai.status === 'ok' ? 'Operativ' : 'Feil'}
                        </p>
                    </div>
                    {healthStatus.ai.status !== 'idle' && (
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm w-full max-w-xs">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500">Latency:</span>
                                <span className="text-slate-900">{healthStatus.ai.latency} ms</span>
                            </div>
                            {healthStatus.ai.message && <div className="text-[10px] font-mono text-red-500 bg-red-50 p-2 rounded-lg mt-2 break-all">{healthStatus.ai.message}</div>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-center pb-8">
                <button 
                    onClick={runDiagnostics} 
                    disabled={healthStatus.db.status === 'loading' || healthStatus.ai.status === 'loading'} 
                    className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                    {healthStatus.db.status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Stethoscope size={18} />}
                    Kjør Systemdiagnose
                </button>
            </div>
        </div>
    );
};

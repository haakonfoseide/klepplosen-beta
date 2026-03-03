
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Database, Loader2, FileText, Layers, MessageCircle, Upload, Activity, Users, BarChart3, Radio, Lock, DownloadCloud, Microscope } from 'lucide-react';
import { storageService, supabase } from './services/storageService';
import { SystemStats } from './types';
import { UserManagement } from './views/admin/UserManagement';
import { SystemHealth } from './views/admin/SystemHealth';
import { CurriculumManager } from './views/admin/CurriculumManager';

interface AdminViewProps {
  onBack: () => void;
  importProgress: { current: number, total: number, status: string };
  importLogs: string[];
  isImporting: boolean;
  onStartCLImport: () => void;
  onStartOracyImport: () => void;
  onClearDatabase: () => void;
  onSeedDefaults: () => void;
  onUploadFiles: (files: FileList | null, target: 'cl' | 'oracy') => void;
  fetchStats: () => Promise<SystemStats>;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  onBack, importProgress, importLogs, isImporting, onUploadFiles, fetchStats
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'system'>('dashboard');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [requireAccessCode, setRequireAccessCode] = useState<boolean>(true);
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // File refs
  const clFileRef = useRef<HTMLInputElement>(null);
  const oracyFileRef = useRef<HTMLInputElement>(null);
  const lsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const loadStats = async () => {
          const data = await fetchStats();
          setStats(data);
      };

      const loadSettings = async () => {
          const val = await storageService.getSystemSetting('require_access_code');
          setRequireAccessCode(val !== false); // Default true
      };

      loadStats();
      loadSettings();
  }, [fetchStats]);

  const toggleAccessCode = async () => {
      const newValue = !requireAccessCode;
      setRequireAccessCode(newValue);
      await storageService.updateSystemSetting('require_access_code', newValue);
  };

  const handleSync = async (target: 'cl' | 'oracy') => {
      setIsSyncing(true);
      setSyncLog([`Starter synk av ${target.toUpperCase()}...`]);
      try {
          const logs = await storageService.syncFromBucket(target);
          setSyncLog(prev => [...prev, ...logs]);
      } catch (e: any) {
          setSyncLog(prev => [...prev, `FEIL: ${e.message}`]);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleLSUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      setIsSyncing(true);
      setSyncLog([`Laster opp ${files.length} filer til 'lesson-study' bøtten...`]);
      
      try {
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              // Use direct Supabase storage for lesson-study bucket as it's separate from json import logic
              const { error } = await supabase.storage
                  .from('lesson-study')
                  .upload(file.name, file, { upsert: true });
              
              if (error) throw error;
              setSyncLog(prev => [...prev, `Lastet opp: ${file.name}`]);
          }
          setSyncLog(prev => [...prev, "Ferdig!"]);
      } catch (e: any) {
          setSyncLog(prev => [...prev, `Feil: ${e.message}`]);
      } finally {
          setIsSyncing(false);
      }
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-10 max-w-full animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors p-2">
                <ChevronLeft size={18} /> Tilbake
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['dashboard', 'users', 'content', 'system'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab === 'dashboard' && <BarChart3 size={14}/>}
                        {tab === 'users' && <Users size={14}/>}
                        {tab === 'content' && <Database size={14}/>}
                        {tab === 'system' && <Activity size={14}/>}
                        <span className="hidden sm:inline">{tab === 'dashboard' ? 'Oversikt' : tab === 'users' ? 'Brukere' : tab === 'content' ? 'Innhold' : 'System'}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-2xl border border-slate-50 min-h-[600px] flex flex-col">
            
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Admin Dashboard</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Systemoversikt</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-2 pr-6 rounded-2xl border border-slate-100">
                            <div className={`p-2 rounded-xl ${requireAccessCode ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Lock size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tilgangskode</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">{requireAccessCode ? 'Påkrevd (Kleppu)' : 'Åpen tilgang'}</span>
                                    <button onClick={toggleAccessCode} className="text-indigo-600 hover:underline text-[10px] font-black uppercase">Endre</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-400 mb-2"><Users size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Brukere</span></div>
                            <p className="text-4xl font-black text-indigo-900">{stats?.totalUsers || 0}</p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-400 mb-2"><FileText size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Planer</span></div>
                            <p className="text-4xl font-black text-emerald-900">{stats?.totalPlans || 0}</p>
                        </div>
                        <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                            <div className="flex items-center gap-2 text-amber-400 mb-2"><Activity size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Besøk i dag</span></div>
                            <p className="text-4xl font-black text-amber-900">{stats?.visitsToday || 0}</p>
                        </div>
                        <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                            <div className="flex items-center gap-2 text-rose-400 mb-2"><Radio size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Aktive nå</span></div>
                            <p className="text-4xl font-black text-rose-900">{stats?.activeNow || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Siste aktivitet</h4>
                            <div className="space-y-4">
                                {stats?.recentLogs.map((log: any) => (
                                    <div key={log.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                        <div>
                                            <p className="font-bold text-xs text-slate-700 uppercase">{log.event_type}</p>
                                            <p className="text-[10px] text-slate-400">{log.path}</p>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-300">{new Date(log.created_at).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                                {(!stats?.recentLogs || stats.recentLogs.length === 0) && <p className="text-center text-slate-300 text-xs italic">Ingen loggføringer enda</p>}
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Trafikk (Siste 7 dager)</h4>
                            <div className="flex items-end justify-between h-48 px-2 gap-2">
                                {stats?.trafficGraph.map((d, i) => {
                                    const max = Math.max(...stats.trafficGraph.map(g => g.count), 10);
                                    const height = `${(d.count / max) * 100}%`;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                            <div className="w-full bg-indigo-200 rounded-t-lg relative group transition-all hover:bg-indigo-400" style={{ height: height || '4px' }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {d.count}
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase rotate-0">{new Date(d.date).toLocaleDateString('no-NO', { weekday: 'short' })}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && <UserManagement />}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
                <div className="space-y-12 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Innhold & Database</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Administrer systeminnhold</p>
                        </div>
                    </div>

                    {/* IMPORT / SYNC SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* CL SYNC */}
                        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6">
                            <div className="flex items-center gap-4 text-indigo-700">
                                <div className="p-3 bg-white rounded-2xl shadow-sm"><Layers size={24} /></div>
                                <h4 className="text-lg font-black uppercase tracking-tight">CL Strukturer</h4>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleSync('cl')}
                                    disabled={isSyncing}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <DownloadCloud size={16}/>} Synk fra Sky (Bucket)
                                </button>
                                <div className="flex items-center gap-2 justify-center opacity-50">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase">Eller</span>
                                </div>
                                <input type="file" accept=".json" ref={clFileRef} className="hidden" onChange={(e) => onUploadFiles(e.target.files, 'cl')} />
                                <button 
                                    onClick={() => clFileRef.current?.click()}
                                    disabled={isImporting}
                                    className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload size={14}/> Last opp fil (Backup)
                                </button>
                            </div>
                        </div>

                        {/* ORACY SYNC */}
                        <div className="bg-pink-50 p-8 rounded-[2.5rem] border border-pink-100 space-y-6">
                            <div className="flex items-center gap-4 text-pink-700">
                                <div className="p-3 bg-white rounded-2xl shadow-sm"><MessageCircle size={24} /></div>
                                <h4 className="text-lg font-black uppercase tracking-tight">Oracy Ressurser</h4>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleSync('oracy')}
                                    disabled={isSyncing}
                                    className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-pink-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <DownloadCloud size={16}/>} Synk fra Sky (Bucket)
                                </button>
                                <div className="flex items-center gap-2 justify-center opacity-50">
                                    <span className="text-[9px] font-bold text-pink-400 uppercase">Eller</span>
                                </div>
                                <input type="file" accept=".json" ref={oracyFileRef} className="hidden" onChange={(e) => onUploadFiles(e.target.files, 'oracy')} />
                                <button 
                                    onClick={() => oracyFileRef.current?.click()}
                                    disabled={isImporting}
                                    className="w-full py-3 bg-white text-pink-600 border border-pink-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload size={14}/> Last opp fil (Backup)
                                </button>
                            </div>
                        </div>

                        {/* LESSON STUDY FILES */}
                        <div className="bg-teal-50 p-8 rounded-[2.5rem] border border-teal-100 space-y-6">
                            <div className="flex items-center gap-4 text-teal-700">
                                <div className="p-3 bg-white rounded-2xl shadow-sm"><Microscope size={24} /></div>
                                <h4 className="text-lg font-black uppercase tracking-tight">Lesson Study Filer</h4>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-bold text-teal-600 text-center">Last opp maler (PDF/Word) til "lesson-study" bucket.</p>
                                <input type="file" accept=".pdf,.docx,.doc" ref={lsFileRef} className="hidden" multiple onChange={handleLSUpload} />
                                <button 
                                    onClick={() => lsFileRef.current?.click()}
                                    disabled={isSyncing}
                                    className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Upload size={14}/> Last opp filer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CURRICULUM MANAGER */}
                    <div className="border-t border-slate-100 pt-8">
                        <CurriculumManager />
                    </div>

                    {/* Sync/Import Log Console */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 font-mono text-xs overflow-hidden flex flex-col h-48 shadow-inner mt-8">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Systemlogg (Sync/Import)</span>
                            {importProgress.status !== 'idle' && (
                                <span className="text-emerald-400">{importProgress.status} ({importProgress.current}/{importProgress.total})</span>
                            )}
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
                            {syncLog.length === 0 && importLogs.length === 0 && <span className="text-slate-600 italic">Ingen ny aktivitet...</span>}
                            {[...syncLog, ...importLogs].map((log, i) => (
                                <div key={i} className="text-slate-300 border-b border-slate-800/50 pb-1 mb-1 last:border-0">
                                    <span className="text-indigo-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && <SystemHealth />}

        </div>
    </div>
  );
};
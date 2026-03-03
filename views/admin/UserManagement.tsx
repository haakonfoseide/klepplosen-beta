
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { Loader2, RefreshCw, ArrowUpDown, UserX, UserCheck } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const UserManagement: React.FC = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof User | 'lastActive', direction: 'asc' | 'desc' }>({ key: 'lastActive', direction: 'desc' });
    const [pendingRoleChangeId, setPendingRoleChangeId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const userList = await storageService.getAllUsers();
            setUsers(userList);
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSort = (key: keyof User | 'lastActive') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = useMemo(() => {
        const sorted = [...users];
        sorted.sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof User];
            let bVal: any = b[sortConfig.key as keyof User];
            
            if (sortConfig.key === 'lastActive') {
                aVal = a.lastActive ? new Date(a.lastActive).getTime() : 0;
                bVal = b.lastActive ? new Date(b.lastActive).getTime() : 0;
            } else if (sortConfig.key === 'createdAt') {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [users, sortConfig]);

    const handleToggleAdmin = async (userId: string, currentRole: string) => {
        if (pendingRoleChangeId !== userId) { setPendingRoleChangeId(userId); return; }
        setPendingRoleChangeId(null);
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await storageService.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            addToast(`Rolle endret til ${newRole.toUpperCase()}.`, 'success');
        } catch (e: any) {
            addToast("Feil ved oppdatering av rolle: " + e.message, 'error');
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in h-full">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase text-slate-700 tracking-widest">Brukeradministrasjon</h3>
                <button onClick={loadUsers} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} /></button>
            </div>
            
            {loadingUsers ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="font-bold text-xs uppercase tracking-widest">Laster brukere...</p>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden flex-grow overflow-y-auto custom-scrollbar relative">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                {['name', 'lastActive', 'createdAt', 'role'].map((key) => (
                                    <th 
                                        key={key} 
                                        className="p-6 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200 transition-colors select-none"
                                        onClick={() => handleSort(key as any)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {key === 'name' ? 'Navn' : key === 'lastActive' ? 'Sist Sett' : key === 'createdAt' ? 'Registrert' : 'Rolle'}
                                            {sortConfig.key === key && (
                                                <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Handling</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedUsers.map(user => {
                                const lastActiveDate = user.lastActive ? new Date(user.lastActive) : null;
                                const isActiveNow = lastActiveDate && (Date.now() - lastActiveDate.getTime() < 15 * 60 * 1000); // 15 mins
                                return (
                                    <tr key={user.id} className="group hover:bg-white transition-colors">
                                        <td className="p-6 font-bold text-sm text-slate-700 flex items-center gap-2">
                                            {isActiveNow && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Aktiv nå"/>}
                                            {user.name}
                                        </td>
                                        <td className="p-6 font-medium text-xs text-slate-500">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleString('no-NO') : 'Aldri'}
                                        </td>
                                        <td className="p-6 font-medium text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString('no-NO')}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleToggleAdmin(user.id, user.role)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ml-auto ${pendingRoleChangeId === user.id ? 'bg-orange-500 text-white border-orange-500' : user.role === 'admin' ? 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
                                                title={pendingRoleChangeId === user.id ? "Klikk igjen for å bekrefte" : undefined}
                                            >
                                                {pendingRoleChangeId === user.id ? "Bekreft?" : user.role === 'admin' ? <><UserX size={12} /> Fjern Admin</> : <><UserCheck size={12} /> Gjør Admin</>}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {users.length === 0 && <div className="p-10 text-center text-slate-400 font-bold text-sm">Ingen brukere funnet.</div>}
                </div>
            )}
        </div>
    );
};

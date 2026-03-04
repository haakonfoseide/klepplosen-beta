
import { createClient } from '@supabase/supabase-js';
import { SavedPlan, User, CLStructure, OracyResource, Class, Student, SystemStats, DbCompetenceAimSet, AppState, LanguageForm } from '../types';

const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.REACT_APP_SUPABASE_URL || 'https://sfuwzuifxvovowoicrcp.supabase.co';
const supabaseKey = (import.meta.env && import.meta.env.VITE_SUPABASE_PUBLIC) || (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.REACT_APP_SUPABASE_ANON_KEY || 'dummy-key-to-prevent-crash';

if (supabaseKey === 'dummy-key-to-prevent-crash') {
    console.warn('Supabase key is missing! Authentication will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to map DB plan to local structure
const mapDbPlanToLocal = (dbPlan: any): SavedPlan => {
  let parsedTask = dbPlan.task;
  if (typeof dbPlan.task === 'string') {
      try {
          parsedTask = JSON.parse(dbPlan.task);
      } catch (e) {
          console.error("Failed to parse task JSON for plan", dbPlan.id, e);
          parsedTask = {};
      }
  }
  return {
    ...dbPlan,
    task: parsedTask
  };
};

export const storageService = {
  // Auth
  signIn: async (email, password) => {
      if (supabaseKey === 'dummy-key-to-prevent-crash') {
          return { data: { user: null, session: null }, error: { message: 'System configuration error: Missing API Key' } as any };
      }
      return supabase.auth.signInWithPassword({ email, password });
  },
  signUp: async (email, password, name) => {
    if (supabaseKey === 'dummy-key-to-prevent-crash') {
        return { data: { user: null, session: null }, error: { message: 'System configuration error: Missing API Key' } as any };
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role: 'user' } } });
    if (!error && data.user) {
        await supabase.from('users').insert({ id: data.user.id, email, name, role: 'user' });
    }
    return { data, error };
  },
  signOut: async () => supabase.auth.signOut(),
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) return data as User;
    return { 
        id: user.id, 
        email: user.email!, 
        name: user.user_metadata.name || 'Bruker', 
        username: user.email!, 
        role: user.user_metadata.role || 'user', 
        createdAt: user.created_at 
    };
  },
  resetPassword: async (email) => {
    if (supabaseKey === 'dummy-key-to-prevent-crash') {
        return { data: null, error: { message: 'System configuration error: Missing API Key' } as any };
    }
    return supabase.auth.resetPasswordForEmail(email);
  },
  signInWithMagicLink: async (email) => {
    if (supabaseKey === 'dummy-key-to-prevent-crash') {
        return { data: null, error: { message: 'System configuration error: Missing API Key' } as any };
    }
    return supabase.auth.signInWithOtp({ email });
  },
  updateUserRole: async (id, role) => supabase.from('users').update({ role }).eq('id', id),
  updateUserName: async (id, name) => {
      await supabase.auth.updateUser({ data: { name } });
      await supabase.from('users').update({ name }).eq('id', id);
  },
  updateUserPassword: async (password) => { await supabase.auth.updateUser({ password }); },
  updateUserActivity: async (id) => supabase.from('users').update({ lastActive: new Date().toISOString() }).eq('id', id),
  getAllUsers: async () => {
      const { data } = await supabase.from('users').select('*');
      return (data || []) as User[];
  },

  // Content (CL)
  getCLStructures: async () => {
      const { data } = await supabase.from('cl_structures').select('*');
      return (data || []) as CLStructure[];
  },
  upsertCLStructure: async (structure: CLStructure) => supabase.from('cl_structures').upsert(structure),
  deleteCLStructure: async (id: string) => supabase.from('cl_structures').delete().eq('id', id),
  bulkImportCLStructures: async (structures: CLStructure[]) => supabase.from('cl_structures').upsert(structures),

  // Content (Oracy)
  getOracyResources: async () => {
      const { data } = await supabase.from('oracy_resources').select('*');
      return (data || []) as OracyResource[];
  },
  bulkImportOracyResources: async (resources: OracyResource[]) => supabase.from('oracy_resources').upsert(resources),

  // Plans
  savePlan: async (plan: SavedPlan) => {
      // Strip likes/likedBy so existing values are never overwritten on update.
      // DB defaults (0 / []) apply for new rows automatically.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { likes: _l, likedBy: _lb, ...planData } = plan as any;
      const { data, error } = await supabase.from('plans').upsert(planData);
      if (error) {
          console.error("Error saving plan:", error);
          throw error;
      }
      return { data, error };
  },
  getMyPlans: async (userId: string) => {
      const { data } = await supabase.from('plans').select('*').eq('creatorId', userId);
      return (data || []).map(mapDbPlanToLocal);
  },
  getPlanById: async (id: string): Promise<SavedPlan | null> => {
      const { data, error } = await supabase.from('plans').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapDbPlanToLocal(data);
  },
  getCommunityPlans: async () => {
      const { data } = await supabase.from('plans').select('*').eq('isShared', true);
      return (data || []).map(mapDbPlanToLocal);
  },
  toggleShare: async (id: string, isShared: boolean) => supabase.from('plans').update({ isShared }).eq('id', id),
  toggleLike: async (planId: string, userId: string) => {
      const { data } = await supabase.from('plans').select('likes, likedBy').eq('id', planId).single();
      if (!data) return;
      let likedBy = data.likedBy || [];
      let likes = data.likes || 0;
      if (likedBy.includes(userId)) {
          likedBy = likedBy.filter((u: string) => u !== userId);
          likes = Math.max(0, likes - 1);
      } else {
          likedBy.push(userId);
          likes += 1;
      }
      await supabase.from('plans').update({ likes, likedBy }).eq('id', planId);
  },
  
  deletePlan: async (planId: string): Promise<void> => {
    const { error } = await supabase.from('plans').delete().eq('id', planId);
    if (error) throw error;
  },

  subscribeToPlan: (planId: string, onUpdate: (newPlan: SavedPlan) => void) => {
    const channel = supabase.channel(`plan-${planId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'plans', filter: `id=eq.${planId}` },
        (payload) => {
          const newPlan = mapDbPlanToLocal(payload.new);
          onUpdate(newPlan);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  // Quiz sessions (shared by QuizGame and MathHuntGenerator)
  deleteQuizSession: async (sessionId: string): Promise<void> => {
      await supabase.from('quiz_sessions').delete().eq('id', sessionId);
  },
  createMathHuntSession: async (pin: string, topic: string, startLevel: number) => {
      const { data, error } = await supabase.from('quiz_sessions').insert({
          pin_code: pin,
          status: 'lobby',
          current_question_index: 0,
          quiz_data: [],
          config: { playMode: 'math_hunt', topic, startLevel }
      }).select().single();
      if (error) throw error;
      return data;
  },
  updateQuizSessionStatus: async (sessionId: string, status: string): Promise<void> => {
      const { error } = await supabase.from('quiz_sessions').update({ status }).eq('id', sessionId);
      if (error) throw error;
  },
  fetchSessionPlayers: async (sessionId: string) => {
      const { data } = await supabase.from('quiz_players').select('*').eq('session_id', sessionId);
      return data || [];
  },
  subscribeToSessionPlayers: (sessionId: string, onUpdate: () => void) => {
      const channel = supabase.channel(`mathhunt_lobby_${sessionId}`)
          .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'quiz_players',
              filter: `session_id=eq.${sessionId}`
          }, onUpdate)
          .subscribe();
      return () => { supabase.removeChannel(channel); };
  },

  // Classes & Students
  getMyClasses: async () => {
      const { data } = await supabase.from('classes').select('*'); 
      return (data || []) as Class[];
  },
  createClass: async (name: string, grade: string, subject: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('classes').insert({ userId: user.id, name, grade, subject, studentCount: 0 }).select().single();
      return data as Class;
  },
  deleteClass: async (id: string) => supabase.from('classes').delete().eq('id', id),
  getStudents: async (classId: string) => {
      const { data } = await supabase.from('students').select('*').eq('classId', classId);
      return (data || []) as Student[];
  },
  addStudentsToClass: async (classId: string, names: string[]) => {
      const students = names.map(name => ({ classId, name, gender: 'X', needsFocus: false }));
      await supabase.from('students').insert(students);
  },
  updateStudent: async (student: Student) => supabase.from('students').update(student).eq('id', student.id),
  deleteStudent: async (id: string) => supabase.from('students').delete().eq('id', id),

  // Curriculum
  getUniqueSubjects: async () => {
      const { data } = await supabase.from('subjects').select('*');
      return (data || []) as any[]; // Type assertion handled in component
  },
  updateSubjectCode: async (subject: string, code: string) => {
      await supabase.from('subjects').upsert({ subject, code }, { onConflict: 'subject' });
  },
  updateSubjectVisibility: async (subject: string, isVisible: boolean) => {
      await supabase.from('subjects').upsert({ subject, isVisible }, { onConflict: 'subject' });
  },
  getCompetenceAims: async (subject: string, grade: string) => {
      const { data } = await supabase.from('competence_aims').select('*').eq('subject', subject).eq('grade', grade).single();
      if (data && data.aims) return data.aims.map((t: string, i: number) => ({ id: `${i}`, text: t }));
      return [];
  },
  upsertCompetenceAims: async (data: DbCompetenceAimSet) => {
      await supabase.from('competence_aims').upsert(data, { onConflict: 'subject,grade' });
  },

  // System & Stats
  getSystemStats: async (): Promise<SystemStats> => {
      try {
          const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
          const { count: planCount } = await supabase.from('plans').select('*', { count: 'exact', head: true });
          const { data: visitsData } = await supabase.from('system_settings').select('value').eq('key', 'total_visits').single();
          
          return {
              totalVisits: visitsData?.value || 0,
              totalUsers: userCount || 0,
              totalPlans: planCount || 0,
              visitsToday: 0, // Would need a separate table for daily stats
              activeNow: 1,
              recentLogs: [],
              trafficGraph: []
          };
      } catch (e) {
          console.error("Failed to fetch system stats", e);
          return {
              totalVisits: 0, totalUsers: 0, totalPlans: 0, visitsToday: 0, activeNow: 0, recentLogs: [], trafficGraph: []
          };
      }
  },
  logAnalytics: async (event: string) => {
      if (event === 'visit') {
          try {
              // Atomic increment via RPC to prevent race conditions
              await supabase.rpc('increment_visits');
          } catch (e) {
              console.error("Failed to log visit", e);
          }
      }
  },
  checkConnection: async () => {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) return { status: 'error' as const, latency: 0, message: error.message };
      return { status: 'ok' as const, latency: 100 };
  },
  getSystemSetting: async (key: string) => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', key).single();
      return data?.value;
  },
  updateSystemSetting: async (key: string, value: any) => {
      await supabase.from('system_settings').upsert({ key, value });
  },
  syncFromBucket: async (target: 'cl' | 'oracy') => {
      return ["Sync not fully implemented."];
  },

  // Local Storage
  local: {
      loadDraft: (): Partial<AppState> => {
          try { return JSON.parse(localStorage.getItem('klepplosen_draft') || '{}'); } catch { return {}; }
      },
      saveDraft: (state: AppState) => {
          localStorage.setItem('klepplosen_draft', JSON.stringify(state));
      },
      clearDraft: () => localStorage.removeItem('klepplosen_draft'),
      getLanguage: (): LanguageForm => (localStorage.getItem('klepplosen_language') as LanguageForm) || 'bokmål',
      setLanguage: (lang: LanguageForm) => localStorage.setItem('klepplosen_language', lang),
      getFavorites: (): string[] => {
          try { return JSON.parse(localStorage.getItem('klepplosen_favorites') || '[]'); } catch { return []; }
      },
      toggleFavorite: (id: string): string[] => {
          const favs = storageService.local.getFavorites();
          const newFavs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
          localStorage.setItem('klepplosen_favorites', JSON.stringify(newFavs));
          return newFavs;
      }
  }
};


import React from 'react';
import { 
  X, Briefcase, Users, MessageSquare, Mic2, 
  Gamepad2, Wand2, Grid3X3, ArrowRight, Dices, 
  Timer, Siren, StopCircle, Ticket, Zap, ListOrdered, 
  Target, CloudRain, BookOpen, ClipboardCheck, LifeBuoy
} from 'lucide-react';
import { 
  BehaviorGuide, QuizGame, StudentTalkGenerator, 
  SeatingChartGenerator, AimMatcher, ProjectPlanner, 
  DifferentiationGenerator, RandomPicker, 
  NoiseMeter, GroupGenerator, TrafficLight, FourCorners, 
  AIGenerator, UnifiedOracyGenerator, SubstitutePlanGenerator,
  CrosswordGenerator, MathHuntGenerator
} from './ToolComponents';
import { TimerComponent } from './CommonComponents';
import { CLStructure } from './types';

interface ClassroomToolsViewProps {
  onBack: () => void;
  t: any;
  dbStructures: CLStructure[];
  language: string;
  currentUser?: any;
  state: any;
  actions: any;
}

export const ClassroomToolsView: React.FC<ClassroomToolsViewProps> = ({ 
  onBack, t, dbStructures, language, currentUser, state, actions 
}) => {
  const activeTool = state.activeToolId;
  const setActiveTool = actions.setActiveToolId;

  const handleBackToTools = () => setActiveTool(null);

  const toolCategories = [
    { 
      id: 'classroom', 
      title: t.catClassroomMgmt, 
      desc: t.catClassroomMgmtDesc, 
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700', 
      tools: [
        { id: 'picker', icon: Dices, title: t.toolPicker, description: t.toolPickerDesc, color: 'bg-white text-indigo-600' },
        { id: 'timer', icon: Timer, title: t.toolTimer, description: t.toolTimerDesc, color: 'bg-white text-amber-600' },
        { id: 'light', icon: StopCircle, title: t.toolLight, description: t.toolLightDesc, color: 'bg-white text-red-500' },
        { id: 'noise', icon: Siren, title: t.toolNoise, description: t.toolNoiseDesc, color: 'bg-white text-rose-600' },
        { id: 'seating_chart', icon: Grid3X3, title: t.toolSeatingChart, description: t.toolSeatingChartDesc, color: 'bg-white text-cyan-600' },
        { id: 'groups', icon: Users, title: t.toolGroups, description: t.toolGroupsDesc, color: 'bg-white text-emerald-600' },
        { id: 'behavior', icon: CloudRain, title: t.toolBehavior, description: t.toolBehaviorDesc, color: 'bg-white text-teal-600' },
      ]
    },
    { 
      id: 'activity', 
      title: t.catActivity, 
      desc: t.catActivityDesc, 
      color: 'bg-amber-50 border-amber-200 text-amber-700', 
      tools: [
        { id: 'math_hunt', icon: Target, title: 'MatteJakt', description: 'Adaptiv mengdetrening', color: 'bg-white text-emerald-600' },
        { id: 'quiz', icon: Gamepad2, title: t.toolQuiz, description: t.toolQuizDesc, color: 'bg-white text-purple-600' },
        { id: 'crossword', icon: Grid3X3, title: 'Kryssord & Ordleter', description: 'Generer pedagogiske spill', color: 'bg-white text-indigo-600' },
        { id: 'corners', icon: Grid3X3, title: t.toolCorners, description: t.toolCornersDesc, color: 'bg-white text-blue-600' },
        { id: 'icebreaker', icon: Zap, title: t.toolIcebreaker, description: t.toolIcebreakerDesc, color: 'bg-white text-cyan-500' },
        { id: 'exit', icon: Ticket, title: t.toolExit, description: t.toolExitDesc, color: 'bg-white text-amber-500' },
        { id: 'debate', icon: MessageSquare, title: t.toolDebate, description: t.toolDebateDesc, color: 'bg-white text-pink-500' },
      ]
    },
    { 
      id: 'oracy', 
      title: t.catOracy, 
      desc: t.catOracyDesc, 
      color: 'bg-pink-50 border-pink-200 text-pink-700', 
      tools: [
        { id: 'alias', icon: Gamepad2, title: t.toolAlias, description: t.toolAliasDesc, color: 'bg-white text-purple-500' },
        { id: 'starters', icon: MessageSquare, title: t.toolStarters, description: t.toolStartersDesc, color: 'bg-white text-pink-600' },
        { id: 'terms', icon: BookOpen, title: t.toolTerms, description: t.toolTermsDesc, color: 'bg-white text-emerald-600' },
        { id: 'roles', icon: Users, title: t.toolRoles, description: t.toolRolesDesc, color: 'bg-white text-amber-600' },
        { id: 'assessment', icon: ClipboardCheck, title: t.toolAssessment, description: t.toolAssessmentDesc, color: 'bg-white text-indigo-600' },
        { id: 'rhetoric', icon: Wand2, title: t.toolRhetoric, description: t.toolRhetoricDesc, color: 'bg-white text-cyan-600' },
      ]
    },
    { 
      id: 'planning', 
      title: t.catPlanning, 
      desc: t.catPlanningDesc, 
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700', 
      tools: [
        { id: 'aim_matcher', icon: Target, title: t.toolAimMatcher, description: t.toolAimMatcherDesc, color: 'bg-white text-rose-600' },
        { id: 'project_planner', icon: Briefcase, title: t.toolProjectPlanner, description: t.toolProjectPlannerDesc, color: 'bg-white text-teal-600' },
        { id: 'task_gen', icon: ListOrdered, title: t.toolTaskGen, description: t.toolTaskGenDesc, color: 'bg-white text-indigo-500' },
        { id: 'differentiator', icon: Users, title: t.toolDifferentiator, description: t.toolDifferentiatorDesc, color: 'bg-white text-blue-600' },
        { id: 'student_talk', icon: Mic2, title: 'Elevsamtale', description: 'Skreddarsydd guide for elevsamtalar', color: 'bg-white text-indigo-600' },
        { id: 'substitute', icon: LifeBuoy, title: t.toolSubstitute, description: t.toolSubstituteDesc, color: 'bg-white text-rose-500' },
      ]
    }
  ];

  // Flatten tools for easy access by ID when rendering active tool
  const allTools = toolCategories.flatMap(c => c.tools);

  if (activeTool) {
    const tool = allTools.find(t => t.id === activeTool);
    // Get initial data if it exists (for loaded plans)
    const initialData = (state.activeToolId === activeTool && state.generatedTask) ? state.generatedTask : null;
    const ToolIcon = tool?.icon;
    
    // Determine if the current user is the owner of the loaded plan
    // If there is no currentPlanId, it's a new session, so they are the "owner" of this session
    const isOwner = !state?.currentPlanId || state?.currentPlanOwnerId === currentUser?.id;
    
    return (
      <div className="w-full flex flex-col space-y-6 animate-in slide-in-from-right-8 pb-20">
        <div className="flex items-center justify-between no-print px-2">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl shadow-lg ${tool?.color}`}>{ToolIcon && <ToolIcon size={24}/>}</div>
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{tool?.title}</h2>
                <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">{tool?.description}</p>
            </div>
          </div>
          <button onClick={handleBackToTools} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-95"><X size={20}/></button>
        </div>
        <div className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-slate-50 min-h-[500px]">
          {activeTool === 'math_hunt' && <MathHuntGenerator t={t} language={language} currentUser={currentUser} />}
          {activeTool === 'behavior' && <BehaviorGuide t={t} language={language} />}
          {activeTool === 'quiz' && <QuizGame t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'crossword' && <CrosswordGenerator t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'student_talk' && <StudentTalkGenerator t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'seating_chart' && <SeatingChartGenerator t={t} />}
          {activeTool === 'aim_matcher' && <AimMatcher dbStructures={dbStructures} t={t} />}
          {activeTool === 'project_planner' && <ProjectPlanner t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'differentiator' && <DifferentiationGenerator t={t} language={language} />}
          {activeTool === 'picker' && <RandomPicker t={t} />}
          {activeTool === 'timer' && <div className="flex justify-center items-center py-10"><TimerComponent t={t} /></div>}
          {activeTool === 'noise' && <NoiseMeter t={t} language={language} />}
          {activeTool === 'groups' && <GroupGenerator t={t} />}
          {activeTool === 'light' && <TrafficLight t={t} />}
          {activeTool === 'corners' && <FourCorners t={t} language={language} />}
          {activeTool === 'substitute' && <SubstitutePlanGenerator t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'task_gen' && <AIGenerator type="general_tasks" placeholder={t.themePlaceholder} icon={ListOrdered} color="bg-indigo-100" t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'exit' && <AIGenerator type="exit_ticket" placeholder={t.themePlaceholder} icon={Ticket} color="bg-amber-100" t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'icebreaker' && <AIGenerator type="icebreaker" placeholder={t.themePlaceholder} icon={Zap} color="bg-cyan-100" t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {activeTool === 'debate' && <AIGenerator type="debater" placeholder={t.themePlaceholder} icon={MessageSquare} color="bg-pink-100" t={t} language={language} currentUser={currentUser} isOwner={isOwner} initialData={initialData} currentPlanId={state.currentPlanId} />}
          {['starters', 'alias', 'terms', 'roles', 'assessment', 'rhetoric'].includes(activeTool) && (
              <UnifiedOracyGenerator 
                type={activeTool} 
                t={t} 
                language={language} 
                currentUser={currentUser} 
                initialData={initialData}
                isOwner={isOwner}
                currentPlanId={state.currentPlanId}
              />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20 w-full">
      <div className="flex justify-between items-center px-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
          <ArrowRight className="rotate-180" size={18} /> {t.back}
        </button>
      </div>

      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-3 text-amber-500 border border-slate-50">
           <Briefcase size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{t.toolsBox}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{t.toolsBoxSub}</p>
      </div>

      <div className="space-y-8">
        {toolCategories.map(cat => (
          <div key={cat.id} className="space-y-3">
            <div className={`mx-4 p-3 rounded-2xl border ${cat.color} flex flex-row items-center gap-4`}>
                <h3 className="font-black uppercase tracking-tight text-sm ml-2">{cat.title}</h3>
                <div className="h-4 w-px bg-current opacity-20"></div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 truncate">{cat.desc}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4">
              {cat.tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button 
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="group bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex items-center gap-3 relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 transition-transform group-hover:scale-110 ${tool.color} border border-slate-100`}>
                      <ToolIcon size={20} />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-0.5 group-hover:text-indigo-600 transition-colors truncate">{tool.title}</h4>
                        <p className="text-[9px] font-medium text-slate-400 leading-tight line-clamp-1">{tool.description}</p>
                    </div>
                    
                    <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

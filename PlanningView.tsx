
import React from 'react';
import { ChevronLeft, Check, Loader2, Ship } from 'lucide-react';
import { PlanningStep1 } from './views/planning/PlanningStep1';
import { PlanningStep2 } from './views/planning/PlanningStep2';
import { PlanningStep3 } from './views/planning/PlanningStep3';
import { PlanningResult } from './PlanningResult';
import { AppState, CLStructure, SavedPlan } from './types';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';

interface PlanningViewProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    planningStep: number;
    setPlanningStep: (step: number) => void;
    t: any;
    onBack: () => void;
    onFindAims: () => void;
    onSelectAims: (aims?: any) => void;
    onGenerateTask: (id: string) => void;
    onSave: (isShared: boolean) => void;
    dbStructures: CLStructure[];
    actions: any;
    saveStatus: { type: 'idle' | 'private' | 'shared', message: string | null };
    currentUser: any;
    myPlans?: SavedPlan[];
    availableSubjects?: any[];
}

export const PlanningView: React.FC<PlanningViewProps> = ({ 
    state, setState, planningStep, setPlanningStep, t, 
    onBack, onFindAims, onSelectAims, onGenerateTask, 
    onSave, dbStructures, actions, saveStatus, currentUser, myPlans = [], availableSubjects = []
}) => {
  const { handleImageUpload, removeImage, setActiveToolId } = actions;

  // Show loading screen if generating or fetching aims
  if (state.generatingTask || state.fetchingAims) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                <Card className="relative z-10 border-indigo-50" noPadding>
                    <div className="p-8">
                        <Ship size={64} className="text-indigo-600 animate-bounce" />
                    </div>
                </Card>
            </div>
            <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {state.fetchingAims ? "Henter kompetansemål..." : "Kai klekker ut planen..."}
                </h2>
                <div className="flex items-center justify-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm mx-auto w-fit">
                    <Loader2 size={14} className="animate-spin" />
                    <span>{state.fetchingAims ? "Søker i UDIRs databaser" : "Kobler fag, mål og metode"}</span>
                </div>
                {!state.fetchingAims && (
                    <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed pt-4 italic">
                        "Visste du at CL-strukturer øker elevaktiviteten med opptil 80% sammenlignet med tradisjonell undervisning?"
                    </p>
                )}
            </div>
        </div>
    );
  }

  if (planningStep === 4 && state.generatedTask) {
    return (
        <PlanningResult 
            state={state} 
            setState={setState} 
            t={t} 
            onSave={onSave} 
            saveStatus={saveStatus} 
            dbStructures={dbStructures || []}
            currentUser={currentUser}
            onOpenTool={setActiveToolId}
        />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-right-8 pb-20 max-w-full overflow-x-hidden">
      <div className="px-2 sm:px-4">
        <Button onClick={onBack} variant="ghost" size="sm" icon={ChevronLeft} className="pl-2">
          {t.back}
        </Button>
      </div>

      {/* Progress Bar - Responsive scaling */}
      <div className="px-4 no-print">
        <div className="flex justify-between items-center max-w-md mx-auto mb-6 sm:mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 sm:h-1 bg-slate-200 -z-10 rounded-full"></div>
            {[1, 2, 3, 4].map(step => (
                <div key={step} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-500 border-2 sm:border-4 ${planningStep >= step ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                    {step < planningStep ? <Check size={16} strokeWidth={4} /> : step}
                </div>
            ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
        {planningStep === 1 && (
            <PlanningStep1 
                state={state} 
                setState={setState} 
                t={t} 
                onNext={onFindAims} 
                handleImageUpload={handleImageUpload} 
                removeImage={removeImage} 
                myPlans={myPlans}
                availableSubjects={availableSubjects}
            />
        )}
        {planningStep === 2 && (
            <PlanningStep2 
                state={state} 
                setState={setState} 
                t={t} 
                onNext={onSelectAims} 
            />
        )}
        {planningStep === 3 && (
            <PlanningStep3 
                state={state} 
                setState={setState} 
                dbStructures={dbStructures || []} 
                t={t} 
                onNext={onGenerateTask} 
            />
        )}
      </div>
    </div>
  );
};

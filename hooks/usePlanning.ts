
import { useState, useEffect } from 'react';
import { AppState, CLStructure, SavedPlan } from '../types';
import { storageService } from '../services/storageService';
import { generateCLTask, recommendStructures } from '../services/aiPlanningService';
import { fetchCompetenceAims } from '../services/aiCurriculumService';
import { CL_FACTS } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_STATE: AppState = {
  languageForm: 'bokmål',
  subject: '',
  grade: '5. trinn',
  topic: '',
  uploadedImages: [],
  aims: [],
  selectedAims: [],
  recommendedStructureIds: [],
  recommendationReasons: {},
  isFetchingRecommendations: false,
  selectedStructureId: null,
  generatedTask: null,
  generatingTask: false,
  fetchingAims: false,
  currentPlanId: null,
  currentPlanOwnerId: null,
  isViewingArchived: false,
  activeToolId: null,
  options: {
    generateWorksheet: false,
    worksheetAmount: 5,
    generateRubric: false,
    rubricCriteria: 4,
    includeOracy: false,
    learningGoalsAmount: 3,
    differentiationLevel: 'standard'
  }
};

export const usePlanning = (dbStructures: CLStructure[]) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [state, setState] = useState<AppState>(() => {
      const draft = storageService.local.loadDraft();
      const savedLang = storageService.local.getLanguage();
      return { 
          ...INITIAL_STATE, 
          ...draft,
          languageForm: savedLang
      };
  });

  const [loadingFact, setLoadingFact] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'private' | 'shared', message: string | null }>({ type: 'idle', message: null });
  const [planningStep, setPlanningStep] = useState(1);

  // Auto-save draft
  useEffect(() => {
      if (!state.isViewingArchived) {
          storageService.local.saveDraft(state);
      }
      if (state.languageForm) {
          storageService.local.setLanguage(state.languageForm);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.subject, state.grade, state.topic, state.generatedTask, state.selectedAims, state.options, state.languageForm, state.isViewingArchived]);

  const findAims = async () => {
      if (!state.subject || !state.topic) return;
      
      setState(s => ({ ...s, fetchingAims: true }));
      setLoadingFact("Leiter etter kompetansemål...");
      
      try {
          let dbAims: string[] = [];
          try {
             const fromDb = await storageService.getCompetenceAims(state.subject, state.grade);
             if (fromDb.length > 0) {
                 dbAims = fromDb.map(a => a.text);
             }
          } catch (e) { console.warn("DB fetch failed", e); }

          const aims = await fetchCompetenceAims(state.subject, state.grade, state.topic, state.languageForm, dbAims);
          setState(s => ({ ...s, aims, fetchingAims: false }));
          setPlanningStep(2);
      } catch (e) {
          addToast("Kunne ikke hente mål. Prøv igjen.", 'error');
          setState(s => ({ ...s, fetchingAims: false }));
      }
  };

  const selectAimsAndGoToStructure = async (aims?: any) => {
    const validAims = Array.isArray(aims) ? aims : state.selectedAims;
    
    // Immediate state update to move to next step
    setState(s => ({ 
        ...s, 
        selectedAims: validAims,
        isFetchingRecommendations: true, // Start loading indicator
        recommendedStructureIds: [], // Clear old
        recommendationReasons: {} 
    }));
    setPlanningStep(3);

    // AI Recommendation Logic
    if (dbStructures.length > 0) {
        try {
            const recommendations = await recommendStructures(
                state.subject, 
                state.topic, 
                validAims, 
                dbStructures, 
                state.languageForm
            );

            const recIds = recommendations.map(r => r.id);
            const reasons = recommendations.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.reason }), {});

            setState(s => ({ 
                ...s, 
                recommendedStructureIds: recIds,
                recommendationReasons: reasons,
                isFetchingRecommendations: false
            }));
        } catch (e) {
            console.error("Failed to fetch recommendations", e);
            setState(s => ({ ...s, isFetchingRecommendations: false }));
        }
    } else {
        setState(s => ({ ...s, isFetchingRecommendations: false }));
    }
  };

  const generateFinalTask = async (id: string) => {
    const structure = dbStructures.find(s => s.id === id);
    if (!structure) return;
    setSaveStatus({ type: 'idle', message: null }); 
    setState(s => ({ ...s, generatingTask: true, selectedStructureId: id, currentPlanId: null, currentPlanOwnerId: null, isViewingArchived: false }));
    setLoadingFact(CL_FACTS[Math.floor(Math.random() * CL_FACTS.length)]);
    try {
      const task = await generateCLTask(
        state.subject, 
        state.grade, 
        state.topic, 
        state.selectedAims, 
        structure, 
        state.uploadedImages,
        state.languageForm, 
        state.options
      );
      setState(s => ({ ...s, generatedTask: task, generatingTask: false }));
      setPlanningStep(4);
    } catch (e: any) { 
      console.error("Feil under generering:", e);
      addToast("Feil under generering: " + e.message, 'error');
      setState(s => ({ ...s, generatingTask: false })); 
    }
  };

  const saveToArchive = async (isShared: boolean) => {
      if (!state.generatedTask) return;
      
      if (!currentUser) {
          addToast("Du må logge inn for å lagre i kista.", 'info');
          return;
      }
      
      const isUpdate = state.currentPlanId && state.currentPlanOwnerId === currentUser.id;
      
      const plan: SavedPlan = {
          id: isUpdate ? state.currentPlanId! : crypto.randomUUID(),
          task: state.generatedTask,
          subject: state.subject,
          grade: state.grade,
          topic: state.topic,
          date: new Date().toLocaleDateString('no-NO'),
          creator: currentUser.name,
          creatorId: currentUser.id,
          isShared,
          isImported: false,
      };
      
      try {
          await storageService.savePlan(plan);
          setSaveStatus({ type: isShared ? 'shared' : 'private', message: isUpdate ? 'Oppdatert!' : 'Lagret i kista!' });
          addToast(isUpdate ? 'Plan oppdatert!' : 'Lagret i kista!', 'success');
          
          if (!isUpdate) {
              setState(s => ({ ...s, currentPlanId: plan.id, currentPlanOwnerId: currentUser.id }));
          }
          
          // Clear draft only on successful NEW save
          if (!isUpdate) storageService.local.clearDraft();
          
          setTimeout(() => setSaveStatus({ type: 'idle', message: null }), 3000);
          return plan;
      } catch (e) {
          addToast("Kunne ikke lagre planen.", 'error');
          return null;
      }
  };

  const loadArchivedPlan = (plan: SavedPlan) => {
      setState(s => ({
          ...s,
          generatedTask: plan.task || null,
          subject: plan.subject,
          grade: plan.grade,
          topic: plan.topic,
          currentPlanId: plan.id,
          currentPlanOwnerId: plan.creatorId,
          isViewingArchived: true,
          activeToolId: (plan.task?.planType === 'tool' || plan.task?.planType === 'quiz') ? (plan.task?.toolType || null) : (plan.task?.planType === 'project' ? 'project_planner' : null)
      }));
      
      const isTool = plan.task?.planType === 'tool' || plan.task?.planType === 'quiz' || plan.task?.planType === 'project';
      if (!isTool) setPlanningStep(4);
      
      return isTool;
  };

  const handleImageUpload = (files: FileList) => {
      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              setState(s => ({...s, uploadedImages: [...s.uploadedImages, { data: base64, mimeType: file.type, name: file.name }]}));
          };
          reader.readAsDataURL(file);
      });
  };

  const removeImage = (i: number) => setState(s => ({...s, uploadedImages: s.uploadedImages.filter((_, idx) => idx !== i)}));

  return {
      state, setState,
      planningStep, setPlanningStep,
      loadingFact, saveStatus,
      findAims, selectAimsAndGoToStructure, generateFinalTask, saveToArchive,
      handleImageUpload, removeImage, loadArchivedPlan
  };
};

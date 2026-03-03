
import { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from './services/storageService';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { usePlanning } from './hooks/usePlanning';
import { useArchive } from './hooks/useArchive';
import { useGlobalData } from './hooks/useGlobalData';
import { useAdmin } from './hooks/useAdmin';

export const useAppLogic = () => {
  const { currentUser, isGuestMode, signOut, updateUser, signIn } = useAuth();
  const { addToast } = useToast();

  // Navigation State
  const [view, setView] = useState('menu');

  // Global Data & Admin Hooks
  const { 
    dbStructures, dbOracyResources, availableSubjects, 
    refreshStructures, refreshOracy, refreshSubjects 
  } = useGlobalData();

  const { 
    isImporting, importLogs, importProgress, handleAdminFileUpload 
  } = useAdmin(refreshStructures, refreshOracy);

  // --- Sub-Hooks ---
  const planning = usePlanning(dbStructures);
  const archive = useArchive();

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      storageService.logAnalytics('visit');
      await refreshStructures();
      await refreshOracy();
      await refreshSubjects();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setView('menu');
  }, [signOut, setView]);

  const updateName = useCallback(async (newName: string) => {
      if (!currentUser) return;
      await storageService.updateUserName(currentUser.id, newName);
      updateUser({ name: newName });
      addToast("Navn oppdatert", 'success');
  }, [currentUser, updateUser, addToast]);

  // Bridge function: When saving a plan, we also want to refresh the archive list
  const handleSaveToArchive = useCallback(async (isShared: boolean) => {
      const plan = await planning.saveToArchive(isShared);
      if (plan) {
          archive.refreshPlans(currentUser?.id);
      }
  }, [planning, archive, currentUser?.id]);

  // Bridge function: When loading a plan from archive, we update planning state and change view
  const handleLoadArchivedPlan = useCallback((plan: any) => {
      const isTool = planning.loadArchivedPlan(plan);
      if (isTool) {
          setView('tools');
      } else {
          setView('plan');
      }
  }, [planning, setView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('id');
    if (planId && !planning.state.currentPlanId) {
        const loadPlan = async () => {
            const plan = await storageService.getPlanById(planId);
            if (plan) {
                handleLoadArchivedPlan(plan);
            }
        };
        loadPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo(() => ({
      logout, updateName, updatePassword: storageService.updateUserPassword,
      findAims: planning.findAims, 
      selectAimsAndGoToStructure: planning.selectAimsAndGoToStructure, 
      generateFinalTask: planning.generateFinalTask, 
      saveToArchive: handleSaveToArchive,
      toggleShare: archive.toggleShare, 
      toggleLike: archive.toggleLike, 
      deletePlan: archive.deletePlan, 
      loadArchivedPlan: handleLoadArchivedPlan,
      fetchAdminStats: storageService.getSystemStats,
      handleImageUpload: planning.handleImageUpload, 
      removeImage: planning.removeImage, 
      refreshPlans: archive.refreshPlans,
      handleAdminFileUpload,
      setActiveToolId: (id: string | null) => planning.setState(s => ({ ...s, activeToolId: id }))
  }), [planning, archive, logout, updateName, handleSaveToArchive, handleLoadArchivedPlan, handleAdminFileUpload]);

  return {
    currentUser, 
    isGuestMode,
    signIn,
    view, setView, 
    planningStep: planning.planningStep, 
    setPlanningStep: planning.setPlanningStep,
    archiveTab: archive.archiveTab, 
    setArchiveTab: archive.setArchiveTab, 
    archiveSearch: archive.archiveSearch, 
    setArchiveSearch: archive.setArchiveSearch, 
    isLoadingArchive: archive.isLoadingArchive,
    state: planning.state, 
    setState: planning.setState, 
    loadingFact: planning.loadingFact, 
    actions,
    communityPlans: archive.communityPlans, 
    myPlans: archive.myPlans, 
    dbStructures, dbOracyResources, availableSubjects,
    isImporting, importLogs, importProgress, 
    saveStatus: planning.saveStatus, 
    refreshStructures, refreshSubjects,
    enterGuestMode: useAuth().enterGuestMode,
    acceptDisclaimer: useAuth().acceptDisclaimer,
    disclaimerAccepted: useAuth().disclaimerAccepted
  };
};

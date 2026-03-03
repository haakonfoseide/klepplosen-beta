
import { useState, useEffect } from 'react';
import { SavedPlan } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const useArchive = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [archiveTab, setArchiveTab] = useState<'mine' | 'shared'>('mine');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [communityPlans, setCommunityPlans] = useState<SavedPlan[]>([]);
  const [myPlans, setMyPlans] = useState<SavedPlan[]>([]);

  const refreshPlans = async (userId?: string) => {
    setIsLoadingArchive(true);
    try {
        if (userId) {
          const mine = await storageService.getMyPlans(userId);
          setMyPlans(mine);
        }
        const shared = await storageService.getCommunityPlans();
        setCommunityPlans(shared);
    } catch (e) {
        console.error("Failed to refresh plans", e);
    } finally {
        setIsLoadingArchive(false);
    }
  };

  useEffect(() => {
    refreshPlans(currentUser?.id);
  }, [currentUser]);

  const toggleShare = async (p: SavedPlan) => { 
      try {
          await storageService.toggleShare(p.id, !p.isShared); 
          await refreshPlans(currentUser?.id); 
          addToast(p.isShared ? "Planen er nå privat" : "Planen er delt!", 'success');
      } catch (e) { addToast("Feil ved deling.", 'error'); }
  };

  const toggleLike = async (p: SavedPlan) => { 
      if(currentUser) { 
          try {
              await storageService.toggleLike(p.id, currentUser.id); 
              refreshPlans(currentUser?.id); 
          } catch (e) { console.error(e); }
      } 
  };

  const deletePlan = async (id: string) => { 
      try {
          await storageService.deletePlan(id); 
          await refreshPlans(currentUser?.id); 
          addToast("Plan slettet", 'info');
      } catch (e) { addToast("Kunne ikke slette.", 'error'); }
  };

  return {
      archiveTab, setArchiveTab,
      archiveSearch, setArchiveSearch,
      isLoadingArchive,
      communityPlans, myPlans,
      refreshPlans, toggleShare, toggleLike, deletePlan
  };
};

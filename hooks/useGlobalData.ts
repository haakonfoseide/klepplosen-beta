
import { useState, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { CLStructure, OracyResource, Subject } from '../types';

export const useGlobalData = () => {
  const [dbStructures, setDbStructures] = useState<CLStructure[]>([]);
  const [dbOracyResources, setDbOracyResources] = useState<OracyResource[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const refreshStructures = useCallback(async () => {
    const structures = await storageService.getCLStructures();
    setDbStructures(structures);
  }, []);

  const refreshOracy = useCallback(async () => {
    const resources = await storageService.getOracyResources();
    setDbOracyResources(resources);
  }, []);

  const refreshSubjects = useCallback(async () => {
    try {
      const subjects = await storageService.getUniqueSubjects();
      setAvailableSubjects(subjects);
    } catch (e) {
      console.error("Failed to load subjects", e);
    }
  }, []);

  return {
    dbStructures,
    dbOracyResources,
    availableSubjects,
    refreshStructures,
    refreshOracy,
    refreshSubjects
  };
};

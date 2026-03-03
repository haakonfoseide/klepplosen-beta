
import { useState, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { CLStructure } from '../types';
import { useToast } from '../contexts/ToastContext';

export const useAdmin = (refreshStructures: () => Promise<void>, refreshOracy: () => Promise<void>) => {
  const { addToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: 'idle' });

  const handleAdminFileUpload = useCallback(async (files: FileList | null, target: 'cl' | 'oracy') => {
    if (!files || files.length === 0) return;
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: files.length, status: 'Analyserer fil...' });
    const logs: string[] = [];

    try {
      const file = files[0];
      const text = await file.text();
      let data = JSON.parse(text);
      
      if (!Array.isArray(data) && data.structures) data = data.structures;
      if (!Array.isArray(data) && data.resources) data = data.resources;
      if (!Array.isArray(data)) throw new Error("Filen må inneholde en liste med objekter (Array).");

      setImportProgress({ current: 0, total: data.length, status: 'Laster opp...' });
      
      if (target === 'cl') {
        const structures: CLStructure[] = data.map((d: any) => ({
          id: d.id || d.name?.toLowerCase().replace(/\s+/g, '-') || crypto.randomUUID(),
          name: d.name,
          description: d.description,
          category: d.category || 'annet',
          setupTime: d.setupTime || d.setup_time || 'rask',
          groupSize: d.groupSize || d.group_size || 'par',
          durationMinutes: d.durationMinutes || d.duration_minutes || 15,
          steps: d.steps || [],
          studentInstructions: d.studentInstructions || d.student_instructions || [],
          tips: d.tips || [],
          bestFor: d.bestFor || d.best_for || [],
          subjects: d.subjects || ['Alle'],
          illustrationType: d.illustrationType || d.illustration_type,
          translations: d.translations,
          popularity: d.popularity || 0
        }));

        await storageService.bulkImportCLStructures(structures);
        logs.push(`Suksess: Importerte ${structures.length} CL-strukturer.`);
        await refreshStructures();
      } else if (target === 'oracy') {
        const resources = data.map((d: any) => ({
          id: d.id || crypto.randomUUID(),
          category: d.category || 'general',
          type: d.type || 'content',
          content: d.content || d
        }));

        await storageService.bulkImportOracyResources(resources);
        logs.push(`Suksess: Importerte ${resources.length} Oracy-ressurser.`);
        await refreshOracy();
      }

      setImportProgress({ current: data.length, total: data.length, status: 'Ferdig!' });
      addToast("Import fullført!", 'success');
    } catch (e: any) {
      console.error(e);
      logs.push(`Feil: ${e.message}`);
      setImportProgress({ current: 0, total: 0, status: 'Feilet' });
      addToast("Feil ved import: " + e.message, 'error');
    } finally {
      setImportLogs(logs);
      setIsImporting(false);
    }
  }, [addToast, refreshStructures, refreshOracy]);

  return {
    isImporting,
    importLogs,
    importProgress,
    handleAdminFileUpload
  };
};

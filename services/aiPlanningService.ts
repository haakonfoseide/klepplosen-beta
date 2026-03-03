
import { Type } from "@google/genai";
import { GeneratedTask, CLStructure, CompetenceAim } from "../types";
import { generateContentWithRetry, parseResponse } from "./aiUtils";
import { PROMPTS } from "./prompts";

export async function recommendStructures(subject: string, topic: string, aims: CompetenceAim[], structures: CLStructure[], language: string): Promise<{id: string, reason: string}[]> {
    const structureLite = structures.map(s => ({ id: s.id, name: s.name, desc: s.description, cat: s.category }));
    const aimsText = aims.map(a => a.text).join("; ");

    const prompt = PROMPTS.RECOMMEND_STRUCTURES(subject, topic, aimsText, structureLite, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ['id', 'reason']
                }
            }
        });
        return parseResponse(res.text) || [];
    } catch (e) {
        console.error("AI recommendation failed", e);
        return [];
    }
}

export async function remixTask(originalTask: GeneratedTask, mode: 'simplify' | 'active' | 'critical' | 'creative' | 'differentiation', language: string): Promise<GeneratedTask> {
    const prompt = PROMPTS.REMIX_TASK(originalTask, mode, language);

    const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, {
        responseMimeType: 'application/json'
    });

    const parsed = parseResponse(res.text);
    if (!parsed) throw new Error("Kunne ikke remixe oppgaven (AI-feil).");
    return { ...originalTask, ...parsed };
}

export async function generateSubstitutePlan(config: any, language: string, availableAims: string[] = []): Promise<any> {
  let aimsContext = "";
  if (availableAims && availableAims.length > 0) {
      aimsContext = `Vi har følgende kompetansemål lagret i databasen for dette trinnet. VELG 1-2 relevante mål fra denne listen som passer til temaet "${config.topic}":
      ${JSON.stringify(availableAims)}`;
  } else {
      aimsContext = `Søk opp og finn 1-2 relevante kompetansemål fra LK20 (UDIR) som passer for dette faget og trinnet.`;
  }

  const prompt = PROMPTS.SUBSTITUTE_PLAN(config, language, aimsContext);

  const configObj: any = {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.OBJECT,
        properties: {
            competenceAims: { type: Type.ARRAY, items: { type: Type.STRING } },
            messageToSubstitute: { type: Type.STRING },
            activities: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        duration: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ['duration', 'title', 'description']
                }
            },
            backupPlan: { type: Type.STRING }
        },
        required: ['competenceAims', 'messageToSubstitute', 'activities', 'backupPlan']
    }
  };

  // Enable Google Search only if we need to fetch aims externally
  if (!availableAims || availableAims.length === 0) {
      configObj.tools = [{ googleSearch: {} }];
  }

  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, configObj);
  return parseResponse(res.text);
}

export async function generateCLTask(subject: string, grade: string, topic: string, aims: CompetenceAim[], structure: CLStructure, images: any[], language: string, options: any): Promise<GeneratedTask> {
  const aimsList = Array.isArray(aims) ? aims : [];
  const aimsText = aimsList.map(a => a.text).join(', ');
  const stepsText = Array.isArray(structure?.steps) ? structure.steps.join(', ') : '';
  const goalAmount = options.learningGoalsAmount || 3;

  // Determine complexity based on differentiation level
  const diffLevel = options.differentiationLevel || 'standard';
  const diffInstruction = diffLevel === 'support' 
      ? "Target group: Students needing extra support. Use simple language, short sentences, more scaffolding, and concrete examples."
      : diffLevel === 'challenge'
      ? "Target group: High-achieving students. Use advanced vocabulary, open-ended questions, and require critical thinking and deeper analysis."
      : "Target group: Standard mixed-ability class.";

  const prompt = PROMPTS.GENERATE_CL_TASK(subject, grade, topic, diffInstruction, aimsText, goalAmount, options, language, structure, stepsText);

  const promptParts: any[] = [{ text: prompt }];
  if (images) images.forEach(img => promptParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  
  const res = await generateContentWithRetry('gemini-3.1-pro-preview', promptParts, { 
      responseMimeType: 'application/json'
  });
  
  const parsed = parseResponse(res.text);
  
  if (!parsed) {
      throw new Error("AI genererte et ugyldig svar (JSON parse error). Prøv igjen.");
  }
  
  // Robust fallback logic
  return { 
      ...parsed, 
      clStructureId: structure.id,
      competenceAims: aimsList.map(a => a.text),
      learningGoals: parsed.learningGoals || ["Kunne ikke generere mål."],
      studentTask: parsed.studentTask || ["Kunne ikke generere oppdrag."],
      teacherTips: parsed.teacherTips || ["Ingen tips generert."],
      studentMaterials: parsed.studentMaterials || ["Vanlig skrivesaker"],
      worksheetQuestions: parsed.worksheetQuestions || [],
      printableMaterial: parsed.printableMaterial || null, 
      oracyTips: parsed.oracyTips || [],
      answerKey: parsed.answerKey || [],
      instructions: parsed.instructions || structure.steps,
      differentiatedTasks: parsed.differentiatedTasks
  };
}

export async function generateProjectPlan(subject: string, grade: string, topic: string, product: string, language: string): Promise<any> {
  const prompt = PROMPTS.PROJECT_PLAN(subject, grade, topic, product, language);
  
  const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, { 
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        competenceAims: { type: Type.ARRAY, items: { type: Type.STRING } },
        studentTask: { type: Type.ARRAY, items: { type: Type.STRING } },
        productRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        assessmentRubric: { 
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              criteria: { type: Type.STRING },
              low: { type: Type.STRING },
              medium: { type: Type.STRING },
              high: { type: Type.STRING }
            },
            required: ['criteria', 'low', 'medium', 'high']
          }
        }
      },
      required: ['title', 'description', 'competenceAims', 'studentTask', 'productRequirements', 'assessmentRubric']
    }
  });
  return parseResponse(res.text);
}

export async function generateDifferentiation(task: string, subject: string, grade: string, images: any[], language: string): Promise<{ low: string, medium: string, high: string }> {
  const promptParts: any[] = [{ text: PROMPTS.DIFFERENTIATION(task, subject, grade, language) }];
  if (images) images.forEach(img => promptParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  
  const res = await generateContentWithRetry('gemini-3-flash-preview', promptParts, { 
    responseMimeType: 'application/json',
    responseSchema: {
        type: Type.OBJECT,
        properties: {
            low: { type: Type.STRING },
            medium: { type: Type.STRING },
            high: { type: Type.STRING }
        },
        required: ['low', 'medium', 'high']
    }
  });
  return parseResponse(res.text) || { low: '', medium: '', high: '' };
}

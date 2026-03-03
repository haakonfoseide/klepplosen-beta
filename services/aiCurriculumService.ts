
import { Type } from "@google/genai";
import { CompetenceAim } from "../types";
import { generateContentWithRetry, parseResponse } from "./aiUtils";
import { PROMPTS } from "./prompts";

export async function fetchSubjectCodeFromUDIR(subject: string): Promise<string> {
  const prompt = PROMPTS.SUBJECT_CODE(subject);

  try {
    const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }]
    });
    const data = parseResponse(res.text);
    return data?.code || "Ukjent kode";
  } catch (e) {
    console.error("Klarte ikke hente fagkode", e);
    return "";
  }
}

export async function fetchCompetenceAims(subject: string, grade: string, topic: string, language: string, dbAims?: string[]): Promise<CompetenceAim[]> {
  let prompt = "";
  let tools = undefined;

  if (dbAims && dbAims.length > 0) {
      prompt = PROMPTS.COMPETENCE_AIMS_DB(subject, grade, dbAims, topic, language);
  } else {
      prompt = PROMPTS.COMPETENCE_AIMS_SEARCH(subject, grade, topic, language);
      tools = [{ googleSearch: {} }];
  }

  try {
    const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
        responseMimeType: 'application/json',
        tools: tools
    });
    const data = parseResponse(res.text);
    return Array.isArray(data) ? data : data?.aims || [];
  } catch (e) { return []; }
}

export async function fetchAllSubjectAims(subject: string): Promise<{ grade: string, aims: string[] }[]> {
  const prompt = PROMPTS.ALL_SUBJECT_AIMS(subject);

  const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, { 
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        levels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              grade: { type: Type.STRING },
              aims: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['grade', 'aims']
          }
        }
      },
      required: ['levels']
    }
  });

  return parseResponse(res.text)?.levels || [];
}

export async function compareAimsWithCurriculum(subject: string, currentData: {grade: string, aims: string[]}[]): Promise<{ grade: string, status: 'unchanged' | 'updated' | 'new', currentAims: string[], proposedAims: string[], diffNote?: string }[]> {
  const prompt = PROMPTS.COMPARE_AIMS(subject, currentData);

  const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, { 
    tools: [{ googleSearch: {} }],
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        comparisons: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              grade: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['unchanged', 'updated', 'new'] },
              currentAims: { type: Type.ARRAY, items: { type: Type.STRING } },
              proposedAims: { type: Type.ARRAY, items: { type: Type.STRING } },
              diffNote: { type: Type.STRING }
            },
            required: ['grade', 'status', 'currentAims', 'proposedAims']
          }
        }
      },
      required: ['comparisons']
    }
  });

  return parseResponse(res.text)?.comparisons || [];
}

export async function adaptAimsForGrade(aims: string[], targetGrade: string, language: string): Promise<string[]> {
    const prompt = PROMPTS.ADAPT_AIMS(aims, targetGrade, language);

    const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    });

    return parseResponse(res.text) || [];
}

export async function fetchAllCompetenceAims(subject: string, grade: string): Promise<string[]> {
  const prompt = PROMPTS.ALL_COMPETENCE_AIMS(subject, grade);
  try {
    const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    });
    return parseResponse(res.text) || [];
  } catch (e) { return []; }
}

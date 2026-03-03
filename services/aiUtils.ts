
import { GoogleGenAI } from "@google/genai";

// Singleton instance to prevent multiple initializations
let aiClientInstance: GoogleGenAI | null = null;

export const getAIClient = (): GoogleGenAI => {
  if (!aiClientInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClientInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClientInstance;
};

// Helper to parse JSON from response safely
export const parseResponse = (text: string | undefined): any | null => {
  if (!text) return null;
  
  try {
    // 1. Try direct parsing first
    return JSON.parse(text);
  } catch (e) {
    // 2. Fallback: Clean up markdown code blocks
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      // 3. Deep extraction: Find the first '{' or '[' and the last '}' or ']'
      try {
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        
        let startIdx = -1;
        let endIdx = -1;

        // Determine if Object or Array starts first
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIdx = firstBrace;
            endIdx = text.lastIndexOf('}');
        } else if (firstBracket !== -1) {
            startIdx = firstBracket;
            endIdx = text.lastIndexOf(']');
        }

        if (startIdx !== -1 && endIdx !== -1) {
            const jsonSubstring = text.substring(startIdx, endIdx + 1);
            return JSON.parse(jsonSubstring);
        }
      } catch (e3) {
        console.error("Critical: Failed to parse JSON response from AI.", e3);
        console.debug("Raw text was:", text);
      }
    }
  }
  return null;
};

export const generateContentWithRetry = async (model: string, prompt: any, config: any = {}, retries = 2) => {
  const ai = getAIClient();
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: typeof prompt === 'string' ? prompt : { parts: Array.isArray(prompt) ? prompt : [prompt] },
        config
      });
      return response;
    } catch (e) {
      console.warn(`AI request failed (Attempt ${i + 1}/${retries}). Retrying...`, e);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("AI Service Failed after retries");
};

export async function checkAIHealth(): Promise<{ status: 'ok' | 'error', latency: number, message?: string }> {
  const start = Date.now();
  try { 
    const ai = getAIClient();
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'Ping' }); 
    return { status: 'ok', latency: Date.now() - start }; 
  } 
  catch (e: any) { return { status: 'error', latency: 0, message: e.message }; }
}

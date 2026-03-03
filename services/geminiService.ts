
import { generateContentWithRetry, parseResponse } from "./aiUtils";
import { Type } from "@google/genai";
import { PROMPTS } from "./prompts";

// Re-export other services
export * from './aiUtils';
export * from './aiCurriculumService';
export * from './aiPlanningService';
export * from './aiToolsService';

// Lesson Study specific functions

export async function analyzeLessonStudyObservation(prediction: string, observation: string, description: string, language: string): Promise<{analysis: string, advice: string}> {
    const prompt = PROMPTS.ANALYZE_LESSON_STUDY(prediction, observation, description, language);

    try {
        const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    advice: { type: Type.STRING }
                }
            }
        });
        return parseResponse(res.text) || { analysis: "Kunne ikke analysere.", advice: "Ingen råd." };
    } catch (e) {
        return { analysis: "Feil ved analyse.", advice: "Prøv igjen." };
    }
}

export async function generateLessonStudyQuestions(subject: string, topic: string, grade: string, language: string): Promise<string[]> {
    const prompt = PROMPTS.LESSON_STUDY_QUESTIONS(subject, topic, grade, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        });
        return parseResponse(res.text)?.questions || [];
    } catch (e) {
        return [];
    }
}

export async function findPedagogicalResearch(subject: string, topic: string, grade: string, language: string): Promise<{text: string, links: {title: string, url: string}[]}> {
    const prompt = PROMPTS.PEDAGOGICAL_RESEARCH(subject, topic, grade, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            tools: [{ googleSearch: {} }]
        });
        
        const jsonPrompt = `${prompt} 
        Returner svaret som JSON: { "text": "Oppsummering av teori...", "links": [{ "title": "Kilde 1", "url": "..." }] }`;
        
        const jsonRes = await generateContentWithRetry('gemini-3-flash-preview', jsonPrompt, {
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }]
        });
        
        const data = parseResponse(jsonRes.text);
        return {
            text: data?.text || "Ingen teori funnet.",
            links: data?.links || []
        };
    } catch (e) {
        return { text: "Kunne ikke hente forskning.", links: [] };
    }
}

export async function generateLessonStudyMeasures(findings: string, language: string): Promise<string> {
    const prompt = PROMPTS.LESSON_STUDY_MEASURES(findings, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt);
        return res.text || "";
    } catch (e) {
        return "";
    }
}

export async function generateObservationChecklist(researchQuestion: string, prediction: string, language: string): Promise<{ item: string, count: number }[]> {
    const prompt = PROMPTS.OBSERVATION_CHECKLIST(researchQuestion, prediction, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        });
        const data = parseResponse(res.text);
        return data?.items?.map((item: string) => ({ item, count: 0 })) || [];
    } catch (e) {
        return [];
    }
}

export async function generateInterviewQuestions(researchQuestion: string, age: string, language: string): Promise<string[]> {
    const prompt = PROMPTS.INTERVIEW_QUESTIONS(researchQuestion, age, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        });
        return parseResponse(res.text)?.questions || [];
    } catch (e) {
        return [];
    }
}

export async function generateCrosswordWordList(subject: string, topic: string, difficulty: string, language: string): Promise<{word: string, definition: string}[]> {
    const prompt = PROMPTS.CROSSWORD_WORDLIST(subject, topic, difficulty, language);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                definition: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });
        return parseResponse(res.text)?.items || [];
    } catch (e) {
        console.error("Error generating word list", e);
        return [];
    }
}

export async function generateCrosswordData(
    subject: string, 
    topic: string, 
    difficulty: string, 
    gridSize: number, 
    language: string, 
    gameType: 'crossword' | 'wordsearch' | 'both' = 'both',
    customWords?: {word: string, definition: string}[]
): Promise<any> {
    const customWordsContext = customWords && customWords.length > 0 
        ? `BRUK DISSE ORDENE OG DEFINISJONENE: ${JSON.stringify(customWords)}`
        : `Finn på relevante ord og definisjoner selv.`;

    const prompt = PROMPTS.CROSSWORD_DATA(subject, topic, difficulty, gridSize, language, gameType, customWordsContext);

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    words: { type: Type.ARRAY, items: { type: Type.STRING } },
                    crossword: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                clue: { type: Type.STRING },
                                answer: { type: Type.STRING },
                                direction: { type: Type.STRING },
                                row: { type: Type.INTEGER },
                                col: { type: Type.INTEGER }
                            }
                        } 
                    },
                    wordsearchGrid: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING } 
                        } 
                    }
                }
            }
        });
        return parseResponse(res.text);
    } catch (e) {
        console.error("Error generating crossword data", e);
        return null;
    }
}

export const generateMathHint = async (problem: string, wrongAnswer: string, topic: string): Promise<string> => {
    try {
        const prompt = `Du er en vennlig og oppmuntrende mattelærer for barneskoleelever. 
Eleven prøvde å løse oppgaven: ${problem}
Temaet er: ${topic}
Eleven svarte: ${wrongAnswer}

Gi et kort, pedagogisk hint (maks 2 setninger) som hjelper eleven på vei uten å gi svaret direkte. Bruk et enkelt språk.`;

        const response = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            temperature: 0.7,
        });

        return response.text?.trim() || "Prøv å tegne oppgaven, eller bruk fingrene!";
    } catch (error) {
        console.error("Error generating math hint:", error);
        return "Prøv å tegne oppgaven, eller bruk fingrene!";
    }
};

export const generateMathReport = async (nickname: string, score: number, level: number, topic: string): Promise<string> => {
    try {
        const prompt = `Du er en oppmuntrende lærer. Skriv en kort, motiverende tilbakemelding (maks 3 setninger) til eleven "${nickname}".
Eleven har nettopp fullført en økt med "MatteJakt" (mengdetrening i matematikk).
Tema: ${topic}
Antall riktige svar: ${score}
Sluttnivå: ${level} (1-10)

Fokuser på innsats og mestring. Bruk et barnevennlig språk.`;

        const response = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            temperature: 0.7,
        });

        return response.text?.trim() || `Kjempebra jobba, ${nickname}! Du løste ${score} oppgaver og nådde nivå ${level}.`;
    } catch (error) {
        console.error("Error generating math report:", error);
        return `Kjempebra jobba, ${nickname}! Du løste ${score} oppgaver og nådde nivå ${level}.`;
    }
};

export async function generateMathProblem(topic: string, level: number): Promise<{q: string, a: number} | null> {
    const prompt = `Lag en matteoppgave for en elev på barneskolen.
Tema: ${topic}
Vanskelighetsgrad (1-10): ${level}

Svaret MÅ være et heltall.
Returner KUN et JSON-objekt på formatet: {"q": "oppgavetekst", "a": tall}
Eksempel: {"q": "5 + 5", "a": 10}`;

    try {
        const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    q: { type: Type.STRING },
                    a: { type: Type.INTEGER }
                }
            }
        });
        return parseResponse(res.text);
    } catch (e) {
        console.error("Error generating math problem", e);
        return null;
    }
}


import { Type } from "@google/genai";
import { generateContentWithRetry, parseResponse, getAIClient } from "./aiUtils";
import { QuizQuestion, CLStructure, CompetenceAim } from "../types";

export async function generateQuizQuestions(
    subject: string, 
    grade: string, 
    topic: string, 
    language: string, 
    amount: number = 5,
    contextImage?: { data: string, mimeType: string },
    autoImages: boolean = false
): Promise<QuizQuestion[]> {
  const ai = getAIClient();
  const isNews = subject === 'Dagens nyheter' || subject === 'Nyheter';
  const isTrivia = subject === 'Trivia';
  
  let promptText = `Lag en engasjerende quiz med ${amount} spørsmål til bruk i klasserommet (Kahoot-stil).
  Fag: ${subject}, Trinn: ${grade}, Tema: ${topic || 'Generelt'}. Språk: ${language}.
  
  Krav:
  1. Bland mellom 'multiple-choice' (4 svaralternativer) og 'true-false' (2 svaralternativer).
  2. For 'true-false', må alternativene være ["Sant", "Usant"] (eller nynorsk "Sann/Usann").
  3. VIKTIG: Lag en pedagogisk 'explanation' (forklaring) for hvorfor svaret er riktig. Denne skal vises til elevene etterpå for læring. Forklaringen må være kort og forståelig for ${grade}.
  4. Tidsgrense bør være passende (20s for enkle, 30-45s for vanskelige).
  5. Svaralternativene skal være korte og konsise.`;

  if (contextImage) {
    promptText += ` \nVIKTIG: Analyser det vedlagte bildet og lag spørsmålene basert på innholdet i bildet.`;
  }

  if (isNews) {
    promptText += ` \nVIKTIG: Du MÅ bruke Google Search-verktøyet. Finn de viktigste nyhetssakene i Norge og verden IDAG.
    Spørsmålene SKAL handle om faktiske hendelser fra de siste 24-48 timene.`;
  }

  const promptParts: any[] = [{ text: promptText }];
  if (contextImage) {
    promptParts.push({ inlineData: { mimeType: contextImage.mimeType, data: contextImage.data } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: promptParts },
    config: { 
      tools: (isNews || autoImages) ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                timeLimit: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['multiple-choice', 'true-false'] },
                explanation: { type: Type.STRING, description: "Pedagogisk forklaring på hvorfor svaret er riktig" },
                image: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctIndex', 'explanation', 'timeLimit', 'type']
            }
          }
        }
      }
    }
  });

  return parseResponse(response.text)?.questions || [];
}

export async function generateDailyKaiGreetings(name: string, language: string): Promise<{greeting: string, subtext: string}[]> {
  const prompt = `Generer 3 ULIKE, KORTE og HUMORISTISKE hilsener fra "KleppLosen Kai" til en lærer ved navn ${name}.
  Tema: Maritimt / Sjøliv / Navigasjon (f.eks. Kaptein, Los, Skute, Bølger, Vind i seilene).
  Målgruppe: Lærere (spill på kaffe, retting, bråkete klasser, men med et maritimt glimt i øyet).
  Språk: ${language} (Helst Nynorsk eller Jærsk vri hvis passende).
  
  Format JSON Array: 
  [
    { "greeting": "Ohoi Kaptein [Navn]!", "subtext": "Klar til å styre skuta gjennom dagens bølger?" },
    ...
  ]
  VIKTIG: Lag 3 distinkte varianter.`;

  try {
    const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    greeting: { type: Type.STRING },
                    subtext: { type: Type.STRING }
                },
                required: ['greeting', 'subtext']
            }
        }
    });
    return parseResponse(res.text) || [];
  } catch (e) { return []; }
}

export async function extractKeywordsFromImage(base64: string, mimeType: string, subject: string, grade: string): Promise<any[]> {
  const prompt = [{ text: `Extract key terminology from this educational image. JSON: { "terms": [{ "word": string, "definition": string }] }` }, { inlineData: { mimeType, data: base64 } }];
  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text)?.terms || [];
}

export async function extractNamesFromImage(base64: string, mimeType: string): Promise<string[]> {
  const prompt = [{ text: "Extract list of names. JSON array of strings." }, { inlineData: { mimeType, data: base64 } }];
  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text) || [];
}

export async function parseWeeklyPlanImage(base64: string, mimeType: string): Promise<any[]> {
  const prompt = [{ text: "Parse ukeplan. JSON array: [{ day: string, startTime: string, durationMinutes: number, type: 'lesson'|'meeting', subject: string, title: string }]" }, { inlineData: { mimeType, data: base64 } }];
  const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text) || [];
}

export async function parseAnnualPlanImage(base64: string, mimeType: string): Promise<any[]> {
  const prompt = [{ text: "Parse årsplan. JSON array: [{ week: number, subject: string, topic: string }]" }, { inlineData: { mimeType, data: base64 } }];
  const res = await generateContentWithRetry('gemini-3.1-pro-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text) || [];
}

export async function matchStructuresToAim(aim: CompetenceAim, structures: CLStructure[]): Promise<any[]> {
  const structureList = structures.map(s => ({ id: s.id, name: s.name, desc: s.description }));
  const prompt = `Du er en pedagogisk ekspert. Koble kompetansemålet "${aim.text}" til de 3 best egnede Cooperative Learning-strukturene fra listen under.
  
  Tilgjengelige strukturer: ${JSON.stringify(structureList)}
  
  For hver struktur du velger, forklar:
  1. Begrunnelse: Hvorfor passer denne metoden til akkurat dette målet?
  2. Aktivitetsskisse: En konkret 2-setnings idé til hva elevene skal gjøre.
  
  Svar i JSON-format: 
  {
    "matches": [
      { "structureId": "id", "justification": "Begrunnelse...", "activityIdea": "Idé..." }
    ]
  }`;
  
  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
    stroke: undefined,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        matches: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              structureId: { type: Type.STRING },
              justification: { type: Type.STRING },
              activityIdea: { type: Type.STRING }
            },
            required: ["structureId", "justification", "activityIdea"]
          }
        }
      }
    }
  });
  return parseResponse(res.text)?.matches || [];
}

export async function generateNoiseAdvice(grade: string, activity: string, level: 'high'|'low', language: string): Promise<{advice: string[]}> {
  const prompt = `3 tips noise level ${level} during ${activity} in ${grade}. JSON: { advice: string[] }`;
  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text);
}

export async function generateFourCorners(subject: string, grade: string, topic: string, language: string): Promise<any> {
  const prompt = `Four Corners for ${subject}, ${topic}. JSON: { question: string, corners: [string, string, string, string] }`;
  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { responseMimeType: 'application/json' });
  return parseResponse(res.text);
}

export async function generateClassroomTool(type: string, config: any, language: string): Promise<any> {
  const prompt = `Generer innhold for læreren sitt klasseromsverktøy. 
  Type: ${type}. Konfigurasjon: ${JSON.stringify(config)}. Språk: ${language}.`;
  
  const schema: any = { type: Type.OBJECT, properties: {}, required: [] };
  
  if (type === 'debater') {
      schema.properties = {
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } }
      };
      schema.required = ['pros', 'cons'];
  } else if (type === 'general_tasks') {
      schema.properties = {
          tasks: { 
              type: Type.ARRAY, 
              items: { 
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      difficulty: { type: Type.NUMBER }
                  },
                  required: ['title', 'instructions']
              } 
          }
      };
      schema.required = ['tasks'];
  } else if (type === 'exit_ticket' || type === 'icebreaker') {
      schema.properties = {
          questions: { type: Type.ARRAY, items: { type: Type.STRING } }
      };
      schema.required = ['questions'];
  }

  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
      responseMimeType: 'application/json',
      responseSchema: schema
  });
  return parseResponse(res.text);
}

export async function generateOracyContent(type: string, config: any, language: string): Promise<any> {
  let prompt = "";
  let tools: any[] = [];

  const isNews = config.subject === 'Nyheter' || config.subject === 'Dagens nyheter';

  if (isNews) {
      prompt = `Du er KleppLosen Kai. Oppdrag: Finn de 5-8 viktigste nyhetssakene i Norge IDAG (${new Date().toLocaleDateString('no-NO')}).
      VIKTIG: Du MÅ bruke Google Search for å finne dagens aktuelle saker. Ikke finn på nyheter.
      
      Målgruppe: Elever på ${config.grade}.
      Tilpass språket og vinklingen slik at det er forståelig og passende for ${config.grade}. Unngå svært skremmende detaljer for yngre elever.
      
      Lag Alias-kort basert på disse nyhetene:
      - Ordet: Nyhetstemaet, personen eller begrepet (f.eks. "Statsbudsjettet", "Erling Braut Haaland", "Klima").
      - Definisjonen: En forklaring av nyheten UTEN å bruke selve ordet, slik at elever kan gjette.
      
      Antall kort: ${config.amount || 20}.
      Språk: ${language}.`;
      
      tools = [{ googleSearch: {} }];
  
  } else if (config.subject === 'Trivia') {
      prompt = `Du er KleppLosen Kai. Generer morsom og lærerik "Trivia" (allmennkunnskap/fakta) tilpasset elever på ${config.grade}.
      Lag Alias-kort der ordet er svaret/faktaet, og definisjonen er hintet/forklaringen uten å si ordet.
      Antall kort: ${config.amount || 20}.
      Språk: ${language}.`;
  } else {
      prompt = `Du er KleppLosen Kai, en AI-pedagog. Generer innhold for Oracy-verktøyet "${type}".
      Konfigurasjon: ${JSON.stringify(config)}. Språk: ${language}.
      Tilpass innholdet til elever på ${config.grade}.`;
  }

  const schema: any = { type: Type.OBJECT, properties: {}, required: [] };

  if (type === 'alias' || config.subject === 'Trivia' || isNews) {
      schema.properties = {
          aliasCards: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      word: { type: Type.STRING },
                      category: { type: Type.STRING, enum: ['fag', 'gøy', 'nyhet', 'trivia'] },
                      definition: { type: Type.STRING }
                  },
                  required: ['word', 'category', 'definition']
              }
          }
      };
      schema.required = ['aliasCards'];
  } else if (type === 'starters') {
      schema.properties = {
          categories: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      starters: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['name', 'starters']
              }
          }
      };
      schema.required = ['categories'];
  } else if (type === 'terms') {
      schema.properties = {
          terms: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      word: { type: Type.STRING },
                      definition: { type: Type.STRING }
                  },
                  required: ['word', 'definition']
              }
          }
      };
      schema.required = ['terms'];
  } else if (type === 'roles') {
      schema.properties = {
          roles: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      action: { type: Type.STRING },
                      description: { type: Type.STRING }
                  },
                  required: ['name', 'action', 'description']
              }
          }
      };
      schema.required = ['roles'];
  } else if (type === 'assessment') {
      schema.properties = {
          rubric: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      area: { type: Type.STRING },
                      low: { type: Type.STRING },
                      medium: { type: Type.STRING },
                      high: { type: Type.STRING }
                  },
                  required: ['area', 'low', 'medium', 'high']
              }
          }
      };
      schema.required = ['rubric'];
  } else if (type === 'rhetoric') {
      schema.properties = {
          devices: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      example: { type: Type.STRING }
                  },
                  required: ['name', 'definition', 'example']
              }
          }
      };
      schema.required = ['devices'];
  }

  const res = await generateContentWithRetry('gemini-3-flash-preview', prompt, { 
      responseMimeType: 'application/json',
      responseSchema: schema,
      tools: tools
  });
  return parseResponse(res.text);
}

export async function generateStudentTalk(config: any, language: string, contextImage?: { data: string, mimeType: string }): Promise<any> {
    let promptText = `Du er KleppLosen Kai. Generer alderstilpassa og profesjonelle spørsmål til ein elevsamtale for ein elev på ${config.grade}. 
    Målet er ein trygg, konstruktiv og framtidsretta dialog. 
    Språk: ${language}.`;

    if (contextImage) {
        promptText += ` \nVIKTIG: Analyser det vedlagte skjemaet og bruk punkta der som utgangspunkt, men gjer dei meir opne og pedagogisk sterke.`;
    }

    const promptParts: any[] = [{ text: promptText }];
    if (contextImage) {
        promptParts.push({ inlineData: { mimeType: contextImage.mimeType, data: contextImage.data } });
    }

    const res = await generateContentWithRetry('gemini-3-flash-preview', promptParts, { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                categories: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['title', 'questions']
                    }
                },
                introTips: { type: Type.STRING },
                outroTips: { type: Type.STRING }
            },
            required: ['categories', 'introTips', 'outroTips']
        }
    });
    return parseResponse(res.text);
}

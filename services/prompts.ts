
import { CLStructure, GeneratedTask } from "../types";

export const PROMPTS = {
  RECOMMEND_STRUCTURES: (subject: string, topic: string, aimsText: string, structureLite: any[], language: string) => `Som pedagogisk ekspert, velg de 3 beste Cooperative Learning-strukturene for dette undervisningsopplegget.
    
    Kontekst:
    Fag: ${subject}
    Tema: ${topic}
    Kompetansemål: ${aimsText}
    
    Tilgjengelige strukturer (ID, Navn, Beskrivelse):
    ${JSON.stringify(structureLite)}
    
    Oppgave:
    Velg 3 strukturer som passer best for å oppnå målene og engasjere elevene i dette emnet.
    Gi en kort, pedagogisk begrunnelse (maks 15 ord) for hvorfor hver av dem passer.
    Språk: ${language}.
    
    Returner JSON: [{ "id": "struktur-id", "reason": "Kort begrunnelse..." }]`,

  REMIX_TASK: (originalTask: GeneratedTask, mode: string, language: string) => `You are an expert pedagogue. Remix the following lesson plan.
    Current Plan JSON: ${JSON.stringify(originalTask)}
    
    Remix Mode: ${mode}
    - simplify: Make the language simpler, reduce steps, focus on core understanding.
    - active: Add physical movement, standing up, moving around the room.
    - critical: Add reflection questions, "why", "how", and deeper analysis.
    - creative: Add drawing, acting, building, or role-play elements.
    - differentiation: Create three distinct versions (Low, Medium, High) of the main task.
    
    Keep the same Title, Subject, Grade and Competence Aims.
    MODIFY: Description, Student Task, Teacher Tips, and Learning Goals to fit the new mode.
    If mode is 'differentiation', you MUST include a "differentiatedTasks" object with { "low": "...", "medium": "...", "high": "..." }.
    Language: ${language}.
    
    Return the full updated JSON object in the same format.`,

  SUBSTITUTE_PLAN: (config: any, language: string, aimsContext: string) => `Du er en erfaren lærer som lager en kriseplan for en vikar.
    Konfigurasjon:
    Fag: ${config.subject}
    Trinn: ${config.grade}
    Varighet: ${config.duration}
    Tema: ${config.topic || 'Valgfritt / Generelt repeterende arbeid'}
    Tilgjengelig utstyr: ${config.equipment || 'Standard klasserom (Tavle, papir, blyant)'}
    Spesielle beskjeder: ${config.notes || 'Ingen'}
  
    ${aimsContext}
  
    Lag en strukturert vikarplan som er lett å følge for en ufaglært vikar.
    Krav:
    1. Aktivitetene må kreve minimalt med forarbeid.
    2. Tydelige instruksjoner til vikaren.
    3. Inkluder en "backup-aktivitet" hvis tiden blir lang.
    4. List opp kompetansemålene du valgte.
  
    Svar JSON format.
    Språk: ${language}.`,

  GENERATE_CL_TASK: (subject: string, grade: string, topic: string, diffInstruction: string, aimsText: string, goalAmount: number, options: any, language: string, structure: CLStructure, stepsText: string) => `Create a complete and detailed lesson plan using Cooperative Learning structure "${structure.name}".
    
    Context:
    Subject: ${subject}
    Grade: ${grade}
    Topic: ${topic}
    Differentiation Profile: ${diffInstruction}
    
    Official Competence Aims (Kompetansemål - MUST be used as base): 
    ${aimsText}
    
    You MUST return a JSON object with the following specific keys:
    - "title": A creative title for the lesson.
    - "description": A brief summary.
    - "learningGoals": Array of ${goalAmount} specific learning goals derived from competence aims.
    - "studentTask": Array of strings describing the specific step-by-step task for students using the CL structure. Be concrete!
    - "teacherTips": Array of teacher tips for executing this lesson.
    - "studentMaterials": Array of strings listing necessary materials (e.g. "Papir", "Blyant", "Lapper").
    
    CHECK IF THIS STRUCTURE REQUIRES PRINTABLE MATERIALS (cards, slips, role descriptions, etc. e.g. for Huskelapper, Bytt Lapper, Rollespill):
    - "printableMaterial": Object with { "title": "What is this?", "cards": ["Card content 1", "Card content 2", ...] }. If the structure needs flashcards or slips to be cut out, generate the content here.
    
    ${options.differentiatedTasks ? `- "differentiatedTasks": Object with { "low": "Simplified task...", "medium": "Standard task...", "high": "Challenging task..." } to support different skill levels.` : ''}
    
    ${options.generateWorksheet || options.generatePrintables ? `- "answerKey": Array of strings providing a teacher answer key (fasit) for the worksheet questions or printable cards (if relevant).` : ''}
    
    ${options.generateWorksheet ? `- "worksheetQuestions": Array of ${options.worksheetAmount} specific worksheet questions/tasks related to the topic.` : ''}
    
    ${options.generateRubric ? `- "assessmentRubric": Array of objects {criteria, low, medium, high}. CRITICAL: You must use the "learningGoals" you generated as the basis for the criteria. Create a matrix describing low, medium, and high achievement for each goal.` : ''}
    
    ${options.includeOracy ? `- "categories": Array of oracy categories with sentence starters.` : ''}
    ${options.includeOracy ? `- "oracyTips": Array of 3-5 specific, pedagogical tips for the teacher on how to facilitate student talk specifically for this topic/subject.` : ''}
    
    Language: ${language}.
    Structure info: ${structure.description}, Steps: ${stepsText}.
    `,

  PROJECT_PLAN: (subject: string, grade: string, topic: string, product: string, language: string) => `Lag en komplett tverrfaglig prosjektplan for skolen. 
    Fag: ${subject}. Trinn: ${grade}. Tema: ${topic}. Sluttprodukt: ${product}. 
    Språk: ${language}.
    
    Planen må inneholde relevante kompetansemål fra LK20, en engasjerende beskrivelse, spesifikke oppdrag til elevene, og et vurderingsskjema med tre nivåer.`,

  DIFFERENTIATION: (task: string, subject: string, grade: string, language: string) => `Differentiate the following task for ${grade} in ${subject}. 
    Task: ${task}. Language: ${language}.
    Return JSON with keys "low" (simplified), "medium" (standard), and "high" (challenging).`,

  SUBJECT_CODE: (subject: string) => `Finn den offisielle fagkoden (grepskode) for faget "${subject}" i LK20-læreplanen ved å søke på udir.no eller data.udir.no.
    Eksempler: Norsk = NOR1-06, Matematikk = MAT1-05, Engelsk = ENG1-04.
    Returner KUN koden som en streng i JSON: { "code": "XXX1-01" }.`,

  COMPETENCE_AIMS_DB: (subject: string, grade: string, dbAims: string[], topic: string, language: string) => `Here is a list of ALL official competence aims for ${subject} ${grade} from the database:
      ${JSON.stringify(dbAims)}
      
      Task: Select the 3-5 most relevant aims from this list that match the topic: "${topic}".
      Language: ${language}.
      Return JSON array of objects: { id: string, text: string, category: string (optional) }.`,

  COMPETENCE_AIMS_SEARCH: (subject: string, grade: string, topic: string, language: string) => `Find relevant competence aims (kompetansemål) from the Norwegian curriculum (LK20) for:
      Subject: ${subject}, Grade: ${grade}, Topic: ${topic}, Language: ${language}.
      Return JSON array of objects: { id: string, text: string, category: string (optional) }. Max 5 aims.`,

  ALL_SUBJECT_AIMS: (subject: string) => `Du er en ekspert på det norske læreplanverket LK20. 
    Hent ALLE kompetansemål for faget "${subject}" for grunnskolen (1.-10. trinn).
    Grupper målene nøyaktig slik de er i læreplanen (t.d. "Etter 2. trinn", "Etter 4. trinn", "Etter 7. trinn", "Etter 10. trinn").
    
    Svar i JSON-format:
    {
      "levels": [
        { "grade": "2. trinn", "aims": ["mål 1", "mål 2"] },
        { "grade": "4. trinn", "aims": ["..."] }
      ]
    }`,

  COMPARE_AIMS: (subject: string, currentData: any[]) => `Du er en ekspert på det norske læreplanverket LK20 hos UDIR. 
    Oppgave: Sjekk om våre lagrede kompetansemål for faget "${subject}" samsvarer med de nyeste offisielle målene fra LK20.
    
    Våre nåværende data:
    ${JSON.stringify(currentData)}
    
    Instruks:
    1. Bruk Google Search til å finne de offisielle LK20-kompetansemålene for "${subject}".
    2. Sammenlign punkt for punkt for hvert trinn (Etter 2., 4., 7. og 10. trinn).
    3. Identifiser om teksten er identisk, om det er små språklige justeringer, eller om det er kommet helt nye mål.
    4. Returner en sammenligning i JSON-format.
    
    Svar i JSON-format:
    {
      "comparisons": [
        { 
          "grade": "2. trinn", 
          "status": "updated", 
          "currentAims": ["gammel tekst 1", "gammel tekst 2"], 
          "proposedAims": ["ny tekst 1", "ny tekst 2"],
          "diffNote": "Endret ordlyd i mål 1 for å tydeliggjøre ..."
        }
      ]
    }`,

  ADAPT_AIMS: (aims: string[], targetGrade: string, language: string) => `Her er en liste over kompetansemål fra læreplanen:
    ${aims.join('\n')}
    
    Tilpass og forenkle disse målene pedagogisk slik at de er forståelige og oppnåelige for elever på ${targetGrade}. 
    Behold kjernen i målet, men juster språket og kompleksiteten.
    Språk: ${language}.
    
    Svar med en JSON-liste over de tilpassede strengene.`,

  ALL_COMPETENCE_AIMS: (subject: string, grade: string) => `Find all relevant competence aims (kompetansemål) from the Norwegian curriculum (LK20) for:
    Subject: ${subject}, Grade: ${grade}. 
    Return JSON array of strings (only the text of the aims).`,

  ANALYZE_LESSON_STUDY: (prediction: string, observation: string, description: string, language: string) => `Du er en ekspert på Lesson Study. Analyser forskjellen mellom lærernes prediksjon og den faktiske observasjonen i en forskningstime.
    
    Planlagt undervisning: "${description}"
    Prediksjon (Hva de trodde ville skje): "${prediction}"
    Observasjon (Hva som faktisk skjedde): "${observation}"
    
    Oppgave:
    1. Identifiser gapet mellom prediksjon og observasjon.
    2. Gi en kort pedagogisk analyse av hvorfor dette kan ha skjedd.
    3. Gi et konkret råd for neste syklus.
    
    Språk: ${language} (Nynorsk).
    Returner JSON: { "analysis": "Din analyse...", "advice": "Ditt råd..." }`,

  LESSON_STUDY_QUESTIONS: (subject: string, topic: string, grade: string, language: string) => `Lag 3 gode forskningsspørsmål for en Lesson Study-syklus.
    Fag: ${subject}. Trinn: ${grade}. Tema: ${topic}.
    
    Spørsmålene må fokusere på elevenes læring, være undersøkende og observerbare.
    Eks: "Hvordan påvirker bruk av visuelle hjelpemidler elevenes forståelse av brøk?"
    
    Språk: ${language} (Nynorsk).
    Returner JSON: { "questions": ["Spørsmål 1", "Spørsmål 2", "Spørsmål 3"] }`,

  PEDAGOGICAL_RESEARCH: (subject: string, topic: string, grade: string, language: string) => `Finn relevant pedagogisk teori eller forskning som kan belyse undervisning i ${subject} om ${topic} for ${grade}.
    Fokuser på didaktikk og læringsstrategier.
    Språk: ${language} (Nynorsk).
    Inkluder 2-3 kilder/lenker hvis mulig.`,

  LESSON_STUDY_MEASURES: (findings: string, language: string) => `Basert på disse funnene fra en Lesson Study: "${findings}".
    Foreslå 3 konkrete endringer i undervisningspraksis som lærerteamet kan teste ut i neste time.
    Språk: ${language} (Nynorsk).`,

  OBSERVATION_CHECKLIST: (researchQuestion: string, prediction: string, language: string) => `Du er en forskningsassistent for Lesson Study.
    Forskningsspørsmål: "${researchQuestion}"
    Lærerens prediksjon: "${prediction}"
    
    Oppgave:
    Lag 4-5 konkrete, observerbare indikatorer (atferd/hendelser) som observatørene bør telle eller se etter for å besvare forskningsspørsmålet.
    Det må være spesifikt (f.eks. "Elev bruker fagbegrep", "Elev spør medelev om hjelp", "Elev rekker opp hånden").
    
    Språk: ${language} (Nynorsk).
    Returner JSON: { "items": ["Indikator 1", "Indikator 2", ...] }`,

  INTERVIEW_QUESTIONS: (researchQuestion: string, age: string, language: string) => `Lag 3-4 gode intervjuspørsmål til en elev (${age}) etter en forskningstime.
    Målet er å finne ut elevenes perspektiv knyttet til forskningsspørsmålet: "${researchQuestion}".
    Spørsmålene må være åpne, trygge og barnovennlige.
    
    Språk: ${language} (Nynorsk).
    Returner JSON: { "questions": ["Spørsmål 1", "Spørsmål 2", ...] }`,

  CROSSWORD_WORDLIST: (subject: string, topic: string, difficulty: string, language: string) => `Lag en liste med 10-15 relevante ord og definisjoner om emnet: "${topic}" i faget ${subject}.
    Vanskelighetsgrad: ${difficulty}.
    
    Språk: ${language} (Nynorsk).
    
    Returner JSON:
    {
      "items": [
        { "word": "ORD1", "definition": "Definisjon 1" },
        { "word": "ORD2", "definition": "Definisjon 2" }
      ]
    }`,

  CROSSWORD_DATA: (subject: string, topic: string, difficulty: string, gridSize: number, language: string, gameType: string, customWordsContext: string) => `Lag et pedagogisk spill om emnet: "${topic}" i faget ${subject}.
    Type spill: ${gameType === 'both' ? 'Både kryssord og ordleter' : gameType === 'crossword' ? 'Kun kryssord' : 'Kun ordleter'}.
    Vanskelighetsgrad: ${difficulty}.
    Grid størrelse: ${gridSize}x${gridSize}.
    
    ${customWordsContext}
    
    Du må generere:
    ${gameType !== 'crossword' ? '1. En liste med ord som skal finnes (for ordleter).' : ''}
    ${gameType !== 'wordsearch' ? '2. En liste med hint og svar (for kryssord).' : ''}
    ${gameType !== 'crossword' ? '3. En bokstav-grid (2D array) for ordleteren der ordene er gjemt (horisontalt, vertikalt, diagonalt).' : ''}
    ${gameType !== 'wordsearch' ? '4. NØYAKTIGE koordinater (row, col) for kryssordet. Ordene MÅ krysse hverandre på riktig måte (dele felles bokstaver). Sørg for at alle ord i kryssordet henger sammen i ett enkelt rutenett (ingen isolerte ord). `row` og `col` starter på 0. `direction` må være "across" (vannrett) eller "down" (loddrett).' : ''}
    
    Språk: ${language} (Nynorsk).
    
    Returner JSON:
    {
      "title": "Tittel på aktiviteten",
      "words": ["ORD1", "ORD2", ...],
      "crossword": [
        { "clue": "Hint 1", "answer": "SVAR1", "direction": "across/down", "row": 0, "col": 0 }
      ],
      "wordsearchGrid": [
        ["A", "B", ...],
        ["C", "D", ...]
      ]
    }`
};

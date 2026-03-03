
import { COMMON_SUBJECTS, LANGUAGE_SUBJECTS, ELECTIVE_SUBJECTS } from './constants';

export const TRANSLATIONS = {
  nynorsk: {
    // Generelt
    appName: "KleppLosen", kaiGreeting: "HEI, EG ER KLEPPLOSEN KAI!", kaiSubGreeting: "Din los for god pedagogisk bruk av CL og Oracy",
    back: "Tilbake", close: "Lukk", save: "Lagre", edit: "Rediger", print: "Skriv ut", delete: "Slett",
    cancel: "Avbryt", done: "Ferdig", next: "Neste", loading: "Lastar...", 
    copy: "Kopier", search: "Søk...", filter: "Filter", sort: "Sortering",
    loadingTask: "Kai lagar opplegget...",
    backToTools: "Tilbake til verktøy", backToGuide: "Tilbake til guide",
    guest: "Gjest", guestName: "Landkrabbe", continueGuest: "Mønstre på uten konto", 
    loginToSave: "Du siglar som Landkrabbe (gjest). Du må logge inn for å lagre i kista.",
    saveStatusSaved: "Lagra", saveStatusSaving: "Lagrar...", saveStatusError: "Feil ved lagring",
    copyLink: "Kopier lenke", linkCopied: "Lenke kopiert!",
    
    // Meny
    newPlan: "PLANLEGGING", newPlanSub: "Design spennande økter med CL-metodar", 
    clGuide: "CL-GUIDEN", clGuideSub: "Lær korleis dei ulike strukturane fungerer", 
    archive: "ARKIV", archiveSub: "Finn lagra planar", 
    oracyGuide: "ORACY-GUIDEN", oracyGuideSub: "Utvikle taleevne", 
    myPage: "MI SIDE", toolsBox: "Kais verktøykasse", toolsBoxSub: "Interaktive verktøy & AI-hjelp",
    
    // Steps
    step1Short: "Rammer", step2Short: "Mål", step3Short: "Metode", step4Short: "Resultat",
    
    // Auth
    unlock: "Lås opp", enterCode: "Oppgi Kais hemmelege kode for å låse opp", codePlaceholder: "••••", tryAgainLandcrab: "Prøv igjen landkrabbe", kaiAuthGreeting: "Ohoi! Eg er KleppLosen Kai. Ikkje bli ståande igjen på kaia – logg inn, så kastar vi loss mot betre læring!",
    loginTitle: "Logg inn", registerTitle: "Opprett konto", createAccount: "Opprett konto", nameLabel: "Namn", emailLabel: "E-post", passwordLabel: "Passord", confirmPasswordLabel: "Bekreft passord", goForward: "GÅ VIDARE", forgotPassword: "Har du gløymt passordet ditt?", magicLink: "Logg inn med Magic Link",
    resetPasswordTitle: "Gløymt passord", resetPasswordText: "Skriv inn din e-postadresse, så sender vi deg ei lenke for å velje eit nytt passord.", sendInstructions: "SEND INSTRUKSAR", magicLinkTitle: "Magic Link", magicLinkText: "Logg inn utan passord! Vi sender ei magisk lenke rett til innboksen din.", sendMagicLink: "SEND MAGISK LENKE", backToAuth: "TILBAKE",
    accountCreatedCheckEmail: "Konto oppretta! Ver venleg og sjekk e-posten din for bekrefting før og loggar inn.",
    passwordsDoNotMatch: "Passorda er ikkje like.", passwordTooShort: "Passordet må vere minst 6 teikn.",
    disclaimerTitle: "Viktig Informasjon", disclaimerResponsibilityTitle: "Eige ansvar", disclaimerResponsibilityText: "Innhaldet i KleppLosen er generert av kunstig intelligens (AI). Det kan førekomme feil eller unøyaktigheiter. All bruk av tenesta og innhaldet skjer på eige ansvar.",
    disclaimerPrivacyTitle: "Personvern", disclaimerPrivacyText: "Du må IKKJE skrive inn sensitive personopplysningar (som namna til elevane, fødselsnummer, diagnosar eller liknande) i applikasjonen.", disclaimerAccept: "Eg forstår og aksepterer",
    resetPasswordEmailSent: "Instruksjonar for å tilbakestille passord er sendt til din e-post.",
    magicLinkSent: "Ei magisk lenke er sendt til din e-post. Klikk på den for å logge inn.",

    // Seilasplan
    voyagePlan: "Seilasplan",
    voyageSub: "Din oversikt for semesteret",
    uploadAnnual: "Last opp Årsplan (Bilde)",
    uploadWeekly: "Last opp Ukeplan (Bilde)",
    syncCalendar: "Hent Kalender",
    week: "Uke",
    monday: "Mandag", tuesday: "Tirsdag", wednesday: "Onsdag", thursday: "Torsdag", friday: "Fredag",
    lesson: "Undervisning", meeting: "Møte", other: "Annet",
    noEvents: "Ingen hendelser.",
    addEvent: "Legg til økt",
    analyzingPlan: "Kai analyserer planen din...",
    annualPlanLoaded: "Årsplan lastet!",
    weeklyPlanLoaded: "Ukeplan importert!",

    // Planlegging Step 1
    step1: "Planlegging", step1Sub: "Definer rammene for økta",
    selectSubject: "Vel Fag", languageSubjectsLabel: "Språkfag", electiveSubjectsLabel: "Valfag", grade: "Klassetrinn",
    topicLabel: "Tema eller Innhald", topicPlaceholder: "Kva skal elevane lære? (Eks: Brøkrekning, andre verdskrig, berekraft...)", topicRequired: "Påkrevd",
    imagesLabel: "Bilder frå læreboka (valfritt)", dropImages: "Slipp bilder her", contextInfo: "Gir Kai meir kontekst",
    fetchAimsBtn: "FINN KOMPETANSEMÅL",

    // Planlegging Step 2
    step2: "Mål", step2Sub: "Vel eitt eller fleire mål å jobbe mot",
    loadingAims: "Lastar mål...", nextStepCustomize: "NESTE: VEL METODE OG TILPASS",

    // Planlegging Step 3
    step3: "Metode & Utstyr", step3Sub: "Klikk på metoden for å generere opplegget",
    kaiCustomizations: "Kais Tilpasningar", kaiCustomizationsSub: "Kva vil du at Kai skal lage til økta?",
    generateWorksheet: "Lag arbeidsark", generateRubric: "Lag vurdering", includeOracy: "Oracy-fokus",
    kaisChoice: "Kais Val",
    differentiationLevel: "Elevgruppe-profil",
    differentiationSupport: "Treng støtte",
    differentiationStandard: "Standard",
    differentiationChallenge: "Utfordring",
    oracyPhysical: "Fysisk", oracyLinguistic: "Språkleg", oracyCognitive: "Kognitivt", oracySocial: "Sosialt",

    // Planlegging Step 4 (Resultat)
    learningAims: "Læringsmål", studentTask: "Elevoppgåve", teacherGuide: "GJENNOMFØRING", kaiTips: "KAIS TIPS", 
    studentInstructionsHeader: "INSTRUKS", suitableFor: "EGNA FOR", trainsSkills: "FERDIGHETER", 
    worksheet: "Forslag til Arbeidsark", assessmentRubric: "Vurderingsskjema",
    oracySkills: "Munnlege ferdigheiter (Oracy)", focusAreas: "Fokusområde", sentenceStarters: "Setningsstartarar",
    savePlan: "Lagre", savePrivate: "Lagre Privat", saveShared: "Lagre & Del",
    teacherTab: "Lærarinfo", studentTab: "Elevvising", clMethod: "Metode",
    teacherView: "Lærar", studentView: "Elev", methodView: "Metode",
    
    // Arkiv
    myPlans: "Mine opplegg", communityArena: "Felles arena", 
    newest: "Nyaste", byTopic: "Tema", mostLiked: "Mest likt", 
    allSubjects: "Alle Fag", allGrades: "Alle Trinn", resetFilters: "Nullstill filter", 
    deleteConfirm: "Er du sikker på at du vil slette?", noPlansFound: "Ingen planar funne...", noResultsFound: "Ingen treff...",
    created: "Oppretta", likes: "Likes", shared: "Delt", private: "Privat",

    // Verktøy Kategorier
    catClassroomMgmt: "Klasseleiing", catClassroomMgmtDesc: "VERKTØY FOR STRUKTUR OG ORDEN",
    catActivity: "Aktivitet & Spel", catActivityDesc: "ENGASJERANDE LÆRINGSAKTIVITETAR",
    catOracy: "Oracy & Språk", catOracyDesc: "STØTTE FOR MUNNLEGE FERDIGHEITER",
    catPlanning: "Planlegging & Vurdering", catPlanningDesc: "PEDAGOGISK STØTTE FOR LÆRAREN",

    // Verktøy (Toolbox) Titles & Descs
    toolAimMatcher: "Mål-speilet", toolAimMatcherDesc: "Kople kompetansemål til CL-strukturar.",
    toolDifferentiator: "Nivå-fordeleren", toolDifferentiatorDesc: "Differensier innhald på sekund.",
    toolTaskGen: "Oppgåvegenerator", toolTaskGenDesc: "Lag kreative oppgåver i alle fag.",
    toolProjectPlanner: "Prosjektplanleggeren", toolProjectPlannerDesc: "Generer komplette prosjekt med mål og vurdering.",
    toolStarters: "Setningsstartarar", toolStartersDesc: "Fagspesifikke startarar etter Oracy-domener.",
    toolAlias: "Fag-Alias", toolAliasDesc: "Morsomt spel for å øve på fagbegrep.",
    toolTerms: "Ordbank", toolTermsDesc: "Sentrale fagbegrep for timen.",
    toolAssessment: "Vurderingsskjema", toolAssessmentDesc: "Skjema for munnlege ferdigheiter.",
    toolRoles: "Rollekort", toolRolesDesc: "Fordel ansvar i gruppa digitalt.",
    toolRhetoric: "Retorikk", toolRhetoricDesc: "Fagspesifikke retoriske verkemiddel.",
    toolExit: "Exit Ticket", toolExitDesc: "Tre raske kontrollspørsmål før slutt.",
    toolIcebreaker: "Isbrytaren", toolIcebreakerDesc: "Morsomme spørsmål for å starte praten.",
    toolDebate: "Debattanten", toolDebateDesc: "Argument for og imot eit tema.",
    toolGroups: "Mannskapet", toolGroupsDesc: "Tilfeldig inndeling i grupper.",
    toolNoise: "Lydbølgen", toolNoiseDesc: "Visuell støymålar via mikrofon.",
    toolPicker: "Lykkehjulet", toolPickerDesc: "Trekk ein tilfeldig elev rettferdig.",
    toolTimer: "Tidtakar", toolTimerDesc: "Tydeleg nedteljing for klassen.",
    toolLight: "Trafikklys", toolLightDesc: "Gi signal om arbeidsro (Stille/Hviske/Prate).",
    toolCorners: "Hjørner", toolCornersDesc: "Vis 4 alternativ på storskjerm.",
    toolQuiz: "Kunnskaps-Tokt", toolQuizDesc: "Læringsspill i klasserommet (Beta).",
    toolSeatingChart: "Klassekart-generator", toolSeatingChartDesc: "Lag og tilpass bordplassering.",
    toolBehavior: "Atferds-losen", toolBehaviorDesc: "Strukturert håndtering av bekymring (R.A.I.N).",
    toolSubstitute: "Vikarredderen", toolSubstituteDesc: "Komplett timeplan for vikar på 1-2-3.",
    toolDashboard: "Lærerens Hjemskjerm", toolDashboardDesc: "Alt du trenger på storskjerm for timestart.",

    // Verktøy UI
    fetchAims: "Hent Mål", recommendedCL: "Anbefalt CL", pickGoal: "Vel eit mål:", 
    lowThreshold: "Låg Terskel", expected: "Forventa", challenge: "Utfordring",
    analyzeDiff: "Analyser & Differensier No", pasteText: "Lim inn tekst...",
    writeNames: "Skriv namn (eit per linje)", drawWinner: "TREKK EIN VINNAR", drawing: "TREKKER...", winnerIs: "Vinnaren er:",
    startMic: "Start Mikrofon", stopMic: "Stopp Måling", limit: "Grense",
    groupSize: "Gruppestørrelse", createGroups: "DANN GRUPPER", group: "Gruppe",
    generateContent: "Generer Innhald", argumentsFor: "FOR", argumentsAgainst: "MOT",
    gameMode: "Spelmodus", shuffle: "Bland", startRound1: "Start Runde 1", nextRound: "Neste Runde", endGame: "Avslutt Spel",
    explanation: "Forklaring", noDef: "Inga definisjon.", bonusWord: "BONUS", fagWord: "FAG",
    themePlaceholder: "Tema...", style: "Stil", practical: "Praktisk", playful: "Leikande", deep: "Reflekterande",
    amount: "Antall", funWords: "Gøy-ord", focusAreasLabel: "Fokusområder", scan: "Skann",
    timerLabel: "Tidtakar", timerStart: "Start", timerStop: "Stopp", timerReset: "Nullstill",
    questionPlaceholder: "Kva er din favoritt...?", corner: "Hjørne", saveToList: "Lagre i liste", showOnScreen: "Vis på storskjerm",
    plannedQuestions: "Planlagte spørsmål", noSavedQuestions: "Ingen lagra spørsmål enda", showDirectly: "Vis direkte",
    classAndActivity: "Klasse & Aktivitet", groupWork: "Gruppearbeid", individualWork: "Individuelt arbeid", test: "Prøve", plenum: "Plenum", recess: "Friminutt",
    autoAdvice: "Auto-Råd (30 sek)", kaiFeedback: "Kais Tilbakemelding", kaiAnalyzing: "Kai analyserer...", listeningWaiting: "Lytter... Råd kjem om litt.", startMicAdvice: "Start mikrofonen for å få råd frå Kai.",
    task: "Oppdrag", kaiGenerated: "Kai AI-Generert",
    readyToUse: "Klar til bruk...", whatToMake: "Kva vil du Kai skal lage?",
    editDone: "Ferdig", editMode: "Rediger",
    quiet: "Stille", whisper: "Hviskestemme", indoorVoice: "Innestemme", selectMode: "Velg modus", activeSignal: "Aktivt signal", clickToActivate: "Klikk på lyset for å aktivere",
    readyForGame: "Klar for spel?", startGameDesc: "Start ein engasjerande runde med Alias for klassen.", 
    howToPlay: "Slik spelar vi", 
    rule1: "Gå saman to og to (eller små grupper).", 
    rule2: "Ein sit med ryggen til tavla, den andre ser på skjermen.", 
    rule3: "Forklar ordet utan å seie sjølve ordet! Byt rolle når runden er over.",
    round: "Runde",
    quizSetup: "Oppsett", quizLobby: "Lobby", quizGame: "Spill", quizResults: "Resultat",
    quizGenerate: "Generer Quiz", quizTopic: "Tema for quizen", quizJoin: "Bli med på",
    quizPin: "Game PIN", quizWaiting: "Venter på spillere...", quizStart: "Start Spillet",
    
    // Seating Chart
    scTotalStudents: "Totalt antall elever",
    scBoys: "Gutter",
    scGirls: "Jenter",
    scFocus: "Fokus-elever",
    scSmartShuffle: "Smart Bland",
    scSmartShuffleDesc: "Annenhver gutt/jente",
    scClickTip: "Klikk på elev for å endre kjønn. Høyreklikk for å markere fokus.",
    scBoyLabel: "Gutt", scGirlLabel: "Jente", scFocusLabel: "Fokus",
    scScan: "Skann Liste", scScanDesc: "Hent fornavn fra bilde",
    scModeRows: "Rader", scModeGroups: "Grupper", scModeFree: "Fritt Design",
    scAddDesk: "Legg til pult", scClearDesks: "Fjern alle pulter",
    
    // Project Planner
    projectTitle: "Prosjektplan", productPlaceholder: "F.eks. Film, Podcast, Modell...", productLabel: "Produkt",
    createProject: "Opprett Prosjekt", requirements: "Krav til produktet", timeline: "Tidsplan",

    // Guide
    noData: "Ingen data i databasen", noHits: "Ingen treff", tryAdjusting: "Prøv å endre søkeordet eller nullstill filtra dine.",
    category: "Kategori", newStructure: "Ny Struktur", steps: "Steg", teacherTips: "Lærartips", whatIsThis: "Kva er dette?",
    implementation: "Gjennomføring trinn for trinn", illustration: "Illustrasjon", 
    pedagogicalTips: "Pedagogiske Tips", 
    
    // Oracy
    oracyFramework: "Rammeverk", oracyProgression: "Progresjon", oracyToolbox: "Verktøy & Tips",
    whyOracy: "Kvifor Oracy?", oracyQuote: "Oracy handlar ikkje berre om å lære å snakke, men å lære gjennom tale.",
    oracyRules: "Samtalereglar", assessmentForm: "Vurderingsskjema", teacherStrategies: "Lærarstrategiar",
    
    subjects: COMMON_SUBJECTS, languageSubjects: LANGUAGE_SUBJECTS, electiveSubjects: ELECTIVE_SUBJECTS,
  },
  bokmål: {
    // Generelt
    appName: "KleppLosen", kaiGreeting: "HEI, JEG ER KLEPPLOSEN KAI!", kaiSubGreeting: "Din los for god pedagogisk bruk av CL og Oracy",
    back: "Tilbake", close: "Lukk", save: "Lagre", edit: "Rediger", print: "Skriv ut", delete: "Slett",
    cancel: "Avbryt", done: "Ferdig", next: "Neste", loading: "Laster...", 
    copy: "Kopier", search: "Søk...", filter: "Filter", sort: "Sortering",
    loadingTask: "Kai lager opplegget...",
    backToTools: "Tilbake til verktøy", backToGuide: "Tilbake til guide",
    guest: "Gjest", guestName: "Landkrabbe", continueGuest: "Mønstre på uten konto", 
    loginToSave: "Du seiler som Landkrabbe (gjest). Du må logge inn for å lagre i kista.",
    saveStatusSaved: "Lagret", saveStatusSaving: "Lagrer...", saveStatusError: "Feil ved lagring",
    copyLink: "Kopier lenke", linkCopied: "Lenke kopiert!",
    
    // Meny
    newPlan: "PLANLEGGING", newPlanSub: "Design spennende økter med CL-metoder", 
    clGuide: "CL-GUIDEN", clGuideSub: "Lær hvordan de ulike strukturene fungerer", 
    archive: "ARKIV", archiveSub: "Finn lagrede planer", 
    oracyGuide: "ORACY-GUIDEN", oracyGuideSub: "Utvikle taleevne", 
    myPage: "MIN SIDE", toolsBox: "Kais verktøykasse", toolsBoxSub: "Interaktive verktøy & AI-hjelp",
    
    // Steps
    step1Short: "Rammer", step2Short: "Mål", step3Short: "Metode", step4Short: "Resultat",
    
    // Auth
    unlock: "Lås opp", enterCode: "Oppgi Kais hemmelige kode for å låse opp", codePlaceholder: "••••", tryAgainLandcrab: "Prøv igjen landkrabbe", kaiAuthGreeting: "Ohoi! Jeg er KleppLosen Kai. Ikke bli stående igjen på kaia – logg inn, så kaster vi loss mot bedre læring!",
    loginTitle: "Logg inn", registerTitle: "Opprett konto", createAccount: "Opprett konto", nameLabel: "Navn", emailLabel: "E-post", passwordLabel: "Passord", confirmPasswordLabel: "Bekreft passord", goForward: "GÅ VIDERE", forgotPassword: "Har du glemt passordet ditt?", magicLink: "Logg inn med Magic Link",
    resetPasswordTitle: "Glemt passord", resetPasswordText: "Skriv inn din e-postadresse, så sender vi deg en lenke for å velge et nytt passord.", sendInstructions: "SEND INSTRUKSJONER", magicLinkTitle: "Magic Link", magicLinkText: "Logg inn uten passord! Vi sender en magisk lenke rett til innboksen din.", sendMagicLink: "SEND MAGISK LENKE", backToAuth: "TILBAKE",
    accountCreatedCheckEmail: "Konto opprettet! Vennligst sjekk e-posten din for bekreftelse før du logger inn.",
    passwordsDoNotMatch: "Passordene er ikke like.", passwordTooShort: "Passordet må være minst 6 tegn.",
    disclaimerTitle: "Viktig Informasjon", disclaimerResponsibilityTitle: "Eget ansvar", disclaimerResponsibilityText: "Innholdet i KleppLosen er generert av kunstig intelligens (AI). Det kan forekomme feil eller unøyaktigheter. All bruk av tjenesten og innholdet skjer på eget ansvar.",
    disclaimerPrivacyTitle: "Personvern", disclaimerPrivacyText: "Du må IKKE skrive inn sensitive personopplysninger (som navnene til elevene, fødselsnummer, diagnoser eller lignende) i applikasjonen.", disclaimerAccept: "Jeg forstår og aksepterer",
    resetPasswordEmailSent: "Instruksjoner for å tilbakestille passord er sendt til din e-post.",
    magicLinkSent: "En magisk lenke er sendt til din e-post. Klikk på den for å logge inn.",

    // Seilasplan
    voyagePlan: "Seilasplan",
    voyageSub: "Din oversikt for semesteret",
    uploadAnnual: "Last opp Årsplan (Bilde)",
    uploadWeekly: "Last opp Ukeplan (Bilde)",
    syncCalendar: "Hent Kalender",
    week: "Uke",
    monday: "Mandag", tuesday: "Tirsdag", wednesday: "Onsdag", thursday: "Torsdag", friday: "Fredag",
    lesson: "Undervisning", meeting: "Møte", other: "Annet",
    noEvents: "Ingen hendelser.",
    addEvent: "Legg til økt",
    analyzingPlan: "Kai analyserer planen din...",
    annualPlanLoaded: "Årsplan lastet!",
    weeklyPlanLoaded: "Ukeplan importert!",

    // Planlegging Step 1
    step1: "Planlegging", step1Sub: "Definer rammene for økta",
    selectSubject: "Velg Fag", languageSubjectsLabel: "Språkfag", electiveSubjectsLabel: "Valgfag", grade: "Klassetrinn",
    topicLabel: "Tema eller Innhold", topicPlaceholder: "Hva skal elevene lære? (Eks: Brøkregning, andre verdenskrig, bærekraft...)", topicRequired: "Påkrevd",
    imagesLabel: "Bilder fra læreboka (valfritt)", dropImages: "Slipp bilder her", contextInfo: "Gir Kai mer kontekst",
    fetchAimsBtn: "FINN KOMPETANSEMÅL",

    // Planlegging Step 2
    step2: "Mål", step2Sub: "Velg ett eller flere mål å jobbe mot",
    loadingAims: "Laster mål...", nextStepCustomize: "NESTE: VELG METODE OG TILPASS",

    // Planlegging Step 3
    step3: "Metode & Utstyr", step3Sub: "Klikk på metoden for å generere opplegget",
    kaiCustomizations: "Kais Tilpasninger", kaiCustomizationsSub: "Hva vil du at Kai skal lage til økta?",
    generateWorksheet: "Lag arbeidsark", generateRubric: "Lag vurdering", includeOracy: "Oracy-fokus",
    kaisChoice: "Kais Valg",
    differentiationLevel: "Elevgruppe-profil",
    differentiationSupport: "Trenger støtte",
    differentiationStandard: "Standard",
    differentiationChallenge: "Utfordring",
    oracyPhysical: "Fysisk", oracyLinguistic: "Språklig", oracyCognitive: "Kognitivt", oracySocial: "Sosialt",

    // Planlegging Step 4 (Resultat)
    learningAims: "Læringsmål", studentTask: "Eleveoppgave", teacherGuide: "GJENNOMFØRING", kaiTips: "KAIS TIPS", 
    studentInstructionsHeader: "INSTRUKS", suitableFor: "EGNET FOR", trainsSkills: "FERDIGHETER", 
    worksheet: "Forslag til Arbeidsark", assessmentRubric: "Vurderingsskjema",
    oracySkills: "Muntlige ferdigheter (Oracy)", focusAreas: "Fokusområder", sentenceStarters: "Setningsstartere",
    savePlan: "Lagre", savePrivate: "Lagre Privat", saveShared: "Lagre & Del",
    teacherTab: "Lærerinfo", studentTab: "Elevvisning", clMethod: "Metode",
    teacherView: "Lærer", studentView: "Elev", methodView: "Metode",
    
    // Arkiv
    myPlans: "Mine opplegg", communityArena: "Felles arena", 
    newest: "Nyeste", byTopic: "Tema", mostLiked: "Mest likt", 
    allSubjects: "Alle Fag", allGrades: "Alle Trinn", resetFilters: "Nullstill filter", 
    deleteConfirm: "Er du sikker på at du vil slette?", noPlansFound: "Ingen planer funnet...", noResultsFound: "Ingen treff...",
    created: "Opprettet", likes: "Likes", shared: "Delt", private: "Privat",

    // Verktøy Kategorier
    catClassroomMgmt: "Klasseledelse", catClassroomMgmtDesc: "VERKTØY FOR STRUKTUR OG ORDEN",
    catActivity: "Aktivitet & Spill", catActivityDesc: "ENGASJERENDE LÆRINGSAKTIVITETER",
    catOracy: "Oracy & Språk", catOracyDesc: "STØTTE FOR MUNTLIGE FERDIGHETER",
    catPlanning: "Planlegging & Vurdering", catPlanningDesc: "PEDAGOGISK STØTTE FOR LÆREREN",

    // Verktøy (Toolbox) Titles & Descs
    toolAimMatcher: "Mål-speilet", toolAimMatcherDesc: "Koble kompetansemål til CL-strukturer.",
    toolDifferentiator: "Nivå-fordeleren", toolDifferentiatorDesc: "Differensier innhold på sekunder.",
    toolTaskGen: "Oppgavegenerator", toolTaskGenDesc: "Lag kreative oppgaver i alle fag.",
    toolProjectPlanner: "Prosjektplanleggeren", toolProjectPlannerDesc: "Generer komplette prosjekt med mål og vurdering.",
    toolStarters: "Setningsstartere", toolStartersDesc: "Fagspesifikke startere etter Oracy-domener.",
    toolAlias: "Fag-Alias", toolAliasDesc: "Morsomt spill for å øve på fagbegrep.",
    toolTerms: "Ordbank", toolTermsDesc: "Sentrale fagbegrep for timen.",
    toolAssessment: "Vurderingsskjema", toolAssessmentDesc: "Skjema for muntlige ferdigheter.",
    toolRoles: "Rollekort", toolRolesDesc: "Fordel ansvar i gruppa digitalt.",
    toolRhetoric: "Retorikk", toolRhetoricDesc: "Fagspesifikke retoriske virkemidler.",
    toolExit: "Exit Ticket", toolExitDesc: "Tre raske kontrollspørsmål før slutt.",
    toolIcebreaker: "Isbryteren", toolIcebreakerDesc: "Morsomme spørsmål for å starte praten.",
    toolDebate: "Debattanten", toolDebateDesc: "Argumenter for og imot et tema.",
    toolGroups: "Mannskapet", toolGroupsDesc: "Tilfeldig inndeling i grupper.",
    toolNoise: "Lydbølgen", toolNoiseDesc: "Visuell støymåler via mikrofon.",
    toolPicker: "Lykkehjulet", toolPickerDesc: "Trekk en tilfeldig elev rettferdig.",
    toolTimer: "Tidtaker", toolTimerDesc: "Tydelig nedtelling for klassen.",
    toolLight: "Trafikklys", toolLightDesc: "Gi signal om arbeidsro (Stille/Hviske/Prate).",
    toolCorners: "Hjørner", toolCornersDesc: "Vis 4 alternativer på storskjerm.",
    toolQuiz: "Kunnskaps-Tokt", toolQuizDesc: "Læringsspill i klasserommet (Beta).",
    toolSeatingChart: "Klassekart-generator", toolSeatingChartDesc: "Lag og tilpass bordplassering.",
    toolBehavior: "Atferds-losen", toolBehaviorDesc: "Strukturert håndtering av bekymring (R.A.I.N).",
    toolSubstitute: "Vikarredderen", toolSubstituteDesc: "Komplett timeplan for vikar på 1-2-3.",
    toolDashboard: "Lærerens Hjemskjerm", toolDashboardDesc: "Alt du trenger på storskjerm for timestart.",

    // Verktøy UI
    fetchAims: "Hent Mål", recommendedCL: "Anbefalt CL", pickGoal: "Velg et mål:", 
    lowThreshold: "Lav Terskel", expected: "Forventet", challenge: "Utfordring",
    analyzeDiff: "Analyser & Differensier Nå", pasteText: "Lim inn tekst...",
    writeNames: "Skriv navn (ett per linje)", drawWinner: "TREKK EN VINNER", drawing: "TREKKER...", winnerIs: "Vinneren er:",
    startMic: "Start Mikrofon", stopMic: "Stopp Måling", limit: "Grense",
    groupSize: "Gruppestørrelse", createGroups: "DANN GRUPPER", group: "Gruppe",
    generateContent: "Generer Innhold", argumentsFor: "FOR", argumentsAgainst: "MOT",
    gameMode: "Spillmodus", shuffle: "Bland", startRound1: "Start Runde 1", nextRound: "Neste Runde", endGame: "Avslutt Spill",
    explanation: "Forklaring", noDef: "Ingen definisjon.", bonusWord: "BONUS", fagWord: "FAG",
    themePlaceholder: "Tema...", style: "Stil", practical: "Praktisk", playful: "Lekende", deep: "Reflekterende",
    amount: "Antall", funWords: "Gøy-ord", focusAreasLabel: "Fokusområder", scan: "Skann",
    timerLabel: "Tidtaker", timerStart: "Start", timerStop: "Stopp", timerReset: "Nullstill",
    questionPlaceholder: "Hva er din favoritt...?", corner: "Hjørne", saveToList: "Lagre i liste", showOnScreen: "Vis på storskjerm",
    plannedQuestions: "Planlagte spørsmål", noSavedQuestions: "Ingen lagrede spørsmål ennå", showDirectly: "Vis direkte",
    classAndActivity: "Klasse & Aktivitet", groupWork: "Gruppearbeid", individualWork: "Individuelt arbeid", test: "Prøve", plenum: "Plenum", recess: "Friminutt",
    autoAdvice: "Auto-Råd (30 sek)", kaiFeedback: "Kais Tilbakemelding", kaiAnalyzing: "Kai analyserer...", listeningWaiting: "Lytter... Råd kommer om litt.", startMicAdvice: "Start mikrofonen for å få råd fra Kai.",
    task: "Oppdrag", kaiGenerated: "Kai AI-Generert",
    readyToUse: "Klar til bruk...", whatToMake: "Hva vil du Kai skal lage?",
    editDone: "Ferdig", editMode: "Rediger",
    quiet: "Stille", whisper: "Hviskestemme", indoorVoice: "Innestemme", selectMode: "Velg modus", activeSignal: "Aktivt signal", clickToActivate: "Klikk på lyset for å aktivere",
    readyForGame: "Klar for spill?", startGameDesc: "Start en engasjerende runde med Alias for klassen.", 
    howToPlay: "Slik spiller vi", 
    rule1: "Gå sammen to og to (eller små grupper).", 
    rule2: "En sitter med ryggen til tavla, den andre ser på skjermen.", 
    rule3: "Forklar ordet uten å si selve ordet! Bytt rolle når runden er over.",
    round: "Runde",
    quizSetup: "Oppsett", quizLobby: "Lobby", quizGame: "Spill", quizResults: "Resultat",
    quizGenerate: "Generer Quiz", quizTopic: "Tema for quizen", quizJoin: "Bli med på",
    quizPin: "Game PIN", quizWaiting: "Venter på spillere...", quizStart: "Start Spillet",

    // Seating Chart
    scTotalStudents: "Totalt antall elever",
    scBoys: "Gutter",
    scGirls: "Jenter",
    scFocus: "Fokus-elever",
    scSmartShuffle: "Smart Bland",
    scSmartShuffleDesc: "Annenhver gutt/jente",
    scClickTip: "Klikk på elev for å endre kjønn. Høyreklikk for å markere fokus.",
    scBoyLabel: "Gutt", scGirlLabel: "Jente", scFocusLabel: "Fokus",
    scScan: "Skann Liste", scScanDesc: "Hent fornavn fra bilde",
    scModeRows: "Rader", scModeGroups: "Grupper", scModeFree: "Fritt Design",
    scAddDesk: "Legg til pult", scClearDesks: "Fjern alle pulter",
    
    // Project Planner
    projectTitle: "Prosjektplan", productPlaceholder: "F.eks. Film, Podcast, Modell...", productLabel: "Produkt",
    createProject: "Opprett Prosjekt", requirements: "Krav til produktet", timeline: "Tidsplan",

    // Guide
    noData: "Ingen data i databasen", noHits: "Ingen treff", tryAdjusting: "Prøv å endre søkeordet eller nullstill filtrene dine.",
    category: "Kategori", newStructure: "Ny Struktur", steps: "Steg", teacherTips: "Lærertips", whatIsThis: "Hva er dette?",
    implementation: "Gjennomføring trinn for trinn", illustration: "Illustrasjon", 
    pedagogicalTips: "Pedagogiske Tips", 
    
    // Oracy
    oracyFramework: "Rammeverk", oracyProgression: "Progresjon", oracyToolbox: "Verktøy & Tips",
    whyOracy: "Hvorfor Oracy?", oracyQuote: "Oracy handler ikke bare om å lære å snakke, men å lære gjennom tale.",
    oracyRules: "Samtaleregler", assessmentForm: "Vurderingsskjema", teacherStrategies: "Lærerstrategier",
    
    subjects: COMMON_SUBJECTS, languageSubjects: LANGUAGE_SUBJECTS, electiveSubjects: ELECTIVE_SUBJECTS,
  }
};

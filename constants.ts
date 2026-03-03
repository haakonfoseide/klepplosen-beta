
import { OracySentenceStarter, OracyTeacherStrategy } from './types';
import { 
  Calculator, FlaskConical, Globe, HeartHandshake, Palette, Music, 
  Dumbbell, Utensils, BookText, Languages, Lightbulb
} from 'lucide-react';

export const GRADES = [
  '1. trinn', '2. trinn', '3. trinn', '4. trinn', '5. trinn', '6. trinn', '7. trinn',
  '8. trinn', '9. trinn', '10. trinn', 'Vg1', 'Vg2', 'Vg3'
];

export const CATEGORY_COLORS = {
  samtale: 'bg-pink-100 text-pink-700 border-pink-200',
  repetisjon: 'bg-amber-100 text-amber-700 border-amber-200',
  kunnskap: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  produksjon: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  teambygging: 'bg-blue-100 text-blue-700 border-blue-200'
};

export const SUBJECT_ICONS: Record<string, any> = {
  "Matematikk": Calculator, "Naturfag": FlaskConical, "Samfunnsfag": Globe,
  "KRLE": HeartHandshake, "Kunst og håndverk": Palette, "Musikk": Music,
  "Kroppsøving": Dumbbell, "Mat og helse": Utensils, "Norsk": BookText,
  "Engelsk": Languages, "Fremmedspråk": Languages, "Valgfag": Lightbulb
};

export const DEFAULT_SUBJECT_CODES: Record<string, string> = {
  "Norsk": "NOR1-06",
  "Matematikk": "MAT1-05",
  "Engelsk": "ENG1-04",
  "Naturfag": "NAT1-04",
  "Samfunnsfag": "SAF1-04",
  "KRLE": "RLE1-03",
  "Kunst og håndverk": "K&H1-02",
  "Kroppsøving": "KRO1-05",
  "Mat og helse": "MHE1-02",
  "Musikk": "MUS1-02"
};

export const COMMON_SUBJECTS = [
  "Norsk", "Matematikk", "Engelsk", "Samfunnsfag", "Naturfag", 
  "KRLE", "Kunst og håndverk", "Kroppsøving", "Mat og helse", "Musikk"
];

export const LANGUAGE_SUBJECTS = [
  "Spansk", "Tysk", "Fransk", "Engelsk fordypning", "Norsk fordypning", "Samisk"
];

export const ELECTIVE_SUBJECTS = [
  "Teknologi og design", "Programmering", "Arbeidslivsfag", 
  "Teknologi i praksis", "Fysisk aktivitet og helse", 
  "Design og redesign", "Forskning i praksis", "Innsats for andre", 
  "Internasjonalt samarbeid", "Medier og kommunikasjon", "Trafikk", 
  "Friluftsliv", "Demokrati i praksis", "Ideer og praktisk forskning",
  "Kulturarv", "Levende kulturarv", "Produksjon av varer og tjenester",
  "Sal og scene", "Utvikling av produkter og tjenester"
];

export const CL_FACTS = [
  "Visste du at CL aukar elevane sine faglege prestasjonar betydeleg?",
  "Strukturen 'Tenk-par-del' sikrar at absolutt alle får tenketid.",
  "CL bidrar til å utvikle viktige sosiale ferdigheiter og empati.",
  "Bevegelse i 'Hjørner' aukar hjernen si evne til å lagre ny informasjon.",
  "Når elevar lærer bort stoff til kvarandre, hugsar dei opptil 90%."
];

export const ORACY_DOMAINS = [
  { 
    id: 'physical', 
    name: 'Fysisk', 
    subtitle: 'Stemma og kroppen',
    color: 'bg-orange-500', 
    borderColor: 'border-orange-200', 
    sections: [
      { title: 'Audibilitet', items: ['Variere volum etter rom', 'Tydelig artikulasjon', 'Passande taletempo'] }, 
      { title: 'Kroppsspråk', items: ['Augekontakt med lyttar', 'Bevegelse og gester', 'Open haldning'] }
    ], 
    usageTips: 'Tren på "talarposisjon" – stå stødig med begge bein i bakken.' 
  },
  { 
    id: 'linguistic', 
    name: 'Språkleg', 
    subtitle: 'Ordval og form',
    color: 'bg-pink-600', 
    borderColor: 'border-pink-200', 
    sections: [
      { title: 'Ordforråd', items: ['Presist fagspråk', 'Synonym for variasjon', 'Metaforar'] }, 
      { title: 'Register', items: ['Tilpasse formelle krav', 'Grammatisk kontroll', 'Retoriske grep'] }
    ], 
    usageTips: 'Bruk setningsstartarar aktivt for å løfte det akademiske språket.' 
  },
  { 
    id: 'cognitive', 
    name: 'Kognitivt', 
    subtitle: 'Innhald og tanke',
    color: 'bg-yellow-500', 
    borderColor: 'border-yellow-200', 
    sections: [
      { title: 'Argumentasjon', items: ['Begrunne påstandar', 'Bruke bevis og kjelder', 'Relevans'] }, 
      { title: 'Struktur', items: ['Logisk rekkefølgje', 'Oppsummering', 'Svar på spørsmål'] }
    ], 
    usageTips: 'Gi elevane tid til kognitiv bearbeiding før dei må svare (tenketid).' 
  },
  { 
    id: 'social', 
    name: 'Sosialt', 
    subtitle: 'Interaksjon',
    color: 'bg-emerald-600', 
    borderColor: 'border-emerald-200', 
    sections: [
      { title: 'Lytting', items: ['Lytte aktivt utan avbrot', 'Bygge på andre sine poeng', 'Respekt'] }, 
      { title: 'Samhandling', items: ['Turtaking', 'Inkludere alle i gruppa', 'Gi konstruktiv respons'] }
    ], 
    usageTips: 'Etabler faste samtalereglar i klassen før de startar diskusjonen.' 
  }
];

export const ORACY_RULES = [
  { title: "Turtaking", text: "Vi snakkar éin av gangen og lar andre fullføre setninga si." },
  { title: "Aktiv lytting", text: "Vi viser med blikket og kroppen at vi følgjer med på den som snakkar." },
  { title: "Respekt", text: "Vi møter andres meiningar med nysgjerrigheit, sjølv om vi er ueinige." },
  { title: "Oppfordring", text: "Vi inviterer alle inn i samtalen: 'Kva tenkjer du, [Namn]?'" }
];

export const ORACY_SENTENCE_STARTERS: OracySentenceStarter[] = [
  { category: "For å bygge vidare", examples: ["Eg er einig med deg, og i tillegg...", "Det du sa fekk meg til å tenkje på...", "Eg vil gjerne supplere med..."] },
  { category: "For å utfordre", examples: ["Eg ser det fra eit anna perspektiv, fordi...", "Har du vurdert om...", "Eg forstår kva du seier, men eg meiner at..."] },
  { category: "For å klargjere", examples: ["Kan du forklare litt meir om...", "Meiner du at...", "Kva er eit eksempel på det du seier?"] }
];

export const ORACY_TEACHER_STRATEGIES: OracyTeacherStrategy[] = [
  { title: "Modellering", description: "Vis sjølv korleis ein god samtale ser ut ved å bruke setningsstartarar aktivt i plenum.", icon: "UserCheck" },
  { title: "Ventetid", description: "Gi elevane minst 3-5 sekund tenketid etter eit spørsmål før nokon får ordet.", icon: "Clock" },
  { title: "ABC-tilbakemelding", description: "Lær elevane å Agree (einig), Build (bygge vidare) eller Challenge (utfordre).", icon: "MessageSquarePlus" }
];

export const ORACY_LEVEL_GOALS = [
  { level: '1. - 4. trinn', focus: 'Grunnmuren: Turtaking og tryggleik', goals: ['Vente på tur i ein samtale.', 'Lytte til kva andre seier utan å avbryte.', 'Være vendt mot den som snakkar.', 'Svare på enkle spørsmål i ei trygg gruppe.', 'Bruke stemma slik at andre i gruppa høyrer deg.'], color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Baby' },
  { level: '5. - 7. trinn', focus: 'Utviding: Begrunnelsar og samarbeid', goals: ['Bygge vidare på det andre har sagt ("Eg er einig fordi...").', 'Begrunne eigne meiningar med eksempel.', 'Stille oppfølgingsspørsmål for å forstå betre.', 'Oppsummere kva gruppa har snakka om.', 'Bruke eit meir formelt språk i presentasjonar.'], color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Smile' },
  { level: '8. - 10. trinn / VGS', focus: 'Meistring: Retorikk og kritisk refleksjon', goals: ['Tilpasse språket til ulike mottakarar og situasjonar.', 'Bruke retoriske verkemiddel for å overbevise.', 'Analysere og utfordre andres argument på ein konstruktiv måte.', 'Lede ein samtale eller debatt i ei gruppe.', 'Reflektere over eigen og andres munnlege samhandling.'], color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'GraduationCap' }
];

export const ORACY_LEVELS = [
  { id: '1', name: 'Nivå 1' }, { id: '2', name: 'Nivå 2' }, { id: '3', name: 'Nivå 3' }, { id: '4', name: 'Nivå 4' }
];

// STUDENT / QUIZ CONSTANTS
export const AVATARS = ['Bra', 'Kul', 'Rask', 'Tøff', 'Smart', 'Glad', 'Stolt', 'Våken', 'Vill', 'Frisk'];
export const SEA_EMOJIS = ['🦈', '🐋', '🐢', '🦀', '🐙', '🐠', '🦑', '🐡', '🐚', '🦜'];
export const SEA_NOUNS = ['Sabel', 'Skute', 'Matros', 'Kaptein', 'Hai', 'Krabbe', 'Anker', 'Papegøye', 'Tønne', 'Sjøstjerne'];

export const TEAMS = [
    { id: 'red', name: 'Rød Hai', color: 'bg-red-500', icon: '🦈' },
    { id: 'blue', name: 'Blå Hval', color: 'bg-blue-500', icon: '🐋' },
    { id: 'green', name: 'Grønn Skilpadde', color: 'bg-emerald-500', icon: '🐢' },
    { id: 'yellow', name: 'Gul Krabbe', color: 'bg-amber-500', icon: '🦀' }
];
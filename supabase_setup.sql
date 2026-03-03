
-- VIKTIG: Kjør dette i Supabase SQL Editor.

-- 1. SIKRE AT TABELLER FINNES
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task JSONB,
  subject TEXT,
  grade TEXT,
  topic TEXT,
  date TEXT,
  creator TEXT,
  "creatorId" UUID,
  "isShared" BOOLEAN DEFAULT false,
  "isImported" BOOLEAN DEFAULT false,
  likes INT DEFAULT 0,
  "likedBy" JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oracy_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  content JSONB,
  type TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code TEXT,
  status TEXT DEFAULT 'lobby', -- lobby, active, reveal, scoreboard, finished
  current_question_index INT DEFAULT 0,
  quiz_data JSONB, -- Spørsmålene
  config JSONB, -- Innstillinger
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  nickname TEXT,
  score INT DEFAULT 0,
  streak INT DEFAULT 0,
  team TEXT,
  last_answer TEXT,
  answer_for_index INT DEFAULT -1, -- Ny kolonne for å spore hvilket spørsmål svaret gjelder
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sørg for at answer_for_index finnes hvis tabellen allerede eksisterer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_players' AND column_name='answer_for_index') THEN
        ALTER TABLE public.quiz_players ADD COLUMN answer_for_index INT DEFAULT -1;
    END IF;
END $$;

-- 2. AKTIVER RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracy_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_players ENABLE ROW LEVEL SECURITY;

-- 3. REGLER FOR QUIZ (Må være svært åpne for at elever uten bruker kan delta)

-- Nullstill eksisterende policies for å unngå konflikter
DROP POLICY IF EXISTS "Quiz sessions read" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Quiz sessions insert" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Quiz sessions update" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Quiz players all" ON public.quiz_players;
DROP POLICY IF EXISTS "Quiz players select" ON public.quiz_players;
DROP POLICY IF EXISTS "Quiz players insert" ON public.quiz_players;
DROP POLICY IF EXISTS "Quiz players update" ON public.quiz_players;

-- Sessions: Alle kan lese (for å finne PIN), kun innloggede kan lage/oppdatere
CREATE POLICY "Plans read all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Plans insert" ON public.plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Plans update" ON public.plans FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Plans delete" ON public.plans FOR DELETE USING (auth.role() = 'authenticated' AND "creatorId" = auth.uid());

CREATE POLICY "Oracy resources read all" ON public.oracy_resources FOR SELECT USING (true);
CREATE POLICY "Oracy resources insert" ON public.oracy_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Oracy resources update" ON public.oracy_resources FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Oracy resources delete" ON public.oracy_resources FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Quiz sessions read" ON public.quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Quiz sessions insert" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Quiz sessions update: kun innloggede lærere kan endre sesjonsstatus
CREATE POLICY "Quiz sessions update" ON public.quiz_sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- Players: Elever (uinnlogget) må kunne lese, sette inn seg selv og oppdatere score
-- Holdes åpent siden elever er ikke-autentiserte
CREATE POLICY "Quiz players select" ON public.quiz_players FOR SELECT USING (true);
CREATE POLICY "Quiz players insert" ON public.quiz_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Quiz players update" ON public.quiz_players FOR UPDATE USING (true);

-- 4. SYSTEM SETTINGS TABLE (for statistikk)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value BIGINT DEFAULT 0
);

-- 5. ATOMISK BESØKSTELLER (forhindrer race conditions)
CREATE OR REPLACE FUNCTION public.increment_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.system_settings (key, value)
  VALUES ('total_visits', 1)
  ON CONFLICT (key) DO UPDATE SET value = system_settings.value + 1;
END;
$$;


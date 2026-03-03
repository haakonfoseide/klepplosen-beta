# CLAUDE.md — KleppLosen Beta v4.0

This file provides context for AI assistants (Claude and others) working in this codebase. Read it before making changes.

---

## Project Overview

**KleppLosen Beta** is an educational technology platform for Norwegian teachers. It combines:

- **AI-driven lesson planning** using Cooperative Learning (CL) structures and UDIR curriculum competence aims
- **21+ interactive classroom tools** (live quiz, seating charts, group generators, crosswords, etc.)
- **Student mode** for quiz participation via PIN codes
- **Admin dashboard** for content and user management

**Tech stack:** React 18 + TypeScript + Vite + Supabase + Google Gemini AI

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (output: /dist)
npm run preview   # Preview production build
npm run lint      # ESLint check (TS/TSX files)
```

**No test framework is configured.** Manual testing via `views/TestDashboard.tsx` and browser DevTools.

---

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://sfuwzuifxvovowoicrcp.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_PUBLIC=<your-public-key>
```

The Gemini API key is injected at build time via `vite.config.ts` — check there if Gemini calls fail.

---

## Repository Structure

```
/
├── App.tsx                  # Root component with auth flow and error boundary
├── index.tsx                # React DOM entry point
├── types.ts                 # All TypeScript interfaces and domain models
├── constants.ts             # Subjects, grade levels, quiz avatars, Oracy domains
├── translations.ts          # Bokmål/Nynorsk UI translations (~27KB)
├── helpers.ts               # General utility functions
├── CommonComponents.tsx     # Shared UI primitives
├── ToolComponents.tsx       # Tool-specific UI helpers
├── useAppLogic.ts           # Main app state orchestrator (imports all hooks)
│
├── components/
│   ├── auth/                # Login, Register, ForgotPassword, MagicLink, DisclaimerModal
│   ├── ui/                  # Button, Card
│   └── layout/              # Header, AppRoutes (routing), QuickTools
│
├── contexts/
│   ├── AuthContext.tsx       # User auth, guest mode, disclaimer acceptance
│   └── ToastContext.tsx      # Global toast notifications
│
├── hooks/
│   ├── usePlanning.ts        # Lesson planning state, draft auto-save, AI integration
│   ├── useArchive.ts         # Saved plans management
│   ├── useAdmin.ts           # Admin import/export
│   └── useGlobalData.ts      # Loads CL structures and oracy resources
│
├── services/
│   ├── geminiService.ts      # Google Gemini API client wrapper
│   ├── aiPlanningService.ts  # AI: recommend structures, generate tasks, remix
│   ├── aiCurriculumService.ts# AI: fetch competence aims from curriculum
│   ├── aiToolsService.ts     # AI: generate quizzes, crosswords, plans, etc.
│   ├── aiUtils.ts            # Retry logic, JSON response parsing
│   ├── storageService.ts     # Supabase client and all database operations
│   └── prompts.ts            # Centralized AI prompt templates
│
├── views/
│   ├── admin/               # CurriculumManager, UserManagement, SystemHealth
│   ├── planning/            # PlanningStep1, PlanningStep2, PlanningStep3
│   └── student/             # StudentGame, StudentJoin, StudentLobby, StudentMathHunt, StudentResult
│
├── tools/                   # 21 interactive classroom tools (each is a self-contained component)
│   ├── QuizGame.tsx          # Live quiz with PIN sessions (teacher side)
│   ├── LessonStudyTool.tsx
│   ├── TeacherDashboard.tsx
│   ├── CrosswordGenerator.tsx
│   ├── SeatingChartGenerator.tsx
│   └── ... (16 more)
│
└── public/                  # Static assets
```

**Root-level TSX files** (e.g., `MenuView.tsx`, `PlanningView.tsx`, `ArchiveView.tsx`) are full page-level views.

---

## Routing Convention

This app does **not** use React Router. Navigation is state-based:

- A `view` string in `useAppLogic.ts` determines which component renders
- `setView('archive')` navigates; URL search params handle deep links (e.g., `?id=<planId>`)
- `AppRoutes` in `/components/layout/AppRoutes.tsx` maps view strings to components

When adding a new page:
1. Create the view component (root-level TSX or in `/views`)
2. Add a case in `AppRoutes`
3. Add a `setView(...)` call where navigation should happen

---

## State Management

No Redux or Zustand. Patterns used:

- **React Context** — `AuthContext`, `ToastContext` (global, cross-cutting concerns)
- **Custom Hooks** — each major feature has its own hook in `/hooks`
- **`useAppLogic.ts`** — orchestrates all hooks, passes state/handlers down as props

When creating new stateful features, follow the custom hook pattern and wire it through `useAppLogic.ts`.

---

## AI Integration

### Google Gemini API (`services/geminiService.ts`)
- Models: `gemini-3-flash-preview` (fast), `gemini-3.1-pro-preview` (quality)
- Uses structured output (`Type` schema) for reliable JSON responses
- Google Search tool enabled for curriculum research queries

### Service Layer Pattern
```
Component → Hook (usePlanning.ts etc.) → Service (aiPlanningService.ts) → geminiService.ts → Gemini API
```

### Adding AI Features
1. Add prompt template to `services/prompts.ts`
2. Create function in the relevant `ai*Service.ts`
3. Call from appropriate hook; surface result via state

### Retry Logic
`aiUtils.ts` contains `withRetry()` for transient Gemini failures. Use it for all Gemini calls.

### JSON Parsing
Gemini responses sometimes wrap JSON in markdown fences. Use `parseAIJson()` from `aiUtils.ts` to handle this.

---

## Database (Supabase)

Schema is defined in `supabase_setup.sql`. Key tables:

| Table | Purpose |
|---|---|
| `plans` | Teacher lesson plans (JSONB task field) |
| `oracy_resources` | Oracy teaching resources |
| `quiz_sessions` | Live quiz sessions (PIN-based) |
| `quiz_players` | Student quiz participants |

**Row Level Security (RLS):**
- Plans: Public read, authenticated write, owner-only delete
- Quiz tables: Open read/write (unauthenticated students need access)

All database operations go through `services/storageService.ts`. Do not call Supabase directly from components.

---

## Authentication

Managed by `AuthContext.tsx` and Supabase Auth. Three user types:

| Role | Access |
|---|---|
| `admin` | Full access including user management and curriculum imports |
| `user` | Standard teacher access — plan, archive, tools |
| `guest` | Read-only, no data persistence, must accept disclaimer |

Auth state is accessed via `useContext(AuthContext)`. The `user` object from Supabase auth is extended with a `role` field.

---

## Internationalization

Translations live in `translations.ts` (Bokmål and Nynorsk). Language is stored in `localStorage`.

- Access translations via the `t()` helper (check `helpers.ts` for exact signature)
- All user-facing strings must be in `translations.ts` — no hardcoded Norwegian text in components
- Default language: Bokmål (`nb`)

---

## TypeScript Conventions

- All domain types in `types.ts` — add new interfaces here, not inline
- `tsconfig.json` uses strict mode; avoid `any` unless absolutely necessary
- ESLint is configured with `@typescript-eslint/recommended` — run `npm run lint` before committing
- Path alias `@/` maps to the repo root (e.g., `import { Plan } from '@/types'`)

---

## Component Conventions

- **Views** (page-level): Live in root or `/views`. Receive all state/handlers via props from `useAppLogic.ts`
- **Tools**: Self-contained in `/tools`. Each tool manages its own local state
- **Reusable UI**: Only in `/components/ui` (Button, Card, etc.)
- **No inline styles** — use Tailwind CSS utility classes

---

## Classroom Tools

Each tool in `/tools` is a self-contained React component. Many tools generate content via Gemini AI using `aiToolsService.ts`.

To add a new tool:
1. Create `tools/MyNewTool.tsx`
2. Add it to the tools list in `ClassroomToolsView.tsx`
3. Add any AI generation functions to `services/aiToolsService.ts`
4. Add prompt templates to `services/prompts.ts`

---

## Key Domain Concepts

- **CL Structures** — Cooperative Learning teaching structures (e.g., Think-Pair-Share, Numbered Heads). Loaded from Supabase via `useGlobalData.ts`
- **Competence Aims (Kompetansemål)** — UDIR curriculum goals fetched via AI (`aiCurriculumService.ts`)
- **Seilasplan** — Weekly lesson planning calendar view
- **Oracy (Munnlighet)** — Oral communication skills domain with teaching resources
- **Kleppmodellen** — Local pedagogical model (BTI); see `KleppModellenGuide.tsx`

---

## Deployment

- **Supabase Hosting**: `supabase.json` configures SPA rewrite (all → `index.html`) and asset caching
- **Docker/Nginx**: `Dockerfile` + `nginx.conf` for containerized deployment (port 8080)
- `index.html` is served with `no-cache`; JS/CSS assets cached for 1 year (content-hashed filenames)

---

## Common Pitfalls

1. **No router** — Never import `react-router-dom`. Use `setView()` for navigation.
2. **AI responses are JSON in markdown** — Always use `parseAIJson()` from `aiUtils.ts`
3. **Database calls only via `storageService.ts`** — Never import `supabase` client directly in components
4. **Guest users have no persistence** — Check `user.role !== 'guest'` before any save operation
5. **Quiz tables are open** — Students join unauthenticated; do not add RLS that blocks anon on quiz tables
6. **Translations required** — All UI text must be in `translations.ts`, not hardcoded

---

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `camelCaseService.ts`
- Types: defined in `types.ts`, exported named interfaces

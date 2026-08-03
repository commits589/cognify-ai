# Cognify AI

A full React + TypeScript + Tailwind CSS student learning app — AI Tutor Chat,
Homework Helper, Quiz Generator, Notes Generator, Translation, Voice Learning,
Flashcards, Progress Dashboard, Classes, Teacher Dashboard, Admin Panel — backed
by real Firebase Authentication, Firestore, and Firebase Storage, with all AI
calls (Gemini) routed through a secure Netlify Function so the API key never
reaches the browser.

This was rebuilt from a single-file HTML prototype into a proper Vite project.
The **visual design is unchanged** — every color, layout, and component still
looks like the original — but the app now has:

- **Real authentication** (Firebase Auth: email/password + Google, email
  verification, password reset) — the original app *simulated* signup/login
  with an in-memory array; that's gone.
- **Real persistence** (Firestore) — chat sessions, quizzes, attempts,
  flashcard decks, notes, and progress/XP/streaks now survive a refresh and
  follow the signed-in user across devices, instead of living only in a React
  tab's memory.
- **Real shared data** — classes (with join codes), school list, admin user
  management, announcements, feedback, and the content-moderation queue are
  now backed by Firestore collections instead of hardcoded demo arrays, so a
  teacher's class is actually visible to the students who join it.
- **A secured AI backend** — the Netlify Function that calls Gemini now
  verifies the caller's Firebase ID token (via Firebase Admin) before doing
  anything, and applies a per-user daily rate limit tracked in Firestore.
- **Real file uploads** — profile photos and homework attachments go to
  Firebase Storage rather than being stuffed into a Firestore document as
  base64 (which would blow past Firestore's 1MB document limit for anything
  but a tiny image).

## What's still simulated (by design, not a bug)

- **"Streaming" AI responses** aren't a live token-by-token network stream — a
  Netlify Function returns one complete response; the *complete, real* answer
  is fetched, then revealed progressively on-screen for the same visual
  effect. The content itself is never partial or invented — only its on-screen
  reveal speed is animated. (Same behavior as the original app.)

## Prerequisites

- Node.js 20+
- A free [Firebase](https://console.firebase.google.com) project
- A free [Gemini API key](https://aistudio.google.com/apikey)
- A [Netlify](https://app.netlify.com) account (for deployment)

## 1. Firebase project setup

1. Create a project at https://console.firebase.google.com (or reuse one).
2. **Authentication** → Sign-in method → enable **Email/Password** and
   **Google**.
3. **Firestore Database** → Create database (start in production mode — the
   included `firestore.rules` handles access control).
4. **Storage** → Get started (production mode — `storage.rules` included).
5. **Project settings → General → Your apps** → add a **Web app**. Copy the
   `firebaseConfig` values into your `.env` (see step 3 below).
6. **Project settings → Service accounts** → Generate new private key. This
   downloads a JSON file — you'll pull three fields out of it for the
   server-side Netlify Function (never commit this JSON file).
7. Deploy the security rules (requires the [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```
   npm install -g firebase-tools
   firebase login
   firebase init firestore storage   # point at this project, keep the existing rules files
   firebase deploy --only firestore:rules,storage:rules
   ```

## 2. Gemini API key

Get one free at https://aistudio.google.com/apikey.

## 3. Environment variables

```
cp .env.example .env
```

Fill in every value in `.env`:
- `VITE_FIREBASE_*` — from the Firebase web app config (step 1.5). These are
  safe to expose to the browser; that's how every Firebase web app works.
  Access is controlled by `firestore.rules`/`storage.rules`, not by hiding
  these values.
- `GEMINI_API_KEY` — from step 2. **Server-only** — used exclusively inside
  `netlify/functions/ai-chat.js`. Never prefixed with `VITE_`, so Vite will
  never bundle it into client code.
- `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` —
  pulled from the service-account JSON in step 1.6. **Server-only**, used by
  `netlify/functions/_firebaseAdmin.js` to verify sign-in tokens and enforce
  the rate limit. Keep the `\n` sequences in the private key literal (don't
  turn them into real line breaks) — the function un-escapes them at runtime.

## 4. Install & run locally

```
npm install
npm run dev
```

Opens at http://localhost:5173. AI features need the Netlify Function running
too, so for full local testing use the Netlify CLI instead:

```
npm install -g netlify-cli
netlify dev
```

This serves the Vite app and the function together on one local port, reading
`GEMINI_API_KEY` / `FIREBASE_*` from your `.env`.

## 5. Deploy to Netlify

1. Push this repo to GitHub (or drag the folder into
   https://app.netlify.com/drop).
2. In Netlify: **Site settings → Environment variables** — add every variable
   from your `.env` (both the `VITE_FIREBASE_*` ones and the server-only
   `GEMINI_API_KEY` / `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` /
   `FIREBASE_PRIVATE_KEY` ones).
3. Netlify auto-detects `netlify.toml` — build command `npm run build`,
   publish directory `dist`, functions directory `netlify/functions`.
4. Deploy. Open the deployed URL — sign up, verify your email, and the app is
   live with real accounts, real data, and real AI calls.

### Make yourself an admin

New accounts default to whatever role they picked at signup (student/teacher).
To get admin access: sign up normally, then in the Firebase console go to
**Firestore → users → (your uid) → role** and change the value to `admin`.

## Project structure

```
src/
  firebase.ts       Firebase app init (from VITE_FIREBASE_* env vars)
  auth.tsx           AuthProvider/useAuth — real Firebase Authentication
  db.ts              Firestore data-access layer (all collections)
  storage.ts         Firebase Storage upload helper
  aiClient.ts         Gemini calls (routed through the Netlify Function, with
                     the caller's Firebase ID token attached)
  App.tsx            Root component — auth flow, navigation, data loading
  theme.ts, ui.tsx, chrome.tsx, hooks.ts    Shared design tokens / primitives
  authScreens.tsx    Splash, login, signup, forgot-password, verify-email
  dashboard.tsx, chat.tsx, quizzes.tsx, flashcards.tsx, progress.tsx,
  classes.tsx, admin.tsx, teacher.tsx, homework.tsx, voice.tsx, exam.tsx,
  aiTools.tsx, notes.tsx, translate.tsx, support.tsx, settings.tsx,
  profile.tsx, legal.tsx    One file per feature area
netlify/functions/
  ai-chat.js          Verifies the caller's Firebase ID token, rate-limits,
                     then calls Gemini with the server-held API key
  _firebaseAdmin.js  Shared Firebase Admin init + token verification + rate limit
firestore.rules      Per-user data isolation + admin-only shared collections
storage.rules        Users can only read/write their own uploaded files
```

## Known scope notes

- Homework Helper attachments are sent to Gemini as part of the request (for
  the AI to actually read them) but aren't separately archived to Storage —
  only profile photos are. Wiring homework attachments to Storage too is a
  small, self-contained addition if you want a persistent upload history.
- This was migrated from a single ~5,000-line prototype file using an
  automated extraction pass plus manual review, rather than typed from
  scratch — TypeScript strictness is intentionally relaxed
  (`strict: false` in `tsconfig.json`) so the migration didn't require
  fully annotating every prop. Tightening types incrementally is safe to do
  file-by-file later.
- Built and reviewed without a working `npm install` in the environment that
  produced it (network access was unavailable there) — run `npm install &&
  npm run build` locally before your first deploy to catch anything that
  needs a small fix.

import { FOLLOWUP_RE } from "./theme";
import { FOLLOWUP_RE } from "./theme";
import { auth } from "./firebase";

export async function callClaude(messages, system, maxTokens = 1024) {
  let res;
  try {
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    if (!idToken) throw new Error("__NO_AUTH__");
    res = await fetch("/.netlify/functions/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ system, messages, maxTokens }),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "__NO_AUTH__") {
      throw new Error("You need to be signed in to use AI features.");
    }
    throw new Error(
      "Can't reach the AI backend. This app needs to be deployed to Netlify (with GEMINI_API_KEY set) for AI features to work — see README.md."
    );
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Your session expired — please sign in again.");
  if (res.status === 429) throw new Error("You've hit the AI usage limit for now — please try again shortly.");
  if (!res.ok) throw new Error(data.error || "The AI service didn't respond. Try again in a moment.");
  if (!data.text) throw new Error("The AI service returned an empty response. Try again.");
  return data.text;
}

// Not true token-by-token network streaming (a plain Netlify Function returns one
// complete response, not a live stream) — this calls the same real backend as
// callClaude, gets back the REAL, COMPLETE response, then reveals it progressively
// client-side for the same UX. The content itself is never fabricated or simulated;
// only its on-screen reveal is animated.

export async function streamClaude(messages, system, { maxTokens = 1600, onDelta, signal } = {}) {
  const fullText = await callClaude(messages, system, maxTokens);
  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
  if (!onDelta) return fullText;

  // Reveal in small word-chunks so the UI still feels alive, without ever showing
  // anything that isn't part of the real response.
  const words = fullText.split(/(\s+)/);
  let shown = "";
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    shown += words[i];
    onDelta(shown);
    if (i % 3 === 0) await new Promise((r) => setTimeout(r, 12));
  }
  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
  return fullText;
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function stripFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

export function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function extractFollowUps(text) {
  const match = text.match(FOLLOWUP_RE);
  if (!match) return { content: text, followUps: [] };
  const followUps = match[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return { content: text.replace(FOLLOWUP_RE, "").trim(), followUps };
}

export function tutorSystemPrompt(subject, gradeLevel, a11y = {}, lang = {}) {
  const gradeLine = gradeLevel ? `\nThe student's grade/level is: ${gradeLevel}. Calibrate vocabulary, pacing, and examples to that level.` : "";
  const supportLines = [];
  if (a11y.simplify) supportLines.push("- Learning Support — Simplify difficult topics: break complex ideas down into their simplest components first, then build up.");
  if (a11y.stepByStep) supportLines.push("- Learning Support — Step-by-step: number every step explicitly, one idea per step, and pause with a short check-in question between steps.");
  if (a11y.slowMode) supportLines.push("- Learning Support — Slow mode: cover only one small idea per response, keep each response short, and wait for the student's confirmation before moving to the next idea.");
  if (a11y.visualMode) supportLines.push("- Learning Support — Visual mode: lean heavily on analogies, real-world comparisons, and describe things spatially/visually (diagrams-in-words, structured layouts) rather than abstract description alone.");
  if (a11y.simpleLanguage) supportLines.push("- Learning Support — Simple language: use short sentences and everyday vocabulary; avoid jargon, or define it immediately in plain words if it's unavoidable.");
  const supportBlock = supportLines.length ? `\n\nLearning Support mode is ON for this student — follow these additional rules:\n${supportLines.join("\n")}` : "";

  let languageBlock = "";
  if (lang?.name && lang.name !== "English") {
    languageBlock = lang.bilingual
      ? `\n\nLanguage: respond bilingually. Give your full explanation in English first, clearly labeled "**English:**", then give the same explanation again in ${lang.name}, labeled "**${lang.name}:**". Keep both versions complete, not summaries of each other.`
      : `\n\nLanguage: respond entirely in ${lang.name}, using natural, fluent ${lang.name} appropriate for a student — not a literal word-for-word translation. Still follow the markdown formatting and follow-up-question rules below, but write the follow-up questions in ${lang.name} too.`;
  }

  return `You are Cognify AI, an expert educational tutor.${gradeLine}
Current subject focus: ${subject}.

Teaching principles — follow all of these:
- Explain step by step, checking understanding before moving on rather than dumping everything at once.
- Use simple, plain-language explanations before introducing technical terms; define terms when you use them.
- Provide at least one concrete example for any new concept.
- Ask a guiding question when it would help the student think it through themselves, rather than just stating the answer.
- Prefer teaching the method over handing over the final answer directly — unless the student explicitly asks for just the answer or says they already understand the concept.
- Support both beginner-friendly and advanced/rigorous explanations depending on what the student asks for and how they respond.${supportBlock}${languageBlock}

Formatting — use real markdown:
- Short paragraphs, numbered steps, and bullet lists.
- Fenced code blocks with a language tag for any code (\`\`\`python, \`\`\`js, etc).
- Markdown tables when comparing multiple things.
- Inline math as $x^2$ and block equations as $$x^2$$.

Required last line: after your full response, on its own line, output EXACTLY this format with 2-3 short
natural follow-up questions the student might ask next (no other text on that line):
<!--FOLLOWUPS: First question? | Second question? | Third question?-->`;
}

export function buildUserContent(text, attachments) {
  if (!attachments || attachments.length === 0) return text;
  const blocks = [];
  for (const att of attachments) {
    if (att.kind === "image") blocks.push({ type: "image", source: { type: "base64", media_type: att.mediaType, data: att.base64 } });
    else if (att.kind === "pdf") blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: att.base64 } });
  }
  blocks.push({ type: "text", text: text || "Please look at the attached file and help me understand it." });
  return blocks;
}

export async function streamTutor(history, subject, gradeLevel, a11y, lang, { onDelta, signal } = {}) {
  const msgs = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.role === "user" ? buildUserContent(m.content, m.attachments) : m.content,
  }));
  const raw = await streamClaude(msgs, tutorSystemPrompt(subject, gradeLevel, a11y, lang), {
    maxTokens: 1900,
    signal,
    onDelta: (full) => onDelta?.(extractFollowUps(full).content),
  });
  return extractFollowUps(raw);
}

export async function solveHomework(questionText, attachments, gradeLevel) {
  const system = `You are Cognify AI's Homework Helper. A student has asked for help with a homework question
(as text and/or an attached image/PDF). Never just give the final answer — always teach the reasoning.${
  gradeLevel ? ` The student's grade/level is ${gradeLevel}; calibrate accordingly.` : ""
}
Return ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{"question":"string - the question restated in your own words, from the text and/or attachment",
"understanding":"string - 1-2 sentences on what the question is really asking and what concept it tests",
"steps":["string","string","..."],
"finalAnswer":"string - the final answer, stated plainly",
"explanation":"string - 2-4 sentences on why this answer is correct and how to recognize this kind of problem next time"}
Each entry in "steps" is ONE step of the solution written out in full (not just a fragment), in order. Use $inline$ math where helpful within any field.`;

  const content = buildUserContent(questionText || "Please look at the attached file and help me with this homework question.", attachments);
  const raw = await callClaude([{ role: "user", content }], system, 1800);
  try {
    return JSON.parse(stripFences(raw));
  } catch {
    const match = stripFences(raw).match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse the AI's response. Please try again.");
  }
}

export async function generateQuiz(topic, subject, count, difficulty, questionType, grade) {
  const typeInstruction = {
    "Multiple Choice": `Every question is multiple choice: "type":"mc", exactly 4 "choices", "correctIndex" (0-based).`,
    "True / False": `Every question is true/false: "type":"tf", "choices":["True","False"], "correctIndex" (0 for True, 1 for False).`,
    "Short Answer": `Every question is short answer: "type":"short", no "choices"/"correctIndex" — instead include "correctAnswer" (the ideal concise answer).`,
    Mixed: `Mix question types across the set: some "type":"mc" (4 choices + correctIndex), some "type":"tf" (choices ["True","False"] + correctIndex), some "type":"short" (correctAnswer, no choices).`,
  }[questionType] || `Every question is multiple choice: "type":"mc", exactly 4 "choices", "correctIndex" (0-based).`;

  const system = `You generate quiz questions for students. Return ONLY valid JSON, no markdown fences, no preamble,
matching exactly this shape:
{"questions":[{"type":"mc|tf|short","prompt":"string","choices":["a","b","c","d"]|null,"correctIndex":0|null,"correctAnswer":"string"|null,"explanation":"string"}]}
${typeInstruction}
Every question needs a one-sentence "explanation" of why the answer is correct.`;
  const user = `Subject: ${subject}\nTopic: ${topic}\nGrade/level: ${grade || "not specified"}\nDifficulty: ${difficulty}\nGenerate exactly ${count} questions.`;
  const raw = await callClaude([{ role: "user", content: user }], system, 2600);
  const parsed = JSON.parse(stripFences(raw));
  return (parsed.questions || []).map((q, i) => ({ id: `q_${Date.now()}_${i}`, type: q.type || "mc", ...q }));
}

export async function gradeShortAnswers(pairs) {
  // pairs: [{ prompt, correctAnswer, studentAnswer }]
  const system = `You are grading short-answer quiz responses. For each item, decide if the student's answer is
substantively correct compared to the ideal answer (minor wording differences are fine; the core idea must match).
Return ONLY valid JSON: {"results":[{"correct":true|false,"feedback":"one short sentence"}]} in the same order as given.`;
  const user = pairs.map((p, i) => `${i + 1}. Question: ${p.prompt}\nIdeal answer: ${p.correctAnswer}\nStudent answer: ${p.studentAnswer || "(no answer given)"}`).join("\n\n");
  const raw = await callClaude([{ role: "user", content: user }], system, 1200);
  const parsed = JSON.parse(stripFences(raw));
  return parsed.results || pairs.map(() => ({ correct: false, feedback: "Could not grade this response." }));
}

export async function generateFlashcards(topic, subject, count) {
  const system = `You generate flashcards for spaced-repetition study. Return ONLY valid JSON, no
markdown fences, no preamble, matching exactly this shape:
{"cards":[{"front":"string","back":"string"}]}
Front is a concise question or term, back is a concise accurate answer.`;
  const user = `Subject: ${subject}\nTopic: ${topic}\nGenerate exactly ${count} flashcards.`;
  const raw = await callClaude([{ role: "user", content: user }], system, 2048);
  const parsed = JSON.parse(stripFences(raw));
  return (parsed.cards || []).map((c, i) => ({ id: `c_${Date.now()}_${i}`, front: c.front, back: c.back, boxLevel: 0, nextReview: Date.now() }));
}

export async function generateFullNotes(subject, chapter, topic, difficulty) {
  const system = `You write comprehensive study notes for students. Return ONLY valid JSON, no markdown
fences, no preamble, matching exactly this shape:
{"shortNotes":"string - a concise 3-5 sentence overview of the topic",
"detailedNotes":"string - a thorough explanation in multiple short paragraphs, markdown allowed (headings, bold, lists)",
"keyPoints":["string","string","..."],
"definitions":[{"term":"string","definition":"string"}],
"formulas":["string","..."],
"examples":["string","..."],
"summary":"string - a short wrap-up paragraph tying it together",
"revisionNotes":["string","..."]}
Calibrate depth and vocabulary to the given difficulty level. "formulas" should be an EMPTY array if the
subject/topic has no relevant formulas (e.g. literature, history) — do not force irrelevant content.
"definitions" should cover the important terms a student needs to know. "revisionNotes" should be short,
quick-scan bullet points suitable for last-minute review right before a test.`;
  const user = `Subject: ${subject}\nChapter: ${chapter || "not specified"}\nTopic: ${topic}\nDifficulty: ${difficulty}`;
  return generateStructuredJSON(system, user, 2400);
}

export async function translateText(text, fromLang, targetLang) {
  const fromLine = fromLang && fromLang !== "Auto-detect" ? `The text is in ${fromLang}.` : "Detect the source language automatically.";
  const system = `You are a precise translator. ${fromLine} Translate the user's text into ${targetLang}. Return
ONLY the translation, no explanation, no quotation marks, no original text repeated.`;
  return callClaude([{ role: "user", content: text }], system, 800);
}

export async function generateStructuredJSON(system, user, maxTokens = 1400) {
  const raw = await callClaude([{ role: "user", content: user }], `${system}\nReturn ONLY valid JSON, no markdown fences, no preamble.`, maxTokens);
  try {
    return JSON.parse(stripFences(raw));
  } catch {
    return JSON.parse(stripFences(raw).match(/\{[\s\S]*\}/)?.[0] || "{}");
  }
}

export async function generateMindMapFull(topic) {
  const system = `You generate mind maps for students. Given a topic, produce a central idea with 4-6 main
branches, each with 2-4 sub-branches (subtopics), plus a short separate list of overall key concepts.
Keep every branch/subtopic label very short (2-6 words).
Shape exactly: {"topic":"string","branches":[{"label":"string","children":["string","string"]}],"keyConcepts":["string","string"]}`;
  return generateStructuredJSON(system, topic, 1400);
}

export async function summarizeVoiceSession(transcriptText) {
  const system = `You summarize a voice-based tutoring conversation between a student and an AI tutor.
Write a concise summary (4-6 sentences) of what was covered and any key takeaways, in plain language
suitable for the student to review later.`;
  return callClaude([{ role: "user", content: transcriptText }], system, 700);
}

export async function generateBoardExamPlan({ board, grade, subject, chapter, examDate, daysLeft }) {
  const system = `You are an exam-preparation assistant for Indian school students (CBSE/ICSE/State Board syllabi).
Given the exam details, generate a complete preparation package. Return ONLY valid JSON, no markdown fences,
no preamble, matching exactly this shape:
{"studyPlan":"string - a week-by-week or phase-by-phase study plan overview, markdown allowed",
"revisionPlan":"string - a focused revision plan for the final stretch before the exam, markdown allowed",
"importantQuestions":["string","..."],
"previousYearQuestions":["string","..."],
"formulaSheet":["string","..."],
"expectedQuestions":["string","..."],
"mockTest":[{"prompt":"string","choices":["a","b","c","d"],"correctIndex":0}],
"dailyTasks":["string","..."],
"revisionReminders":["string","..."]}
Notes: "previousYearQuestions" should be AI-generated questions in the realistic STYLE and difficulty of past
${board} exams for this chapter — clearly representative practice, not claimed to be verified real past papers.
"formulaSheet" should be an empty array if the subject/chapter has no relevant formulas. "mockTest" should have
5 multiple-choice questions (4 choices each, correctIndex 0-based). Calibrate everything to ${board}, grade
${grade}, ${daysLeft} days remaining until the exam.`;
  const user = `Board: ${board}\nGrade: ${grade}\nSubject: ${subject}\nChapter: ${chapter}\nExam date: ${examDate}\nDays remaining: ${daysLeft}`;
  return generateStructuredJSON(system, user, 3000);
}

/* ---------------------------------- AI Tools config ---------------------------------- */

export async function askVoiceTutor(history) {
  const system = `You are Cognify AI in Voice Learning mode — your reply will be read aloud by text-to-speech.
Keep responses conversational, natural-sounding, and concise (3-6 sentences). Explain step by step but
briefly, the way a patient tutor would speak out loud. Avoid markdown formatting, bullet lists, headings, or
code blocks — use plain spoken sentences only. Ask a short follow-up question when it helps the student think.`;
  const msgs = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));
  return callClaude(msgs, system, 500);
}

/* ---------------------------------- Voice Learning ---------------------------------- */

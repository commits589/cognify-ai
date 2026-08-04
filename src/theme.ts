import { GLASS_BORDER } from "./theme";
import { MessageSquare, BookOpen, Layers, Users, ShieldCheck, Mic, GraduationCap, Sparkles, Calculator, FlaskConical, SpellCheck, PenLine, Network, Code2, History, Globe, HelpCircle, ClipboardList, Presentation as PresentationIcon, ClipboardCheck, FileQuestion, Table, UserCheck, School as SchoolIcon, Megaphone, Flag, ToggleLeft, BarChart3, FileBarChart2 } from "lucide-react";

export const C = {
  ink: "#F5F3FF", inkLight: "#EDE9FE", inkSoft: "#B4AECD",
  paper: "#0A0B18", paperDim: "#12142A",
  chalk: "#8B5CF6", chalkDark: "#7C3AED", chalkLight: "#C4B5FD",
  sage: "#34D399", sageDark: "#10B981",
  flag: "#F87171", flagDark: "#EF4444",
  slate: "#8B87A8", slateLight: "#5D5A7A",
  blue: "#4F8CFF",
};

export const GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #6D5DFB 50%, #4F8CFF 100%)";

export const GLOW = "0 0 0 1px rgba(139,92,246,0.18), 0 8px 24px -4px rgba(109,61,224,0.45), 0 0 44px -10px rgba(79,140,255,0.4)";

export const GLASS_BG = "rgba(255,255,255,0.035)";

export const GLASS_BORDER = "rgba(255,255,255,0.09)";

export const SUBJECTS = ["Math", "Science", "English", "History", "Computer Science", "Languages", "Art", "General"];

export const SUBJECT_COLORS = {
  Math: "#3D6BC7", Science: "#6B9080", English: "#C24E33", History: "#C7961F",
  "Computer Science": "#6B4FA0", Languages: "#2596A1", Art: "#D65A9E", General: "#5B6478",
};

export const subjectColor = (s) => SUBJECT_COLORS[s] || SUBJECT_COLORS.General;

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const dayKey = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

/* ---------------------------------- AI backend calls ---------------------------------- */
// Every AI feature in this app funnels through these two functions. Neither one talks
// to any AI provider directly — both POST to /.netlify/functions/ai-chat, a serverless
// function that holds the real Gemini API key server-side (see netlify/functions/ai-chat.js).
// The browser never sees the key. If the backend is unreachable (e.g. this file opened
// locally without being deployed alongside netlify/functions/), these THROW a real error
// — they never fall back to a canned/fabricated response.

export const AI_TOOLS = [
  {
    key: "math-solver", title: "Math Solver", desc: "Step-by-step solutions to any math problem.", icon: Calculator, color: "#8B5CF6", kind: "markdown",
    fields: [{ key: "input", label: "Math problem", type: "textarea", placeholder: "e.g. Solve for x: 3x + 7 = 22" }],
    system: () => `You are a math tutor. Solve the given problem step by step, showing every step and the reasoning behind it, and clearly state the final answer at the end under "**Answer:**". Use $inline$ math and $$block$$ math where helpful. Use numbered markdown steps.`,
  },
  {
    key: "science-explainer", title: "Science Explainer", desc: "Clear explanations of science concepts.", icon: FlaskConical, color: "#34D399", kind: "markdown",
    fields: [{ key: "input", label: "Science topic", type: "text", placeholder: "e.g. Photosynthesis, Newton's laws, DNA replication" }],
    system: () => `Explain the given science topic clearly for a student: what it is, why it matters, and one real-world example. Use short headings and bullet points. Keep it accurate and age-appropriate.`,
  },
  {
    key: "grammar-checker", title: "Grammar Checker", desc: "Find and fix grammar, spelling, and clarity issues.", icon: SpellCheck, color: "#4F8CFF", kind: "markdown",
    fields: [{ key: "input", label: "Text to check", type: "textarea", placeholder: "Paste your sentence or paragraph here…" }],
    system: () => `You are a careful grammar and writing checker. List the specific errors found (grammar, spelling, punctuation, clarity) with brief corrections, then provide the fully corrected version under a heading "## Corrected version". If there are no errors, say so briefly and still show the text under "## Corrected version".`,
  },
  {
    key: "essay-writer", title: "Essay Writer", desc: "Drafts a structured essay on any topic.", icon: PenLine, color: "#C4B5FD", kind: "markdown",
    fields: [
      { key: "input", label: "Essay topic", type: "text", placeholder: "e.g. The impact of social media on teenagers" },
      { key: "essayType", label: "Essay type", type: "select", options: ["Argumentative", "Narrative", "Descriptive", "Expository", "Compare & Contrast"], default: "Argumentative" },
      { key: "wordCount", label: "Approx. word count", type: "number", default: 400 },
    ],
    system: (f) => `Write a well-structured ${f.essayType || "Argumentative"} essay on the given topic, approximately ${f.wordCount || 400} words, with a clear introduction, body paragraphs, and conclusion. Use proper paragraphs, not bullet points, unless the essay type calls for a list.`,
  },
  {
    key: "mindmap", title: "Mind Map Generator", desc: "Visual, branching breakdown of a topic with zoom & pan.", icon: Network, color: "#F472B6", kind: "link", linkView: "mindmap-tool",
  },
  {
    key: "code-assistant", title: "Code Assistant", desc: "Write, fix, or explain code.", icon: Code2, color: "#93C5FD", kind: "markdown",
    fields: [
      { key: "input", label: "What do you need help with?", type: "textarea", placeholder: "e.g. Write a function that reverses a linked list" },
      { key: "language", label: "Language", type: "select", options: ["Any", "Python", "JavaScript", "Java", "C++", "C", "SQL", "HTML/CSS"], default: "Any" },
    ],
    system: (f) => `You are a coding tutor. Help with the given task${f.language && f.language !== "Any" ? ` in ${f.language}` : ""}. Provide working code in a fenced code block with a language tag, followed by a brief plain-language explanation of how it works.`,
  },
  {
    key: "timeline", title: "History Timeline Generator", desc: "Chronological breakdown of historical events.", icon: History, color: "#C7961F", kind: "timeline",
    fields: [{ key: "input", label: "Topic or period", type: "text", placeholder: "e.g. The Civil Rights Movement" }],
    system: () => `You generate history timelines for students. Given a topic, produce 5-8 key events in chronological order, each with a year/date, a short title, and a one-sentence description.
Shape exactly: {"topic":"string","events":[{"date":"string","title":"string","description":"string"}]}`,
  },
  {
    key: "geography-explainer", title: "Geography Explainer", desc: "Places, features, and concepts explained.", icon: Globe, color: "#2596A1", kind: "markdown",
    fields: [{ key: "input", label: "Place or geography topic", type: "text", placeholder: "e.g. The Amazon Rainforest, plate tectonics" }],
    system: () => `Explain the given geography topic clearly: key facts, location/context, and why it matters. Include a short markdown table of 3-5 key facts if relevant (e.g. location, size, population, climate).`,
  },
  {
    key: "flashcards", title: "Flashcard Generator", desc: "Opens the full Flashcards tool.", icon: Layers, color: "#6EE7B7", kind: "link", linkView: "flashcards",
  },
  {
    key: "question-generator", title: "Question Generator", desc: "Open-ended practice questions with model answers.", icon: HelpCircle, color: "#F87171", kind: "markdown",
    fields: [
      { key: "input", label: "Topic", type: "text", placeholder: "e.g. The French Revolution" },
      { key: "count", label: "Number of questions", type: "number", default: 5 },
      { key: "qType", label: "Question type", type: "select", options: ["Short answer", "Discussion / essay-style"], default: "Short answer" },
    ],
    system: (f) => `Generate exactly ${f.count || 5} ${f.qType || "Short answer"} practice questions on the given topic to test a student's understanding. Number each question, and after each one include a brief model answer under "Answer:".`,
  },
  {
    key: "lesson-planner", title: "Lesson Planner", desc: "Full lesson plans for teachers.", icon: ClipboardList, color: "#8B5CF6", kind: "markdown",
    fields: [
      { key: "input", label: "Topic", type: "text", placeholder: "e.g. Introduction to fractions" },
      { key: "grade", label: "Grade level", type: "text", placeholder: "e.g. 5th grade" },
      { key: "duration", label: "Class duration", type: "text", placeholder: "e.g. 45 minutes", default: "45 minutes" },
    ],
    system: (f) => `You are a teacher's assistant. Create a lesson plan for the given topic, for grade level "${f.grade || "unspecified"}", duration "${f.duration || "45 minutes"}". Include markdown headings for: Learning Objectives, Materials Needed, Lesson Steps (with rough timing for each), and Assessment / Check for Understanding.`,
  },
  {
    key: "presentation", title: "Presentation Generator", desc: "Slide-by-slide outline on any topic.", icon: PresentationIcon, color: "#4F8CFF", kind: "slides",
    fields: [
      { key: "input", label: "Topic", type: "text", placeholder: "e.g. The Solar System" },
      { key: "slideCount", label: "Number of slides", type: "number", default: 8 },
    ],
    system: (f) => `You generate presentation outlines for students. Given a topic, produce exactly ${f.slideCount || 8} slides, each with a short title and 3-5 concise bullet points (no full sentences, just key points).
Shape exactly: {"title":"string","slides":[{"title":"string","bullets":["string","string"]}]}`,
  },
  {
    key: "worksheet", title: "Worksheet Generator", desc: "Printable practice worksheets with an answer key.", icon: ClipboardCheck, color: "#34D399", kind: "markdown", teacherTool: true,
    fields: [
      { key: "input", label: "Topic", type: "text", placeholder: "e.g. Two-digit multiplication" },
      { key: "grade", label: "Grade level", type: "text", placeholder: "e.g. 4th grade" },
      { key: "count", label: "Number of problems", type: "number", default: 12 },
    ],
    system: (f) => `You create student worksheets for teachers. Generate exactly ${f.count || 12} practice problems on the given topic, appropriate for grade "${f.grade || "unspecified"}", numbered clearly. After all problems, add a "## Answer Key" section with the answers numbered to match. Keep problems varied in difficulty (easy → harder).`,
  },
  {
    key: "question-paper", title: "Question Paper Generator", desc: "Sectioned exam papers with marks allocation.", icon: FileQuestion, color: "#8B5CF6", kind: "markdown", teacherTool: true,
    fields: [
      { key: "input", label: "Subject / chapters covered", type: "text", placeholder: "e.g. Algebra: Chapters 3-5" },
      { key: "grade", label: "Grade level", type: "text", placeholder: "e.g. 8th grade" },
      { key: "totalMarks", label: "Total marks", type: "number", default: 50 },
      { key: "duration", label: "Duration", type: "text", placeholder: "e.g. 90 minutes", default: "90 minutes" },
    ],
    system: (f) => `You create formal exam question papers for teachers. Total marks: ${f.totalMarks || 50}. Duration: ${f.duration || "90 minutes"}. Grade: "${f.grade || "unspecified"}".
Structure it as a real question paper: a heading with subject/duration/total marks, then sections (e.g. Section A: Multiple Choice, Section B: Short Answer, Section C: Long Answer) each with a mark value per question shown in brackets like "(2 marks)", and instructions at the top. Use markdown headings and numbered lists.`,
  },
  {
    key: "assignment", title: "Assignment Generator", desc: "Structured assignment briefs with tasks and criteria.", icon: PenLine, color: "#F472B6", kind: "markdown", teacherTool: true,
    fields: [
      { key: "input", label: "Assignment topic", type: "text", placeholder: "e.g. Persuasive essay on a local issue" },
      { key: "grade", label: "Grade level", type: "text", placeholder: "e.g. 7th grade" },
      { key: "dueDate", label: "Due date (optional)", type: "text", placeholder: "e.g. Friday, March 14" },
    ],
    system: (f) => `You write assignment briefs for teachers to hand out to students. Grade: "${f.grade || "unspecified"}".${f.dueDate ? ` Due date: ${f.dueDate}.` : ""}
Include: a clear objective, the task instructions (numbered steps), what to submit, and 3-4 grading criteria at the end under "## What you'll be graded on". Keep the tone appropriate to speak directly to students.`,
  },
  {
    key: "rubric", title: "Rubric Generator", desc: "Grading rubrics with criteria and performance levels.", icon: Table, color: "#4F8CFF", kind: "markdown", teacherTool: true,
    fields: [
      { key: "input", label: "Assignment or project", type: "text", placeholder: "e.g. Science fair project" },
      { key: "criteriaCount", label: "Number of criteria", type: "number", default: 4 },
    ],
    system: (f) => `You create grading rubrics for teachers. Generate exactly ${f.criteriaCount || 4} grading criteria for the given assignment.
Present it as a markdown table with columns: Criteria | Excellent (4) | Good (3) | Fair (2) | Needs Improvement (1) — each cell containing a short description of what that performance level looks like for that criterion.`,
  },
];

/* ---------------------------------- small UI primitives ---------------------------------- */

export const inputStyle = { border: `1px solid ${GLASS_BORDER}`, background: "rgba(255,255,255,0.04)", color: C.ink };

export const inputClass = "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 transition-shadow placeholder:text-[#5D5A7A]";

export const FEATURE_CARDS = [
  { key: "ask-ai", title: "Ask AI", desc: "Open-ended help on anything", icon: Sparkles, color: "#8B5CF6" },
  { key: "homework", title: "Homework Helper", desc: "Work through a problem together", icon: BookOpen, color: "#4F8CFF" },
  { key: "explain", title: "Explain Concepts", desc: "Step-by-step breakdowns", icon: GraduationCap, color: "#34D399" },
  { key: "quiz-gen", title: "Quiz Generator", desc: "Instant quizzes on any topic", icon: Layers, color: "#C4B5FD" },
  { key: "notes", title: "Notes Generator", desc: "Clean, scannable study notes", icon: BookOpen, color: "#93C5FD" },
  { key: "translate", title: "Translate", desc: "Translate text between languages", icon: MessageSquare, color: "#34D399" },
  { key: "voice", title: "Voice Learning", desc: "Talk it through out loud", icon: Mic, color: "#F87171" },
  { key: "exam", title: "Board Exam Mode", desc: "Timed, exam-style practice sets", icon: ShieldCheck, color: "#8B5CF6" },
];

export const NOTE_TABS = [
  { key: "shortNotes", label: "Short Notes" },
  { key: "detailedNotes", label: "Detailed Notes" },
  { key: "keyPoints", label: "Key Points" },
  { key: "definitions", label: "Definitions" },
  { key: "formulas", label: "Formulas" },
  { key: "examples", label: "Examples" },
  { key: "summary", label: "Summary" },
  { key: "revisionNotes", label: "Revision Notes" },
];

export const INDIAN_LANGUAGES = ["Kannada", "Hindi", "Tamil", "Telugu", "Marathi", "Malayalam"];

export const LANGUAGES = [...INDIAN_LANGUAGES, "Spanish", "French", "Mandarin Chinese", "Arabic", "Portuguese", "German", "Japanese", "Korean", "Vietnamese"];

export const ALL_LANGUAGES = ["English", ...LANGUAGES];

export const TEACHER_CARDS = [
  { key: "lesson-planner", title: "Create Lesson Plans", desc: "Objectives, materials, steps, assessment.", icon: ClipboardList, color: "#8B5CF6", type: "ai-tool" },
  { key: "worksheet", title: "Generate Worksheets", desc: "Practice problems with an answer key.", icon: ClipboardCheck, color: "#34D399", type: "ai-tool" },
  { key: "question-paper", title: "Generate Question Papers", desc: "Sectioned exam papers with marks.", icon: FileQuestion, color: "#8B5CF6", type: "ai-tool" },
  { key: "assignment", title: "Generate Assignments", desc: "Task briefs with grading criteria.", icon: PenLine, color: "#F472B6", type: "ai-tool" },
  { key: "rubric", title: "Create Rubrics", desc: "Grading tables with performance levels.", icon: Table, color: "#4F8CFF", type: "ai-tool" },
  { key: "presentation", title: "Generate PPT Outlines", desc: "Slide-by-slide presentation outlines.", icon: PresentationIcon, color: "#4F8CFF", type: "ai-tool" },
  { key: "quizzes", title: "Create Quizzes", desc: "AI-generated or manual, assignable to a class.", icon: BookOpen, color: "#C4B5FD", type: "view" },
  { key: "student-performance", title: "Track Student Performance", desc: "See how your classes are doing.", icon: UserCheck, color: "#34D399", type: "view" },
  { key: "classes", title: "Manage Classes", desc: "Rosters, join codes, and enrollment.", icon: Users, color: "#6EE7B7", type: "view" },
  { key: "profile", title: "Teacher Profile", desc: "Your name, subjects, and preferences.", icon: GraduationCap, color: "#F87171", type: "view" },
];

export const EXAM_TABS = [
  { key: "studyPlan", label: "Study Plan" },
  { key: "revisionPlan", label: "Revision Plan" },
  { key: "importantQuestions", label: "Important Questions" },
  { key: "previousYearQuestions", label: "Previous Year Style" },
  { key: "formulaSheet", label: "Formula Sheet" },
  { key: "expectedQuestions", label: "Expected Questions" },
  { key: "mockTest", label: "Mock Test" },
  { key: "dailyTasks", label: "Daily Tasks" },
  { key: "revisionReminders", label: "Reminders" },
];

export const BOX_DAYS = [0, 1, 3, 7, 14];

export const ADMIN_CARDS = [
  { key: "users", title: "User Management", desc: "Search, filter, and manage every account.", icon: Users, color: "#8B5CF6" },
  { key: "students", title: "Student Management", desc: "View and manage student accounts.", icon: GraduationCap, color: "#4F8CFF" },
  { key: "teachers", title: "Teacher Management", desc: "View and manage teacher accounts.", icon: UserCheck, color: "#34D399" },
  { key: "schools", title: "School Management", desc: "Schools on the platform and their rosters.", icon: SchoolIcon, color: "#C4B5FD" },
  { key: "verification", title: "Teacher Verification", desc: "Approve or revoke teacher status.", icon: ShieldCheck, color: "#34D399" },
  { key: "moderation", title: "Content Moderation", desc: "Review flagged messages and content.", icon: Flag, color: "#F87171" },
  { key: "feedback", title: "Feedback Management", desc: "User-submitted bug reports and ideas.", icon: Megaphone, color: "#F472B6" },
  { key: "features", title: "Feature Controls", desc: "Turn platform features on or off.", icon: ToggleLeft, color: "#8B5CF6" },
  { key: "announcements", title: "Announcements", desc: "Post a banner to all students & teachers.", icon: Megaphone, color: "#4F8CFF" },
  { key: "analytics", title: "Analytics", desc: "Usage and role breakdown charts.", icon: BarChart3, color: "#93C5FD" },
  { key: "reports", title: "Reports", desc: "Export platform data as CSV/JSON.", icon: FileBarChart2, color: "#6EE7B7" },
  { key: "roles", title: "Roles & Permissions", desc: "What each role can access.", icon: ShieldCheck, color: "#C4B5FD" },
];

export const PIE_COLORS = ["#8B5CF6", "#4F8CFF", "#34D399", "#F472B6"];

export const BOARDS = ["CBSE", "ICSE", "State Board", "Other"];

export const LEARNING_STYLES = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic", "Mixed"];

export const ROLE_OPTIONS = [
  { value: "student", label: "Student", blurb: "Chat with the AI tutor, take quizzes, review flashcards." },
  { value: "teacher", label: "Teacher", blurb: "Create classes, assign quizzes, track student progress." },
  { value: "admin", label: "Admin", blurb: "Manage users and roles across the school." },
];

export const CODE_KEYWORDS = "function|return|const|let|var|if|else|for|while|class|import|from|export|def|print|True|False|None|null|undefined|new|this|self|try|except|catch|finally|async|await|in|of|is|not|and|or|elif|lambda|yield|break|continue|switch|case|default|public|private|static|void|int|String|struct|fn|impl|use|pub|match";

export const CODE_TOKEN_RE = new RegExp(`("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(//.*|#.*)|(\\b\\d+\\.?\\d*\\b)|(\\b(?:${CODE_KEYWORDS})\\b)`, "g");

export const INLINE_RE = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\$[^$\n]+\$)|(\*[^*]+\*)/g;

export const FENCE_RE = /```(\w*)\n?([\s\S]*?)```/g;

export const FOLLOWUP_RE = /<!--FOLLOWUPS:\s*([\s\S]*?)-->/;

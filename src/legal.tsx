import { GLASS_BORDER } from "./theme";
import { useState } from "react";
import { X, ChevronLeft, FileText, Download, Trash2 } from "lucide-react";
import { downloadText } from "./aiClient";
import { C } from "./theme";
import { Card, DataActionRow, PageHeader } from "./ui";

export function LegalSection({ title, children }) {
  return (
    <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
      <h2 className="text-sm font-semibold mb-2" style={{ color: C.ink }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: C.inkSoft }}>{children}</div>
    </div>
  );
}

export function exportUserDataFile(user, appData) {
  const payload = { exportedAt: new Date().toISOString(), user, ...appData };
  downloadText(`cognify-data-${todayKey()}.json`, JSON.stringify(payload, null, 2));
}

export function PrivacyPolicy({ user, appData, onDeleteAccount, onDeleteChatHistory, onDeleteSavedFiles, setView }) {
  const [confirming, setConfirming] = useState(null); // 'account' | 'chats' | 'files' | null
  const [done, setDone] = useState(null);

  function runAction(action, fn) {
    fn();
    setConfirming(null);
    setDone(action);
    setTimeout(() => setDone(null), 2000);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
      <button onClick={() => setView("settings")} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Back to Settings</button>
      <PageHeader title="Privacy Policy" subtitle="What Cognify AI collects, how it's used, and how to control it." />

      <Card className="p-5 mb-5" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
        <p className="text-xs" style={{ color: C.chalkLight }}>
          This page describes how Cognify AI is designed to handle data. It is written in plain language for transparency and is <strong>not a substitute for legal advice</strong>. We do not claim compliance with any specific privacy law (e.g. GDPR, COPPA, FERPA) unless that compliance work has actually been implemented and verified — treat this as a product-level description, not a legal certification.
        </p>
      </Card>

      <Card className="p-6">
        <LegalSection title="What data is collected">
          <p>Account details you provide at signup (name, email, role, and optional profile fields like grade, school, and subjects); content you create or send, including chat messages, uploaded images/PDFs, quiz answers, generated notes, and voice input transcribed to text; and usage data needed for features to work, like study streaks and quiz history.</p>
          <p>We do not collect data beyond what's needed to provide the features you use.</p>
        </LegalSection>
        <LegalSection title="How account data is stored">
          <p>In the production design of this app, account and profile data is stored in a managed database (Firestore) tied to your authenticated account, protected by access rules so only you — and, where relevant, your teacher or school admin — can read it.</p>
          <p>This is not always true in every environment this app runs in — for example, temporary preview or demo instances may keep data only in local browser memory for the length of the session, with nothing persisted afterward.</p>
        </LegalSection>
        <LegalSection title="How AI requests are processed">
          <p>When you ask the AI tutor a question, generate a quiz, or use any AI tool, your input (text, and any attached image/PDF) is sent to a third-party AI model provider to generate a response. This request is routed through a backend we control — your API credentials or provider account details are never exposed to your browser.</p>
          <p>AI providers may process requests to generate the response but content is not used by Cognify to train models, and we don't sell AI request content to third parties.</p>
        </LegalSection>
        <LegalSection title="How uploaded files are handled">
          <p>Images and PDFs you attach (e.g. in Homework Helper or chat) are sent to the AI provider solely to answer your question, and are stored alongside the conversation they belong to so you can revisit it. They are not scanned for advertising, not sold, and not shared outside the app except as needed to generate your response.</p>
        </LegalSection>
        <LegalSection title="How you can delete data">
          <p>You can delete your chat history, your uploaded files, or your entire account and all associated data at any time using the controls below. Deletion removes the data from active storage; it does not create a legal guarantee of removal from backups unless specifically implemented.</p>
        </LegalSection>
        <LegalSection title="Cookies & local storage">
          <p>Cognify AI uses local/session browser storage to keep you signed in and remember interface preferences (like theme and font size) — not for third-party advertising or cross-site tracking. No ad-tracking cookies are used.</p>
        </LegalSection>
      </Card>

      <Card className="p-6 mt-5">
        <h2 className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Manage your data</h2>
        <p className="text-xs mb-4" style={{ color: C.slate }}>These actions run immediately on this account/session.</p>

        <div className="space-y-3">
          <DataActionRow
            label="Export user data" description="Download everything stored for your account as a JSON file."
            actionLabel="Export" variant="secondary" icon={Download}
            onClick={() => exportUserDataFile(user, appData)}
          />
          <DataActionRow
            label="Delete chat history" description="Permanently remove all your AI tutor conversations."
            actionLabel="Delete" variant="danger" icon={Trash2}
            confirming={confirming === "chats"} done={done === "chats"}
            onClick={() => setConfirming("chats")}
            onConfirm={() => runAction("chats", onDeleteChatHistory)}
            onCancel={() => setConfirming(null)}
          />
          <DataActionRow
            label="Delete saved files" description="Remove all images/PDFs you've uploaded from your chat history."
            actionLabel="Delete" variant="danger" icon={FileText}
            confirming={confirming === "files"} done={done === "files"}
            onClick={() => setConfirming("files")}
            onConfirm={() => runAction("files", onDeleteSavedFiles)}
            onCancel={() => setConfirming(null)}
          />
          <DataActionRow
            label="Delete account" description="Permanently delete your account and all associated data."
            actionLabel="Delete account" variant="danger" icon={X}
            confirming={confirming === "account"} done={done === "account"}
            onClick={() => setConfirming("account")}
            onConfirm={() => runAction("account", onDeleteAccount)}
            onCancel={() => setConfirming(null)}
          />
        </div>
      </Card>

      <button onClick={() => setView("terms")} className="text-xs mt-5 hover:underline block" style={{ color: C.chalkLight }}>View Terms & Conditions →</button>
    </div>
  );
}

export function TermsAndConditions({ setView }) {
  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto">
      <button onClick={() => setView("settings")} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Back to Settings</button>
      <PageHeader title="Terms & Conditions" subtitle="The rules for using Cognify AI." />

      <Card className="p-5 mb-5" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
        <p className="text-xs" style={{ color: C.chalkLight }}>This is a plain-language product terms template, not reviewed by a lawyer. Treat it as a starting point for a real deployment, not a finished legal document.</p>
      </Card>

      <Card className="p-6">
        <LegalSection title="User responsibilities">
          <p>You agree to use Cognify AI for its intended educational purpose, to provide accurate account information, to keep your login credentials confidential, and not to use the service to cheat on proctored assessments where AI assistance is prohibited by your school's own rules.</p>
        </LegalSection>
        <LegalSection title="AI limitations">
          <p>Cognify AI's responses are generated by an AI model and can be incomplete, out of date, or simply wrong — including math, science, and factual answers that look confident but aren't correct. Always verify important answers, especially before submitting graded work.</p>
        </LegalSection>
        <LegalSection title="Educational disclaimer">
          <p>Cognify AI is a study aid, not a substitute for instruction from a qualified teacher, nor a guarantee of academic performance or exam results. Practice materials (including "previous year style" exam questions) are AI-generated approximations, not verified official exam content.</p>
        </LegalSection>
        <LegalSection title="Content policy">
          <p>Don't use Cognify AI to generate harmful, harassing, dishonest (e.g. plagiarism intended to deceive), or illegal content. Teachers and admins may review content created within their classes for moderation purposes.</p>
        </LegalSection>
        <LegalSection title="Account rules">
          <p>One account per person. Students, teachers, and admins each get access appropriate to their role; you agree not to misrepresent your role to gain access you're not entitled to.</p>
        </LegalSection>
        <LegalSection title="Intellectual property">
          <p>You retain ownership of the content you create (notes, essays, uploaded files). Cognify AI and its branding, design, and underlying software are owned by their respective creators. AI-generated output is provided for your educational use; check your institution's policy on AI-assisted work before submitting it as your own.</p>
        </LegalSection>
        <LegalSection title="Service availability">
          <p>Cognify AI is provided "as is" without uptime guarantees. Features depending on third-party AI providers may be temporarily unavailable or degraded if that provider has an outage.</p>
        </LegalSection>
        <LegalSection title="Termination">
          <p>Accounts that violate these terms (e.g. abuse, harassment, attempts to bypass safety features) may be suspended or terminated. You may delete your own account at any time from Settings → Privacy.</p>
        </LegalSection>
        <LegalSection title="Contact">
          <p>Questions about these terms or your data can be directed to your school administrator, or to the Cognify AI support contact provided by your deployment.</p>
        </LegalSection>
      </Card>

      <button onClick={() => setView("privacy")} className="text-xs mt-5 hover:underline block" style={{ color: C.chalkLight }}>← View Privacy Policy</button>
    </div>
  );
}

/* ---------------------------------- Mind Map Generator (dedicated) ---------------------------------- */

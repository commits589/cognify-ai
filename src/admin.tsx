
import { GLASS_BORDER } from "./theme";
import { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X, ChevronLeft, Check, Download, ToggleLeft } from "lucide-react";
import { downloadText } from "./aiClient";
import { ADMIN_CARDS, C, PIE_COLORS, dayKey, inputStyle, todayKey } from "./theme";
import { Btn, Card, Empty, PageHeader, Pill, StatCard, ToggleRow } from "./ui";

export function AdminPanel(props) {
  const { user, demoUsers, setDemoUsers, schools, setSchools, featureFlags, setFeatureFlags,
    announcements, setAnnouncements, feedbackList, setFeedbackList, moderationQueue, setModerationQueue,
    aiRequestCount, progress } = props;
  const [section, setSection] = useState("hub");

  if (user.role !== "admin") {
    return <div className="px-6 py-20 text-center"><p style={{ color: C.flag }}>Admins only — you don't have access to this page.</p></div>;
  }

  const inputClass = "border rounded px-3 py-2 w-full";

  if (section !== "hub") {
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
        <button onClick={back} className="flex items-center gap-1 text-xs mb-4" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Admin panel</button>
        {section === "users" && <UserManagementTable demoUsers={demoUsers} setDemoUsers={setDemoUsers} user={user} roleFilter="all" />}
        {section === "students" && <UserManagementTable demoUsers={demoUsers} setDemoUsers={setDemoUsers} user={user} roleFilter="student" />}
        {section === "teachers" && <UserManagementTable demoUsers={demoUsers} setDemoUsers={setDemoUsers} user={user} roleFilter="teacher" />}
        {section === "schools" && <SchoolManagement demoUsers={demoUsers} schools={schools} setSchools={setSchools} />}
        {section === "verification" && <TeacherVerification demoUsers={demoUsers} setDemoUsers={setDemoUsers} />}
        {section === "moderation" && <ContentModeration moderationQueue={moderationQueue} setModerationQueue={setModerationQueue} />}
        {section === "feedback" && <FeedbackManagement feedbackList={feedbackList} setFeedbackList={setFeedbackList} />}
        {section === "features" && <FeatureControls featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} />}
        {section === "announcements" && <AnnouncementsAdmin announcements={announcements} setAnnouncements={setAnnouncements} user={user} />}
        {section === "analytics" && <AdminAnalytics demoUsers={demoUsers} aiRequestCount={aiRequestCount} progress={progress} />}
        {section === "reports" && <AdminReports demoUsers={demoUsers} schools={schools} progress={progress} aiRequestCount={aiRequestCount} />}
        {section === "roles" && <RolesPermissions user={user} setDemoUsers={setDemoUsers} demoUsers={demoUsers} />}
      </div>
    );
  }

  const totalUsers = demoUsers.length + 1;
  const students = demoUsers.filter((u) => u.role === "student").length;
  const teachers = demoUsers.filter((u) => u.role === "teacher").length;
  const activeUsers = demoUsers.filter((u) => u.lastActiveAt).length + 1;
  const today = progress[todayKey()] || { minutes: 0 };
  const monthDays = Array.from({ length: 30 }, (_, i) => dayKey(-i));
  const monthlyMinutes = monthDays.reduce((a, d) => a + (progress[d]?.minutes || 0), 0);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="Admin Panel" subtitle="Platform-wide oversight and controls." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard label="Active users" value={activeUsers} />
        <StatCard label="Students" value={students} />
        <StatCard label="Teachers" value={teachers} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Schools" value={schools.length} />
        <StatCard label="AI requests (session)" value={aiRequestCount} />
        <StatCard label="Daily usage" value={`${today.minutes} min`} />
        <StatCard label="Monthly usage" value={`${monthlyMinutes} min`} />
      </div>

      <Card className="p-4 mb-6 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: C.sage, boxShadow: `0 0 8px ${C.sage}` }} />
        <div>
          <p className="text-sm font-medium" style={{ color: C.ink }}>System status: Operational</p>
          <p className="text-xs" style={{ color: C.slate }}>No incidents reported this session. AI tutor and generation tools responding normally.</p>
        </div>
      </Card>

      <p className="text-xs mb-3" style={{ color: C.slateLight }}>
        Some figures above (Schools, Active Users, Daily/Monthly Usage) reflect this demo session plus illustrative sample accounts — a production deployment would aggregate this from real accounts across your organization.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {ADMIN_CARDS.map((c) => (
          <button key={c.key} onClick={() => setSection(c.key)} className="text-left">
            <Card className="p-5 h-full transition-all hover:-translate-y-0.5 hover:brightness-110">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                <c.icon size={19} color={c.color} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: C.ink }}>{c.title}</p>
              <p className="text-xs leading-snug" style={{ color: C.slate }}>{c.desc}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export function UserManagementTable({ demoUsers, setDemoUsers, user, roleFilter }) {
  const [query, setQuery] = useState("");
  const titles = { all: "User Management", student: "Student Management", teacher: "Teacher Management" };
  const base = roleFilter === "all" ? demoUsers : demoUsers.filter((u) => u.role === roleFilter);
  const filtered = base.filter((u) => u.displayName.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader title={titles[roleFilter]} subtitle="Search, filter, change roles, or remove accounts." />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className={`${inputClass} mb-5`} style={inputStyle} aria-label="Search users" />
      <Card className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {roleFilter === "all" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
            <div><p className="text-sm font-medium" style={{ color: C.ink }}>{user.displayName} <span className="text-xs" style={{ color: C.slate }}>(you)</span></p><p className="text-xs" style={{ color: C.slate }}>{user.email}</p></div>
            <span className="text-xs capitalize px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: C.ink }}>{user.role}</span>
          </div>
        )}
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: C.slate }}>No accounts match.</p>
        ) : filtered.map((u) => (
          <div key={u.uid} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: C.ink }}>{u.displayName}</p>
              <p className="text-xs" style={{ color: C.slate }}>{u.email}{u.school ? ` · ${u.school}` : ""}{u.grade ? ` · ${u.grade}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.role} onChange={(e) => setDemoUsers((p) => p.map((x) => (x.uid === u.uid ? { ...x, role: e.target.value } : x)))} className="text-xs rounded-lg px-2.5 py-1.5 capitalize" style={inputStyle}>
                <option value="student">student</option><option value="teacher">teacher</option><option value="admin">admin</option>
              </select>
              <Btn size="sm" variant="ghost" onClick={() => setDemoUsers((p) => p.filter((x) => x.uid !== u.uid))}>Remove</Btn>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function SchoolManagement({ demoUsers, schools, setSchools }) {
  const [newSchool, setNewSchool] = useState("");
  function addSchool() {
    if (!newSchool.trim() || schools.includes(newSchool.trim())) return;
    setSchools((prev) => [...prev, newSchool.trim()]);
    setNewSchool("");
  }
  function removeSchool(s) { setSchools((prev) => prev.filter((x) => x !== s)); }

  return (
    <div>
      <PageHeader title="School Management" subtitle="Schools registered on the platform." />
      <Card className="p-4 mb-5 flex gap-2">
        <input value={newSchool} onChange={(e) => setNewSchool(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle} placeholder="Add a school name…" />
        <Btn size="sm" onClick={addSchool}>Add</Btn>
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        {schools.map((s) => {
          const roster = demoUsers.filter((u) => u.school === s);
          return (
            <Card key={s} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{s}</p>
                <button onClick={() => removeSchool(s)} className="text-xs" style={{ color: C.flag }}>Remove</button>
              </div>
              <p className="text-xs" style={{ color: C.slate }}>
                {roster.filter((u) => u.role === "student").length} students · {roster.filter((u) => u.role === "teacher").length} teachers
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherVerification({ demoUsers, setDemoUsers }) {
  const teachers = demoUsers.filter((u) => u.role === "teacher");
  function setVerified(uid, verified) { setDemoUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, verified } : u))); }

  return (
    <div>
      <PageHeader title="Teacher Verification" subtitle="Confirm a teacher's identity before granting full class-management access." />
      <Card className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {teachers.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: C.slate }}>No teacher accounts yet.</p>
        ) : teachers.map((t) => (
          <div key={t.uid} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: C.ink }}>{t.displayName}</p>
              <p className="text-xs" style={{ color: C.slate }}>{t.email} · {t.school}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill color={t.verified ? "#34D399" : "#F87171"}>{t.verified ? "Verified" : "Pending"}</Pill>
              {t.verified ? (
                <Btn size="sm" variant="ghost" onClick={() => setVerified(t.uid, false)}>Revoke</Btn>
              ) : (
                <Btn size="sm" variant="secondary" onClick={() => setVerified(t.uid, true)}>Approve</Btn>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ContentModeration({ moderationQueue, setModerationQueue }) {
  function resolve(id, status) { setModerationQueue((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m))); }
  const pending = moderationQueue.filter((m) => m.status === "pending");
  const resolved = moderationQueue.filter((m) => m.status !== "pending");

  return (
    <div>
      <PageHeader title="Content Moderation" subtitle="Review flagged messages and saved content." />
      <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.1)", color: C.chalkLight }}>Sample flagged items shown for demonstration — a production deployment would populate this from real user-generated reports.</p>
      {pending.length === 0 ? (
        <Card><Empty title="Queue is clear" description="Nothing pending review right now." /></Card>
      ) : (
        <div className="space-y-3 mb-5">
          {pending.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{m.author}</p>
                <Pill color="#F87171">{m.type}</Pill>
              </div>
              <p className="text-sm mb-3" style={{ color: C.inkSoft }}>"{m.excerpt}"</p>
              <div className="flex gap-2">
                <Btn size="sm" variant="secondary" onClick={() => resolve(m.id, "approved")}>Approve</Btn>
                <Btn size="sm" variant="danger" onClick={() => resolve(m.id, "removed")}>Remove</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.slateLight }}>Resolved</h2>
          <ul className="space-y-1.5">
            {resolved.map((m) => (
              <li key={m.id} className="text-xs flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", color: C.slate }}>
                <span>{m.author} — {m.type}</span>
                <Pill color={m.status === "approved" ? "#34D399" : "#F87171"}>{m.status}</Pill>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function FeedbackManagement({ feedbackList, setFeedbackList }) {
  function setStatus(id, status) { setFeedbackList((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f))); }
  return (
    <div>
      <PageHeader title="Feedback Management" subtitle="Bug reports and ideas submitted from Settings." />
      {feedbackList.length === 0 ? (
        <Card><Empty title="No feedback yet" description="Submissions from any user's Settings → Feedback will show up here." /></Card>
      ) : (
        <div className="space-y-3">
          {feedbackList.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{f.from}</p>
                <Pill color={f.status === "new" ? "#F472B6" : "#34D399"}>{f.status}</Pill>
              </div>
              <p className="text-sm mb-3" style={{ color: C.inkSoft }}>{f.text}</p>
              {f.status === "new" && <Btn size="sm" variant="secondary" onClick={() => setStatus(f.id, "resolved")}>Mark resolved</Btn>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureControls({ featureFlags, setFeatureFlags }) {
  const FLAGS = [
    { key: "aiTools", label: "AI Tools", description: "The AI Tools dashboard (Math Solver, Essay Writer, etc.)." },
    { key: "voiceLearning", label: "Voice Learning", description: "Talk-to-tutor voice mode." },
    { key: "boardExamMode", label: "Board Exam Mode", description: "Exam-board-specific prep plans." },
    { key: "homeworkUploads", label: "Homework file uploads", description: "Image/PDF attachments in Homework Helper." },
  ];
  return (
    <div>
      <PageHeader title="Feature Controls" subtitle="Turn platform-wide features on or off. Changes apply immediately." />
      <Card className="p-5">
        {FLAGS.map((f) => (
          <ToggleRow key={f.key} icon={ToggleLeft} label={f.label} description={f.description} checked={featureFlags[f.key]} onChange={(v) => setFeatureFlags({ [f.key]: v })} />
        ))}
      </Card>
    </div>
  );
}

export function AnnouncementsAdmin({ announcements, setAnnouncements, user }) {
  const [text, setText] = useState("");
  function post() {
    if (!text.trim()) return;
    setAnnouncements((prev) => [{ id: `ann_${Date.now()}`, text: text.trim(), author: user.displayName, active: true, createdAt: Date.now() }, ...prev]);
    setText("");
  }
  function toggleActive(id) { setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))); }
  function remove(id) { setAnnouncements((prev) => prev.filter((a) => a.id !== id)); }

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Active announcements show as a banner on every student and teacher dashboard." />
      <Card className="p-4 mb-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className={`${inputClass} mb-2`} style={inputStyle} placeholder="e.g. Report cards go out Friday — check your Progress page!" />
        <Btn size="sm" onClick={post} disabled={!text.trim()}>Post announcement</Btn>
      </Card>
      {announcements.length === 0 ? (
        <Card><Empty title="No announcements yet" description="Post one above to broadcast it platform-wide." /></Card>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm" style={{ color: C.ink }}>{a.text}</p>
                <p className="text-xs mt-0.5" style={{ color: C.slateLight }}>— {a.author}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Pill color={a.active ? "#34D399" : "#5D5A7A"}>{a.active ? "Active" : "Hidden"}</Pill>
                <Btn size="sm" variant="ghost" onClick={() => toggleActive(a.id)}>{a.active ? "Hide" : "Show"}</Btn>
                <Btn size="sm" variant="ghost" onClick={() => remove(a.id)}>Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminAnalytics({ demoUsers, aiRequestCount, progress }) {
  const roleData = [
    { name: "Students", value: demoUsers.filter((u) => u.role === "student").length },
    { name: "Teachers", value: demoUsers.filter((u) => u.role === "teacher").length },
    { name: "Admins", value: 1 },
  ];
  const days = Array.from({ length: 14 }, (_, i) => dayKey(-(13 - i)));
  const usageData = days.map((d) => ({ day: d.slice(5), minutes: progress[d]?.minutes || 0 }));
  const tooltipStyle = { background: "#12142A", border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, fontSize: 12, color: C.ink };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Role breakdown and usage trends." />
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>Users by role</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(d) => d.name}>
                {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>AI requests this session</h2>
          <div className="flex items-center justify-center h-[200px]">
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 48, color: C.ink }}>{aiRequestCount}</p>
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>Study minutes, last 14 days (this session)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.slate, fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
            <YAxis tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export function AdminReports({ demoUsers, schools, progress, aiRequestCount }) {
  function exportUsersCSV() {
    const header = "Name,Email,Role,School,Grade\n";
    const rows = demoUsers.map((u) => [u.displayName, u.email, u.role, u.school || "", u.grade || ""].map((v) => `"${v}"`).join(",")).join("\n");
    downloadText(`cognify-users-${todayKey()}.csv`, header + rows);
  }
  function exportUsageSummary() {
    const summary = { generatedAt: new Date().toISOString(), totalUsers: demoUsers.length + 1, schools, aiRequestsThisSession: aiRequestCount, dailyProgress: progress };
    downloadText(`cognify-usage-summary-${todayKey()}.json`, JSON.stringify(summary, null, 2));
  }
  return (
    <div>
      <PageHeader title="Reports" subtitle="Export platform data for offline analysis." />
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-4 py-2">
          <div><p className="text-sm font-medium" style={{ color: C.ink }}>User roster (CSV)</p><p className="text-xs" style={{ color: C.slate }}>Name, email, role, school, grade for every account.</p></div>
          <Btn size="sm" variant="secondary" onClick={exportUsersCSV}><Download size={13} /> Export</Btn>
        </div>
        <div className="flex items-center justify-between gap-4 py-2" style={{ borderTop: `1px solid ${GLASS_BORDER}` }}>
          <div><p className="text-sm font-medium" style={{ color: C.ink }}>Usage summary (JSON)</p><p className="text-xs" style={{ color: C.slate }}>Totals, schools, AI requests, and daily activity.</p></div>
          <Btn size="sm" variant="secondary" onClick={exportUsageSummary}><Download size={13} /> Export</Btn>
        </div>
      </Card>
    </div>
  );
}

export function RolesPermissions({ user, demoUsers, setDemoUsers }) {
  const ROWS = [
    { capability: "Chat with AI tutor, take quizzes, review flashcards", student: true, teacher: true, admin: true },
    { capability: "Create & assign quizzes to a class", student: false, teacher: true, admin: true },
    { capability: "Create and manage classes", student: false, teacher: true, admin: true },
    { capability: "Access Teacher Dashboard tools", student: false, teacher: true, admin: true },
    { capability: "Manage all user accounts and roles", student: false, teacher: false, admin: true },
    { capability: "Toggle platform-wide feature flags", student: false, teacher: false, admin: true },
    { capability: "Review moderation & feedback queues", student: false, teacher: false, admin: true },
  ];
  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="What each role can access on Cognify AI." />
      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="text-left pb-3" style={{ color: C.slate }}>Capability</th>
            <th className="text-center pb-3 px-2" style={{ color: C.slate }}>Student</th>
            <th className="text-center pb-3 px-2" style={{ color: C.slate }}>Teacher</th>
            <th className="text-center pb-3 px-2" style={{ color: C.slate }}>Admin</th>
          </tr></thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${GLASS_BORDER}` }}>
                <td className="py-2.5 pr-3" style={{ color: C.inkSoft }}>{r.capability}</td>
                <td className="text-center">{r.student ? <Check size={14} color={C.sage} className="inline" /> : <X size={14} color={C.slateLight} className="inline" />}</td>
                <td className="text-center">{r.teacher ? <Check size={14} color={C.sage} className="inline" /> : <X size={14} color={C.slateLight} className="inline" />}</td>
                <td className="text-center">{r.admin ? <Check size={14} color={C.sage} className="inline" /> : <X size={14} color={C.slateLight} className="inline" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------------------------------- Profile ---------------------------------- */


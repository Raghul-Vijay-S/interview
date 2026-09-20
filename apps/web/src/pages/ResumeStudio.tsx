import { useEffect, useRef, useState } from "react";
import { Send, UploadCloud } from "lucide-react";
import { api, type Analysis } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { VoiceAssistant } from "../components/VoiceAssistant";
import { pct } from "../lib/utils";

export function ResumeStudio() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.dashboard().then((data) => setAnalysis(data.analysis)).catch(() => undefined);
    api.chatHistory().then((data) => setMessages(data.messages)).catch(() => undefined);
  }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.uploadResume(file);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume upload failed");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const ask = async (text = message) => {
    if (!text.trim()) return;
    const optimistic = [...messages, { role: "user", content: text }];
    setMessages(optimistic);
    setMessage("");
    setChatLoading(true);
    setError("");
    try {
      const { message: reply } = await api.chat(text);
      setMessages([...optimistic, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analyzer chat failed");
      setMessages([...optimistic, { role: "assistant", content: "I could not generate a reply. Check the message above and try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <div className="space-y-5">
        <Card className="p-6">
          <h1 className="font-display text-3xl font-bold">Resume ATS Score Analyzer</h1>
          <p className="mt-2 text-slate-300">Upload PDF or DOCX. NEXVORA extracts skills, education, projects, experience, strengths, weaknesses, and permanent analysis history.</p>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
          <Button className="mt-6 w-full" onClick={() => fileRef.current?.click()} disabled={loading}>
            <UploadCloud className="h-4 w-4" /> {loading ? "Analyzing..." : "Upload Resume"}
          </Button>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
        </Card>

        {analysis ? (
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Score label="Resume Score" value={analysis.score} />
              <Score label="ATS Score" value={analysis.atsScore} />
            </div>
            <h2 className="mt-6 text-xl font-bold">Skill Gap Detection</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.skills.map((skill) => <span key={skill} className="rounded-full bg-cyan-300/15 px-3 py-1 text-sm text-cyan-100">{skill}</span>)}
            </div>
            <h3 className="mt-5 font-semibold text-rose-100">Missing Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill) => <span key={skill} className="rounded-full bg-rose-400/15 px-3 py-1 text-sm text-rose-100">{skill}</span>)}
            </div>
            <h3 className="mt-5 font-semibold">Company Readiness</h3>
            <div className="mt-3 space-y-3">
              {Object.entries(analysis.companyReadiness).map(([company, value]) => <Score key={company} label={company} value={value} compact />)}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-slate-300">No Resume Uploaded. Upload Resume Card is ready.</Card>
        )}
      </div>

      <Card className="flex min-h-[720px] flex-col p-6">
        <div>
          <h2 className="font-display text-3xl font-bold">AI Resume Analysis Chatbot</h2>
          <p className="mt-2 text-slate-300">Ask for weaknesses, projects, certifications, coding topics, or interview preparation roadmap. Context memory uses your uploaded resume.</p>
        </div>
        <div className="mt-5 flex-1 space-y-4 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/35 p-4">
          {messages.length === 0 && <p className="text-slate-400">Ask: “How do I improve my resume for Microsoft?”</p>}
          {messages.map((item, index) => (
            <div key={item.id ?? index} className={item.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-cyan-300 px-4 py-3 text-slate-950" : "max-w-[85%] rounded-lg bg-white/10 px-4 py-3 text-slate-100"}>
              {item.content}
            </div>
          ))}
          {chatLoading && <p className="text-sm text-cyan-100">Thinking through your resume context...</p>}
        </div>
        <div className="mt-4 space-y-3">
          <VoiceAssistant onTranscript={(text) => ask(text)} />
          <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="flex gap-2">
            <Input className="flex-1" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask NEXVORA AI..." />
            <Button><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </Card>
    </section>
  );
}

function Score({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="font-bold">{value}%</span></div>
      <div className={compact ? "mt-1 h-2 rounded-full bg-white/10" : "mt-2 h-3 rounded-full bg-white/10"}>
        <div className="h-full rounded-full bg-cyan-300" style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

import { useState } from "react";
import { Bot, Play, Send } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { VoiceAssistant } from "../components/VoiceAssistant";

const companies = ["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"];

export function InterviewLab() {
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.startInterview(company, role);
      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ""));
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start interview");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await api.submitInterview({ company, role, questions, answers });
      setResult(data.interview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit interview");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <select value={company} onChange={(event) => setCompany(event.target.value)} className="rounded-lg border border-white/12 bg-slate-950/55 px-4 text-white">
            {companies.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Input value={role} onChange={(event) => setRole(event.target.value)} />
          <Button onClick={start} disabled={loading}><Play className="h-4 w-4" /> {loading ? "Generating..." : "Start Interview"}</Button>
        </div>
        {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="grid min-h-96 place-items-center p-6 text-center">
          <div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-neon">
              <Bot className="h-14 w-14 text-cyan-100" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold">AI Interviewer Avatar</h1>
            <p className="mt-3 text-slate-300">Voice input and voice output are enabled through browser speech APIs.</p>
            <div className="mt-5 flex justify-center"><VoiceAssistant onTranscript={(text) => setAnswers((items) => items.map((item, index) => index === 0 ? `${item} ${text}`.trim() : item))} /></div>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-3xl font-bold">Company-Specific Interview Preparation</h2>
          <p className="mt-2 text-sm text-slate-300">{questions.length ? `${questions.length} fresh questions generated for ${company} ${role}.` : "Start an interview to generate a new 10-15 question mock round."}</p>
          <div className="mt-5 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Question {index + 1} / {question.type}</p>
                <p className="mt-2 font-semibold">{question.question}</p>
                <Textarea className="mt-3 w-full" value={answers[index]} onChange={(event) => setAnswers((items) => items.map((item, i) => i === index ? event.target.value : item))} placeholder="Answer with technical depth and confidence..." />
              </div>
            ))}
          </div>
          {questions.length > 0 && <Button className="mt-5" onClick={submit} disabled={submitting}><Send className="h-4 w-4" /> {submitting ? "Scoring..." : "Submit Interview"}</Button>}
          {result && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {["communicationScore", "technicalScore", "confidenceScore"].map((key) => <Card key={key} className="p-4"><p className="text-sm text-slate-400">{key.replace("Score", " Score")}</p><p className="mt-2 text-3xl font-bold">{result[key]}%</p></Card>)}
              <p className="md:col-span-3 text-slate-300">{result.feedback}</p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

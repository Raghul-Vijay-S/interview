import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const categories = ["Arrays", "Strings", "OOP", "Java", "SQL", "DBMS", "Operating Systems", "Networks"];

export function CodingArena() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("Arrays");
  const [question, setQuestion] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.codingHistory().then((data) => setHistory(data.questions.slice(0, 6))).catch(() => undefined);
  }, []);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.coding(difficulty, category);
      setQuestion(data.question);
      setHistory((items) => [data.question, ...items].slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate coding question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <Card className="p-6">
        <h1 className="font-display text-3xl font-bold">Coding Question Generation</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-lg border border-white/12 bg-slate-950/55 px-4 py-3 text-white">
            {["Easy", "Medium", "Hard"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-white/12 bg-slate-950/55 px-4 py-3 text-white">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button onClick={generate} disabled={loading}><Wand2 className="h-4 w-4" /> {loading ? "Generating..." : "Generate"}</Button>
        </div>
        {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      </Card>
      {question && (
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{question.difficulty} / {question.category}</p>
          <h2 className="mt-4 text-2xl font-bold">{question.prompt}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Info title="Solution" text={question.solution} />
            <Info title="Explanation" text={question.explanation} />
            <Info title="AI Feedback" text={question.feedback} />
          </div>
        </Card>
      )}
      {history.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold">Recent Generated Questions</h2>
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div key={item.id ?? item.prompt} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{item.difficulty} / {item.category}</p>
                <p className="mt-2 text-sm text-slate-300">{item.prompt}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div>;
}

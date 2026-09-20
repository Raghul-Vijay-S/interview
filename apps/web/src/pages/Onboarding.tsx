import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export function Onboarding() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    degree: "B.Tech Computer Science",
    college: "",
    targetRole: "Software Engineer",
    languages: "Java, TypeScript, SQL"
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { user } = await api.onboarding({ ...form, languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean) });
    auth.updateUser(user);
    navigate("/app");
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-20">
      <Card className="w-full max-w-2xl p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">First launch</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Personalize NEXVORA</h1>
        <p className="mt-3 text-slate-300">This becomes the context for resume analysis, interviews, roadmaps, and AI recommendations.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          {(["name", "degree", "college", "targetRole", "languages"] as const).map((field) => (
            <label key={field} className={field === "languages" ? "sm:col-span-2" : ""}>
              <span className="mb-2 block text-sm font-semibold capitalize text-slate-200">{field === "targetRole" ? "Target Role" : field}</span>
              <Input className="w-full" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} required />
            </label>
          ))}
          <Button className="sm:col-span-2">Enter Dashboard</Button>
        </form>
      </Card>
    </main>
  );
}

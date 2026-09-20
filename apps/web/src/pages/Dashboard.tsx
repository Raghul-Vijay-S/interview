import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Brain, BriefcaseBusiness, FileCheck2, Target } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { pct } from "../lib/utils";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.dashboard().then(setData); }, []);
  if (!data) return <div className="text-cyan-100">Loading your AI workspace...</div>;

  const metrics = [
    ["Resume Score", data.metrics.resumeScore, FileCheck2],
    ["Interview Readiness", data.metrics.interviewReadiness, Brain],
    ["Skill Score", data.metrics.skillScore, Target],
    ["Placement Probability", data.metrics.placementProbability, BriefcaseBusiness]
  ] as const;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Command Center</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Welcome back, {data.user.name ?? "future hire"}</h1>
        <p className="mt-2 text-slate-300">{data.resume ? "Your resume intelligence is active." : "No Resume Uploaded. Start with the upload card to activate analysis, ATS scoring, and AI chat memory."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <motion.div key={label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5">
              <Icon className="h-6 w-6 text-cyan-200" />
              <p className="mt-5 text-sm text-slate-400">{label}</p>
              <div className="mt-2 text-4xl font-bold">{value}%</div>
              <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: pct(value) }} /></div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5">
          <h2 className="text-xl font-bold">Skill Growth</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.analytics.skillGrowth}>
                <defs><linearGradient id="skill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22D3EE" stopOpacity={0.55} /><stop offset="100%" stopColor="#22D3EE" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Area type="monotone" dataKey="value" stroke="#22D3EE" fill="url(#skill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold">Weekly Performance</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.analytics.weeklyPerformance}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Bar dataKey="coding" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                <Bar dataKey="interview" fill="#00E5FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">AI Welcome Message</h2>
            <p className="mt-2 text-slate-300">{data.analysis ? data.analysis.suggestions?.[0] : "Upload your resume to unlock ATS scoring, missing skills, roadmap generation, and company-specific interview prep."}</p>
          </div>
          <Button onClick={() => window.location.assign("/app/resume")}>Open Resume Studio</Button>
        </div>
      </Card>
    </section>
  );
}

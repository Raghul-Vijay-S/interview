import { useEffect, useState } from "react";
import { Bell, Brain, Code2, FileText, Moon, Save, Video } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

type Preferences = {
  darkMode: boolean;
  emailAlerts: boolean;
  targetCompany: string;
  preferredDifficulty: string;
  interviewCount: string;
  resumeFocus: string;
};

const defaultPreferences: Preferences = {
  darkMode: true,
  emailAlerts: false,
  targetCompany: "Microsoft",
  preferredDifficulty: "Medium",
  interviewCount: "12",
  resumeFocus: "ATS score, missing skills, measurable project impact"
};

function loadPreferences(): Preferences {
  const saved = localStorage.getItem("nexvora_settings");
  if (!saved) return defaultPreferences;
  try {
    return { ...defaultPreferences, ...JSON.parse(saved) };
  } catch {
    return defaultPreferences;
  }
}

export function Settings() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", !preferences.darkMode);
    localStorage.setItem("nexvora_theme", preferences.darkMode ? "dark" : "light");
  }, [preferences.darkMode]);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem("nexvora_settings", JSON.stringify(preferences));
    setSaved(true);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-slate-300">Control the parts that affect your resume analysis, interviews, and coding practice.</p>
        </div>
        <Button onClick={save}><Save className="h-4 w-4" /> {saved ? "Saved" : "Save Settings"}</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <Moon className="h-6 w-6 text-cyan-200" />
            <div className="flex-1">
              <h2 className="font-bold">Appearance</h2>
              <p className="mt-2 text-sm text-slate-300">Turn dark mode on or off for the whole app.</p>
            </div>
            <Toggle checked={preferences.darkMode} onChange={(value) => update("darkMode", value)} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-4">
            <Bell className="h-6 w-6 text-cyan-200" />
            <div className="flex-1">
              <h2 className="font-bold">Practice Alerts</h2>
              <p className="mt-2 text-sm text-slate-300">Use this preference for interview reminders and roadmap nudges.</p>
            </div>
            <Toggle checked={preferences.emailAlerts} onChange={(value) => update("emailAlerts", value)} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-cyan-200" />
            <h2 className="font-bold">Mock Interview Defaults</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Target company
              <select value={preferences.targetCompany} onChange={(event) => update("targetCompany", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/12 bg-slate-950/55 px-4 text-sm text-white outline-none">
                {["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"].map((company) => <option key={company}>{company}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Questions per round
              <select value={preferences.interviewCount} onChange={(event) => update("interviewCount", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/12 bg-slate-950/55 px-4 text-sm text-white outline-none">
                {["10", "12", "15"].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-cyan-200" />
            <h2 className="font-bold">Coding Practice Defaults</h2>
          </div>
          <label className="mt-4 block text-sm text-slate-300">
            Preferred difficulty
            <select value={preferences.preferredDifficulty} onChange={(event) => update("preferredDifficulty", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/12 bg-slate-950/55 px-4 text-sm text-white outline-none">
              {["Easy", "Medium", "Hard"].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </select>
          </label>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-200" />
            <h2 className="font-bold">Resume Analyzer Focus</h2>
          </div>
          <Input className="mt-4 w-full" value={preferences.resumeFocus} onChange={(event) => update("resumeFocus", event.target.value)} />
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
            <Brain className="h-5 w-5" />
            These preferences are saved locally and ready to connect into deeper personalization.
          </div>
        </Card>
      </div>
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className="h-6 w-11 rounded-full bg-white/15 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-cyan-300 peer-checked:after:translate-x-5" />
    </label>
  );
}

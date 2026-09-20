import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export function Profile() {
  const auth = useAuth();
  const [form, setForm] = useState({
    name: auth.user?.name ?? "",
    degree: auth.user?.degree ?? "",
    college: auth.user?.college ?? "",
    targetRole: auth.user?.targetRole ?? "",
    languages: auth.user?.languages.join(", ") ?? ""
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const { user } = await api.profile({ ...form, languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean) });
    auth.updateUser(user);
  };

  return (
    <Card className="max-w-3xl p-6">
      <h1 className="font-display text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-slate-300">Personal information, resume context, skills, progress, and achievements feed your AI recommendations.</p>
      <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
        {Object.entries(form).map(([key, value]) => (
          <label key={key} className={key === "languages" ? "sm:col-span-2" : ""}>
            <span className="mb-2 block text-sm font-semibold capitalize text-slate-200">{key}</span>
            <Input className="w-full" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
          </label>
        ))}
        <Button className="sm:col-span-2">Save Profile</Button>
      </form>
    </Card>
  );
}

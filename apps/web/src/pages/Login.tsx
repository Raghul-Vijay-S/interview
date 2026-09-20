import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Chrome, Lock, Mail, Sparkles } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Particles } from "../components/Background";

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = mode === "signup" ? await api.register(email, password) : await api.login(email, password);
      auth.setSession(result.token, result.user);
      navigate(result.user.onboarded ? "/app" : "/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-24">
      <Particles />
      <Link to="/" className="absolute left-6 top-6 font-display text-lg font-bold">NEXVORA AI</Link>
      <Card className="w-full max-w-md p-7">
        <div className="mb-7">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-cyan-300/15 text-cyan-100 shadow-neon">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">{mode === "signup" ? "Create your AI workspace" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-slate-300">Secure JWT authentication with isolated user data and personalized AI memory.</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input className="glass-input w-full pl-10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <label className="block text-sm font-medium text-slate-200">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input className="glass-input w-full pl-10" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </div>
          {error && <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
          <Button className="w-full" disabled={loading}>{loading ? "Securing session..." : mode === "signup" ? "Sign Up" : "Login"}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => setError("Google OAuth endpoint is ready. Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable the button.")}>
            <Chrome className="h-4 w-4" /> Google Login
          </Button>
        </form>
        <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
          <button onClick={() => {
            const nextMode = mode === "signup" ? "login" : "signup";
            setMode(nextMode);
            setSearchParams(nextMode === "signup" ? { mode: "signup" } : {});
            setError("");
          }} className="text-cyan-200 hover:text-white">
            {mode === "signup" ? "Already have an account?" : "Need an account?"}
          </button>
          <button className="hover:text-white">Forgot Password</button>
        </div>
      </Card>
    </main>
  );
}

import { ArrowRight, Brain, Briefcase, Code2, FileScan, LineChart, LogIn, Map, Mic, Sparkles, Target, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Particles } from "../components/Background";
import { RobotAssistant } from "../components/RobotAssistant";
import { TiltCard } from "../components/TiltCard";
import { NeuralScene } from "../components/NeuralScene";

const features = [
  ["Resume Upload", Upload],
  ["Resume Analysis", FileScan],
  ["Skill Gap Detection", Target],
  ["Coding Question Generation", Code2],
  ["AI Mock Interviews", Mic],
  ["Performance Tracking", LineChart],
  ["AI Career Roadmap", Map],
  ["AI Resume Improvement Suggestions", Brain]
];

export function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <main className="relative overflow-hidden">
      <Particles />
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-white/10 bg-slate-950/35 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-lg font-bold tracking-wide">NEXVORA AI</Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost"><LogIn className="h-4 w-4" /> Login</Button></Link>
            <Link to="/login?mode=signup"><Button>Get Started <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </nav>
      </header>

      <section className="relative grid min-h-screen items-center px-5 pt-28">
        <NeuralScene />
        <motion.div style={{ y }} className="absolute inset-x-0 top-28 mx-auto h-96 max-w-5xl rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" /> AI resume intelligence for serious placement prep
            </div>
            <h1 className="font-display text-6xl font-extrabold leading-none text-gradient md:text-8xl">NEXVORA AI</h1>
            <p className="mt-7 max-w-2xl text-2xl font-semibold text-white md:text-3xl">Transform Your Resume Into Job Offers With AI</p>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Upload a resume, get an ATS score, detect skill gaps, prepare for Google, Amazon, TCS, Infosys, Zoho, and Microsoft, then train with a voice-enabled AI assistant.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/login?mode=signup"><Button className="px-7">Get Started <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button variant="outline" className="px-7">Login</Button></Link>
            </div>
          </motion.div>
          <RobotAssistant />
        </div>
      </section>

      <section className="relative px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Platform Modules</p>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-6xl">A living AI career command center</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, Icon]) => (
              <TiltCard key={title as string}>
                <Icon className="h-8 w-8 text-cyan-200" />
                <h3 className="mt-5 text-xl font-bold">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">Personalized, persistent, and connected to your profile, resume, and target role.</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

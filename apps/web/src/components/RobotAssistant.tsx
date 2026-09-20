import { useEffect, useState } from "react";

export function RobotAssistant() {
  const [eye, setEye] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 13;
      const y = (event.clientY / window.innerHeight - 0.5) * 9;
      setEye({ x: Math.max(-6, Math.min(6, x)), y: Math.max(-4, Math.min(4, y)) });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative mx-auto h-80 w-72 animate-float md:h-96 md:w-80" aria-label="NEXVORA AI robot assistant">
      <div className="absolute left-1/2 top-3 h-12 w-12 -translate-x-1/2 rounded-full border border-cyan-200/40 bg-cyan-300/20 shadow-neon">
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_24px_rgba(0,229,255,.95)]" />
      </div>
      <div className="absolute left-1/2 top-14 h-10 w-1 -translate-x-1/2 rounded-full bg-cyan-200/50" />

      <div className="absolute inset-x-5 top-20 h-44 overflow-hidden rounded-[2.25rem] border border-cyan-200/35 bg-[linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,47,73,.72),rgba(255,255,255,.08))] shadow-neon backdrop-blur-2xl">
        <div className="absolute inset-x-8 top-5 h-24 rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-inner">
          <div className="absolute inset-x-5 top-7 h-14 rounded-full border border-cyan-200/25 bg-cyan-300/10">
            <div className="absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-cyan-200/60 shadow-[0_0_18px_rgba(0,229,255,.85)]" />
            <div className="absolute left-6 top-1/2 grid h-9 w-12 -translate-y-1/2 place-items-center rounded-full bg-cyan-100/10 animate-blink">
              <span
                className="h-4 w-4 rounded-full bg-cyan-100 shadow-[0_0_26px_rgba(0,229,255,.95)] transition-transform duration-150"
                style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }}
              />
            </div>
            <div className="absolute right-6 top-1/2 grid h-9 w-12 -translate-y-1/2 place-items-center rounded-full bg-violet-300/10 animate-blink">
              <span
                className="h-4 w-4 rounded-full bg-violet-200 shadow-[0_0_26px_rgba(167,139,250,.95)] transition-transform duration-150"
                style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }}
              />
            </div>
          </div>
        </div>
        <div className="absolute -left-3 top-16 h-16 w-8 rounded-l-2xl border border-cyan-200/20 bg-cyan-300/10" />
        <div className="absolute -right-3 top-16 h-16 w-8 rounded-r-2xl border border-cyan-200/20 bg-violet-300/10" />
        <div className="absolute bottom-8 left-1/2 h-2 w-28 -translate-x-1/2 rounded-full bg-cyan-200/70 shadow-neon" />
        <div className="absolute inset-x-12 bottom-4 flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((item) => <span key={item} className="h-1.5 w-5 rounded-full bg-white/25 shadow-[0_0_12px_rgba(255,255,255,.45)]" />)}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 h-32 w-60 -translate-x-1/2 rounded-[2rem] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,.10),rgba(15,23,42,.62))] shadow-violet backdrop-blur-xl">
        <div className="absolute left-1/2 top-5 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border border-cyan-200/30 bg-cyan-300/10 shadow-neon">
          <div className="h-8 w-8 rounded-full border border-cyan-100/70 bg-cyan-200/20" />
        </div>
        <div className="absolute bottom-5 left-8 right-8 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => <span key={item} className="h-2 rounded-full bg-cyan-200/35" />)}
        </div>
      </div>
      <div className="absolute bottom-12 left-0 h-24 w-12 rotate-12 rounded-full border border-cyan-200/15 bg-cyan-300/10 blur-[1px]" />
      <div className="absolute bottom-12 right-0 h-24 w-12 -rotate-12 rounded-full border border-violet-200/15 bg-violet-300/10 blur-[1px]" />
      <div className="absolute bottom-0 left-7 h-24 w-8 rounded-full bg-cyan-300/25 blur-sm" />
      <div className="absolute bottom-0 right-7 h-24 w-8 rounded-full bg-violet-400/25 blur-sm" />
    </div>
  );
}

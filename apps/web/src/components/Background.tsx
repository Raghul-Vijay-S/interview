export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.34),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(0,229,255,0.24),transparent_30%),radial-gradient(circle_at_50%_82%,rgba(34,211,238,0.18),transparent_35%)]" />
      <div className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl animate-aurora" />
      <div className="absolute inset-0 opacity-[0.17] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px] animate-grid" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(3,7,18,.92))]" />
    </div>
  );
}

export function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 34 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-cyan-200/70 shadow-[0_0_16px_rgba(34,211,238,.95)] animate-float"
          style={{
            left: `${(index * 29) % 100}%`,
            top: `${(index * 47) % 100}%`,
            animationDelay: `${(index % 9) * 0.35}s`,
            animationDuration: `${4 + (index % 7)}s`
          }}
        />
      ))}
    </div>
  );
}

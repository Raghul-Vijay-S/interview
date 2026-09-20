import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const [style, setStyle] = useState({ rotateX: 0, rotateY: 0 });
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setStyle({ rotateX: -y * 10, rotateY: x * 12 });
      }}
      onMouseLeave={() => setStyle({ rotateX: 0, rotateY: 0 })}
      animate={style}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn("group relative overflow-hidden rounded-lg border border-white/12 bg-white/[0.08] p-6 shadow-violet backdrop-blur-2xl transform-gpu", className)}
    >
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_var(--x,50%)_0%,rgba(34,211,238,.22),transparent_38%)]" />
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl transition group-hover:bg-cyan-200/35" />
      <div className="relative">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent opacity-70" />
    </motion.div>
  );
}

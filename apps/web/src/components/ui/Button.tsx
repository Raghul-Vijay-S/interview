import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-cyan-300 text-slate-950 shadow-neon hover:bg-white",
        variant === "ghost" && "bg-white/8 text-white hover:bg-white/14",
        variant === "outline" && "border border-white/15 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-cyan-300/10",
        variant === "danger" && "bg-rose-500 text-white hover:bg-rose-400",
        className
      )}
      {...props}
    />
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/12 bg-white/[0.08] shadow-violet backdrop-blur-2xl",
        className
      )}
      {...props}
    />
  );
}

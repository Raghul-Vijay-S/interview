import { Bot, Sparkles } from "lucide-react";

export function AIOrb({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 grid h-16 w-16 place-items-center rounded-full border border-cyan-200/40 bg-cyan-300/20 text-cyan-100 shadow-neon backdrop-blur-2xl animate-pulseGlow"
      aria-label="Open AI assistant"
    >
      <Bot className="h-7 w-7" />
      <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-white" />
    </button>
  );
}

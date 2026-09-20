import { useMemo, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { Button } from "./ui/Button";

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceAssistant({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const Recognition = useMemo(() => {
    const win = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    return win.SpeechRecognition ?? win.webkitSpeechRecognition;
  }, []);

  const start = () => {
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      if (text) onTranscript(text);
      setListening(false);
    };
    setListening(true);
    recognition.start();
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance("NEXVORA AI is ready. Upload your resume, generate a roadmap, or start a company interview drill.");
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={start} disabled={!Recognition}>
        <Mic className="h-4 w-4" /> {listening ? "Listening" : "Voice Input"}
      </Button>
      <Button type="button" variant="ghost" onClick={speak}>
        <Volume2 className="h-4 w-4" /> Voice Brief
      </Button>
    </div>
  );
}

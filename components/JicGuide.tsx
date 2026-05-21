"use client";

import { useEffect } from "react";
import { Volume2 } from "lucide-react";
import { speakText, warmVoices } from "@/lib/client-audio";

let lastAutoSpeechAt = 0;

type Props = {
  title?: string;
  message: string;
  tone?: "purple" | "cyan" | "orange";
  compact?: boolean;
};

export function JicGuide({ title = "Soc en Jic", message, tone = "purple", compact = false }: Props) {
  useEffect(() => {
    warmVoices();
    const now = Date.now();
    if (now - lastAutoSpeechAt < 3500) {
      return;
    }

    lastAutoSpeechAt = now;
    const timeoutId = window.setTimeout(() => {
      speakText(`${title}. ${message}`, "jic");
    }, compact ? 450 : 700);

    return () => window.clearTimeout(timeoutId);
  }, [compact, message, title]);

  function speak() {
    speakText(`${title}. ${message}`, "jic");
  }

  return (
    <aside className={`jic-guide ${tone} ${compact ? "compact" : ""}`} aria-label="Ajuda d'en Jic">
      <div className="jic-avatar" aria-hidden="true">
        <div className="jic-eye left" />
        <div className="jic-eye right" />
        <div className="jic-smile" />
      </div>
      <div className="jic-bubble">
        <span className="eyebrow">{title}</span>
        <p>{message}</p>
      </div>
      <button className="button ghost compact-button" type="button" onClick={speak}>
        <Volume2 size={18} /> Escoltar Jic
      </button>
    </aside>
  );
}

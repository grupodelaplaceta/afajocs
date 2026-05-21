"use client";

import { Volume2 } from "lucide-react";

type Props = {
  title?: string;
  message: string;
  tone?: "purple" | "cyan" | "orange";
  compact?: boolean;
};

export function JicGuide({ title = "Soc en Jic", message, tone = "purple", compact = false }: Props) {
  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${title}. ${message}`);
    utterance.lang = "ca-ES";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
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

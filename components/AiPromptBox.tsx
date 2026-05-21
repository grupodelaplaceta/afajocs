"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";

export function AiPromptBox({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="prompt-box">
      <div className="row" style={{ border: 0, padding: 0, marginBottom: 10 }}>
        <div>
          <h2>Prompt per a IA</h2>
          <p className="muted">Copia'l, demana el joc i enganxa la resposta a sota.</p>
        </div>
        <button className="button black" type="button" onClick={copyPrompt}>
          {copied ? <Check size={18} /> : <Clipboard size={18} />}
          {copied ? "Copiado" : "Copiar prompt"}
        </button>
      </div>
      <textarea readOnly value={prompt} aria-label="Prompt per generar jocs amb IA" />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Volume2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { speakText } from "@/lib/client-audio";

export function FloatingJic() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const help = useMemo(() => getHelpForPath(pathname), [pathname]);

  return (
    <div className={`floating-jic ${open ? "open" : ""}`}>
      {open && (
        <section className="floating-jic-panel" aria-live="polite">
          <div className="floating-jic-head">
            <strong>Jic</strong>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Tancar ajuda">
              <X size={18} />
            </button>
          </div>
          <p>{help}</p>
          <button className="button ghost compact-button" type="button" onClick={() => speakText(help, "jic")}>
            <Volume2 size={18} /> Escoltar
          </button>
        </section>
      )}
      <button
        className="floating-jic-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Tancar ajuda de Jic" : "Obrir ajuda de Jic"}
      >
        <span className="floating-jic-face" aria-hidden="true">
          <span />
        </span>
        <HelpCircle size={22} />
      </button>
    </div>
  );
}

function getHelpForPath(pathname: string) {
  if (pathname.startsWith("/teacher")) {
    return "Des del quadern pots veure punts, grups, Jics fets i reptes pendents. Si vols publicar contingut nou, ves a Crear Jic o Importar IA.";
  }
  if (pathname.startsWith("/student")) {
    return "Primer mira Els meus deures. També pots entrar a Jics per practicar i a Punts per revisar els teus rècords.";
  }
  if (pathname.startsWith("/play")) {
    return "Prem Començar quan estiguis a punt. Pots escoltar enunciats, activar pantalla completa i pausar la música si et molesta.";
  }
  if (pathname.startsWith("/games")) {
    return "Els Jics estan ordenats per assignatura. Obre Detall per veure rècords o prem Jugar per començar directament.";
  }
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return "Entra amb el teu correu. Els alumnes han d'utilitzar el mateix correu que ha registrat el professor.";
  }
  return "Tria si vols entrar com a professor o alumne. La biblioteca mostra els Jics disponibles.";
}

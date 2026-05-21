import Link from "next/link";
import { ArrowRight, Gamepad2, GraduationCap, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <BrandLogo />
          <nav style={{ display: "flex", gap: 10 }}>
            {session ? (
              <Link className="button" href={session.role === "teacher" ? "/teacher" : "/student"}>
                Entrar al panel <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link className="button ghost" href="/login">
                  Inicia sessió
                </Link>
                <Link className="button secondary" href="/games">
                  Jocs
                </Link>
                <Link className="button" href="/register">
                  Crear compte
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">JClic per dins, energia Kahoot per fora</p>
          <h1>Activitats educatives amb rècord personal per a primària.</h1>
          <p className="muted" style={{ maxWidth: 680 }}>
            El professorat crea grups, l'alumnat juga a l'aula o des de casa, i cada partida
            desa encerts, temps, puntuació i rècords amb la paleta AFA.
          </p>
          <Link className="button secondary" href={session ? "/teacher" : "/register"}>
            Començar <ArrowRight size={18} />
          </Link>
        </section>

        <section className="grid grid-3" style={{ marginTop: 18 }}>
          <article className="card stat">
            <GraduationCap color="#c000d8" />
            <h3>Panell docent</h3>
            <p className="muted">Grups, alumnes, jocs i seguiment de resultats.</p>
          </article>
          <article className="card stat cyan">
            <Gamepad2 color="#18a0e8" />
            <h3>Mode aula</h3>
            <p className="muted">Selecció ràpida d'alumne abans de jugar, sense login infantil.</p>
          </article>
          <article className="card stat orange">
            <Trophy color="#f05800" />
            <h3>Rècords</h3>
            <p className="muted">Motivació individual basada en la millora personal.</p>
          </article>
        </section>
      </div>
    </main>
  );
}

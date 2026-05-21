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
                  Iniciar sesion
                </Link>
                <Link className="button secondary" href="/games">
                  Juegos
                </Link>
                <Link className="button" href="/register">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">JClic por dentro, energia Kahoot por fuera</p>
          <h1>Actividades educativas con record personal para primaria.</h1>
          <p className="muted" style={{ maxWidth: 680 }}>
            Profesores crean clases, alumnos juegan en aula o desde casa, y cada partida
            guarda aciertos, tiempo, puntuacion y records con la paleta AFA.
          </p>
          <Link className="button secondary" href={session ? "/teacher" : "/register"}>
            Empezar <ArrowRight size={18} />
          </Link>
        </section>

        <section className="grid grid-3" style={{ marginTop: 18 }}>
          <article className="card stat">
            <GraduationCap color="#c000d8" />
            <h3>Panel docente</h3>
            <p className="muted">Clases, alumnos, juegos y seguimiento de resultados.</p>
          </article>
          <article className="card stat cyan">
            <Gamepad2 color="#18a0e8" />
            <h3>Modo aula</h3>
            <p className="muted">Seleccion rapida de alumno antes de jugar, sin login infantil.</p>
          </article>
          <article className="card stat orange">
            <Trophy color="#f05800" />
            <h3>Records</h3>
            <p className="muted">Motivacion individual basada en mejora personal.</p>
          </article>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft, BookOpen, Gamepad2, LogOut } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { Game } from "@/lib/models";
import { BrandLogo } from "@/components/BrandLogo";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function typeLabel(type: string) {
  if (type === "matching") return "Relacionar";
  if (type === "fill_blanks") return "Llenar huecos";
  return "Escribir";
}

export default async function GamesPage() {
  const session = await getSession();
  await connectDb();

  const student =
    session?.role === "student"
      ? await getStudentByUserIdOrEmail(session.id, session.email)
      : null;

  const query =
    student
      ? {
          isPublished: true,
          gradeMin: { $lte: student.gradeLevel },
          gradeMax: { $gte: student.gradeLevel }
        }
      : { isPublished: true };

  const games = asPlain(await Game.find(query).sort({ createdAt: -1 }).lean());

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <BrandLogo label="Biblioteca de juegos" />
            <p className="muted">
              Todos los juegos publicados, listos para aula, tablet o casa.
            </p>
          </div>
          <div className="toolbar">
            <Link
              className="button ghost"
              href={session?.role === "teacher" ? "/teacher" : session?.role === "student" ? "/student" : "/"}
            >
              <ArrowLeft size={18} /> Volver
            </Link>
            {session ? (
              <form action={logoutAction}>
                <button className="button black" type="submit">
                  <LogOut size={18} /> Salir
                </button>
              </form>
            ) : (
              <Link className="button" href="/login">
                Entrar
              </Link>
            )}
          </div>
        </header>

        <section className="hero library-hero">
          <p className="eyebrow">Juegos publicados</p>
          <h1>Elige una actividad y empieza a jugar.</h1>
          <p className="muted">
            Tarjetas grandes, filtros visuales por curso y acceso directo a cada juego.
          </p>
        </section>

        <section className="game-card-grid" style={{ marginTop: 18 }}>
          {games.map((game: any) => (
            <article className="game-card" key={game._id}>
              <div className="game-card-icon">
                <Gamepad2 size={30} />
              </div>
              <span className="badge cyan">{game.subject}</span>
              <h2>{game.title}</h2>
              <p className="muted">
                {typeLabel(game.type)} · {game.gradeMin}º a {game.gradeMax}º · {game.difficulty}
              </p>
              <div className="toolbar" style={{ justifyContent: "stretch" }}>
                <Link className="button ghost" href={`/games/${game._id}`}>
                  Detalle
                </Link>
                <Link className="button secondary" href={`/play/${game._id}`}>
                  <BookOpen size={18} /> Jugar
                </Link>
              </div>
            </article>
          ))}
          {games.length === 0 && (
            <div className="panel">
              <h2>No hay juegos publicados todavia</h2>
              <p className="muted">Cuando un profesor publique juegos, apareceran aqui.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

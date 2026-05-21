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
  if (type === "fill_blanks") return "Omplir buits";
  if (type === "word_search") return "Sopa de lletres";
  return "Escriure";
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
            <BrandLogo label="Biblioteca de jocs" />
            <p className="muted">
              Tots els jocs publicats, preparats per a l'aula, la tauleta o casa.
            </p>
          </div>
          <div className="toolbar">
            <Link
              className="button ghost"
              href={session?.role === "teacher" ? "/teacher" : session?.role === "student" ? "/student" : "/"}
            >
              <ArrowLeft size={18} /> Tornar
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
          <p className="eyebrow">Jocs publicats</p>
          <h1>Tria una activitat i comença a jugar.</h1>
          <p className="muted">
            Targetes grans, filtres visuals per curs i accés directe a cada joc.
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
                  Detall
                </Link>
                <Link className="button secondary" href={`/play/${game._id}`}>
                  <BookOpen size={18} /> Jugar
                </Link>
              </div>
            </article>
          ))}
          {games.length === 0 && (
            <div className="panel">
              <h2>Encara no hi ha jocs publicats</h2>
              <p className="muted">Quan un professor publiqui jocs, apareixeran aquí.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

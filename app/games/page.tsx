import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Game } from "@/lib/models";
import { TopNav } from "@/components/TopNav";
import { JicCard } from "@/components/JicCard";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
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
          isDeleted: { $ne: true },
          gradeMin: { $lte: student.gradeLevel },
          gradeMax: { $gte: student.gradeLevel }
        }
      : { isPublished: true, isDeleted: { $ne: true } };

  const games = asPlain(await Game.find(query).sort({ createdAt: -1 }).lean());
  const gamesBySubject = games.reduce((groups: Record<string, any[]>, game: any) => {
    const key = game.subject || "General";
    groups[key] = groups[key] || [];
    groups[key].push(game);
    return groups;
  }, {});
  const subjectNames = Object.keys(gamesBySubject).sort((a, b) => a.localeCompare(b));

  return (
    <main className="page">
      <div className="shell">
        <TopNav
          session={session}
          title="Biblioteca de Jics"
          subtitle="Tots els Jics publicats, preparats per a l'aula, la tauleta o casa."
        />

        <section className="hero library-hero">
          <p className="eyebrow">Jics publicats</p>
          <h1>Tria una activitat i comença a jugar.</h1>
          <p className="muted">
            Targetes grans, filtres visuals per curs i accés directe a cada Jic.
          </p>
        </section>

        <section className="published-jics">
          <div className="jic-library-summary">
            <span className="badge orange">{games.length} Jics</span>
            <span className="badge cyan">{subjectNames.length} assignatures</span>
            {student && <span className="badge">Filtrat per {student.gradeLevel}º</span>}
          </div>

          {subjectNames.map((subject) => (
            <section className="jic-subject-section" key={subject}>
              <div className="jic-section-heading">
                <div>
                  <p className="eyebrow">Assignatura</p>
                  <h2>{subject}</h2>
                </div>
                <span className="badge cyan">{gamesBySubject[subject].length} Jics</span>
              </div>
              <div className="game-card-grid">
                {gamesBySubject[subject].map((game: any) => (
                  <JicCard game={game} key={game._id}>
                    <Link className="button ghost" href={`/games/${game._id}`}>
                      Detall
                    </Link>
                    <Link className="button secondary" href={`/play/${game._id}`}>
                      <BookOpen size={18} /> Jugar
                    </Link>
                  </JicCard>
                ))}
              </div>
            </section>
          ))}

          {games.length === 0 && (
            <div className="panel">
              <h2>Encara no hi ha Jics publicats</h2>
              <p className="muted">Quan un professor publiqui Jics, apareixeran aquí.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

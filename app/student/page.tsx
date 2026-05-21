import Link from "next/link";
import { BookOpen, Library, Trophy } from "lucide-react";
import { getStudentByUserIdOrEmail, requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { Challenge, Game, GameAttempt, StudentGameRecord } from "@/lib/models";
import { TopNav } from "@/components/TopNav";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export default async function StudentPage() {
  const session = await requireUser("student");
  await connectDb();
  const student = await getStudentByUserIdOrEmail(session.id, session.email);

  if (!student) {
    return (
      <main className="page">
        <div className="shell">
          <div className="panel">
            <h1>Perfil pendiente</h1>
            <p className="muted">
              El teu compte existeix, però cap professor ha registrat encara aquest correu com a alumne.
            </p>
            <form action={logoutAction}>
              <button className="button" type="submit">Salir</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const [games, attempts, records, challenges] = await Promise.all([
    Game.find({
      gradeMin: { $lte: student.gradeLevel },
      gradeMax: { $gte: student.gradeLevel },
      isPublished: true,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean(),
    GameAttempt.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(10).lean(),
    StudentGameRecord.find({ studentId: student._id }).populate("gameId", "title").lean(),
    Challenge.find({ studentIds: student._id, isActive: true })
      .populate("gameIds", "title subject type isDeleted isPublished")
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const data = asPlain({ games, attempts, records, challenges });
  const totalScore = data.attempts.reduce((sum: number, attempt: { score?: number }) => sum + (attempt.score || 0), 0);
  const bestScore = data.attempts.reduce((best: number, attempt: { score?: number }) => Math.max(best, attempt.score || 0), 0);
  const doneGameIds = new Set(data.attempts.map((attempt: { gameId: string }) => String(attempt.gameId)));

  return (
    <main className="page">
      <div className="shell">
        <TopNav
          session={session}
          title="Panell alumne"
          subtitle={`Hola, ${student.name}. Els teus Jics i rècords viuen aquí.`}
        />

        <section className="grid grid-3">
          <article className="card stat">
            <h2>{data.games.length}</h2>
            <p className="muted">Jics disponibles</p>
          </article>
          <article className="card stat cyan">
            <h2>{data.attempts.length}</h2>
            <p className="muted">Partides jugades</p>
          </article>
          <article className="card stat orange">
            <h2>{totalScore}</h2>
            <p className="muted">Punts totals</p>
          </article>
          <article className="card stat">
            <h2>{bestScore}</h2>
            <p className="muted">Millor puntuació</p>
          </article>
        </section>

        <div className="student-tabs" style={{ marginTop: 18 }}>
          <input id="student-tab-deures" name="student-tab" type="radio" defaultChecked />
          <input id="student-tab-jocs" name="student-tab" type="radio" />
          <input id="student-tab-punts" name="student-tab" type="radio" />
          <nav className="tabs" aria-label="Seccions alumne">
            <label className="tab" htmlFor="student-tab-deures"><BookOpen size={18} /> Els meus deures</label>
            <label className="tab" htmlFor="student-tab-jocs"><Library size={18} /> Jics</label>
            <label className="tab" htmlFor="student-tab-punts"><Trophy size={18} /> Punts</label>
          </nav>

          <section className="tab-panel student-tab-content student-deures panel">
            <h2>Els meus deures</h2>
            <p className="muted">Reptes encomanats pel professorat.</p>
            <div className="game-card-grid" style={{ marginTop: 18 }}>
              {data.challenges.map((challenge: any) => (
                <article className="game-card" key={challenge._id}>
                  <span className="badge orange">Repte</span>
                  <h3>{challenge.title}</h3>
                  <p className="muted">{challenge.description || "Completa els Jics assignats."}</p>
                  <div className="list">
                    {(challenge.gameIds || [])
                      .filter((game: any) => game && !game.isDeleted && game.isPublished)
                      .map((game: any) => (
                        <div className="row" key={game._id}>
                          <div>
                            <strong>{game.title}</strong>
                            <div className="muted">{game.subject} · {doneGameIds.has(String(game._id)) ? "fet" : "pendent"}</div>
                          </div>
                          <Link className="button" href={`/play/${game._id}`}>Jugar</Link>
                        </div>
                      ))}
                  </div>
                </article>
              ))}
              {data.challenges.length === 0 && <p className="muted">Encara no tens deures assignats.</p>}
            </div>
          </section>

          <section className="tab-panel student-tab-content student-jocs grid grid-2">
          <div className="panel">
            <h2>Jics</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {data.games.map((game: { _id: string; title: string; subject: string; type: string }) => (
                <div className="row" key={game._id}>
                  <div>
                    <strong>{game.title}</strong>
                    <div className="muted">{game.subject} · {game.type}</div>
                  </div>
                  <Link className="button" href={`/play/${game._id}`}>
                    Jugar
                  </Link>
                </div>
              ))}
            </div>
          </div>
          </section>

          <section className="tab-panel student-tab-content student-punts grid grid-2">
          <div className="panel">
            <h2>Rècords</h2>
            <div className="record-list" style={{ marginTop: 14 }}>
              {data.records.map((record: { _id: string; bestScore: number; bestTimeSeconds: number; gameId?: { title?: string } }, index: number) => (
                <article className="record-row" key={record._id}>
                  <div className="record-rank">{index + 1}</div>
                  <div className="record-main">
                    <strong>{record.gameId?.title || "Jic eliminat"}</strong>
                    <p className="muted">Millor temps: {record.bestTimeSeconds}s</p>
                  </div>
                  <span className="score-pill"><Trophy size={14} /> {record.bestScore} pts</span>
                </article>
              ))}
              {data.records.length === 0 && <p className="muted">Juga una partida per estrenar rècords.</p>}
            </div>
          </div>

          <div className="panel">
            <h2>Últimes puntuacions</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {data.attempts.map((attempt: { _id: string; score: number; timeSpentSeconds: number; gameTitleSnapshot?: string }) => (
                <div className="row" key={attempt._id}>
                  <div>
                    <strong>{attempt.gameTitleSnapshot || "Jic eliminat"}</strong>
                    <div className="muted">{attempt.timeSpentSeconds}s</div>
                  </div>
                  <span className="badge orange">{attempt.score} punts</span>
                </div>
              ))}
              {data.attempts.length === 0 && <p className="muted">Encara no hi ha puntuacions.</p>}
            </div>
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Library, LogOut, Trophy } from "lucide-react";
import { getStudentByUserIdOrEmail, requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { Game, GameAttempt, StudentGameRecord } from "@/lib/models";
import { BrandLogo } from "@/components/BrandLogo";

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

  const [games, attempts, records] = await Promise.all([
    Game.find({
      gradeMin: { $lte: student.gradeLevel },
      gradeMax: { $gte: student.gradeLevel },
      isPublished: true
    })
      .sort({ createdAt: -1 })
      .lean(),
    GameAttempt.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(10).lean(),
    StudentGameRecord.find({ studentId: student._id }).populate("gameId", "title").lean()
  ]);

  const data = asPlain({ games, attempts, records });
  const totalScore = data.attempts.reduce((sum: number, attempt: { score?: number }) => sum + (attempt.score || 0), 0);
  const bestScore = data.attempts.reduce((best: number, attempt: { score?: number }) => Math.max(best, attempt.score || 0), 0);

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <BrandLogo label="Panell alumne" />
            <p className="muted">Hola, {student.name}. Els teus jocs i rècords viuen aquí.</p>
          </div>
          <form action={logoutAction}>
            <div className="toolbar">
              <Link className="button black" href="/games">
                <Library size={18} /> Biblioteca
              </Link>
              <button className="button ghost" type="submit">
                <LogOut size={18} /> Salir
              </button>
            </div>
          </form>
        </header>

        <section className="grid grid-3">
          <article className="card stat">
            <h2>{data.games.length}</h2>
            <p className="muted">Jocs disponibles</p>
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

        <section className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="panel">
            <h2>Jocs</h2>
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

          <div className="panel">
            <h2>Rècords</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {data.records.map((record: { _id: string; bestScore: number; bestTimeSeconds: number; gameId?: { title?: string } }) => (
                <div className="row" key={record._id}>
                  <div>
                    <strong>{record.gameId?.title || "Joc"}</strong>
                    <div className="muted">{record.bestTimeSeconds}s</div>
                  </div>
                  <span className="badge cyan">
                    <Trophy size={14} /> {record.bestScore}
                  </span>
                </div>
              ))}
              {data.records.length === 0 && <p className="muted">Juga una partida per estrenar rècords.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

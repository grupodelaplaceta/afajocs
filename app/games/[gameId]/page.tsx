import Link from "next/link";
import { BookOpen, Clock, Medal, Play, Trophy } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail, getTeacherByUserId } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Game } from "@/lib/models";
import { getGameRecordViews } from "@/lib/record-views";
import { TopNav } from "@/components/TopNav";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function typeLabel(type: string) {
  if (type === "matching") return "Relacionar";
  if (type === "fill_blanks") return "Omplir buits";
  if (type === "word_search") return "Sopa de lletres";
  return "Escriure";
}

function itemCount(game: any) {
  if (game.type === "matching") return game.content?.pairs?.length || 0;
  if (game.type === "fill_blanks") return game.content?.blanks?.length || 0;
  if (game.type === "word_search") return game.content?.words?.length || 0;
  return game.content?.prompts?.length || 0;
}

export default async function GameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  await connectDb();

  const game = await Game.findById(gameId).lean();
  if (!game || game.isDeleted) {
    return <main className="page">Joc no trobat.</main>;
  }

  let teacherId: unknown = undefined;
  let studentId: string | undefined;

  if (session?.role === "teacher") {
    const teacher = await getTeacherByUserId(session.id);
    teacherId = teacher?._id;
  }

  if (session?.role === "student") {
    const student = await getStudentByUserIdOrEmail(session.id, session.email);
    studentId = student?._id.toString();
  }

  const data = asPlain({
    game,
    recordViews: await getGameRecordViews(gameId, teacherId, studentId)
  });

  return (
    <main className="page">
      <div className="shell">
        <TopNav session={session} title="Detall de l'activitat" subtitle="Consulta rècords abans de jugar." />

        <section className="hero animate-in">
          <p className="eyebrow">{data.game.subject}</p>
          <h1>{data.game.title}</h1>
          <p className="muted">{data.game.content?.instructions || "Actividad publicada."}</p>
          <div className="toolbar" style={{ justifyContent: "flex-start", marginTop: 18 }}>
            <span className="badge cyan">
              <BookOpen size={14} /> {typeLabel(data.game.type)}
            </span>
            <span className="badge orange">
              <Clock size={14} /> {data.game.estimatedTimeSeconds}s
            </span>
            <span className="badge">
              {data.game.gradeMin}º a {data.game.gradeMax}º · {itemCount(data.game)} items
            </span>
          </div>
        </section>

        <section className="record-grid" style={{ marginTop: 18 }}>
          <article className="record-card featured">
            <Trophy size={34} />
            <div>
              <span className="eyebrow">Rècord global</span>
              <h2>
                {data.recordViews.globalRecord
                  ? `${data.recordViews.globalRecord.bestScore} pts`
                  : "Sense rècord"}
              </h2>
              <p className="muted">
                {data.recordViews.globalRecord
                  ? `${data.recordViews.globalRecord.studentName} · ${data.recordViews.globalRecord.bestTimeSeconds}s`
                  : "Encara ningú ha jugat aquesta activitat."}
              </p>
            </div>
          </article>

          <article className="record-card">
            <Medal size={32} />
            <div>
              <span className="eyebrow">El teu rècord</span>
              <h2>
                {data.recordViews.personalRecord
                  ? `${data.recordViews.personalRecord.bestScore} pts`
                  : "Sense rècord"}
              </h2>
              <p className="muted">
                {data.recordViews.personalRecord
                  ? `${data.recordViews.personalRecord.bestTimeSeconds}s`
                  : "Juga per crear la teva marca."}
              </p>
            </div>
          </article>
        </section>

        <section className="panel" style={{ marginTop: 18 }}>
          <div className="row" style={{ border: 0, padding: 0 }}>
            <div>
              <h2>Rècords per grup</h2>
              <p className="muted">Classificació clara per veure qui ha marcat el millor resultat.</p>
            </div>
            <Link className="button secondary" href={`/play/${gameId}`}>
              <Play size={18} /> Jugar
            </Link>
          </div>
          <div className="record-list" style={{ marginTop: 18 }}>
            {data.recordViews.classRecords.map((record: any) => (
              <article className="record-row" key={record.classId}>
                <div className="record-rank">
                  <Trophy size={20} />
                </div>
                <div className="record-main">
                  <strong>{record.className}</strong>
                  <p className="muted">
                    {record.studentName
                      ? `Millor alumne: ${record.studentName}`
                      : `Cursos ${record.gradeLevels.map((grade: number) => `${grade}º`).join(" + ") || "mixtos"}`}
                  </p>
                </div>
                <span className="score-pill">{record.bestScore ? `${record.bestScore} pts` : "Sense rècord"}</span>
                <span className="time-pill">{record.bestTimeSeconds ? `${record.bestTimeSeconds}s` : "-"}</span>
              </article>
            ))}
            {data.recordViews.classRecords.length === 0 && (
              <p className="muted">No hi ha grups vinculats per mostrar rècords.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

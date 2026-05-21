import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Medal, Play, Trophy } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail, getTeacherByUserId } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Game } from "@/lib/models";
import { getGameRecordViews } from "@/lib/record-views";
import { BrandLogo } from "@/components/BrandLogo";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function typeLabel(type: string) {
  if (type === "matching") return "Relacionar";
  if (type === "fill_blanks") return "Llenar huecos";
  return "Escribir";
}

function itemCount(game: any) {
  if (game.type === "matching") return game.content?.pairs?.length || 0;
  if (game.type === "fill_blanks") return game.content?.blanks?.length || 0;
  return game.content?.prompts?.length || 0;
}

export default async function GameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  await connectDb();

  const game = await Game.findById(gameId).lean();
  if (!game) {
    return <main className="page">Juego no encontrado.</main>;
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
        <header className="topbar">
          <div>
            <BrandLogo label="Detalle de actividad" />
            <p className="muted">Consulta records antes de jugar.</p>
          </div>
          <div className="toolbar">
            <Link className="button ghost" href="/games">
              <ArrowLeft size={18} /> Biblioteca
            </Link>
            <Link className="button secondary" href={`/play/${gameId}`}>
              <Play size={18} /> Jugar
            </Link>
          </div>
        </header>

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
              <span className="eyebrow">Record global</span>
              <h2>
                {data.recordViews.globalRecord
                  ? `${data.recordViews.globalRecord.bestScore} pts`
                  : "Sin record"}
              </h2>
              <p className="muted">
                {data.recordViews.globalRecord
                  ? `${data.recordViews.globalRecord.studentName} · ${data.recordViews.globalRecord.bestTimeSeconds}s`
                  : "Aun nadie ha jugado esta actividad."}
              </p>
            </div>
          </article>

          <article className="record-card">
            <Medal size={32} />
            <div>
              <span className="eyebrow">Tu record</span>
              <h2>
                {data.recordViews.personalRecord
                  ? `${data.recordViews.personalRecord.bestScore} pts`
                  : "Sin record"}
              </h2>
              <p className="muted">
                {data.recordViews.personalRecord
                  ? `${data.recordViews.personalRecord.bestTimeSeconds}s`
                  : "Juega para crear tu marca."}
              </p>
            </div>
          </article>
        </section>

        <section className="panel" style={{ marginTop: 18 }}>
          <h2>Records por clase</h2>
          <div className="game-card-grid" style={{ marginTop: 18 }}>
            {data.recordViews.classRecords.map((record: any) => (
              <article className="record-card" key={record.classId}>
                <Trophy size={30} />
                <div>
                  <span className="eyebrow">{record.className}</span>
                  <h2>{record.bestScore ? `${record.bestScore} pts` : "Sin record"}</h2>
                  <p className="muted">
                    {record.studentName
                      ? `${record.studentName} · ${record.bestTimeSeconds}s`
                      : `Cursos ${record.gradeLevels.map((grade: number) => `${grade}º`).join(" + ") || "mixtos"}`}
                  </p>
                </div>
              </article>
            ))}
            {data.recordViews.classRecords.length === 0 && (
              <p className="muted">No hay clases vinculadas para mostrar records.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

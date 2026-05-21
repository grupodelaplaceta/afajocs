import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail, getTeacherByUserId } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Game, Student } from "@/lib/models";
import { GamePlayer } from "@/components/GamePlayer";
import { getGameRecordViews } from "@/lib/record-views";
import { ensureWordSearchGrid } from "@/lib/word-search";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  await connectDb();

  const game = await Game.findById(gameId).lean();
  if (!game || game.isDeleted) {
    return <main className="page">Joc no trobat.</main>;
  }

  let students: any[] = [];
  let defaultStudentId = "";
  let mode: "classroom" | "remote" = "classroom";
  let teacherId: unknown = undefined;

  if (session?.role === "teacher") {
    const teacher = await getTeacherByUserId(session.id);
    teacherId = teacher?._id;
    students = teacher ? await Student.find({ teacherOwnerId: teacher._id }).sort({ name: 1 }).lean() : [];
  }

  if (session?.role === "student") {
    const student = await getStudentByUserIdOrEmail(session.id, session.email);
    if (student) {
      students = [student.toObject()];
      defaultStudentId = student._id.toString();
      mode = "remote";
    }
  }

  let playableGame: any = game;

  if (game.type === "word_search") {
    const content = (game as any).content || {};
    const words = Array.isArray(content.words) ? content.words : [];
    const currentGrid = Array.isArray(content.grid) ? content.grid : [];
    const repairedGrid = ensureWordSearchGrid(words, currentGrid);

    if (JSON.stringify(repairedGrid) !== JSON.stringify(currentGrid)) {
      await Game.updateOne({ _id: game._id }, { $set: { "content.grid": repairedGrid } });
    }

    playableGame = {
      ...game,
      content: {
        ...content,
        grid: repairedGrid
      }
    };
  }

  const recordViews = await getGameRecordViews(gameId, teacherId, defaultStudentId || undefined);
  const data = asPlain({ game: playableGame, students, recordViews });
  const backHref =
    session?.role === "teacher" ? "/teacher" : session?.role === "student" ? "/student" : "/games";

  return (
    <main className="page game-page">
      <div className="shell">
        <Link className="button ghost" href={backHref}>
          <ArrowLeft size={18} /> Tornar
        </Link>
        <div style={{ marginTop: 18 }}>
          <GamePlayer
            game={data.game as any}
            students={data.students as any}
            defaultStudentId={defaultStudentId}
            mode={mode}
            records={data.recordViews.records}
            classRecords={data.recordViews.classRecords}
            backHref={backHref}
          />
        </div>
      </div>
    </main>
  );
}

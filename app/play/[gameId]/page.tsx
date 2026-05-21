import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession, getStudentByUserIdOrEmail, getTeacherByUserId } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Game, Student } from "@/lib/models";
import { GamePlayer } from "@/components/GamePlayer";
import { getGameRecordViews } from "@/lib/record-views";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  await connectDb();

  const game = await Game.findById(gameId).lean();
  if (!game) {
    return <main className="page">Juego no encontrado.</main>;
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

  const recordViews = await getGameRecordViews(gameId, teacherId, defaultStudentId || undefined);
  const data = asPlain({ game, students, recordViews });

  return (
    <main className="page game-page">
      <div className="shell">
        <Link className="button ghost" href={session?.role === "student" ? "/student" : "/teacher"}>
          <ArrowLeft size={18} /> Volver
        </Link>
        <div style={{ marginTop: 18 }}>
          <GamePlayer
            game={data.game as any}
            students={data.students as any}
            defaultStudentId={defaultStudentId}
            mode={mode}
            records={data.recordViews.records}
            classRecords={data.recordViews.classRecords}
          />
        </div>
      </div>
    </main>
  );
}

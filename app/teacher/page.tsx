import Link from "next/link";
import { BookOpen, FileJson, LogOut, Play, Plus, Upload, Users } from "lucide-react";
import { requireUser, getTeacherByUserId } from "@/lib/auth";
import { createClassAction, createGameAction, createStudentAction, importGameAction, logoutAction } from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { aiGamePrompt } from "@/lib/game-import";
import { ClassGroup, Game, GameAttempt, Student, StudentGameRecord } from "@/lib/models";
import { AiPromptBox } from "@/components/AiPromptBox";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export default async function TeacherPage() {
  const session = await requireUser("teacher");
  await connectDb();
  const teacher = await getTeacherByUserId(session.id);

  if (!teacher) {
    return <main className="page">No se encontro perfil docente.</main>;
  }

  const [classes, students, games, attempts, records] = await Promise.all([
    ClassGroup.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).lean(),
    Student.find({ teacherOwnerId: teacher._id }).sort({ createdAt: -1 }).lean(),
    Game.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).lean(),
    GameAttempt.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).limit(8).lean(),
    StudentGameRecord.find({})
      .populate("studentId", "name email")
      .populate("gameId", "title")
      .sort({ bestScore: -1 })
      .limit(8)
      .lean()
  ]);

  const data = asPlain({ classes, students, games, attempts, records });

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <div className="brand">
              <span className="brand-mark">
                <span>a</span>
                <span>F</span>
                <span>A</span>
              </span>
              Panel profesor
            </div>
            <p className="muted">Hola, {session.name}. Gestiona clases, alumnos y juegos.</p>
          </div>
          <form action={logoutAction}>
            <button className="button ghost" type="submit">
              <LogOut size={18} /> Salir
            </button>
          </form>
        </header>

        <section className="grid grid-3">
          <article className="card stat">
            <Users color="#c000d8" />
            <h2>{data.students.length}</h2>
            <p className="muted">Alumnos</p>
          </article>
          <article className="card stat cyan">
            <BookOpen color="#18a0e8" />
            <h2>{data.games.length}</h2>
            <p className="muted">Juegos</p>
          </article>
          <article className="card stat orange">
            <Play color="#f05800" />
            <h2>{data.attempts.length}</h2>
            <p className="muted">Partidas recientes</p>
          </article>
        </section>

        <section className="grid grid-3" style={{ marginTop: 18 }}>
          <div className="panel">
            <h2>Crear clase</h2>
            <form className="form" action={createClassAction} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Nombre</label>
                <input name="name" placeholder="3º Primaria A" required />
              </div>
              <div className="field">
                <label>Curso</label>
                <select name="gradeLevel" defaultValue="3">
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}º Primaria
                    </option>
                  ))}
                </select>
              </div>
              <button className="button" type="submit">
                <Plus size={18} /> Crear
              </button>
            </form>
          </div>

          <div className="panel">
            <h2>Añadir alumno</h2>
            <form className="form" action={createStudentAction} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Nombre</label>
                <input name="name" placeholder="Ana Garcia" required />
              </div>
              <div className="field">
                <label>Correo unico</label>
                <input name="email" type="email" placeholder="ana@familia.com" required />
              </div>
              <div className="field">
                <label>Curso</label>
                <select name="gradeLevel" defaultValue="3">
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}º Primaria
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Clase</label>
                <select name="classId" defaultValue="">
                  <option value="">Sin clase</option>
                  {data.classes.map((group: { _id: string; name: string }) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="button cyan" type="submit">
                <Plus size={18} /> Añadir
              </button>
            </form>
          </div>

          <div className="panel">
            <h2>Crear juego demo</h2>
            <form className="form" action={createGameAction} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Titulo</label>
                <input name="title" placeholder="Animales y habitats" required />
              </div>
              <div className="field">
                <label>Asignatura</label>
                <input name="subject" placeholder="Ciencias" required />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select name="type" defaultValue="matching">
                  <option value="matching">Relacionar</option>
                  <option value="fill_blanks">Llenar huecos</option>
                  <option value="basic_typing">Escribir basico</option>
                </select>
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label>Desde</label>
                  <select name="gradeMin" defaultValue="1">
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}º
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Hasta</label>
                  <select name="gradeMax" defaultValue="6">
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}º
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Dificultad</label>
                <select name="difficulty" defaultValue="easy">
                  <option value="easy">Facil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Dificil</option>
                </select>
              </div>
              <button className="button secondary" type="submit">
                <Plus size={18} /> Crear
              </button>
            </form>
          </div>
        </section>

        <section className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="panel">
            <AiPromptBox prompt={aiGamePrompt} />
          </div>

          <div className="panel">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <FileJson color="#c000d8" />
              <h2>Importar juego con IA</h2>
            </div>
            <p className="muted">
              Pega aqui el JSON generado por la IA o un texto estructurado. Al importar, el juego
              queda publicado y disponible para jugar.
            </p>
            <form className="form" action={importGameAction}>
              <div className="field">
                <label>JSON o texto del juego</label>
                <textarea
                  name="gameImport"
                  required
                  placeholder={`TITULO: Animales y habitats
ASIGNATURA: Ciencias
TIPO: matching
CURSOS: 1-3
DIFICULTAD: easy
TIEMPO: 90
INSTRUCCIONES: Relaciona cada animal con su habitat.
PARES:
Pez = Mar
Conejo = Bosque
Aguila = Cielo`}
                />
              </div>
              <button className="button secondary" type="submit">
                <Upload size={18} /> Importar y publicar
              </button>
            </form>
          </div>
        </section>

        <section className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="panel">
            <h2>Juegos publicados</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {data.games.map((game: { _id: string; title: string; subject: string; type: string }) => (
                <div className="row" key={game._id}>
                  <div>
                    <strong>{game.title}</strong>
                    <div className="muted">{game.subject} · {game.type}</div>
                  </div>
                  <Link className="button black" href={`/play/${game._id}`}>
                    Jugar
                  </Link>
                </div>
              ))}
              {data.games.length === 0 && <p className="muted">Crea un juego demo para empezar.</p>}
            </div>
          </div>

          <div className="panel">
            <h2>Alumnos</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {data.students.map((student: { _id: string; name: string; email: string; gradeLevel: number }) => (
                <div className="row" key={student._id}>
                  <div>
                    <strong>{student.name}</strong>
                    <div className="muted">{student.email}</div>
                  </div>
                  <span className="badge orange">{student.gradeLevel}º</span>
                </div>
              ))}
              {data.students.length === 0 && <p className="muted">Añade alumnos para jugar en modo aula.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

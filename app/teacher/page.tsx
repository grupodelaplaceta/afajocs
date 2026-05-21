import Link from "next/link";
import {
  BookOpen,
  FileJson,
  Gamepad2,
  GraduationCap,
  Library,
  LogOut,
  Play,
  Plus,
  Upload,
  Users
} from "lucide-react";
import { requireUser, getTeacherByUserId } from "@/lib/auth";
import {
  createClassAction,
  createGameAction,
  createStudentAction,
  importGameAction,
  logoutAction
} from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { aiGamePrompt } from "@/lib/game-import";
import { ClassGroup, Game, GameAttempt, Student, StudentGameRecord } from "@/lib/models";
import { AiPromptBox } from "@/components/AiPromptBox";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

const tabs = [
  { id: "resumen", label: "Resumen", icon: Play },
  { id: "clases", label: "Clases", icon: GraduationCap },
  { id: "alumnos", label: "Alumnos", icon: Users },
  { id: "crear", label: "Crear juego", icon: Gamepad2 },
  { id: "importar", label: "Importar IA", icon: FileJson },
  { id: "publicados", label: "Publicados", icon: Library }
];

function gradeLabel(group: { gradeLevels?: number[]; gradeLevel?: number }) {
  const grades = group.gradeLevels?.length ? group.gradeLevels : group.gradeLevel ? [group.gradeLevel] : [];
  return grades.map((grade) => `${grade}º`).join(" + ") || "Mixto";
}

export default async function TeacherPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const query = await searchParams;
  const activeTab = tabs.some((tab) => tab.id === query.tab) ? query.tab || "resumen" : "resumen";
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
            <p className="muted">Hola, {session.name}. Cada seccion tiene su propia ventana.</p>
          </div>
          <div className="toolbar">
            <Link className="button black" href="/games">
              <Library size={18} /> Biblioteca
            </Link>
            <form action={logoutAction}>
              <button className="button ghost" type="submit">
                <LogOut size={18} /> Salir
              </button>
            </form>
          </div>
        </header>

        <nav className="tabs" aria-label="Secciones del panel docente">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "active" : ""}`}
                href={`/teacher?tab=${tab.id}`}
              >
                <Icon size={18} /> {tab.label}
              </Link>
            );
          })}
        </nav>

        {activeTab === "resumen" && (
          <section className="tab-panel">
            <div className="grid grid-3">
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
            </div>
          </section>
        )}

        {activeTab === "clases" && (
          <section className="tab-panel grid grid-2">
            <div className="panel">
              <h2>Crear grupo</h2>
              <p className="muted">Puedes combinar cursos, por ejemplo 1º + 2º o ciclo medio.</p>
              <form className="form" action={createClassAction}>
                <div className="field">
                  <label>Nombre</label>
                  <input name="name" placeholder="Ciclo inicial" required />
                </div>
                <div className="field">
                  <label>Cursos del grupo</label>
                  <div className="choice-grid">
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <label className="choice" key={grade}>
                        <input name="gradeLevels" type="checkbox" value={grade} defaultChecked={grade === 1} />
                        <span>{grade}º</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button className="button" type="submit">
                  <Plus size={18} /> Crear grupo
                </button>
              </form>
            </div>

            <div className="panel">
              <h2>Grupos</h2>
              <div className="list" style={{ marginTop: 14 }}>
                {data.classes.map((group: { _id: string; name: string; gradeLevel?: number; gradeLevels?: number[] }) => (
                  <div className="row" key={group._id}>
                    <div>
                      <strong>{group.name}</strong>
                      <div className="muted">Cursos: {gradeLabel(group)}</div>
                    </div>
                    <span className="badge cyan">Grupo</span>
                  </div>
                ))}
                {data.classes.length === 0 && <p className="muted">Crea tu primer grupo.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === "alumnos" && (
          <section className="tab-panel grid grid-2">
            <div className="panel">
              <h2>Añadir alumno</h2>
              <form className="form" action={createStudentAction}>
                <div className="field">
                  <label>Nombre</label>
                  <input name="name" placeholder="Ana Garcia" required />
                </div>
                <div className="field">
                  <label>Correo unico</label>
                  <input name="email" type="email" placeholder="ana@familia.com" required />
                </div>
                <div className="field">
                  <label>Curso actual</label>
                  <select name="gradeLevel" defaultValue="3">
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}º Primaria
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Grupo</label>
                  <select name="classId" defaultValue="">
                    <option value="">Sin grupo</option>
                    {data.classes.map((group: { _id: string; name: string; gradeLevel?: number; gradeLevels?: number[] }) => (
                      <option key={group._id} value={group._id}>
                        {group.name} · {gradeLabel(group)}
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
        )}

        {activeTab === "crear" && (
          <section className="tab-panel panel">
            <h2>Crear juego demo</h2>
            <p className="muted">Crea una actividad base y luego podras jugarla desde la biblioteca.</p>
            <form className="form form-wide" action={createGameAction}>
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
              <div className="field">
                <label>Dificultad</label>
                <select name="difficulty" defaultValue="easy">
                  <option value="easy">Facil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Dificil</option>
                </select>
              </div>
              <button className="button secondary" type="submit">
                <Plus size={18} /> Crear juego
              </button>
            </form>
          </section>
        )}

        {activeTab === "importar" && (
          <section className="tab-panel grid grid-2">
            <div className="panel">
              <AiPromptBox prompt={aiGamePrompt} />
            </div>

            <div className="panel">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FileJson color="#c000d8" />
                <h2>Importar juego con IA</h2>
              </div>
              <p className="muted">Pega el JSON generado por la IA o un texto estructurado.</p>
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
        )}

        {activeTab === "publicados" && (
          <section className="tab-panel panel">
            <div className="row" style={{ border: 0, padding: 0 }}>
              <div>
                <h2>Juegos publicados</h2>
                <p className="muted">Aqui ves tus juegos. La biblioteca muestra todos los publicados.</p>
              </div>
              <Link className="button black" href="/games">
                <Library size={18} /> Ver biblioteca
              </Link>
            </div>
            <div className="game-card-grid" style={{ marginTop: 18 }}>
              {data.games.map((game: { _id: string; title: string; subject: string; type: string; gradeMin: number; gradeMax: number }) => (
                <article className="game-card" key={game._id}>
                  <span className="badge cyan">{game.subject}</span>
                  <h3>{game.title}</h3>
                  <p className="muted">
                    {game.type} · {game.gradeMin}º a {game.gradeMax}º
                  </p>
                  <Link className="button" href={`/play/${game._id}`}>
                    Jugar
                  </Link>
                </article>
              ))}
              {data.games.length === 0 && <p className="muted">Crea o importa un juego para empezar.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}


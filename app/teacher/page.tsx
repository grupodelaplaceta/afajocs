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
  deleteClassAction,
  createGameAction,
  createStudentAction,
  importGameAction,
  logoutAction,
  updateClassAction
} from "@/lib/actions";
import { connectDb } from "@/lib/db";
import { aiGamePrompt } from "@/lib/game-import";
import { ClassGroup, Game, GameAttempt, Student, StudentGameRecord } from "@/lib/models";
import { AiPromptBox } from "@/components/AiPromptBox";
import { BrandLogo } from "@/components/BrandLogo";

function asPlain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

const tabs = [
  { id: "resumen", label: "Resum", icon: Play },
  { id: "clases", label: "Grups", icon: GraduationCap },
  { id: "alumnos", label: "Alumnes", icon: Users },
  { id: "crear", label: "Crear joc", icon: Gamepad2 },
  { id: "importar", label: "Importar IA", icon: FileJson },
  { id: "publicados", label: "Publicats", icon: Library }
];

function gradeLabel(group: { gradeLevels?: number[]; gradeLevel?: number }) {
  const grades = group.gradeLevels?.length ? group.gradeLevels : group.gradeLevel ? [group.gradeLevel] : [];
  return grades.map((grade) => `${grade}º`).join(" + ") || "Mixto";
}

export default async function TeacherPage() {
  const session = await requireUser("teacher");
  await connectDb();
  const teacher = await getTeacherByUserId(session.id);

  if (!teacher) {
    return <main className="page">No se encontro perfil docente.</main>;
  }

  const [classes, students, games, attempts, records, studentStats] = await Promise.all([
    ClassGroup.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).lean(),
    Student.find({ teacherOwnerId: teacher._id }).sort({ createdAt: -1 }).lean(),
    Game.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).lean(),
    GameAttempt.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).limit(8).lean(),
    StudentGameRecord.find({})
      .populate("studentId", "name email")
      .populate("gameId", "title")
      .sort({ bestScore: -1 })
      .limit(8)
      .lean(),
    GameAttempt.aggregate([
      { $match: { teacherId: teacher._id } },
      {
        $group: {
          _id: "$studentId",
          totalScore: { $sum: "$score" },
          attempts: { $sum: 1 },
          avgScore: { $avg: "$score" },
          bestScore: { $max: "$score" }
        }
      }
    ])
  ]);

  const data = asPlain({ classes, students, games, attempts, records, studentStats });
  const statsByStudent = new Map(data.studentStats.map((stat: any) => [String(stat._id), stat]));

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <BrandLogo label="Panel profesor" />
            <p className="muted">Hola, {session.name}. Cada secció té la seva pròpia finestra.</p>
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

        <div className="teacher-tabs">
          {tabs.map((tab, index) => (
            <input
              key={tab.id}
              id={`tab-${tab.id}`}
              name="teacher-tab"
              type="radio"
              defaultChecked={index === 0}
            />
          ))}

          <nav className="tabs" aria-label="Secciones del panel docente">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <label key={tab.id} className="tab" htmlFor={`tab-${tab.id}`}>
                  <Icon size={18} /> {tab.label}
                </label>
              );
            })}
          </nav>

          <div className="tab-panels">
            <section className="tab-panel tab-content tab-resumen">
            <div className="grid grid-3">
              <article className="card stat">
                <Users color="#c000d8" />
                <h2>{data.students.length}</h2>
                <p className="muted">Alumnes</p>
              </article>
              <article className="card stat cyan">
                <BookOpen color="#18a0e8" />
                <h2>{data.games.length}</h2>
                <p className="muted">Jocs</p>
              </article>
              <article className="card stat orange">
                <Play color="#f05800" />
                <h2>{data.attempts.length}</h2>
                <p className="muted">Partides recents</p>
              </article>
            </div>
          </section>

          <section className="tab-panel tab-content tab-clases grid grid-2">
            <div className="panel">
              <h2>Crear grup</h2>
              <p className="muted">Pots combinar cursos, per exemple 1r + 2n o cicle mitjà.</p>
              <form className="form" action={createClassAction}>
                <div className="field">
                  <label>Nom</label>
                  <input name="name" placeholder="Ciclo inicial" required />
                </div>
                <div className="field">
                  <label>Cursos del grup</label>
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
                  <Plus size={18} /> Crear grup
                </button>
              </form>
            </div>

            <div className="panel">
              <h2>Grups</h2>
              <div className="list" style={{ marginTop: 14 }}>
                {data.classes.map((group: { _id: string; name: string; gradeLevel?: number; gradeLevels?: number[] }) => (
                  <div className="inline-edit-form" key={group._id}>
                    <form className="form" action={updateClassAction}>
                      <input type="hidden" name="classId" value={group._id} />
                      <div className="field">
                        <label>Nom del grup</label>
                        <input name="name" defaultValue={group.name} required />
                      </div>
                      <div className="field">
                        <label>Cursos</label>
                        <div className="choice-grid">
                          {[1, 2, 3, 4, 5, 6].map((grade) => {
                            const selectedGrades = group.gradeLevels?.length
                              ? group.gradeLevels
                              : group.gradeLevel
                                ? [group.gradeLevel]
                                : [];
                            return (
                              <label className="choice" key={grade}>
                                <input
                                  name="gradeLevels"
                                  type="checkbox"
                                  value={grade}
                                  defaultChecked={selectedGrades.includes(grade)}
                                />
                                <span>{grade}º</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <button className="button cyan" type="submit">
                        Desar canvis
                      </button>
                    </form>
                    <form action={deleteClassAction} className="danger-zone inline-edit-form">
                      <input type="hidden" name="classId" value={group._id} />
                      <div>
                        <strong>{group.name}</strong>
                        <div className="muted">Cursos actuals: {gradeLabel(group)}</div>
                      </div>
                      <button className="button secondary" type="submit">
                        Eliminar grup
                      </button>
                    </form>
                  </div>
                ))}
                {data.classes.length === 0 && <p className="muted">Crea el teu primer grup.</p>}
              </div>
            </div>
          </section>

          <section className="tab-panel tab-content tab-alumnos grid grid-2">
            <div className="panel">
              <h2>Afegir alumne</h2>
              <form className="form" action={createStudentAction}>
                <div className="field">
                  <label>Nom</label>
                  <input name="name" placeholder="Ana Garcia" required />
                </div>
                <div className="field">
                  <label>Correu únic</label>
                  <input name="email" type="email" placeholder="ana@familia.com" required />
                </div>
                <div className="field">
                  <label>Curs actual</label>
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
                    <option value="">Sense grup</option>
                    {data.classes.map((group: { _id: string; name: string; gradeLevel?: number; gradeLevels?: number[] }) => (
                      <option key={group._id} value={group._id}>
                        {group.name} · {gradeLabel(group)}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="button cyan" type="submit">
                  <Plus size={18} /> Afegir
                </button>
              </form>
            </div>

            <div className="panel">
              <h2>Alumnes</h2>
              <div className="list" style={{ marginTop: 14 }}>
                {data.students.map((student: { _id: string; name: string; email: string; gradeLevel: number }) => {
                  const stats = statsByStudent.get(student._id) as any;
                  return (
                  <div className="row" key={student._id}>
                    <div>
                      <strong>{student.name}</strong>
                      <div className="muted">
                        {student.email} · {stats?.attempts || 0} partides · {stats?.totalScore || 0} punts
                      </div>
                    </div>
                    <span className="badge orange">
                      {student.gradeLevel}º · millor {stats?.bestScore || 0}
                    </span>
                  </div>
                  );
                })}
                {data.students.length === 0 && <p className="muted">Afegeix alumnes per jugar en mode aula.</p>}
              </div>
            </div>
          </section>

          <section className="tab-panel tab-content tab-crear panel">
            <h2>Crear joc demo</h2>
            <p className="muted">Crea una activitat base i després la podràs jugar des de la biblioteca.</p>
            <form className="form form-wide" action={createGameAction}>
              <div className="field">
                <label>Títol</label>
                <input name="title" placeholder="Animales y habitats" required />
              </div>
              <div className="field">
                <label>Assignatura</label>
                <input name="subject" placeholder="Ciencias" required />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select name="type" defaultValue="matching">
                  <option value="matching">Relacionar</option>
                  <option value="fill_blanks">Omplir buits</option>
                  <option value="basic_typing">Escriure</option>
                  <option value="word_search">Sopa de lletres</option>
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
                  <option value="easy">Fàcil</option>
                  <option value="medium">Mitjana</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
              <button className="button secondary" type="submit">
                <Plus size={18} /> Crear joc
              </button>
            </form>
          </section>

          <section className="tab-panel tab-content tab-importar grid grid-2">
            <div className="panel">
              <AiPromptBox prompt={aiGamePrompt} />
            </div>

            <div className="panel">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FileJson color="#c000d8" />
                <h2>Importar joc amb IA</h2>
              </div>
              <p className="muted">Enganxa el JSON generat per la IA o un text estructurat.</p>
              <form className="form" action={importGameAction}>
                <div className="field">
                  <label>JSON o text del joc</label>
                  <textarea
                    name="gameImport"
                    required
                    placeholder={`TITOL: Animals
ASSIGNATURA: Llengua
TIPO: word_search
CURSOS: 1-3
DIFICULTAT: easy
TIEMPO: 120
INSTRUCCIONES: Troba les paraules amagades.
PARAULES:
GAT, PEIX, DOFI, OS, CASA`}
                  />
                </div>
                <button className="button secondary" type="submit">
                  <Upload size={18} /> Importar y publicar
                </button>
              </form>
            </div>
          </section>

          <section className="tab-panel tab-content tab-publicados panel">
            <div className="row" style={{ border: 0, padding: 0 }}>
              <div>
                <h2>Jocs publicats</h2>
                <p className="muted">Aquí veus els teus jocs. La biblioteca mostra tots els publicats.</p>
              </div>
              <Link className="button black" href="/games">
                <Library size={18} /> Veure biblioteca
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
              {data.games.length === 0 && <p className="muted">Crea o importa un joc per començar.</p>}
            </div>
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}

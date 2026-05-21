"use client";

import { useMemo, useState } from "react";
import { Check, Clock, Medal, Sparkles, Trophy } from "lucide-react";
import { saveAttemptAction } from "@/lib/actions";
import { normalizeAnswer } from "@/lib/scoring";

type StudentOption = {
  _id: string;
  name: string;
  email: string;
  gradeLevel: number;
};

type GameData = {
  _id: string;
  title: string;
  type: "matching" | "fill_blanks" | "basic_typing";
  content: Record<string, any>;
  estimatedTimeSeconds: number;
};

type Props = {
  game: GameData;
  students: StudentOption[];
  defaultStudentId?: string;
  mode: "classroom" | "remote";
  records?: GameRecord[];
  classRecords?: ClassRecord[];
};

type GameRecord = {
  studentId: string;
  studentName: string;
  bestScore: number;
  bestTimeSeconds: number;
};

type ClassRecord = {
  classId: string;
  className: string;
  gradeLevels: number[];
  bestScore: number;
  bestTimeSeconds: number | null;
  studentName: string | null;
};

export function GamePlayer({ game, students, defaultStudentId, mode, records = [], classRecords = [] }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || "");
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const totalItems = useMemo(() => getTotalItems(game), [game]);
  const timeSpentSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 1;
  const personalRecord = records.find((record) => record.studentId === selectedStudentId);
  const activeStudent = students.find((student) => student._id === selectedStudentId);

  function start() {
    setStarted(true);
    setStartedAt(Date.now());
  }

  function finish(result: { correct: number; wrong: number }) {
    setCorrectAnswers(result.correct);
    setWrongAnswers(result.wrong);
    setFinished(true);
  }

  if (!started) {
    return (
      <div className="game-board animate-in">
        <p className="eyebrow">Preparacion</p>
        <h1 style={{ color: "#101014", fontSize: "clamp(2rem, 5vw, 4rem)" }}>{game.title}</h1>
        <p className="muted">{String(game.content.instructions || "Completa la actividad.")}</p>

        {mode === "classroom" && (
          <div className="field" style={{ margin: "18px 0" }}>
            <label>¿Quien juega ahora?</label>
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
              <option value="">Seleccionar alumno</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} · {student.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="record-grid" style={{ marginTop: 18 }}>
          <article className="record-card featured">
            <Medal size={30} />
            <div>
              <span className="eyebrow">Record personal</span>
              <h2>{personalRecord ? `${personalRecord.bestScore} pts` : "Sin record"}</h2>
              <p className="muted">
                {personalRecord
                  ? `${activeStudent?.name || personalRecord.studentName} · ${personalRecord.bestTimeSeconds}s`
                  : selectedStudentId
                    ? "Primera oportunidad para marcar record."
                    : "Selecciona alumno para verlo."}
              </p>
            </div>
          </article>

          {classRecords.slice(0, 3).map((record) => (
            <article className="record-card" key={record.classId}>
              <Trophy size={28} />
              <div>
                <span className="eyebrow">{record.className}</span>
                <h2>{record.bestScore ? `${record.bestScore} pts` : "Sin record"}</h2>
                <p className="muted">
                  {record.studentName
                    ? `${record.studentName} · ${record.bestTimeSeconds}s`
                    : `Cursos ${record.gradeLevels.map((grade) => `${grade}º`).join(" + ") || "mixtos"}`}
                </p>
              </div>
            </article>
          ))}
        </div>

        <button className="button secondary" disabled={!selectedStudentId} onClick={start}>
          <Sparkles size={18} /> Empezar
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="game-header">
        <div>
          <span className="badge cyan">AFAJICS</span>
          <h2 style={{ marginTop: 8 }}>{game.title}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="badge orange">
            <Clock size={14} /> {timeSpentSeconds}s
          </span>
          <div className="progress-track">
            <div className="progress-fill" />
          </div>
        </div>
      </header>

      <div className="game-board animate-in">
        <p className="eyebrow">Mision</p>
        <h2>{String(game.content.instructions || "Completa la actividad.")}</h2>

        {!finished && game.type === "matching" && <MatchingActivity game={game} onFinish={finish} />}
        {!finished && game.type === "fill_blanks" && <FillBlanksActivity game={game} onFinish={finish} />}
        {!finished && game.type === "basic_typing" && <TypingActivity game={game} onFinish={finish} />}

        {finished && (
          <form action={saveAttemptAction} className="panel result-panel" style={{ marginTop: 18 }}>
            <Trophy color="#f05800" size={42} />
            <h2>Resultado listo</h2>
            <p className="muted">
              Aciertos: {correctAnswers}/{totalItems}. Tiempo: {timeSpentSeconds}s.
            </p>
            <input type="hidden" name="gameId" value={game._id} />
            <input type="hidden" name="studentId" value={selectedStudentId} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="correctAnswers" value={correctAnswers} />
            <input type="hidden" name="wrongAnswers" value={wrongAnswers} />
            <input type="hidden" name="totalItems" value={totalItems} />
            <input type="hidden" name="timeSpentSeconds" value={timeSpentSeconds} />
            <input type="hidden" name="timeLimitSeconds" value={game.estimatedTimeSeconds} />
            <button className="button" type="submit">
              Guardar puntuacion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getTotalItems(game: GameData) {
  if (game.type === "matching") return game.content.pairs?.length || 1;
  if (game.type === "fill_blanks") return game.content.blanks?.length || 1;
  return game.content.prompts?.length || 1;
}

function MatchingActivity({
  game,
  onFinish
}: {
  game: GameData;
  onFinish: (result: { correct: number; wrong: number }) => void;
}) {
  const pairs = game.content.pairs || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const rights = [...pairs].sort((a, b) => String(b.id).localeCompare(String(a.id)));

  function check() {
    let correct = 0;
    pairs.forEach((pair: any) => {
      if (answers[pair.id] === pair.right.value) correct++;
    });
    onFinish({ correct, wrong: pairs.length - correct });
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div className="activity-grid">
        {pairs.map((pair: any) => (
          <div className="tile animate-in" key={pair.id}>
            <div>{pair.left.value}</div>
            <select
              style={{ marginTop: 12, width: "100%" }}
              value={answers[pair.id] || ""}
              onChange={(event) => setAnswers({ ...answers, [pair.id]: event.target.value })}
            >
              <option value="">Elige pareja</option>
              {rights.map((right: any) => (
                <option key={right.id} value={right.right.value}>
                  {right.right.value}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button className="button" style={{ marginTop: 18 }} onClick={check}>
        <Check size={18} /> Comprobar
      </button>
    </div>
  );
}

function FillBlanksActivity({
  game,
  onFinish
}: {
  game: GameData;
  onFinish: (result: { correct: number; wrong: number }) => void;
}) {
  const blanks = game.content.blanks || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function check() {
    let correct = 0;
    blanks.forEach((blank: any) => {
      if (normalizeAnswer(answers[blank.id] || "") === normalizeAnswer(blank.answer)) correct++;
    });
    onFinish({ correct, wrong: blanks.length - correct });
  }

  return (
    <div style={{ marginTop: 18 }}>
      <p style={{ fontSize: "1.4rem" }}>
        {(game.content.text || "").split(/({{blank:\d+}})/g).map((part: string, index: number) => {
          const match = part.match(/{{blank:(\d+)}}/);
          if (!match) return <span key={index}>{part}</span>;
          const blank = blanks[Number(match[1]) - 1];
          return (
            <select
              className="blank"
              key={part}
              value={answers[blank.id] || ""}
              onChange={(event) => setAnswers({ ...answers, [blank.id]: event.target.value })}
            >
              <option value="">...</option>
              {(game.content.wordBank || []).map((word: string) => (
                <option key={word} value={word}>
                  {word}
                </option>
              ))}
            </select>
          );
        })}
      </p>
      <div className="word-bank">
        {(game.content.wordBank || []).map((word: string) => (
          <span className="badge orange" key={word}>
            {word}
          </span>
        ))}
      </div>
      <button className="button" style={{ marginTop: 18 }} onClick={check}>
        <Check size={18} /> Comprobar
      </button>
    </div>
  );
}

function TypingActivity({
  game,
  onFinish
}: {
  game: GameData;
  onFinish: (result: { correct: number; wrong: number }) => void;
}) {
  const prompts = game.content.prompts || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function check() {
    let correct = 0;
    prompts.forEach((prompt: any) => {
      const given = normalizeAnswer(answers[prompt.id] || "", Boolean(game.content.settings?.accentSensitive));
      const accepted = prompt.acceptedAnswers.map((answer: string) =>
        normalizeAnswer(answer, Boolean(game.content.settings?.accentSensitive))
      );
      if (accepted.includes(given)) correct++;
    });
    onFinish({ correct, wrong: prompts.length - correct });
  }

  return (
    <div className="list" style={{ marginTop: 18 }}>
      {prompts.map((prompt: any) => (
        <div className="tile animate-in" key={prompt.id}>
          <label className="field">
            <span>{prompt.question}</span>
            <input
              value={answers[prompt.id] || ""}
              onChange={(event) => setAnswers({ ...answers, [prompt.id]: event.target.value })}
              placeholder="Tu respuesta"
            />
          </label>
        </div>
      ))}
      <button className="button" onClick={check}>
        <Check size={18} /> Comprobar
      </button>
    </div>
  );
}

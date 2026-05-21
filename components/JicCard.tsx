import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  Eye,
  Keyboard,
  Link2,
  Play,
  Search,
  SpellCheck,
  TextCursorInput
} from "lucide-react";

type JicLike = {
  _id: string;
  title: string;
  subject: string;
  type: string;
  gradeMin: number;
  gradeMax: number;
  difficulty?: string;
};

type Props = {
  game: JicLike;
  compact?: boolean;
  children?: ReactNode;
};

export function JicCard({ game, compact = false, children }: Props) {
  const meta = getJicTypeMeta(game.type);
  const Icon = meta.icon;

  return (
    <article className={`game-card jic-card ${meta.tone} ${compact ? "compact" : ""}`}>
      <div className="jic-card-top">
        <div className="game-card-icon">
          <Icon size={30} />
        </div>
        <div className="jic-card-badges">
          <span className="badge cyan">{game.subject}</span>
          <span className="badge">{meta.label}</span>
        </div>
      </div>
      <div>
        <h2>{game.title}</h2>
        <p className="muted">
          {game.gradeMin}º a {game.gradeMax}º
          {game.difficulty ? ` · ${difficultyLabel(game.difficulty)}` : ""}
        </p>
      </div>
      <div className="jic-card-actions">
        {children || (
          <>
            <Link className="button ghost" href={`/games/${game._id}`}>
              <Eye size={18} /> Detall
            </Link>
            <Link className="button secondary" href={`/play/${game._id}`}>
              <Play size={18} /> Jugar
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

export function getJicTypeMeta(type: string) {
  if (type === "matching") return { label: "Relacionar", icon: Link2, tone: "purple" };
  if (type === "fill_blanks") return { label: "Omplir buits", icon: TextCursorInput, tone: "cyan" };
  if (type === "word_search") return { label: "Sopa de lletres", icon: Search, tone: "orange" };
  if (type === "letter_fill") return { label: "Omplir lletres", icon: SpellCheck, tone: "purple" };
  if (type === "basic_typing") return { label: "Escriure", icon: Keyboard, tone: "cyan" };
  return { label: "Jic", icon: BookOpen, tone: "purple" };
}

function difficultyLabel(difficulty: string) {
  if (difficulty === "easy") return "Fàcil";
  if (difficulty === "medium") return "Mitjà";
  if (difficulty === "hard") return "Difícil";
  return difficulty;
}

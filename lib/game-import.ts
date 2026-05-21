import { z } from "zod";

const gameTypes = ["matching", "fill_blanks", "basic_typing"] as const;
const difficulties = ["easy", "medium", "hard"] as const;

export const aiGamePrompt = `Actua como diseñador de actividades educativas para primaria.
Crea UNA actividad para AFAJICS en JSON valido, sin markdown, sin comentarios y sin texto adicional.

Reglas:
- Publico: alumnos de primaria.
- Tipos permitidos: matching, fill_blanks, basic_typing.
- Usa instrucciones cortas, claras y adecuadas para niños.
- Devuelve solo JSON valido.

Formato obligatorio:
{
  "title": "Titulo del juego",
  "subject": "Asignatura",
  "type": "matching | fill_blanks | basic_typing",
  "gradeMin": 1,
  "gradeMax": 6,
  "difficulty": "easy | medium | hard",
  "estimatedTimeSeconds": 90,
  "content": {}
}

Si type es "matching", content debe ser:
{
  "instructions": "Relaciona cada elemento.",
  "settings": { "timeLimitSeconds": 90, "shuffle": true, "instantFeedback": true },
  "pairs": [
    { "id": "pair-1", "left": { "type": "text", "value": "Pez" }, "right": { "type": "text", "value": "Mar" } }
  ]
}

Si type es "fill_blanks", content debe ser:
{
  "instructions": "Completa las frases.",
  "settings": { "timeLimitSeconds": 120, "interaction": "select" },
  "text": "El {{blank:1}} vive en el mar.",
  "blanks": [
    { "id": "blank-1", "answer": "delfin", "displayAnswer": "delfin" }
  ],
  "wordBank": ["delfin", "camello", "aguila"]
}

Si type es "basic_typing", content debe ser:
{
  "instructions": "Escribe la respuesta correcta.",
  "settings": { "timeLimitSeconds": 60, "caseSensitive": false, "accentSensitive": false, "trimWhitespace": true },
  "prompts": [
    { "id": "prompt-1", "question": "Cuanto es 7 + 5?", "acceptedAnswers": ["12", "doce"] }
  ]
}`;

const baseImportSchema = z.object({
  title: z.string().min(3).max(180),
  subject: z.string().min(2).max(80),
  type: z.enum(gameTypes),
  gradeMin: z.coerce.number().min(1).max(6),
  gradeMax: z.coerce.number().min(1).max(6),
  difficulty: z.enum(difficulties),
  estimatedTimeSeconds: z.coerce.number().min(20).max(900).default(90),
  content: z.record(z.unknown())
});

export type ImportedGame = z.infer<typeof baseImportSchema>;

export function parseImportedGame(raw: string): ImportedGame {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Pega un JSON o texto estructurado para importar el juego.");
  }

  const parsed = trimmed.startsWith("{") ? JSON.parse(trimmed) : parseStructuredText(trimmed);
  const game = baseImportSchema.parse(parsed);
  validateContent(game);
  return game;
}

function parseStructuredText(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const fields = new Map<string, string>();
  const sections = new Map<string, string[]>();
  let currentSection = "";

  for (const line of lines) {
    const fieldMatch = line.match(/^([a-zA-ZÁÉÍÓÚáéíóúñÑ ]+):\s*(.*)$/);
    if (fieldMatch) {
      const key = normalizeKey(fieldMatch[1]);
      const value = fieldMatch[2].trim();
      if (["pares", "preguntas", "respuestas", "banco"].includes(key)) {
        currentSection = key;
        sections.set(currentSection, value ? [value] : []);
      } else {
        fields.set(key, value);
        currentSection = "";
      }
      continue;
    }

    if (currentSection) {
      sections.get(currentSection)?.push(line);
    }
  }

  const type = normalizeType(fields.get("tipo") || "matching");
  const gradeRange = parseGradeRange(fields.get("cursos") || "1-6");
  const base = {
    title: fields.get("titulo") || "Juego importado",
    subject: fields.get("asignatura") || "General",
    type,
    gradeMin: gradeRange.gradeMin,
    gradeMax: gradeRange.gradeMax,
    difficulty: normalizeDifficulty(fields.get("dificultad") || "easy"),
    estimatedTimeSeconds: Number(fields.get("tiempo") || 90)
  };

  if (type === "matching") {
    const pairs = (sections.get("pares") || []).map((line, index) => {
      const [left, right] = line.split(/\s*=\s*/);
      return {
        id: `pair-${index + 1}`,
        left: { type: "text", value: left?.trim() || `Elemento ${index + 1}` },
        right: { type: "text", value: right?.trim() || `Respuesta ${index + 1}` }
      };
    });

    return {
      ...base,
      content: {
        instructions: fields.get("instrucciones") || "Relaciona cada elemento.",
        settings: { timeLimitSeconds: base.estimatedTimeSeconds, shuffle: true, instantFeedback: true },
        pairs
      }
    };
  }

  if (type === "fill_blanks") {
    const answers = new Map(
      (sections.get("respuestas") || []).map((line) => {
        const [id, answer] = line.split(/\s*=\s*/);
        return [id?.trim(), answer?.trim()];
      })
    );
    const blanks = [...answers.entries()].map(([id, answer]) => ({
      id,
      answer,
      displayAnswer: answer
    }));
    const wordBank = (sections.get("banco") || [])
      .join(",")
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);

    return {
      ...base,
      content: {
        instructions: fields.get("instrucciones") || "Completa las frases.",
        settings: { timeLimitSeconds: base.estimatedTimeSeconds, interaction: "select" },
        text: fields.get("texto") || "Completa {{blank:1}}.",
        blanks,
        wordBank
      }
    };
  }

  const prompts = (sections.get("preguntas") || []).map((line, index) => {
    const [question, answers] = line.split(/\s*=\s*/);
    return {
      id: `prompt-${index + 1}`,
      question: question?.trim() || `Pregunta ${index + 1}`,
      acceptedAnswers: (answers || "").split("|").map((answer) => answer.trim()).filter(Boolean)
    };
  });

  return {
    ...base,
    content: {
      instructions: fields.get("instrucciones") || "Escribe la respuesta correcta.",
      settings: {
        timeLimitSeconds: base.estimatedTimeSeconds,
        caseSensitive: false,
        accentSensitive: false,
        trimWhitespace: true
      },
      prompts
    }
  };
}

function validateContent(game: ImportedGame) {
  if (game.gradeMin > game.gradeMax) {
    throw new Error("El curso minimo no puede ser mayor que el curso maximo.");
  }

  if (game.type === "matching") {
    const pairs = game.content.pairs;
    if (!Array.isArray(pairs) || pairs.length < 2) {
      throw new Error("Un juego de relacionar necesita al menos 2 pares.");
    }
  }

  if (game.type === "fill_blanks") {
    const blanks = game.content.blanks;
    const wordBank = game.content.wordBank;
    if (!Array.isArray(blanks) || blanks.length < 1 || !Array.isArray(wordBank) || wordBank.length < 2) {
      throw new Error("Un juego de huecos necesita huecos y un banco de palabras.");
    }
  }

  if (game.type === "basic_typing") {
    const prompts = game.content.prompts;
    if (!Array.isArray(prompts) || prompts.length < 1) {
      throw new Error("Un juego de escritura necesita al menos una pregunta.");
    }
  }
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function normalizeType(value: string) {
  const normalized = normalizeKey(value);
  if (["huecos", "fill_blanks", "llenar_huecos"].includes(normalized)) return "fill_blanks";
  if (["escribir", "basic_typing", "escritura"].includes(normalized)) return "basic_typing";
  return "matching";
}

function normalizeDifficulty(value: string) {
  const normalized = normalizeKey(value);
  if (["media", "medium"].includes(normalized)) return "medium";
  if (["dificil", "hard"].includes(normalized)) return "hard";
  return "easy";
}

function parseGradeRange(value: string) {
  const numbers = value.match(/\d+/g)?.map(Number) || [1, 6];
  return {
    gradeMin: numbers[0] || 1,
    gradeMax: numbers[1] || numbers[0] || 6
  };
}


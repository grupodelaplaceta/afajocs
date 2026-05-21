import { z } from "zod";
import { generateWordSearchGrid, normalizeWordSearchWord } from "@/lib/word-search";

const gameTypes = ["matching", "fill_blanks", "basic_typing", "word_search", "letter_fill"] as const;
const difficulties = ["easy", "medium", "hard"] as const;

export const aiGamePrompt = `Actua como diseñador de actividades educativas para primaria.
Crea UNA actividad para AFAJICS en JSON valido, sin markdown, sin comentarios y sin texto adicional.

Reglas:
- Publico: alumnos de primaria.
- Tipos permitidos: matching, fill_blanks, basic_typing, word_search, letter_fill.
- Usa instrucciones cortas, claras y adecuadas para niños.
- Devuelve solo JSON valido.

Formato obligatorio:
{
  "title": "Titulo del juego",
  "subject": "Asignatura",
  "type": "matching | fill_blanks | basic_typing | word_search | letter_fill",
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
}

Si type es "word_search", content debe ser:
{
  "instructions": "Troba les paraules amagades.",
  "settings": { "timeLimitSeconds": 120 },
  "words": [
    { "id": "word-1", "word": "GAT" },
    { "id": "word-2", "word": "PEIX" }
  ]
}

La plataforma pot generar la graella automaticament si envies "words" sense "grid".
També pots enviar una graella ja feta:
{
  "grid": ["GATXX", "AOPXX", "TSEIX", "XXDOF", "XXIXX"]
}

Si type es "letter_fill", content debe ser:
{
  "instructions": "Completa les lletres que falten.",
  "settings": { "timeLimitSeconds": 90, "accentSensitive": false },
  "prompts": [
    { "id": "letter-1", "word": "CASA", "pattern": "C_SA", "acceptedAnswers": ["CASA"] },
    { "id": "letter-2", "word": "GAT", "pattern": "GAT", "mode": "copy", "acceptedAnswers": ["GAT"] }
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

  const parsed = normalizeImportedShape(trimmed.startsWith("{") ? JSON.parse(trimmed) : parseStructuredText(trimmed));
  const game = ensureGeneratedWordSearchGrid(baseImportSchema.parse(parsed));
  validateContent(game);
  return game;
}

function normalizeImportedShape(value: any) {
  const content = value?.content || {};
  const type = normalizeType(String(value?.type || ""));
  const hasWordSearchContent = Array.isArray(content.words) || Array.isArray(content.grid);
  const inferredType = hasWordSearchContent ? "word_search" : type;

  return {
    ...value,
    type: inferredType || value?.type
  };
}

function ensureGeneratedWordSearchGrid(game: ImportedGame): ImportedGame {
  if (game.type !== "word_search") {
    return game;
  }

  const words = Array.isArray(game.content.words)
    ? game.content.words.map((entry: any, index: number) => ({
        id: String(entry.id || `word-${index + 1}`),
        word: normalizeWordSearchWord(String(entry.word || entry))
      }))
    : [];

  const existingGrid = Array.isArray(game.content.grid)
    ? game.content.grid.map((row) => String(row).replace(/\s+/g, "").toUpperCase()).filter(Boolean)
    : [];

  return {
    ...game,
    content: {
      ...game.content,
      words,
      grid: existingGrid.length ? existingGrid : generateWordSearchGrid(words)
    }
  };
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
      if (["pares", "preguntas", "respuestas", "banco", "graella", "palabras", "paraules", "paraules_a_copiar", "lletres"].includes(key)) {
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

  const type = inferStructuredType(fields, sections);
  const gradeRange = parseGradeRange(fields.get("cursos") || "1-6");
  const base = {
    title: fields.get("titulo") || fields.get("titol") || "Joc importat",
    subject: fields.get("asignatura") || fields.get("assignatura") || "General",
    type,
    gradeMin: gradeRange.gradeMin,
    gradeMax: gradeRange.gradeMax,
    difficulty: normalizeDifficulty(fields.get("dificultad") || fields.get("dificultat") || "easy"),
    estimatedTimeSeconds: Number(fields.get("tiempo") || fields.get("temps") || 90)
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
        instructions: fields.get("instrucciones") || fields.get("instruccions") || "Relaciona cada element.",
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
        instructions: fields.get("instrucciones") || fields.get("instruccions") || "Completa les frases.",
        settings: { timeLimitSeconds: base.estimatedTimeSeconds, interaction: "select" },
        text: fields.get("texto") || "Completa {{blank:1}}.",
        blanks,
        wordBank
      }
    };
  }

  if (type === "word_search") {
    const grid = (sections.get("graella") || [])
      .map((line) => line.replace(/\s+/g, "").toUpperCase())
      .filter(Boolean);
    const words = (sections.get("paraules") || sections.get("palabras") || [])
      .join(",")
      .split(",")
      .map((word, index) => word.trim().toUpperCase())
      .filter(Boolean)
      .map((word, index) => ({ id: `word-${index + 1}`, word }));

    return {
      ...base,
      content: {
        instructions: fields.get("instrucciones") || fields.get("instruccions") || "Troba les paraules amagades.",
        settings: { timeLimitSeconds: base.estimatedTimeSeconds },
        grid: grid.length ? grid : generateWordSearchGrid(words),
        words
      }
    };
  }

  if (type === "letter_fill") {
    const prompts = (sections.get("lletres") || sections.get("paraules_a_copiar") || [])
      .map((line, index) => {
        const [patternOrWord, answer] = line.split(/\s*=\s*/);
        const value = (answer || patternOrWord || "").trim().toUpperCase();
        const pattern = (patternOrWord || value).trim().toUpperCase();
        return {
          id: `letter-${index + 1}`,
          word: value,
          pattern,
          mode: pattern.includes("_") ? "fill" : "copy",
          acceptedAnswers: [value]
        };
      })
      .filter((item) => item.word);

    return {
      ...base,
      content: {
        instructions: fields.get("instrucciones") || fields.get("instruccions") || "Completa les lletres que falten.",
        settings: { timeLimitSeconds: base.estimatedTimeSeconds, accentSensitive: false },
        prompts
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
      instructions: fields.get("instrucciones") || fields.get("instruccions") || "Escriu la resposta correcta.",
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

  if (game.type === "letter_fill") {
    const prompts = game.content.prompts;
    if (!Array.isArray(prompts) || prompts.length < 1) {
      throw new Error("Una activitat de lletres necessita almenys una paraula.");
    }
  }

  if (game.type === "word_search") {
    const grid = game.content.grid;
    const words = game.content.words;
    if (!Array.isArray(grid) || grid.length < 3 || !Array.isArray(words) || words.length < 1) {
      throw new Error("Una sopa de lletres necessita una graella i paraules.");
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
  if (!normalized) return "";
  if (["huecos", "fill_blanks", "llenar_huecos"].includes(normalized)) return "fill_blanks";
  if (["escribir", "basic_typing", "escritura"].includes(normalized)) return "basic_typing";
  if (["lletres", "omplir_lletres", "copiar_paraules", "copiar_palabras", "letter_fill"].includes(normalized)) return "letter_fill";
  if (
    [
      "sopa",
      "sopa_lletres",
      "sopa_letras",
      "sopa_de_lletres",
      "sopa_de_letras",
      "word_search",
      "wordsearch"
    ].includes(normalized)
  ) {
    return "word_search";
  }
  return "matching";
}

function inferStructuredType(fields: Map<string, string>, sections: Map<string, string[]>) {
  const explicit = normalizeType(fields.get("tipo") || fields.get("tipus") || fields.get("type") || "");
  if (explicit) return explicit;
  if (sections.has("paraules") || sections.has("palabras") || sections.has("graella")) return "word_search";
  if (sections.has("lletres") || sections.has("paraules_a_copiar")) return "letter_fill";
  if (sections.has("preguntas")) return "basic_typing";
  if (sections.has("respuestas") || sections.has("banco")) return "fill_blanks";
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

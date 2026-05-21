import { generateWordSearchGrid } from "@/lib/word-search";

const demoWordSearchWords = [
  { id: "word-1", word: "GAT" },
  { id: "word-2", word: "OS" },
  { id: "word-3", word: "PEIX" },
  { id: "word-4", word: "DOFI" }
];

export const demoGameContent = {
  matching: {
    instructions: "Relaciona cada animal con su habitat.",
    settings: { timeLimitSeconds: 90, shuffle: true, instantFeedback: true },
    pairs: [
      {
        id: "pair-1",
        left: { type: "text", value: "Pez" },
        right: { type: "text", value: "Mar" }
      },
      {
        id: "pair-2",
        left: { type: "text", value: "Conejo" },
        right: { type: "text", value: "Bosque" }
      },
      {
        id: "pair-3",
        left: { type: "text", value: "Aguila" },
        right: { type: "text", value: "Cielo" }
      }
    ]
  },
  fill_blanks: {
    instructions: "Arrastra la palabra correcta a cada hueco.",
    settings: { timeLimitSeconds: 120, interaction: "drag" },
    text: "El {{blank:1}} vive en el mar y el {{blank:2}} camina por el desierto.",
    blanks: [
      { id: "blank-1", answer: "delfin", displayAnswer: "delfin" },
      { id: "blank-2", answer: "camello", displayAnswer: "camello" }
    ],
    wordBank: ["delfin", "camello", "aguila", "conejo"]
  },
  basic_typing: {
    instructions: "Escribe la respuesta correcta.",
    settings: {
      timeLimitSeconds: 60,
      caseSensitive: false,
      accentSensitive: false,
      trimWhitespace: true
    },
    prompts: [
      {
        id: "prompt-1",
        question: "Cuanto es 7 + 5?",
        acceptedAnswers: ["12", "doce"]
      },
      {
        id: "prompt-2",
        question: "Escribe en ingles: gato",
        acceptedAnswers: ["cat"]
      }
    ]
  },
  word_search: {
    instructions: "Troba les paraules amagades a la sopa de lletres.",
    settings: { timeLimitSeconds: 120 },
    grid: generateWordSearchGrid(demoWordSearchWords),
    words: demoWordSearchWords
  },
  letter_fill: {
    instructions: "Completa les lletres que falten o copia la paraula.",
    settings: { timeLimitSeconds: 90, accentSensitive: false },
    prompts: [
      { id: "letter-1", word: "CASA", pattern: "C_SA", acceptedAnswers: ["CASA"] },
      { id: "letter-2", word: "GAT", pattern: "G_T", acceptedAnswers: ["GAT"] },
      { id: "letter-3", word: "PEIX", pattern: "PEIX", mode: "copy", acceptedAnswers: ["PEIX"] }
    ]
  }
};

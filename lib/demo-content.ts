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
  }
};


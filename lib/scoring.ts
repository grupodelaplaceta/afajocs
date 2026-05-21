export type ScoreInput = {
  correctAnswers: number;
  wrongAnswers: number;
  totalItems: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
};

export function calculateScore(input: ScoreInput) {
  const baseScore = input.correctAnswers * 100;
  const penalty = input.wrongAnswers * 25;
  const speedBonus = Math.max(0, input.timeLimitSeconds - input.timeSpentSeconds) * 2;
  const accuracyBonus = input.correctAnswers === input.totalItems ? 300 : 0;
  const score = Math.max(0, baseScore - penalty + speedBonus + accuracyBonus);

  return {
    score,
    speedBonus,
    accuracyBonus
  };
}

export function normalizeAnswer(value: string, accentSensitive = false) {
  const trimmed = value.trim().toLowerCase();
  if (accentSensitive) {
    return trimmed;
  }
  return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type WordEntry = {
  id?: string;
  word: string;
};

const directions = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
] as const;

export function normalizeWordSearchWord(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-ZÑÇ]/g, "");
}

export function generateWordSearchGrid(words: WordEntry[], requestedSize?: number) {
  const cleanWords = words
    .map((entry) => ({ ...entry, word: normalizeWordSearchWord(String(entry.word || entry)) }))
    .filter((entry) => entry.word.length > 1)
    .sort((a, b) => b.word.length - a.word.length);

  const longest = cleanWords[0]?.word.length || 6;
  const baseSize = Math.max(requestedSize || 0, longest + 2, 8);
  const maxSize = Math.max(baseSize + 14, longest + cleanWords.length * 2, 12);

  for (let size = baseSize; size <= maxSize; size++) {
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
    const allPlaced = cleanWords.every((entry, wordIndex) => {
      const placed = placeWord(grid, entry.word, wordIndex);
      return placed || placeWord(grid, entry.word, wordIndex + 17, true);
    });

    if (allPlaced) {
      return fillGrid(grid);
    }
  }

  throw new Error("No s'ha pogut generar una sopa de lletres amb totes les paraules.");
}

export function ensureWordSearchGrid(words: WordEntry[], existingGrid?: string[], requestedSize?: number) {
  const cleanWords = words
    .map((entry, index) => ({
      id: entry.id || `word-${index + 1}`,
      word: normalizeWordSearchWord(String(entry.word || entry))
    }))
    .filter((entry) => entry.word.length > 1);
  const cleanGrid = normalizeGrid(existingGrid || []);

  if (cleanGrid.length && wordSearchGridContainsAll(cleanGrid, cleanWords)) {
    return cleanGrid;
  }

  return generateWordSearchGrid(cleanWords, requestedSize || cleanGrid.length || undefined);
}

export function wordSearchGridContainsAll(grid: string[], words: WordEntry[]) {
  return words.every((entry) => wordSearchGridContainsWord(grid, entry.word));
}

export function wordSearchGridContainsWord(grid: string[], word: string) {
  const cleanGrid = normalizeGrid(grid);
  const cleanWord = normalizeWordSearchWord(word);

  if (!cleanWord || !cleanGrid.length) {
    return false;
  }

  for (let row = 0; row < cleanGrid.length; row++) {
    for (let col = 0; col < cleanGrid[row].length; col++) {
      if (directions.some(([rowStep, colStep]) => hasWordAt(cleanGrid, cleanWord, row, col, rowStep, colStep))) {
        return true;
      }
    }
  }

  return false;
}

function fillGrid(grid: string[][]) {
  const size = grid.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) {
        grid[row][col] = alphabet[(row * 7 + col * 11) % alphabet.length];
      }
    }
  }

  return grid.map((row) => row.join(""));
}

function normalizeGrid(grid: string[]) {
  return grid.map((row) => String(row).replace(/\s+/g, "").toUpperCase()).filter(Boolean);
}

function hasWordAt(
  grid: string[],
  word: string,
  row: number,
  col: number,
  rowStep: number,
  colStep: number
) {
  const endRow = row + rowStep * (word.length - 1);
  const endCol = col + colStep * (word.length - 1);

  if (endRow < 0 || endRow >= grid.length || endCol < 0 || endCol >= grid[endRow].length) {
    return false;
  }

  for (let index = 0; index < word.length; index++) {
    const currentRow = row + rowStep * index;
    const currentCol = col + colStep * index;
    if (grid[currentRow]?.[currentCol] !== word[index]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid: string[][], word: string, seed: number, force = false) {
  const size = grid.length;
  const attempts = force ? size * size * directions.length : 80;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const [rowStep, colStep] = directions[(attempt + seed) % directions.length];
    const row = Math.abs(seed * 3 + attempt * 5) % size;
    const col = Math.abs(seed * 7 + attempt * 3) % size;

    if (canPlace(grid, word, row, col, rowStep, colStep)) {
      for (let index = 0; index < word.length; index++) {
        grid[row + rowStep * index][col + colStep * index] = word[index];
      }
      return true;
    }
  }

  return false;
}

function canPlace(grid: string[][], word: string, row: number, col: number, rowStep: number, colStep: number) {
  const size = grid.length;
  const endRow = row + rowStep * (word.length - 1);
  const endCol = col + colStep * (word.length - 1);

  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
    return false;
  }

  for (let index = 0; index < word.length; index++) {
    const current = grid[row + rowStep * index][col + colStep * index];
    if (current && current !== word[index]) {
      return false;
    }
  }

  return true;
}

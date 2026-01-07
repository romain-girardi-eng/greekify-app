import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a string for answer comparison
 * - lowercase
 * - remove accents
 * - trim whitespace
 * - remove punctuation
 */
function normalizeAnswer(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[.,;:!?'"()[\]{}]/g, '') // Remove punctuation
    .trim();
}

/**
 * Check if user answer matches expected answer
 * Supports comma-separated alternatives (e.g., "word, speech, message")
 */
export function checkAnswer(userAnswer: string, expectedAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);

  if (!normalizedUser) return false;

  // Split by comma to handle multiple valid answers
  const validAnswers = expectedAnswer.split(',').map(a => normalizeAnswer(a));

  // Check exact match against any valid answer
  if (validAnswers.some(valid => valid === normalizedUser)) {
    return true;
  }

  // Check if user answer is contained in any valid answer (for partial matches)
  if (validAnswers.some(valid => valid.includes(normalizedUser) && normalizedUser.length >= 3)) {
    return true;
  }

  return false;
}

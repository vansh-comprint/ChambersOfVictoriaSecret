/**
 * 🧩 Puzzle Engine — by Chotu 😈
 * 
 * Handles puzzle validation, hints, and progression.
 * Puzzles are defined in JSON and loaded at runtime.
 */

class PuzzleEngine {
  constructor() {
    this.puzzles = new Map();
    this.solvedPuzzles = new Set();
    this.hintCount = new Map(); // Track hints used per puzzle
  }

  /**
   * Register a puzzle
   * @param {Object} puzzle - Puzzle definition
   */
  register(puzzle) {
    if (!puzzle.id || !puzzle.type || !puzzle.solution) {
      throw new Error(`Invalid puzzle: missing required fields`);
    }
    this.puzzles.set(puzzle.id, {
      ...puzzle,
      attempts: 0,
    });
    this.hintCount.set(puzzle.id, 0);
  }

  /**
   * Attempt to solve a puzzle
   * @param {string} puzzleId 
   * @param {string} answer - Player's answer
   * @returns {Object} result
   */
  attempt(puzzleId, answer) {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle) return { success: false, message: 'Puzzle not found.' };
    if (this.solvedPuzzles.has(puzzleId)) return { success: true, message: 'Already solved!' };

    puzzle.attempts++;

    const isCorrect = this.validate(puzzle, answer);

    if (isCorrect) {
      this.solvedPuzzles.add(puzzleId);
      return {
        success: true,
        message: puzzle.successMessage || 'Correct! 🎉',
        reward: puzzle.reward || null,
        attempts: puzzle.attempts,
      };
    }

    // Give contextual failure messages based on attempt count
    const failMessage = this.getFailMessage(puzzle);
    return {
      success: false,
      message: failMessage,
      attempts: puzzle.attempts,
      hintsAvailable: puzzle.hints ? puzzle.hints.length - this.hintCount.get(puzzleId) : 0,
    };
  }

  /**
   * Validate answer based on puzzle type
   */
  validate(puzzle, answer) {
    const normalized = answer.trim().toLowerCase();
    
    switch (puzzle.type) {
      case 'riddle':
        // Accept any of the valid answers
        return puzzle.solution.some(s => normalized === s.toLowerCase());
      
      case 'cipher':
        return normalized === puzzle.solution.toLowerCase();
      
      case 'logic':
        // Logic puzzles might accept structured answers
        return normalized === puzzle.solution.toLowerCase();
      
      case 'sequence':
        return normalized === puzzle.solution.toLowerCase();
      
      case 'observation':
        // Partial matching for observation puzzles
        return puzzle.solution.some(s => normalized.includes(s.toLowerCase()));
      
      default:
        return normalized === String(puzzle.solution).toLowerCase();
    }
  }

  /**
   * Get a hint for a puzzle
   */
  getHint(puzzleId) {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle || !puzzle.hints) return { hint: 'No hints available.' };

    const hintIndex = this.hintCount.get(puzzleId);
    if (hintIndex >= puzzle.hints.length) {
      return { hint: 'No more hints. You\'re on your own, detective. 🕵️', final: true };
    }

    this.hintCount.set(puzzleId, hintIndex + 1);
    return {
      hint: puzzle.hints[hintIndex],
      remaining: puzzle.hints.length - hintIndex - 1,
    };
  }

  /**
   * Get failure message based on attempts
   */
  getFailMessage(puzzle) {
    if (puzzle.attempts === 1) return puzzle.failMessages?.[0] || 'Not quite. Try again.';
    if (puzzle.attempts === 2) return puzzle.failMessages?.[1] || 'Still wrong. Maybe try a hint?';
    if (puzzle.attempts === 3) return puzzle.failMessages?.[2] || 'Third time... not the charm. Think differently.';
    return 'Keep trying. Or ask for a hint — no shame in it. 🤔';
  }

  /**
   * Get puzzle progress
   */
  getProgress() {
    return {
      total: this.puzzles.size,
      solved: this.solvedPuzzles.size,
      remaining: this.puzzles.size - this.solvedPuzzles.size,
      puzzles: Array.from(this.puzzles.entries()).map(([id, p]) => ({
        id,
        type: p.type,
        solved: this.solvedPuzzles.has(id),
        attempts: p.attempts,
        hintsUsed: this.hintCount.get(id),
      })),
    };
  }
}

module.exports = { PuzzleEngine };

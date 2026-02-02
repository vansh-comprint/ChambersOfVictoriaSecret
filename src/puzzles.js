/**
 * 🧩 In-Game Puzzles — by Chotu 😈
 * 
 * Quick puzzles that appear in puzzle chambers.
 * Solve them for rewards, fail them for... consequences.
 */

const PUZZLE_POOL = [
  {
    id: 'riddle-1',
    type: 'riddle',
    question: 'I have keys but no locks. I have space but no room. You can enter but can\'t go inside. What am I?',
    answer: 'keyboard',
    hints: ['Think about what you\'re using right now.', 'It has keys, but not for doors.'],
    reward: { type: 'gold', amount: 30 },
    penalty: { type: 'damage', amount: 5 },
  },
  {
    id: 'riddle-2',
    type: 'riddle',
    question: 'The more you take, the more you leave behind. What am I?',
    answer: 'footsteps',
    hints: ['Think about walking.', 'You leave them on the ground.'],
    reward: { type: 'item', item: 'health_potion' },
    penalty: { type: 'damage', amount: 5 },
  },
  {
    id: 'math-1',
    type: 'math',
    question: 'A chamber has 4 walls. Each wall has 3 torches. Each torch burns for 2 hours. How many total torch-hours light this room?',
    answer: '24',
    hints: ['Multiply step by step.', '4 × 3 × 2'],
    reward: { type: 'gold', amount: 25 },
    penalty: { type: 'gold_loss', amount: 10 },
  },
  {
    id: 'sequence-1',
    type: 'sequence',
    question: 'What comes next? 🏰 💎 🏰 💎 💎 🏰 💎 💎 💎 🏰 ...',
    answer: '💎💎💎💎',
    acceptAlso: ['4 diamonds', '4', 'four diamonds'],
    hints: ['Count the 💎 between each 🏰.', 'The pattern: 1, 2, 3, ...'],
    reward: { type: 'item', item: 'compass' },
    penalty: { type: 'damage', amount: 10 },
  },
  {
    id: 'cipher-1',
    type: 'cipher',
    question: 'Decode this message: YLFWRULD -> ???\n(Hint: Caesar cipher, shift 3 backwards)',
    answer: 'victoria',
    hints: ['Each letter shifts back by 3.', 'Y→V, L→I, F→C...'],
    reward: { type: 'item', item: 'vision_scroll' },
    penalty: { type: 'damage', amount: 5 },
  },
  {
    id: 'logic-1',
    type: 'logic',
    question: 'Three chests: Gold, Silver, Bronze. One has treasure, one has a trap, one is empty.\n- The Gold chest says: "The trap is in Silver."\n- The Silver chest says: "I am empty."\n- The Bronze chest says: "The treasure is in Gold."\nExactly ONE chest tells the truth. Which chest has the treasure?',
    answer: 'silver',
    hints: ['If Gold is telling the truth, what follows?', 'Try assuming each one is the truth-teller.'],
    reward: { type: 'item', item: 'shield' },
    penalty: { type: 'damage', amount: 15 },
  },
  {
    id: 'riddle-3',
    type: 'riddle',
    question: 'I am not alive, but I grow. I don\'t have lungs, but I need air. I don\'t have a mouth, but water kills me. What am I?',
    answer: 'fire',
    hints: ['It\'s an element.', 'It\'s hot.'],
    reward: { type: 'gold', amount: 20 },
    penalty: { type: 'damage', amount: 5 },
  },
  {
    id: 'pattern-1',
    type: 'pattern',
    question: 'Complete the pattern:\n🔴⚪🔴🔴⚪🔴🔴🔴⚪...\nWhat are the next 4 symbols?',
    answer: '🔴🔴🔴🔴',
    acceptAlso: ['4 red', 'rrrr', 'four red'],
    hints: ['Count the reds between each white.', '1, 2, 3, ...'],
    reward: { type: 'item', item: 'trap_kit' },
    penalty: { type: 'gold_loss', amount: 15 },
  },
];

class PuzzleManager {
  constructor() {
    this.usedPuzzles = new Set();
  }

  /**
   * Get a random unused puzzle
   * @returns {Object} puzzle
   */
  getRandomPuzzle() {
    const available = PUZZLE_POOL.filter(p => !this.usedPuzzles.has(p.id));
    if (available.length === 0) {
      // Reset if all used
      this.usedPuzzles.clear();
      return PUZZLE_POOL[Math.floor(Math.random() * PUZZLE_POOL.length)];
    }
    const puzzle = available[Math.floor(Math.random() * available.length)];
    this.usedPuzzles.add(puzzle.id);
    return { ...puzzle };
  }

  /**
   * Check answer
   * @param {Object} puzzle 
   * @param {string} answer 
   * @returns {Object} result
   */
  checkAnswer(puzzle, answer) {
    const normalized = answer.trim().toLowerCase();
    const correct = normalized === puzzle.answer.toLowerCase() ||
      (puzzle.acceptAlso && puzzle.acceptAlso.some(a => normalized === a.toLowerCase()));

    if (correct) {
      return {
        correct: true,
        message: '✅ Correct!',
        reward: puzzle.reward,
      };
    }

    return {
      correct: false,
      message: '❌ Wrong answer!',
      penalty: puzzle.penalty,
    };
  }

  /**
   * Get hint for a puzzle
   */
  getHint(puzzle, hintIndex) {
    if (!puzzle.hints || hintIndex >= puzzle.hints.length) {
      return 'No more hints available.';
    }
    return puzzle.hints[hintIndex];
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') {
  module.exports = { PuzzleManager, PUZZLE_POOL };
}

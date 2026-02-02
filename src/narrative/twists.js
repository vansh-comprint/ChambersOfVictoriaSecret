/**
 * 🌀 Plot Twist Engine — by Chotu 😈
 * 
 * The chaos module. Takes a story state and injects
 * unexpected narrative pivots. Every twist must:
 * 1. Connect to at least one existing story element
 * 2. End on a hook for the player
 * 3. Be internally consistent (chaos != random)
 */

const TWIST_TYPES = {
  UNRELIABLE_NARRATOR: 'unreliable_narrator',   // What you were told was a lie
  HIDDEN_CONNECTION: 'hidden_connection',         // Two clues are secretly linked
  ROLE_REVERSAL: 'role_reversal',                // Victim is actually the villain
  TIME_SHIFT: 'time_shift',                      // Events aren't in the order you think
  FALSE_EVIDENCE: 'false_evidence',              // A clue was planted
  SELF_AWARE: 'self_aware',                      // The game/AI knows it's being played
};

const DIFFICULTY = {
  MILD: 'mild',         // Subtle misdirection
  SPICY: 'spicy',       // Changes your theory
  UNHINGED: 'unhinged', // Changes the entire genre
};

class TwistEngine {
  constructor() {
    this.usedTwists = [];
    this.difficulty = DIFFICULTY.SPICY;
  }

  /**
   * Evaluate the current game state and decide if a twist should fire
   * @param {Object} gameState - Current game state
   * @returns {Object|null} - Twist event or null
   */
  shouldTwist(gameState) {
    const { cluesFound, chambersVisited, suspectsTalkedTo } = gameState;
    
    // Don't twist too early — let players build a theory first
    if (cluesFound < 3) return null;
    
    // Don't twist too often
    if (this.usedTwists.length > 0) {
      const lastTwist = this.usedTwists[this.usedTwists.length - 1];
      if (cluesFound - lastTwist.atClueCount < 2) return null;
    }

    // Pick a twist type based on game state
    return this.generateTwist(gameState);
  }

  /**
   * Generate a twist based on current state
   * @param {Object} gameState 
   * @returns {Object} twist event
   */
  generateTwist(gameState) {
    const availableTwists = this.getAvailableTwists(gameState);
    if (availableTwists.length === 0) return null;

    const twist = availableTwists[Math.floor(Math.random() * availableTwists.length)];
    
    const event = {
      type: twist.type,
      difficulty: this.difficulty,
      description: twist.description,
      effect: twist.effect,
      atClueCount: gameState.cluesFound,
      timestamp: Date.now(),
    };

    this.usedTwists.push(event);
    return event;
  }

  /**
   * Get twists that make sense given current game state
   */
  getAvailableTwists(gameState) {
    const twists = [];
    const usedTypes = this.usedTwists.map(t => t.type);

    // Unreliable narrator — if player has talked to suspects
    if (gameState.suspectsTalkedTo > 0 && !usedTypes.includes(TWIST_TYPES.UNRELIABLE_NARRATOR)) {
      twists.push({
        type: TWIST_TYPES.UNRELIABLE_NARRATOR,
        description: 'A witness\'s earlier statement contradicts new evidence.',
        effect: { action: 'invalidate_testimony', target: 'random_suspect' },
      });
    }

    // Hidden connection — if player has 4+ clues
    if (gameState.cluesFound >= 4 && !usedTypes.includes(TWIST_TYPES.HIDDEN_CONNECTION)) {
      twists.push({
        type: TWIST_TYPES.HIDDEN_CONNECTION,
        description: 'Two seemingly unrelated clues form a pattern.',
        effect: { action: 'link_clues', target: 'random_pair' },
      });
    }

    // Role reversal — late game twist
    if (gameState.cluesFound >= 6 && !usedTypes.includes(TWIST_TYPES.ROLE_REVERSAL)) {
      twists.push({
        type: TWIST_TYPES.ROLE_REVERSAL,
        description: 'Everything you assumed about a character was wrong.',
        effect: { action: 'swap_role', target: 'key_suspect' },
      });
    }

    // False evidence — mid game
    if (gameState.cluesFound >= 3 && !usedTypes.includes(TWIST_TYPES.FALSE_EVIDENCE)) {
      twists.push({
        type: TWIST_TYPES.FALSE_EVIDENCE,
        description: 'One of the clues was deliberately planted.',
        effect: { action: 'mark_false', target: 'random_clue' },
      });
    }

    return twists;
  }

  setDifficulty(level) {
    if (Object.values(DIFFICULTY).includes(level)) {
      this.difficulty = level;
    }
  }

  getUsedTwists() {
    return [...this.usedTwists];
  }
}

module.exports = { TwistEngine, TWIST_TYPES, DIFFICULTY };

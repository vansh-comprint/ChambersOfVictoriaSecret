/**
 * 🤖 Bot AI System — by Chotu 😈
 * 
 * 4 distinct strategies: aggressive, cautious, explorer, balanced.
 */

const BOT_STRATEGIES = {
  /**
   * AGGRESSIVE — Charges toward other players and the goal.
   * Prioritizes PvP, ignores traps, low self-preservation.
   */
  aggressive: {
    name: 'Aggressive',
    icon: '🔥',
    evaluate(player, moves, gameState) {
      let bestMove = null;
      let bestScore = -Infinity;

      for (const move of moves) {
        if (move.blocked && !player.hasKey(move.chamber.requiredKey)) continue;
        let score = 0;

        // Chase other players for PvP
        for (const other of gameState.players) {
          if (other.id === player.id || !other.alive) continue;
          const distBefore = Math.abs(player.x - other.x) + Math.abs(player.y - other.y);
          const distAfter = Math.abs(move.x - other.x) + Math.abs(move.y - other.y);
          if (distAfter < distBefore) score += 30;
          if (distAfter === 0) score += 50; // On same tile = fight!
        }

        // Move toward secret chamber
        const secret = gameState.map.secretChamber;
        const distToSecret = Math.abs(move.x - secret.x) + Math.abs(move.y - secret.y);
        score += (16 - distToSecret) * 3;

        // Treasure is good
        if (move.chamber.type === 'treasure') score += 15;
        // Don't care about traps much
        if (move.chamber.type === 'trap') score -= 5;

        // Slight randomness
        score += Math.random() * 10;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  },

  /**
   * CAUTIOUS — Avoids danger, heals, collects items safely.
   */
  cautious: {
    name: 'Cautious',
    icon: '🛡️',
    evaluate(player, moves, gameState) {
      let bestMove = null;
      let bestScore = -Infinity;

      for (const move of moves) {
        if (move.blocked && !player.hasKey(move.chamber.requiredKey)) continue;
        let score = 0;

        // Avoid traps heavily
        if (move.chamber.type === 'trap') score -= 40;

        // Avoid other players
        for (const other of gameState.players) {
          if (other.id === player.id || !other.alive) continue;
          const distAfter = Math.abs(move.x - other.x) + Math.abs(move.y - other.y);
          if (distAfter <= 1) score -= 25;
        }

        // Love treasure
        if (move.chamber.type === 'treasure') score += 30;
        // Love NPCs (might get items)
        if (move.chamber.type === 'npc') score += 20;

        // Still move toward goal, but carefully
        const secret = gameState.map.secretChamber;
        const distToSecret = Math.abs(move.x - secret.x) + Math.abs(move.y - secret.y);
        score += (16 - distToSecret) * 2;

        // Prefer explored tiles (safer)
        if (move.chamber.explored && move.chamber.explored[player.id]) score += 5;

        // Use health potion if low
        if (player.health < 40 && player.inventory.has('health_potion')) {
          player.useItem('health_potion', gameState);
        }

        score += Math.random() * 8;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  },

  /**
   * EXPLORER — Maximizes map coverage, reveals fog.
   */
  explorer: {
    name: 'Explorer',
    icon: '🧭',
    evaluate(player, moves, gameState) {
      let bestMove = null;
      let bestScore = -Infinity;

      for (const move of moves) {
        if (move.blocked && !player.hasKey(move.chamber.requiredKey)) continue;
        let score = 0;

        // Strongly prefer unexplored tiles
        if (!move.chamber.explored || !move.chamber.explored[player.id]) {
          score += 50;
        }

        // Puzzle rooms are interesting
        if (move.chamber.type === 'puzzle') score += 25;
        if (move.chamber.type === 'treasure') score += 20;
        if (move.chamber.type === 'npc') score += 15;

        // Still want to reach goal eventually
        const secret = gameState.map.secretChamber;
        const distToSecret = Math.abs(move.x - secret.x) + Math.abs(move.y - secret.y);
        score += (16 - distToSecret) * 1;

        // Avoid traps somewhat
        if (move.chamber.type === 'trap') score -= 15;

        // Use compass/vision scroll if available
        if (player.inventory.has('compass')) {
          player.useItem('compass', gameState);
        }
        if (player.inventory.has('vision_scroll')) {
          player.useItem('vision_scroll', gameState);
        }

        score += Math.random() * 12;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  },

  /**
   * BALANCED — Adaptive, switches between aggression and caution.
   */
  balanced: {
    name: 'Balanced',
    icon: '⚖️',
    evaluate(player, moves, gameState) {
      let bestMove = null;
      let bestScore = -Infinity;

      // Adapt based on health
      const healthFactor = player.health / player.maxHealth;

      for (const move of moves) {
        if (move.blocked && !player.hasKey(move.chamber.requiredKey)) continue;
        let score = 0;

        // Goal seeking — primary objective
        const secret = gameState.map.secretChamber;
        const distToSecret = Math.abs(move.x - secret.x) + Math.abs(move.y - secret.y);
        score += (16 - distToSecret) * 4;

        // Treasure always good
        if (move.chamber.type === 'treasure') score += 25;

        // Traps — avoid more when low health
        if (move.chamber.type === 'trap') {
          score -= healthFactor > 0.5 ? 10 : 35;
        }

        // PvP — fight when healthy, flee when hurt
        for (const other of gameState.players) {
          if (other.id === player.id || !other.alive) continue;
          const distAfter = Math.abs(move.x - other.x) + Math.abs(move.y - other.y);
          if (distAfter <= 1) {
            score += healthFactor > 0.6 ? 15 : -20;
          }
        }

        // Explore when it's on the way
        if (!move.chamber.explored || !move.chamber.explored[player.id]) {
          score += 10;
        }

        // Heal when needed
        if (player.health < 50 && player.inventory.has('health_potion')) {
          player.useItem('health_potion', gameState);
        }

        score += Math.random() * 10;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  }
};

class BotAI {
  /**
   * Decide the best move for a bot player
   */
  static decide(player, gameState) {
    const strategy = BOT_STRATEGIES[player.strategy] || BOT_STRATEGIES.balanced;
    const moves = gameState.map.getValidMoves(player.x, player.y);

    if (moves.length === 0) return null;

    const chosen = strategy.evaluate(player, moves, gameState);
    return chosen || moves[Math.floor(Math.random() * moves.length)];
  }

  /**
   * Auto-solve puzzles for bots (with chance of failure)
   */
  static solvePuzzle(player, puzzle) {
    // Smarter strategies solve better
    const solveChance = {
      aggressive: 0.3,
      cautious: 0.5,
      explorer: 0.7,
      balanced: 0.5,
    };
    const chance = solveChance[player.strategy] || 0.4;
    return Math.random() < chance;
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { BotAI, BOT_STRATEGIES };

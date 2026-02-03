/**
 * 🔄 Turn System — by Chotu 😈
 * 
 * Track current player, advance turns, handle bot auto-play.
 */

class TurnManager {
  constructor() {
    this.players = [];
    this.currentIndex = 0;
    this.turnNumber = 1;
    this.phase = 'waiting'; // waiting, playerTurn, botThinking, animating
    this.botDelay = 600; // ms delay for bot "thinking"
    this.botTimer = null;
    this.onTurnStart = null;
    this.onTurnEnd = null;
    this.onBotMove = null;
  }

  /**
   * Initialize with players
   */
  init(players) {
    this.players = players;
    this.currentIndex = 0;
    this.turnNumber = 1;
    this.phase = 'playerTurn';
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    return this.players[this.currentIndex] || null;
  }

  /**
   * Advance to next alive player
   */
  nextTurn() {
    if (this.onTurnEnd) this.onTurnEnd(this.getCurrentPlayer());

    // Find next alive player
    let attempts = 0;
    do {
      this.currentIndex = (this.currentIndex + 1) % this.players.length;
      attempts++;
      if (this.currentIndex === 0) this.turnNumber++;
    } while (!this.players[this.currentIndex].alive && attempts < this.players.length);

    // All dead check
    const alivePlayers = this.players.filter(p => p.alive);
    if (alivePlayers.length === 0) {
      this.phase = 'gameover';
      return null;
    }

    const current = this.getCurrentPlayer();
    this.phase = 'playerTurn';

    if (this.onTurnStart) this.onTurnStart(current);

    // If bot, trigger auto-play after delay
    if (current.isBot && current.alive) {
      this.phase = 'botThinking';
      this.botTimer = setTimeout(() => {
        if (this.onBotMove) this.onBotMove(current);
        this.phase = 'playerTurn';
      }, this.botDelay);
    }

    return current;
  }

  /**
   * Check if it's a human player's turn
   */
  isHumanTurn() {
    const current = this.getCurrentPlayer();
    return current && !current.isBot && current.alive && this.phase === 'playerTurn';
  }

  /**
   * Check if the turn system is waiting for player input
   */
  isWaitingForInput() {
    return this.phase === 'playerTurn' && this.isHumanTurn();
  }

  /**
   * Get turn info for UI display
   */
  getInfo() {
    return {
      turnNumber: this.turnNumber,
      currentPlayer: this.getCurrentPlayer(),
      phase: this.phase,
      playersAlive: this.players.filter(p => p.alive).length,
      totalPlayers: this.players.length,
    };
  }

  /**
   * Pause bot turns (for puzzles, etc.)
   */
  pause() {
    this.phase = 'waiting';
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  /**
   * Resume turns
   */
  resume() {
    this.phase = 'playerTurn';
    const current = this.getCurrentPlayer();
    if (current && current.isBot && current.alive) {
      this.phase = 'botThinking';
      this.botTimer = setTimeout(() => {
        if (this.onBotMove) this.onBotMove(current);
        this.phase = 'playerTurn';
      }, this.botDelay);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { TurnManager };

/**
 * 🎮 Game Controller — by Chotu 😈
 * 
 * Main game engine: init, coordinate modules, game loop.
 */

class Game {
  constructor() {
    this.map = null;
    this.players = [];
    this.renderer = null;
    this.ui = null;
    this.turnManager = null;
    this.combatSystem = null;
    this.puzzleManager = null;
    this.phase = 'setup'; // setup, playing, puzzle, gameover
    this.currentPlayer = null;
    this.lastTime = 0;
    this.animFrameId = null;

    // Config
    this.humanPlayerIndex = 0; // Player 0 is human
    this.playerCount = 4;
  }

  /**
   * Initialize the game
   */
  init() {
    // Create canvas
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('No #game-canvas found!');
      return;
    }

    // Initialize systems
    this.renderer = new Renderer(canvas);
    this.ui = new GameUI();
    this.turnManager = new TurnManager();
    this.combatSystem = new CombatSystem();
    this.puzzleManager = new PuzzleManager();

    // Generate map
    this.map = new GameMap(8, 8);
    this.map.generate(this.playerCount);

    // Create players
    this.createPlayers();

    // Setup turn manager
    this.turnManager.init(this.players);
    this.turnManager.onTurnStart = (player) => this.onTurnStart(player);
    this.turnManager.onTurnEnd = (player) => this.onTurnEnd(player);
    this.turnManager.onBotMove = (bot) => this.executeBotTurn(bot);

    // Setup click handler
    canvas.addEventListener('click', (e) => this.handleClick(e));

    // Setup inventory click handler
    const invList = document.getElementById('inventory-list');
    if (invList) {
      invList.addEventListener('click', (e) => {
        const item = e.target.closest('.inv-item.usable');
        if (item && item.dataset.itemType) {
          this.useItem(item.dataset.itemType);
        }
      });
    }

    // Setup hint button
    const hintBtn = document.getElementById('puzzle-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.ui.showHint());
    }

    // Setup restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }

    // Start game
    this.phase = 'playing';
    this.currentPlayer = this.players[0];

    // Reveal starting areas
    for (const player of this.players) {
      this.map.reveal(player.id, player.x, player.y, 1);
    }

    // Focus camera on human player
    this.renderer.focusOn(this.players[this.humanPlayerIndex].x, this.players[this.humanPlayerIndex].y);

    // Initial UI updates
    this.updateUI();
    this.ui.log('🏰 Welcome to the Chambers of Victoria\'s Secret!', 'system');
    this.ui.log('🎯 Race to the ⭐ Secret Chamber in the center to win!', 'system');
    this.ui.log(`👤 You are ${this.players[this.humanPlayerIndex].name}. Click adjacent tiles to move.`, 'system');

    // Start first turn
    this.onTurnStart(this.currentPlayer);

    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Create players
   */
  createPlayers() {
    const strategies = ['aggressive', 'cautious', 'explorer', 'balanced'];

    for (let i = 0; i < this.playerCount; i++) {
      const isBot = i !== this.humanPlayerIndex;
      const spawn = this.map.playerSpawns[i];
      const player = new Player(
        i,
        isBot ? PLAYER_NAMES[i] : 'You',
        PLAYER_COLORS[i],
        isBot,
        isBot ? strategies[i] : null
      );
      player.spawn(spawn.x, spawn.y);
      this.players.push(player);
    }
  }

  /**
   * Main game loop
   */
  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // Update animations
    for (const player of this.players) {
      player.updateAnimation(dt);
    }

    // Render
    this.renderer.render(this.getState(), dt);

    // Draw minimap
    this.ui.drawMinimap(this.map, this.players, this.players[this.humanPlayerIndex].id);

    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Handle canvas click (human movement)
   */
  handleClick(e) {
    if (this.phase !== 'playing') return;
    if (!this.turnManager.isHumanTurn()) return;

    const player = this.turnManager.getCurrentPlayer();
    if (player.isBot) return;

    const gridPos = this.renderer.getGridPos(e.clientX, e.clientY);
    const validMoves = this.map.getValidMoves(player.x, player.y);

    const move = validMoves.find(m => m.x === gridPos.x && m.y === gridPos.y);
    if (!move) return;

    // Check if blocked (locked door)
    if (move.blocked) {
      if (player.hasKey(move.chamber.requiredKey)) {
        player.inventory.remove('key');
        move.chamber.requiredKey = null;
        move.chamber.type = 'empty';
        this.ui.log('🔑 Used key to unlock the chamber!', 'success');
      } else {
        this.ui.log('🔒 This chamber is locked. You need a key!', 'warning');
        return;
      }
    }

    this.executeMove(player, move);
  }

  /**
   * Execute a move for any player
   */
  executeMove(player, move) {
    player.moveTo(move.x, move.y);
    player.chambersExplored++;

    // Reveal fog of war
    this.map.reveal(player.id, move.x, move.y, 1);

    // Focus camera on current player
    this.renderer.focusOn(player.x, player.y);

    // Process chamber effects
    this.processChamberEntry(player, move.chamber);

    // Check for PvP
    const pvpResults = this.combatSystem.checkPvPOnTile(player, this.players);
    for (const r of pvpResults) {
      this.ui.log(`⚔️ ${r.message}`, 'combat');
      this.renderer.shake(6);
      this.renderer.addParticle(player.x, player.y, '#ff4444', 8);
    }

    // Check player traps
    const trapResult = this.combatSystem.checkPlayerTraps(move.chamber, player);
    if (trapResult.triggered) {
      this.ui.log(`⚙️ ${trapResult.message}`, 'danger');
      this.renderer.shake(4);
      this.renderer.addParticle(player.x, player.y, '#ff8800', 6);
    }

    // Check win condition
    if (move.chamber.type === 'secret') {
      this.handleWin(player);
      return;
    }

    // Check death
    if (!player.alive) {
      this.ui.log(`💀 ${player.name} has fallen!`, 'danger');
      this.renderer.addParticle(player.x, player.y, '#ff0000', 20);
    }

    // Update UI
    this.updateUI();

    // Next turn
    if (this.phase === 'playing') {
      this.turnManager.nextTurn();
    }
  }

  /**
   * Process entering a chamber
   */
  processChamberEntry(player, chamber) {
    switch (chamber.type) {
      case 'treasure': {
        const effect = triggerChamberEffect(chamber, player);
        if (effect) {
          this.ui.log(`💎 ${player.name}: ${effect.message}`, 'success');
          this.renderer.addParticle(player.x, player.y, '#ffd700', 12);
          player.score += effect.gold || 0;
        }
        // Pick up item if present
        if (chamber.item) {
          const result = player.inventory.add(chamber.item);
          if (result.success) {
            this.ui.log(`🎒 ${player.name}: ${result.message}`, 'success');
            chamber.item = null;
          }
        }
        // Change to empty after looting
        chamber.type = 'empty';
        break;
      }

      case 'trap': {
        const effect = triggerChamberEffect(chamber, player);
        if (effect) {
          this.ui.log(`💀 ${player.name}: ${effect.message}`, 'danger');
          this.renderer.shake(5);
          this.renderer.addParticle(player.x, player.y, '#ff4444', 10);
        }
        chamber.type = 'empty'; // trap disarmed
        break;
      }

      case 'puzzle': {
        if (player.isBot) {
          this.handleBotPuzzle(player, chamber);
        } else {
          this.handleHumanPuzzle(player, chamber);
          return; // Don't advance turn yet — wait for puzzle answer
        }
        break;
      }

      case 'npc': {
        const effect = triggerChamberEffect(chamber, player);
        if (effect) {
          this.ui.log(`🗣️ ${player.name}: ${effect.message}`, 'npc');
          if (effect.item) {
            player.inventory.add(effect.item);
            this.ui.log(`🎁 ${player.name} received ${effect.item.name}!`, 'success');
          }
        }
        chamber.type = 'empty'; // NPC leaves
        break;
      }

      case 'locked': {
        // Already handled in click handler
        break;
      }
    }
  }

  /**
   * Handle puzzle for human player
   */
  handleHumanPuzzle(player, chamber) {
    const puzzle = this.puzzleManager.getRandomPuzzle();
    this.turnManager.pause();
    this.phase = 'puzzle';

    this.ui.showPuzzle(puzzle, (answer) => {
      const result = this.puzzleManager.checkAnswer(puzzle, answer);
      if (result.correct) {
        this.ui.log(`🧩 ${result.message} ${this.getRewardText(result.reward)}`, 'success');
        this.applyReward(player, result.reward);
        player.puzzlesSolved++;
        this.renderer.addParticle(player.x, player.y, '#44ff44', 15);
      } else {
        this.ui.log(`🧩 ${result.message}`, 'danger');
        this.applyPenalty(player, result.penalty);
        this.renderer.shake(3);
      }
      chamber.type = 'empty';
      this.phase = 'playing';
      this.updateUI();
      this.turnManager.resume();
      this.turnManager.nextTurn();
    });
  }

  /**
   * Handle puzzle for bot player
   */
  handleBotPuzzle(player, chamber) {
    const puzzle = this.puzzleManager.getRandomPuzzle();
    const solved = BotAI.solvePuzzle(player, puzzle);

    if (solved) {
      this.ui.log(`🧩 ${player.name} solved a puzzle! ${this.getRewardText(puzzle.reward)}`, 'success');
      this.applyReward(player, puzzle.reward);
      player.puzzlesSolved++;
    } else {
      this.ui.log(`🧩 ${player.name} failed a puzzle!`, 'warning');
      this.applyPenalty(player, puzzle.penalty);
    }
    chamber.type = 'empty';
  }

  /**
   * Apply puzzle reward
   */
  applyReward(player, reward) {
    if (!reward) return;
    switch (reward.type) {
      case 'gold':
        player.addGold(reward.amount);
        break;
      case 'item':
        const itemDef = ITEM_TYPES[reward.item];
        if (itemDef) {
          player.inventory.add({ type: reward.item, ...itemDef });
        }
        break;
    }
  }

  /**
   * Apply puzzle penalty
   */
  applyPenalty(player, penalty) {
    if (!penalty) return;
    switch (penalty.type) {
      case 'damage':
        player.takeDamage(penalty.amount);
        break;
      case 'gold_loss':
        player.removeGold(penalty.amount);
        break;
    }
  }

  /**
   * Get reward description text
   */
  getRewardText(reward) {
    if (!reward) return '';
    switch (reward.type) {
      case 'gold': return `(+${reward.amount} gold)`;
      case 'item': return `(Received ${ITEM_TYPES[reward.item]?.name || reward.item})`;
      default: return '';
    }
  }

  /**
   * Execute bot turn
   */
  executeBotTurn(bot) {
    if (this.phase !== 'playing' || !bot.alive) return;

    const move = BotAI.decide(bot, this.getState());
    if (!move) {
      this.turnManager.nextTurn();
      return;
    }

    // Handle locked doors for bots
    if (move.blocked) {
      if (bot.hasKey(move.chamber.requiredKey)) {
        bot.inventory.remove('key');
        move.chamber.requiredKey = null;
        move.chamber.type = 'empty';
        this.ui.log(`🔑 ${bot.name} unlocked a chamber!`, 'info');
      } else {
        // Pick a different move
        const altMoves = this.map.getValidMoves(bot.x, bot.y).filter(m => !m.blocked);
        const altMove = altMoves.length > 0 ? altMoves[Math.floor(Math.random() * altMoves.length)] : null;
        if (altMove) {
          this.executeMove(bot, altMove);
        } else {
          this.turnManager.nextTurn();
        }
        return;
      }
    }

    this.executeMove(bot, move);
  }

  /**
   * Handle win condition
   */
  handleWin(player) {
    this.phase = 'gameover';
    this.turnManager.pause();
    this.renderer.addParticle(player.x, player.y, '#ffd700', 30);
    this.renderer.shake(10);

    this.ui.log(`🏆 ${player.name} reached Victoria's Secret Chamber and WINS!`, 'system');
    player.score += 100;

    setTimeout(() => {
      this.ui.showGameOver(player, this.players);
    }, 1000);
  }

  /**
   * Use an item (from inventory click)
   */
  useItem(itemType) {
    if (this.phase !== 'playing') return;
    if (!this.turnManager.isHumanTurn()) return;

    const player = this.turnManager.getCurrentPlayer();
    const result = player.useItem(itemType, this.getState());
    if (result.success) {
      this.ui.log(`🎒 ${result.message}`, 'success');
    } else {
      this.ui.log(`❌ ${result.message}`, 'warning');
    }
    this.updateUI();
  }

  /**
   * On turn start callback
   */
  onTurnStart(player) {
    this.currentPlayer = player;
    if (!player.isBot) {
      this.renderer.focusOn(player.x, player.y);
    }
    this.updateUI();
  }

  /**
   * On turn end callback
   */
  onTurnEnd(player) {
    // Nothing special yet
  }

  /**
   * Update all UI elements
   */
  updateUI() {
    const current = this.turnManager.getCurrentPlayer();
    // Always show human player's stats
    const human = this.players[this.humanPlayerIndex];
    this.ui.updatePlayerInfo(human);
    this.ui.updateInventory(human);
    this.ui.updateTurnInfo(this.turnManager.getInfo());
    this.ui.updatePlayerIndicators(this.players, current?.id);

    const chamber = this.map.getChamber(human.x, human.y);
    this.ui.updateChamberInfo(chamber);
  }

  /**
   * Get current game state (for AI, items, etc.)
   */
  getState() {
    return {
      map: this.map,
      players: this.players,
      currentPlayer: this.currentPlayer,
      secretChamber: this.map.secretChamber,
      turnNumber: this.turnManager.turnNumber,
      phase: this.phase,
    };
  }

  /**
   * Restart the game
   */
  restart() {
    this.ui.hideGameOver();
    this.turnManager.destroy();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.players = [];
    this.phase = 'setup';
    this.ui.logMessages = [];
    this.combatSystem.clearLog();

    this.init();
  }
}

// Boot the game when page loads
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.init();
});

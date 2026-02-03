/**
 * 🖥️ UI System — by Chotu 😈
 * 
 * HUD: player info, inventory, game log, minimap, puzzle modal.
 */

class GameUI {
  constructor() {
    this.logMessages = [];
    this.maxLogMessages = 50;
    this.puzzleCallback = null;
    this.elements = {};
    this.init();
  }

  init() {
    // Cache DOM elements
    this.elements = {
      playerName: document.getElementById('player-name'),
      playerHealth: document.getElementById('player-health'),
      healthFill: document.getElementById('health-fill'),
      playerGold: document.getElementById('player-gold'),
      playerScore: document.getElementById('player-score'),
      turnInfo: document.getElementById('turn-info'),
      inventoryList: document.getElementById('inventory-list'),
      gameLog: document.getElementById('game-log'),
      minimapCanvas: document.getElementById('minimap'),
      chamberInfo: document.getElementById('chamber-info'),
      puzzleModal: document.getElementById('puzzle-modal'),
      puzzleText: document.getElementById('puzzle-text'),
      puzzleInput: document.getElementById('puzzle-input'),
      puzzleHint: document.getElementById('puzzle-hint'),
      puzzleSubmit: document.getElementById('puzzle-submit'),
      gameOverModal: document.getElementById('gameover-modal'),
      gameOverText: document.getElementById('gameover-text'),
      restartBtn: document.getElementById('restart-btn'),
      playerIndicators: document.getElementById('player-indicators'),
    };

    // Setup puzzle submit
    if (this.elements.puzzleSubmit) {
      this.elements.puzzleSubmit.addEventListener('click', () => this.submitPuzzle());
    }
    if (this.elements.puzzleInput) {
      this.elements.puzzleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submitPuzzle();
      });
    }
  }

  /**
   * Update HUD with current player info
   */
  updatePlayerInfo(player) {
    if (!player) return;

    if (this.elements.playerName) {
      this.elements.playerName.textContent = `${player.isBot ? '🤖' : '👤'} ${player.name}`;
      this.elements.playerName.style.color = player.color;
    }

    if (this.elements.playerHealth) {
      this.elements.playerHealth.textContent = `${player.health}/${player.maxHealth}`;
    }

    if (this.elements.healthFill) {
      const pct = (player.health / player.maxHealth) * 100;
      this.elements.healthFill.style.width = pct + '%';
      this.elements.healthFill.style.background =
        pct > 50 ? '#44ff44' : pct > 25 ? '#ffaa00' : '#ff4444';
    }

    if (this.elements.playerGold) {
      this.elements.playerGold.textContent = player.gold;
    }

    if (this.elements.playerScore) {
      this.elements.playerScore.textContent = player.calculateScore();
    }
  }

  /**
   * Update turn info
   */
  updateTurnInfo(turnInfo) {
    if (!this.elements.turnInfo) return;
    this.elements.turnInfo.textContent = `Turn ${turnInfo.turnNumber} • ${turnInfo.playersAlive}/${turnInfo.totalPlayers} alive`;
  }

  /**
   * Update player indicators (all players sidebar)
   */
  updatePlayerIndicators(players, currentId) {
    if (!this.elements.playerIndicators) return;
    this.elements.playerIndicators.innerHTML = '';

    for (const p of players) {
      const div = document.createElement('div');
      div.className = 'player-indicator' + (p.id === currentId ? ' active' : '') + (!p.alive ? ' dead' : '');
      div.innerHTML = `
        <span class="indicator-dot" style="background:${p.color}"></span>
        <span class="indicator-name">${p.isBot ? '🤖' : '👤'} ${p.name}</span>
        <span class="indicator-health">${p.alive ? p.health + 'HP' : '💀'}</span>
        <span class="indicator-gold">💰${p.gold}</span>
      `;
      this.elements.playerIndicators.appendChild(div);
    }
  }

  /**
   * Update inventory display
   */
  updateInventory(player) {
    if (!this.elements.inventoryList) return;
    const items = player.inventory.getAll();
    this.elements.inventoryList.innerHTML = '';

    if (items.length === 0) {
      this.elements.inventoryList.innerHTML = '<div class="inv-empty">Empty</div>';
      return;
    }

    for (const item of items) {
      const itemDef = ITEM_TYPES[item.type];
      if (!itemDef) continue;
      const div = document.createElement('div');
      div.className = 'inv-item' + (itemDef.usable ? ' usable' : '');
      div.innerHTML = `
        <span class="inv-icon">${itemDef.icon}</span>
        <span class="inv-name">${itemDef.name}${item.count > 1 ? ' x' + item.count : ''}</span>
      `;
      if (itemDef.usable) {
        div.title = `Click to use: ${itemDef.description}`;
        div.dataset.itemType = item.type;
      }
      this.elements.inventoryList.appendChild(div);
    }
  }

  /**
   * Add message to game log
   */
  log(message, type = 'info') {
    this.logMessages.push({ message, type, time: Date.now() });
    if (this.logMessages.length > this.maxLogMessages) {
      this.logMessages.shift();
    }
    this.renderLog();
  }

  /**
   * Render game log
   */
  renderLog() {
    if (!this.elements.gameLog) return;
    const logEl = this.elements.gameLog;
    logEl.innerHTML = '';

    const recent = this.logMessages.slice(-15);
    for (const entry of recent) {
      const div = document.createElement('div');
      div.className = 'log-entry log-' + entry.type;
      div.textContent = entry.message;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  /**
   * Update chamber info panel
   */
  updateChamberInfo(chamber) {
    if (!this.elements.chamberInfo) return;
    if (!chamber) {
      this.elements.chamberInfo.innerHTML = '';
      return;
    }
    const vis = getChamberVisual(chamber.type);
    this.elements.chamberInfo.innerHTML = `
      <div class="chamber-type">${vis.icon} ${vis.name}</div>
      <div class="chamber-desc">${vis.description}</div>
      <div class="chamber-pos">(${chamber.x}, ${chamber.y})</div>
    `;
  }

  /**
   * Draw minimap
   */
  drawMinimap(map, players, currentPlayerId) {
    const canvas = this.elements.minimapCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = 6; // pixel size per tile
    canvas.width = map.width * s;
    canvas.height = map.height * s;

    // Draw tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.grid[y][x];
        if (cell.explored[currentPlayerId]) {
          const vis = getChamberVisual(cell.type);
          ctx.fillStyle = vis.color;
        } else {
          ctx.fillStyle = '#08080d';
        }
        ctx.fillRect(x * s, y * s, s, s);
      }
    }

    // Draw players on minimap
    for (const p of players) {
      if (!p.alive) continue;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x * s + 1, p.y * s + 1, s - 2, s - 2);
    }
  }

  /**
   * Show puzzle modal
   */
  showPuzzle(puzzle, callback) {
    if (!this.elements.puzzleModal) return;
    this.puzzleCallback = callback;
    this.currentPuzzle = puzzle;
    this.hintIndex = 0;

    this.elements.puzzleText.textContent = puzzle.question;
    this.elements.puzzleInput.value = '';
    this.elements.puzzleHint.textContent = '';
    this.elements.puzzleModal.classList.add('visible');
    this.elements.puzzleInput.focus();
  }

  /**
   * Submit puzzle answer
   */
  submitPuzzle() {
    if (!this.puzzleCallback) return;
    const answer = this.elements.puzzleInput.value.trim();
    if (!answer) return;
    this.elements.puzzleModal.classList.remove('visible');
    this.puzzleCallback(answer);
    this.puzzleCallback = null;
  }

  /**
   * Get hint for current puzzle
   */
  showHint() {
    if (!this.currentPuzzle) return;
    const pm = new PuzzleManager();
    const hint = pm.getHint(this.currentPuzzle, this.hintIndex);
    if (this.elements.puzzleHint) {
      this.elements.puzzleHint.textContent = '💡 ' + hint;
    }
    this.hintIndex++;
  }

  /**
   * Show game over screen
   */
  showGameOver(winner, players) {
    if (!this.elements.gameOverModal) return;
    const sorted = [...players].sort((a, b) => b.calculateScore() - a.calculateScore());
    let html = `<h2>${winner.isBot ? '🤖' : '🎉'} ${winner.name} Wins!</h2>`;
    html += '<div class="scoreboard">';
    sorted.forEach((p, i) => {
      html += `<div class="score-row${p.id === winner.id ? ' winner' : ''}">
        <span>#${i + 1}</span>
        <span style="color:${p.color}">${p.name}</span>
        <span>${p.calculateScore()} pts</span>
        <span>💰${p.gold} ❤️${p.health} 🗺️${p.chambersExplored}</span>
      </div>`;
    });
    html += '</div>';
    this.elements.gameOverText.innerHTML = html;
    this.elements.gameOverModal.classList.add('visible');
  }

  /**
   * Hide game over
   */
  hideGameOver() {
    if (this.elements.gameOverModal) {
      this.elements.gameOverModal.classList.remove('visible');
    }
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { GameUI };

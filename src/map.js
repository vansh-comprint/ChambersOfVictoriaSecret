/**
 * 🗺️ Map Generator — by Chotu 😈
 * 
 * Procedural dungeon map with fog of war.
 * Generates a grid of chambers with guaranteed path to the Secret Chamber.
 */

class GameMap {
  constructor(width = 8, height = 8) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.secretChamber = null;
    this.playerSpawns = [];
    this.revealed = new Set(); // fog of war tracking per player
  }

  /**
   * Generate a new map
   * @param {number} playerCount - Number of players (2-4)
   */
  generate(playerCount = 4) {
    // Initialize empty grid
    this.grid = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => ({
        x,
        y,
        type: 'empty',
        item: null,
        explored: {},  // per-player exploration state
        walls: { north: false, south: false, east: false, west: false },
      }))
    );

    // Place chambers with different types
    this.placeChamberTypes();

    // Place the Secret Chamber (goal)
    this.placeSecretChamber();

    // Place player spawns in corners
    this.placeSpawns(playerCount);

    // Ensure path exists from each spawn to secret chamber
    this.ensureConnectivity();

    // Place locked doors and keys
    this.placeLocks();

    return this;
  }

  /**
   * Distribute chamber types across the map
   */
  placeChamberTypes() {
    const totalCells = this.width * this.height;
    const distribution = {
      treasure: Math.floor(totalCells * 0.15),  // 15% treasure
      trap: Math.floor(totalCells * 0.12),       // 12% traps
      puzzle: Math.floor(totalCells * 0.08),     // 8% puzzles
      npc: Math.floor(totalCells * 0.05),        // 5% NPCs
      locked: Math.floor(totalCells * 0.08),     // 8% locked
      // rest stays empty
    };

    // Collect all non-corner, non-center positions
    const positions = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Skip corners (spawn points) and center area (secret chamber zone)
        if (this.isCorner(x, y)) continue;
        if (this.isCenter(x, y)) continue;
        positions.push({ x, y });
      }
    }

    // Shuffle positions
    this.shuffle(positions);

    let idx = 0;
    for (const [type, count] of Object.entries(distribution)) {
      for (let i = 0; i < count && idx < positions.length; i++, idx++) {
        const { x, y } = positions[idx];
        this.grid[y][x].type = type;
      }
    }
  }

  /**
   * Place the Secret Chamber near the center
   */
  placeSecretChamber() {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    this.grid[cy][cx].type = 'secret';
    this.grid[cy][cx].locked = true; // Need to solve something to enter
    this.secretChamber = { x: cx, y: cy };
  }

  /**
   * Place player spawn points in corners
   */
  placeSpawns(playerCount) {
    const corners = [
      { x: 0, y: 0 },
      { x: this.width - 1, y: 0 },
      { x: 0, y: this.height - 1 },
      { x: this.width - 1, y: this.height - 1 },
    ];

    this.playerSpawns = corners.slice(0, playerCount);
    this.playerSpawns.forEach((pos, i) => {
      this.grid[pos.y][pos.x].type = 'spawn';
      this.grid[pos.y][pos.x].spawnFor = i;
    });
  }

  /**
   * Ensure all spawns can reach the secret chamber
   * Uses simple path carving
   */
  ensureConnectivity() {
    // For each spawn, carve a path to the secret chamber
    for (const spawn of this.playerSpawns) {
      this.carvePath(spawn, this.secretChamber);
    }
  }

  /**
   * Simple path carving between two points
   */
  carvePath(from, to) {
    let { x, y } = from;
    const path = [{ x, y }];

    while (x !== to.x || y !== to.y) {
      // Move towards target, with some randomness
      if (Math.random() < 0.5 && x !== to.x) {
        x += x < to.x ? 1 : -1;
      } else if (y !== to.y) {
        y += y < to.y ? 1 : -1;
      } else {
        x += x < to.x ? 1 : -1;
      }
      path.push({ x, y });

      // Mark cells along the path as passable (clear walls)
      const cell = this.grid[y][x];
      if (cell.type === 'locked' && path.length < 3) {
        cell.type = 'empty'; // Don't lock early path
      }
    }

    return path;
  }

  /**
   * Place locked doors with corresponding keys
   */
  placeLocks() {
    const lockedChambers = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].type === 'locked') {
          lockedChambers.push({ x, y });
        }
      }
    }

    // For each locked chamber, place a key in a reachable treasure room
    const treasureChambers = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].type === 'treasure' && !this.grid[y][x].item) {
          treasureChambers.push({ x, y });
        }
      }
    }

    this.shuffle(treasureChambers);

    lockedChambers.forEach((locked, i) => {
      const keyId = `key-${locked.x}-${locked.y}`;
      this.grid[locked.y][locked.x].requiredKey = keyId;

      if (i < treasureChambers.length) {
        const tc = treasureChambers[i];
        this.grid[tc.y][tc.x].item = {
          type: 'key',
          id: keyId,
          name: `Key to Chamber (${locked.x}, ${locked.y})`,
        };
      }
    });
  }

  /**
   * Reveal chambers around a position (fog of war)
   * @param {number} playerId 
   * @param {number} x 
   * @param {number} y 
   * @param {number} vision - How far can the player see
   */
  reveal(playerId, x, y, vision = 1) {
    for (let dy = -vision; dy <= vision; dy++) {
      for (let dx = -vision; dx <= vision; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          this.grid[ny][nx].explored[playerId] = true;
        }
      }
    }
  }

  /**
   * Get chamber at position
   */
  getChamber(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.grid[y][x];
  }

  /**
   * Get valid moves from a position
   */
  getValidMoves(x, y) {
    const moves = [];
    const directions = [
      { dx: 0, dy: -1, name: 'north' },
      { dx: 0, dy: 1, name: 'south' },
      { dx: 1, dy: 0, name: 'east' },
      { dx: -1, dy: 0, name: 'west' },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const chamber = this.getChamber(nx, ny);
      if (chamber) {
        moves.push({
          direction: dir.name,
          x: nx,
          y: ny,
          chamber,
          blocked: chamber.type === 'locked' && chamber.requiredKey,
        });
      }
    }

    return moves;
  }

  /**
   * Get map state for rendering (respects fog of war)
   */
  getVisibleMap(playerId) {
    return this.grid.map(row =>
      row.map(cell => ({
        ...cell,
        visible: cell.explored[playerId] || false,
        // Hide details of unexplored cells
        type: cell.explored[playerId] ? cell.type : 'unknown',
        item: cell.explored[playerId] ? cell.item : null,
      }))
    );
  }

  // --- Utility functions ---

  isCorner(x, y) {
    return (
      (x === 0 && y === 0) ||
      (x === this.width - 1 && y === 0) ||
      (x === 0 && y === this.height - 1) ||
      (x === this.width - 1 && y === this.height - 1)
    );
  }

  isCenter(x, y) {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    return Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { GameMap };

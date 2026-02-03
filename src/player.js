/**
 * 🧑 Player System — by Chotu 😈
 * 
 * Player class: position, health, inventory, movement, scoring.
 */

class Player {
  constructor(id, name, color, isBot = false, strategy = null) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isBot = isBot;
    this.strategy = strategy; // bot AI strategy name

    // Position
    this.x = 0;
    this.y = 0;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.gold = 0;
    this.score = 0;

    // State
    this.alive = true;
    this.inventory = new Inventory(8);
    this.turnsTaken = 0;
    this.chambersExplored = 0;
    this.puzzlesSolved = 0;
    this.trapsTriggered = 0;

    // Visual
    this.targetX = 0;
    this.targetY = 0;
    this.animProgress = 1; // 1 = at destination
    this.lastDirection = 'south';
  }

  /**
   * Spawn player at position
   */
  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.animProgress = 1;
  }

  /**
   * Move to a new position
   */
  moveTo(x, y) {
    // Track direction for rendering
    if (x > this.x) this.lastDirection = 'east';
    else if (x < this.x) this.lastDirection = 'west';
    else if (y > this.y) this.lastDirection = 'south';
    else if (y < this.y) this.lastDirection = 'north';

    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.animProgress = 0;
    this.turnsTaken++;
  }

  /**
   * Take damage, applying passive reductions
   */
  takeDamage(amount) {
    // Check for shield passive
    const passives = this.inventory.getPassives();
    let reduction = 0;
    for (const p of passives) {
      if (p.trapDamageReduction) reduction = Math.max(reduction, p.trapDamageReduction);
    }
    const actual = Math.floor(amount * (1 - reduction));
    this.health = Math.max(0, this.health - actual);
    if (this.health <= 0) {
      this.alive = false;
    }
    return actual;
  }

  /**
   * Heal
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Add gold
   */
  addGold(amount) {
    this.gold += amount;
    this.score += amount;
  }

  /**
   * Remove gold
   */
  removeGold(amount) {
    const removed = Math.min(this.gold, amount);
    this.gold -= removed;
    return removed;
  }

  /**
   * Use an item from inventory
   */
  useItem(itemType, gameState) {
    const itemDef = ITEM_TYPES[itemType];
    if (!itemDef || !itemDef.usable) return { success: false, message: 'Cannot use that item.' };
    if (!this.inventory.has(itemType)) return { success: false, message: 'You don\'t have that item.' };

    const result = itemDef.use(this, gameState);
    this.inventory.remove(itemType);
    return { success: true, ...result };
  }

  /**
   * Check if player has a specific key
   */
  hasKey(keyId) {
    return this.inventory.hasKey(keyId);
  }

  /**
   * Update animation state
   */
  updateAnimation(dt) {
    if (this.animProgress < 1) {
      this.animProgress = Math.min(1, this.animProgress + dt * 5);
    }
  }

  /**
   * Get render position (interpolated for animation)
   */
  getRenderPos() {
    return {
      x: this.x,
      y: this.y,
      progress: this.animProgress
    };
  }

  /**
   * Calculate final score
   */
  calculateScore() {
    return this.gold + (this.chambersExplored * 5) + (this.puzzlesSolved * 20) - (this.trapsTriggered * 3);
  }
}

const PLAYER_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44'];
const PLAYER_NAMES = ['Red Rogue', 'Blue Mage', 'Green Ranger', 'Gold Knight'];

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { Player, PLAYER_COLORS, PLAYER_NAMES };

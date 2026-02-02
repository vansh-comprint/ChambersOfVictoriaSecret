/**
 * 🎒 Item System — by Chotu 😈
 * 
 * Keys, potions, traps, and treasures.
 */

const ITEM_TYPES = {
  key: {
    name: 'Key',
    icon: '🔑',
    stackable: false,
    usable: false, // Auto-used at locked doors
    description: 'Opens a locked chamber.',
  },
  health_potion: {
    name: 'Health Potion',
    icon: '❤️',
    stackable: true,
    usable: true,
    description: 'Restores 30 HP.',
    use: (player) => {
      const heal = 30;
      player.health = Math.min(100, player.health + heal);
      return { message: `Healed ${heal} HP! Health: ${player.health}`, heal };
    },
  },
  shield: {
    name: 'Shield',
    icon: '🛡️',
    stackable: false,
    usable: false, // Passive
    description: 'Reduces trap damage by 50%.',
    passive: { trapDamageReduction: 0.5 },
  },
  compass: {
    name: 'Compass',
    icon: '🧭',
    stackable: false,
    usable: true,
    description: 'Reveals the direction of the Secret Chamber.',
    use: (player, gameState) => {
      const secret = gameState.secretChamber;
      const dx = secret.x - player.x;
      const dy = secret.y - player.y;
      let direction = '';
      if (dy < 0) direction += 'North';
      if (dy > 0) direction += 'South';
      if (dx > 0) direction += 'East';
      if (dx < 0) direction += 'West';
      const distance = Math.abs(dx) + Math.abs(dy);
      return { message: `The compass points ${direction}. (~${distance} chambers away)`, direction, distance };
    },
  },
  trap_kit: {
    name: 'Trap Kit',
    icon: '⚙️',
    stackable: true,
    usable: true,
    description: 'Place a trap in the current chamber for other players.',
    use: (player, gameState) => {
      const chamber = gameState.map.getChamber(player.x, player.y);
      if (chamber) {
        chamber.playerTrap = {
          owner: player.id,
          damage: 15,
          message: `You triggered ${player.name}'s trap!`,
        };
        return { message: 'Trap placed! 😈', placed: true };
      }
      return { message: 'Cannot place trap here.', placed: false };
    },
  },
  gold_bag: {
    name: 'Gold Bag',
    icon: '💰',
    stackable: true,
    usable: false,
    description: 'A bag of gold coins.',
    value: 25,
  },
  vision_scroll: {
    name: 'Vision Scroll',
    icon: '👁️',
    stackable: true,
    usable: true,
    description: 'Reveals all chambers within 3 tiles.',
    use: (player, gameState) => {
      gameState.map.reveal(player.id, player.x, player.y, 3);
      return { message: 'The fog clears around you! Vision expanded to 3 tiles.', reveal: 3 };
    },
  },
};

class Inventory {
  constructor(maxSlots = 8) {
    this.items = [];
    this.maxSlots = maxSlots;
  }

  add(item) {
    // Check for stackable items
    if (item.stackable) {
      const existing = this.items.find(i => i.type === item.type);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        return { success: true, message: `Added ${item.name}. (x${existing.count})` };
      }
    }

    if (this.items.length >= this.maxSlots) {
      return { success: false, message: 'Inventory full!' };
    }

    this.items.push({ ...item, count: 1 });
    return { success: true, message: `Picked up ${item.name}!` };
  }

  remove(itemType) {
    const idx = this.items.findIndex(i => i.type === itemType);
    if (idx === -1) return false;

    if (this.items[idx].count > 1) {
      this.items[idx].count--;
    } else {
      this.items.splice(idx, 1);
    }
    return true;
  }

  has(itemType) {
    return this.items.some(i => i.type === itemType);
  }

  hasKey(keyId) {
    return this.items.some(i => i.type === 'key' && i.id === keyId);
  }

  getAll() {
    return [...this.items];
  }

  getPassives() {
    return this.items
      .filter(i => ITEM_TYPES[i.type]?.passive)
      .map(i => ITEM_TYPES[i.type].passive);
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') {
  module.exports = { ITEM_TYPES, Inventory };
}

/**
 * 🏰 Chamber Definitions — by Chotu 😈
 * 
 * Each chamber type has unique visuals, interactions, and effects.
 */

const CHAMBER_TYPES = {
  empty: {
    name: 'Empty Chamber',
    icon: '⬜',
    color: '#2a2a3e',
    description: 'A quiet room. Dust motes float in the dim light.',
    effect: null,
  },
  spawn: {
    name: 'Starting Chamber',
    icon: '🏠',
    color: '#1a3a1a',
    description: 'Your starting position. The adventure begins here.',
    effect: null,
  },
  treasure: {
    name: 'Treasure Chamber',
    icon: '💎',
    color: '#3a3a1a',
    description: 'Something glints in the corner...',
    effect: (player) => {
      const gold = Math.floor(Math.random() * 50) + 10;
      player.gold += gold;
      return { message: `Found ${gold} gold!`, gold };
    },
  },
  trap: {
    name: 'Trap Chamber',
    icon: '💀',
    color: '#3a1a1a',
    description: 'The floor creaks ominously...',
    effect: (player) => {
      const traps = [
        { name: 'Spike Trap', damage: 15, message: 'Spikes shoot from the floor!' },
        { name: 'Poison Gas', damage: 10, message: 'A green mist fills the room...' },
        { name: 'Falling Rocks', damage: 20, message: 'The ceiling collapses!' },
        { name: 'Thief', damage: 0, steal: true, message: 'A shadow darts past — your pocket feels lighter!' },
      ];
      const trap = traps[Math.floor(Math.random() * traps.length)];
      player.health -= trap.damage;
      if (trap.steal && player.gold > 0) {
        const stolen = Math.floor(player.gold * 0.3);
        player.gold -= stolen;
        trap.message += ` Lost ${stolen} gold!`;
      }
      return { message: trap.message, damage: trap.damage, trap: trap.name };
    },
  },
  puzzle: {
    name: 'Puzzle Chamber',
    icon: '🧩',
    color: '#1a2a3a',
    description: 'Strange symbols cover the walls...',
    effect: null, // Handled by puzzle engine
  },
  locked: {
    name: 'Locked Chamber',
    icon: '🔒',
    color: '#4a3a2a',
    description: 'A heavy door blocks your path. It needs a key.',
    effect: null,
  },
  npc: {
    name: 'NPC Chamber',
    icon: '🗣️',
    color: '#2a3a2a',
    description: 'Someone is waiting here...',
    effect: (player) => {
      const encounters = [
        { message: '"Psst! I\'ll trade a hint for 20 gold."', type: 'trader' },
        { message: '"Beware the chamber to the north..." ', type: 'warning' },
        { message: '"Take this. You\'ll need it."', type: 'gift', item: { type: 'potion', name: 'Health Potion', heal: 30 } },
      ];
      return encounters[Math.floor(Math.random() * encounters.length)];
    },
  },
  secret: {
    name: "Victoria's Secret Chamber",
    icon: '⭐',
    color: '#FFD700',
    description: 'The air hums with energy. This is it. The final chamber.',
    effect: null, // Win condition handled by game engine
  },
  unknown: {
    name: '???',
    icon: '❓',
    color: '#111111',
    description: 'Shrouded in darkness. Move closer to reveal.',
    effect: null,
  },
};

/**
 * Get chamber visual properties for rendering
 */
function getChamberVisual(type) {
  return CHAMBER_TYPES[type] || CHAMBER_TYPES.unknown;
}

/**
 * Execute chamber effect on player
 */
function triggerChamberEffect(chamber, player) {
  const chamberType = CHAMBER_TYPES[chamber.type];
  if (!chamberType || !chamberType.effect) return null;
  return chamberType.effect(player);
}

// Export for both Node and browser
if (typeof module !== 'undefined') {
  module.exports = { CHAMBER_TYPES, getChamberVisual, triggerChamberEffect };
}

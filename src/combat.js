/**
 * ⚔️ Combat System — by Chotu 😈
 * 
 * PvP combat, trap damage, item usage in combat.
 */

class CombatSystem {
  constructor() {
    this.combatLog = [];
  }

  /**
   * Check and trigger player traps when entering a chamber
   */
  checkPlayerTraps(chamber, player) {
    if (chamber.playerTrap && chamber.playerTrap.owner !== player.id) {
      const trap = chamber.playerTrap;
      const dmg = player.takeDamage(trap.damage);
      player.trapsTriggered++;
      const msg = `${trap.message} (-${dmg} HP)`;
      this.combatLog.push({ type: 'trap', target: player.name, message: msg });
      chamber.playerTrap = null; // trap consumed
      return { triggered: true, message: msg, damage: dmg };
    }
    return { triggered: false };
  }

  /**
   * PvP encounter — when two players are on the same tile
   */
  pvpEncounter(attacker, defender) {
    const results = [];

    // Both players roll
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const defendRoll = Math.floor(Math.random() * 20) + 1;

    if (attackRoll > defendRoll) {
      // Attacker wins — steal gold
      const stolen = Math.floor(defender.gold * 0.25);
      if (stolen > 0) {
        defender.removeGold(stolen);
        attacker.addGold(stolen);
        const msg = `${attacker.name} overpowers ${defender.name} and steals ${stolen} gold! (${attackRoll} vs ${defendRoll})`;
        results.push({ type: 'pvp', winner: attacker.name, message: msg });
        this.combatLog.push({ type: 'pvp', message: msg });
      }
      // Defender takes damage
      const dmg = defender.takeDamage(10 + Math.floor(Math.random() * 10));
      const dmgMsg = `${defender.name} takes ${dmg} damage!`;
      results.push({ type: 'damage', target: defender.name, message: dmgMsg });
      this.combatLog.push({ type: 'pvp', message: dmgMsg });
    } else if (defendRoll > attackRoll) {
      // Defender fends off and counter-attacks
      const dmg = attacker.takeDamage(5 + Math.floor(Math.random() * 8));
      const msg = `${defender.name} defends and counter-attacks ${attacker.name} for ${dmg} damage! (${defendRoll} vs ${attackRoll})`;
      results.push({ type: 'pvp', winner: defender.name, message: msg });
      this.combatLog.push({ type: 'pvp', message: msg });
    } else {
      // Draw — both stumble back
      const msg = `${attacker.name} and ${defender.name} clash but neither gains ground! (Tied at ${attackRoll})`;
      results.push({ type: 'draw', message: msg });
      this.combatLog.push({ type: 'pvp', message: msg });
    }

    return results;
  }

  /**
   * Process chamber trap effects
   */
  processTrapChamber(chamber, player) {
    const effect = triggerChamberEffect(chamber, player);
    if (effect) {
      player.trapsTriggered++;
      this.combatLog.push({
        type: 'chamber_trap',
        target: player.name,
        message: `${player.name}: ${effect.message}`
      });
    }
    return effect;
  }

  /**
   * Check for PvP encounters on a tile
   */
  checkPvPOnTile(currentPlayer, allPlayers) {
    const results = [];
    for (const other of allPlayers) {
      if (other.id === currentPlayer.id) continue;
      if (!other.alive) continue;
      if (other.x === currentPlayer.x && other.y === currentPlayer.y) {
        // PvP encounter!
        const pvpResults = this.pvpEncounter(currentPlayer, other);
        results.push(...pvpResults);
      }
    }
    return results;
  }

  /**
   * Get recent combat log entries
   */
  getRecentLog(count = 5) {
    return this.combatLog.slice(-count);
  }

  /**
   * Clear combat log
   */
  clearLog() {
    this.combatLog = [];
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { CombatSystem };

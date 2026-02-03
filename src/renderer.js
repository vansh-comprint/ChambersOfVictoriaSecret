/**
 * 🎨 Canvas Renderer — by Chotu 😈
 * 
 * Draws the dungeon grid, fog of war, players, items, animations.
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 72;
    this.offsetX = 0;
    this.offsetY = 0;
    this.particles = [];
    this.shakeAmount = 0;
    this.shakeDecay = 0.9;
    this.time = 0;

    // Camera
    this.camX = 0;
    this.camY = 0;
    this.camTargetX = 0;
    this.camTargetY = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.canvas.height = this.canvas.parentElement?.clientHeight || window.innerHeight;
  }

  /**
   * Center camera on a player
   */
  focusOn(x, y) {
    this.camTargetX = x * this.tileSize - this.canvas.width / 2 + this.tileSize / 2;
    this.camTargetY = y * this.tileSize - this.canvas.height / 2 + this.tileSize / 2;
  }

  /**
   * Main render loop
   */
  render(gameState, dt) {
    this.time += dt;
    const ctx = this.ctx;
    const ts = this.tileSize;

    // Smooth camera
    this.camX += (this.camTargetX - this.camX) * 0.08;
    this.camY += (this.camTargetY - this.camY) * 0.08;

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeAmount > 0.5) {
      shakeX = (Math.random() - 0.5) * this.shakeAmount;
      shakeY = (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount *= this.shakeDecay;
    } else {
      this.shakeAmount = 0;
    }

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-this.camX + shakeX, -this.camY + shakeY);

    if (!gameState || !gameState.map) {
      ctx.restore();
      return;
    }

    const map = gameState.map;
    const currentPlayerId = gameState.currentPlayer?.id ?? 0;

    // Draw grid
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.grid[y][x];
        const px = x * ts;
        const py = y * ts;
        const isExplored = cell.explored[currentPlayerId];

        if (!isExplored) {
          // Fog of war — dark tile with subtle pattern
          ctx.fillStyle = '#08080d';
          ctx.fillRect(px, py, ts, ts);
          // Fog shimmer
          const shimmer = Math.sin(this.time * 0.5 + x * 0.7 + y * 1.3) * 0.03 + 0.03;
          ctx.fillStyle = `rgba(60, 40, 80, ${shimmer})`;
          ctx.fillRect(px, py, ts, ts);
          // Border
          ctx.strokeStyle = '#15152a';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
          continue;
        }

        // Draw explored chamber
        const chamberVis = getChamberVisual(cell.type);
        ctx.fillStyle = chamberVis.color;
        ctx.fillRect(px, py, ts, ts);

        // Add subtle gradient overlay
        const grad = ctx.createRadialGradient(px + ts/2, py + ts/2, 0, px + ts/2, py + ts/2, ts * 0.7);
        grad.addColorStop(0, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, ts, ts);

        // Border
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);

        // Draw chamber icon
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chamberVis.icon, px + ts/2, py + ts/2);

        // Secret chamber glow
        if (cell.type === 'secret') {
          const glow = Math.sin(this.time * 2) * 0.3 + 0.3;
          ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          ctx.font = '28px serif';
          ctx.fillText('⭐', px + ts/2, py + ts/2);
        }

        // Draw item on tile
        if (cell.item) {
          const itemDef = ITEM_TYPES[cell.item.type];
          if (itemDef) {
            ctx.font = '16px serif';
            const bob = Math.sin(this.time * 3 + x + y) * 3;
            ctx.fillText(itemDef.icon, px + ts - 14, py + ts - 14 + bob);
          }
        }
      }
    }

    // Draw players
    if (gameState.players) {
      for (const player of gameState.players) {
        if (!player.alive) continue;
        this.drawPlayer(ctx, player, ts, gameState.currentPlayer?.id === player.id);
      }
    }

    // Draw particles
    this.updateParticles(ctx, dt);

    ctx.restore();
  }

  /**
   * Draw a single player token
   */
  drawPlayer(ctx, player, ts, isCurrent) {
    const px = player.x * ts + ts / 2;
    const py = player.y * ts + ts / 2;
    const radius = ts * 0.3;

    // Pulse effect for current player
    const pulse = isCurrent ? Math.sin(this.time * 4) * 4 + 4 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + radius * 0.8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow for current player
    if (isCurrent) {
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + Math.sin(this.time * 3) * 0.2;
      ctx.beginPath();
      ctx.arc(px, py, radius + pulse + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Player circle
    const grad = ctx.createRadialGradient(px - 3, py - 3, 0, px, py, radius);
    grad.addColorStop(0, this.lightenColor(player.color, 40));
    grad.addColorStop(1, player.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Health bar
    const barWidth = ts * 0.6;
    const barHeight = 4;
    const barX = px - barWidth / 2;
    const barY = py - radius - 10;
    const healthPct = player.health / player.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = healthPct > 0.5 ? '#44ff44' : healthPct > 0.25 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);

    // Name label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(player.name, px, barY - 2);

    // Bot strategy icon
    if (player.isBot && player.strategy) {
      const strat = BOT_STRATEGIES[player.strategy];
      if (strat) {
        ctx.font = '12px serif';
        ctx.fillText(strat.icon, px, py + 4);
      }
    } else if (!player.isBot) {
      ctx.font = '12px serif';
      ctx.fillText('👤', px, py + 4);
    }
  }

  /**
   * Add particle effect
   */
  addParticle(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x * this.tileSize + this.tileSize / 2,
        y: y * this.tileSize + this.tileSize / 2,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 1,
        decay: 0.5 + Math.random() * 1.5,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  /**
   * Update and draw particles
   */
  updateParticles(ctx, dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Trigger screen shake
   */
  shake(intensity = 8) {
    this.shakeAmount = intensity;
  }

  /**
   * Handle click on canvas — return grid coordinates
   */
  getGridPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = clientX - rect.left + this.camX;
    const my = clientY - rect.top + this.camY;
    return {
      x: Math.floor(mx / this.tileSize),
      y: Math.floor(my / this.tileSize),
    };
  }

  /**
   * Lighten a hex color
   */
  lightenColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return `rgb(${r},${g},${b})`;
  }
}

// Export for both Node and browser
if (typeof module !== 'undefined') module.exports = { Renderer };

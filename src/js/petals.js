// ==========================================================================
// Sakura Petals Particle Simulation (Canvas)
// Continuous ambient drift + signature completion burst celebration
// ==========================================================================

export class PetalsSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.petals = [];
    this.maxAmbientPetals = 35;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = true;
    this.wind = 0.5;
    this.windTarget = 0.5;
    
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    
    window.addEventListener('resize', this.resize);
    this.resize();
    this.initPetals();
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createPetal(isBurst = false) {
    const size = Math.random() * 9 + 8;
    const x = isBurst ? (this.width / 2 + (Math.random() - 0.5) * 400) : Math.random() * this.width;
    const y = isBurst ? (Math.random() * 150) : Math.random() * this.height;
    
    // Soft cherry blossom tones with subtle variations
    const tones = [
      'rgba(255, 183, 197, ',
      'rgba(255, 192, 203, ',
      'rgba(244, 166, 185, ',
      'rgba(235, 140, 175, ',
      'rgba(255, 218, 225, '
    ];
    const colorBase = tones[Math.floor(Math.random() * tones.length)];
    const opacity = (Math.random() * 0.45 + 0.4).toFixed(2);
    
    return {
      x,
      y,
      size,
      vx: (Math.random() - 0.5) * 1.5 + this.wind,
      vy: isBurst ? (Math.random() * 3 + 2.5) : (Math.random() * 1.4 + 0.8),
      rotation: Math.random() * Math.PI * 2,
      vRotation: (Math.random() - 0.5) * 0.04,
      flip: Math.random() * Math.PI,
      vFlip: Math.random() * 0.03 + 0.01,
      color: `${colorBase}${opacity})`,
      isBurst
    };
  }

  initPetals() {
    this.petals = [];
    for (let i = 0; i < this.maxAmbientPetals; i++) {
      this.petals.push(this.createPetal(false));
    }
  }

  // Signature moment: celebration burst upon goal/habit completion
  celebrate() {
    const burstCount = 55;
    for (let i = 0; i < burstCount; i++) {
      this.petals.push(this.createPetal(true));
    }
  }

  drawPetal(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.scale(1, Math.sin(p.flip));

    this.ctx.beginPath();
    // Beautiful curved cherry blossom petal shape
    this.ctx.moveTo(0, 0);
    this.ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
    this.ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
    
    this.ctx.fillStyle = p.color;
    this.ctx.shadowColor = 'rgba(235, 140, 175, 0.4)';
    this.ctx.shadowBlur = 4;
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Gently fluctuate ambient wind
    if (Math.random() < 0.02) {
      this.windTarget = (Math.random() - 0.4) * 1.5;
    }
    this.wind += (this.windTarget - this.wind) * 0.02;

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.x += p.vx + this.wind;
      p.y += p.vy;
      p.rotation += p.vRotation;
      p.flip += p.vFlip;

      this.drawPetal(p);

      // Reposition or clean up off-screen petals
      if (p.y > this.height + 40 || p.x < -40 || p.x > this.width + 40) {
        if (p.isBurst) {
          this.petals.splice(i, 1);
        } else {
          this.petals[i] = this.createPetal(false);
          this.petals[i].y = -20;
          this.petals[i].x = Math.random() * this.width;
        }
      }
    }

    requestAnimationFrame(this.animate);
  }
}

// ==========================================================================
// Sakura Breath & Sound Sanctuary Engine
// 4-7-8 Glowing Lotus Breathing Pacer & Procedural Ambient Soundscape Controls
// ==========================================================================

import { soundscape } from './audio.js';
import { store } from './state.js';

export class SanctuaryManager {
  constructor() {
    this.container = document.getElementById('view-sanctuary');
    this.isBreathing = false;
    this.phase = 'idle'; // 'idle', 'inhale', 'hold', 'exhale'
    this.timer = 0;
    this.cycleCount = 0;
    this.intervalId = null;
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;
    const state = store.getState();

    this.container.innerHTML = `
      <!-- Breathing Lotus Sanctuary Section -->
      <div class="breathing-box">
        <h2 class="breathing-title">🪷 Sacred Breath Pacer</h2>
        <p class="breathing-subtitle">
          The 4-7-8 somatic rhythm signals your vagus nerve to dissolve anxiety and return to peace.
        </p>

        <div class="lotus-circle-outer">
          <div class="lotus-glow-aura"></div>
          <div class="lotus-breath-disc ${this.isBreathing ? this.phase : ''}" id="disc-lotus">
            <div style="font-size: 38px; margin-bottom: 4px;">🌸</div>
            <div class="breath-phase-text" id="breath-phase-label">
              ${this.isBreathing ? this.getPhaseLabel() : 'Begin'}
            </div>
            <div class="breath-timer-count" id="breath-count-label">
              ${this.isBreathing ? `${this.timer}s` : 'Tap to start'}
            </div>
          </div>
        </div>

        <div class="breathing-controls-row">
          <button class="btn-glass-primary" id="btn-toggle-breath" style="padding: 10px 24px;">
            ${this.isBreathing ? '⏸ Pause Breath' : '▶ Begin 4-7-8 Breathing'}
          </button>
        </div>

        <p style="font-size: 12.5px; color: var(--ink-muted);" id="breath-affirmation">
          ${this.getAffirmation()}
        </p>
      </div>

      <!-- Ambient Soundscape Synthesizer Card -->
      <div class="soundscape-card">
        <div class="soundscape-title">
          <span>🎧</span> Ambient Soundscapes (Procedural 432Hz)
        </div>

        <div class="soundscape-grid">
          <button class="sound-track-btn ${soundscape.currentTrack === 'bowl' ? 'playing' : ''}" data-track="bowl">
            <span class="sound-icon">🔔</span>
            <span class="sound-label">Zen Bowl (528Hz)</span>
          </button>

          <button class="sound-track-btn ${soundscape.currentTrack === 'breeze' ? 'playing' : ''}" data-track="breeze">
            <span class="sound-icon">🌸</span>
            <span class="sound-label">Sakura Breeze</span>
          </button>

          <button class="sound-track-btn ${soundscape.currentTrack === 'rain' ? 'playing' : ''}" data-track="rain">
            <span class="sound-icon">🌧️</span>
            <span class="sound-label">Twilight Rain</span>
          </button>

          <button class="sound-track-btn ${soundscape.currentTrack === 'ocean' ? 'playing' : ''}" data-track="ocean">
            <span class="sound-icon">🌊</span>
            <span class="sound-label">Ocean Tide</span>
          </button>
        </div>

        <div class="volume-slider-row">
          <span>🔈 Quiet</span>
          <input type="range" class="volume-range" id="soundscape-vol" min="0" max="1" step="0.05" value="${soundscape.volume}">
          <span>🔊 Resonant</span>
          <button class="tool-btn" id="btn-stop-audio" style="margin-left: 8px;">⏹ Stop</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  getPhaseLabel() {
    switch (this.phase) {
      case 'inhale': return 'Inhale';
      case 'hold': return 'Hold';
      case 'exhale': return 'Exhale';
      default: return 'Ready';
    }
  }

  getAffirmation() {
    if (!this.isBreathing) return 'Rest in the knowledge that you are whole right now.';
    if (this.phase === 'inhale') return 'Drinking in calm, coolness, and space...';
    if (this.phase === 'hold') return 'Resting in the sacred stillness of the pause...';
    if (this.phase === 'exhale') return 'Releasing tension, softening the jaw and belly...';
    return 'Breathe softly...';
  }

  attachEvents() {
    const disc = document.getElementById('disc-lotus');
    const btnToggle = document.getElementById('btn-toggle-breath');

    const toggleBreath = () => {
      if (this.isBreathing) {
        this.stopBreathing();
      } else {
        this.startBreathing();
      }
      this.render();
    };

    if (disc) disc.onclick = toggleBreath;
    if (btnToggle) btnToggle.onclick = toggleBreath;

    // Soundscape buttons
    this.container.querySelectorAll('.sound-track-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.track;
        if (soundscape.currentTrack === track) {
          soundscape.stop();
        } else {
          if (track === 'bowl') soundscape.playSingingBowl();
          else if (track === 'breeze') soundscape.playBreeze();
          else if (track === 'rain') soundscape.playRain();
          else if (track === 'ocean') soundscape.playOcean();
        }
        this.render();
      });
    });

    // Volume range
    const volSlider = document.getElementById('soundscape-vol');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        soundscape.setVolume(parseFloat(e.target.value));
      });
    }

    const btnStop = document.getElementById('btn-stop-audio');
    if (btnStop) {
      btnStop.addEventListener('click', () => {
        soundscape.stop();
        this.render();
      });
    }
  }

  startBreathing() {
    this.isBreathing = true;
    this.cycleCount = 1;
    this.runCycle();
  }

  stopBreathing() {
    this.isBreathing = false;
    this.phase = 'idle';
    if (this.intervalId) clearInterval(this.intervalId);
  }

  runCycle() {
    if (!this.isBreathing) return;

    // 1. INHALE (4s)
    this.phase = 'inhale';
    this.timer = 4;
    soundscape.playChime('chime');
    this.updateDomLabels();

    this.intervalId = setInterval(() => {
      this.timer--;
      this.updateDomLabels();
      if (this.timer <= 0) {
        clearInterval(this.intervalId);
        if (!this.isBreathing) return;

        // 2. HOLD (7s)
        this.phase = 'hold';
        this.timer = 7;
        this.updateDomLabels();

        this.intervalId = setInterval(() => {
          this.timer--;
          this.updateDomLabels();
          if (this.timer <= 0) {
            clearInterval(this.intervalId);
            if (!this.isBreathing) return;

            // 3. EXHALE (8s)
            this.phase = 'exhale';
            this.timer = 8;
            soundscape.playChime('bell');
            this.updateDomLabels();

            this.intervalId = setInterval(() => {
              this.timer--;
              this.updateDomLabels();
              if (this.timer <= 0) {
                clearInterval(this.intervalId);
                this.cycleCount++;
                if (this.isBreathing) {
                  this.runCycle();
                }
              }
            }, 1000);
          }
        }, 1000);
      }
    }, 1000);
  }

  updateDomLabels() {
    const disc = document.getElementById('disc-lotus');
    const phaseLabel = document.getElementById('breath-phase-label');
    const countLabel = document.getElementById('breath-count-label');
    const affLabel = document.getElementById('breath-affirmation');

    if (disc) {
      disc.className = `lotus-breath-disc ${this.phase}`;
    }
    if (phaseLabel) phaseLabel.textContent = this.getPhaseLabel();
    if (countLabel) countLabel.textContent = `${this.timer}s`;
    if (affLabel) affLabel.textContent = this.getAffirmation();
  }
}

// ==========================================================================
// Sakura Gentle Nudges & Hydration Vitality Engine
// Soft reminders for Water, Rest, Nourishment, Posture & In-app Toasts
// ==========================================================================

import { store } from './state.js';
import { soundscape } from './audio.js';

export function showToast(message, icon = '🌸') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-bubble';
  toast.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

export class VitalityManager {
  constructor(petalsSystem) {
    this.petalsSystem = petalsSystem;
    this.container = document.getElementById('view-vitality');
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;
    const state = store.getState();

    const glasses = [];
    for (let i = 1; i <= state.waterTarget; i++) {
      glasses.push(i <= state.waterGlasses);
    }

    this.container.innerHTML = `
      <!-- Hydration Card -->
      <div class="vitality-card">
        <div class="vitality-card-header">
          <h3>💧 Daily Hydration</h3>
          <p>Drink water throughout the day to stay energized and refreshed.</p>
        </div>

        <div class="water-glasses-row">
          ${glasses.map((filled, idx) => `
            <button class="water-glass-btn ${filled ? 'filled' : ''}" data-idx="${idx + 1}" title="Glass ${idx + 1}">
              ${filled ? '💧' : '○'}
            </button>
          `).join('')}
        </div>

        <div class="water-actions-row">
          <div class="water-count-display">
            ${state.waterGlasses} of ${state.waterTarget} glasses logged today
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="tool-btn" id="btn-dec-water" style="padding: 6px 12px;">- Less</button>
            <button class="btn-glass-primary" id="btn-inc-water" style="padding: 6px 16px; font-size: 13px;">+ Log Sip</button>
          </div>
        </div>

        <div style="font-size: 12px; color: var(--ink-muted); font-style: italic; border-top: 1px solid var(--line); padding-top: 10px;">
          "A gentle sip of water restores your bloom from within."
        </div>
      </div>

      <!-- Gentle Nudges Configuration Card -->
      <div class="vitality-card">
        <div class="vitality-card-header">
          <h3>🕊️ Gentle Nudges</h3>
          <p>Soft, non-guilt reminders to anchor you throughout the day.</p>
        </div>

        <div class="nudges-list">
          <div class="nudge-item">
            <div class="nudge-info">
              <h4>💧 Water Nudge</h4>
              <p>A gentle sip of water restores your bloom.</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-nudge-water" ${state.nudges.water ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="nudge-item">
            <div class="nudge-info">
              <h4>🌙 Rest & Twilight</h4>
              <p>Evening descends. Let down your worries and step toward bed early.</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-nudge-rest" ${state.nudges.rest ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="nudge-item">
            <div class="nudge-info">
              <h4>🍎 Healthy Meals</h4>
              <p>Choose nutritious foods that give your body steady energy.</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-nudge-nourish" ${state.nudges.nourishment ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="nudge-item">
            <div class="nudge-info">
              <h4>🧘 Spine & Posture</h4>
              <p>Unclench your neck and let your spine lengthen with ease.</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-nudge-posture" ${state.nudges.posture ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 6px;">
          <button class="btn-glass-primary" id="btn-preview-nudge" style="font-size: 13px; padding: 10px 14px;">
            ✨ Preview In-App Nudge
          </button>
          <button class="tool-btn" id="btn-req-notifications" style="font-size: 13px;">
            🔔 Enable System Alerts
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Glass tap
    this.container.querySelectorAll('.water-glass-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        store.setState({ waterGlasses: idx });
        soundscape.playChime('chime');
        if (this.petalsSystem && idx >= store.getState().waterTarget) {
          this.petalsSystem.celebrate();
          showToast('Radiant! You reached your full hydration bloom today! 🌸', '💧');
        }
        this.render();
      });
    });

    // Increment / Decrement
    const btnInc = document.getElementById('btn-inc-water');
    if (btnInc) {
      btnInc.addEventListener('click', () => {
        store.setState(s => ({ waterGlasses: Math.min(s.waterTarget + 2, s.waterGlasses + 1) }));
        soundscape.playChime('chime');
        this.render();
      });
    }

    const btnDec = document.getElementById('btn-dec-water');
    if (btnDec) {
      btnDec.addEventListener('click', () => {
        store.setState(s => ({ waterGlasses: Math.max(0, s.waterGlasses - 1) }));
        this.render();
      });
    }

    // Toggle nudges
    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          store.setState(s => ({ nudges: { ...s.nudges, [key]: e.target.checked } }));
        });
      }
    };
    bindToggle('toggle-nudge-water', 'water');
    bindToggle('toggle-nudge-rest', 'rest');
    bindToggle('toggle-nudge-nourish', 'nourishment');
    bindToggle('toggle-nudge-posture', 'posture');

    // Preview nudge button
    const btnPreview = document.getElementById('btn-preview-nudge');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => {
        const msgs = [
          { text: 'Remember to drink a glass of water and stay hydrated.', icon: '💧' },
          { text: 'Take a moment to stretch your neck and relax your shoulders.', icon: '🧘' },
          { text: 'Time to wind down for a restful night of sleep.', icon: '🌙' },
          { text: 'Enjoy a healthy snack or meal to keep your energy up.', icon: '🍎' }
        ];
        const randomNudge = msgs[Math.floor(Math.random() * msgs.length)];
        soundscape.playChime('bell');
        showToast(randomNudge.text, randomNudge.icon);
      });
    }

    // Request system notifications
    const btnNotify = document.getElementById('btn-req-notifications');
    if (btnNotify) {
      btnNotify.addEventListener('click', () => {
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showToast('Notifications enabled!', '🔔');
              new Notification('Sakura 🌸', {
                body: 'Your safe space is always here for you.',
                icon: '/assets/aphrodite_avatar.png'
              });
            } else {
              showToast('Notification permission paused. In-app toasts will hold space instead.', '🕊️');
            }
          });
        }
      });
    }
  }
}

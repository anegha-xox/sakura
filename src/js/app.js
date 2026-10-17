// ==========================================================================
// Sakura Master Application Coordinator
// Binds UI, Chat threads, Modals, Audio, Journal, Goals, Themes & Petals
// ==========================================================================

import { store } from './state.js';
import { THEMES, applyTheme } from './themes.js';
import { PetalsSystem } from './petals.js';
import { soundscape } from './audio.js';
import { aphrodite } from './aphrodite.js';
import { JournalManager } from './journal.js';
import { GoalsManager } from './goals.js';
import { SanctuaryManager } from './breathing.js';
import { VitalityManager, showToast } from './nudges.js';

class SakuraApp {
  constructor() {
    this.petals = null;
    this.journal = null;
    this.goals = null;
    this.sanctuary = null;
    this.vitality = null;
    this.isListening = false;
    this.speechRecognition = null;
  }

  init() {
    // 1. Initialize canvas petals
    const canvas = document.getElementById('petals-canvas');
    if (canvas) {
      this.petals = new PetalsSystem(canvas);
    }

    // 2. Initialize sub-managers
    this.journal = new JournalManager();
    this.goals = new GoalsManager(this.petals);
    this.sanctuary = new SanctuaryManager();
    this.vitality = new VitalityManager(this.petals);

    // 3. Apply active theme from state
    const state = store.getState();
    applyTheme(state.activeTheme || 'sakura');

    // 4. Setup Speech Recognition if supported
    this.initSpeech();

    // 5. Render active view & chat
    this.switchView(state.currentView || 'chat');
    this.renderChatThreads();
    this.renderActiveChatMessages();
    this.renderThemeSwatches();

    // 6. Bind global event listeners
    this.bindEvents();

    // Subscribe to state changes
    store.subscribe((newState) => {
      this.renderChatThreads();
    });
  }

  initSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.speechRecognition = new SpeechRec();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chat-input-text');
        if (input) {
          input.value = transcript;
          this.sendMessage(transcript);
        }
        this.stopSpeech();
      };

      this.speechRecognition.onerror = () => this.stopSpeech();
      this.speechRecognition.onend = () => this.stopSpeech();
    }
  }

  toggleSpeech() {
    if (!this.speechRecognition) {
      showToast('Voice recognition is not supported in this browser.', '🎙️');
      return;
    }
    if (this.isListening) {
      this.speechRecognition.stop();
      this.stopSpeech();
    } else {
      this.isListening = true;
      const btn = document.getElementById('btn-voice-input');
      if (btn) btn.classList.add('listening');
      try {
        this.speechRecognition.start();
        showToast('Listening softly...', '🎙️');
      } catch (e) {
        this.stopSpeech();
      }
    }
  }

  stopSpeech() {
    this.isListening = false;
    const btn = document.getElementById('btn-voice-input');
    if (btn) btn.classList.remove('listening');
  }

  speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove markdown chars
      const clean = text.replace(/[*#_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.88;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }

  switchView(viewName) {
    store.setState({ currentView: viewName });
    
    // Update nav tab highlights
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views visibility
    document.querySelectorAll('.app-view').forEach(view => {
      const match = view.id === `view-${viewName}`;
      view.classList.toggle('active', match);
    });

    // Refresh view specific components
    if (viewName === 'journal') this.journal.render();
    else if (viewName === 'goals') this.goals.render();
    else if (viewName === 'sanctuary') this.sanctuary.render();
    else if (viewName === 'vitality') this.vitality.render();
  }

  renderChatThreads() {
    const list = document.getElementById('threads-list-container');
    if (!list) return;
    const state = store.getState();

    list.innerHTML = state.chats.map(chat => {
      const lastMsg = chat.messages[chat.messages.length - 1];
      const snippet = lastMsg ? lastMsg.text.replace(/\n/g, ' ') : 'Begin a gentle talk...';
      const isActive = chat.id === state.activeChatId;

      return `
        <div class="thread-item ${isActive ? 'active' : ''}" data-id="${chat.id}">
          <img src="/assets/aphrodite_avatar.png" alt="Avatar" class="thread-avatar">
          <div class="thread-info">
            <div class="thread-title-row">
              <span class="thread-name">${chat.title}</span>
              <span class="thread-time">${chat.updatedAt || 'Now'}</span>
            </div>
            <div class="thread-snippet">${snippet}</div>
          </div>
          ${state.chats.length > 1 ? `
            <button class="thread-del-btn" data-del-id="${chat.id}" title="Remove thread">✕</button>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach click events
    list.querySelectorAll('.thread-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('thread-del-btn')) return;
        const id = item.dataset.id;
        store.setState({ activeChatId: id });
        this.renderChatThreads();
        this.renderActiveChatMessages();
      });
    });

    list.querySelectorAll('.thread-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const delId = btn.dataset.delId;
        store.setState(s => {
          const filtered = s.chats.filter(c => c.id !== delId);
          return {
            chats: filtered,
            activeChatId: filtered[0]?.id || 'chat_1'
          };
        });
        this.renderChatThreads();
        this.renderActiveChatMessages();
      });
    });
  }

  getActiveChat() {
    const state = store.getState();
    return state.chats.find(c => c.id === state.activeChatId) || state.chats[0];
  }

  renderActiveChatMessages() {
    const scrollContainer = document.getElementById('chat-scroll-container');
    if (!scrollContainer) return;

    const chat = this.getActiveChat();
    if (!chat) return;

    // Update active chat title in header
    const titleEl = document.getElementById('header-chat-title');
    if (titleEl) titleEl.textContent = chat.title;

    scrollContainer.innerHTML = chat.messages.map(msg => {
      const isAphrodite = msg.sender === 'aphrodite';
      const formattedText = msg.text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      return `
        <div class="message-row ${isAphrodite ? 'aphrodite' : 'user'}">
          ${isAphrodite ? `
            <img src="/assets/aphrodite_avatar.png" alt="Aphrodite" class="message-avatar">
          ` : ''}

          <div class="message-bubble">
            <p>${formattedText}</p>

            ${msg.action ? `
              <div class="suggested-action-box">
                <div class="suggested-action-text">
                  ✨ <b>One small step:</b> ${msg.action.title}
                </div>
                <button class="btn-add-goal" data-action="${msg.action.title}" data-domain="${msg.action.domain || 'mind'}">
                  + Add to Daily Goals
                </button>
              </div>
            ` : ''}

            <div class="message-meta-row">
              <span class="message-time">${msg.time}</span>
              ${isAphrodite ? `
                <button class="speak-btn" data-speak="${encodeURIComponent(msg.text)}" title="Listen to Aphrodite">🔊</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach "Add to Daily Goals" buttons
    scrollContainer.querySelectorAll('.btn-add-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.action;
        const domain = btn.dataset.domain;
        
        store.setState(s => ({
          dailyHabits: [
            ...s.dailyHabits,
            { id: 'h_' + Date.now(), title, streak: 1, completed: false, domain }
          ]
        }));

        btn.classList.add('added');
        btn.textContent = '✓ Added to Goals';
        soundscape.playChime('bell');
        if (this.petals) this.petals.celebrate();
        showToast(`"${title}" gently placed in your daily checklist! 🌸`, '✨');
      });
    });

    // Attach text to speech buttons
    scrollContainer.querySelectorAll('.speak-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.speak);
        this.speakText(text);
      });
    });

    // Scroll to bottom smoothly
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }

  async sendMessage(customText = null) {
    const input = document.getElementById('chat-input-text');
    const text = customText || (input ? input.value.trim() : '');
    if (!text) return;

    if (input) input.value = '';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg = {
      id: 'm_' + Date.now(),
      sender: 'user',
      text,
      time: timeStr,
      action: null
    };

    store.setState(s => {
      return {
        chats: s.chats.map(c => {
          if (c.id === s.activeChatId) {
            return {
              ...c,
              updatedAt: timeStr,
              messages: [...c.messages, userMsg]
            };
          }
          return c;
        })
      };
    });

    soundscape.playChime('chime');
    this.renderActiveChatMessages();

    // Show typing indicator
    const scrollContainer = document.getElementById('chat-scroll-container');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message-row aphrodite';
    typingIndicator.id = 'active-typing-indicator';
    typingIndicator.innerHTML = `
      <img src="/assets/aphrodite_avatar.png" alt="Aphrodite" class="message-avatar">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    scrollContainer.appendChild(typingIndicator);
    scrollContainer.scrollTop = scrollContainer.scrollHeight;

    // Generate Aphrodite reply
    const reply = await aphrodite.generateReply(text);

    // Remove typing indicator
    typingIndicator.remove();

    const aphroditeMsg = {
      id: 'm_' + (Date.now() + 1),
      sender: 'aphrodite',
      text: reply.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: reply.action
    };

    store.setState(s => {
      return {
        chats: s.chats.map(c => {
          if (c.id === s.activeChatId) {
            return {
              ...c,
              updatedAt: aphroditeMsg.time,
              messages: [...c.messages, aphroditeMsg]
            };
          }
          return c;
        })
      };
    });

    soundscape.playChime('bell');
    this.renderActiveChatMessages();
  }

  renderThemeSwatches() {
    const grid = document.getElementById('themes-palette-grid');
    if (!grid) return;
    const currentTheme = store.getState().activeTheme;

    grid.innerHTML = THEMES.map(t => `
      <div class="theme-swatch-card ${t.id === currentTheme ? 'active' : ''}" data-theme-id="${t.id}">
        <div class="theme-colors-preview" style="background: linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 50%, ${t.colors[2]} 100%);"></div>
        <span class="theme-swatch-name">${t.name}</span>
      </div>
    `).join('');

    grid.querySelectorAll('.theme-swatch-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.themeId;
        applyTheme(id);
        store.setState({ activeTheme: id });
        this.renderThemeSwatches();
        showToast(`Embodied theme: ${id} 🌸`, '🎨');
      });
    });
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });

    // Send Button & Input Keydown
    const btnSend = document.getElementById('btn-send-message');
    const inputMsg = document.getElementById('chat-input-text');
    if (btnSend) btnSend.onclick = () => this.sendMessage();
    if (inputMsg) {
      inputMsg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Voice Mic button
    const btnVoice = document.getElementById('btn-voice-input');
    if (btnVoice) btnVoice.onclick = () => this.toggleSpeech();

    // Quick Prompts Bar
    document.querySelectorAll('.quick-prompt-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const action = pill.dataset.action;
        if (action === 'breathe') {
          this.switchView('sanctuary');
        } else if (action === 'selfcare') {
          this.sendMessage('Could you suggest a tender self-care ritual for me right now?');
        } else if (action === 'chat') {
          this.sendMessage('I just wanted to sit and talk with you for a quiet moment.');
        } else if (action === 'water') {
          store.setState(s => ({ waterGlasses: Math.min(s.waterTarget, s.waterGlasses + 1) }));
          soundscape.playChime('chime');
          this.sendMessage('I just drank a glass of water!');
        } else if (action === 'journal') {
          this.switchView('journal');
        }
      });
    });

    // Top Header Action Buttons
    const btnHeaderBreathe = document.getElementById('btn-header-breathe');
    if (btnHeaderBreathe) {
      btnHeaderBreathe.onclick = () => this.switchView('sanctuary');
    }

    const btnHeaderTheme = document.getElementById('btn-header-theme-toggle');
    if (btnHeaderTheme) {
      btnHeaderTheme.onclick = () => this.toggleDayNight();
    }

    const btnSidebarTheme = document.getElementById('btn-sidebar-theme-toggle');
    if (btnSidebarTheme) {
      btnSidebarTheme.onclick = () => this.toggleDayNight();
    }

    // New Chat Modal Triggers
    const btnNewChat = document.getElementById('btn-new-chat');
    const modalNewChat = document.getElementById('modal-new-chat');
    const closeNewChat = document.getElementById('close-new-chat');
    const saveNewChat = document.getElementById('btn-save-new-chat');
    const inputNewChatName = document.getElementById('input-new-chat-name');

    if (btnNewChat && modalNewChat) {
      btnNewChat.onclick = () => {
        modalNewChat.classList.add('active');
        if (inputNewChatName) inputNewChatName.focus();
      };
    }
    if (closeNewChat && modalNewChat) {
      closeNewChat.onclick = () => modalNewChat.classList.remove('active');
    }

    // Preset chat name chips (from moodboard)
    document.querySelectorAll('.preset-chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (inputNewChatName) inputNewChatName.value = chip.dataset.name;
      });
    });

    if (saveNewChat && modalNewChat) {
      saveNewChat.onclick = () => {
        const name = inputNewChatName?.value.trim() || 'My Healing Space';
        const newChat = {
          id: 'chat_' + Date.now(),
          title: name,
          updatedAt: 'Now',
          messages: [
            {
              id: 'm_' + Date.now(),
              sender: 'aphrodite',
              text: `Welcome to "${name}". 🌸 This is your gentle refuge. What is on your mind today?`,
              time: 'Now',
              action: null
            }
          ]
        };
        store.setState(s => ({
          chats: [newChat, ...s.chats],
          activeChatId: newChat.id
        }));
        modalNewChat.classList.remove('active');
        if (inputNewChatName) inputNewChatName.value = '';
        this.renderChatThreads();
        this.renderActiveChatMessages();
      };
    }

    // Settings Modal Triggers
    const btnSettings = document.getElementById('btn-open-settings');
    const btnGear = document.getElementById('btn-gear-settings');
    const modalSettings = document.getElementById('modal-settings');
    const closeSettings = document.getElementById('close-settings');

    const openSettings = () => {
      this.renderThemeSwatches();
      modalSettings?.classList.add('active');
    };
    if (btnSettings) btnSettings.onclick = openSettings;
    if (btnGear) btnGear.onclick = openSettings;
    if (closeSettings) closeSettings.onclick = () => modalSettings?.classList.remove('active');

    // Petals Toggle in settings
    const togglePetals = document.getElementById('toggle-petals');
    if (togglePetals) {
      togglePetals.addEventListener('change', (e) => {
        if (this.petals) this.petals.isRunning = e.target.checked;
        store.setState({ petalsEnabled: e.target.checked });
      });
    }

    // Export Data JSON
    const btnExportData = document.getElementById('btn-export-all-data');
    if (btnExportData) {
      btnExportData.onclick = () => {
        const dataStr = JSON.stringify(store.getState(), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sakura_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    // Clear Data
    const btnClearData = document.getElementById('btn-clear-all-data');
    if (btnClearData) {
      btnClearData.onclick = () => {
        if (confirm('Are you sure you want to restore default factory state?')) {
          localStorage.removeItem('sakura_app_state_v1');
          window.location.reload();
        }
      };
    }
  }

  toggleDayNight() {
    const current = store.getState().activeTheme;
    const nextTheme = current === 'sakura' ? 'lunar' : 'sakura';
    applyTheme(nextTheme);
    store.setState({ activeTheme: nextTheme });
    this.renderThemeSwatches();
    soundscape.playChime('chime');
    showToast(nextTheme === 'sakura' ? 'Embodied Day Mode (Cherry Blossom) 🌸' : 'Embodied Night Mode (Lily Glow) 🪷', '🌙');
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new SakuraApp();
  app.init();
  window.__sakuraApp = app;
});

// ==========================================================================
// Aphrodite — Complete Personal Sanctuary Master Engine
// Integrates 15 Dramatic Themes, Aphrodite Companion Chat, Planning Calendar,
// Goals Dashboard, and Popup Reminder Nudges
// ==========================================================================

import { PetalsSystem } from './petals.js';
import { soundscape } from './audio.js';
import { THEMES, applyTheme } from './themes.js';

const STORAGE_KEY = 'aphrodite_sanctuary_complete_v2';

// Initialize Supabase safely using user credentials
const SUPABASE_URL = "https://pdkcnzijkatvfnqoscyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_u33iAqv6v8ujn7cxrqPMKA_Lsrw1voE";
const supabase = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const NUDGE_MESSAGES = [
  { id: 'water', icon: '💧', title: 'Hydration Sanctuary', text: 'Remember to drink water — a gentle cool sip restores your bloom.' },
  { id: 'sleep', icon: '🌙', title: 'Early Rest', text: 'Go to bed early tonight. Give your temple the sacred, unhurried rest it deserves.' },
  { id: 'junk', icon: '🍎', title: 'Mindful Nourishment', text: 'Don’t eat mindless junk food — feed your cells clean foods that gift you vibrant life.' },
  { id: 'posture', icon: '🧘', title: 'Spine & Jaw', text: 'Unclench your jaw, roll your shoulders back, and let your spine lengthen.' }
];

const DEFAULT_STATE = {
  activeTheme: 'sakura',
  rituals: { r1: false, r2: false, r3: false },
  currentMood: 'peaceful',
  savedInspiration: false,
  reminders: {
    water: true,
    sleep: true,
    junk: true,
    posture: true,
    intervalSeconds: 90
  },
  customReminders: [
    { id: 'cr_1', title: 'Take Evening Magnesium', note: 'Restores muscle recovery & calm nervous system', time: '09:30 PM', icon: '💊', active: true },
    { id: 'cr_2', title: 'Afternoon Sunlight & Fresh Air', note: '10 minutes of fresh air to reset circadian rhythm', time: '02:00 PM', icon: '☀️', active: true },
    { id: 'cr_3', title: 'Mindful Green Tea Break', note: 'Unclench jaw and sip without checking phone', time: '04:30 PM', icon: '🍵', active: true }
  ],
  waterCups: 4,
  // Aphrodite chat messages focused on physical wellness, deficiencies, daily praise
  chatMessages: [
    {
      id: 'msg_1',
      sender: 'aphrodite',
      text: 'Welcome, beloved. I am Aphrodite. You may speak to me openly of your physical deficiencies, fatigue, or where your body feels neglected today.\n\nTell me: how did you treat your temple, and what is your body asking for?',
      action: null,
      time: 'Just now'
    }
  ],
  // Sacred Journal with 15 Dramatic Themes
  journalChapters: [
    {
      id: 'chap_1',
      title: 'A morning by the sea',
      themeId: 'ocean',
      mood: 5,
      date: 'Today, 08:30 AM',
      content: 'I woke early to watch the turquoise tide wash over the stones. I noticed that when I stop rushing, every moment opens up like a rose.\n\nRenewal is not about forcing growth; it is about softening the soil.'
    },
    {
      id: 'chap_2',
      title: 'Midnight reflections under stars',
      themeId: 'lunar',
      mood: 4,
      date: 'Yesterday, 11:15 PM',
      content: 'Sitting in the quiet glow of moonlight. I noticed that when I stop pushing the river, everything begins to find its rightful place.\n\nA missed day is not a verdict. It is marble not yet carved.'
    },
    {
      id: 'chap_3',
      title: 'Grounding in the deep pine moss',
      themeId: 'forest',
      mood: 4,
      date: '3 days ago',
      content: 'Spent thirty minutes under ancient trees. The earthy scent of damp pine needles brought me back to my breath.'
    }
  ],
  activeChapterId: 'chap_1',
  // Planning Calendar Events
  calendarEvents: [
    { id: 'ev_1', date: 10, title: '💧 8 Glasses Water', type: 'daily' },
    { id: 'ev_2', date: 10, title: '🌙 Sleep by 10 PM', type: 'daily' },
    { id: 'ev_3', date: 12, title: '🍎 Whole Foods Meal Prep', type: 'weekly' },
    { id: 'ev_4', date: 14, title: '🌿 Nature Walk & Rest', type: 'weekly' },
    { id: 'ev_5', date: 15, title: '📖 Sacred Reflection', type: 'daily' }
  ],
  // Goals To Get Done Dashboard
  dailyGoals: [
    { id: 'g_1', title: 'Drink 8 tall glasses of water throughout the day', streak: 6, completed: true, category: 'body' },
    { id: 'g_2', title: 'No mindless junk food — choose nourishing whole snacks', streak: 4, completed: false, category: 'body' },
    { id: 'g_3', title: 'Prepare for bed and turn off screens by 10:15 PM', streak: 3, completed: false, category: 'body' },
    { id: 'g_4', title: 'Roll shoulders back and do 5-min spine alignment stretch', streak: 12, completed: true, category: 'body' }
  ],
  weeklyGoals: [
    { id: 'wg_1', title: 'Hydration Sanctuary (8 cups daily)', current: 5, target: 7 },
    { id: 'wg_2', title: 'Clean Temple (Mindful eating, zero junk days)', current: 4, target: 5 },
    { id: 'wg_3', title: 'Early Dusk Rest (In bed before 10:30 PM)', current: 3, target: 4 }
  ],
  quests: [
    { id: 'q_1', title: 'Brew hot chamomile tea instead of having late-night chips', domain: 'body', priority: 'urgent', completed: false },
    { id: 'q_2', title: 'Unclench jaw, stretch neck gently for 3 minutes', domain: 'body', priority: 'flow', completed: false },
    { id: 'q_3', title: 'Write 5 lines of gratitude in Sacred Journal', domain: 'spirit', priority: 'flow', completed: true },
    { id: 'q_4', title: 'Drink two tall glasses of cool water right now', domain: 'body', priority: 'urgent', completed: false }
  ]
};

class MasterSanctuaryApp {
  constructor() {
    this.petals = null;
    this.state = this.loadState();
    this.nudgeTimer = null;
    this.activeDeficiency = 'Mindless eating / Bloated';
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          customReminders: parsed.customReminders && parsed.customReminders.length > 0
            ? parsed.customReminders
            : DEFAULT_STATE.customReminders
        };
      }
    } catch (e) { }
    return DEFAULT_STATE;
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) { }
  }

  init() {
    // 1. Petals Canvas
    const canvas = document.getElementById('petals-canvas');
    if (canvas) {
      this.petals = new PetalsSystem(canvas);
    }

    // 2. Set Active Theme
    applyTheme(this.state.activeTheme || 'sakura');

    // 3. Set Date
    const dateLabel = document.querySelector('.date-label');
    if (dateLabel) {
      const now = new Date();
      dateLabel.textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // 4. Initialize All Sections
    this.initNavigation();
    this.initAphroditeChat();
    this.initJournal();
    this.initCalendar();
    this.initGoals();
    this.initReminders();
    this.initBreathingAndSound();
    this.initHeaderActions();

    // 5. Start Background Popup Reminders
    this.startPopupReminderLoop();

    // 6. Connect Aphrodite Habit Ingestion & Supabase
    window.addHabitFromAphrodite = (habitText) => this.addHabitFromAphrodite(habitText);
    this.loadHabitsFromSupabase();
  }

  toast(message, icon = '🌸') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-bubble';
    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  initNavigation() {
    const navLinks = document.querySelectorAll('.navigation a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    const themeDropdown = document.getElementById('header-theme-selector');
    if (themeDropdown) {
      themeDropdown.value = this.state.activeTheme || 'sakura';
      themeDropdown.addEventListener('change', (e) => {
        const themeId = e.target.value;
        this.switchTheme(themeId);
      });
    }

    // Mobile Drawer Toggle
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-mobile-nav');
    const drawerBackdrop = document.getElementById('mobile-nav-backdrop');

    const openDrawer = () => {
      if (mobileDrawer) {
        mobileDrawer.classList.add('open');
        mobileDrawer.setAttribute('aria-hidden', 'false');
      }
    };

    const closeDrawer = () => {
      if (mobileDrawer) {
        mobileDrawer.classList.remove('open');
        mobileDrawer.setAttribute('aria-hidden', 'true');
      }
    };

    if (mobileMenuBtn) mobileMenuBtn.onclick = openDrawer;
    if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
    if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

    // Mobile Drawer link clicks
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        closeDrawer();
      });
    });

    // Mobile Bottom Tab Bar clicks
    const bottomTabBtns = document.querySelectorAll('.mobile-tab-btn');
    bottomTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        bottomTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Scroll spy: synchronize active link with currently visible section
    const sections = document.querySelectorAll('section[id]');
    if ('IntersectionObserver' in window && sections.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            // update bottom bar
            bottomTabBtns.forEach(btn => {
              if (btn.getAttribute('href') === `#${id}`) {
                bottomTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
              }
            });
            // update desktop nav
            navLinks.forEach(link => {
              if (link.getAttribute('href') === `#${id}`) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
              }
            });
          }
        });
      }, { rootMargin: '-20% 0px -60% 0px' });

      sections.forEach(sec => observer.observe(sec));
    }
  }

  switchTheme(themeId) {
    this.state.activeTheme = themeId;
    this.saveState();
    applyTheme(themeId);

    // Update theme dropdowns
    const hSelect = document.getElementById('header-theme-selector');
    if (hSelect) hSelect.value = themeId;

    // Update active chapter theme if in journal
    const activeChap = this.state.journalChapters.find(c => c.id === this.state.activeChapterId);
    if (activeChap) {
      activeChap.themeId = themeId;
      this.saveState();
      this.renderJournal();
    }

    soundscape.playChime('chime');
    this.toast(`Sanctuary transformed into ${themeId.toUpperCase()} palette! 🎨`, '✨');
  }

  // =========================================================================
  // APHRODITE WELLNESS & PHYSICAL DEFICIENCY CHATBOT (CONNECTED TO BACKEND)
  // =========================================================================
  initAphroditeChat() {
    this.renderChatMessages();

    const input = document.querySelector('#chat-input, #chat-message-input');
    const sendBtn = document.getElementById('btn-send-chat');

    // When the user clicks Send:
    const handleSend = async () => {
      const message = input ? input.value.trim() : '';
      if (!message) return;
      if (input) input.value = '';
      await this.handleSendChatMessage(message);
    };

    if (sendBtn) sendBtn.onclick = handleSend;
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    // Deficiency quick prompt buttons
    const deficiencyChips = document.querySelectorAll('.deficiency-chip-btn');
    deficiencyChips.forEach(btn => {
      btn.addEventListener('click', async () => {
        deficiencyChips.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const text = btn.dataset.prompt;
        const tag = btn.textContent.trim().replace(/^[\p{Emoji}\s]+/u, '') || 'Physical Deficiency';
        this.activeDeficiency = tag;
        await this.handleSendChatMessage(text, this.activeDeficiency);
      });
    });

    // Voice dictation mic
    const micBtn = document.getElementById('btn-chat-mic');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          this.toast('Speech recognition is not supported in this browser.', '🎙️');
          return;
        }
        const rec = new SpeechRec();
        rec.lang = 'en-US';
        rec.onstart = () => {
          micBtn.style.color = '#ef4444';
          this.toast('Listening to your voice with warmth...', '🎙️');
        };
        rec.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          if (input) input.value = transcript;
          this.handleSendChatMessage(transcript);
        };
        rec.onend = () => { micBtn.style.color = 'var(--muted-foreground)'; };
        rec.start();
      });
    }
  }

  // 1. Show the message on the screen right away and persist state
  addMessageToScreen(sender, text, action = null) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.state.chatMessages.push({
      id: 'msg_' + Date.now() + Math.random().toString(36).substr(2, 4),
      sender,
      text,
      action,
      time: timeStr
    });
    this.saveState();
    this.renderChatMessages();
  }

  // 2. Connect to backend server (which calls Gemini)
  async handleSendChatMessage(message, deficiencyOverride = null) {
    if (!message || !message.trim()) return;
    const cleanMessage = message.trim();
    const deficiency = deficiencyOverride || this.activeDeficiency || "Mindless eating / Bloated";

    // 1. Show the user's message on the screen right away
    this.addMessageToScreen("user", cleanMessage);
    soundscape.playChime('chime');

    // Display temporary holding space / thinking indicator
    const tempThinkingId = 'thinking_' + Date.now();
    this.state.chatMessages.push({
      id: tempThinkingId,
      sender: 'aphrodite',
      text: 'Aphrodite is listening and holding space for your body...',
      isThinking: true,
      time: 'Now'
    });
    this.renderChatMessages();

    // 2. Ask backend server (which asks Gemini)
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          physicalDeficiency: deficiency
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      // Remove thinking indicator
      this.state.chatMessages = this.state.chatMessages.filter(m => m.id !== tempThinkingId);

      if (data && data.reply) {
        // Extract any suggested micro-habit / action
        let action = null;
        const match = data.reply.match(/(?:micro-habit|micro-step|One small step|gentle step|habit)[^:\n]*[:\-–]\s*([^\n\.]+)/i);
        if (match) {
          const cleanText = match[1].replace(/\*\*/g, '').replace(/^[“"']|[”"']$/g, '').trim();
          action = { title: cleanText, category: 'body' };
        } else {
          // If bold action or specific step is emphasized in quotes
          const boldMatch = data.reply.match(/\*\*([A-Z][^\*\n]{10,80})\*\*/);
          if (boldMatch) {
            action = { title: boldMatch[1].trim(), category: 'body' };
          }
        }

        // 3. Display Aphrodite's real generated reply!
        this.addMessageToScreen("aphrodite", data.reply, action);
        soundscape.playChime('bell');
        if (this.petals) this.petals.celebrate();
      } else {
        throw new Error("Empty reply returned");
      }

    } catch (error) {
      console.error("Could not reach Aphrodite server:", error);

      // Remove thinking indicator
      this.state.chatMessages = this.state.chatMessages.filter(m => m.id !== tempThinkingId);

      // Graceful local fallback so user experience is always protected
      const fallback = this.generateAphroditeAdvice(cleanMessage);
      this.addMessageToScreen("aphrodite", fallback.text, fallback.action);
      soundscape.playChime('bell');
    }
  }

  // =========================================================================
  // SUPABASE HABIT SYNC & MICRO-HABITS INTEGRATION
  // =========================================================================
  async addHabitFromAphrodite(habitText) {
    if (!habitText) return;
    const cleanHabit = habitText.trim().replace(/\*\*/g, '').replace(/^[“"']|[”"']$/g, '');

    // 1. Insert into Supabase table `habits`
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('habits')
          .insert([
            { title: cleanHabit, category: 'body', completed: false }
          ]);
        if (error) {
          console.error("Error inserting habit into Supabase table `habits`:", error);
          // Try inserting with 'name' column in case schema uses 'name' instead of 'title'
          await supabase.from('habits').insert([{ name: cleanHabit }]);
        } else {
          console.log("Successfully inserted habit into Supabase `habits`:", data);
        }
      } catch (err) {
        console.warn("Could not insert into Supabase habits table:", err);
      }
    }

    // 2. Append new habit item into your "Daily Micro-Habits" section on the page
    const existing = this.state.dailyGoals.find(g => g.title.toLowerCase() === cleanHabit.toLowerCase());
    if (!existing) {
      this.state.dailyGoals.push({
        id: 'g_' + Date.now(),
        title: cleanHabit,
        streak: 1,
        completed: false,
        category: 'body'
      });
    } else {
      existing.streak = (existing.streak || 1) + 1;
    }

    this.saveState();
    this.renderGoals();

    // Celebration feedback
    soundscape.playChime('bell');
    if (this.petals) this.petals.celebrate();
    this.toast(`"${cleanHabit}" added to Daily Micro-Habits! 🌿`, '✨');
  }

  async loadHabitsFromSupabase() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        let changed = false;
        data.forEach(item => {
          const habitName = item.title || item.name;
          if (habitName && !this.state.dailyGoals.some(g => g.title.toLowerCase() === habitName.toLowerCase())) {
            this.state.dailyGoals.push({
              id: item.id || ('g_' + Date.now() + Math.random().toString(36).substr(2, 4)),
              title: habitName,
              streak: item.streak || 1,
              completed: !!item.completed,
              category: item.category || 'body'
            });
            changed = true;
          }
        });
        if (changed) {
          this.saveState();
          this.renderGoals();
        }
      }
    } catch (e) {
      console.warn("Could not load habits from Supabase:", e);
    }
  }

  // Alias for backward compatibility
  sendChatMessage(text, deficiency) {
    return this.handleSendChatMessage(text, deficiency);
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = this.state.chatMessages.map(msg => {
      const isAphrodite = msg.sender === 'aphrodite';

      if (msg.isThinking) {
        return `
          <div class="chat-bubble-row aphrodite">
            <img src="/assets/aphrodite_avatar.png" alt="Aphrodite" class="chat-bubble-avatar">
            <div class="chat-bubble-card">
              <span class="chat-bubble-thinking">
                <span class="dot-pulse">🌸</span> Aphrodite is listening and holding space...
              </span>
            </div>
          </div>
        `;
      }

      const formattedHtml = this.formatMessageMarkdown(msg.text);

      return `
        <div class="chat-bubble-row ${isAphrodite ? 'aphrodite' : 'user'}">
          ${isAphrodite ? `<img src="/assets/aphrodite_avatar.png" alt="Aphrodite" class="chat-bubble-avatar">` : ''}
          <div class="chat-bubble-card">
            <p>${formattedHtml}</p>
            ${msg.action ? `
              <div class="action-suggested-card">
                <span>✨ <b>Aphrodite's advice:</b> ${this.escapeHtml(msg.action.title)}</span>
                <button class="btn-quick-add-goal" data-action="${this.escapeHtml(msg.action.title)}" data-category="${msg.action.category || 'body'}">
                  + Add to Daily Micro-Habits
                </button>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: ${isAphrodite ? 'var(--muted-foreground)' : 'rgba(255,255,255,0.7)'}; margin-top: 6px; text-align: right;">
              ${msg.time || 'Now'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach "+ Add to Daily Micro-Habits" buttons -> triggers addHabitFromAphrodite
    container.querySelectorAll('.btn-quick-add-goal').forEach(btn => {
      btn.addEventListener('click', async () => {
        const actionTitle = btn.dataset.action;
        btn.textContent = '⏳ Saving...';
        btn.disabled = true;

        await this.addHabitFromAphrodite(actionTitle);

        btn.textContent = '✓ Added to Micro-Habits';
        btn.style.background = '#10B981';
      });
    });

    container.scrollTop = container.scrollHeight;
  }

  formatMessageMarkdown(text) {
    if (!text) return '';
    let safe = this.escapeHtml(text);
    // bold **text**
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // italic *text*
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // newlines to <br>
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  generateAphroditeAdvice(userText) {
    const lower = userText.toLowerCase();
    let text = '';
    let action = null;

    if (lower.includes('water') || lower.includes('dehydrat') || lower.includes('dry') || lower.includes('thirsty')) {
      text = `I praise your honesty in naming this, sweet soul. When you forget water, your cells become like parched flower petals awaiting rain.\n\nDo not scold yourself for forgetting. Your body carried you through everything today regardless. Let us nourish your temple right this moment.\n\nOne small step: Drink two tall glasses of cool water slowly, feeling each drop restore your bloom.`;
      action = { title: 'Drink 2 tall glasses of cool water', category: 'body' };
    }
    else if (lower.includes('junk') || lower.includes('sugar') || lower.includes('eating') || lower.includes('snack') || lower.includes('fast food')) {
      text = `Notice how you chose to share this with me rather than hiding in shame. That awareness is sacred courage, darling.\n\nYour cravings were likely an attempt by your nervous system to soothe exhaustion or stress. Forgive yourself for the lapse; your temple is not ruined. Today we begin anew.\n\nOne small step: Pour a warm cup of herbal tea or enjoy a crisp apple, and let your digestion rest.`;
      action = { title: 'Choose herbal tea or fruit instead of junk food', category: 'body' };
    }
    else if (lower.includes('neck') || lower.includes('posture') || lower.includes('back') || lower.includes('slouch') || lower.includes('stiff')) {
      text = `You carry so much of the world’s weight in the curvature of your neck and shoulders, beloved. Look at how hard your spine has worked to hold you upright today.\n\nLet us honor your back with gentle release rather than frustration.\n\nOne small step: Unclench your jaw, roll your shoulders backward 5 times, and take three long sighs.`;
      action = { title: '5 shoulder rolls & neck alignment stretches', category: 'body' };
    }
    else if (lower.includes('sleep') || lower.includes('late') || lower.includes('tired') || lower.includes('exhaust') || lower.includes('screen')) {
      text = `Your weary eyes are asking for peace, sweet child. Staying up late is often revenge bedtime procrastination when the day gave you no quiet of your own.\n\nI praise you for how hard you worked today. But now the sun has set. You do not have to prove anything more tonight.\n\nOne small step: Dim your screens, place your phone across the room, and get into bed before 10:15 PM.`;
      action = { title: 'Go to bed early before 10:15 PM', category: 'body' };
    }
    else if (lower.includes('tired') || lower.includes('behind') || lower.includes('lazy') || lower.includes('day') || lower.includes('did i do enough')) {
      text = `Radiant one, listen closely: you are enough, exactly as you are right now. A body that survived today deserves reverence, not harsh judgment.\n\nYou do not have to conquer the whole kingdom tonight. Only breathe and be kind to the human in the mirror.\n\nOne small step: Place a gentle warm hand over your heart for ten quiet seconds and whisper: "I am doing my best."`;
      action = { title: '10 seconds of resting hand on heart with kindness', category: 'spirit' };
    }
    else {
      text = `I hear you so deeply, darling. Your body is a sacred temple that has carried every feeling, thought, and step you have ever taken.\n\nWhen we listen to our deficiencies with love rather than punishment, they transform into gentle guidance.\n\nOne small step: Drink a tall glass of cool water and take five slow, grounded breaths.`;
      action = { title: 'Drink a glass of water and take 5 slow breaths', category: 'body' };
    }

    return { text, action };
  }

  // =========================================================================
  // SACRED JOURNAL WITH 15 DRAMATIC THEMES
  // =========================================================================
  initJournal() {
    this.renderJournal();

    const newBtn = document.getElementById('btn-new-chapter');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        const newChap = {
          id: 'chap_' + Date.now(),
          title: 'A new chapter of tenderness',
          themeId: this.state.activeTheme || 'sakura',
          mood: 5,
          date: 'Just now',
          content: ''
        };
        this.state.journalChapters.unshift(newChap);
        this.state.activeChapterId = newChap.id;
        this.saveState();
        this.renderJournal();
        this.toast('New chapter blossomed in your journal 🌸');
      });
    }

    const titleInput = document.getElementById('active-journal-title');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const chap = this.state.journalChapters.find(c => c.id === this.state.activeChapterId);
        if (chap) {
          chap.title = e.target.value;
          this.saveState();
        }
      });
    }

    const contentInput = document.getElementById('active-journal-content');
    if (contentInput) {
      contentInput.addEventListener('input', (e) => {
        const chap = this.state.journalChapters.find(c => c.id === this.state.activeChapterId);
        if (chap) {
          chap.content = e.target.value;
          this.saveState();
        }
      });
    }

    const inspireBtn = document.getElementById('btn-journal-inspire');
    if (inspireBtn) {
      inspireBtn.addEventListener('click', () => {
        const prompts = [
          'What is one physical signal your body sent you today that you ignored?',
          'If your heart could speak without fear, what nourishment would it ask for?',
          'Where did you show quiet, unseen courage today?',
          'What standard of perfection are you ready to surrender tonight?'
        ];
        const p = prompts[Math.floor(Math.random() * prompts.length)];
        const area = document.getElementById('active-journal-content');
        if (area) {
          const sep = area.value ? '\n\n' : '';
          area.value += `${sep}✨ *Reflection Prompt:* ${p}\n`;
          const chap = this.state.journalChapters.find(c => c.id === this.state.activeChapterId);
          if (chap) {
            chap.content = area.value;
            this.saveState();
          }
          soundscape.playChime('chime');
        }
      });
    }
  }

  renderJournal() {
    const listEl = document.getElementById('chapters-list-container');
    const activeChap = this.state.journalChapters.find(c => c.id === this.state.activeChapterId) || this.state.journalChapters[0];

    if (listEl) {
      listEl.innerHTML = this.state.journalChapters.map(chap => {
        const isActive = chap.id === activeChap?.id;
        return `
          <div class="chapter-item-btn ${isActive ? 'active' : ''}" data-chap-id="${chap.id}">
            <h4>${chap.title || 'Untitled'}</h4>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
              <p>${chap.date}</p>
              <span style="font-size: 9px; text-transform: uppercase; color: var(--primary); font-weight: 600;">
                ${chap.themeId}
              </span>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.chapter-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.chapId;
          this.state.activeChapterId = id;
          const chosen = this.state.journalChapters.find(c => c.id === id);
          if (chosen && chosen.themeId) {
            this.switchTheme(chosen.themeId);
          }
          this.saveState();
          this.renderJournal();
        });
      });
    }

    // Update active editor inputs
    const titleInput = document.getElementById('active-journal-title');
    const contentInput = document.getElementById('active-journal-content');
    if (titleInput && activeChap) titleInput.value = activeChap.title;
    if (contentInput && activeChap) contentInput.value = activeChap.content;

    // Render 15 Theme Swatches in Journal Toolbar
    const galleryEl = document.getElementById('journal-themes-swatches');
    if (galleryEl) {
      galleryEl.innerHTML = THEMES.map(t => {
        const isCurrent = t.id === (activeChap?.themeId || this.state.activeTheme);
        return `
          <div class="theme-swatch-mini ${isCurrent ? 'active' : ''}" data-theme="${t.id}" title="${t.name}">
            <div class="swatch-color-bar" style="background: linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]});"></div>
            <span>${t.name.split(' ')[0]}</span>
          </div>
        `;
      }).join('');

      galleryEl.querySelectorAll('.theme-swatch-mini').forEach(swatch => {
        swatch.addEventListener('click', () => {
          const tid = swatch.dataset.theme;
          this.switchTheme(tid);
        });
      });
    }
  }

  // =========================================================================
  // PLANNING CALENDAR & EVENT SCHEDULER
  // =========================================================================
  initCalendar() {
    this.renderCalendar();

    const addEventBtn = document.getElementById('btn-add-calendar-event');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => {
        const title = prompt('Enter Self-Care Event or Goal (e.g. 💧 Drink 8 cups, 🌙 Sleep at 10pm):');
        if (title && title.trim()) {
          const day = prompt('Enter Day of the Month (1 to 31):', '10');
          const dayNum = parseInt(day) || 10;
          this.state.calendarEvents.push({
            id: 'ev_' + Date.now(),
            date: dayNum,
            title: title.trim(),
            type: 'daily'
          });
          this.saveState();
          this.renderCalendar();
          soundscape.playChime('chime');
          this.toast(`Event scheduled for day ${dayNum}! 📅`);
        }
      });
    }
  }

  renderCalendar() {
    const tableBody = document.getElementById('calendar-grid-body');
    if (!tableBody) return;

    // Build October 2026 grid (starts on Thursday)
    const daysInMonth = 31;
    const startOffset = 4; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
    let html = '<tr>';
    let col = 0;

    for (let i = 0; i < startOffset; i++) {
      html += '<td style="background: var(--muted); opacity: 0.4;"></td>';
      col++;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === 10;
      const events = this.state.calendarEvents.filter(e => e.date === day);

      html += `
        <td class="${isToday ? 'today' : ''}" data-day="${day}">
          <div class="day-number">${day} ${isToday ? '• Today' : ''}</div>
          ${events.map(ev => `<span class="calendar-event-tag">${ev.title}</span>`).join('')}
        </td>
      `;
      col++;

      if (col === 7 && day < daysInMonth) {
        html += '</tr><tr>';
        col = 0;
      }
    }

    while (col > 0 && col < 7) {
      html += '<td style="background: var(--muted); opacity: 0.4;"></td>';
      col++;
    }
    html += '</tr>';

    tableBody.innerHTML = html;

    // Click on day cell to schedule quick event
    tableBody.querySelectorAll('td[data-day]').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = cell.dataset.day;
        const task = prompt(`Add a self-care goal for Day ${d}:`);
        if (task && task.trim()) {
          this.state.calendarEvents.push({
            id: 'ev_' + Date.now(),
            date: parseInt(d),
            title: task.trim(),
            type: 'daily'
          });
          this.saveState();
          this.renderCalendar();
          soundscape.playChime('bell');
          this.toast(`Scheduled on day ${d}! 🌿`);
        }
      });
    });
  }

  // =========================================================================
  // GOALS TO GET DONE DASHBOARD
  // =========================================================================
  initGoals() {
    this.renderGoals();

    const addHabitBtn = document.getElementById('btn-add-daily-goal');
    if (addHabitBtn) {
      addHabitBtn.addEventListener('click', () => {
        const text = prompt('Enter Daily Goal / Physical Care Habit:');
        if (text && text.trim()) {
          this.state.dailyGoals.push({
            id: 'g_' + Date.now(),
            title: text.trim(),
            streak: 1,
            completed: false,
            category: 'body'
          });
          this.saveState();
          this.renderGoals();
          soundscape.playChime('chime');
          this.toast('New daily goal placed on your horizon! 🌿');
        }
      });
    }

    const addQuestBtn = document.getElementById('btn-add-quest-item');
    if (addQuestBtn) {
      addQuestBtn.addEventListener('click', () => {
        const text = prompt('Enter Quest to get done:');
        if (text && text.trim()) {
          this.state.quests.push({
            id: 'q_' + Date.now(),
            title: text.trim(),
            domain: 'body',
            priority: 'urgent',
            completed: false
          });
          this.saveState();
          this.renderGoals();
          soundscape.playChime('chime');
          this.toast('Quest placed on your board! 🗺️');
        }
      });
    }
  }

  renderGoals() {
    // 1. Daily Habits List
    const dailyContainer = document.getElementById('daily-goals-container');
    if (dailyContainer) {
      dailyContainer.innerHTML = this.state.dailyGoals.map(goal => `
        <div class="habit-row-item ${goal.completed ? 'done' : ''}" data-id="${goal.id}">
          <div style="display: flex; align-items: center;">
            <div class="habit-check-btn" data-goal-id="${goal.id}">
              ${goal.completed ? '✓' : ''}
            </div>
            <span style="font-size: 13.5px; font-weight: 500;">${goal.title}</span>
          </div>
          <span style="font-size: 11.5px; color: var(--primary); font-weight: 600;">🔥 ${goal.streak}d</span>
        </div>
      `).join('');

      dailyContainer.querySelectorAll('.habit-check-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.goalId;
          const g = this.state.dailyGoals.find(item => item.id === id);
          if (g) {
            g.completed = !g.completed;
            g.streak = g.completed ? g.streak + 1 : Math.max(0, g.streak - 1);
            this.saveState();
            this.renderGoals();

            if (g.completed) {
              soundscape.playChime('bell');
              if (this.petals) this.petals.celebrate();
              this.toast(`Radiant! Completed: "${g.title}" 🌸`, '✨');
            }
          }
        });
      });
    }

    // 2. Weekly Targets
    const weeklyContainer = document.getElementById('weekly-targets-container');
    if (weeklyContainer) {
      weeklyContainer.innerHTML = this.state.weeklyGoals.map(wg => {
        const percent = Math.min(100, Math.round((wg.current / wg.target) * 100));
        return `
          <div style="border: 1px solid var(--border); padding: 12px; border-radius: 4px; background: var(--muted); margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;">
              <span>${wg.title}</span>
              <span style="color: var(--primary);">${wg.current} / ${wg.target} days</span>
            </div>
            <div class="progress-track-bar">
              <div class="progress-fill-bar" style="width: ${percent}%;"></div>
            </div>
            <button class="tool-btn-inc" data-wg-id="${wg.id}" style="margin-top: 6px; font-size: 11px; color: var(--primary); cursor: pointer;">
              + Log Progress Today
            </button>
          </div>
        `;
      }).join('');

      weeklyContainer.querySelectorAll('.tool-btn-inc').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.wgId;
          const wg = this.state.weeklyGoals.find(w => w.id === id);
          if (wg) {
            wg.current = Math.min(wg.target, wg.current + 1);
            this.saveState();
            this.renderGoals();
            soundscape.playChime('bell');
            if (this.petals) this.petals.celebrate();
            this.toast(`Progress recorded for ${wg.title}! 🌸`);
          }
        });
      });
    }

    // 3. Quests Board
    const questContainer = document.getElementById('quests-board-container');
    if (questContainer) {
      questContainer.innerHTML = this.state.quests.map(q => `
        <div class="habit-row-item ${q.completed ? 'done' : ''}" data-quest-id="${q.id}">
          <div style="display: flex; align-items: center;">
            <div class="habit-check-btn" data-qid="${q.id}">
              ${q.completed ? '✓' : ''}
            </div>
            <span style="font-size: 13px;">${q.title}</span>
          </div>
          <span style="font-size: 10px; padding: 2px 7px; border-radius: 3px; background: var(--secondary); color: var(--primary); text-transform: uppercase;">
            ${q.priority}
          </span>
        </div>
      `).join('');

      questContainer.querySelectorAll('.habit-check-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.qid;
          const q = this.state.quests.find(item => item.id === id);
          if (q) {
            q.completed = !q.completed;
            this.saveState();
            this.renderGoals();
            if (q.completed) {
              soundscape.playChime('bell');
              if (this.petals) this.petals.celebrate();
              this.toast(`Quest completed: "${q.title}"! 🕊️`);
            }
          }
        });
      });
    }
  }

  // =========================================================================
  // POPUP NOTIFICATIONS & GENTLE REMINDERS LOOP
  // =========================================================================
  initReminders() {
    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = !!this.state.reminders[key];
        el.addEventListener('change', (e) => {
          this.state.reminders[key] = e.target.checked;
          this.saveState();
          this.toast(`${key.toUpperCase()} reminders updated. 🔔`);
        });
      }
    };

    bindToggle('toggle-remind-water', 'water');
    bindToggle('toggle-remind-sleep', 'sleep');
    bindToggle('toggle-remind-junk', 'junk');
    bindToggle('toggle-remind-posture', 'posture');

    const testBtn = document.getElementById('btn-test-nudge-popup');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.triggerRandomNudge();
      });
    }

    const browserNotifyBtn = document.getElementById('btn-browser-notifications');
    if (browserNotifyBtn) {
      browserNotifyBtn.addEventListener('click', () => {
        if ('Notification' in window) {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
              this.toast('Browser system alerts enabled for your sanctuary! 🔔');
              new Notification('Aphrodite Sanctuary 🌸', {
                body: 'Remember to drink water and treat your temple gently.',
                icon: '/assets/aphrodite_avatar.png'
              });
            } else {
              this.toast('In-app popup toasts will hold space instead. 🕊️');
            }
          });
        }
      });
    }

    // Custom Reminders Setup
    this.renderCustomReminders();

    // Icon Selector in Custom Reminder Form
    const iconPills = document.querySelectorAll('#icon-picker-group .icon-pick-btn');
    const selectedIconInput = document.getElementById('custom-rem-selected-icon');
    if (iconPills.length && selectedIconInput) {
      iconPills.forEach(btn => {
        btn.addEventListener('click', () => {
          iconPills.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedIconInput.value = btn.dataset.icon || '🌸';
        });
      });
    }

    // Add Manual Reminder Form Submission
    const addForm = document.getElementById('form-add-custom-reminder');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('custom-rem-title');
        const noteInput = document.getElementById('custom-rem-note');
        const timeInput = document.getElementById('custom-rem-time');
        const iconInput = document.getElementById('custom-rem-selected-icon');

        const title = titleInput ? titleInput.value.trim() : '';
        if (!title) return;

        const note = noteInput ? noteInput.value.trim() : '';
        const time = timeInput ? timeInput.value.trim() : '';
        const icon = iconInput ? iconInput.value : '🌸';

        if (!Array.isArray(this.state.customReminders)) {
          this.state.customReminders = [];
        }

        const newReminder = {
          id: 'cr_' + Date.now(),
          title,
          note,
          time,
          icon,
          active: true
        };

        this.state.customReminders.unshift(newReminder);
        this.saveState();
        this.renderCustomReminders();

        if (titleInput) titleInput.value = '';
        if (noteInput) noteInput.value = '';
        if (timeInput) timeInput.value = '';

        soundscape.playChime('bell');
        if (this.petals) this.petals.celebrate();
        this.toast(`Added gentle reminder: "${title}" ✨`, icon);
      });
    }
  }

  renderCustomReminders() {
    const container = document.getElementById('custom-reminders-container');
    const countBadge = document.getElementById('custom-reminders-count');
    if (!container) return;

    const list = this.state.customReminders || [];
    const activeCount = list.filter(r => r.active).length;

    if (countBadge) {
      countBadge.textContent = `${activeCount} active / ${list.length} total`;
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="custom-reminders-empty">
          <p style="font-family: var(--font-display); font-size: 18px; color: var(--foreground); margin-bottom: 6px;">
            No custom reminders yet 🕊️
          </p>
          <p>Create your first bespoke gentle nudge above to guide your day.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(cr => `
      <div class="custom-reminder-card" data-rem-id="${cr.id}">
        <div class="custom-reminder-main">
          <div class="custom-reminder-icon">${cr.icon || '🌸'}</div>
          <div class="custom-reminder-details">
            <h4>${this.escapeHtml(cr.title)}</h4>
            ${cr.note ? `<p>${this.escapeHtml(cr.note)}</p>` : ''}
            ${cr.time ? `<span class="custom-rem-badge">⏰ ${this.escapeHtml(cr.time)}</span>` : ''}
          </div>
        </div>
        <div class="custom-rem-actions">
          <label class="toggle-switch-ios" title="Toggle active">
            <input type="checkbox" class="toggle-custom-rem" data-id="${cr.id}" ${cr.active ? 'checked' : ''}>
            <span class="toggle-slider-round"></span>
          </label>
          <button class="custom-rem-btn test-custom-rem-btn" data-id="${cr.id}" title="Preview notification">
            🔔 Preview
          </button>
          <button class="custom-rem-del-btn delete-custom-rem-btn" data-id="${cr.id}" title="Delete reminder">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Toggle switch listeners
    container.querySelectorAll('.toggle-custom-rem').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.dataset.id;
        const item = list.find(r => r.id === id);
        if (item) {
          item.active = e.target.checked;
          this.saveState();
          const activeNow = list.filter(r => r.active).length;
          if (countBadge) {
            countBadge.textContent = `${activeNow} active / ${list.length} total`;
          }
          this.toast(`${item.title}: ${item.active ? 'Activated 🔔' : 'Paused ⏸️'}`);
        }
      });
    });

    // Test preview button listeners
    container.querySelectorAll('.test-custom-rem-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = list.find(r => r.id === id);
        if (item) {
          soundscape.playChime('bell');
          if (this.petals) this.petals.celebrate();
          const noteText = item.note || (item.time ? `Scheduled for ${item.time}` : 'Gentle self-care moment for your temple.');
          this.toast(`<b>${item.title}:</b> ${noteText}`, item.icon || '🌸');

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Aphrodite: ${item.title}`, {
              body: noteText,
              icon: '/assets/aphrodite_avatar.png'
            });
          }
        }
      });
    });

    // Delete button listeners
    container.querySelectorAll('.delete-custom-rem-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = list.findIndex(r => r.id === id);
        if (idx !== -1) {
          const removed = list.splice(idx, 1)[0];
          this.saveState();
          this.renderCustomReminders();
          this.toast(`Removed reminder: "${removed.title}"`);
        }
      });
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  startPopupReminderLoop() {
    if (this.nudgeTimer) clearInterval(this.nudgeTimer);

    // Popup gentle reminders every 90 seconds while user is in the app
    this.nudgeTimer = setInterval(() => {
      this.triggerRandomNudge();
    }, 90000);
  }

  triggerRandomNudge() {
    const activeSystemNudges = NUDGE_MESSAGES.filter(n => this.state.reminders[n.id]);
    const activeCustomNudges = (this.state.customReminders || [])
      .filter(cr => cr.active)
      .map(cr => ({
        id: cr.id,
        icon: cr.icon || '🌸',
        title: cr.title,
        text: cr.note ? `${cr.note}${cr.time ? ` (${cr.time})` : ''}` : (cr.time ? `Scheduled for ${cr.time}` : 'Gentle self-care moment for your temple.')
      }));

    const pool = [...activeSystemNudges, ...activeCustomNudges];
    if (!pool.length) return;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    soundscape.playChime('bell');
    this.toast(`<b>${chosen.title}:</b> ${chosen.text}`, chosen.icon);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Aphrodite: ${chosen.title}`, {
        body: chosen.text,
        icon: '/assets/aphrodite_avatar.png'
      });
    }
  }

  // =========================================================================
  // SOMATIC BREATH & SOUND SANCTUARY
  // =========================================================================
  initBreathingAndSound() {
    // 4-7-8 Breath Pacer
    const circle = document.getElementById('lotus-circle');
    const label = document.getElementById('breath-label');
    const sub = document.getElementById('breath-sub');
    let isBreathing = false;
    let timerId = null;

    if (circle) {
      const runCycle = () => {
        if (!isBreathing) return;
        circle.className = 'breath-circle inhale';
        if (label) label.textContent = 'Inhale (4s)';
        if (sub) sub.textContent = 'Drinking in oxygen & calm...';
        soundscape.playChime('chime');

        timerId = setTimeout(() => {
          if (!isBreathing) return;
          circle.className = 'breath-circle hold';
          if (label) label.textContent = 'Hold (7s)';
          if (sub) sub.textContent = 'Resting in the sacred pause...';

          timerId = setTimeout(() => {
            if (!isBreathing) return;
            circle.className = 'breath-circle exhale';
            if (label) label.textContent = 'Exhale (8s)';
            if (sub) sub.textContent = 'Releasing all bodily tension...';
            soundscape.playChime('bell');

            timerId = setTimeout(() => {
              if (isBreathing) runCycle();
            }, 8000);
          }, 7000);
        }, 4000);
      };

      circle.addEventListener('click', () => {
        isBreathing = !isBreathing;
        if (isBreathing) {
          runCycle();
          this.toast('4-7-8 somatic rhythm began. Soften your shoulders.', '🪷');
        } else {
          clearTimeout(timerId);
          circle.className = 'breath-circle';
          if (label) label.textContent = 'Begin';
          if (sub) sub.textContent = 'Tap for 4-7-8 breath';
        }
      });
    }

    // Soundscapes
    document.querySelectorAll('.sound-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;
        const isActive = btn.classList.contains('active');
        document.querySelectorAll('.sound-pill').forEach(b => b.classList.remove('active'));

        if (isActive) {
          soundscape.stop();
        } else {
          btn.classList.add('active');
          if (sound === 'bowl') soundscape.playSingingBowl();
          else if (sound === 'breeze') soundscape.playBreeze();
          else if (sound === 'rain') soundscape.playRain();
          else if (sound === 'ocean') soundscape.playOcean();
          this.toast(`Resonating: ${sound.toUpperCase()} 🎧`);
        }
      });
    });

    // Hydration Glasses
    const renderHydration = () => {
      const container = document.getElementById('water-cups-row');
      if (!container) return;
      container.innerHTML = '';
      for (let i = 1; i <= 8; i++) {
        const btn = document.createElement('button');
        btn.className = `water-sip-btn ${i <= this.state.waterCups ? 'filled' : ''}`;
        btn.innerHTML = i <= this.state.waterCups ? '💧' : '○';
        btn.title = `Cup ${i}`;
        btn.addEventListener('click', () => {
          this.state.waterCups = i;
          this.saveState();
          renderHydration();
          soundscape.playChime('chime');
          if (i === 8 && this.petals) {
            this.petals.celebrate();
            this.toast('Radiant! 8 cups of water completed today! 💧', '🌸');
          }
        });
        container.appendChild(btn);
      }
    };
    renderHydration();
  }

  initHeaderActions() {
    const quietBtn = document.getElementById('btn-quiet-mode');
    if (quietBtn) {
      quietBtn.addEventListener('click', () => {
        this.triggerRandomNudge();
      });
    }

    const soundBtn = document.getElementById('btn-header-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (soundscape.currentTrack) {
          soundscape.stop();
          soundBtn.classList.remove('active');
        } else {
          soundscape.playSingingBowl();
          soundBtn.classList.add('active');
          this.toast('528Hz Zen Bowl harmony active 🔔');
        }
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new MasterSanctuaryApp();
  app.init();
});

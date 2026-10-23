// ==========================================================================
// Sakura State Management & Local Persistence Engine
// ==========================================================================

const STORAGE_KEY = 'sakura_app_state_v2';

const defaultState = {
  profile: {
    username: 'Friend',
    companionName: 'Sakura',
    tagline: 'Your personal wellness space 🌸',
    avatarUrl: '/assets/aphrodite_avatar.png'
  },
  activeTheme: 'sakura',
  isDarkMode: false,
  petalsEnabled: true,
  audioEnabled: false,
  audioVolume: 0.35,
  currentView: 'chat', // 'chat', 'journal', 'goals', 'sanctuary', 'vitality'
  activeChatId: 'chat_1',
  chats: [
    {
      id: 'chat_1',
      title: 'Chat with Sakura',
      updatedAt: 'Now',
      messages: [
        {
          id: 'm1',
          sender: 'aphrodite',
          text: 'Hi there 🌸\nHow are you feeling today?\n\nRemember, you’re doing better than you think. ♡',
          time: 'Now',
          action: null
        }
      ]
    }
  ],
  journalEntries: [],
  activeJournalId: null,
  dailyHabits: [],
  weeklyMilestones: [],
  quests: [],
  waterGlasses: 0,
  waterTarget: 8,
  nudges: {
    water: true,
    rest: true,
    nourishment: true,
    posture: true
  },
  aiSettings: {
    mode: 'built-in', // 'built-in' or 'custom'
    apiKey: ''
  }
};

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Set();
  }

  loadState() {
    try {
      localStorage.removeItem('sakura_app_state_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load stored state, using defaults', e);
    }
    return defaultState;
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.saveState();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const store = new StateStore();

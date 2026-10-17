// ==========================================================================
// Sakura State Management & Local Persistence Engine
// ==========================================================================

const STORAGE_KEY = 'sakura_app_state_v1';

const defaultState = {
  profile: {
    username: 'Beloved Wanderer',
    companionName: 'Sakura (Aphrodite)',
    tagline: 'Your safe space, always 🌸',
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
      updatedAt: '09:42',
      messages: [
        {
          id: 'm1',
          sender: 'aphrodite',
          text: 'Hi there 🌸\nHow are you feeling today?\n\nRemember, you’re doing better than you think. ♡',
          time: '09:42',
          action: null
        },
        {
          id: 'm2',
          sender: 'user',
          text: 'I’m feeling a bit overwhelmed...',
          time: '09:43',
          action: null
        },
        {
          id: 'm3',
          sender: 'aphrodite',
          text: 'That’s completely okay. 🌸 You do not have to carry the whole world on your shoulders today. Only the soft ground beneath your feet.\n\nWould you like to try a short breathing exercise, a calming chat, or a self-care suggestion?',
          time: '09:44',
          action: {
            title: 'Ten slow breaths with your eyes closed',
            domain: 'mind'
          }
        }
      ]
    },
    {
      id: 'chat_2',
      title: 'Self Care Plan',
      updatedAt: 'Yesterday',
      messages: [
        {
          id: 'm2_1',
          sender: 'aphrodite',
          text: 'Here is your gentle routine for this week. Remember: consistency is not perfection, it is returning to yourself with tenderness.',
          time: 'Yesterday',
          action: {
            title: 'Drink two glasses of cool water',
            domain: 'body'
          }
        }
      ]
    },
    {
      id: 'chat_3',
      title: 'Overthinking',
      updatedAt: 'Tue',
      messages: [
        {
          id: 'm3_1',
          sender: 'aphrodite',
          text: 'You are not your thoughts, darling. You are the sky, and thoughts are passing clouds. Let them drift past without clutching them.',
          time: 'Tue',
          action: {
            title: 'Step outside and gaze at the sky for 2 minutes',
            domain: 'spirit'
          }
        }
      ]
    },
    {
      id: 'chat_4',
      title: 'Dreams & Goals',
      updatedAt: 'Tue',
      messages: [
        {
          id: 'm4_1',
          sender: 'aphrodite',
          text: 'Let us take small, graceful steps toward what makes your soul bloom. What is calling to you today?',
          time: 'Tue',
          action: null
        }
      ]
    },
    {
      id: 'chat_5',
      title: 'Random Thoughts',
      updatedAt: 'Mon',
      messages: [
        {
          id: 'm5_1',
          sender: 'aphrodite',
          text: 'That is such a beautiful way to look at life. Every petal that falls prepares the branch for new blossoms.',
          time: 'Mon',
          action: null
        }
      ]
    }
  ],
  journalEntries: [
    {
      id: 'j1',
      title: 'Spring Dawning in Kyoto',
      content: 'The petals are drifting like soft confetti over the quiet waters. I took a deep breath this morning and forgave myself for the days I lost. Renewal isn’t about rushing; it’s about blooming when you are ready.\n\nI want to remember this stillness: how the tea tastes before checking messages, and how gentle the breeze feels against my cheek.',
      themeId: 'sakura',
      mood: 5,
      tags: ['#renewal', '#presence', '#sakura'],
      updatedAt: 'Today, 08:30 AM'
    },
    {
      id: 'j2',
      title: 'Midnight Reflections Under Stars',
      content: 'Sitting in the quiet glow of moonlight. I noticed that when I stop pushing the river, everything begins to find its rightful place.\n\nA missed goal is not a verdict. It is marble not yet carved. Tomorrow I begin with the smallest piece.',
      themeId: 'lunar',
      mood: 4,
      tags: ['#nightfall', '#reframe'],
      updatedAt: 'Yesterday, 11:15 PM'
    },
    {
      id: 'j3',
      title: 'Still Waters & Green Moss',
      content: 'Spent an hour listening to raindrops on stone. There is a sacred luxury in doing absolutely nothing productive and letting the nervous system settle into peace.',
      themeId: 'forest',
      mood: 4,
      tags: ['#grounding', '#nature'],
      updatedAt: '3 days ago'
    }
  ],
  activeJournalId: 'j1',
  dailyHabits: [
    { id: 'h1', title: 'Drink two cool glasses of water upon waking', streak: 6, completed: true, domain: 'body' },
    { id: 'h2', title: 'Ten slow mindful breaths by a window', streak: 4, completed: true, domain: 'mind' },
    { id: 'h3', title: 'Unclench jaw and roll shoulders back', streak: 12, completed: false, domain: 'body' },
    { id: 'h4', title: 'Write 3 lines of gratitude in sacred journal', streak: 3, completed: false, domain: 'spirit' }
  ],
  weeklyMilestones: [
    { id: 'wm1', title: 'Evening mindful walks', current: 4, target: 5 },
    { id: 'wm2', title: 'Digital dusk: no screens 30m before sleep', current: 3, target: 4 },
    { id: 'wm3', title: 'Daily hydration sanctuary (8 glasses)', current: 5, target: 7 }
  ],
  quests: [
    { id: 'q1', title: 'Brew chamomile tea and read a book chapter', domain: 'spirit', priority: 'urgent', completed: false },
    { id: 'q2', title: 'Gently stretch hamstrings and neck for 5 minutes', domain: 'body', priority: 'flow', completed: false },
    { id: 'q3', title: 'Draft chapter reflections in Sacred Journal', domain: 'craft', priority: 'backlog', completed: false },
    { id: 'q4', title: 'Notice three small things that brought quiet joy today', domain: 'mind', priority: 'flow', completed: true }
  ],
  waterGlasses: 5,
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

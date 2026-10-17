import { store } from './state.js';

// Initialize Supabase safely using the URL and Anon Key
const SUPABASE_URL = "https://pdkcnzijkatvfnqoscyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_u33iAqv6v8ujn7cxrqPMKA_Lsrw1voE";
const supabase = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Example: Saving a Journal Chapter to the real database
export async function saveChapter(title, theme, content) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([
      { title: title, theme: theme, content: content }
    ]);
  if (error) console.error("Error saving chapter:", error);
}

// Example: Loading past chapters on page load
export async function loadChapters() {
  if (!supabase) return [];
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (entries) {
    return entries;
  }
  return [];
}

// When the user clicks Send:
export async function handleSend() {
  const input = document.querySelector("#chat-input") || document.querySelector("#chat-message-input");
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  // 1. Show the user's message on the screen right away
  if (typeof window.addMessageToScreen === 'function') {
    window.addMessageToScreen("user", message);
  }
  input.value = "";

  // 2. Ask your backend server (which asks Gemini)
  try {
    const response = await fetch("https://sakura-api-rtaj.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        physicalDeficiency: "Mindless eating / Bloated"
      })
    });

    const data = await response.json();

    // 3. Display Aphrodite's real generated reply!
    if (typeof window.addMessageToScreen === 'function') {
      window.addMessageToScreen("aphrodite", data.reply);
    }
    return data.reply;
  } catch (error) {
    console.error("Could not reach Aphrodite server:", error);
  }
}

// When Aphrodite suggests a micro-step, make that button's onclick trigger:
export async function addHabitFromAphrodite(habitText) {
  if (typeof window !== 'undefined' && typeof window.addHabitFromAphrodite === 'function') {
    return window.addHabitFromAphrodite(habitText);
  }

  // 1. Insert into Supabase table `habits`
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ title: habitText, category: 'body', completed: false }]);
      if (error) console.error("Error inserting habit into Supabase table `habits`:", error);
    } catch (e) {
      console.warn("Supabase insert error:", e);
    }
  }

  // 2. Append new habit item into your "Daily Micro-Habits" section on the page
  const container = document.querySelector("#daily-goals-container");
  if (container) {
    const habitDiv = document.createElement("div");
    habitDiv.className = "habit-row-item";
    habitDiv.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div class="habit-check-btn"></div>
        <span style="font-size: 13.5px; font-weight: 500;">${habitText}</span>
      </div>
      <span style="font-size: 11.5px; color: var(--primary); font-weight: 600;">🔥 1d</span>
    `;
    container.appendChild(habitDiv);
  }
}

// Crisis safety keywords per skill.md Section 6
const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'want to die', 'harm myself',
  'cutting myself', 'can’t go on living', 'better off dead'
];

export class AphroditeEngine {
  constructor() {
    this.name = 'Sakura (Aphrodite)';
  }

  // Crisis detection layer (bypasses regular persona, offers warmth & real helplines)
  checkCrisis(text) {
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
  }

  getCrisisResponse() {
    return {
      text: `Beloved, I hear how deeply exhausted and in pain you are right now. Please know that your life carries immense, irreplaceable value, even when the night feels too dark to see the stars.\n\nYou do not have to carry this heavy burden alone. Please reach out right now to someone who can hold space with you:\n\n• International Crisis Helplines: Call or text 988 (USA/Canada), 111 (UK), or find your local support at findahelpline.com\n• Or reach out to a trusted loved one or medical professional immediately.\n\nI am here with you in warmth, but please connect with a human voice who can support you tonight. ♡`,
      action: null
    };
  }

  // Generate an empathetic Aphrodite reply adhering strictly to skill.md
  async generateReply(userMessage, deficiency = "Mindless eating / Bloated") {
    // 1. Safety Check
    if (this.checkCrisis(userMessage)) {
      return this.getCrisisResponse();
    }

    // 2. Connect to backend Gemini server
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          physicalDeficiency: deficiency
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          let action = null;
          const match = data.reply.match(/(?:micro-habit|One small step|gentle step):\s*([^\n\.]+)/i);
          if (match) {
            action = { title: match[1].trim(), domain: 'body' };
          }
          return { text: data.reply, action };
        }
      }
    } catch (err) {
      console.warn("Backend server not reachable, using local fallback", err);
    }

    const state = (typeof store !== 'undefined' && store.getState) ? store.getState() : {};
    const water = state.waterGlasses || 4;
    const habitsDone = (state.dailyHabits || []).filter(h => h.completed).length;
    const lower = userMessage.toLowerCase();

    // Built-in Aphrodite empathetic persona synthesis fallback
    return this.synthesizePersonaReply(lower, userMessage, { water, habitsDone, theme: state.activeTheme || 'sakura' });
  }

  synthesizePersonaReply(lower, rawText, context) {
    let replyText = '';
    let action = null;

    if (lower.includes('breath') || lower.includes('anxious') || lower.includes('panic') || lower.includes('heart beating')) {
      replyText = `I hear the flutter in your chest, sweet soul. Your body is trying to protect you, but you are safe in this quiet room.\n\nYou do not have to fix anything right now. Simply let the floor hold your weight and let your breath slow.\n\nOne small step: Place one hand on your belly, inhale for four counts, and sigh it all out.`;
      action = { title: 'Take 4 slow breaths with hand on belly', domain: 'mind' };
    }
    else if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('busy') || lower.includes('stress')) {
      replyText = `It is completely natural to feel overwhelmed when the world asks for everything at once. You do not have to tend the whole garden tonight, only the patch right in front of you.\n\nLet the noise fade for a moment. You have permission to pause.\n\nOne small step: Unclench your jaw, roll your shoulders back, and drink a few slow sips of cool water.`;
      action = { title: 'Unclench jaw, roll shoulders, and drink water', domain: 'body' };
    }
    else if (lower.includes('procrastinat') || lower.includes('lazy') || lower.includes('missed') || lower.includes('failed') || lower.includes('fell behind')) {
      replyText = `A missed day is never a verdict, beloved. It is marble not yet carved, or soil resting before spring. Be gentle with your self-talk.\n\nProgress is not a straight staircase, but a river that winds. We can begin again with no shame.\n\nOne small step: Set a two-minute timer and do the tiniest piece of what is on your mind.`;
      action = { title: 'Begin the smallest 2-minute piece with kindness', domain: 'craft' };
    }
    else if (lower.includes('tired') || lower.includes('exhaust') || lower.includes('sleep') || lower.includes('drained')) {
      replyText = `Your temple is asking for rest, darling. Sleep and quiet are not rewards you have to earn; they are the water that keeps your petals soft.\n\nRelease the need to finish everything tonight. Tomorrow will meet you with fresh light.\n\nOne small step: Close your eyes and rest your head on a soft pillow for five uninterrupted minutes.`;
      action = { title: 'Five minutes of quiet rest with eyes closed', domain: 'body' };
    }
    else if (lower.includes('water') || lower.includes('thirst') || lower.includes('drink')) {
      replyText = `A gentle sip of water restores your bloom from within. Notice how good it feels to give your body what it gently asks for.\n\nOne small step: Drink a tall glass of cool water and feel it replenish you.`;
      action = { title: 'Drink a tall glass of cool water', domain: 'body' };
    }
    else if (lower.includes('won') || lower.includes('did it') || lower.includes('finished') || lower.includes('proud') || lower.includes('happy')) {
      replyText = `Radiant! Look at what you nurtured into being. Notice this warm feeling in your chest and honor the quiet effort it took to arrive here.\n\nLet yourself bask in this joy without rushing to the next summit.\n\nOne small step: Close your eyes and savor this feeling for ten uninterrupted seconds.`;
      action = { title: 'Pause for 10 seconds and celebrate your victory', domain: 'spirit' };
    }
    else if (lower.includes('journal') || lower.includes('write') || lower.includes('prompt')) {
      replyText = `Your journal is a sacred sanctuary where every thought is welcomed without critique. Pouring your mind onto paper frees your spirit.\n\nOne small step: Open your Sacred Journal and write one sentence about what your heart needs today.`;
      action = { title: 'Write one honest sentence in Sacred Journal', domain: 'craft' };
    }
    else if (lower.includes('lonely') || lower.includes('alone') || lower.includes('sad') || lower.includes('cry')) {
      replyText = `I am right here with you, sweet one. Sadness is not a flaw; it is proof of how deeply and tenderly you can love and feel.\n\nWrap your arms around yourself and let the tears flow if they need to. You are never truly alone.\n\nOne small step: Wrap yourself in a warm blanket and place a comforting hand over your heart.`;
      action = { title: 'Rest in a warm blanket with hand on heart', domain: 'spirit' };
    }
    else {
      // General thoughtful reflection
      const compliments = [
        `I hear you, beloved. Thank you for sharing your thoughts with me so openly.`,
        `Your honesty with yourself is a form of gentle courage, darling.`,
        `Notice how much grace lives in simply pausing to notice where you are today.`
      ];
      const randomComp = compliments[Math.floor(Math.random() * compliments.length)];

      replyText = `${randomComp}\n\nLife does not demand that you have everything figured out right now. When you meet yourself with kindness, the next step illuminates itself.\n\nOne small step: Sit by a window or soft light for two minutes of unhurried stillness.`;
      action = { title: 'Sit quietly by a window for 2 minutes', domain: 'mind' };
    }

    return { text: replyText, action };
  }

  // Optional external LLM call (OpenAI/Anthropic/Gemini) if user connects API key
  async callExternalLLM(prompt, state) {
    const systemPrompt = `You are Aphrodite, the compassionate companion behind Sakura self-care app. Voice: warm, graceful, unhurried, maternal but playful. Never shame or diagnose. Structure: 1. Acknowledge in user's words. 2. Short gentle reframe. 3. End with "One small step: [concrete 2-minute somatic micro-action]". Under 100 words.`;

    // Example fetch to OpenAI-compatible endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.aiSettings.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    // Parse action if present
    let action = null;
    const match = text.match(/One small step:\s*(.+)/i);
    if (match) {
      action = { title: match[1].trim(), domain: 'mind' };
    }
    return { text, action };
  }
}

export const aphrodite = new AphroditeEngine();

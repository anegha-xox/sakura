// ==========================================================================
// Sakura Sacred Journal Engine
// Rich journaling with 15 themes, mood tracking, autosave & reflection prompts
// ==========================================================================

import { store } from './state.js';
import { THEMES, applyTheme } from './themes.js';

const INSPIRATIONAL_PROMPTS = [
  'What is one burden you have carried this week that is ready to be set down?',
  'Where in your body are you holding tension, and what would it feel like to soften?',
  'Write a letter of gratitude to a version of yourself that endured a difficult season.',
  'If kindness was a physical space in your home, what would it look and smell like?',
  'What does blooming mean to you today, outside of anyone else’s expectations?',
  'Name three subtle, ordinary things that gave you comfort in the past 24 hours.'
];

export class JournalManager {
  constructor() {
    this.container = document.getElementById('view-journal');
    this.searchQuery = '';
    this.filterMood = null;
    this.autosaveTimeout = null;
  }

  init() {
    this.render();
  }

  getActiveEntry() {
    const state = store.getState();
    return state.journalEntries.find(e => e.id === state.activeJournalId) || state.journalEntries[0];
  }

  render() {
    if (!this.container) return;
    const state = store.getState();
    const activeEntry = this.getActiveEntry();

    let filteredEntries = state.journalEntries.filter(e => {
      const matchesSearch = !this.searchQuery || 
        e.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesMood = this.filterMood === null || e.mood === this.filterMood;
      return matchesSearch && matchesMood;
    });

    const words = activeEntry ? activeEntry.content.trim().split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.ceil(words / 180);

    const moodIcons = {
      1: '🌧️',
      2: '⛅',
      3: '🌿',
      4: '✨',
      5: '🌸'
    };

    this.container.innerHTML = `
      <!-- Left Sidebar: Entries List & Filters -->
      <div class="journal-sidebar-pane">
        <div class="journal-search-box">
          <span style="font-size: 15px; opacity: 0.6;">🔍</span>
          <input type="text" class="journal-search-input" id="journal-search" placeholder="Search chapters..." value="${this.searchQuery}">
        </div>

        <div class="journal-filter-pills">
          <button class="journal-filter-btn ${this.filterMood === null ? 'active' : ''}" data-mood="all">All</button>
          <button class="journal-filter-btn ${this.filterMood === 5 ? 'active' : ''}" data-mood="5">🌸 Radiant</button>
          <button class="journal-filter-btn ${this.filterMood === 4 ? 'active' : ''}" data-mood="4">✨ Blooming</button>
          <button class="journal-filter-btn ${this.filterMood === 3 ? 'active' : ''}" data-mood="3">🌿 Grounded</button>
          <button class="journal-filter-btn ${this.filterMood === 2 ? 'active' : ''}" data-mood="2">⛅ Fragile</button>
          <button class="journal-filter-btn ${this.filterMood === 1 ? 'active' : ''}" data-mood="1">🌧️ Heavy</button>
        </div>

        <button class="btn-glass-primary" id="btn-new-chapter" style="padding: 10px 14px; font-size: 13.5px;">
          <span>+</span> New Chapter
        </button>

        <div class="journal-entries-list">
          ${filteredEntries.map(entry => `
            <div class="journal-card-item ${entry.id === activeEntry?.id ? 'active' : ''}" data-id="${entry.id}">
              <div class="journal-card-title">${entry.title || 'Untitled Chapter'}</div>
              <div class="journal-card-preview">${entry.content.replace(/\n/g, ' ') || 'Blank page...'}</div>
              <div class="journal-card-meta">
                <span>${moodIcons[entry.mood] || '🌸'} ${entry.updatedAt}</span>
                <span class="journal-theme-badge">${entry.themeId}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right Pane: Active Chapter Editor -->
      <div class="journal-editor-pane">
        ${activeEntry ? `
          <div class="journal-editor-header">
            <input type="text" class="journal-title-input" id="journal-title" value="${activeEntry.title}" placeholder="Chapter Title...">
            
            <div class="journal-meta-selectors">
              <select class="theme-selector-dropdown" id="journal-theme-select">
                ${THEMES.map(t => `
                  <option value="${t.id}" ${t.id === activeEntry.themeId ? 'selected' : ''}>
                    ${t.name} (${t.id})
                  </option>
                `).join('')}
              </select>

              <div class="mood-selector-group">
                ${[1, 2, 3, 4, 5].map(m => `
                  <button class="mood-btn ${activeEntry.mood === m ? 'active' : ''}" data-mood="${m}" title="Mood ${m}">
                    ${moodIcons[m]}
                  </button>
                `).join('')}
              </div>

              <button class="tool-btn" id="btn-delete-chapter" style="color: #ef4444;" title="Delete Chapter">🗑️</button>
            </div>
          </div>

          <div class="journal-toolbar">
            <button class="tool-btn" id="tb-bold"><b>B</b></button>
            <button class="tool-btn" id="tb-italic"><i>I</i></button>
            <button class="tool-btn" id="tb-quote">❝ Quote</button>
            <button class="tool-btn" id="tb-list">• List</button>
            
            <button class="btn-inspire-prompt" id="btn-inspire">
              <span>✨</span> Inspire Me
            </button>
          </div>

          <div class="journal-textarea-container">
            <textarea class="journal-textarea" id="journal-content" placeholder="Let your thoughts unfold softly like cherry petals...">${activeEntry.content}</textarea>
          </div>

          <div class="journal-editor-footer">
            <div style="display: flex; gap: 16px;">
              <span>📝 ${words} words</span>
              <span>⏳ ${readingTime} min read</span>
              <span id="journal-save-status">🌿 Preserved in offline sanctuary</span>
            </div>
            <div>
              <button class="tool-btn" id="btn-export-chapter">📤 Export Text</button>
            </div>
          </div>
        ` : `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-muted);">
            Select or create a chapter to begin writing.
          </div>
        `}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Search input
    const searchInput = document.getElementById('journal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // Mood filters
    this.container.querySelectorAll('.journal-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.mood;
        this.filterMood = val === 'all' ? null : parseInt(val);
        this.render();
      });
    });

    // Select chapter
    this.container.querySelectorAll('.journal-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const entry = store.getState().journalEntries.find(e => e.id === id);
        store.setState({ activeJournalId: id });
        if (entry) {
          applyTheme(entry.themeId);
        }
        this.render();
      });
    });

    // New Chapter
    const btnNew = document.getElementById('btn-new-chapter');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        const state = store.getState();
        const newEntry = {
          id: 'j_' + Date.now(),
          title: 'A New Morning Blossom',
          content: '',
          themeId: state.activeTheme || 'sakura',
          mood: 4,
          tags: ['#selfcare'],
          updatedAt: 'Just now'
        };
        store.setState(s => ({
          journalEntries: [newEntry, ...s.journalEntries],
          activeJournalId: newEntry.id
        }));
        this.render();
      });
    }

    // Title editing
    const titleInput = document.getElementById('journal-title');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.updateActiveEntry({ title: e.target.value });
      });
    }

    // Content editing
    const contentArea = document.getElementById('journal-content');
    if (contentArea) {
      contentArea.addEventListener('input', (e) => {
        this.updateActiveEntry({ content: e.target.value });
      });
    }

    // Theme selector
    const themeSelect = document.getElementById('journal-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const themeId = e.target.value;
        this.updateActiveEntry({ themeId });
        applyTheme(themeId);
        store.setState({ activeTheme: themeId });
      });
    }

    // Mood buttons
    this.container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mood = parseInt(btn.dataset.mood);
        this.updateActiveEntry({ mood });
        this.render();
      });
    });

    // Delete chapter
    const btnDelete = document.getElementById('btn-delete-chapter');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        const active = this.getActiveEntry();
        if (confirm(`Are you sure you want to let go of "${active.title}"?`)) {
          store.setState(s => {
            const filtered = s.journalEntries.filter(e => e.id !== active.id);
            return {
              journalEntries: filtered,
              activeJournalId: filtered[0]?.id || null
            };
          });
          this.render();
        }
      });
    }

    // Inspire Me prompt
    const btnInspire = document.getElementById('btn-inspire');
    if (btnInspire) {
      btnInspire.addEventListener('click', () => {
        const prompt = INSPIRATIONAL_PROMPTS[Math.floor(Math.random() * INSPIRATIONAL_PROMPTS.length)];
        const textarea = document.getElementById('journal-content');
        if (textarea) {
          const separator = textarea.value.length > 0 ? '\n\n' : '';
          textarea.value += `${separator}✨ *Prompt:* ${prompt}\n`;
          this.updateActiveEntry({ content: textarea.value });
          this.render();
        }
      });
    }

    // Text formatting tools
    const insertFormatting = (prefix, suffix = '') => {
      const textarea = document.getElementById('journal-content');
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const sel = textarea.value.substring(start, end);
      const replacement = prefix + (sel || 'text') + suffix;
      textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      textarea.focus();
      this.updateActiveEntry({ content: textarea.value });
    };

    const tbBold = document.getElementById('tb-bold');
    if (tbBold) tbBold.onclick = () => insertFormatting('**', '**');
    const tbItalic = document.getElementById('tb-italic');
    if (tbItalic) tbItalic.onclick = () => insertFormatting('*', '*');
    const tbQuote = document.getElementById('tb-quote');
    if (tbQuote) tbQuote.onclick = () => insertFormatting('> ');
    const tbList = document.getElementById('tb-list');
    if (tbList) tbList.onclick = () => insertFormatting('• ');

    // Export text
    const btnExport = document.getElementById('btn-export-chapter');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const entry = this.getActiveEntry();
        const blob = new Blob([`${entry.title}\nTheme: ${entry.themeId}\nDate: ${entry.updatedAt}\n\n${entry.content}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  updateActiveEntry(changes) {
    const activeId = store.getState().activeJournalId;
    store.setState(s => ({
      journalEntries: s.journalEntries.map(e => e.id === activeId ? { ...e, ...changes, updatedAt: 'Just now' } : e)
    }));

    const statusEl = document.getElementById('journal-save-status');
    if (statusEl) {
      statusEl.textContent = '🌿 Preserved in offline sanctuary';
    }
  }
}

// ==========================================================================
// Sakura Goals, Habits & Task Board Engine
// Implements daily habits with streaks, weekly progress, tasks, and celebration
// ==========================================================================

import { store } from './state.js';
import { soundscape } from './audio.js';

export class GoalsManager {
  constructor(petalsSystem) {
    this.petalsSystem = petalsSystem;
    this.container = document.getElementById('view-goals');
    this.questPriorityFilter = 'all';
    this.questDomainFilter = 'all';
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;
    const state = store.getState();

    const habitsTotal = state.dailyHabits.length;
    const habitsCompleted = state.dailyHabits.filter(h => h.completed).length;
    const habitsPercent = habitsTotal ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;

    let filteredQuests = state.quests.filter(q => {
      const matchPrio = this.questPriorityFilter === 'all' || q.priority === this.questPriorityFilter;
      const matchDom = this.questDomainFilter === 'all' || q.domain === this.questDomainFilter;
      return matchPrio && matchDom;
    });

    this.container.innerHTML = `
      <!-- Top Stats Hero Grid -->
      <div class="goals-hero-grid">
        <div class="horizon-stat-card">
          <div class="stat-icon-circle">🌸</div>
          <div class="stat-info">
            <h3>${habitsCompleted} / ${habitsTotal}</h3>
            <p>Today’s Habits (${habitsPercent}%)</p>
          </div>
        </div>

        <div class="horizon-stat-card">
          <div class="stat-icon-circle">🔥</div>
          <div class="stat-info">
            <h3>${Math.max(...state.dailyHabits.map(h => h.streak), 0)} Days</h3>
            <p>Current Streak</p>
          </div>
        </div>

        <div class="horizon-stat-card">
          <div class="stat-icon-circle">💧</div>
          <div class="stat-info">
            <h3>${state.waterGlasses} / ${state.waterTarget}</h3>
            <p>Glasses of Water Logged</p>
          </div>
        </div>
      </div>

      <!-- Main Columns: Habits, Milestones & Tasks -->
      <div class="goals-content-grid">
        <!-- Left: Daily Habits & Weekly Targets -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Daily Habits Panel -->
          <div class="goals-panel">
            <div class="goals-panel-header">
              <div>
                <h3 class="goals-panel-title">🌿 Daily Habits</h3>
                <p class="goals-panel-sub">Simple daily habits to keep you on track</p>
              </div>
              <button class="btn-add-item" id="btn-add-habit">+ Add Habit</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${state.dailyHabits.map(habit => `
                <div class="habit-item-row ${habit.completed ? 'completed' : ''}" data-id="${habit.id}">
                  <div class="habit-checkbox-wrapper" data-id="${habit.id}">
                    <div class="custom-checkbox">
                      ${habit.completed ? '✓' : ''}
                    </div>
                    <span class="habit-label">${habit.title}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="streak-badge">🔥 ${habit.streak}d</span>
                    <button class="thread-del-btn btn-del-habit" data-id="${habit.id}" style="opacity: 0.7;">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Weekly Milestones Panel -->
          <div class="goals-panel">
            <div class="goals-panel-header">
              <div>
                <h3 class="goals-panel-title">🌙 Weekly Goals</h3>
                <p class="goals-panel-sub">Track your targets for the week</p>
              </div>
              <button class="btn-add-item" id="btn-add-milestone">+ Add Goal</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${state.weeklyMilestones.map(m => {
                const percent = Math.min(100, Math.round((m.current / m.target) * 100));
                return `
                  <div class="milestone-item" data-id="${m.id}">
                    <div class="milestone-top">
                      <span class="milestone-title">${m.title}</span>
                      <span class="milestone-counter">${m.current} / ${m.target} days</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                      <button class="tool-btn btn-inc-milestone" data-id="${m.id}" style="font-size: 11px; padding: 2px 8px;">+ Progress</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Active Tasks Board -->
        <div class="goals-panel">
          <div class="goals-panel-header">
            <div>
              <h3 class="goals-panel-title">📋 Tasks & Projects</h3>
              <p class="goals-panel-sub">Organized by priority and category</p>
            </div>
            <button class="btn-add-item" id="btn-add-quest">+ Add Task</button>
          </div>

          <!-- Filters -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="quest-tabs-row">
              <button class="quest-tab-btn prio-filter ${this.questPriorityFilter === 'all' ? 'active' : ''}" data-prio="all">All Priorities</button>
              <button class="quest-tab-btn prio-filter ${this.questPriorityFilter === 'urgent' ? 'active' : ''}" data-prio="urgent">Immediate</button>
              <button class="quest-tab-btn prio-filter ${this.questPriorityFilter === 'flow' ? 'active' : ''}" data-prio="flow">In Progress</button>
              <button class="quest-tab-btn prio-filter ${this.questPriorityFilter === 'backlog' ? 'active' : ''}" data-prio="backlog">Later</button>
            </div>

            <div class="quest-tabs-row">
              <button class="quest-tab-btn dom-filter ${this.questDomainFilter === 'all' ? 'active' : ''}" data-dom="all">All Categories</button>
              <button class="quest-tab-btn dom-filter ${this.questDomainFilter === 'body' ? 'active' : ''}" data-dom="body">Body</button>
              <button class="quest-tab-btn dom-filter ${this.questDomainFilter === 'mind' ? 'active' : ''}" data-dom="mind">Mind</button>
              <button class="quest-tab-btn dom-filter ${this.questDomainFilter === 'spirit' ? 'active' : ''}" data-dom="spirit">Spirit</button>
              <button class="quest-tab-btn dom-filter ${this.questDomainFilter === 'craft' ? 'active' : ''}" data-dom="craft">Craft</button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 6px;">
            ${filteredQuests.map(quest => `
              <div class="quest-item-card ${quest.completed ? 'completed' : ''}" data-id="${quest.id}">
                <div class="habit-checkbox-wrapper" data-id="${quest.id}">
                  <div class="custom-checkbox">
                    ${quest.completed ? '✓' : ''}
                  </div>
                  <span class="habit-label" style="${quest.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${quest.title}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="domain-pill domain-${quest.domain}">${quest.domain}</span>
                  <button class="thread-del-btn btn-del-quest" data-id="${quest.id}" style="opacity: 0.7;">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Habit checkbox toggle
    this.container.querySelectorAll('.habit-checkbox-wrapper').forEach(box => {
      box.addEventListener('click', () => {
        const id = box.dataset.id;
        const state = store.getState();
        const habit = state.dailyHabits.find(h => h.id === id);
        if (habit) {
          const willComplete = !habit.completed;
          store.setState(s => ({
            dailyHabits: s.dailyHabits.map(h => {
              if (h.id === id) {
                return {
                  ...h,
                  completed: willComplete,
                  streak: willComplete ? h.streak + 1 : Math.max(0, h.streak - 1)
                };
              }
              return h;
            })
          }));

          if (willComplete) {
            soundscape.playChime('bell');
            if (this.petalsSystem) {
              this.petalsSystem.celebrate();
            }
          }
          this.render();
        }

        const quest = state.quests.find(q => q.id === id);
        if (quest) {
          const willComplete = !quest.completed;
          store.setState(s => ({
            quests: s.quests.map(q => q.id === id ? { ...q, completed: willComplete } : q)
          }));
          if (willComplete) {
            soundscape.playChime('bell');
            if (this.petalsSystem) this.petalsSystem.celebrate();
          }
          this.render();
        }
      });
    });

    // Delete habit
    this.container.querySelectorAll('.btn-del-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.setState(s => ({ dailyHabits: s.dailyHabits.filter(h => h.id !== id) }));
        this.render();
      });
    });

    // Delete quest
    this.container.querySelectorAll('.btn-del-quest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.setState(s => ({ quests: s.quests.filter(q => q.id !== id) }));
        this.render();
      });
    });

    // Increment milestone
    this.container.querySelectorAll('.btn-inc-milestone').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        store.setState(s => ({
          weeklyMilestones: s.weeklyMilestones.map(m => m.id === id ? { ...m, current: Math.min(m.target, m.current + 1) } : m)
        }));
        soundscape.playChime('bell');
        if (this.petalsSystem) this.petalsSystem.celebrate();
        this.render();
      });
    });

    // Add habit
    const btnAddHabit = document.getElementById('btn-add-habit');
    if (btnAddHabit) {
      btnAddHabit.addEventListener('click', () => {
        const title = prompt('Enter your daily habit:');
        if (title && title.trim()) {
          store.setState(s => ({
            dailyHabits: [
              ...s.dailyHabits,
              { id: 'h_' + Date.now(), title: title.trim(), streak: 1, completed: false, domain: 'mind' }
            ]
          }));
          this.render();
        }
      });
    }

    // Add milestone
    const btnAddMilestone = document.getElementById('btn-add-milestone');
    if (btnAddMilestone) {
      btnAddMilestone.addEventListener('click', () => {
        const title = prompt('Enter weekly goal (e.g., 3 workout sessions):');
        if (title && title.trim()) {
          store.setState(s => ({
            weeklyMilestones: [
              ...s.weeklyMilestones,
              { id: 'wm_' + Date.now(), title: title.trim(), current: 1, target: 4 }
            ]
          }));
          this.render();
        }
      });
    }

    // Add quest
    const btnAddQuest = document.getElementById('btn-add-quest');
    if (btnAddQuest) {
      btnAddQuest.addEventListener('click', () => {
        const title = prompt('Enter task title:');
        if (title && title.trim()) {
          store.setState(s => ({
            quests: [
              ...s.quests,
              { id: 'q_' + Date.now(), title: title.trim(), domain: 'spirit', priority: 'flow', completed: false }
            ]
          }));
          this.render();
        }
      });
    }

    // Filter quests
    this.container.querySelectorAll('.prio-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.questPriorityFilter = btn.dataset.prio;
        this.render();
      });
    });
    this.container.querySelectorAll('.dom-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.questDomainFilter = btn.dataset.dom;
        this.render();
      });
    });
  }
}

# Sakura: Project Plan

A self-care and reflection app with themed journaling, gentle goal tracking, an empathetic companion (Aphrodite), and soft reminders.

**Status.** A working single-file prototype exists (`sakura.html`). It stores data in the browser only, and Aphrodite replies from built-in rules. This plan covers turning it into a production app.

---

## 1. Product Scope

| Module | What the user can do |
| :--- | :--- |
| Journal | Write chapters with a title, mood (1 to 5), and one of 15 themes. The whole interface adopts the entry's theme. |
| Goals | Daily micro-habits with streaks, weekly targets with progress meters, and a quest board by priority and domain. |
| Aphrodite | Chat with a warm, non-judgmental companion who ends each reply with one small action that can be added to daily goals. |
| Nudges | Toggleable reminders for water, rest, nourishment, and posture, delivered in-app or as browser notifications. |

**Non-goals for v1:** social features, medical advice, calorie or weight tracking.

---

## 2. Architecture

```
Client (PWA)
  Journal (15 themes) | Goals & Calendar | Aphrodite chat
  Local state and storage: Zustand + IndexedDB (Dexie) + Service Worker
            |
            | HTTPS
            v
Backend
  Auth & Sync (Supabase) | Notification scheduler | Aphrodite proxy (LLM)
            |
            v
Data
  PostgreSQL (journal, goals, reminders, chats) | LLM provider API
```

**Principles**
- **Offline first.** Writes go to IndexedDB immediately and sync when online.
- **Private by default.** Row-level security on every table. Journal text is never sent to the LLM without the user opening a chat.
- **CSS-variable theming.** Themes swap tokens on the root element, with no React re-render.

---

## 3. Technology Stack

| Layer | Choice | Reason |
| :--- | :--- | :--- |
| Framework | Next.js 14, React 18, TypeScript | App Router, PWA-friendly |
| Styling | Tailwind CSS + CSS custom properties | 15 themes through a `data-theme` attribute |
| Editor | Tiptap | Rich text, lightweight, Markdown-compatible |
| Local data | Dexie (IndexedDB) | Offline autosave |
| State | Zustand | Small and simple |
| Backend | Supabase (Postgres, Auth, RLS) | Auth and sync out of the box |
| AI | Anthropic API via Vercel AI SDK | Streaming and persona control |
| Notifications | Service Worker + Web Push | Background reminders |
| Testing | Playwright, Vitest | End-to-end and unit coverage |

---

## 4. Design System

**Tokens (set per theme):** `--bg`, `--card`, `--ink`, `--ac` (accent), derived `--mu` (muted) and `--ln` (line).

**Type:** Cormorant Garamond for headings and journal text, Figtree for interface text.

**Themes:** `lunar`, `ocean`, `forest`, `sakura`, `golden`, `rainy`, `nebula`, `zen`, `oasis`, `academia`, `cloud`, `hearth`, `green`, `aurora`, `glass`.

**Quality floor**
- Text contrast of at least 4.5:1 in every theme (audit each palette).
- Visible keyboard focus, `prefers-reduced-motion` respected.
- Responsive: sidebar on desktop, bottom bar on mobile.
- One signature moment: petals fall when a goal is completed.

---

## 5. Data Model

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  notification_prefs jsonb default '{"water":true,"sleep":true,"diet":true,"move":true}',
  quiet_hours int4range,
  created_at timestamptz default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default '',
  content jsonb not null default '{}',
  theme_id varchar(32) not null default 'sakura',
  mood smallint check (mood between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  kind varchar(12) check (kind in ('daily','weekly','quest')),
  priority varchar(10) check (priority in ('urgent','flow','backlog')),
  domain varchar(10) check (domain in ('body','mind','spirit','craft')),
  target_count int default 1,
  progress int default 0,
  streak int default 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table water_logs (
  user_id uuid references profiles(id) on delete cascade,
  day date not null,
  glasses smallint default 0,
  primary key (user_id, day)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role varchar(10) check (role in ('user','assistant')),
  content text not null,
  suggested_action text,
  created_at timestamptz default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type varchar(16) not null,
  message text not null,
  at_time time not null,
  days smallint[] default '{0,1,2,3,4,5,6}',
  active boolean default true
);

-- Apply to every table:
-- alter table <t> enable row level security;
-- create policy own_rows on <t> using (user_id = auth.uid());
```

---

## 6. Phases

### Phase 0: Prototype (done)
- [x] Single-file app with journal, 15 themes, goals, quest board, chat, nudges
- [x] Local storage persistence
- [x] Completion petals, mobile layout, reduced-motion support

### Phase 1: Foundation (Week 1)
- [ ] Next.js, TypeScript and Tailwind scaffold
- [ ] Theme tokens and a provider with per-entry theming
- [ ] Contrast audit of all 15 palettes
- [ ] App shell: sidebar and bottom navigation

### Phase 2: Journal (Week 2)
- [ ] Tiptap editor with block quotes and tags
- [ ] Dexie autosave and entry search
- [ ] Supabase sync with conflict handling (last write wins per entry)

### Phase 3: Goals and Calendar (Week 3)
- [ ] Month, week and day calendar grid
- [ ] Daily streak logic that handles missed days kindly (one-day grace)
- [ ] Weekly recap summary
- [ ] Drag-to-schedule on the calendar

### Phase 4: Aphrodite (Week 4)
- [ ] Server route with the persona prompt from `skill.md`
- [ ] Streaming chat and Markdown rendering
- [ ] Context injection: mood, completion count, water, active theme
- [ ] "Add to daily goals" parser for the suggested micro-action
- [ ] Crisis detection that bypasses the persona and returns the safety response

### Phase 5: Nudges (Week 5)
- [ ] Service Worker and Web Push registration
- [ ] Schedulers for water, rest, nourishment and posture
- [ ] Settings: intervals, quiet hours, toggles
- [ ] In-app toast fallback when notification permission is denied

### Phase 6: Launch (Week 6)
- [ ] Playwright tests: autosave, goal completion, chat streaming, theme switching
- [ ] PWA manifest, icons and offline caching
- [ ] Security review: input sanitizing, RLS policy tests, rate limiting on the AI route
- [ ] Deploy to Vercel with staging smoke tests

---

## 7. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
| :--- | :--- | :--- | :--- |
| Browser blocks notifications | High | High | In-app toasts and a gentle re-ask. Never nag. |
| Data loss while offline | Critical | Medium | IndexedDB first, sync queue with retries |
| AI tone drifts clinical or harsh | Medium | Medium | Strict system prompt, few-shot examples, tone review set |
| User in crisis uses the chat | Critical | Low | Keyword and classifier safety layer, fixed supportive response, local helpline guidance |
| Journal privacy concerns | High | Medium | RLS, encryption at rest, opt-in AI context, clear delete-all control |
| Low contrast in some themes | Medium | Medium | Automated contrast check in CI |
| Streak loss feels punishing | Medium | Medium | Grace day, wording that never says "lost" |

---

## 8. Success Metrics

- Seven-day return rate
- Journal entries per active user per week
- Share of days with at least one daily habit completed
- Share of Aphrodite suggestions added to goals
- Nudge opt-out rate (target: low, and a signal that tone is right)

---

## 9. Open Questions

1. Should journal entries be end-to-end encrypted, at the cost of server-side search?
2. Should Aphrodite have access to past journal text, and if so, opt-in per entry or global?
3. Which regions need localized crisis resources at launch?

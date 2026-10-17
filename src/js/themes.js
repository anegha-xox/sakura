// ==========================================================================
// Sakura 15 Ambient Themes Registry (per plan.md & skill.md)
// ==========================================================================

export const THEMES = [
  {
    id: 'sakura',
    name: 'Cherry Blossom',
    subtitle: 'Petal pink & cream',
    suits: 'New beginnings, tenderness',
    colors: ['#fdf2f4', '#ea8ea9', '#d46b91'],
    isDark: false,
    bgImage: '/assets/sakura_day_bg.jpg'
  },
  {
    id: 'lunar',
    name: 'Lunar & Lily Glow',
    subtitle: 'Silver & midnight indigo',
    suits: 'Late-night thoughts, solace',
    colors: ['#120e26', '#7c58d4', '#a482f0'],
    isDark: true,
    bgImage: '/assets/sakura_night_bg.jpg'
  },
  {
    id: 'ocean',
    name: 'Ocean Tide',
    subtitle: 'Aquamarine & seafoam',
    suits: 'Processing, letting go',
    colors: ['#0e2a38', '#2ea4b1', '#56dce8'],
    isDark: true
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    subtitle: 'Moss & dark pine',
    suits: 'Grounding, stillness',
    colors: ['#13241b', '#419660', '#6bc78c'],
    isDark: true
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    subtitle: 'Amber & sunset glow',
    suits: 'Gratitude, warm reflection',
    colors: ['#fff7ed', '#d97706', '#f59e0b'],
    isDark: false
  },
  {
    id: 'rainy',
    name: 'Rainy Afternoon',
    subtitle: 'Slate & petrichor',
    suits: 'Sadness, quiet comfort',
    colors: ['#1e2430', '#537cae', '#76a3d6'],
    isDark: true
  },
  {
    id: 'nebula',
    name: 'Starry Nebula',
    subtitle: 'Cosmic purple & starlight',
    suits: 'Big questions, dreaming',
    colors: ['#150926', '#a13fd1', '#c863f7'],
    isDark: true
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    subtitle: 'Sand, pebble & bamboo',
    suits: 'Clarity, meditative focus',
    colors: ['#f7f4ed', '#6c654e', '#8c8366'],
    isDark: false
  },
  {
    id: 'oasis',
    name: 'Desert Oasis',
    subtitle: 'Terracotta & turquoise',
    suits: 'Renewal, inner warmth',
    colors: ['#fff2eb', '#d46b4e', '#2ea8a0'],
    isDark: false
  },
  {
    id: 'academia',
    name: 'Dark Academia',
    subtitle: 'Mahogany & parchment',
    suits: 'Deep writing, study',
    colors: ['#1c1514', '#ad7a35', '#c9964d'],
    isDark: true
  },
  {
    id: 'cloud',
    name: 'Ethereal Cloud',
    subtitle: 'Lavender & dawn blush',
    suits: 'Calm, soft mornings',
    colors: ['#f3f0fb', '#7c62be', '#9c83dd'],
    isDark: false
  },
  {
    id: 'hearth',
    name: 'Autumn Hearth',
    subtitle: 'Cinnamon & maple ember',
    suits: 'Comfort, nostalgia',
    colors: ['#2b1712', '#c7562a', '#e87346'],
    isDark: true
  },
  {
    id: 'green',
    name: 'Botanical Greenhouse',
    subtitle: 'Fern & sunlit glass',
    suits: 'Growth, planning',
    colors: ['#eef7ee', '#2e7d32', '#43a047'],
    isDark: false
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    subtitle: 'Emerald & polar violet',
    suits: 'Wonder, breakthroughs',
    colors: ['#0c1c24', '#1cb883', '#3ae8af'],
    isDark: true
  },
  {
    id: 'glass',
    name: 'Clean Monochrome',
    subtitle: 'Frosted charcoal glass',
    suits: 'Minimal, no-fuss entries',
    colors: ['#18191c', '#444750', '#ffffff'],
    isDark: true
  }
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  
  // Set theme background image if specific, or reset to default
  const bgEl = document.getElementById('app-background');
  if (bgEl) {
    if (theme.id === 'lunar') {
      bgEl.style.backgroundImage = "url('/assets/sakura_night_bg.jpg')";
    } else if (theme.id === 'sakura') {
      bgEl.style.backgroundImage = "url('/assets/sakura_day_bg.jpg')";
    } else {
      bgEl.style.backgroundImage = 'none';
    }
  }
  return theme;
}

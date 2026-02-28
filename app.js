const STORAGE_KEY = 'questlife-state-v2';
const XP_PER_LEVEL = 100;

const todayKey = () => new Date().toISOString().slice(0, 10);

const rotatingMissionPools = {
  fisica: [
    { id: 'day-run', title: 'Sprint de poder (20 min)', xp: 20, gold: 16, attribute: 'resistencia', difficulty: 'Media', duration: '20 min', category: 'Física' },
    { id: 'day-mobility', title: 'Movilidad total', xp: 16, gold: 14, attribute: 'fuerza', difficulty: 'Baja', duration: '15 min', category: 'Física' }
  ],
  mental: [
    { id: 'day-study', title: 'Estudio profundo', xp: 18, gold: 15, attribute: 'inteligencia', difficulty: 'Media', duration: '25 min', category: 'Mental' },
    { id: 'day-journal', title: 'Journaling estratégico', xp: 12, gold: 10, attribute: 'disciplina', difficulty: 'Baja', duration: '10 min', category: 'Mental' }
  ],
  social: [
    { id: 'day-contact', title: 'Conexión consciente', xp: 14, gold: 12, attribute: 'carisma', difficulty: 'Baja', duration: '10 min', category: 'Social' },
    { id: 'day-call', title: 'Llamada valiente', xp: 17, gold: 13, attribute: 'carisma', difficulty: 'Media', duration: '15 min', category: 'Social' }
  ]
};

const fixedDailyMission = {
  id: 'fixed-daily',
  title: 'Misión diaria del Sistema: 30 min de enfoque sin distracciones',
  xp: 40,
  gold: 35,
  attribute: 'disciplina',
  difficulty: 'Media',
  duration: '30 min'
};

const secondaryMissions = [
  { id: 'sec-save', title: 'Guardar dinero hoy', xp: 20, gold: 22, attribute: 'finanzas', category: 'Finanzas', difficulty: 'Media', duration: '5 min' },
  { id: 'sec-read', title: 'Leer 20 páginas', xp: 20, gold: 18, attribute: 'inteligencia', category: 'Mental', difficulty: 'Media', duration: '20 min' },
  { id: 'sec-workout', title: 'Entrenamiento de fuerza', xp: 24, gold: 20, attribute: 'fuerza', category: 'Física', difficulty: 'Media', duration: '30 min' }
];

const dungeons = [
  { id: 'pages', title: 'Mazmorra de Sabiduría', goal: 100, unit: 'páginas', boss: 'Señor del Estancamiento', reward: 'Capa Arcana +120 oro' },
  { id: 'workouts', title: 'Arena del Acero', goal: 5, unit: 'entrenamientos', boss: 'Titán de la Pereza', reward: 'Guantes de Hierro +100 oro' },
  { id: 'savings', title: 'Cripta del Ahorro', goal: 30, unit: 'días de ahorro', boss: 'Dragón del Gasto Impulsivo', reward: 'Mascota Fénix +150 oro' }
];

const shopItems = [
  { id: 'armor-basic', name: 'Armadura básica', price: 80 },
  { id: 'sword-shadow', name: 'Espada de sombra', price: 120 },
  { id: 'pet-wolf', name: 'Mascota: lobo astral', price: 150 },
  { id: 'background-neon', name: 'Fondo neón épico', price: 70 }
];

const achievementsCatalog = [
  { id: 'streak3', title: 'Encendido', condition: s => s.streak >= 3, reward: '+50 oro', badge: '🔥' },
  { id: 'level5', title: 'Guerrero Ascendente', condition: s => s.level >= 5, reward: 'Aura azul', badge: '⚔️' },
  { id: 'missions20', title: 'Disciplina de Hierro', condition: s => s.missionsCompleted >= 20, reward: 'Título épico', badge: '🏆' }
];

const tabs = [
  { id: 'home', label: 'Inicio' },
  { id: 'missions', label: 'Misiones' },
  { id: 'dungeons', label: 'Mazmorras' },
  { id: 'shop', label: 'Tienda' },
  { id: 'profile', label: 'Perfil' }
];

const defaultState = {
  profile: { name: '', playerClass: '' },
  onboardingDone: false,
  level: 1,
  xp: 0,
  maxLevel: 1,
  gold: 120,
  goldEarned: 0,
  streak: 0,
  lastCompletionDate: null,
  missionsCompleted: 0,
  inventory: ['Túnica Inicial'],
  attributes: { fuerza: 1, resistencia: 1, inteligencia: 1, disciplina: 1, carisma: 1, finanzas: 1 },
  completedToday: {},
  dungeonsProgress: { pages: 0, workouts: 0, savings: 0 },
  achievements: {},
  dailyMissions: []
};

let state = loadState();
let currentTab = 'home';

dailyResetIfNeeded();
render();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  const parsed = JSON.parse(raw);
  return {
    ...structuredClone(defaultState),
    ...parsed,
    profile: { ...structuredClone(defaultState.profile), ...(parsed.profile || {}) },
    attributes: { ...structuredClone(defaultState.attributes), ...(parsed.attributes || {}) },
    dungeonsProgress: { ...structuredClone(defaultState.dungeonsProgress), ...(parsed.dungeonsProgress || {}) }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pickRotatingMissions(seedDate) {
  const day = Number(seedDate.split('-')[2]);
  return [
    rotatingMissionPools.fisica[day % rotatingMissionPools.fisica.length],
    rotatingMissionPools.mental[(day + 1) % rotatingMissionPools.mental.length],
    rotatingMissionPools.social[(day + 2) % rotatingMissionPools.social.length]
  ];
}

function dailyResetIfNeeded() {
  const key = todayKey();
  if (state.completedToday.date !== key) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (state.lastCompletionDate && state.lastCompletionDate !== yesterday && state.lastCompletionDate !== key) {
      state.streak = Math.max(0, state.streak - 1);
      state.attributes.disciplina = Math.max(1, state.attributes.disciplina - 1);
    }

    state.completedToday = { date: key };
    state.dailyMissions = pickRotatingMissions(key);
    saveState();
  }
}

function xpMultiplier() {
  return 1 + Math.min(0.5, state.streak * 0.03);
}

function completeMission(mission) {
  if (!mission || state.completedToday[mission.id]) return;

  const mult = xpMultiplier();
  const gainedXp = Math.round(mission.xp * mult);
  const gainedGold = Math.round(mission.gold * mult);

  state.xp += gainedXp;
  state.gold += gainedGold;
  state.goldEarned += gainedGold;
  state.attributes[mission.attribute] += 1;
  state.missionsCompleted += 1;
  state.completedToday[mission.id] = true;

  if (mission.id.includes('read')) state.dungeonsProgress.pages += 20;
  if (mission.id.includes('workout') || mission.id.includes('run')) state.dungeonsProgress.workouts += 1;
  if (mission.id.includes('save')) state.dungeonsProgress.savings += 1;

  if (mission.id === fixedDailyMission.id && state.lastCompletionDate !== todayKey()) {
    state.streak += 1;
    state.attributes.disciplina += 1;
    state.lastCompletionDate = todayKey();
  }

  while (state.xp >= XP_PER_LEVEL) {
    state.xp -= XP_PER_LEVEL;
    state.level += 1;
    state.maxLevel = Math.max(state.maxLevel, state.level);
    state.gold += 45;
  }

  evaluateAchievements();
  saveState();
  render();
}

function buyItem(item) {
  if (!item || state.gold < item.price || state.inventory.includes(item.name)) return;
  state.gold -= item.price;
  state.inventory.push(item.name);
  saveState();
  render();
}

function evaluateAchievements() {
  for (const ach of achievementsCatalog) {
    if (!state.achievements[ach.id] && ach.condition(state)) {
      state.achievements[ach.id] = true;
      if (ach.reward.includes('oro')) state.gold += 50;
    }
  }
}

function render() {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (!state.onboardingDone) {
    document.getElementById('tabs').classList.add('hidden');
    content.appendChild(document.getElementById('login-template').content.cloneNode(true));
    bindLogin();
    return;
  }

  document.getElementById('tabs').classList.remove('hidden');
  renderTabs();

  const tpl = document.getElementById(`${currentTab}-template`);
  content.appendChild(tpl.content.cloneNode(true));

  if (currentTab === 'home') renderHome();
  if (currentTab === 'missions') renderMissions();
  if (currentTab === 'dungeons') renderDungeons();
  if (currentTab === 'shop') renderShop();
  if (currentTab === 'profile') renderProfile();
}

function bindLogin() {
  const btn = document.getElementById('startJourney');
  btn.addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const playerClass = document.getElementById('playerClass').value;
    state.profile.name = name || 'Héroe Anónimo';
    state.profile.playerClass = playerClass;
    state.onboardingDone = true;
    saveState();
    render();
  });
}

function renderTabs() {
  const tabsNode = document.getElementById('tabs');
  tabsNode.innerHTML = tabs
    .map(tab => `<button class="tab ${currentTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`)
    .join('');

  tabsNode.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      currentTab = button.dataset.tab;
      render();
    });
  });
}

function renderHome() {
  const tier = state.level >= 12 ? 'Rango Monarca' : state.level >= 6 ? 'Rango Élite' : 'Rango Novato';
  const avatar = document.getElementById('avatarVisual');
  avatar.className = `avatar ${state.level >= 12 ? 'high' : state.level >= 6 ? 'mid' : ''}`;

  document.getElementById('avatarName').textContent = `${state.profile.name} • ${state.profile.playerClass}`;
  document.getElementById('avatarTier').textContent = `${tier} • Oro ${state.gold}`;
  document.getElementById('level').textContent = state.level;
  document.getElementById('xpFill').style.width = `${state.xp}%`;
  document.getElementById('xpText').textContent = `${state.xp} / ${XP_PER_LEVEL} XP`;
  document.getElementById('streak').textContent = state.streak;
  document.getElementById('multiplier').textContent = `Multiplicador activo: x${xpMultiplier().toFixed(2)}`;

  document.getElementById('statsGrid').innerHTML = Object.entries(state.attributes)
    .map(([name, value]) => `<div class="stat"><strong>${capitalize(name)}</strong><div>${value}</div></div>`)
    .join('');

  document.getElementById('fixedDailyMission').innerHTML = missionCard(fixedDailyMission, true);
  document.getElementById('dailyMissions').innerHTML = state.dailyMissions.map(m => missionCard(m)).join('');
  bindMissionButtons();
}

function renderMissions() {
  document.getElementById('fixedMissionList').innerHTML = missionCard(fixedDailyMission, true);
  document.getElementById('rotatingMissionList').innerHTML = state.dailyMissions.map(m => missionCard(m)).join('');
  document.getElementById('secondaryMissions').innerHTML = secondaryMissions.map(m => missionCard(m)).join('');
  bindMissionButtons();
}

function renderDungeons() {
  const node = document.getElementById('dungeons');
  node.innerHTML = dungeons.map(d => {
    const progress = Math.min(100, Math.round((state.dungeonsProgress[d.id] / d.goal) * 100));
    return `
      <article class="dungeon">
        <div class="title-row"><strong>${d.title}</strong><span class="epic">Jefe: ${d.boss}</span></div>
        <p>${state.dungeonsProgress[d.id]} / ${d.goal} ${d.unit}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="small">Recompensa rara: ${d.reward}</p>
        ${progress >= 100 ? '<p class="epic">Mazmorra completada ✅</p>' : ''}
      </article>
    `;
  }).join('');
}

function renderShop() {
  document.getElementById('gold').textContent = state.gold;
  const node = document.getElementById('shopItems');
  node.innerHTML = shopItems.map(item => {
    const owned = state.inventory.includes(item.name);
    return `
      <article class="shop-item">
        <div class="title-row"><strong>${item.name}</strong><span>${item.price} oro</span></div>
        <button data-buy="${item.id}" ${owned || state.gold < item.price ? 'disabled' : ''}>${owned ? 'Comprado' : 'Comprar'}</button>
      </article>
    `;
  }).join('');

  node.querySelectorAll('button[data-buy]').forEach(button => {
    button.addEventListener('click', () => buyItem(shopItems.find(i => i.id === button.dataset.buy)));
  });
}

function renderProfile() {
  document.getElementById('profileName').textContent = state.profile.name;
  document.getElementById('profileClass').textContent = state.profile.playerClass;
  document.getElementById('maxLevel').textContent = state.maxLevel;
  document.getElementById('missionsDone').textContent = state.missionsCompleted;
  document.getElementById('goldEarned').textContent = state.goldEarned;

  document.getElementById('achievements').innerHTML = achievementsCatalog.map(a => {
    const unlocked = state.achievements[a.id];
    return `<article class="achievement"><strong>${a.badge} ${a.title}</strong><p>${a.reward}</p><p class="small">${unlocked ? 'Desbloqueado' : 'Bloqueado'}</p></article>`;
  }).join('');

  document.getElementById('inventory').innerHTML = state.inventory.map(item => `<p>• ${item}</p>`).join('');
}

function missionCard(mission, fixed = false) {
  const done = !!state.completedToday[mission.id];
  return `
    <article class="mission">
      <div class="title-row">
        <strong>${mission.title}</strong>
        <span>${mission.xp} XP · ${mission.gold} oro</span>
      </div>
      <p class="small">${fixed ? 'Tipo: Misión diaria fija' : `Tipo: ${mission.category || 'Secundaria'}`}</p>
      <p class="small">Atributo: ${capitalize(mission.attribute)} · Dificultad: ${mission.difficulty} · Duración: ${mission.duration}</p>
      <button data-mission="${mission.id}" ${done ? 'disabled' : ''}>${done ? 'Completada' : 'Completar'}</button>
    </article>
  `;
}

function bindMissionButtons() {
  const all = [fixedDailyMission, ...state.dailyMissions, ...secondaryMissions];
  document.querySelectorAll('button[data-mission]').forEach(button => {
    button.addEventListener('click', () => completeMission(all.find(m => m.id === button.dataset.mission)));
  });
}

function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1);
}

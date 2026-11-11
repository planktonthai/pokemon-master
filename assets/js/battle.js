/* 寶可夢卡牌訓練營：模擬對戰（接近正式規則，6 張獎賞卡） */
(() => {
  const $ = s => document.querySelector(s);
  const QS = new URLSearchParams(location.search);
  let SIM = false;   /* 自動測試：電腦對電腦 */
  const sleep = ms => SIM ? new Promise(r => setTimeout(r, 0)) : new Promise(r => setTimeout(r, ms));
  const sfx = (n, o) => { if (!SIM) PTCG.sfx(n, o); };

  /* ================= 卡片資料 ================= */
  const P = (name, stage, hp, type, weak, retreat, attacks, extra = {}) => Object.assign({ kind: 'pokemon', name, stage, hp, type, weak, retreat, attacks }, extra);
  const DEFS = {
    charmander: P('小火龍', '基礎', 70, '火', '水', 1, [{ name: '火花', cost: ['火'], dmg: 30 }]),
    charmeleon: P('火恐龍', '1階進化', 100, '火', '水', 2, [{ name: '火焰爪', cost: ['火', '無色'], dmg: 60 }], { from: '小火龍' }),
    charizard: P('噴火龍', '2階進化', 180, '火', '水', 3, [{ name: '灼熱', cost: ['火'], dmg: 30, fx: 'burn', text: '對手陷入灼傷' }, { name: '爆炎', cost: ['火', '火', '無色'], dmg: 150 }], { from: '火恐龍' }),
    pikachu: P('皮卡丘', '基礎', 60, '雷', '鬥', 1, [{ name: '電擊', cost: ['雷'], dmg: 20, fx: 'coinPara', text: '擲硬幣正面：對手麻痺' }, { name: '電球', cost: ['雷', '無色'], dmg: 50 }]),
    raichu: P('雷丘', '1階進化', 110, '雷', '鬥', 1, [{ name: '十萬伏特', cost: ['雷', '雷'], dmg: 90 }], { from: '皮卡丘' }),
    manectric: P('雷電獸 ex', '基礎', 200, '雷', '鬥', 2, [{ name: '雷霆', cost: ['雷', '雷', '無色'], dmg: 120 }], { ex: true }),
    squirtle: P('傑尼龜', '基礎', 60, '水', '雷', 1, [{ name: '水槍', cost: ['水'], dmg: 30 }]),
    wartortle: P('卡咪龜', '1階進化', 100, '水', '雷', 1, [{ name: '水炮', cost: ['水', '無色'], dmg: 60 }], { from: '傑尼龜' }),
    blastoise: P('水箭龜', '2階進化', 180, '水', '雷', 3, [{ name: '加農水炮', cost: ['水', '水', '無色'], dmg: 140 }], { from: '卡咪龜' }),
    bulbasaur: P('妙蛙種子', '基礎', 70, '草', '火', 2, [{ name: '催眠粉', cost: ['草'], dmg: 10, fx: 'sleep', text: '對手陷入睡眠' }, { name: '藤鞭', cost: ['草', '無色'], dmg: 40 }]),
    ivysaur: P('妙蛙草', '1階進化', 100, '草', '火', 2, [{ name: '毒粉', cost: ['草'], dmg: 20, fx: 'poison', text: '對手陷入中毒' }, { name: '飛葉快刀', cost: ['草', '無色'], dmg: 60 }], { from: '妙蛙種子' }),
    venusaur: P('妙蛙花', '2階進化', 190, '草', '火', 3, [{ name: '陽光烈焰', cost: ['草', '草', '無色'], dmg: 150 }], { from: '妙蛙草' }),
    megaCharizard: P('超級噴火龍 ex', '2階進化', 330, '火', '水', 3, [{ name: '灼熱旋風', cost: ['火'], dmg: 60, fx: 'burn', text: '對手陷入灼傷' }, { name: '超級爆炎', cost: ['火', '火', '無色'], dmg: 220 }], { from: '火恐龍', ex: true, mega: true }),
    megaBlastoise: P('超級水箭龜 ex', '2階進化', 330, '水', '雷', 3, [{ name: '激流', cost: ['水'], dmg: 60 }, { name: '超級加農炮', cost: ['水', '水', '無色'], dmg: 220 }], { from: '卡咪龜', ex: true, mega: true }),
    lapras: P('拉普拉斯 ex', '基礎', 210, '水', '雷', 2, [{ name: '冰凍光束', cost: ['水', '水', '無色'], dmg: 120 }], { ex: true }),
    fire: { kind: 'energy', type: '火', name: '火能量' }, lightning: { kind: 'energy', type: '雷', name: '雷能量' },
    water: { kind: 'energy', type: '水', name: '水能量' }, grass: { kind: 'energy', type: '草', name: '草能量' },
    ball: { kind: 'trainer', sub: '物品', name: '精靈球', icon: '🎯', text: '從牌庫選 1 張基礎寶可夢加入手牌。' },
    potion: { kind: 'trainer', sub: '物品', name: '好傷藥', icon: '🧴', text: '治療自己 1 隻寶可夢 30 點傷害。' },
    switchc: { kind: 'trainer', sub: '物品', name: '寶可夢交替', icon: '🔄', text: '把戰鬥寶可夢和備戰區的寶可夢交換。' },
    candy: { kind: 'trainer', sub: '物品', name: '神奇糖果', icon: '🍬', text: '讓基礎寶可夢直接進化成 2 階進化。' },
    research: { kind: 'trainer', sub: '支援者', name: '博士的研究', icon: '📚', text: '丟掉所有手牌，從牌庫抽 7 張。' },
    boss: { kind: 'trainer', sub: '支援者', name: '老大的指令', icon: '👉', text: '把對手備戰區的 1 隻寶可夢換到戰鬥場。' }
  };
  const DECKS = {
    fireThunder: { name: '🔥⚡ 火焰雷電隊', list: { charmander: 4, charmeleon: 3, charizard: 2, pikachu: 4, raichu: 3, manectric: 1, ball: 4, potion: 3, switchc: 3, candy: 2, research: 4, boss: 2, fire: 13, lightning: 12 } },
    waterLeaf: { name: '💧🌿 水流森林隊', list: { squirtle: 4, wartortle: 3, blastoise: 2, bulbasaur: 4, ivysaur: 3, venusaur: 1, lapras: 1, ball: 4, potion: 3, switchc: 3, candy: 2, research: 4, boss: 2, water: 12, grass: 12 } }
  };
  /* 電腦強度：D1 見習生 ～ D5 終極魔王 */
  const LEVELS = {
    1: { title: 'D1 見習生', skipEnergy: .5, randomTarget: true, randomAtk: 1, attackSkip: .2, evolve: .5, items: ['精靈球'], supporters: [], smartSwitch: false, protect: false, smartEnergy: false, researchAt: 0, exInDeck: 0 },
    2: { title: 'D2 訓練家', skipEnergy: .25, randomTarget: false, randomAtk: .7, attackSkip: 0, evolve: .8, items: ['精靈球'], supporters: ['博士的研究'], smartSwitch: false, protect: false, smartEnergy: false, researchAt: 3, exInDeck: 0 },
    3: { title: 'D3 道館館主', skipEnergy: 0, randomTarget: false, randomAtk: 0, attackSkip: 0, evolve: 1, items: ['精靈球', '神奇糖果', '好傷藥', '寶可夢交替'], supporters: ['博士的研究', '老大的指令'], smartSwitch: true, protect: false, smartEnergy: false, researchAt: 4, exInDeck: 1 },
    4: { title: 'D4 四天王', skipEnergy: 0, randomTarget: false, randomAtk: 0, attackSkip: 0, evolve: 1, items: ['精靈球', '神奇糖果', '好傷藥', '寶可夢交替'], supporters: ['博士的研究', '老大的指令'], smartSwitch: true, protect: true, smartEnergy: true, researchAt: 5, exInDeck: 1, aggroSwitch: true, consistent: true, bonusDraw: 2 },
    5: { title: 'D5 終極魔王', skipEnergy: 0, randomTarget: false, randomAtk: 0, attackSkip: 0, evolve: 1, items: ['精靈球', '神奇糖果', '好傷藥', '寶可夢交替'], supporters: ['博士的研究', '老大的指令'], smartSwitch: true, protect: true, smartEnergy: true, researchAt: 5, exInDeck: 2, mega: true, safeStart: true, aggroSwitch: true, consistent: true, bonusDraw: 3 }
  };
  /* 依強度調整電腦牌組（總數維持 60 張） */
  function deckList(key, lv) {
    const L = Object.assign({}, DECKS[key].list), cfg = LEVELS[lv] || LEVELS[3];
    const fire = key === 'fireThunder', ex = fire ? 'manectric' : 'lapras', filler = fire ? 'lightning' : 'water';
    L[ex] = cfg.exInDeck; L[filler] += 1 - cfg.exInDeck;
    if (cfg.exInDeck === 2) { const basic = fire ? 'pikachu' : 'bulbasaur'; L[basic] -= 1; L[filler] += 1; }
    if (cfg.consistent) { L.potion -= 2; L.ball += 1; L.research += 1; }
    if (cfg.mega) { const s2 = fire ? 'charizard' : 'blastoise', mg = fire ? 'megaCharizard' : 'megaBlastoise'; L[mg] = L[s2]; L[s2] = 0; L.candy += 1; L.switchc -= 1; }
    return L;
  }
  const TYPES = { '草': 'grass', '火': 'fire', '水': 'water', '雷': 'lightning', '鬥': 'fighting', '無色': 'colorless' };
  const ATK_SFX = { '火': 'attack_fire', '水': 'attack_water', '雷': 'attack_zap' };

  /* ================= 遊戲狀態 ================= */
  let uid = 0;
  const G = { turn: 0, cur: null, over: false, busy: false, P: {} };
  const other = s => s === 'me' ? 'ai' : 'me';
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function makeDeck(key, lv) { const d = []; for (const [id, n] of Object.entries(lv ? deckList(key, lv) : DECKS[key].list)) for (let i = 0; i < n; i++) d.push({ uid: ++uid, id, def: DEFS[id] }); return shuffle(d); }
  function player(key, deckKey, lv) { return { key, deckKey, lv, deck: makeDeck(deckKey, lv), hand: [], discard: [], prizes: [], active: null, bench: [], turns: 0, energyUsed: false, supporterUsed: false, retreated: false }; }
  function mon(card) { return { uid: card.uid, cards: [card], def: card.def, energies: [], dmg: 0, status: null, poison: false, burn: false, playedTurn: G.turn, evolvedTurn: -1 }; }
  const hpLeft = m => m.def.hp - m.dmg;
  const inPlay = p => [p.active, ...p.bench].filter(Boolean);
  const isBasic = c => c.def.kind === 'pokemon' && c.def.stage === '基礎';
  const draw = (p, n = 1) => { let k = 0; while (k < n && p.deck.length) { p.hand.push(p.deck.shift()); k++; } return k; };

  function canPay(energies, cost) {
    const cnt = {}; energies.forEach(e => cnt[e] = (cnt[e] || 0) + 1);
    let colorless = 0;
    for (const c of cost) { if (c === '無色') { colorless++; continue; } if (cnt[c]) cnt[c]--; else return false; }
    return Object.values(cnt).reduce((a, b) => a + b, 0) >= colorless;
  }
  function missing(energies, cost) {
    const cnt = {}; energies.forEach(e => cnt[e] = (cnt[e] || 0) + 1);
    let need = 0, colorless = 0, spare;
    for (const c of cost) { if (c === '無色') { colorless++; continue; } if (cnt[c]) cnt[c]--; else need++; }
    spare = Object.values(cnt).reduce((a, b) => a + b, 0);
    return need + Math.max(0, colorless - spare);
  }
  function calcDamage(att, def, base) {
    if (!base) return 0;
    let d = base;
    if (def.def.weak === att.def.type) d *= 2;
    if (def.def.resist === att.def.type) d -= 30;
    return Math.max(0, d);
  }

  /* ================= 規則判斷（給玩家看的原因） ================= */
  const whyNoEvolve = (p, m) => {
    if (p.turns <= 1) return '自己的第一回合不能進化';
    if (m.playedTurn >= G.turn) return '剛放上場的寶可夢，這回合不能進化';
    if (m.evolvedTurn === G.turn) return '這隻這回合已經進化過了';
    return null;
  };
  const whySupporter = p => p.supporterUsed ? '支援者每回合只能用 1 張' : G.turn === 1 ? '先攻的第一回合不能用支援者' : null;
  const whyAttack = (p, a) => {
    const m = p.active;
    if (G.turn === 1) return '先攻的第一回合不能攻擊';
    if (m.status === 'sleep') return '睡著了，不能攻擊';
    if (m.status === 'para') return '麻痺了，不能攻擊';
    if (!canPay(m.energies, a.cost)) return '能量不夠';
    return null;
  };
  const whyRetreat = p => {
    const m = p.active;
    if (p.retreated) return '這回合已經撤退過了';
    if (m.status === 'sleep' || m.status === 'para') return m.status === 'sleep' ? '睡著了，不能撤退' : '麻痺了，不能撤退';
    if (!p.bench.length) return '備戰區沒有寶可夢';
    if (m.energies.length < m.def.retreat) return `撤退要丟掉 ${m.def.retreat} 個能量，能量不夠`;
    return null;
  };
  const evolveTargets = (p, card) => inPlay(p).filter(m => m.def.name === card.def.from);
  const candyTargets = (p, card) => { const s1 = Object.values(DEFS).find(d => d.name === card.def.from); return s1 ? inPlay(p).filter(m => m.def.name === s1.from) : []; };

  /* ================= 畫面 ================= */
  const en = t => PTCG.energy(t);
  function bcard(m, where) {
    if (!m) return `<div class="bc empty">${where === 'active' ? '戰鬥場' : ''}</div>`;
    const d = m.def, left = Math.max(0, hpLeft(m));
    return `<div class="bc t-${TYPES[d.type]} ${d.ex ? 'ex' : ''} ${d.mega ? 'mega' : ''} ${m.status ? 'st-' + m.status : ''}" data-uid="${m.uid}" tabindex="0" role="button" aria-label="${d.name}，HP 剩 ${left} / ${d.hp}${m.energies.length ? '，能量 ' + m.energies.join('、') : ''}${m.status ? '，' + ({ sleep: '睡眠', para: '麻痺', conf: '混亂' })[m.status] : ''}">
      <div class="bc-top"><span class="stg">${d.stage}</span><b>${d.name}</b></div>
      <div class="bc-art">${d.type === '無色' ? '★' : d.type}</div>
      <div class="bc-hp"><i style="width:${left / d.hp * 100}%" class="${left / d.hp <= .35 ? 'low' : ''}"></i><span>${left}/${d.hp}</span></div>
      <div class="bc-en">${m.energies.map(en).join('')}</div>
      ${m.dmg ? `<div class="bc-dmg">${m.dmg}</div>` : ''}
      <div class="bc-mk">${m.poison ? '<span class="mk poison">毒</span>' : ''}${m.burn ? '<span class="mk burn">燒</span>' : ''}${m.status ? `<span class="mk st">${{ sleep: '😴', para: '⚡', conf: '😵' }[m.status]}</span>` : ''}</div>
    </div>`;
  }
  function hcard(c) {
    const d = c.def;
    if (d.kind === 'energy') return `<button class="hc energy t-${TYPES[d.type]}" data-uid="${c.uid}"><span class="k">能量</span><b class="big">${d.type}</b></button>`;
    if (d.kind === 'trainer') return `<button class="hc trainer ${d.sub === '支援者' ? 'sup' : ''}" data-uid="${c.uid}"><span class="k">${d.sub}</span><b>${d.icon}</b><small>${d.name}</small></button>`;
    return `<button class="hc t-${TYPES[d.type]} ${d.ex ? 'ex' : ''}" data-uid="${c.uid}"><span class="k">${d.stage}</span><small>${d.name}</small><b>${d.type}</b><span class="k">HP ${d.hp}</span></button>`;
  }
  function render() {
    if (SIM) return;
    for (const s of ['me', 'ai']) {
      const p = G.P[s], root = $('#' + s);
      root.querySelector('.active').innerHTML = bcard(p.active, 'active');
      root.querySelector('.bench').innerHTML = [0, 1, 2, 3, 4].map(i => bcard(p.bench[i], 'bench')).join('');
      root.querySelector('.prizes').innerHTML = p.prizes.map(() => '<span class="pz"></span>').join('') + `<em>獎賞卡 ${p.prizes.length}</em>`;
      root.querySelector('.info').innerHTML = `${s === 'me' ? '🧢 你' : (G.oppIcon || '🤖') + ' ' + (G.oppName || '電腦')}　🃏 手牌 ${p.hand.length}　📚 牌庫 ${p.deck.length}　🗑️ 棄牌 ${p.discard.length}`;
    }
    $('#hand').innerHTML = G.P.me.hand.map(hcard).join('');
    const hc = $('#handCount'); if (hc) hc.textContent = G.P.me.hand.length + ' 張';
    const myTurn = G.cur === 'me' && !G.busy && !G.over;
    $('#endTurn').disabled = !myTurn;
    document.body.classList.toggle('my-turn', myTurn);
    $('#turnInfo').textContent = G.over ? '比賽結束' : G.cur === 'me' ? `第 ${G.turn} 回合・輪到你！` : `第 ${G.turn} 回合・${name('ai')}思考中…`;
    hint();
  }
  function log(t, cls = '') {
    if (SIM) return;
    const el = document.createElement('div'); el.className = 'lg ' + cls; el.innerHTML = t;
    const L = $('#log'); L.prepend(el); while (L.children.length > 30) L.lastChild.remove();
  }
  function hint() {
    const h = $('#hint'); if (!h) return;
    if (G.over || G.cur !== 'me') { h.textContent = ''; return; }
    const p = G.P.me, m = p.active, tips = [];
    if (!p.energyUsed && p.hand.some(c => c.def.kind === 'energy')) tips.push('記得附 1 張能量');
    if (p.bench.length < 5 && p.hand.some(isBasic)) tips.push('可以把基礎寶可夢放到備戰區');
    if (m && m.def.attacks.some(a => !whyAttack(p, a))) tips.push('可以攻擊了！點你的戰鬥寶可夢');
    if (G.turn === 1) tips.unshift('先攻第一回合不能攻擊、不能用支援者');
    h.innerHTML = tips.length ? '💡 ' + tips.join('・') : '💡 準備好了就按「結束回合」';
  }
  function pop(side, text, cls = '') {
    const host = $(`#${side} .active .bc`); if (!host) return;
    const e = document.createElement('div'); e.className = 'dmg-pop ' + cls; e.textContent = text; host.appendChild(e); setTimeout(() => e.remove(), 1300);
  }

  /* ================= 對話框 ================= */
  function ask(title, options, { cancel = true, card } = {}) {
    return new Promise(res => {
      const M = $('#modal'), back = document.activeElement;
      M.setAttribute('aria-labelledby', 'mTitle');
      M.innerHTML = `<div class="box pop-in">${card ? `<div class="mcard">${PTCG.card(card)}</div>` : ''}<h2 id="mTitle">${title}</h2><div class="opts2">${options.map((o, i) =>
        `<button class="btn ${o.disabled ? '' : o.cls || 'sun'}" data-i="${i}" ${o.disabled ? 'aria-disabled="true"' : ''}>${o.label}${o.disabled && o.why ? `<small>${o.why}</small>` : ''}</button>`).join('')}</div>${cancel ? '<button class="btn" data-i="-1">取消</button>' : ''}</div>`;
      M.classList.add('show');
      const btns = [...M.querySelectorAll('[data-i]')];
      const done = v => { M.classList.remove('show'); M.innerHTML = ''; document.removeEventListener('keydown', key, true); if (back && back.focus && document.contains(back)) back.focus(); res(v); };
      const key = e => {
        if (e.key === 'Escape' && cancel) { e.preventDefault(); done(null); }
        if (e.key === 'Tab') { e.preventDefault(); const i = btns.indexOf(document.activeElement); btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus(); }
      };
      document.addEventListener('keydown', key, true);
      btns.forEach(b => b.onclick = () => { if (b.getAttribute('aria-disabled') === 'true') { PTCG.restart(b, 'shake'); return; } const i = +b.dataset.i; done(i < 0 ? null : options[i].value); });
      (btns.find(b => b.getAttribute('aria-disabled') !== 'true') || btns[0])?.focus();
    });
  }
  const say = (title, btn = '好！') => ask(title, [{ label: btn, value: true }], { cancel: false });
  async function flip(label) {
    if (SIM) return Math.random() < .5;
    const c = $('#coin'); c.classList.add('show'); c.querySelector('.coin').textContent = '?'; c.querySelector('p').textContent = label;
    PTCG.restart(c.querySelector('.coin'), 'spin'); sfx('card_flip');
    const heads = Math.random() < .5; await sleep(1350);
    c.querySelector('.coin').textContent = heads ? '正' : '反'; c.querySelector('.coin').classList.toggle('tails', !heads);
    await sleep(700); c.classList.remove('show');
    return heads;
  }

  /* ================= 動作 ================= */
  function toBench(p, card) { p.hand = p.hand.filter(c => c !== card); const m = mon(card); p.bench.push(m); return m; }
  function evolve(p, card, m) {
    p.hand = p.hand.filter(c => c !== card);
    m.cards.push(card); m.def = card.def; m.status = null; m.poison = m.burn = false; m.evolvedTurn = G.turn;
  }
  function attach(p, card, m) { p.hand = p.hand.filter(c => c !== card); m.energies.push(card.def.type); m.cards.push(card); p.energyUsed = true; }
  function discardCard(p, card) { p.hand = p.hand.filter(c => c !== card); p.discard.push(card); }
  function switchActive(p, m, clear = true) {
    const old = p.active; p.bench = p.bench.filter(b => b !== m); if (old) { if (clear) { old.status = null; old.poison = old.burn = false; } p.bench.push(old); } p.active = m;
  }
  function discardEnergy(m, n) {
    const owner = G.P[ownerOf(m)];
    for (let i = 0; i < n; i++) { const t = m.energies.pop(); const idx = m.cards.findLastIndex(c => c.def.kind === 'energy' && c.def.type === t); if (idx >= 0) owner.discard.push(m.cards.splice(idx, 1)[0]); }
  }
  const ownerOf = m => inPlay(G.P.me).includes(m) ? 'me' : 'ai';
  const name = s => s === 'me' ? (SIM ? `D${G.P.me.lv}` : '你') : (G.oppName || '電腦');
  const prizeOf = d => d.mega ? 3 : d.ex ? 2 : 1;

  async function useTrainer(side, card, choose) {
    const p = G.P[side], o = G.P[other(side)], d = card.def;
    if (d.name === '精靈球') {
      const basics = p.deck.filter(isBasic); discardCard(p, card);
      if (!basics.length) { log(`${name(side)}用了精靈球，但牌庫沒有基礎寶可夢了`); shuffle(p.deck); return; }
      const uniq = [...new Map(basics.map(c => [c.def.name, c])).values()];
      const pick = await choose('要找哪一隻基礎寶可夢？', uniq.map(c => ({ label: c.def.name, value: c })));
      const got = pick || uniq[0]; p.deck = p.deck.filter(c => c !== got); p.hand.push(got); shuffle(p.deck);
      log(`🎯 ${name(side)}用精靈球找到了<b>${got.def.name}</b>`); sfx('card_draw');
    } else if (d.name === '好傷藥') {
      const hurt = inPlay(p).filter(m => m.dmg > 0);
      const t = await choose('要治療哪一隻？', hurt.map(m => ({ label: `${m.def.name}（受傷 ${m.dmg}）`, value: m }))); if (!t) return false;
      discardCard(p, card); t.dmg = Math.max(0, t.dmg - 30); log(`🧴 ${name(side)}幫<b>${t.def.name}</b>治療了 30 點`); sfx('star');
    } else if (d.name === '寶可夢交替') {
      const t = await choose('要換哪一隻上場？', p.bench.map(m => ({ label: `${m.def.name}（HP ${hpLeft(m)}）`, value: m }))); if (!t) return false;
      discardCard(p, card); switchActive(p, t); log(`🔄 ${name(side)}把<b>${t.def.name}</b>換上場`); sfx('card_flip');
    } else if (d.name === '神奇糖果') {
      const opts = [];
      p.hand.filter(c => c.def.stage === '2階進化').forEach(s2 => candyTargets(p, s2).forEach(m => opts.push({ label: `${m.def.name} → ${s2.def.name}`, value: [s2, m], disabled: !!whyNoEvolve(p, m), why: whyNoEvolve(p, m) })));
      const t = await choose('要讓誰直接進化成 2 階？', opts); if (!t) return false;
      discardCard(p, card); evolve(p, t[0], t[1]); log(`🍬 ${name(side)}用神奇糖果，讓寶可夢直接進化成<b>${t[0].def.name}</b>！`); sfx('star');
    } else if (d.name === '博士的研究') {
      discardCard(p, card); p.supporterUsed = true;
      const n = p.hand.length; p.discard.push(...p.hand); p.hand = []; const k = draw(p, 7);
      log(`📚 ${name(side)}丟掉 ${n} 張手牌，抽了 ${k} 張`); sfx('card_draw');
    } else if (d.name === '老大的指令') {
      const t = await choose('要把對手哪一隻拉到戰鬥場？', o.bench.map(m => ({ label: `${m.def.name}（HP ${hpLeft(m)}）`, value: m }))); if (!t) return false;
      discardCard(p, card); p.supporterUsed = true; switchActive(o, t); log(`👉 ${name(side)}用老大的指令，把<b>${t.def.name}</b>拉上戰鬥場！`); sfx('attack_hit');
    }
    if (d.sub === '支援者') p.supporterUsed = true;
    return true;
  }
  const trainerUsable = (side, card) => {
    const p = G.P[side], o = G.P[other(side)], d = card.def;
    if (d.sub === '支援者') { const w = whySupporter(p); if (w) return w; }
    if (d.name === '好傷藥' && !inPlay(p).some(m => m.dmg > 0)) return '沒有受傷的寶可夢';
    if (d.name === '寶可夢交替' && !p.bench.length) return '備戰區沒有寶可夢';
    if (d.name === '老大的指令' && !o.bench.length) return '對手備戰區沒有寶可夢';
    if (d.name === '神奇糖果') {
      const ok = p.hand.some(c => c.def.stage === '2階進化' && candyTargets(p, c).some(m => !whyNoEvolve(p, m)));
      if (!ok) return p.turns <= 1 ? '自己的第一回合不能進化' : '手上沒有能用的 2 階進化卡或場上沒有對應的基礎寶可夢';
    }
    return null;
  };

  async function doAttack(side, a) {
    const p = G.P[side], o = G.P[other(side)], m = p.active;
    log(`⚔️ ${name(side)}的<b>${m.def.name}</b>使出「${a.name}」！`, 'big');
    if (m.status === 'conf') {
      const h = await flip('混亂：正面才能攻擊');
      if (!h) { m.dmg += 30; log(`😵 攻擊失敗！${m.def.name}自己受到 30 點傷害`); pop(side, '-30'); sfx('damage'); render(); await checkKO(); if (!G.over) await endTurn(); return; }
    }
    const el = $(`#${side} .active .bc`); if (el) PTCG.restart(el, side === 'me' ? 'lunge-up' : 'lunge-down');
    sfx(ATK_SFX[m.def.type] || 'attack_hit');
    await sleep(380);
    const dmg = calcDamage(m, o.active, a.dmg);
    if (!SIM && typeof PTCGArena !== 'undefined') PTCGArena.hit(other(side), { '火': '#FF7A2B', '水': '#4FB6EE', '雷': '#FFE14D', '草': '#7CE07A' }[m.def.type] || '#FFFFFF', dmg >= 100 ? 1.6 : 1);
    if (a.dmg) {
      o.active.dmg += dmg;
      const tag = o.active.def.weak === m.def.type ? '（弱點 ×2！）' : o.active.def.resist === m.def.type ? '（抗性 −30）' : '';
      pop(other(side), `-${dmg}`); const t = $(`#${other(side)} .active .bc`); if (t) PTCG.restart(t, 'shake'); sfx('damage');
      log(`💥 對<b>${o.active.def.name}</b>造成 ${dmg} 點傷害${tag}`);
    }
    if (a.fx && hpLeft(o.active) > 0) {
      if (a.fx === 'coinPara') { if (await flip('正面：對手麻痺')) { o.active.status = 'para'; log(`⚡ ${o.active.def.name}麻痺了！`); } }
      if (a.fx === 'sleep') { o.active.status = 'sleep'; log(`😴 ${o.active.def.name}睡著了！`); }
      if (a.fx === 'poison') { o.active.poison = true; log(`🟢 ${o.active.def.name}中毒了！`); }
      if (a.fx === 'burn') { o.active.burn = true; log(`🟠 ${o.active.def.name}灼傷了！`); }
    }
    render(); await sleep(500);
    await checkKO();
    if (!G.over) await endTurn();
  }

  async function retreat(side, target) {
    const p = G.P[side], m = p.active;
    discardEnergy(m, m.def.retreat); p.retreated = true; switchActive(p, target);
    log(`🔄 ${name(side)}的${m.def.name}撤退，換<b>${target.def.name}</b>上場`); sfx('card_flip');
  }

  /* ================= 昏厥、獎賞卡、勝負 ================= */
  async function checkKO() {
    for (const s of [other(G.cur), G.cur]) {
      const p = G.P[s], m = p.active;
      if (!m || hpLeft(m) > 0) continue;
      const taker = G.P[other(s)], n = prizeOf(m.def);
      log(`💫 ${name(s)}的<b>${m.def.name}</b>昏厥了！`, 'big'); sfx('knockout');
      p.discard.push(...m.cards); p.active = null; render(); await sleep(600);
      for (let i = 0; i < n && taker.prizes.length; i++) taker.hand.push(taker.prizes.shift());
      log(`🎁 ${name(other(s))}拿了 ${n} 張獎賞卡${m.def.mega ? '（超級進化 ex 給 3 張！）' : m.def.ex ? '（ex 給 2 張！）' : ''}`); sfx('star'); render(); await sleep(500);
      if (!taker.prizes.length) return win(other(s), '拿完了 6 張獎賞卡');
      if (!p.bench.length) return win(other(s), `${name(s)}的場上沒有寶可夢了`);
      let pick;
      if (s === 'me' && !SIM) pick = await ask('選 1 隻備戰區的寶可夢上戰鬥場', p.bench.map(b => ({ label: `${b.def.name}（HP ${hpLeft(b)}）`, value: b })), { cancel: false });
      else pick = aiPromote(s);
      switchActive(p, pick, false); log(`➡️ ${name(s)}派出<b>${pick.def.name}</b>`); sfx('card_place'); render();
    }
  }
  async function win(side, why) {
    G.over = true;
    if (SIM) { G.simDone && G.simDone(side, G.turn); return; }
    render();
    const won = side === 'me';
    PTCG.recordBattle(G.P.ai.lv, won);
    if (G.boss) {
      if (won) PTCG.bossWin(G.boss.no); PTCG.starPill(document.querySelector('.star-pill'));
      if (won) { sfx('level_clear'); PTCG.confetti(160); } else sfx('knockout');
      const last = G.boss.no === 5;
      const opts = won && !last ? [{ label: `⚔️ 挑戰下一位魔王`, value: 'next', cls: 'berry' }] : [];
      opts.push({ label: '🔁 再挑戰一次', value: 'again' }, { label: '🏰 回魔王關', value: 'back', cls: 'grass' });
      const r = await ask(`${won ? (last ? '👑 你打倒了終極魔王！你就是卡牌大師！' : `🏆 你打敗了 ${G.oppName}！`) : `💪 ${G.oppName}贏了，再接再厲！`}<br><small>${why}</small><br><small>「${won ? G.boss.lose : G.boss.win}」</small>`, opts, { cancel: false });
      if (r === 'next') location.href = 'battle.html?boss=' + (G.boss.no + 1);
      else if (r === 'again') location.reload(); else location.href = 'boss.html';
      return;
    }
    PTCG.setStars('battle', won ? 3 : 1); PTCG.starPill(document.querySelector('.star-pill'));
    if (won) { sfx('level_clear'); PTCG.confetti(120); } else sfx('knockout');
    const r = await ask(`${won ? '🏆 你贏了！' : '💪 電腦贏了，再接再厲！'}<br><small>${why}</small>${won ? '<br><small>得到 3 顆星！</small>' : '<br><small>完成一場比賽，得到 1 顆星。</small>'}`,
      [{ label: '🔁 再比一場', value: 'again' }, { label: '🗺 回地圖', value: 'map', cls: 'grass' }], { cancel: false });
    if (r === 'again') location.reload(); else location.href = '../index.html?zone=volcano';
  }

  /* ================= 回合 ================= */
  async function checkup() {
    for (const s of [G.cur, other(G.cur)]) {
      const m = G.P[s].active; if (!m) continue;
      if (m.poison) { m.dmg += 10; log(`🟢 中毒：${m.def.name}受到 10 點傷害`); pop(s, '-10'); }
      if (m.burn) { m.dmg += 20; log(`🟠 灼傷：${m.def.name}受到 20 點傷害`); pop(s, '-20'); render(); if (await flip(`${m.def.name}灼傷：正面就痊癒`)) { m.burn = false; log('🟠 灼傷痊癒了！'); } }
      if (m.status === 'sleep') { render(); if (await flip(`${m.def.name}睡眠：正面就醒來`)) { m.status = null; log(`😴 ${m.def.name}醒來了！`); } }
      if (m.status === 'para' && s === G.cur) { m.status = null; log(`⚡ ${m.def.name}的麻痺解除了`); }
    }
    render();
  }
  async function endTurn() {
    G.busy = true; render();
    await checkup(); await checkKO(); if (G.over) return;
    await sleep(400);
    startTurn(other(G.cur));
  }
  async function startTurn(side) {
    G.cur = side; G.turn++; const p = G.P[side];
    p.turns++; p.energyUsed = p.supporterUsed = p.retreated = false;
    if (!p.deck.length) { log(`📭 ${name(side)}的牌庫沒有牌了！`); return win(other(side), `${name(side)}回合開始時沒辦法抽牌`); }
    draw(p, 1); sfx('card_draw', { vol: .6 });
    log(`—— 第 ${G.turn} 回合：${side === 'me' ? '輪到你了！' : name('ai') + '的回合'} ——`, 'turn');
    if (G.turn > 160) return win(G.P.me.prizes.length <= G.P.ai.prizes.length ? 'me' : 'ai', '比賽時間到');
    if (side === 'me' && !SIM) { G.busy = false; render(); } else { G.busy = true; render(); await sleep(700); await aiTurn(side); }
  }

  /* ================= 玩家操作 ================= */
  async function onHand(card) {
    if (G.cur !== 'me' || G.busy || G.over) return;
    const p = G.P.me, d = card.def, opts = [];
    if (d.kind === 'pokemon' && d.stage === '基礎') opts.push({ label: '🪑 放到備戰區', value: 'bench', disabled: p.bench.length >= 5, why: '備戰區最多 5 隻' });
    if (d.kind === 'pokemon' && d.stage !== '基礎') {
      const ts = evolveTargets(p, card);
      if (!ts.length) opts.push({ label: '⬆️ 進化', disabled: true, why: `場上沒有「${d.from}」` });
      ts.forEach(m => opts.push({ label: `⬆️ 讓 ${m.def.name}${m === p.active ? '（戰鬥場）' : ''} 進化`, value: ['evo', m], disabled: !!whyNoEvolve(p, m), why: whyNoEvolve(p, m) }));
    }
    if (d.kind === 'energy') inPlay(p).forEach(m => opts.push({ label: `⚡ 附給 ${m.def.name}${m === p.active ? '（戰鬥場）' : ''}`, value: ['en', m], disabled: p.energyUsed, why: '每回合只能附 1 張能量' }));
    if (d.kind === 'trainer') { const w = trainerUsable('me', card); opts.push({ label: `✨ 使用「${d.name}」`, value: 'use', disabled: !!w, why: w }); }
    const r = await ask(d.kind === 'trainer' ? d.text : d.kind === 'energy' ? '要附給哪一隻寶可夢？' : '要怎麼使用這張卡？', opts, { card: d.kind === 'energy' ? null : cardView(d) });
    if (!r) return;
    G.busy = true;
    if (r === 'bench') { const m = toBench(p, card); log(`🪑 你把<b>${m.def.name}</b>放到備戰區`); sfx('card_place'); }
    else if (r[0] === 'evo') { const from = r[1].def.name; evolve(p, card, r[1]); log(`⬆️ ${from}進化成<b>${d.name}</b>！`, 'big'); sfx('star'); render(); PTCG.sparkle($(`[data-uid="${r[1].uid}"]`), 10); }
    else if (r[0] === 'en') { attach(p, card, r[1]); log(`⚡ 你把${d.name}附給<b>${r[1].def.name}</b>`); sfx('energy_attach'); }
    else if (r === 'use') await useTrainer('me', card, (t, o) => ask(t, o));
    G.busy = false; render();
  }
  async function onActive() {
    if (G.cur !== 'me' || G.busy || G.over) return;
    const p = G.P.me, m = p.active, opts = m.def.attacks.map(a => ({ label: `⚔️ ${a.name}　${a.cost.map(en).join('')}　${a.dmg || ''}${a.text ? `<small>${a.text}</small>` : ''}`, value: ['atk', a], disabled: !!whyAttack(p, a), why: whyAttack(p, a), cls: 'berry' }));
    const w = whyRetreat(p); opts.push({ label: `🔄 撤退（丟 ${m.def.retreat} 個能量）`, value: ['ret'], disabled: !!w, why: w });
    const r = await ask(`${m.def.name}要做什麼？`, opts, { card: cardView(m.def) });
    if (!r) return;
    if (r[0] === 'atk') { G.busy = true; render(); await doAttack('me', r[1]); }
    else { const t = await ask('要換哪一隻上場？', p.bench.map(b => ({ label: `${b.def.name}（HP ${hpLeft(b)}）`, value: b }))); if (t) { await retreat('me', t); render(); } }
  }
  function cardView(d) { return d.kind === 'pokemon' ? Object.assign({}, d, { kind: 'pokemon' }) : { kind: 'trainer', sub: d.sub, name: d.name, icon: d.icon, text: d.text }; }

  /* ================= 電腦對手 ================= */
  function bestAttack(m, target, energies = m.energies) {
    let best = null;
    for (const a of m.def.attacks) if (canPay(energies, a.cost)) { const d = target ? calcDamage(m, target, a.dmg) : a.dmg; if (!best || d > best.d) best = { a, d }; }
    return best;
  }
  function aiBest(list, foe) {
    return list.slice().sort((x, y) => {
      const bx = bestAttack(x, foe), by = bestAttack(y, foe);
      return ((by ? by.d : 0) - (bx ? bx.d : 0)) || (hpLeft(y) - hpLeft(x));
    })[0];
  }
  /* 對手下回合最多能打多少（假設再附 1 張能量） */
  function threat(attacker, target) {
    if (!attacker) return 0;
    let mx = 0;
    for (const a of attacker.def.attacks) if (missing(attacker.energies, a.cost) <= 1) mx = Math.max(mx, calcDamage(attacker, target, a.dmg));
    return mx;
  }
  /* 昏厥後派誰上場 */
  function aiPromote(side) {
    const p = G.P[side], foe = G.P[other(side)].active, L = LEVELS[p.lv] || LEVELS[3];
    if (L.randomTarget) return p.bench[Math.random() * p.bench.length | 0];
    if (!L.protect) return aiBest(p.bench, foe);
    if (L.aggroSwitch) { const ready = p.bench.filter(m => bestAttack(m, foe)); if (ready.length) return aiBest(ready, foe); const weak = p.bench.filter(m => foe && foe.def.weak === m.def.type); if (weak.length) return weak.sort((a, b) => b.energies.length - a.energies.length)[0]; }
    /* 高手：能打的優先，打不贏時派非 ex 擋一下 */
    const ready = p.bench.filter(m => bestAttack(m, foe));
    if (ready.length) return aiBest(ready, foe);
    return p.bench.slice().sort((a, b) => (prizeOf(a.def) - prizeOf(b.def)) || (hpLeft(b) - hpLeft(a)))[0];
  }
  async function aiTurn(side = 'ai') {
    if (G.over) return;
    const p = G.P[side], o = G.P[other(side)], L = LEVELS[p.lv] || LEVELS[3], who = name(side);
    const act = async (t, s) => { log(t); if (s) sfx(s); render(); await sleep(750); };
    const roll = x => Math.random() < x;
    const can = nm => L.items.includes(nm) || L.supporters.includes(nm);
    const playBasics = async () => {
      for (const c of p.hand.filter(isBasic)) {
        if (p.bench.length >= 5) break;
        if (L.safeStart && c.def.ex && p.bench.length >= 3) continue;   /* 魔王：ex 不急著上場 */
        toBench(p, c); await act(`🪑 ${who}把<b>${c.def.name}</b>放到備戰區`, 'card_place');
      }
    };
    const evolveAll = async () => {
      if (!roll(L.evolve)) return;
      for (const c of p.hand.filter(c => c.def.kind === 'pokemon' && c.def.stage !== '基礎')) {
        const t = evolveTargets(p, c).filter(m => !whyNoEvolve(p, m)).sort((a, b) => (b === p.active) - (a === p.active))[0];
        if (t) { const f = t.def.name; evolve(p, c, t); await act(`⬆️ ${who}的${f}進化成<b>${c.def.name}</b>！`, 'star'); }
      }
    };
    const pickFor = nm => async (t, opts) => {
      const vals = opts.filter(x => !x.disabled).map(x => x.value);
      if (L.randomTarget) return vals[Math.random() * vals.length | 0];
      if (nm === '精靈球') { const want = p.hand.filter(c => c.def.from).map(c => c.def.from); return vals.find(v => want.includes(v.def.name)) || vals.find(v => !v.def.ex) || vals[0]; }
      if (nm === '老大的指令') return vals.sort((a, b) => hpLeft(a) - hpLeft(b))[0];
      if (nm === '好傷藥') return vals.sort((a, b) => b.dmg - a.dmg)[0];
      if (nm === '寶可夢交替') return aiBest(vals, o.active);
      if (nm === '神奇糖果') return vals.sort((a, b) => (b[1] === p.active) - (a[1] === p.active))[0];
      return vals[0];
    };
    const useCard = async nm => { if (!can(nm)) return false; const c = p.hand.find(x => x.def.name === nm); if (!c || trainerUsable(side, c)) return false; await useTrainer(side, c, pickFor(nm)); render(); await sleep(700); return true; };
    const switchTo = async t => {
      if (can('寶可夢交替') && p.hand.some(c => c.def.name === '寶可夢交替')) { const c = p.hand.find(x => x.def.name === '寶可夢交替'); await useTrainer(side, c, async () => t); render(); await sleep(700); return true; }
      if (!whyRetreat(p)) { await retreat(side, t); render(); await sleep(700); return true; }
      return false;
    };

    /* 1. 擺場：基礎寶可夢、找牌、進化 */
    await playBasics();
    if (p.bench.length < 4) await useCard('精靈球');
    await playBasics();
    await evolveAll();
    await useCard('神奇糖果');

    /* 2. 支援者：能收割就用老大的指令（高手挑獎賞卡多的），不然手牌少就抽牌 */
    if (!whySupporter(p) && p.active) {
      const b = bestAttack(p.active, null);
      let koTarget = null;
      if (b && can('老大的指令') && !whyAttack(p, b.a)) {
        const kos = o.bench.filter(m => calcDamage(p.active, m, b.a.dmg) >= hpLeft(m));
        const activeKO = calcDamage(p.active, o.active, b.a.dmg) >= hpLeft(o.active);
        kos.sort((x, y) => prizeOf(y.def) - prizeOf(x.def));
        if (kos.length && (!activeKO || (L.protect && prizeOf(kos[0].def) > prizeOf(o.active.def)))) koTarget = kos[0];
      }
      if (koTarget && p.hand.some(c => c.def.name === '老大的指令')) {
        const c = p.hand.find(x => x.def.name === '老大的指令');
        await useTrainer(side, c, async () => koTarget); render(); await sleep(700);
      } else if (p.hand.length <= L.researchAt) { if (await useCard('博士的研究')) { await playBasics(); await evolveAll(); await useCard('神奇糖果'); } }
    }
    if (p.active && p.active.dmg >= 30) await useCard('好傷藥');

    /* 3. 保護（D4 以上）：戰鬥寶可夢下回合會被打倒、這回合又打不倒對手，就換一隻上來 */
    if (L.protect && p.active && o.active && p.bench.length) {
      const myBest = bestAttack(p.active, o.active);
      const canKO = myBest && !whyAttack(p, myBest.a) && myBest.d >= hpLeft(o.active);
      const danger = threat(o.active, p.active) >= hpLeft(p.active);
      if (danger && !canKO && prizeOf(p.active.def) >= 2) {
        const sub = p.bench.filter(m => prizeOf(m.def) === 1 && bestAttack(m, o.active)).sort((a, b) => ((bestAttack(b, o.active)?.d || 0) - (bestAttack(a, o.active)?.d || 0)) || (hpLeft(b) - hpLeft(a)))[0];
        if (sub && await switchTo(sub)) log(`🛡️ ${who}把重要的寶可夢撤下來保護！`);
      }
    }

    /* 4. 附能量 */
    const energies = p.hand.filter(c => c.def.kind === 'energy');
    if (energies.length && !roll(L.skipEnergy) && p.active && o.active) {
      let target, card;
      if (L.randomTarget) { const all = inPlay(p); target = all[Math.random() * all.length | 0]; card = energies[Math.random() * energies.length | 0]; }
      else {
        /* 高手：先看附 1 張能不能讓戰鬥寶可夢這回合擊倒對手 */
        if (L.smartEnergy) for (const c of energies) {
          const after = p.active.energies.concat(c.def.type);
          const b = bestAttack(p.active, o.active, after), now = bestAttack(p.active, o.active);
          if (b && b.d >= hpLeft(o.active) && (!now || now.d < hpLeft(o.active))) { target = p.active; card = c; break; }
        }
        if (!target) {
          const need = m => { const atks = m.def.attacks; return missing(m.energies, atks[atks.length - 1].cost); };
          const weakHitter = L.aggroSwitch && o.active && p.bench.filter(m => m.def.type === o.active.def.weak && need(m) > 0).sort((a, b) => need(a) - need(b))[0];
          target = weakHitter && need(p.active) <= 0 ? weakHitter : need(p.active) > 0 ? p.active : p.bench.slice().sort((a, b) => (b.def.stage !== '基礎') - (a.def.stage !== '基礎') || (L.smartEnergy ? prizeOf(b.def) - prizeOf(a.def) : 0) || need(a) - need(b)).find(m => need(m) > 0) || p.active;
          const want = target.def.attacks.flatMap(a => a.cost).filter(t => t !== '無色');
          card = energies.find(c => want.includes(c.def.type)) || energies[0];
        }
      }
      attach(p, card, target); await act(`⚡ ${who}把${card.def.name}附給<b>${target.def.name}</b>`, 'energy_attach');
    }

    /* 5. 換人：戰鬥寶可夢打不了（D3 以上才會想到） */
    if (L.smartSwitch && p.active && (!bestAttack(p.active, o.active) || (p.active.status && p.active.status !== 'conf'))) {
      const ready = p.bench.filter(m => bestAttack(m, o.active));
      if (ready.length) await switchTo(aiBest(ready, o.active));
    }

    /* 5b. 高手：備戰區有更好的打手（打弱點、能擊倒）就主動換上場 */
    if (L.aggroSwitch && p.active && o.active && p.bench.length && !(p.active.status === 'sleep' || p.active.status === 'para')) {
      const cur = bestAttack(p.active, o.active), curD = cur && !whyAttack(p, cur.a) ? cur.d : 0, need = hpLeft(o.active);
      const cand = p.bench.map(m => ({ m, b: bestAttack(m, o.active) })).filter(x => x.b).sort((x, y) => y.b.d - x.b.d)[0];
      if (cand && ((cand.b.d >= need && curD < need) || cand.b.d >= curD + 50)) {
        if (await switchTo(cand.m)) log(`🔁 ${who}換上更適合的<b>${cand.m.def.name}</b>！`);
      }
    }

    /* 6. 攻擊 */
    if (p.active && o.active && G.turn !== 1 && !roll(L.attackSkip)) {
      const usable = p.active.def.attacks.filter(a => !whyAttack(p, a));
      if (usable.length) {
        let a = roll(L.randomAtk) ? usable[Math.random() * usable.length | 0] : bestAttack(p.active, o.active).a;
        if (!usable.includes(a)) a = usable[0];
        /* 高手：能擊倒時選剛好夠的招；不能擊倒時，有狀態效果的小招也可能更好 */
        if (L.protect) {
          const kos = usable.filter(x => calcDamage(p.active, o.active, x.dmg) >= hpLeft(o.active));
          if (kos.length) a = kos[0];
        }
        await doAttack(side, a); return;
      }
    }
    log(`${who}結束了回合`); await endTurn();
  }

  /* ================= 開局 ================= */
  /* 電腦自動擺場（開局） */
  function aiPlaceStart(side) {
    const p = G.P[side], L = LEVELS[p.lv] || LEVELS[3];
    const ab = p.hand.filter(isBasic).sort((a, b) => L.randomTarget ? Math.random() - .5 : (a.def.ex - b.def.ex) || (b.def.hp - a.def.hp));
    p.active = mon(ab[0]); p.hand = p.hand.filter(c => c !== ab[0]);
    ab.slice(1, L.safeStart ? 5 : 4).forEach(c => { if (!(L.safeStart && c.def.ex && p.bench.length >= 2)) toBench(p, c); });
  }
  function drawOpening() {
    const mull = {};
    for (const s of ['me', 'ai']) {
      const p = G.P[s]; mull[s] = 0;
      draw(p, 7);
      while (!p.hand.some(isBasic)) { mull[s]++; p.deck.push(...p.hand); p.hand = []; shuffle(p.deck); draw(p, 7); }
      if (mull[s]) log(`🔁 ${name(s)}手牌沒有基礎寶可夢，重抽了 ${mull[s]} 次`);
    }
    for (const s of ['me', 'ai']) if (mull[other(s)]) { draw(G.P[s], mull[other(s)]); log(`➕ 對手重抽，${name(s)}多抽了 ${mull[other(s)]} 張`); }
    /* 魔王特權：開局多抽 */
    for (const s of ['me', 'ai']) { const b = (LEVELS[G.P[s].lv] || {}).bonusDraw; if (b) { draw(G.P[s], b); log(`👑 魔王特權：${name(s)}開局多抽了 ${b} 張`, 'big'); } }
  }
  function opponentBadge() {
    const b = $('#oppBadge'); if (!b) return;
    b.innerHTML = G.boss ? `${G.boss.icon} <b>${G.boss.name}</b><small>${G.boss.title}・${LEVELS[G.P.ai.lv].title}</small>` : `🤖 <b>電腦</b><small>${LEVELS[G.P.ai.lv].title}</small>`;
    b.hidden = false;
  }

  /* 自動測試：兩個電腦對打，回傳勝方 */
  if (QS.has('sim')) window.__LEVELS = LEVELS;
  window.__simGame = (lvMe, lvAi, deckMe) => new Promise(res => setTimeout(() => {
    SIM = true; Object.assign(G, { turn: 0, cur: null, over: false, busy: false, P: {}, boss: null, oppName: null });
    G.simDone = (side, turns) => res({ winner: side, turns, prizes: [G.P.me.prizes.length, G.P.ai.prizes.length] });
    G.P.me = player('me', deckMe, lvMe); G.P.ai = player('ai', deckMe === 'fireThunder' ? 'waterLeaf' : 'fireThunder', lvAi);
    drawOpening(); aiPlaceStart('me'); aiPlaceStart('ai');
    for (const s of ['me', 'ai']) for (let i = 0; i < 6; i++) G.P[s].prizes.push(G.P[s].deck.shift());
    startTurn(Math.random() < .5 ? 'me' : 'ai');
  }, 20));

  async function setup() {
    if (QS.has('sim')) return;
    const bossNo = +QS.get('boss');
    let deck, lv;
    if (bossNo && PTCG.BOSSES[bossNo - 1]) {
      const B = PTCG.BOSSES[bossNo - 1];
      if (!PTCG.bossUnlocked(bossNo)) { await say('要先打敗前一位魔王，才能挑戰這一位喔！', '回魔王關'); location.href = 'boss.html'; return; }
      G.boss = B; G.oppName = B.name; G.oppIcon = B.icon; lv = B.lv;
      $('#pageTitle').textContent = `👑 終極魔王關・第 ${B.no} 戰`; if (B.no === 5) { document.body.dataset.bgm = 'bgm_boss'; document.body.classList.add('final-boss'); if (typeof PTCGAudio !== 'undefined') PTCGAudio.music('bgm_boss'); } if (G.boss) document.body.classList.add('boss-mode'); $('#backBtn').href = 'boss.html'; $('#backBtn').textContent = '🏰 回魔王關';
      document.title = `${B.name}｜終極魔王關`;
      await ask(`${B.icon} <b>${B.name}</b>出現了！<br><small>${B.title}・${LEVELS[lv].title}</small><br>「${B.intro}」${LEVELS[lv].bonusDraw ? `<br><small>👑 魔王特權：開局多抽 ${LEVELS[lv].bonusDraw} 張手牌</small>` : ''}`, [{ label: '⚔️ 接受挑戰！', value: true, cls: 'berry' }], { cancel: false });
      deck = await ask('🎴 選擇你的牌組', [
        { label: `🔥⚡ 火焰雷電隊<small>對手會用：💧🌿 水流森林隊</small>`, value: 'fireThunder', cls: 'berry' },
        { label: `💧🌿 水流森林隊<small>對手會用：🔥⚡ 火焰雷電隊</small>`, value: 'waterLeaf', cls: 'grass' }], { cancel: false });
    } else {
      lv = await ask('🎚️ 選擇電腦的強度', [
        { label: '🐣 D1 見習生<small>常常忘記附能量，適合第一次玩</small>', value: 1, cls: 'grass' },
        { label: '🧢 D2 訓練家<small>會進化、會附能量，但不太會用策略卡</small>', value: 2 },
        { label: '🔥 D3 道館館主<small>會算傷害、會換人、會用老大的指令</small>', value: 3, cls: 'berry' },
        { label: '🏰 更強的對手在「終極魔王關」！', value: 'boss' }], { cancel: false });
      if (lv === 'boss') { location.href = 'boss.html'; return; }
      deck = await ask('🎴 選擇你的牌組', [
        { label: '🔥⚡ 火焰雷電隊<small>小火龍、皮卡丘、雷電獸 ex</small>', value: 'fireThunder', cls: 'berry' },
        { label: '💧🌿 水流森林隊<small>傑尼龜、妙蛙種子、拉普拉斯 ex</small>', value: 'waterLeaf', cls: 'grass' }], { cancel: false });
    }
    G.P.me = player('me', deck); G.P.ai = player('ai', deck === 'fireThunder' ? 'waterLeaf' : 'fireThunder', lv);
    opponentBadge();
    log(`你選了 ${DECKS[deck].name}，${name('ai')}（${LEVELS[lv].title}）用 ${DECKS[G.P.ai.deckKey].name}${LEVELS[lv].mega ? '・加入超級進化 ex！' : ''}`);
    drawOpening();
    render();
    /* 放寶可夢 */
    const me = G.P.me, basics = me.hand.filter(isBasic);
    const act = await ask('選 1 隻基礎寶可夢放到戰鬥場（先蓋著）', basics.map(c => ({ label: `${c.def.name}（HP ${c.def.hp}）`, value: c })), { cancel: false });
    me.hand = me.hand.filter(c => c !== act); me.active = mon(act);
    for (;;) {
      const rest = me.hand.filter(isBasic); if (!rest.length || me.bench.length >= 5) break;
      const b = await ask('也要把其他基礎寶可夢放到備戰區嗎？', rest.map(c => ({ label: `🪑 ${c.def.name}`, value: c })).concat([{ label: '完成 ✔', value: 'done', cls: 'grass' }]), { cancel: false });
      if (b === 'done') break; toBench(me, b); render();
    }
    aiPlaceStart('ai');
    for (const s of ['me', 'ai']) for (let i = 0; i < 6; i++) G.P[s].prizes.push(G.P[s].deck.shift());
    render(); sfx('card_place');
    /* 擲硬幣決定先後攻 */
    const guess = await ask('擲硬幣決定先後攻！你猜……', [{ label: '🪙 正面', value: true }, { label: '🪙 反面', value: false }], { cancel: false });
    const h = await flip('擲硬幣決定先後攻'); const winMe = h === guess;
    let first;
    if (winMe) first = await ask('你猜對了！要先攻還是後攻？', [{ label: '🥇 先攻<small>早一步準備，但第一回合不能攻擊、不能用支援者</small>', value: 'me' }, { label: '🥈 後攻<small>第一回合就能攻擊</small>', value: 'ai' }], { cancel: false });
    else { first = lv >= 4 ? 'me' : 'ai'; await say(`${name('ai')}猜對了，選擇${first === 'me' ? '後攻' : '先攻'}！`); }
    log(`🪙 ${first === 'me' ? '你先攻' : name('ai') + '先攻'}！雙方翻開寶可夢，比賽開始！`, 'big'); sfx('star');
    G.turn = 0; startTurn(first);
  }

  /* ================= 事件 ================= */
  document.addEventListener('click', e => {
    const h = e.target.closest('#hand .hc'); if (h) { const c = G.P.me.hand.find(x => x.uid === +h.dataset.uid); if (c) onHand(c); return; }
    const a = e.target.closest('#me .active .bc:not(.empty)'); if (a) { onActive(); return; }
    const any = e.target.closest('.bc:not(.empty)');
    if (any) { const m = [...inPlay(G.P.me), ...inPlay(G.P.ai)].find(x => x.uid === +any.dataset.uid); if (m) ask(`${m.def.name}（剩 ${hpLeft(m)} HP）`, [], { card: cardView(m.def) }); }
  });
  document.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('.bc[role=button]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); } });
  $('#endTurn').onclick = async () => {
    if (G.cur !== 'me' || G.busy || G.over) return;
    const p = G.P.me;
    if (!p.energyUsed && p.hand.some(c => c.def.kind === 'energy') && inPlay(p).length) {
      const ok = await ask('還沒附能量耶！確定要結束回合嗎？', [{ label: '確定結束', value: true }, { label: '我再想想', value: false, cls: 'grass' }], { cancel: false });
      if (!ok) return;
    }
    log('你結束了回合'); await endTurn();
  };
  /* 3D 競技場、手牌抽屜 */
  if (!QS.has('sim')) PTCG.whenIdle(() => PTCG.load3D(['js/arena3d.js']).then(() => { if (PTCGArena.ok) { PTCGArena.init(QS.get('boss') ? 'boss' : 'normal'); document.body.classList.add('has-arena'); } }).catch(() => {}), 1500);
  const hb = $('#handBar'), tg = $('#handToggle');
  if (tg) tg.onclick = () => { const c = hb.classList.toggle('closed'); tg.setAttribute('aria-expanded', String(!c)); };
  if (hb && window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--hand-h', hb.offsetHeight + 'px')).observe(hb);
  window.addEventListener('load', () => setTimeout(setup, 300));
})();

/* 寶可夢卡牌訓練營：模擬對戰（接近正式規則，6 張獎賞卡） */
(() => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sfx = (n, o) => PTCG.sfx(n, o);

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
  const TYPES = { '草': 'grass', '火': 'fire', '水': 'water', '雷': 'lightning', '鬥': 'fighting', '無色': 'colorless' };
  const ATK_SFX = { '火': 'attack_fire', '水': 'attack_water', '雷': 'attack_zap' };

  /* ================= 遊戲狀態 ================= */
  let uid = 0;
  const G = { turn: 0, cur: null, over: false, busy: false, P: {} };
  const other = s => s === 'me' ? 'ai' : 'me';
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function makeDeck(key) { const d = []; for (const [id, n] of Object.entries(DECKS[key].list)) for (let i = 0; i < n; i++) d.push({ uid: ++uid, id, def: DEFS[id] }); return shuffle(d); }
  function player(key, deckKey) { return { key, deckKey, deck: makeDeck(deckKey), hand: [], discard: [], prizes: [], active: null, bench: [], turns: 0, energyUsed: false, supporterUsed: false, retreated: false }; }
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
  const nmHTML = n => String(n).replace(/ ex$/, ' <i class="exmark">ex</i>');
  function bcard(m, where) {
    if (!m) return `<div class="bc empty">${where === 'active' ? '戰鬥場' : ''}</div>`;
    const d = m.def, left = hpLeft(m);
    return `<div class="bc t-${TYPES[d.type]} ${d.ex ? 'ex' : ''} ${m.status ? 'st-' + m.status : ''}" data-uid="${m.uid}" role="button" tabindex="0" aria-label="${d.name}，剩 ${left} HP">
      <div class="in">
        <div class="bc-stg">${d.stage}</div><div class="bc-name">${nmHTML(d.name)}</div>
        <div class="bc-art">${d.type === '無色' ? '★' : d.type}</div>
        <div class="bc-hp"><i style="width:${left / d.hp * 100}%" class="${left / d.hp <= .35 ? 'low' : ''}"></i><span>${left}/${d.hp}</span></div>
        <div class="bc-en">${m.energies.map(en).join('')}</div>
      </div>
      ${m.dmg ? `<div class="bc-dmg">${m.dmg}</div>` : ''}
      <div class="bc-mk">${m.poison ? '<span class="mk poison">毒</span>' : ''}${m.burn ? '<span class="mk burn">燒</span>' : ''}${m.status ? `<span class="mk st">${{ sleep: '😴', para: '⚡', conf: '😵' }[m.status]}</span>` : ''}</div>
    </div>`;
  }
  function hcard(c) {
    const d = c.def;
    if (d.kind === 'energy') return `<button class="hc energy t-${TYPES[d.type]}" data-uid="${c.uid}" aria-label="${d.name}"><span class="in"><span class="k">基本能量</span><b>${d.type}</b></span></button>`;
    if (d.kind === 'trainer') return `<button class="hc trainer ${d.sub === '支援者' ? 'sup' : ''}" data-uid="${c.uid}" aria-label="${d.sub} ${d.name}"><span class="in"><span class="k">${d.sub}</span><b>${d.icon}</b><small>${d.name}</small></span></button>`;
    return `<button class="hc t-${TYPES[d.type]} ${d.ex ? 'ex' : ''}" data-uid="${c.uid}" aria-label="${d.stage} ${d.name} HP ${d.hp}"><span class="in"><span class="k">${d.stage}</span><small>${nmHTML(d.name)}</small><b>${d.type}</b><span class="k">HP ${d.hp}</span></span></button>`;
  }

  /* ---- 卡片飛行動畫：記錄「哪張卡要飛去哪裡」，畫面更新後播放 ---- */
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FX = [];
  const sideOf = p => p === G.P.me ? 'me' : 'ai';
  function queueFly(p, card, to) { if (!REDUCE) FX.push({ side: sideOf(p), card, to }); }
  let lastHand = new Map();   /* uid → 手牌位置 */
  function ghost(card) {
    const g = document.createElement('div'); g.className = 'fly';
    g.innerHTML = hcard(card).replace('<button', '<div').replace(/<\/button>$/, '</div>');
    return g;
  }
  function playFX() {
    while (FX.length) {
      const f = FX.shift();
      let from = f.side === 'me' ? lastHand.get(f.card.uid) : null;
      if (!from) { const src = $(`#${f.side} .who .tag`); from = src && src.getBoundingClientRect(); }
      let tgt = f.to.mon ? $(`#${f.side} .bc[data-uid="${f.to.mon}"]`) : $(`#${f.side} .pile.discard`);
      if (!tgt || !tgt.offsetParent) tgt = $(`#${f.side} .who .tag`);
      if (!from || !tgt) continue;
      const to = tgt.getBoundingClientRect();
      const g = ghost(f.card); document.body.appendChild(g);
      const card = g.firstElementChild; card.style.width = '84px';
      const sx = from.left, sy = from.top, s0 = from.width / 84 || .6;
      const ex = to.left + to.width / 2 - 42 * .7, ey = to.top + to.height / 2 - 59 * .7;
      const hideT = f.to.place && tgt.classList.contains('bc');
      if (hideT) tgt.style.opacity = 0;
      const anim = g.animate([
        { transform: `translate(${sx}px,${sy}px) scale(${s0}) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 70}px) scale(${Math.max(s0, .9)}) rotate(${f.side === 'me' ? -8 : 8}deg)`, opacity: 1, offset: .5 },
        { transform: `translate(${ex}px,${ey}px) scale(.7) rotate(0deg)`, opacity: f.to.mon ? .2 : .9 }
      ], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
      anim.onfinish = () => { g.remove(); if (hideT) tgt.style.opacity = ''; if (tgt.classList.contains('bc')) PTCG.restart(tgt, 'arrive'); };
    }
  }
  function render() {
    /* 先記住目前手牌的位置，給飛行動畫當起點 */
    lastHand = new Map([...document.querySelectorAll('#hand .hc')].map(e => [+e.dataset.uid, e.getBoundingClientRect()]));
    for (const s of ['me', 'ai']) {
      const p = G.P[s], root = $('#' + s);
      root.querySelector('.active').innerHTML = bcard(p.active, 'active');
      root.querySelector('.bench').innerHTML = [0, 1, 2, 3, 4].map(i => bcard(p.bench[i], 'bench')).join('');
      const pz = n => Array.from({ length: 6 }, (_, i) => `<span class="pz ${i < n ? '' : 'gone'}"></span>`).join('');
      root.querySelector('.prizes').innerHTML = `<div class="grid" aria-hidden="true">${pz(p.prizes.length)}</div><em>獎賞卡 ${p.prizes.length}</em>`;
      root.querySelector('.piles').innerHTML = `<div class="pile deck" role="img" aria-label="牌庫 ${p.deck.length} 張"><b>${p.deck.length}</b>牌庫</div><div class="pile discard ${p.discard.length ? 'has' : ''}" role="img" aria-label="棄牌區 ${p.discard.length} 張"><b>${p.discard.length}</b>棄牌</div>`;
      const fan = s === 'ai' ? `<span class="fan" aria-hidden="true">${'<i></i>'.repeat(Math.min(p.hand.length, 10))}</span>` : '';
      root.querySelector('.who').innerHTML = `<span class="tag">${s === 'me' ? '🧢 你' : '🤖 電腦'}</span><span>🃏 手牌 ${p.hand.length}</span>${fan}
        <span class="mini-stat">📚 ${p.deck.length}</span><span class="mini-stat">🗑️ ${p.discard.length}</span><span class="mini-stat" role="img" aria-label="獎賞卡 ${p.prizes.length} 張">${pz(p.prizes.length)}</span>`;
    }
    const prev = new Set(lastHand.keys()), first = !lastHand.size;
    $('#hand').innerHTML = G.P.me.hand.map(hcard).join('');
    if (!REDUCE) [...$('#hand').children].forEach((e, i) => { if (!prev.has(+e.dataset.uid)) { e.classList.add('drawn'); e.style.animationDelay = (first ? i * 70 : 0) + 'ms'; } });
    const myTurn = G.cur === 'me' && !G.busy && !G.over;
    $('#endTurn').disabled = !myTurn;
    document.body.classList.toggle('my-turn', myTurn);
    $('#turnInfo').textContent = G.over ? '比賽結束' : G.cur === 'me' ? `第 ${G.turn} 回合・輪到你！` : `第 ${G.turn} 回合・電腦思考中…`;
    hint();
    playFX();
  }
  function log(t, cls = '') {
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
      const M = $('#modal');
      M.innerHTML = `<div class="box pop-in">${card ? `<div class="mcard">${PTCG.card(card)}</div>` : ''}<h2 id="mTitle">${title}</h2><div class="opts2">${options.map((o, i) =>
        `<button class="btn ${o.disabled ? '' : o.cls || 'sun'}" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${o.label}${o.disabled && o.why ? `<small>${o.why}</small>` : ''}</button>`).join('')}</div>${cancel ? '<button class="btn" data-i="-1">取消</button>' : ''}</div>`;
      M.classList.add('show');
      const back = document.activeElement;   /* 關閉後把焦點還回去 */
      const done = v => { M.classList.remove('show'); M.innerHTML = ''; M.onkeydown = null; if (back && back.isConnected) back.focus(); else { const h = $('#hand .hc'); h && h.focus(); } res(v); };
      M.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const i = +b.dataset.i; done(i < 0 ? null : options[i].value); });
      trapFocus(M, cancel ? () => done(null) : null);
    });
  }
  /* 對話框：焦點留在裡面、Esc 取消、打開時聚焦第一個可按的按鈕 */
  function trapFocus(M, onEsc) {
    const list = () => [...M.querySelectorAll('button:not([disabled])')];
    const f = list()[0]; f && f.focus();
    M.onkeydown = e => {
      if (e.key === 'Escape' && onEsc) { e.preventDefault(); onEsc(); return; }
      if (e.key !== 'Tab') return;
      const L = list(); if (!L.length) return;
      const i = L.indexOf(document.activeElement);
      e.preventDefault(); L[(i + (e.shiftKey ? -1 : 1) + L.length) % L.length].focus();
    };
  }
  const say = (title, btn = '好！') => ask(title, [{ label: btn, value: true }], { cancel: false });
  async function flip(label) {
    const c = $('#coin'); c.classList.add('show'); c.querySelector('.coin').textContent = '?'; c.querySelector('p').textContent = label;
    PTCG.restart(c.querySelector('.coin'), 'spin'); sfx('card_flip');
    const heads = Math.random() < .5; await sleep(1350);
    c.querySelector('.coin').textContent = heads ? '正' : '反'; c.querySelector('.coin').classList.toggle('tails', !heads);
    await sleep(700); c.classList.remove('show');
    return heads;
  }

  /* ================= 動作 ================= */
  function toBench(p, card) { p.hand = p.hand.filter(c => c !== card); const m = mon(card); p.bench.push(m); queueFly(p, card, { mon: m.uid, place: true }); return m; }
  function evolve(p, card, m) {
    p.hand = p.hand.filter(c => c !== card); queueFly(p, card, { mon: m.uid });
    m.cards.push(card); m.def = card.def; m.status = null; m.poison = m.burn = false; m.evolvedTurn = G.turn;
  }
  function attach(p, card, m) { p.hand = p.hand.filter(c => c !== card); queueFly(p, card, { mon: m.uid }); m.energies.push(card.def.type); m.cards.push(card); p.energyUsed = true; }
  function discardCard(p, card) { p.hand = p.hand.filter(c => c !== card); queueFly(p, card, { pile: 'discard' }); p.discard.push(card); }
  function switchActive(p, m, clear = true) {
    const old = p.active; p.bench = p.bench.filter(b => b !== m); if (old) { if (clear) { old.status = null; old.poison = old.burn = false; } p.bench.push(old); } p.active = m;
  }
  function discardEnergy(m, n) {
    const owner = G.P[ownerOf(m)];
    for (let i = 0; i < n; i++) { const t = m.energies.pop(); const idx = m.cards.findLastIndex(c => c.def.kind === 'energy' && c.def.type === t); if (idx >= 0) owner.discard.push(m.cards.splice(idx, 1)[0]); }
  }
  const ownerOf = m => inPlay(G.P.me).includes(m) ? 'me' : 'ai';
  const name = s => s === 'me' ? '你' : '電腦';

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
      const taker = G.P[other(s)], n = m.def.ex ? 2 : 1;
      log(`💫 ${name(s)}的<b>${m.def.name}</b>昏厥了！`, 'big'); sfx('knockout');
      p.discard.push(...m.cards); p.active = null; render(); await sleep(600);
      for (let i = 0; i < n && taker.prizes.length; i++) taker.hand.push(taker.prizes.shift());
      log(`🎁 ${name(other(s))}拿了 ${n} 張獎賞卡${m.def.ex ? '（ex 給 2 張！）' : ''}`); sfx('star'); render(); await sleep(500);
      if (!taker.prizes.length) return win(other(s), '拿完了 6 張獎賞卡');
      if (!p.bench.length) return win(other(s), `${name(s)}的場上沒有寶可夢了`);
      let pick;
      if (s === 'me') pick = await ask('選 1 隻備戰區的寶可夢上戰鬥場', p.bench.map(b => ({ label: `${b.def.name}（HP ${hpLeft(b)}）`, value: b })), { cancel: false });
      else pick = aiBest(p.bench, G.P.me.active);
      switchActive(p, pick, false); log(`➡️ ${name(s)}派出<b>${pick.def.name}</b>`); sfx('card_place'); render();
    }
  }
  async function win(side, why) {
    G.over = true; render();
    const won = side === 'me';
    PTCG.setStars('battle', won ? 3 : 1); PTCG.starPill(document.querySelector('.star-pill'));
    PTCG.record(r => { r.battles = (r.battles || 0) + 1; if (won) r.wins = (r.wins || 0) + 1; });
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
    log(`—— 第 ${G.turn} 回合：${side === 'me' ? '輪到你了！' : '電腦的回合'} ——`, 'turn');
    if (side === 'me') { G.busy = false; render(); } else { G.busy = true; render(); await sleep(700); await aiTurn(); }
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
  async function aiTurn() {
    const p = G.P.ai, o = G.P.me, act = async (t, s) => { log(t); if (s) sfx(s); render(); await sleep(750); };
    const pick = async (t, opts) => opts.find(x => !x.disabled)?.value || null;
    const playBasics = async () => { for (const c of p.hand.filter(isBasic)) { if (p.bench.length >= 5) break; toBench(p, c); await act(`🪑 電腦把<b>${c.def.name}</b>放到備戰區`, 'card_place'); } };
    const evolveAll = async () => {
      for (const c of p.hand.filter(c => c.def.kind === 'pokemon' && c.def.stage !== '基礎')) {
        const t = evolveTargets(p, c).filter(m => !whyNoEvolve(p, m)).sort((a, b) => (b === p.active) - (a === p.active))[0];
        if (t) { const f = t.def.name; evolve(p, c, t); await act(`⬆️ 電腦的${f}進化成<b>${c.def.name}</b>！`, 'star'); }
      }
    };
    const useCard = async nm => { const c = p.hand.find(x => x.def.name === nm); if (!c || trainerUsable('ai', c)) return false; await useTrainer('ai', c, pickFor(nm)); render(); await sleep(700); return true; };
    const pickFor = nm => async (t, opts) => {
      const vals = opts.filter(o => !o.disabled).map(o => o.value);
      if (nm === '精靈球') { const want = p.hand.filter(c => c.def.from).map(c => c.def.from); return vals.find(v => want.includes(v.def.name)) || vals.find(v => !v.def.ex) || vals[0]; }
      if (nm === '老大的指令') return vals.sort((a, b) => hpLeft(a) - hpLeft(b))[0];
      if (nm === '好傷藥') return vals.sort((a, b) => b.dmg - a.dmg)[0];
      if (nm === '寶可夢交替') return aiBest(vals, o.active);
      return vals[0];
    };

    await playBasics();
    if (p.bench.length < 4) await useCard('精靈球');
    await playBasics();
    await evolveAll();
    await useCard('神奇糖果');
    /* 支援者：能擊倒就用老大的指令，否則手牌少就抽牌 */
    if (!whySupporter(p)) {
      const b = p.active && bestAttack(p.active, null);
      const koTarget = b && o.bench.find(m => calcDamage(p.active, m, b.a.dmg) >= hpLeft(m));
      if (koTarget && p.hand.some(c => c.def.name === '老大的指令') && !whyAttack(p, b.a)) {
        const c = p.hand.find(x => x.def.name === '老大的指令');
        await useTrainer('ai', c, async () => koTarget); render(); await sleep(700);
      } else if (p.hand.length <= 4) { if (await useCard('博士的研究')) { await playBasics(); await evolveAll(); } }
    }
    if (p.active && p.active.dmg >= 30) await useCard('好傷藥');
    /* 附能量 */
    const energies = p.hand.filter(c => c.def.kind === 'energy');
    if (energies.length) {
      const need = m => { const atks = m.def.attacks; const a = atks[atks.length - 1]; return missing(m.energies, a.cost); };
      let target = p.active && need(p.active) > 0 ? p.active : p.bench.slice().sort((a, b) => (b.def.stage !== '基礎') - (a.def.stage !== '基礎') || need(a) - need(b)).find(m => need(m) > 0) || p.active;
      const wantTypes = target.def.attacks.flatMap(a => a.cost).filter(t => t !== '無色');
      const card = energies.find(c => wantTypes.includes(c.def.type)) || energies[0];
      attach(p, card, target); await act(`⚡ 電腦把${card.def.name}附給<b>${target.def.name}</b>`, 'energy_attach');
    }
    /* 戰鬥寶可夢打不了、備戰區有人能打：交換 */
    if (p.active && !bestAttack(p.active, o.active) || (p.active && p.active.status && p.active.status !== 'conf')) {
      const ready = p.bench.filter(m => bestAttack(m, o.active));
      if (ready.length) {
        const t = aiBest(ready, o.active);
        if (p.hand.some(c => c.def.name === '寶可夢交替')) { const c = p.hand.find(x => x.def.name === '寶可夢交替'); await useTrainer('ai', c, async () => t); render(); await sleep(700); }
        else if (!whyRetreat(p)) { await retreat('ai', t); render(); await sleep(700); }
      }
    }
    /* 攻擊 */
    if (p.active && G.turn !== 1) {
      const b = bestAttack(p.active, o.active);
      if (b && !whyAttack(p, b.a)) { await doAttack('ai', b.a); return; }
    }
    log('電腦結束了回合'); await endTurn();
  }

  /* ================= 開局 ================= */
  async function setup() {
    const deck = await ask('🎴 選擇你的牌組', [
      { label: '🔥⚡ 火焰雷電隊<small>小火龍、皮卡丘、雷電獸 ex</small>', value: 'fireThunder', cls: 'berry' },
      { label: '💧🌿 水流森林隊<small>傑尼龜、妙蛙種子、拉普拉斯 ex</small>', value: 'waterLeaf', cls: 'grass' }], { cancel: false });
    G.P.me = player('me', deck); G.P.ai = player('ai', deck === 'fireThunder' ? 'waterLeaf' : 'fireThunder');
    log(`你選了 ${DECKS[deck].name}，電腦用 ${DECKS[G.P.ai.deckKey].name}`);
    /* 抽 7 張與重抽 */
    const mull = {};
    for (const s of ['me', 'ai']) {
      const p = G.P[s]; mull[s] = 0;
      draw(p, 7);
      while (!p.hand.some(isBasic)) { mull[s]++; p.deck.push(...p.hand); p.hand = []; shuffle(p.deck); draw(p, 7); }
      if (mull[s]) log(`🔁 ${name(s)}手牌沒有基礎寶可夢，重抽了 ${mull[s]} 次`);
    }
    for (const s of ['me', 'ai']) if (mull[other(s)]) { draw(G.P[s], mull[other(s)]); log(`➕ 對手重抽，${name(s)}多抽了 ${mull[other(s)]} 張`); }
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
    const ai = G.P.ai, ab = ai.hand.filter(isBasic).sort((a, b) => (a.def.ex - b.def.ex) || (b.def.hp - a.def.hp));
    ai.active = mon(ab[0]); ai.hand = ai.hand.filter(c => c !== ab[0]);
    ab.slice(1, 4).forEach(c => toBench(ai, c));
    for (const s of ['me', 'ai']) for (let i = 0; i < 6; i++) G.P[s].prizes.push(G.P[s].deck.shift());
    render(); sfx('card_place');
    /* 擲硬幣決定先後攻 */
    const guess = await ask('擲硬幣決定先後攻！你猜……', [{ label: '🪙 正面', value: true }, { label: '🪙 反面', value: false }], { cancel: false });
    const h = await flip('擲硬幣決定先後攻'); const winMe = h === guess;
    let first;
    if (winMe) first = await ask('你猜對了！要先攻還是後攻？', [{ label: '🥇 先攻<small>早一步準備，但第一回合不能攻擊、不能用支援者</small>', value: 'me' }, { label: '🥈 後攻<small>第一回合就能攻擊</small>', value: 'ai' }], { cancel: false });
    else { first = 'ai'; await say('電腦猜對了，電腦選擇先攻！'); }
    log(`🪙 ${first === 'me' ? '你先攻' : '電腦先攻'}！雙方翻開寶可夢，比賽開始！`, 'big'); sfx('star');
    G.turn = 0; startTurn(first);
  }

  /* ================= 事件 ================= */
  document.addEventListener('click', e => {
    const h = e.target.closest('#hand .hc'); if (h) { const c = G.P.me.hand.find(x => x.uid === +h.dataset.uid); if (c) onHand(c); return; }
    const a = e.target.closest('#me .active .bc:not(.empty)'); if (a) { onActive(); return; }
    const any = e.target.closest('.bc:not(.empty)');
    if (any) { const m = [...inPlay(G.P.me), ...inPlay(G.P.ai)].find(x => x.uid === +any.dataset.uid); if (m) ask(`${m.def.name}（剩 ${hpLeft(m)} HP）`, [], { card: cardView(m.def) }); }
  });
  $('#endTurn').onclick = async () => {
    if (G.cur !== 'me' || G.busy || G.over) return;
    const p = G.P.me;
    if (!p.energyUsed && p.hand.some(c => c.def.kind === 'energy') && inPlay(p).length) {
      const ok = await ask('還沒附能量耶！確定要結束回合嗎？', [{ label: '確定結束', value: true }, { label: '我再想想', value: false, cls: 'grass' }], { cancel: false });
      if (!ok) return;
    }
    log('你結束了回合'); await endTurn();
  };
  /* 鍵盤：在場上的卡按 Enter／空白鍵等於點擊 */
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('bc')) { e.preventDefault(); e.target.click(); } });
  /* 手牌抽屜收合 */
  $('#handToggle').onclick = () => {
    const d = $('#dock'), c = d.classList.toggle('collapsed');
    $('#handToggle').textContent = c ? '展開 ▴' : '收起 ▾'; $('#handToggle').setAttribute('aria-expanded', String(!c)); sfx('ui_click');
  };
  /* 手機版：對戰紀錄改用對話框顯示 */
  $('#logBtn').onclick = () => {
    const M = $('#modal');
    M.innerHTML = `<div class="box pop-in"><h2 id="mTitle">📜 對戰紀錄</h2><div class="logbox">${$('#log').innerHTML}</div><div class="opts2" style="margin-top:10px"><button class="btn sun" data-i="-1">關閉</button></div></div>`;
    const back = document.activeElement;
    const close = () => { M.classList.remove('show'); M.innerHTML = ''; M.onkeydown = null; back && back.focus(); };
    M.classList.add('show'); M.querySelector('[data-i]').onclick = close; trapFocus(M, close);
  };
  /* 依底部抽屜的實際高度留白，手牌永遠不會蓋住場地 */
  const fit = () => {
    const dock = $('#dock').offsetHeight, panel = getComputedStyle($('.panel')).position === 'fixed' ? $('.panel').offsetHeight : 0;
    document.documentElement.style.setProperty('--hand-h', dock + 'px');
    document.documentElement.style.setProperty('--dock-h', dock + panel + 'px');
  };
  if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe($('#dock')); ro.observe($('.panel')); }
  addEventListener('resize', fit); fit();
  window.addEventListener('load', () => setTimeout(setup, 300));
})();

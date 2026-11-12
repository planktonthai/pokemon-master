/* 寶可夢卡牌訓練營：共用工具 */
const PTCG = (() => {
  const KEY = 'ptcg-camp-progress-v1';

  /* 已完成製作的單元（新增單元時加進來） */
  const AVAILABLE = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'battle', 'boss'];

  const UNITS = [
    { id: 'u1', no: 1, name: '認識卡牌', zone: 'grass' },
    { id: 'u2', no: 2, name: '場地配置', zone: 'grass' },
    { id: 'u3', no: 3, name: '開始準備', zone: 'grass' },
    { id: 'u4', no: 4, name: '回合流程', zone: 'grass' },
    { id: 'u5', no: 5, name: '攻擊與傷害', zone: 'canyon' },
    { id: 'u6', no: 6, name: '進化', zone: 'canyon' },
    { id: 'u7', no: 7, name: '特殊狀態', zone: 'canyon' },
    { id: 'u8', no: 8, name: '獲勝條件', zone: 'canyon' },
    { id: 'u9', no: 9, name: '組牌組', zone: 'volcano' },
    { id: 'u10', no: 10, name: '策略運用', zone: 'volcano' },
    { id: 'battle', no: '⚔', name: '模擬對戰', zone: 'volcano' },
    { id: 'boss', no: '👑', name: '終極魔王關', zone: 'volcano' }
  ];

  /* ---------- 進度 ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 無法儲存時略過 */ } }
  function getStars(id) { return load()[id] || 0; }
  function setStars(id, n) { const p = load(); if (n > (p[id] || 0)) { p[id] = n; save(p); } }
  function totalStars() { return Object.values(load()).reduce((a, b) => a + b, 0); }
  const CHEAT_KEY = 'ptcg-camp-unlock-all';
  /* ---------- 終極魔王關（原創角色） ---------- */
  const BOSSES = [
    { no: 1, lv: 1, icon: '🐣', name: '見習生小步', title: '剛拿到牌組的新手', color: '#7CC45A', intro: '我、我也是第一次比賽……請多指教！', win: '咦？我贏了？太好了！', lose: '你好厲害！我要回去多練習！' },
    { no: 2, lv: 2, icon: '🌿', name: '森林巡守員阿蘭', title: '森林裡的訓練家', color: '#3E9B5C', intro: '在森林裡，耐心最重要。來吧！', win: '慢慢來，比較快喔。', lose: '你的耐心比我還好呢！' },
    { no: 3, lv: 3, icon: '🔥', name: '熔岩館主赤炎', title: '火山道館館主', color: '#E8553D', intro: '我的道館沒那麼好闖！讓我看看你的實力！', win: '還差一點火候！再來挑戰吧！', lose: '燃燒吧！這枚徽章是你的了！' },
    { no: 4, lv: 4, icon: '❄️', name: '四天王霜月', title: '冷靜計算的策略家', color: '#3D7DC8', intro: '每一步我都算好了。你能看穿我的策略嗎？', win: '一切都在我的計算之中。', lose: '……你的計算，比我更精準。' },
    { no: 5, lv: 5, icon: '👑', name: '終極魔王・暗影卡皇', title: '卡牌世界的最強王者', color: '#5A1E8C', intro: '能走到這裡，你很了不起。但我的超級進化 ex，可不會手下留情！', win: '哈哈哈！想打倒我，再修練一百年吧！', lose: '不可能……你、你才是真正的卡牌大師！' }
  ];
  /* 對戰戰績 */
  const STAT_KEY = 'ptcg-camp-stats-v1';
  const getStats = () => { try { return JSON.parse(localStorage.getItem(STAT_KEY)) || { played: {}, won: {} }; } catch (e) { return { played: {}, won: {} }; } };
  function recordBattle(lv, won) {
    const st = getStats(); st.played[lv] = (st.played[lv] || 0) + 1; if (won) st.won[lv] = (st.won[lv] || 0) + 1;
    try { localStorage.setItem(STAT_KEY, JSON.stringify(st)); } catch (e) { /* 略過 */ }
  }
  const BOSS_KEY = 'ptcg-camp-boss-v1';
  const bossBeaten = () => { try { return +localStorage.getItem(BOSS_KEY) || 0; } catch (e) { return 0; } };
  const bossUnlocked = n => cheatOn() || n <= bossBeaten() + 1;
  function bossWin(n) {
    const b = Math.max(bossBeaten(), n);
    try { localStorage.setItem(BOSS_KEY, b); } catch (e) { /* 略過 */ }
    setStars('boss', b >= 5 ? 3 : b >= 3 ? 2 : 1);
  }
  const cheatOn = () => { try { return localStorage.getItem(CHEAT_KEY) === '1'; } catch (e) { return false; } };
  function isUnlocked(i) { return cheatOn() || i === 0 || getStars(UNITS[i - 1].id) > 0; }
  /* 密技按鈕：2 秒內連點 3 次，解鎖（或恢復）全部關卡 */
  function cheatButton() {
    const b = document.createElement('button');
    b.className = 'cheat-btn'; b.setAttribute('aria-label', '密技按鈕'); b.title = '？';
    if (cheatOn()) b.classList.add('on');
    let n = 0, tm;
    b.onclick = () => {
      n++; clearTimeout(tm); tm = setTimeout(() => { n = 0; }, 2000);
      restart(b, 'bump'); sfx('ui_click', { rate: 1 + n * .25 });
      if (n < 3) return;
      n = 0;
      const on = !cheatOn();
      try { on ? localStorage.setItem(CHEAT_KEY, '1') : localStorage.removeItem(CHEAT_KEY); } catch (e) { /* 無法儲存時略過 */ }
      sfx(on ? 'level_clear' : 'knockout');
      let t = document.getElementById('toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = on ? '🔓 密技啟動！全部關卡已解鎖' : '🔒 已恢復正常模式';
      t.classList.add('show');
      if (on) confetti(80);
      setTimeout(() => location.reload(), 1600);
    };
    document.body.appendChild(b);
    return b;
  }

  /* ---------- 屬性 ---------- */
  const TYPES = {
    '草': 'grass', '火': 'fire', '水': 'water', '雷': 'lightning', '超': 'psychic',
    '鬥': 'fighting', '惡': 'dark', '鋼': 'metal', '龍': 'dragon', '無色': 'colorless'
  };
  const tcls = t => 't-' + (TYPES[t] || 'colorless');
  function energy(t) {
    const label = t === '無色' ? '★' : t;
    return `<span class="en ${tcls(t)}" title="${t}能量" aria-label="${t}能量">${label}</span>`;
  }

  /* ---------- 卡片 ---------- */
  function card(d) {
    if (d.kind === 'energy') {
      return `<div class="pcard energy ${tcls(d.type)}" aria-label="${d.type}能量卡">
        <span class="pc-kind" data-part="kind">${d.special ? '特殊能量' : '基本能量'}</span>
        <div class="pc-art">${d.type === '無色' ? '★' : d.type}</div>
        <div class="pc-name" style="text-align:center">${d.name || d.type + '能量'}</div>
      </div>`;
    }
    if (d.kind === 'trainer') {
      return `<div class="pcard trainer" aria-label="訓練家卡 ${d.name}">
        <span class="pc-kind" data-part="kind">訓練家・${d.sub}</span>
        <div class="pc-name" data-part="name">${d.name}</div>
        <div class="pc-art" style="font-size:40px">${d.icon || '🎒'}</div>
        <div class="pc-text" data-part="text">${d.text}</div>
        ${d.rule ? `<div class="pc-rule" data-part="rule">${d.rule}</div>` : ''}
      </div>`;
    }
    const atks = (d.attacks || []).map((a, i) => `
      <div class="pc-atk" data-part="atk${i}">
        <span class="cost" data-part="cost${i}">${a.cost.map(energy).join('')}</span>
        <span class="nm">${a.name}${a.text ? `<span class="desc">${a.text}</span>` : ''}</span>
        <span class="dmg" data-part="dmg${i}">${a.dmg || ''}</span>
      </div>`).join('');
    const retreat = d.retreat ? Array(d.retreat).fill(energy('無色')).join('') : '—';
    return `<div class="pcard ${tcls(d.type)}" aria-label="寶可夢卡 ${d.name}">
      <div class="pc-top">
        <span class="pc-stage" data-part="stage">${d.stage}</span>
        <span class="pc-name" data-part="name">${d.name}</span>
        <span class="pc-hp" data-part="hp">HP<b>${d.hp}</b>${energy(d.type)}</span>
      </div>
      <div class="pc-art ${d.type.length > 1 ? 'long' : ''}" data-part="type">${d.type}</div>
      <div data-part="attacks">${atks}</div>
      <div class="pc-foot">
        <div data-part="weak">弱點<span class="v">${d.weak ? energy(d.weak) + '×2' : '—'}</span></div>
        <div data-part="resist">抗性<span class="v">${d.resist ? energy(d.resist) + '-30' : '—'}</span></div>
        <div data-part="retreat">撤退<span class="v">${retreat}</span></div>
      </div>
    </div>`;
  }

  /* ---------- 小特效 ---------- */
  let FAST = false;   /* 跳轉進度時暫停特效 */
  function sparkle(el, n = 8, chars = ['✨', '⭐', '💫'], kind = 'gold') {
    if (FAST || !el) return;
    const r = el.getBoundingClientRect();
    if (typeof PTCG3D !== 'undefined' && PTCG3D.ok) {
      PTCG3D.burst(r.left + r.width / 2, r.top + r.height / 2, { kind, count: n * 7 });
      return;
    }
    const host = el.offsetParent || document.body;
    const hr = host.getBoundingClientRect();
    const cx = r.left - hr.left + r.width / 2, cy = r.top - hr.top + r.height / 2;
    ['burst', 'burst ring'].forEach((cls, j) => {
      const b = document.createElement('span');
      b.className = cls;
      b.style.left = cx + 'px'; b.style.top = cy + 'px';
      b.style.animationDelay = j * .12 + 's';
      host.appendChild(b);
      setTimeout(() => b.remove(), 1100);
    });
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = chars[i % chars.length];
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      const ang = (Math.PI * 2 * i) / n;
      s.style.setProperty('--dx', Math.cos(ang) * 90 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 90 + 'px');
      host.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function confetti(count = 90) {
    if (typeof PTCG3D !== 'undefined' && PTCG3D.ok) {
      [[.3, .4], [.5, .3], [.7, .4]].forEach(([x, y], i) =>
        setTimeout(() => PTCG3D.burst(innerWidth * x, innerHeight * y, { kind: 'rainbow', count: 90, speed: 520 }), i * 220));
    }
    const colors = ['#FFCE3A', '#FF5E6C', '#5CC75A', '#3BA7F0', '#B071E0', '#FF9F43'];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 2 + Math.random() * 2 + 's';
      c.style.animationDelay = Math.random() * .6 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }
  }

  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function clouds() {
    const box = document.createElement('div');
    box.className = 'sky-deco';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('div');
      c.className = 'cloud';
      const w = 90 + Math.random() * 110;
      c.style.width = w + 'px';
      c.style.height = w * .32 + 'px';
      c.style.top = 4 + Math.random() * 80 + '%';
      c.style.animationDuration = 50 + Math.random() * 50 + 's';
      c.style.animationDelay = -Math.random() * 90 + 's';
      box.appendChild(c);
    }
    document.body.prepend(box);
  }

  function starPill(el) { if (el) el.textContent = `⭐ ${totalStars()} / ${UNITS.length * 3}`; }


  /* ---------- 夥伴小老師（原創角色） ---------- */
  const EYES = (y, sp = 12) => `<g fill="#1F2A5C"><ellipse cx="${50 - sp}" cy="${y}" rx="5" ry="6.5"/><ellipse cx="${50 + sp}" cy="${y}" rx="5" ry="6.5"/></g><g fill="#fff"><circle cx="${52 - sp}" cy="${y - 2.5}" r="1.9"/><circle cx="${52 + sp}" cy="${y - 2.5}" r="1.9"/></g>`;
  const BLUSH = (y, sp = 22, c = '#FFA3B5') => `<g fill="${c}" opacity=".75"><ellipse cx="${50 - sp}" cy="${y}" rx="5" ry="2.6"/><ellipse cx="${50 + sp}" cy="${y}" rx="5" ry="2.6"/></g>`;
  const PARTNERS = {
    cloud: { name: '棉棉', full: '雲朵棉棉', sfx: 'attack_zap', color: '#FFE14D',
      svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 30 C54 22 44 18 50 10" stroke="#5C5A7A" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M50 2 L44 12 L49 12 L45 20 L56 9 L51 9 L54 2Z" fill="#FFE14D" stroke="#1F2A5C" stroke-width="1.5" stroke-linejoin="round"/><g fill="#FFFDF6" stroke="#1F2A5C" stroke-width="2.5"><path d="M22 74 C8 74 8 54 22 54 C20 38 38 32 46 42 C52 28 74 30 74 48 C90 46 94 72 78 74 Z"/></g><ellipse cx="50" cy="70" rx="24" ry="5" fill="#E7E0FF"/>${EYES(56, 11)}<path d="M45 64 Q50 68 55 64" stroke="#1F2A5C" stroke-width="2" fill="none" stroke-linecap="round"/>${BLUSH(62, 21)}</svg>` },
    fruit: { name: '果果', full: '燈籠果果', sfx: 'attack_fire', color: '#FF7A3D',
      svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 C58 14 60 22 50 30 C40 22 42 14 50 4Z" fill="#FF8A1E" stroke="#1F2A5C" stroke-width="1.5"/><path d="M50 13 C54 19 54 23 50 27 C46 23 46 19 50 13Z" fill="#FFE14D"/><g fill="#4CA84A" stroke="#1F2A5C" stroke-width="1.5"><ellipse cx="40" cy="31" rx="9" ry="3.5" transform="rotate(-18 40 31)"/><ellipse cx="60" cy="31" rx="9" ry="3.5" transform="rotate(18 60 31)"/></g><ellipse cx="50" cy="62" rx="36" ry="31" fill="#FF7A3D" stroke="#1F2A5C" stroke-width="2.5"/><path d="M32 40 Q26 62 34 86 M68 40 Q74 62 66 86" stroke="#E0552A" stroke-width="2" fill="none" opacity=".6"/><ellipse cx="38" cy="45" rx="9" ry="5" fill="#fff" opacity=".35"/>${EYES(58, 13)}<path d="M42 68 Q50 80 58 68 Z" fill="#8A2A3A" stroke="#1F2A5C" stroke-width="1.5"/>${BLUSH(67, 25, '#FFD0A0')}</svg>` },
    snail: { name: '泡泡蝸', full: '泡泡蝸', sfx: 'attack_water', color: '#4FB6EE',
      svg: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="66" cy="52" r="27" fill="#BDEBFF" stroke="#1F2A5C" stroke-width="2.5" opacity=".95"/><path d="M66 52 m-3 0 a3 3 0 1 1 6 0 a8 8 0 1 1 -16 0 a13 13 0 1 1 26 0 a18 18 0 1 1 -36 0" fill="none" stroke="#1E7FE0" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="58" cy="38" rx="7" ry="4" fill="#fff" opacity=".8"/><path d="M8 88 Q40 94 88 84 Q84 76 60 76 L30 78 Z" fill="#4FB6EE" stroke="#1F2A5C" stroke-width="2.5"/><path d="M26 30 L20 10 M40 30 L44 10" stroke="#4FB6EE" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="9" r="4.5" fill="#fff" stroke="#1F2A5C" stroke-width="1.5"/><circle cx="44" cy="9" r="4.5" fill="#fff" stroke="#1F2A5C" stroke-width="1.5"/><circle cx="32" cy="52" r="24" fill="#4FB6EE" stroke="#1F2A5C" stroke-width="2.5"/>${EYES(50, 9).replace(/cx="(\d+(\.\d+)?)"/g, (m, v) => 'cx="' + (v - 18) + '"')}<path d="M27 60 Q32 64 37 60" stroke="#1F2A5C" stroke-width="2" fill="none" stroke-linecap="round"/>${BLUSH(58, 15, '#FFB6D0').replace(/cx="(\d+(\.\d+)?)"/g, (m, v) => 'cx="' + (v - 18) + '"')}</svg>` }
  };
  const CHEER = ['太棒了！', '答對囉～', '好厲害！', '你是高手！', '完全正確！'];
  const COMFORT = ['沒關係，再看一次就會了！', '差一點點，加油！', '我們一起看看正確答案～'];
  function avatar(key, cls = '') { const P = PARTNERS[key] || PARTNERS.cloud; return `<span class="avatar ${cls}" data-p="${key}" title="${P.full}">${P.svg}</span>`; }
  function sfx(name, o) { if (!FAST && typeof PTCGAudio !== 'undefined') PTCGAudio.play(name, o); }

  /* 小卡（場地示意用） */
  function mini(d = {}) {
    if (d.back) return `<div class="mini back" role="img" aria-label="蓋著的卡"></div>`;
    const t = d.type || '無色';
    return `<div class="mini ${d.trainer ? 'trainer' : ''} ${TYPES[t] ? 't-' + TYPES[t] : ''}" role="img" aria-label="${d.name}"><b>${d.name}</b>${d.trainer ? `<small>${d.trainer}</small>` : `<small>${t}${d.hp ? ' HP' + d.hp : ''}</small>`}</div>`;
  }

  /* ---------- 小遊戲元件 ---------- */
  /* 1. 點卡片→點位置 */
  function placeGame(root, { items, zones, done }) {
    let pick = null, left = items.length;
    root.innerHTML = `<div class="pg-tray">${items.map((it, i) => `<button class="pg-item" data-i="${i}">${it.html}</button>`).join('')}</div>
      <div class="pg-zones">${zones.map(z => `<button class="pg-zone" data-z="${z.id}" style="${z.style || ''}"><span>${z.label}</span><div class="pg-slot"></div></button>`).join('')}</div>
      <div class="pg-msg" aria-live="polite">先點一張卡，再點牠應該放的位置！</div>`;
    const msg = root.querySelector('.pg-msg');
    root.querySelectorAll('.pg-item').forEach(b => b.onclick = () => {
      root.querySelectorAll('.pg-item').forEach(x => x.classList.remove('sel'));
      pick = b; b.classList.add('sel'); sfx('card_draw'); msg.textContent = '好，現在點牠要放的位置～';
    });
    root.querySelectorAll('.pg-zone').forEach(z => z.onclick = () => {
      if (!pick) { msg.textContent = '先點上面的一張卡喔！'; restart(z, 'shake'); return; }
      const it = items[+pick.dataset.i];
      if (it.zone === z.dataset.z) {
        z.querySelector('.pg-slot').insertAdjacentHTML('beforeend', it.html);
        pick.remove(); pick = null; left--; sfx('card_place'); sparkle(z, 6);
        msg.textContent = it.ok || '放對了！';
        if (!left) { msg.textContent = '全部放好了！你真厲害！'; sfx('level_clear'); confetti(60); done && done(); }
      } else { restart(z, 'shake'); sfx('wrong'); msg.textContent = it.hint || '不是這裡喔，再想想看！'; }
    });
  }
  /* 2. 依正確順序點 */
  function orderGame(root, { steps, done }) {
    let k = 0;
    const shuffled = steps.map((s, i) => ({ s, i })).sort(() => Math.random() - .5);
    root.innerHTML = `<ol class="og-done"></ol><div class="og-pool">${shuffled.map(o => `<button class="btn og-step" data-i="${o.i}">${o.s}</button>`).join('')}</div><div class="pg-msg" aria-live="polite">照順序點下去：第 1 步是什麼？</div>`;
    const msg = root.querySelector('.pg-msg'), list = root.querySelector('.og-done');
    root.querySelectorAll('.og-step').forEach(b => b.onclick = () => {
      if (+b.dataset.i === k) {
        list.insertAdjacentHTML('beforeend', `<li class="pop-in">${steps[k]}</li>`); b.remove(); k++; sfx('card_place');
        msg.textContent = k < steps.length ? `對了！第 ${k + 1} 步呢？` : '順序完全正確！';
        if (k === steps.length) { sfx('level_clear'); confetti(60); done && done(); }
      } else { restart(b, 'shake'); sfx('wrong'); msg.textContent = '順序不對喔，再想想看～'; }
    });
  }
  /* 3. 可以／不行 */
  function yesNoGame(root, { cards, yes = '可以 ⭕', no = '不行 ❌', done }) {
    let k = 0, right = 0;
    const draw = () => {
      if (k >= cards.length) { root.innerHTML = `<div class="q">答對 ${right} / ${cards.length} 題</div><p>${right === cards.length ? '全對！你已經很懂規則了！' : '可以再玩一次，挑戰全對！'}</p><button class="btn sun" id="yn-again">🔁 再玩一次</button>`; root.querySelector('#yn-again').onclick = () => { k = 0; right = 0; draw(); }; if (right === cards.length) { sfx('level_clear'); confetti(60); } done && done(); return; }
      const c = cards[k];
      root.innerHTML = `<div class="yn-card pop-in">${c.q}</div><div class="yn-btns"><button class="btn grass" data-a="1">${yes}</button><button class="btn berry" data-a="0">${no}</button></div><div class="pg-msg" aria-live="polite">第 ${k + 1} / ${cards.length} 張</div>`;
      root.querySelectorAll('.yn-btns .btn').forEach(b => b.onclick = () => {
        const ok = (+b.dataset.a === 1) === c.a;
        root.querySelectorAll('.yn-btns .btn').forEach(x => x.disabled = true);
        if (ok) { right++; sfx('correct'); sparkle(b, 6); } else { sfx('wrong'); restart(b, 'shake'); }
        root.querySelector('.pg-msg').innerHTML = (ok ? '🎉 ' : '🤔 正確答案是「' + (c.a ? '可以' : '不行') + '」。') + c.why;
        const nx = document.createElement('button'); nx.className = 'btn'; nx.textContent = '下一張 ▶'; nx.style.marginTop = '10px';
        nx.onclick = () => { k++; draw(); }; root.appendChild(nx); nx.focus();
      });
    };
    draw();
  }


  /* ---------- 對戰卡：HP 條、傷害指示物、特殊狀態 ---------- */
  function fighter(d, id) {
    return `<div class="fighter" id="${id}" data-max="${d.hp}" data-dmg="0">${card(d)}
      <div class="hpbar"><i style="width:100%"></i></div><div class="hptext">HP <b>${d.hp}</b> / ${d.hp}</div>
      <div class="counters"></div><div class="marks"></div></div>`;
  }
  function paintHP(el) {
    const max = +el.dataset.max, dmg = +el.dataset.dmg, left = Math.max(0, max - dmg);
    el.querySelector('.hpbar i').style.width = (left / max * 100) + '%';
    el.querySelector('.hpbar').classList.toggle('low', left / max <= .35);
    el.querySelector('.hptext').innerHTML = `HP <b>${left}</b> / ${max}`;
    const c = el.querySelector('.counters'); let n = dmg, h = '';
    while (n >= 50) { h += '<span class="dc big">50</span>'; n -= 50; }
    while (n >= 10) { h += '<span class="dc">10</span>'; n -= 10; }
    c.innerHTML = h;
    el.classList.toggle('ko', left === 0);
    return left;
  }
  function damage(el, amt, label) {
    el.dataset.dmg = (+el.dataset.dmg) + amt;
    const left = paintHP(el);
    if (!FAST) {
      restart(el.querySelector('.pcard'), 'shake');
      const pop = document.createElement('div'); pop.className = 'dmg-pop'; pop.textContent = label || ('-' + amt);
      el.appendChild(pop); setTimeout(() => pop.remove(), 1300);
      sfx(left === 0 ? 'knockout' : 'damage');
    }
    return left;
  }
  function setMax(el, max) { el.dataset.max = max; paintHP(el); }
  function lunge(el, dir = 1) { if (!FAST) restart(el, dir > 0 ? 'lunge' : 'lunge-l'); }
  function status(el, st) {
    ['st-sleep', 'st-para', 'st-conf'].forEach(c => el.classList.remove(c));
    if (st) el.classList.add('st-' + st);
  }
  function mark(el, kind, on = true) {
    const m = el.querySelector('.marks'), ex = m.querySelector('.' + kind);
    if (on && !ex) m.insertAdjacentHTML('beforeend', `<span class="mk ${kind}">${kind === 'poison' ? '毒' : '燒'}</span>`);
    if (!on && ex) ex.remove();
  }
  function coin(el, heads) {
    el.textContent = '?';
    if (!FAST) { restart(el, 'spin'); sfx('card_flip'); }
    const done = () => { el.textContent = heads ? '正' : '反'; el.classList.toggle('tails', !heads); };
    FAST ? done() : setTimeout(done, 1300);
  }

  /* 4. 選擇題小遊戲（不計星星） */
  function choiceGame(root, { rounds, done }) {
    let k = 0, right = 0;
    const draw = () => {
      if (k >= rounds.length) { root.innerHTML = `<div class="q">答對 ${right} / ${rounds.length} 題</div><p>${right === rounds.length ? '全對！太厲害了！' : '再玩一次，挑戰全對！'}</p><button class="btn sun" id="cg-again">🔁 再玩一次</button>`; root.querySelector('#cg-again').onclick = () => { k = 0; right = 0; draw(); }; if (right === rounds.length) { sfx('level_clear'); confetti(60); } done && done(); return; }
      const r = rounds[k];
      root.innerHTML = `<div class="pg-msg">第 ${k + 1} / ${rounds.length} 題</div>${r.visual || ''}<div class="yn-card pop-in">${r.q}</div><div class="yn-btns">${r.opts.map((o, i) => `<button class="btn" data-i="${i}">${o}</button>`).join('')}</div><div class="pg-msg" aria-live="polite"></div>`;
      root.querySelectorAll('.yn-btns .btn').forEach(b => b.onclick = () => {
        const ok = +b.dataset.i === r.a;
        root.querySelectorAll('.yn-btns .btn').forEach(x => x.disabled = true);
        root.querySelector(`.yn-btns [data-i="${r.a}"]`).classList.add('grass');
        if (ok) { right++; sfx('correct'); sparkle(b, 6); } else { b.classList.add('berry'); sfx('wrong'); restart(b, 'shake'); }
        root.querySelectorAll('.pg-msg')[1].innerHTML = (ok ? '🎉 ' : '🤔 ') + r.why;
        const nx = document.createElement('button'); nx.className = 'btn'; nx.textContent = '下一題 ▶'; nx.style.marginTop = '10px';
        nx.onclick = () => { k++; draw(); }; root.appendChild(nx); nx.focus();
      });
    };
    draw();
  }

  /* ---------- 自動播放器 ----------
     steps: [{ say: '字幕', dur: 毫秒, run: fn }]
     reset: 回到初始狀態的函式                     */
  class Player {
    constructor(root, { steps, reset }) {
      this.root = root;
      this.steps = steps;
      this.resetFn = reset;
      this.i = -1;
      this.timer = null;
      this.pending = [];
      this.playing = false;
      this.userPaused = false;
      this.started = false;

      /* 3D 舞台：外框、地板、聚光燈 */
      const st = root.querySelector('.stage');
      const wrap = document.createElement('div');
      wrap.className = 'stage-wrap';
      st.before(wrap);
      wrap.innerHTML = '<div class="floor" aria-hidden="true"></div><div class="spot" aria-hidden="true"></div>';
      wrap.appendChild(st);

      this.cap = root.querySelector('.caption');
      if (root.dataset.partner) { this.cap.classList.add('has-avatar'); this.cap.insertAdjacentHTML('afterbegin', avatar(root.dataset.partner)); this.av = this.cap.querySelector('.avatar'); }
      this.txt = this.cap.querySelector('.txt');
      const ctr = root.querySelector('.controls');
      this.dots = document.createElement('div');
      this.dots.className = 'dots';
      this.dots.setAttribute('role', 'group');
      this.dots.setAttribute('aria-label', '播放進度');
      this.dots.innerHTML = steps.map((_, k) =>
        `<button type="button" class="dot" data-k="${k}" aria-label="跳到第 ${k + 1} 步" title="第 ${k + 1} 步"></button>`).join('');
      this.btnPlay = document.createElement('button');
      this.btnPlay.className = 'btn sun';
      this.btnReplay = document.createElement('button');
      this.btnReplay.className = 'btn';
      this.btnReplay.innerHTML = '🔄 重播';
      ctr.append(this.btnPlay, this.dots, this.btnReplay);

      this.btnPlay.onclick = () => (this.playing ? (this.userPaused = true, this.pause()) : (this.userPaused = false, this.play()));
      this.btnReplay.onclick = () => { this.userPaused = false; this.replay(); };
      this.dots.onclick = e => { const d = e.target.closest('.dot'); if (d) this.goto(+d.dataset.k); };
      this.reset();
      this.updateBtn();

      /* 捲到畫面中才開始自動播放 */
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting && !this.started) { this.started = true; this.play(); }
          else if (!e.isIntersecting && this.playing) { this.pause(); }
          else if (e.isIntersecting && this.started && !this.playing && !this.userPaused && this.i < this.steps.length - 1) { this.play(); }
        });
      }, { threshold: .45 });
      io.observe(root);
    }
    /* 步驟裡的延遲動作一律用 wait，跳轉時才能正確處理 */
    wait(fn, ms) {
      if (FAST) { fn(); return; }
      const t = setTimeout(() => { this.pending = this.pending.filter(x => x !== t); fn(); }, ms);
      this.pending.push(t);
    }
    clearTimers() { clearTimeout(this.timer); this.pending.forEach(clearTimeout); this.pending = []; }
    reset() {
      this.clearTimers();
      this.i = -1;
      if (this.resetFn) this.resetFn.call(this);
      this.say(this.root.dataset.intro || '準備好了嗎？');
      this.paintDots();
    }
    say(t) { this.txt.textContent = t; if (!FAST) { restart(this.cap, 'say'); if (this.av) restart(this.av, 'talk'); } }
    paintDots() {
      [...this.dots.children].forEach((d, k) => {
        d.classList.toggle('on', k <= this.i);
        d.classList.toggle('now', k === this.i);
        d.setAttribute('aria-current', k === this.i ? 'step' : 'false');
      });
    }
    updateBtn() {
      const ended = this.i >= this.steps.length - 1 && !this.playing;
      this.btnPlay.innerHTML = this.playing ? '⏸ 暫停' : (ended ? '▶ 再看一次' : '▶ 播放');
    }
    runStep(k) {
      const s = this.steps[k];
      sfx(s.sfx || 'ui_click', s.sfx ? undefined : { vol: .55 });
      if (s.run) s.run.call(this);
      if (s.say) this.say(s.say);
    }
    next() {
      if (this.i >= this.steps.length - 1) { this.playing = false; this.updateBtn(); return; }
      this.i++;
      this.runStep(this.i);
      this.paintDots();
      this.timer = setTimeout(() => this.next(), this.steps[this.i].dur || 2600);
    }
    /* 跳到第 k 步：前面的步驟瞬間完成，第 k 步正常播放 */
    goto(k) {
      const wasPlaying = this.playing || !this.userPaused;
      this.reset();
      const stage = this.root.querySelector('.stage');
      if (k > 0) {
        FAST = true;
        this.root.classList.add('instant');
        try { for (let j = 0; j < k; j++) this.runStep(j); } finally { FAST = false; }
        stage.querySelectorAll('.pop-in,.jump').forEach(e => e.classList.remove('pop-in', 'jump'));
        void stage.offsetWidth;
        this.root.classList.remove('instant');
      }
      this.i = k - 1;
      this.started = true;
      this.next();
      if (wasPlaying && !this.userPaused) { this.playing = true; }
      else { clearTimeout(this.timer); this.playing = false; }
      this.updateBtn();
    }
    play() {
      if (this.i >= this.steps.length - 1) this.reset();
      this.playing = true;
      this.updateBtn();
      this.timer = setTimeout(() => this.next(), this.i < 0 ? 900 : 700);
    }
    pause() { clearTimeout(this.timer); this.playing = false; this.updateBtn(); }
    replay() { this.reset(); this.play(); }
  }

  /* 滑鼠位置 → 光源位置 */
  document.addEventListener('pointermove', e => {
    document.documentElement.style.setProperty('--lx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--ly', (e.clientY / innerHeight * 100).toFixed(1) + '%');
  });

  /* ---------- 測驗 ----------
     questions: [{ q, opts: [...], a: 正確索引, why }] */
  function quiz(root, unitId, questions, nextHref, partner = 'cloud') {
    let k = 0, score = 0;
    const P = PARTNERS[partner];
    const draw = () => {
      if (k >= questions.length) return finish();
      const Q = questions[k];
      root.innerHTML = `
        <div class="progress">第 ${k + 1} 題 / 共 ${questions.length} 題</div>
        <div class="q-row">${avatar(partner, 'big')}<div class="q">${Q.q}</div></div>
        <div class="opts">${Q.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
        <div class="explain" aria-live="polite"></div>
        <div style="margin-top:14px;min-height:56px" class="nx"></div>`;
      root.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const pick = +b.dataset.i;
        root.querySelectorAll('.opt').forEach(x => x.disabled = true);
        const right = root.querySelector(`.opt[data-i="${Q.a}"]`);
        right.classList.add('right');
        if (pick === Q.a) {
          score++;
          sparkle(right, 10); sfx('correct'); restart(root.querySelector('.avatar'), 'happy');
          root.querySelector('.explain').innerHTML = `<b>${P.name}：${CHEER[k % CHEER.length]}</b> ` + (Q.why || '');
        } else {
          b.classList.add('wrong'); sfx('wrong'); restart(root.querySelector('.avatar'), 'comfort');
          root.querySelector('.explain').innerHTML = `<b>${P.name}：${COMFORT[k % COMFORT.length]}</b> ` + (Q.why || '');
        }
        const nx = document.createElement('button');
        nx.className = 'btn grass';
        nx.textContent = k === questions.length - 1 ? '看成績' : '下一題';
        nx.onclick = () => { k++; draw(); };
        root.querySelector('.nx').appendChild(nx);
        nx.focus();
      });
    };
    const finish = () => {
      const n = questions.length;
      const stars = score === n ? 3 : score >= n - 1 ? 2 : score >= Math.ceil(n * .6) ? 1 : 0;
      setStars(unitId, stars);
      const pill = document.querySelector('.star-pill');
      starPill(pill); if (pill) restart(pill, 'bump');
      root.innerHTML = `
        <div class="q-row" style="justify-content:center">${avatar(partner, 'big ' + (stars ? 'party' : 'comfort'))}<div class="q">答對 ${score} 題 / 共 ${n} 題</div></div>
        <div class="result-stars" aria-label="得到 ${stars} 顆星">${[0, 1, 2].map(i =>
          `<span class="${i < stars ? 'got' : ''}" style="animation-delay:${i * .25}s">★</span>`).join('')}</div>
        <p>${stars === 3 ? '太厲害了！你是卡牌小達人！' : stars > 0 ? '過關了！想拿滿 3 顆星可以再挑戰一次。' : '再複習一下上面的動畫，一定可以過關！'}</p>
        <div class="next-nav" style="justify-content:center">
          <button class="btn" id="again">🔁 再挑戰</button>
          <a class="btn sun" href="../index.html?zone=${document.body.dataset.zone || 'grass'}">🗺 回地圖</a>
          ${stars > 0 && nextHref ? `<a class="btn grass" href="${nextHref}">下一關 ▶</a>` : ''}
        </div>`;
      root.querySelector('#again').onclick = () => { k = 0; score = 0; draw(); };
      if (stars > 0) { confetti(); sfx('level_clear'); for (let i = 0; i < stars; i++) setTimeout(() => sfx('star'), 900 + i * 280); }
    };
    draw();
  }

  /* 閃卡傾斜＋鐳射光（滑鼠或手指） */
  function holo() {
    let cur = null;
    const move = e => {
      const c = e.target.closest && e.target.closest('.pcard');
      if (cur && cur !== c) { cur.classList.remove('tilt'); cur = null; }
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%');
      c.style.setProperty('--my', y * 100 + '%');
      c.style.setProperty('--ry', (x - .5) * 22 + 'deg');
      c.style.setProperty('--rx', (.5 - y) * 22 + 'deg');
      c.classList.add('tilt');
      cur = c;
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerdown', move);
    const leave = () => { if (cur) { cur.classList.remove('tilt'); cur = null; } };
    document.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') leave(); });
    document.addEventListener('pointerleave', leave);
  }

  function twinkles(host, n = 6) {
    for (let i = 0; i < n; i++) {
      const t = document.createElement('span');
      t.className = 'twinkle';
      t.textContent = '✦';
      t.setAttribute('aria-hidden', 'true');
      t.style.left = 5 + Math.random() * 90 + '%';
      t.style.top = Math.random() * 90 + '%';
      t.style.fontSize = 16 + Math.random() * 20 + 'px';
      t.style.animationDelay = Math.random() * 2.4 + 's';
      host.appendChild(t);
    }
  }

  function clouds2() { clouds(); holo(); }

  /* 音效：自動設定路徑、背景音樂、靜音開關、按鈕音 */
  const ME = document.currentScript && document.currentScript.src;
  if (typeof PTCGAudio !== 'undefined' && ME) {
    PTCGAudio.init(ME.replace(/js\/common\.js.*$/, 'audio/'));
    document.addEventListener('DOMContentLoaded', () => {
      const bar = document.querySelector('.topbar');
      if (bar && !bar.querySelector('.sound-btn')) { const w = document.createElement('span'); w.style.display = 'flex'; w.style.gap = '8px'; const pill = bar.querySelector('.star-pill'); if (pill) { pill.before(w); w.appendChild(pill); } else bar.appendChild(w); PTCGAudio.button(w); w.appendChild(w.querySelector('.sound-btn')); w.prepend(w.querySelector('.sound-btn')); }
      const bgm = document.body.dataset.bgm; if (bgm !== 'none') PTCGAudio.music(bgm || 'bgm_grassland');
    });
    document.addEventListener('click', e => { const b = e.target.closest('.btn,.node,.gym-tag'); if (b && !b.classList.contains('sound-btn') && !b.closest('.pg-zone,.opt,.og-step,.yn-btns,.dots')) PTCGAudio.play('ui_click', { vol: .6 }); }, true);
  }


  /* ---------- 換頁轉場：夥伴光圈 ---------- */
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function wipe(cover, x = innerWidth / 2, y = innerHeight / 2) {
    let w = document.querySelector('.page-wipe');
    if (!w) {
      w = document.createElement('div'); w.className = 'page-wipe'; w.setAttribute('aria-hidden', 'true');
      const keys = Object.keys(PARTNERS); w.innerHTML = '<div class="iris"></div>' + avatar(keys[Math.random() * keys.length | 0]);
      document.body.appendChild(w);
    }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    w.style.setProperty('--wx', x + 'px'); w.style.setProperty('--wy', y + 'px'); w.style.setProperty('--ws', Math.ceil(r / 5 + 2));
    if (cover) { void w.offsetWidth; w.classList.add('cover'); } else w.classList.remove('cover');
    return w;
  }
  function go(href, x, y) {
    if (REDUCE) { location.href = href; return; }
    wipe(true, x, y); sfx('enter_gym', { vol: .7 });
    try { sessionStorage.setItem('ptcg-wipe', '1'); } catch (e) { /* 略過 */ }
    setTimeout(() => { location.href = href; }, 520);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault(); go(a.href, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
  });
  /* 進場：從光圈中打開 */
  document.addEventListener('DOMContentLoaded', () => {
    let came = false; try { came = sessionStorage.getItem('ptcg-wipe') === '1'; sessionStorage.removeItem('ptcg-wipe'); } catch (e) { /* 略過 */ }
    if (came && !REDUCE) { const w = wipe(true); w.querySelector('.iris').style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { w.querySelector('.iris').style.transition = ''; wipe(false); })); }
    /* 頁尾聲明 */
    const wrap = document.querySelector('.wrap');
    if (wrap && !document.querySelector('.site-foot') && !document.body.dataset.nofoot) {
      const root = ME && /\/units\//.test(location.pathname) ? '../' : '';
      wrap.insertAdjacentHTML('beforeend', `<footer class="site-foot">非官方粉絲教學網站，與任天堂、Creatures、GAME FREAK、寶可夢公司無關。寶可夢名稱與規則之權利屬於各權利人。<br><a href="${root}about.html">關於本站・給家長與老師</a></footer>`);
    }
  });
  addEventListener('pageshow', e => { if (e.persisted) { const w = document.querySelector('.page-wipe'); w && w.classList.remove('cover'); } });

  /* ---------- 第一次進站：夥伴引導 ---------- */
  const OB_KEY = 'ptcg-camp-onboard-v1';
  function onboarding(force) {
    try { if (!force && localStorage.getItem(OB_KEY)) return; } catch (e) { return; }
    const S = [
      ['cloud', '歡迎來到卡牌訓練營！', '我是雲朵棉棉，旁邊是燈籠果果和泡泡蝸。我們三個會陪你一起學寶可夢卡牌！'],
      ['fruit', '點發光的道館來上課', '每一關都有動畫、小遊戲和測驗。答對就能拿星星，還會解鎖下一關！拖曳畫面可以轉動地圖喔。'],
      ['snail', '最後挑戰終極魔王！', '學完 10 關，到火山競技場和電腦對戰，再爬上魔王塔挑戰五位魔王。右上角 🏆 可以看你的成就！']
    ];
    let k = 0;
    const box = document.createElement('div');
    box.className = 'onboard'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'obTitle');
    const prev = document.activeElement;
    const close = () => { try { localStorage.setItem(OB_KEY, '1'); } catch (e) { /* 略過 */ } box.classList.add('out'); setTimeout(() => box.remove(), 350); document.removeEventListener('keydown', key); prev && prev.focus && prev.focus(); };
    const draw = () => {
      const [p, t, d] = S[k];
      box.innerHTML = `<div class="ob-card">${avatar(p, 'big happy')}<p class="ob-step">${k + 1} / ${S.length}</p><h2 id="obTitle">${t}</h2><p>${d}</p>
        <div class="ob-dots">${S.map((_, i) => `<i class="${i === k ? 'on' : ''}"></i>`).join('')}</div>
        <div class="ob-btns"><button class="btn" data-a="skip">略過</button><button class="btn sun" data-a="next">${k < S.length - 1 ? '下一步 ▶' : '出發吧！🚀'}</button></div></div>`;
      box.querySelector('[data-a=skip]').onclick = close;
      box.querySelector('[data-a=next]').onclick = () => { sfx('ui_click'); if (k < S.length - 1) { k++; draw(); } else { sfx('level_clear'); close(); } };
      box.querySelector('[data-a=next]').focus();
    };
    const key = e => { if (e.key === 'Escape') close(); if (e.key === 'Tab') { const f = [...box.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); } };
    document.addEventListener('keydown', key);
    document.body.appendChild(box); draw();
  }
  /* ---------- 延遲載入 3D（Three.js）：需要時才下載，不拖慢第一次開頁 ---------- */
  const ASSET = ME ? ME.replace(/js\/common\.js.*$/, '') : 'assets/';
  const BUILD = ((ME || '').match(/[?&]v=(\w+)/) || [])[1] || '';   // 網站版本號（由 build.py 寫在網址上）
  const loaded = {};
  function loadScript(rel) {
    return loaded[rel] || (loaded[rel] = new Promise((ok, bad) => {
      const el = document.createElement('script'); el.src = ASSET + rel + (BUILD ? '?v=' + BUILD : ''); el.onload = ok; el.onerror = bad; document.head.appendChild(el);
    }));
  }
  /* 有沒有硬體加速的 WebGL？（軟體繪圖的裝置改用平面版，網址加 ?force3d 可強制開啟） */
  let gpuOK;
  function hasGPU() {
    if (gpuOK !== undefined) return gpuOK;
    try {
      if (/[?&]force3d/.test(location.search)) return (gpuOK = true);
      const c = document.createElement('canvas'), o = { failIfMajorPerformanceCaveat: true };
      const gl = c.getContext('webgl2', o) || c.getContext('webgl', o);
      const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
      const name = gl ? String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : '';
      gpuOK = !!gl && !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      if (gl && gl.getExtension('WEBGL_lose_context')) gl.getExtension('WEBGL_lose_context').loseContext();
    } catch (e) { gpuOK = false; }
    return gpuOK;
  }
  function load3D(extra = []) {
    if (!hasGPU()) return Promise.reject(new Error('no-gpu'));
    let p = loadScript('vendor/three.min.js');
    extra.forEach(x => { p = p.then(() => loadScript(x)); });
    return p;
  }
  /* 只列印頁面上的某一塊（證書、學習報告） */
  function printOnly(el) {
    const old = document.getElementById('printArea'); if (old) old.remove();
    const box = document.createElement('div'); box.id = 'printArea'; box.appendChild(el.cloneNode(true));
    box.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    document.body.appendChild(box); document.body.classList.add('print-one');
    const done = () => { box.remove(); document.body.classList.remove('print-one'); removeEventListener('afterprint', done); };
    addEventListener('afterprint', done); print();
  }
  /* 在使用者第一次互動、或頁面空閒一段時間後才執行 */
  function whenIdle(fn, ms = 4000) {
    let done = false;
    const run = () => { if (done) return; done = true; ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(e => removeEventListener(e, run, true)); (window.requestIdleCallback || setTimeout)(fn); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(e => addEventListener(e, run, { capture: true, passive: true }));
    addEventListener('load', () => setTimeout(run, ms));
  }
  /* 單元頁：3D 粒子光爆（沒載入前會用 CSS 星星代替） */
  document.addEventListener('DOMContentLoaded', () => {
    if (!REDUCE && document.querySelector('.lesson .stage')) whenIdle(() => load3D(['js/fx3d.js']).catch(() => {}));
  });
  /* 離線快取（只在正式網址上啟用） */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && ME && !/[?&]sim/.test(location.search)) {
    addEventListener('load', () => navigator.serviceWorker.register(ME.replace(/assets\/js\/common\.js.*$/, 'sw.js')).catch(() => {}));
  }
  return { BUILD, printOnly, hasGPU, load3D, whenIdle, onboarding, getStats, recordBattle, BOSSES, bossBeaten, bossUnlocked, bossWin, go, fighter, damage, setMax, paintHP, lunge, status, mark, coin, choiceGame, cheatButton, PARTNERS, avatar, mini, placeGame, orderGame, yesNoGame, sfx: (n, o) => sfx(n, o), get fast() { return FAST; }, twinkles, UNITS, AVAILABLE, getStars, setStars, totalStars, isUnlocked, energy, card, sparkle, confetti, restart, clouds: clouds2, starPill, Player, quiz };
})();

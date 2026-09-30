/* 寶可夢卡牌訓練營：音樂與音效
   用法：
     PTCGAudio.init('../assets/audio/');   // 設定音檔資料夾
     PTCGAudio.play('attack_zap');          // 播放音效
     PTCGAudio.music('bgm_grassland');      // 播放背景音樂（無縫循環）
     PTCGAudio.button(el);                  // 在 el 裡放一個靜音開關
   瀏覽器規定要使用者先點過畫面才能發出聲音，本模組會自動等第一次點擊。 */
const PTCGAudio = (() => {
  const KEY = 'ptcg-camp-audio-v1';
  const LOOPS = { bgm_grassland: 32 * 4 * 60 / 140 };   // 背景音樂的循環長度（秒）
  let base = 'assets/audio/';
  const inline = {};          // 單檔版：直接內嵌的音檔
  const buffers = {};         // 已解碼的音效
  const loading = {};
  let ctx = null, master, musicGain, sfxGain, unlocked = false;
  let current = null, wantMusic = null, fallbackEl = null;
  const set = Object.assign({ muted: false, music: .8, sfx: .9 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
  if (!set.v2) { set.music = .8; set.v2 = true; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(set)); } catch (e) { /* 無法儲存時略過 */ } };
  const listeners = [];

  function url(name) { return inline[name] || base + name + '.mp3'; }
  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = set.muted ? 0 : 1; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = set.music; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = set.sfx; sfxGain.connect(master);
    return ctx;
  }
  function load(name) {
    if (buffers[name]) return Promise.resolve(buffers[name]);
    if (loading[name]) return loading[name];
    if (!ensureCtx()) return Promise.reject(new Error('no audio'));
    if (location.protocol === 'file:' && !inline[name]) return Promise.reject(new Error('file://'));
    loading[name] = fetch(url(name))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((ok, bad) => ctx.decodeAudioData(ab, ok, bad)))
      .then(b => (buffers[name] = b));
    loading[name].catch(() => { delete loading[name]; });
    return loading[name];
  }

  /* 本機直接開檔（file://）時 fetch 會被擋，改用 <audio> 播放 */
  function playFallback(name, vol) {
    const a = new Audio(url(name)); a.volume = Math.min(1, vol * set.sfx); a.play().catch(() => {});
  }

  function play(name, { vol = 1, rate = 1 } = {}) {
    if (set.muted) return;
    if (!unlocked) return;
    load(name).then(b => {
      const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.value = vol; s.connect(g).connect(sfxGain); s.start();
    }).catch(() => playFallback(name, vol));
  }

  function startMusic(name) {
    stopMusic(true);
    load(name).then(b => {
      if (wantMusic !== name) return;
      const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
      /* 部分瀏覽器解碼 MP3 會在開頭多出編碼器延遲，這裡校正循環點讓接縫無聲 */
      const L = LOOPS[name] || b.duration;
      const extra = b.duration - L;
      const start = extra > .02 ? Math.min(1105 / b.sampleRate, extra) : 0;
      src.loopStart = start; src.loopEnd = Math.min(b.duration, start + L);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
      src.connect(g).connect(musicGain); src.start(0, start);
      current = { src, g, name };
    }).catch(() => {
      fallbackEl = new Audio(url(name)); fallbackEl.loop = true; fallbackEl.volume = set.muted ? 0 : set.music; fallbackEl.play().catch(() => {});
      current = { name, el: fallbackEl };
    });
  }
  function stopMusic(fast) {
    if (!current) return;
    if (current.src) {
      const { src, g } = current, now = ctx.currentTime;
      g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + (fast ? .15 : .8));
      src.stop(now + (fast ? .2 : .9));
    }
    if (current.el) current.el.pause();
    current = null;
  }
  function music(name) {
    wantMusic = name;
    if (!name) { stopMusic(); return; }
    if (unlocked && !set.muted) startMusic(name);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (ensureCtx() && ctx.state === 'suspended') ctx.resume();
    if (wantMusic && !set.muted) startMusic(wantMusic);
    ['pointerdown', 'keydown', 'touchstart'].forEach(e => removeEventListener(e, unlock, true));
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, unlock, true));

  function setMuted(m) {
    set.muted = m; save();
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, .05);
    if (fallbackEl) fallbackEl.volume = m ? 0 : set.music;
    if (!m && wantMusic && unlocked && !current) startMusic(wantMusic);
    listeners.forEach(f => f());
  }
  function setVolume(kind, v) {
    set[kind] = v; save();
    if (ctx) (kind === 'music' ? musicGain : sfxGain).gain.setTargetAtTime(v, ctx.currentTime, .05);
    if (kind === 'music' && fallbackEl) fallbackEl.volume = set.muted ? 0 : v;
  }

  /* 靜音開關按鈕 */
  function button(host) {
    const b = document.createElement('button');
    b.className = 'btn sound-btn';
    const paint = () => { b.textContent = set.muted ? '🔇' : '🔊'; b.setAttribute('aria-label', set.muted ? '開啟聲音' : '關閉聲音'); b.setAttribute('aria-pressed', String(!set.muted)); };
    b.onclick = () => { unlock(); setMuted(!set.muted); if (!set.muted) play('ui_click'); };
    listeners.push(paint); paint();
    host.appendChild(b);
    return b;
  }

  return {
    init(path) { base = path; },
    register(name, dataUrl) { inline[name] = dataUrl; },
    preload(names) { if (ensureCtx()) names.forEach(n => load(n).catch(() => {})); },
    play, music, stopMusic, setMuted, setVolume, button, unlock,
    get muted() { return set.muted; }, get volumes() { return { music: set.music, sfx: set.sfx }; }
  };
})();

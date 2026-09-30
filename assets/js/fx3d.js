/* 寶可夢卡牌訓練營：WebGL 3D 特效（需先載入 three.min.js） */
const PTCG3D = (() => {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ok = !!window.THREE && !reduce;
  if (ok) {
    try {
      const c = document.createElement('canvas');
      ok = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { ok = false; }
  }
  if (!ok) return { ok: false, hero() {}, burst() {} };

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const FONT = "'Huninn','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif";
  const INK = '#1F2A5C';
  const TC = {
    '草': ['#5CC75A', '#E3F7DC', '#23601F'], '火': ['#FF7043', '#FFE3D9', '#8A2A0C'],
    '水': ['#3BA7F0', '#DDF0FD', '#0D4C7A'], '雷': ['#FFCE3A', '#FFF3C4', '#6B4E00'],
    '超': ['#B071E0', '#F1E4FB', '#52237A'], '鬥': ['#C8763A', '#F6E3D4', '#5E300F'],
    '惡': ['#4A4A6A', '#E1E1EA', '#23233A'], '鋼': ['#9AA7B8', '#EEF1F5', '#3B4454'],
    '龍': ['#C9A227', '#F7EDCB', '#5A4608'], '無色': ['#E8E4DA', '#FAF8F3', '#5A5648']
  };

  /* ---------- 共用貼圖 ---------- */
  function starTexture() {
    const s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(.2, 'rgba(255,255,255,.8)');
    r.addColorStop(.5, 'rgba(255,255,255,.15)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath(); g.ellipse(s / 2, s / 2, s / 2, 3, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(s / 2, s / 2, 3, s / 2, 0, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  let STAR;
  const star = () => STAR || (STAR = starTexture());

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function energyDot(g, x, y, r, t) {
    const [c] = TC[t] || TC['無色'];
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    const hl = g.createRadialGradient(x - r * .35, y - r * .4, 0, x - r * .35, y - r * .4, r);
    hl.addColorStop(0, 'rgba(255,255,255,.9)'); hl.addColorStop(.5, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = (t === '雷' || t === '無色') ? INK : '#fff';
    g.font = `900 ${r * 1.05}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(t === '無色' ? '★' : t, x, y + 2);
  }

  /* 卡片正面（用 2D canvas 畫，再貼到 3D 卡片上） */
  function faceCanvas(d) {
    const W = 512, H = 716, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const [tc, tl, td] = TC[d.type] || TC['無色'];
    rr(g, 0, 0, W, H, 40); g.fillStyle = INK; g.fill();
    rr(g, 12, 12, W - 24, H - 24, 30);
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fff'); bg.addColorStop(.3, tl); bg.addColorStop(1, tl);
    g.fillStyle = bg; g.fill();
    g.textBaseline = 'middle';
    /* 上方 */
    rr(g, 36, 40, 88, 40, 14); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.fillStyle = INK; g.font = `24px ${FONT}`; g.textAlign = 'center'; g.fillText(d.stage, 80, 61);
    g.textAlign = 'left'; g.font = `52px ${FONT}`; g.fillText(d.name, 136, 62);
    g.textAlign = 'right'; g.font = `22px ${FONT}`; g.fillText('HP', 400, 66);
    g.font = `46px ${FONT}`; g.fillText(d.hp, 448, 62);
    energyDot(g, 468, 60, 18, d.type);
    /* 圖區 */
    rr(g, 36, 100, W - 72, 250, 22);
    const art = g.createLinearGradient(0, 100, 0, 350);
    art.addColorStop(0, '#fff'); art.addColorStop(.25, tc); art.addColorStop(1, tc);
    g.fillStyle = art; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.save(); rr(g, 36, 100, W - 72, 250, 22); g.clip();
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(255,255,255,${i % 2 ? .08 : .16})`;
      g.beginPath(); g.moveTo(W / 2, 225);
      const a = i / 14 * Math.PI * 2;
      g.arc(W / 2, 225, 400, a, a + Math.PI / 14); g.fill();
    }
    g.restore();
    g.font = `900 170px ${FONT}`; g.textAlign = 'center';
    g.lineWidth = 14; g.strokeStyle = INK; g.strokeText(d.type, W / 2, 232);
    g.fillStyle = '#fff'; g.fillText(d.type, W / 2, 232);
    /* 招式 */
    (d.attacks || []).forEach((a, i) => {
      const y = 405 + i * 72;
      a.cost.forEach((t, k) => energyDot(g, 62 + k * 40, y, 17, t));
      g.fillStyle = INK; g.textAlign = 'left'; g.font = `38px ${FONT}`; g.fillText(a.name, 150, y);
      g.textAlign = 'right'; g.font = `44px ${FONT}`; g.fillText(a.dmg, W - 44, y);
    });
    /* 底部 */
    g.fillStyle = INK; g.fillRect(36, 572, W - 72, 4);
    const cols = [['弱點', d.weak, '×2'], ['抗性', d.resist, '-30'], ['撤退', d.retreat ? '無色' : null, d.retreat > 1 ? '×' + d.retreat : '']];
    cols.forEach(([lb, t, suf], i) => {
      const x = 36 + (W - 72) / 6 * (i * 2 + 1);
      g.fillStyle = INK; g.textAlign = 'center'; g.font = `22px ${FONT}`; g.fillText(lb, x, 604);
      if (t) { energyDot(g, x - (suf ? 18 : 0), 648, 18, t); g.font = `24px ${FONT}`; g.fillStyle = INK; g.fillText(suf, x + 24, 650); }
      else { g.font = `30px ${FONT}`; g.fillText('—', x, 648); }
    });
    return c;
  }

  /* 原創卡背：訓練營徽章 */
  function backCanvas() {
    const W = 512, H = 716, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    rr(g, 0, 0, W, H, 40); g.fillStyle = INK; g.fill();
    rr(g, 16, 16, W - 32, H - 32, 28);
    const bg = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 420);
    bg.addColorStop(0, '#3B5BDB'); bg.addColorStop(1, '#1A2466');
    g.fillStyle = bg; g.fill();
    g.save(); rr(g, 16, 16, W - 32, H - 32, 28); g.clip();
    for (let i = 0; i < 24; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,206,58,.10)' : 'rgba(255,255,255,.05)';
      g.beginPath(); g.moveTo(W / 2, H / 2);
      const a = i / 24 * Math.PI * 2;
      g.arc(W / 2, H / 2, 600, a, a + Math.PI / 24); g.fill();
    }
    g.restore();
    /* 星形徽章 */
    g.save(); g.translate(W / 2, H / 2 - 30);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 62 : 140, a = -Math.PI / 2 + i * Math.PI / 5;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    const sg = g.createLinearGradient(-140, -140, 140, 140);
    sg.addColorStop(0, '#FFF3B0'); sg.addColorStop(.5, '#FFCE3A'); sg.addColorStop(1, '#E09B00');
    g.fillStyle = sg; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
    g.restore();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `44px ${FONT}`; g.fillText('卡牌訓練營', W / 2, H / 2 + 170);
    return c;
  }

  function tex(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* 環境反射：用漸層天空產生 */
  function envMap(renderer) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#ffffff'); sky.addColorStop(.45, '#BDE6FF'); sky.addColorStop(1, '#FFE9A8');
    g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
    [[120, 70, '#FFFFFF'], [380, 90, '#FFF2B0'], [250, 40, '#FFD6F5']].forEach(([x, y, col]) => {
      const r = g.createRadialGradient(x, y, 0, x, y, 60);
      r.addColorStop(0, col); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 512, 256);
    });
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
    return env;
  }

  /* 圓角卡片形狀 */
  function cardShape(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function planeUV(geo, w, h) {
    const p = geo.attributes.position, uv = [];
    for (let i = 0; i < p.count; i++) uv.push((p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  }

  /* 閃卡鐳射材質 */
  function holoMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uTilt: { value: new THREE.Vector2() } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime; uniform vec2 uTilt;
        void main(){
          float t = vUv.x * .9 + vUv.y * .7 + uTilt.x * .8 - uTilt.y * .6;
          vec3 rainbow = .5 + .5 * cos(6.2831 * (vec3(0., .33, .67) + t));
          float bands = pow(sin((vUv.x + vUv.y) * 22. + uTilt.x * 9.) * .5 + .5, 3.);
          float sweep = fract(uTime * .22);
          float sheen = smoothstep(.07, 0., abs((vUv.x * .8 + vUv.y * .5) - (sweep * 2.2 - .4)));
          vec3 col = rainbow * (.05 + .12 * bands) + vec3(1.) * sheen * .45;
          gl_FragColor = vec4(col, 1.);
        }`
    });
  }

  function makeCard(frontCanvas, backCanvasEl, env) {
    const W = 2, H = 2.8, R = .16, D = .05;
    const grp = new THREE.Group();
    const shape = cardShape(W, H, R);
    const edge = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false, curveSegments: 8 }),
      new THREE.MeshPhysicalMaterial({ color: 0xFFCE3A, metalness: 1, roughness: .25, envMap: env, envMapIntensity: 1.4 })
    );
    edge.position.z = -D / 2;
    grp.add(edge);
    const faceGeo = planeUV(new THREE.ShapeGeometry(shape, 8), W, H);
    const front = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({
      map: tex(frontCanvas), roughness: .35, metalness: .05, clearcoat: 1, clearcoatRoughness: .08,
      iridescence: .3, iridescenceIOR: 1.5, envMap: env, envMapIntensity: .45
    }));
    front.position.z = D / 2 + .002;
    grp.add(front);
    const holo = new THREE.Mesh(faceGeo, holoMaterial());
    holo.position.z = D / 2 + .004;
    grp.add(holo);
    const back = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({
      map: tex(backCanvasEl), roughness: .3, metalness: .15, clearcoat: 1, clearcoatRoughness: .1, envMap: env
    }));
    back.rotation.y = Math.PI;
    back.position.z = -D / 2 - .002;
    grp.add(back);
    grp.userData.holo = holo.material;
    return grp;
  }

  /* ---------- 首頁 3D 主視覺 ---------- */
  function hero(host, cards) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .92;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, 0, 8.6);
    const env = envMap(renderer);

    scene.add(new THREE.AmbientLight(0xffffff, .45));
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-3, 5, 8); scene.add(key);
    const warm = new THREE.PointLight(0xFFC23A, 26, 20); scene.add(warm);
    const cool = new THREE.PointLight(0x66CCFF, 20, 20); scene.add(cool);
    const pink = new THREE.PointLight(0xFF6FD8, 12, 20); scene.add(pink);

    const back = backCanvas();
    const meshes = cards.map(d => { const m = makeCard(faceCanvas(d), back, env); scene.add(m); return m; });

    /* 漂浮星光 */
    const N = 140, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 18; pos[i * 3 + 1] = (Math.random() - .5) * 7; pos[i * 3 + 2] = (Math.random() - .5) * 4 - 1; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({
      map: star(), size: .35, color: 0xFFF3B0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(pts);

    let layout = [];
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const vw = vh * camera.aspect;
      const narrow = w < 640;
      const s = narrow ? .6 : 1.08;
      layout = narrow
        ? [[-vw * .33, vh * .24, s, .35], [vw * .33, vh * .22, s, -.35], [0, -vh * .5, 0, 0]]
        : [[-vw * .395, -.1, s, .45], [vw * .395, 0, s, -.45], [vw * .2, -vh * .9, 0, 0]];
      meshes.forEach((m, i) => { const L = layout[i] || layout[0]; m.position.set(L[0], L[1], 0); m.scale.setScalar(L[2]); });
    }
    new ResizeObserver(resize).observe(host);
    resize();

    const mouse = new THREE.Vector2();
    window.addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; });

    /* 點卡片會翻面並爆光 */
    const ray = new THREE.Raycaster();
    const spin = meshes.map(() => ({ extra: 0, target: 0 }));
    renderer.domElement.addEventListener('pointerdown', e => {
      const r = renderer.domElement.getBoundingClientRect();
      const p = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(p, camera);
      meshes.forEach((m, i) => {
        if (ray.intersectObject(m, true).length) { spin[i].target += Math.PI * 2; burst(e.clientX, e.clientY, { kind: 'gold', count: 70 }); }
      });
    });
    renderer.domElement.style.cursor = 'pointer';

    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
    const clock = new THREE.Clock();
    let auto = 0;
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      warm.position.set(Math.sin(t * .7) * 6, 3 + Math.cos(t * .5), 4);
      cool.position.set(Math.cos(t * .6) * -6, -2 + Math.sin(t * .8), 4);
      pink.position.set(Math.sin(t * .4) * 3, Math.cos(t * .9) * 3, 5);
      /* 每 7 秒輪流翻一張 */
      if (t - auto > 7) { auto = t; const k = Math.floor(t / 7) % meshes.length; if (layout[k] && layout[k][2]) spin[k].target += Math.PI * 2; }
      meshes.forEach((m, i) => {
        const L = layout[i]; if (!L || !L[2]) { m.visible = false; return; }
        m.visible = true;
        spin[i].extra += (spin[i].target - spin[i].extra) * .06;
        m.position.y = L[1] + Math.sin(t * 1.2 + i * 2) * .18;
        m.rotation.y = L[3] + Math.sin(t * .6 + i) * .18 + mouse.x * .35 + spin[i].extra;
        m.rotation.x = Math.sin(t * .8 + i) * .06 - mouse.y * .25;
        m.rotation.z = Math.sin(t * .5 + i) * .04;
        const h = m.userData.holo;
        h.uniforms.uTime.value = t + i * 1.7;
        h.uniforms.uTilt.value.set(m.rotation.y, m.rotation.x);
      });
      pts.rotation.y = t * .02;
      pts.material.opacity = .7 + Math.sin(t * 3) * .3;
      renderer.render(scene, camera);
    });
  }

  /* ---------- 全螢幕粒子光爆 ---------- */
  const PAL = {
    gold: [0xFFFFFF, 0xFFE680, 0xFFCE3A, 0xFFB800],
    zap: [0xFFFFFF, 0xFFF06A, 0xFFCE3A, 0x7FE3FF],
    rainbow: [0xFF5E6C, 0xFFCE3A, 0x5CC75A, 0x3BA7F0, 0xB071E0, 0xFFFFFF],
    green: [0xFFFFFF, 0xB6F5A8, 0x5CC75A, 0xFFE680]
  };
  let fx = null;
  function initFx() {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(DPR);
    const el = renderer.domElement;
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 70 });
    document.body.appendChild(el);
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
    const MAX = 600;
    const geo = new THREE.BufferGeometry();
    const P = new Float32Array(MAX * 3), C = new Float32Array(MAX * 3), S = new Float32Array(MAX), A = new Float32Array(MAX);
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(S, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(A, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { map: { value: star() }, dpr: { value: DPR } },
      vertexShader: `attribute float aSize; attribute float aAlpha; attribute vec3 color; varying vec3 vC; varying float vA;
        uniform float dpr; void main(){ vC = color; vA = aAlpha; gl_PointSize = aSize * dpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb * vA, t.a * vA); }`
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    const parts = [];
    const rings = [];
    function size() {
      renderer.setSize(innerWidth, innerHeight, false);
      cam.right = innerWidth; cam.bottom = -innerHeight; cam.updateProjectionMatrix();
    }
    addEventListener('resize', size); size();
    let running = false, last = 0;
    function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vx *= .96; p.vy = p.vy * .96 - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      const n = Math.min(parts.length, MAX);
      for (let i = 0; i < MAX; i++) {
        if (i < n) {
          const p = parts[i], k = p.life / p.max;
          P[i * 3] = p.x; P[i * 3 + 1] = -p.y; P[i * 3 + 2] = 0;
          C[i * 3] = p.c.r; C[i * 3 + 1] = p.c.g; C[i * 3 + 2] = p.c.b;
          S[i] = p.s * (.4 + k * .8) * (1 + .3 * Math.sin(now / 60 + i));
          A[i] = Math.min(1, k * 1.6);
        } else { A[i] = 0; S[i] = 0; }
      }
      ['position', 'color', 'aSize', 'aAlpha'].forEach(a => geo.attributes[a].needsUpdate = true);
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += dt;
        const k = r.t / r.d;
        if (k >= 1) { scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i, 1); continue; }
        r.m.scale.setScalar(1 + k * r.grow);
        r.m.material.opacity = (1 - k) * r.o;
      }
      renderer.render(scene, cam);
      if (parts.length || rings.length) requestAnimationFrame(loop);
      else { running = false; renderer.clear(); }
    }
    fx = {
      add(x, y, o) {
        const pal = (PAL[o.kind] || PAL.gold).map(h => new THREE.Color(h));
        const count = o.count || 50, sp = o.speed || 420;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2, v = sp * (.3 + Math.random() * .9);
          const life = .6 + Math.random() * .7;
          parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .15, g: -380, life, max: life, s: 14 + Math.random() * 30, c: pal[i % pal.length] });
        }
        /* 光環與閃光 */
        [[0.02, 1, 7, .9, .55], [0.35, 0, 2.2, .9, .35]].forEach(([inner, ringOnly, grow, op, dur]) => {
          const g = ringOnly ? new THREE.RingGeometry(16, 22, 48) : new THREE.CircleGeometry(40, 32);
          const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ringOnly ? 0xFFE680 : 0xFFFFFF, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
          m.position.set(x, -y, 0);
          scene.add(m);
          rings.push({ m, t: -inner * 0, d: dur, grow, o: op });
        });
        if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
      }
    };
  }
  function burst(x, y, o = {}) {
    if (!fx) initFx();
    fx.add(x, y, o);
  }

  return { ok: true, hero, burst };
})();

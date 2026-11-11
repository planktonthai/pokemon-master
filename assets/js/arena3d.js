/* 模擬對戰的 3D 競技場背景（Three.js）：PTCGArena.init(mode) / hit(side, color) */
const PTCGArena = (() => {
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ok = !!T;
  try { ok = ok && !!document.createElement('canvas').getContext('webgl'); } catch (e) { ok = false; }
  if (!ok) return { init() {}, hit() {}, ok: false };

  let renderer, scene, camera, flashLight, shake = 0, torches = [], embers, emberPos, emberSeed = [], visible = true, theme;
  const THEMES = {
    normal: { sky: ['#1E1428', '#4A2A2A'], fog: '#2A1A22', torch: 0xFF8A3D, ember: [2.4, 1.2, .35], floor: '#5A4A44', rim: '#C8553D' },
    boss: { sky: ['#0C0618', '#3A1450'], fog: '#1A0C26', torch: 0xB071E0, ember: [1.4, .8, 2.4], floor: '#3A2E44', rim: '#7A2AC8' }
  };

  function glowTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }

  function init(mode = 'normal') {
    theme = THEMES[mode] || THEMES.normal;
    const host = document.createElement('div'); host.id = 'arena3d'; host.setAttribute('aria-hidden', 'true');
    document.body.prepend(host);
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    scene = new T.Scene();
    scene.fog = new T.Fog(theme.fog, 18, 60);
    camera = new T.PerspectiveCamera(48, 1, .1, 200);

    /* 天空漸層 */
    const sky = new T.Mesh(new T.SphereGeometry(90, 24, 12), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { a: { value: new T.Color(theme.sky[0]) }, b: { value: new T.Color(theme.sky[1]) } },
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 a; uniform vec3 b; varying float h; void main(){ gl_FragColor = vec4(mix(b, a, smoothstep(-.1, .6, h)), 1.); }' }));
    scene.add(sky);
    scene.add(new T.HemisphereLight('#FFE8D0', '#20101A', .55));
    const key = new T.DirectionalLight('#FFE2C4', 1.2); key.position.set(-6, 14, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); scene.add(key);

    /* 圓形石桌：桌面、邊框、中央徽記 */
    const mat = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o));
    const floor = new T.Mesh(new T.CircleGeometry(40, 48), mat(theme.floor, { flatShading: false, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const base = new T.Mesh(new T.CylinderGeometry(9.5, 10.5, 2, 12), mat('#4A3E44')); base.position.y = 1; base.castShadow = base.receiveShadow = true; scene.add(base);
    const top = new T.Mesh(new T.CylinderGeometry(9, 9, .5, 48), mat('#2E5A3A', { flatShading: false, roughness: .9 })); top.position.y = 2.25; top.receiveShadow = true; scene.add(top);
    const rim = new T.Mesh(new T.TorusGeometry(9.1, .35, 8, 64), mat(theme.rim, { emissive: theme.rim, emissiveIntensity: .45 })); rim.rotation.x = Math.PI / 2; rim.position.y = 2.5; scene.add(rim);
    const line = new T.Mesh(new T.PlaneGeometry(17, .12), new T.MeshBasicMaterial({ color: '#FFF3C4', transparent: true, opacity: .55 })); line.rotation.x = -Math.PI / 2; line.position.y = 2.52; scene.add(line);
    const emblem = new T.Mesh(new T.RingGeometry(1.6, 2, 40), new T.MeshBasicMaterial({ color: '#FFCE3A', transparent: true, opacity: .7 })); emblem.rotation.x = -Math.PI / 2; emblem.position.y = 2.52; scene.add(emblem);
    /* 兩側卡位（對手藍、你橘） */
    [[-4.2, 0x3D4E8C], [4.2, 0xC8553D]].forEach(([z, c]) => {
      for (let i = -2; i <= 2; i++) { const s = new T.Mesh(new T.PlaneGeometry(1.5, 2), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .35 })); s.rotation.x = -Math.PI / 2; s.position.set(i * 2.2, 2.52, z + (z < 0 ? -1.2 : 1.2)); scene.add(s); }
      const act = new T.Mesh(new T.PlaneGeometry(2, 2.6), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .55 })); act.rotation.x = -Math.PI / 2; act.position.set(0, 2.53, z * .45); scene.add(act);
    });
    /* 火把柱 */
    const glow = glowTex();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * 15, z = Math.sin(a) * 15;
      const pillar = new T.Mesh(new T.CylinderGeometry(.55, .75, 6, 6), mat('#3A3036')); pillar.position.set(x, 3, z); pillar.castShadow = true; scene.add(pillar);
      const bowl = new T.Mesh(new T.CylinderGeometry(.9, .5, .6, 8), mat('#2A2024')); bowl.position.set(x, 6.3, z); scene.add(bowl);
      const fire = new T.Sprite(new T.SpriteMaterial({ map: glow, color: theme.torch, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); fire.position.set(x, 7, z); fire.scale.setScalar(2.6); scene.add(fire);
      const light = new T.PointLight(theme.torch, 14, 16, 1.8); light.position.set(x, 7, z); scene.add(light);
      torches.push({ fire, light, seed: Math.random() * 10 });
    }
    /* 飄浮火星 */
    const N = 160; emberPos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { emberPos[i * 3] = (Math.random() - .5) * 34; emberPos[i * 3 + 1] = Math.random() * 14; emberPos[i * 3 + 2] = (Math.random() - .5) * 34; emberSeed.push(Math.random() * 10); }
    const eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(emberPos, 3));
    embers = new T.Points(eg, new T.PointsMaterial({ map: glow, color: new T.Color(...theme.ember), size: .35, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(embers);
    /* 攻擊閃光 */
    flashLight = new T.PointLight('#FFFFFF', 0, 30, 1.5); flashLight.position.set(0, 6, 0); scene.add(flashLight);

    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); renderer.domElement.style.width = '100vw'; renderer.domElement.style.height = '100vh'; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    addEventListener('resize', resize); resize();
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
    const clock = new T.Clock();
    /* 看門狗：連續 3 格畫面間隔都超過 250 毫秒（沒有硬體加速），就停止動畫，保留靜態畫面 */
    let slow = 0, lastF = 0;
    const timed = fn => { const now = performance.now(); if (lastF) slow = now - lastF > 250 ? slow + 1 : 0; lastF = now; fn(); if (slow >= 3) { renderer.setAnimationLoop(null); window.__ptcgSlow3D = true; } };
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
      const sway = reduce ? 0 : Math.sin(t * .12) * .35;
      camera.position.set(Math.sin(sway) * 20, 15 + Math.sin(t * .2) * .4, Math.cos(sway) * 20);
      if (shake > 0) { camera.position.x += (Math.random() - .5) * shake; camera.position.y += (Math.random() - .5) * shake; shake = Math.max(0, shake - dt * 2.2); }
      camera.lookAt(0, 2, 0);
      torches.forEach(o => { const f = .85 + Math.sin(t * 9 + o.seed) * .1 + Math.random() * .08; o.light.intensity = 14 * f; o.fire.scale.setScalar(2.6 * f); });
      if (!reduce) for (let i = 0; i < emberSeed.length; i++) { emberPos[i * 3 + 1] += dt * (.6 + emberSeed[i] % 1); emberPos[i * 3] += Math.sin(t + emberSeed[i]) * dt * .3; if (emberPos[i * 3 + 1] > 15) emberPos[i * 3 + 1] = 0; }
      embers.geometry.attributes.position.needsUpdate = true;
      flashLight.intensity = Math.max(0, flashLight.intensity - dt * 160);
      emblem.rotation.z = t * .2;
      timed(() => renderer.render(scene, camera));
    });
  }
  /* 攻擊時：閃光、鏡頭震動 */
  function hit(side, color = '#FFFFFF', strength = 1) {
    if (!renderer) return;
    flashLight.color.set(color); flashLight.intensity = 90 * strength;
    flashLight.position.set(0, 5, side === 'me' ? 4 : -4);
    if (!reduce) shake = .5 * strength;
  }
  return { init, hit, ok: true };
})();

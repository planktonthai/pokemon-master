/* 夥伴小怪獸 3D 模型（原創造型）：PTCGPartners3D.make('cloud' | 'fruit' | 'snail') */
const PTCGPartners3D = (() => {
  const T = THREE;
  const mat = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: .6 }, o));
  function mesh(g, m, cast = true) { const x = new T.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; }
  const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  /* 共用：可愛的眼睛與嘴巴 */
  function eyes(parent, y, z, spread, size = .16, tilt = 0) {
    [-1, 1].forEach(s => {
      const e = mesh(new T.SphereGeometry(size, 16, 12), mat('#1F2A5C', { roughness: .15 })); e.scale.set(1, 1.25, .6);
      e.position.set(s * spread, y, z); e.rotation.y = s * tilt; parent.add(e);
      const h1 = new T.Mesh(new T.SphereGeometry(size * .32, 8, 8), new T.MeshBasicMaterial({ color: '#fff' })); h1.position.set(s * spread + size * .3, y + size * .38, z + size * .5); parent.add(h1);
      const h2 = new T.Mesh(new T.SphereGeometry(size * .15, 8, 8), new T.MeshBasicMaterial({ color: '#fff' })); h2.position.set(s * spread - size * .25, y - size * .35, z + size * .5); parent.add(h2);
    });
  }
  function smile(parent, y, z, w = .16, open = false) {
    if (open) {
      const m = mesh(new T.SphereGeometry(w, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#8A2A3A', { roughness: .5 })); m.scale.set(1, .8, .4); m.position.set(0, y, z); parent.add(m);
      const tongue = mesh(new T.SphereGeometry(w * .55, 12, 8), mat('#FF7A8A')); tongue.scale.set(1, .5, .4); tongue.position.set(0, y - w * .5, z + .02); parent.add(tongue);
    } else {
      const m = mesh(new T.TorusGeometry(w, .025, 6, 16, Math.PI), mat('#1F2A5C')); m.rotation.z = Math.PI; m.position.set(0, y, z); parent.add(m);
    }
  }
  function blush(parent, y, z, spread, color = '#FFA3B5') {
    [-1, 1].forEach(s => { const b = new T.Mesh(new T.SphereGeometry(.1, 10, 8), new T.MeshBasicMaterial({ color, transparent: true, opacity: .75 })); b.scale.set(1.3, .6, .3); b.position.set(s * spread, y, z); parent.add(b); });
  }

  /* ================= 1. 雲朵棉棉（雷） ================= */
  function makeCloud() {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const fluff = mat('#FFFDF6', { roughness: .95, emissive: '#FFF6E0', emissiveIntensity: .12 });
    const puffs = [[0, .95, 0, .85], [-.62, .82, .05, .6], [.62, .82, .05, .6], [-.35, 1.45, -.05, .55], [.38, 1.42, -.05, .55], [0, 1.6, -.2, .5], [0, .8, -.5, .65], [-.75, 1.15, -.35, .42], [.75, 1.15, -.35, .42]];
    puffs.forEach(([x, y, z, r]) => { const p = mesh(new T.SphereGeometry(r, 24, 18), fluff); p.position.set(x, y, z); body.add(p); });
    /* 淡紫色的肚子陰影 */
    const belly = mesh(new T.SphereGeometry(.75, 20, 14), mat('#E7E0FF', { roughness: .95 })); belly.scale.set(1.25, .55, 1); belly.position.set(0, .48, 0); body.add(belly);
    eyes(body, 1.08, .8, .28, .15);
    smile(body, .86, .84, .1);
    blush(body, .92, .78, .5);
    /* 小腳 */
    [[-.4, .2], [.4, .2], [-.3, -.35], [.3, -.35]].forEach(([x, z]) => { const f = mesh(new T.SphereGeometry(.16, 12, 10), mat('#D9D2F0')); f.scale.y = .7; f.position.set(x, .15, z); body.add(f); });
    /* 捲捲天線 + 閃電尖端 */
    const pts = [new T.Vector3(0, 1.9, -.1), new T.Vector3(.12, 2.3, -.05), new T.Vector3(-.1, 2.6, .05), new T.Vector3(.08, 2.85, .05)];
    const ant = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, .045, 8), mat('#5C5A7A')); body.add(ant);
    const bolt = new T.Shape(); [[0, .42], [-.18, .02], [-.02, .04], [-.12, -.36], [.2, .08], [.03, .06], [.14, .42]].forEach(([x, y], i) => i ? bolt.lineTo(x, y) : bolt.moveTo(x, y));
    const boltG = new T.ExtrudeGeometry(bolt, { depth: .08, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2 }); boltG.center();
    const tip = mesh(boltG, mat('#FFE14D', { emissive: '#FFC400', emissiveIntensity: 2.2, roughness: .3 }));
    tip.position.set(.08, 3.1, .05); tip.scale.setScalar(.9); body.add(tip);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: GLOW, color: '#FFE680', transparent: true, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(1.3); tip.add(halo);
    g.userData = { body, tip, halo, kind: 'cloud' };
    return g;
  }

  /* ================= 2. 燈籠果果（火） ================= */
  function makeFruit() {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    /* 有稜紋的果實身體 */
    const geo = new T.SphereGeometry(1, 48, 32); const p = geo.attributes.position, col = [];
    const cTop = new T.Color('#FF6A2B'), cBot = new T.Color('#FFB347');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
      const k = 1 + .045 * Math.cos(a * 8) * (1 - Math.abs(y));
      p.setXYZ(i, x * k, y * .86, z * k);
      const c = cTop.clone().lerp(cBot, (1 - y) / 2 * .9); col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const fruit = mesh(geo, new T.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, clearcoat: 1, clearcoatRoughness: .2 })); fruit.position.y = 1.05; body.add(fruit);
    eyes(body, 1.2, .82, .3, .16);
    smile(body, .9, .86, .16, true);
    blush(body, 1.0, .8, .56, '#FFD0A0');
    /* 小腳 */
    [-1, 1].forEach(s => { const f = mesh(new T.SphereGeometry(.22, 14, 10), mat('#E0552A')); f.scale.set(1, .6, 1.3); f.position.set(s * .38, .14, .15); body.add(f); });
    /* 小手 */
    [-1, 1].forEach(s => { const h = mesh(new T.SphereGeometry(.16, 12, 10), mat('#FF7A3D')); h.position.set(s * .95, .95, .25); body.add(h); });
    /* 頭頂的葉子 */
    for (let i = 0; i < 5; i++) {
      const l = mesh(new T.SphereGeometry(.28, 12, 8), mat('#4CA84A', { roughness: .6 })); l.scale.set(1, .22, .5);
      const a = i / 5 * Math.PI * 2; l.position.set(Math.cos(a) * .22, 1.92, Math.sin(a) * .22); l.rotation.y = -a; l.rotation.z = .35; body.add(l);
    }
    /* 火苗（三層發光） */
    const flame = new T.Group(); flame.position.set(0, 2.05, 0); body.add(flame);
    const layers = [['#FF4D1A', .36, 1.0, .9], ['#FF8A1E', .27, .78, 1.2], ['#FFD84A', .16, .52, 1.6]].map(([c, r, h, e]) => {
      const fg = new T.SphereGeometry(r, 16, 12); fg.translate(0, r, 0);
      const fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) { const y = fp.getY(i) / (r * 2); const s = 1 - Math.pow(Math.max(0, y - .35) / .65, 1.4) * .95; fp.setX(i, fp.getX(i) * s); fp.setZ(i, fp.getZ(i) * s); fp.setY(i, fp.getY(i) * (1 + Math.max(0, y - .4) * h * .7)); }
      fg.computeVertexNormals();
      const m = new T.Mesh(fg, new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, transparent: true, opacity: .92, roughness: .4 }));
      flame.add(m); return m;
    });
    const fl = new T.PointLight('#FF9A40', 6, 6); fl.position.y = .6; flame.add(fl);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: GLOW, color: '#FFB050', transparent: true, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(2); halo.position.y = .5; flame.add(halo);
    g.userData = { body, flame, layers, light: fl, kind: 'fruit' };
    return g;
  }

  /* ================= 3. 泡泡蝸（水） ================= */
  function makeSnail() {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const skin = mat('#4FB6EE', { roughness: .3 }), belly = mat('#CDEFFF', { roughness: .4 });
    /* 身體：前面抬起的頭 + 後面扁扁的腳 */
    const foot = mesh(new T.CapsuleGeometry(.45, 1.5, 8, 20), skin); foot.rotation.x = Math.PI / 2; foot.scale.set(1.05, 1, .55); foot.position.set(0, .3, .05); body.add(foot);
    const underside = mesh(new T.CapsuleGeometry(.44, 1.45, 6, 16), belly); underside.rotation.x = Math.PI / 2; underside.scale.set(1.08, 1, .3); underside.position.set(0, .14, .05); body.add(underside);
    const neck = mesh(new T.CapsuleGeometry(.42, .5, 8, 16), skin); neck.position.set(0, .8, 1.0); neck.rotation.x = .25; body.add(neck);
    const head = mesh(new T.SphereGeometry(.62, 28, 20), skin); head.position.set(0, 1.35, 1.12); body.add(head);
    eyes(head, .05, .53, .24, .14);
    smile(head, -.2, .58, .1);
    blush(head, -.08, .52, .42, '#FFB6D0');
    /* 眼柄觸角 */
    const stalks = [-1, 1].map(s => {
      const st = new T.Group(); st.position.set(s * .25, .5, -.05); st.rotation.z = -s * .35; head.add(st);
      const stem = mesh(new T.CylinderGeometry(.05, .07, .55, 8), skin); stem.position.y = .27; st.add(stem);
      const ball = mesh(new T.SphereGeometry(.12, 12, 10), mat('#FFFFFF', { emissive: '#9BE7FF', emissiveIntensity: 1.4 })); ball.position.y = .6; st.add(ball);
      return st;
    });
    /* 泡泡殼：透明外殼 + 裡面的漩渦海水 */
    const shell = new T.Group(); shell.position.set(0, 1.15, -.35); body.add(shell);
    const bubble = new T.Mesh(new T.SphereGeometry(.95, 40, 28), new T.MeshPhysicalMaterial({
      color: '#A8E4FF', roughness: .08, metalness: 0, transmission: .55, thickness: .6, ior: 1.3,
      iridescence: 1, iridescenceIOR: 1.4, transparent: true, opacity: .62, clearcoat: 1, envMapIntensity: 1.1
    }));
    bubble.castShadow = false; shell.add(bubble);
    const swirlPts = []; for (let i = 0; i <= 80; i++) { const k = i / 80, a = k * Math.PI * 5; const r = .7 * (1 - k * .85); swirlPts.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, (k - .5) * .25)); }
    const swirl = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(swirlPts), 160, .09, 10), mat('#1E7FE0', { emissive: '#1560C8', emissiveIntensity: 1.1, roughness: .2 }));
    swirl.rotation.y = Math.PI / 2; shell.add(swirl);
    const core = new T.Mesh(new T.SphereGeometry(.16, 16, 12), mat('#BFF3FF', { emissive: '#9BE7FF', emissiveIntensity: 2.2 })); shell.add(core);
    g.userData = { body, shell, swirl, stalks, head, kind: 'snail' };
    return g;
  }


  /* 簡單的待機動作（在世界地圖中使用） */
  function idle(g, t) {
    const u = g.userData, b = u.body;
    if (u.kind === 'cloud') { b.position.y = .35 + Math.sin(t * 1.6) * .18; u.tip.material.emissiveIntensity = 1.6 + Math.random() * .8; }
    else if (u.kind === 'fruit') { const hop = Math.abs(Math.sin(t * 3.2)); b.position.y = hop * .35; const sq = 1 - (1 - hop) * .12; b.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); u.layers.forEach((l, i) => l.scale.set(1 + Math.sin(t * 13 + i) * .1, 1 + Math.sin(t * 9 + i) * .18, 1)); }
    else { u.swirl.rotation.z = t * 1.2; u.stalks.forEach((s, i) => { s.rotation.x = Math.sin(t * 2.5 + i) * .18; }); }
  }
  return { make: k => ({ cloud: makeCloud, fruit: makeFruit, snail: makeSnail })[k](), idle };
})();

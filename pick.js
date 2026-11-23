void (function D2_PULL_WITH_CHEST() {
  if (window.__D2_PULL_LOADED) return;
  window.__D2_PULL_LOADED = true;

  const AUTO_KEY = 'd2ed:endPull';
  const POS_KEY = 'd2ed:吞天Pos';
  const state = { world: null, auto: true };
  try {
    state.auto = localStorage.getItem(AUTO_KEY) !== '0';
  } catch (_) {}

  // 透過 WeakMap 攔截遊戲世界實例
  const rawGet = WeakMap.prototype.get;
  WeakMap.prototype.get = function (key) {
    const v = rawGet.call(this, key);
    if (key && typeof key === 'object' && Array.isArray(key.pickups) && key.player) {
      state.world = key;
    }
    return v;
  };

  // 將地上裝備 (item) 與未開啟寶箱 (chest) 拉到角色腳邊
  function pullItemsAndChests() {
    const w = state.world || window.__foundWorld;
    if (!w?.pickups || !w?.player) return { items: 0, chests: 0 };

    let items = 0;
    let chests = 0;
    for (const p of w.pickups) {
      if (!p || p.dead) continue;
      if (p.kind === 'item') {
        p.x = w.player.x + (Math.random() - 0.5) * 16;
        p.y = w.player.y + (Math.random() - 0.5) * 16;
        items++;
      } else if (p.kind === 'chest') {
        p.x = w.player.x + (Math.random() - 0.5) * 20;
        p.y = w.player.y + (Math.random() - 0.5) * 20;
        chests++;
      }
    }
    return { items, chests };
  }

  // 每秒自動吸取（遊戲進行中且自動開關為開啟時）
  setInterval(() => {
    if (!state.auto || document.body.classList.contains('no-run')) return;
    pullItemsAndChests();
  }, 1000);

  // 建立右上角可拖動「吞天」按鈕（縮小約 30%，支援滑鼠與手機觸控拖曳）
  const btn = document.createElement('button');
  btn.id = 'd2-pull-test-btn';
  btn.type = 'button';
  btn.style.cssText = [
    'position:fixed', 'top:12px', 'right:132px', 'left:auto', 'z-index:2147483646',
    'height:24px', 'padding:0 8px',
    'background:linear-gradient(180deg,#3a2e1c,#1a140c)',
    'border:1px solid #8f743e', 'border-radius:4px',
    'color:#e8dcc0', 'text-shadow:1px 1px 0 #000,-1px 0 #000,0 -1px #000',
    'box-shadow:0 3px 8px rgba(0,0,0,.55)',
    'cursor:grab', 'font:bold 10px "Microsoft JhengHei UI",sans-serif',
    'letter-spacing:0.5px', 'white-space:nowrap',
    'touch-action:none', 'user-select:none', '-webkit-user-select:none'
  ].join(';');

  function applySavedPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return;
      const pos = JSON.parse(raw);
      if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
        const maxLeft = Math.max(0, window.innerWidth - btn.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - btn.offsetHeight);
        btn.style.left = `${Math.min(maxLeft, Math.max(0, pos.left))}px`;
        btn.style.top = `${Math.min(maxTop, Math.max(0, pos.top))}px`;
        btn.style.right = 'auto';
      }
    } catch (_) {}
  }

  function savePos() {
    const rect = btn.getBoundingClientRect();
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
    } catch (_) {}
  }

  const updateLabel = () => {
    btn.textContent = `吞天 (自動:${state.auto ? '開' : '關'})`;
    applySavedPos();
  };
  updateLabel();
  requestAnimationFrame(applySavedPos);
  window.addEventListener('resize', applySavedPos);

  let dragState = null;
  let suppressClick = false;

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    btn.style.left = `${rect.left}px`;
    btn.style.top = `${rect.top}px`;
    btn.style.right = 'auto';
    btn.style.cursor = 'grabbing';
    dragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      moved: false
    };
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
  }, true);

  btn.addEventListener('pointermove', (e) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) > 4) {
      dragState.moved = true;
    }
    if (dragState.moved) {
      const maxLeft = Math.max(0, window.innerWidth - btn.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - btn.offsetHeight);
      const nextLeft = Math.min(maxLeft, Math.max(0, dragState.originLeft + dx));
      const nextTop = Math.min(maxTop, Math.max(0, dragState.originTop + dy));
      btn.style.left = `${nextLeft}px`;
      btn.style.top = `${nextTop}px`;
    }
  }, true);

  const finishDrag = (e) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    btn.style.cursor = 'grab';
    if (dragState.moved) {
      suppressClick = true;
      savePos();
      setTimeout(() => { suppressClick = false; }, 60);
    }
    try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
    dragState = null;
  };

  btn.addEventListener('pointerup', finishDrag, true);
  btn.addEventListener('pointercancel', finishDrag, true);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (suppressClick) return;
    const { items, chests } = pullItemsAndChests();
    const total = items + chests;
    btn.textContent = total ? `吞天 ${items}物/${chests}箱` : '吞天 (無)';
    setTimeout(updateLabel, 1000);
  });

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (suppressClick) return;
    state.auto = !state.auto;
    try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (_) {}
    updateLabel();
  });

  for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend']) {
    window.addEventListener(type, (e) => {
      if (e.target === btn) e.stopImmediatePropagation();
    }, true);
  }

  document.body.appendChild(btn);
  window.__D2_PULL_TEST = { state, pullItemsAndChests };
})();

void (function D2MOD_SHINRA_DUAL() {
  if (window.__D2MOD_SHINRA_LOADED) return;
  window.__D2MOD_SHINRA_LOADED = true;

  const VER = 'V1';
  const NAME = '神羅天征';
  const DIST = 200;
  const ANGLE = 0;
  const GAP = 4;

  const AUTO_KEY = 'd2ed:神羅天征Auto';
  const POS_KEY = 'd2ed:神羅天征Pos';

  const host = window.__D2ED || null;
  const hasHostMod = !!(host && host.mod);

  const state = {
    world: null,
    auto: false,
    anchor: null
  };

  try { state.auto = localStorage.getItem(AUTO_KEY) === '1'; } catch (_) {}

  if (!hasHostMod) {
    const rawGet = WeakMap.prototype.get;
    WeakMap.prototype.get = function (key) {
      const v = rawGet.call(this, key);
      if (key && typeof key === 'object' && Array.isArray(key.enemies) && key.player) state.world = key;
      return v;
    };
  }

  function inRun() {
    if (typeof d2edInRun === 'function') return d2edInRun();
    const w = getWorld();
    return !!w?.player && !document.body.classList.contains('no-run');
  }

  function getWorld() {
    const w = state.world || host?.world || window.__foundWorld;
    return w?.enemies && w?.player ? w : null;
  }

  function setAnchor(dist = DIST, angle = ANGLE) {
    const w = getWorld();
    if (!w?.player) return null;
    state.anchor = {
      x: w.player.x + Math.cos(angle) * dist,
      y: w.player.y + Math.sin(angle) * dist
    };
    if (typeof d2edSyncLinkedState === 'function') d2edSyncLinkedState();
    return state.anchor;
  }

  function pullEnemies(dist = DIST, angle = ANGLE, forceNewAnchor = false) {
    const w = getWorld();
    if (!w) return { pulled: 0, ready: false, lockedNow: false, anchor: state.anchor };

    let lockedNow = false;
    let cur = state.anchor;
    if (forceNewAnchor) {
      cur = setAnchor(dist, angle);
      lockedNow = !!cur;
    } else if (!cur) {
      cur = setAnchor(dist, angle);
      lockedNow = !!cur;
    }
    if (!cur) return { pulled: 0, ready: false, lockedNow: false, anchor: null };

    let pulled = 0;
    for (const e of w.enemies) {
      if (!e || typeof e.x !== 'number' || typeof e.y !== 'number') continue;
      if (e.dead || (typeof e.hp === 'number' && e.hp <= 0)) continue;
      e.x = cur.x;
      e.y = cur.y;
      pulled++;
    }
    return { pulled, ready: true, lockedNow, anchor: cur };
  }

  function notify(msg) {
    if (typeof d2edToast === 'function') d2edToast(msg);
    else console.log('[神羅天征]', msg);
  }

  setInterval(() => {
    if (state.auto && inRun()) pullEnemies(DIST, ANGLE, false);
  }, 1000);

  function renderHostSection() {
    const on = state.auto;
    const toggle = () => {
      state.auto = !on;
      try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (e) { alert('無法儲存設定：' + e); return; }
      if (typeof d2edRender === 'function') d2edRender();
      notify(state.auto ? '自動神羅天征已開啟' : '自動神羅天征已關閉');
    };
    const reAnchorPull = () => {
      const res = pullEnemies(DIST, ANGLE, true);
      if (typeof d2edRender === 'function') d2edRender();
      notify(!res.ready ? '尚未抓到怪物或角色資料' : `已定點（右200）並吸取 ${res.pulled} 隻怪`);
    };
    const pullNow = () => {
      const res = pullEnemies(DIST, ANGLE, false);
      if (typeof d2edRender === 'function') d2edRender();
      notify(!res.ready ? '尚未抓到怪物或角色資料' : res.pulled ? `神羅天征已吸取 ${res.pulled} 隻怪` : '目前沒有可吸取的怪物');
    };
    const anchorInfo = state.anchor
      ? `已鎖定座標 (${state.anchor.x.toFixed(0)}, ${state.anchor.y.toFixed(0)})`
      : '尚未鎖定座標（首次吸怪將自動記住目前角色右邊 200）';

    return d2edEl('section', { class: 'd2ed-sec' },
      d2edEl('h3', {}, `神羅天征（${VER} 鎖定座標吸怪）`),
      d2edEl('p', { class: 'd2ed-note' }, `${anchorInfo}。人物走動時怪物仍吸往已鎖定座標；點「定點」可重新記住目前角色右邊 ${DIST} 距離的位置並吸怪。`),
      d2edEl('div', { class: 'd2ed-row' },
        d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉自動神羅天征' : '開啟自動神羅天征'),
        d2edEl('button', { type: 'button', onclick: reAnchorPull }, '定點並吸怪'),
        d2edEl('button', { type: 'button', onclick: pullNow }, '立即吸怪'),
        d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, `自動：${on ? '開' : '關'}`)));
  }

  if (hasHostMod) {
    host.mod.registerSection(renderHostSection);
    host.mod.setAnchorHandler(() => pullEnemies(DIST, ANGLE, true));
    host.mod.setAnchorStateGetter(() => !!state.anchor);
  } else {
    const baseStyle = 'position:fixed;top:42px;right:12px;left:auto;z-index:2147483646;height:24px;padding:0 8px;background:linear-gradient(180deg,#3a2e1c,#1a140c);border:1px solid #8f743e;border-radius:4px;color:#e8dcc0;text-shadow:1px 1px 0 #000,-1px 0 #000,0 -1px #000;box-shadow:0 3px 8px rgba(0,0,0,.55);cursor:grab;font:bold 10px "Microsoft JhengHei UI",sans-serif;letter-spacing:0.5px;white-space:nowrap;touch-action:none;user-select:none;-webkit-user-select:none';
    const anchorBtn = document.createElement('button');
    anchorBtn.id = 'd2-shinra-anchor-btn';
    anchorBtn.type = 'button';
    anchorBtn.textContent = '定點';
    anchorBtn.style.cssText = baseStyle + ';padding:0 6px;border-color:#c7a45f;color:#f3e3b0';

    const btn = document.createElement('button');
    btn.id = 'd2-shinra-tensei-btn';
    btn.type = 'button';
    btn.style.cssText = baseStyle;

    let tempText = '', tempTimer = null, anchorTempText = '', anchorTempTimer = null;

    const syncPairPositions = () => {
      const bRect = btn.getBoundingClientRect(), aRect = anchorBtn.getBoundingClientRect();
      const bw = bRect.width || 96, bh = bRect.height || 24, aw = aRect.width || 30, ah = aRect.height || 24;
      let bLeft = parseFloat(btn.style.left), bTop = parseFloat(btn.style.top);
      if (!Number.isFinite(bLeft) || !Number.isFinite(bTop)) { bLeft = window.innerWidth - bw - 12; bTop = 42; }
      const minBLeft = aw + GAP;
      bLeft = Math.min(Math.max(minBLeft, window.innerWidth - bw), Math.max(minBLeft, bLeft));
      bTop = Math.min(Math.max(0, window.innerHeight - Math.max(bh, ah)), Math.max(0, bTop));
      btn.style.left = `${bLeft}px`; btn.style.top = `${bTop}px`; btn.style.right = 'auto';
      anchorBtn.style.left = `${Math.max(0, bLeft - aw - GAP)}px`; anchorBtn.style.top = `${bTop}px`; anchorBtn.style.right = 'auto';
    };

    const updateLabel = () => {
      btn.textContent = tempText || `${NAME}[${state.anchor ? '鎖' : '未鎖'}] (自動:${state.auto ? '開' : '關'})`;
      anchorBtn.textContent = anchorTempText || '定點';
      syncPairPositions();
    };

    const applySavedPos = () => {
      try {
        const pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
        if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
          btn.style.left = `${pos.left}px`; btn.style.top = `${pos.top}px`; btn.style.right = 'auto';
        }
      } catch (_) {}
      syncPairPositions();
    };

    let dragState = null, suppressClick = false;
    btn.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      e.preventDefault(); e.stopPropagation();
      syncPairPositions();
      const rect = btn.getBoundingClientRect();
      btn.style.cursor = 'grabbing';
      dragState = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originLeft: rect.left, originTop: rect.top, moved: false };
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    }, true);

    btn.addEventListener('pointermove', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      e.preventDefault(); e.stopPropagation();
      const dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(dx, dy) > 4) dragState.moved = true;
      if (dragState.moved) {
        btn.style.left = `${dragState.originLeft + dx}px`; btn.style.top = `${dragState.originTop + dy}`; btn.style.right = 'auto';
        syncPairPositions();
      }
    }, true);

    const finishDrag = (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      e.preventDefault(); e.stopPropagation();
      btn.style.cursor = 'grab';
      if (dragState.moved) {
        suppressClick = true; syncPairPositions();
        const rect = btn.getBoundingClientRect();
        try { localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top })); } catch (_) {}
        setTimeout(() => { suppressClick = false; }, 60);
      }
      try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
      dragState = null;
    };
    btn.addEventListener('pointerup', finishDrag, true);
    btn.addEventListener('pointercancel', finishDrag, true);

    anchorBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const res = pullEnemies(DIST, ANGLE, true);
      anchorTempText = !res.ready ? '未抓到' : `定點(${res.pulled})`;
      updateLabel();
      clearTimeout(anchorTempTimer);
      anchorTempTimer = setTimeout(() => { anchorTempText = ''; updateLabel(); }, 1000);
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (suppressClick) return;
      const res = pullEnemies(DIST, ANGLE, false);
      tempText = !res.ready ? `${NAME} (未抓到)` : res.lockedNow ? `${NAME} 已鎖定 ${res.pulled}怪` : res.pulled ? `${NAME} 吸 ${res.pulled}怪` : `${NAME} (無怪)`;
      updateLabel();
      clearTimeout(tempTimer);
      tempTimer = setTimeout(() => { tempText = ''; updateLabel(); }, 1000);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (suppressClick) return;
      state.auto = !state.auto;
      try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (_) {}
      tempText = '';
      updateLabel();
    });

    for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend']) {
      window.addEventListener(type, (e) => {
        if (e.target === btn || e.target === anchorBtn) e.stopImmediatePropagation();
      }, true);
    }

    document.body.append(anchorBtn, btn);
    updateLabel();
    requestAnimationFrame(applySavedPos);
    window.addEventListener('resize', syncPairPositions);
  }

  window.__D2MOD_SHINRA = { version: VER, dist: DIST, angle: ANGLE, setAnchor, pull: pullEnemies, state };
})();

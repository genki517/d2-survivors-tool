void (function D2_PULL_BLUE_V3() {
  if (window.__D2_PULL_LOADED) return;
  window.__D2_PULL_LOADED = true;

  const AUTO_KEY = 'd2ed:endPull';
  const BLUE_AUTO_KEY = 'd2pull:autoCleanBlue';
  const POS_KEY = 'd2ed:吞天Pos';
  const SAVE_KEY = 'd2-survivors/save/v1';

  const state = {
    world: null,
    game: null,
    auto: true,
    cleanBlue: false,
    protectedIds: new Set(),
    cleanedCount: 0,
    goldAdded: 0,
    lastProbe: ''
  };

  try { state.auto = localStorage.getItem(AUTO_KEY) !== '0'; } catch (_) {}
  try { state.cleanBlue = localStorage.getItem(BLUE_AUTO_KEY) === '1'; } catch (_) {}

  const rawGet = WeakMap.prototype.get;
  WeakMap.prototype.get = function (key) {
    const v = rawGet.call(this, key);
    if (key && typeof key === 'object') {
      if (Array.isArray(key.pickups) && key.player) {
        state.world = key;
      }
      if (key.save && key.kit && typeof key.kit.id === 'string') {
        state.game = key;
      }
    }
    return v;
  };

  function getWorld() {
    return state.world || window.__foundWorld || null;
  }

  function readLocalSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeLocalSave(saveObj) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
      return true;
    } catch (_) {
      return false;
    }
  }

  // 探測背包陣列與職業 ID 來源（依序檢查記憶體 game、world 關聯物件、以及 localStorage）
  function resolveInventoryContext() {
    const w = getWorld();
    const g = state.game || (w && w.game) || null;

    // 1. 優先從記憶體 game.save.inventoryByClass 找
    if (g && g.save && g.save.inventoryByClass && g.kit && g.kit.id) {
      const kitId = g.kit.id;
      const arr = g.save.inventoryByClass[kitId];
      if (Array.isArray(arr)) {
        return { source: 'game.save', save: g.save, kitId, inv: arr, game: g };
      }
    }

    // 2. 檢查 world 上是否直接掛載 save / inventory / items
    if (w) {
      if (w.save && w.save.inventoryByClass) {
        const kitId = (w.player && (w.player.cls || (w.player.kit && w.player.kit.id))) || Object.keys(w.save.inventoryByClass)[0];
        if (kitId && Array.isArray(w.save.inventoryByClass[kitId])) {
          return { source: 'world.save', save: w.save, kitId, inv: w.save.inventoryByClass[kitId], game: g };
        }
      }
      for (const cand of [w.inventory, w.items, w.player && w.player.inventory, w.player && w.player.items]) {
        if (Array.isArray(cand)) {
          const kitId = (w.player && w.player.cls) || 'default';
          return { source: 'world.arr', save: readLocalSave(), kitId, inv: cand, game: g };
        }
      }
    }

    // 3. 退回讀取 localStorage 存檔
    const lsSave = readLocalSave();
    if (lsSave && lsSave.inventoryByClass && typeof lsSave.inventoryByClass === 'object') {
      const clsGuess = (w && w.player && (w.player.cls || (w.player.kit && w.player.kit.id)))
        || lsSave.lastClass
        || lsSave.activeClass
        || Object.keys(lsSave.inventoryByClass)[0];
      if (clsGuess && Array.isArray(lsSave.inventoryByClass[clsGuess])) {
        return { source: 'localStorage', save: lsSave, kitId: clsGuess, inv: lsSave.inventoryByClass[clsGuess], game: g };
      }
    }

    return null;
  }

  function snapshotInventory() {
    state.protectedIds.clear();
    const ctx = resolveInventoryContext();
    if (!ctx) return { ok: false, count: 0 };
    for (const it of ctx.inv) {
      if (it && it.id) state.protectedIds.add(it.id);
    }
    return { ok: true, count: state.protectedIds.size, source: ctx.source, totalLen: ctx.inv.length };
  }

  if (state.cleanBlue) {
    setTimeout(snapshotInventory, 700);
  }

  function calcBlueSellGold(item, save) {
    const lvl = Math.max(1, Number(item.level) || 1);
    const sellRank = (save && save.ranks && Number(save.ranks.sellPrice)) || 0;
    const baseGold = Math.max(5, Math.round(lvl * 12));
    return Math.round(baseGold * (1 + sellRank * 0.1));
  }

  function pullItemsAndChests() {
    const w = getWorld();
    if (!w?.pickups || !w?.player) return { items: 0, chests: 0 };
    let items = 0, chests = 0;
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

  function cleanBlueItems(respectWhitelist = true) {
    const ctx = resolveInventoryContext();
    if (!ctx) {
      state.lastProbe = '找不到背包陣列';
      return { sold: 0, gold: 0, ready: false };
    }

    const { source, save, kitId, inv, game } = ctx;
    let sold = 0;
    let gold = 0;
    const raritiesSeen = [];

    const runClean = () => {
      for (let i = inv.length - 1; i >= 0; i--) {
        const it = inv[i];
        if (!it || typeof it !== 'object') continue;
        if (it.rarity) raritiesSeen.push(it.rarity);
        if (it.rarity !== 'magic') continue;
        if (it.type === 'quest' || it.type === 'essence') continue;
        if (respectWhitelist && it.id && state.protectedIds.has(it.id)) continue;

        gold += calcBlueSellGold(it, save);
        inv.splice(i, 1);
        sold++;
      }

      if (sold > 0) {
        const lsSave = readLocalSave();
        const targetSave = save || lsSave;
        if (targetSave) {
          targetSave.gold = (Number(targetSave.gold) || 0) + gold;
          if (source === 'localStorage' && targetSave.inventoryByClass && Array.isArray(targetSave.inventoryByClass[kitId])) {
            // inv 已經是 targetSave.inventoryByClass[kitId] 的同一個陣列參考
          }
          writeLocalSave(targetSave);
        }
        if (lsSave && lsSave !== targetSave) {
          lsSave.gold = (Number(lsSave.gold) || 0) + gold;
          if (lsSave.inventoryByClass && Array.isArray(lsSave.inventoryByClass[kitId])) {
            const idsInInv = new Set(inv.map(x => x && x.id).filter(Boolean));
            lsSave.inventoryByClass[kitId] = lsSave.inventoryByClass[kitId].filter(x => {
              if (!x || x.rarity !== 'magic') return true;
              if (respectWhitelist && x.id && state.protectedIds.has(x.id)) return true;
              return idsInInv.has(x.id);
            });
          }
          writeLocalSave(lsSave);
        }
        const w = getWorld();
        if (w && w.player && typeof w.player.gold === 'number') {
          w.player.gold += gold;
        }
      }
    };

    if (game && typeof game.changeGear === 'function' && source === 'game.save') {
      game.changeGear(kitId, runClean);
    } else {
      runClean();
    }

    state.lastProbe = `${source}:${kitId} 格數=${inv.length} 品級=[${[...new Set(raritiesSeen)].join(',')}]`;
    state.cleanedCount += sold;
    state.goldAdded += gold;
    return { sold, gold, ready: true };
  }

  const wrap = document.createElement('div');
  wrap.id = 'd2-pull-wrap';
  wrap.style.cssText = [
    'position:fixed', 'top:12px', 'right:132px', 'left:auto', 'z-index:2147483646',
    'display:flex', 'align-items:center', 'gap:4px',
    'touch-action:none', 'user-select:none', '-webkit-user-select:none'
  ].join(';');

  const btn = document.createElement('button');
  btn.id = 'd2-pull-test-btn';
  btn.type = 'button';
  btn.style.cssText = [
    'height:24px', 'padding:0 8px',
    'background:linear-gradient(180deg,#3a2e1c,#1a140c)',
    'border:1px solid #8f743e', 'border-radius:4px',
    'color:#e8dcc0', 'text-shadow:1px 1px 0 #000,-1px 0 #000,0 -1px #000',
    'box-shadow:0 3px 8px rgba(0,0,0,.55)',
    'cursor:grab', 'font:bold 10px "Microsoft JhengHei UI",sans-serif',
    'letter-spacing:0.5px', 'white-space:nowrap'
  ].join(';');

  const blueBtn = document.createElement('button');
  blueBtn.id = 'd2-pull-blue-btn';
  blueBtn.type = 'button';
  blueBtn.title = '左鍵：切換自動清藍裝（保護原有藍裝）｜右鍵：立即清現有藍裝（含白名單）';
  blueBtn.style.cssText = [
    'height:20px', 'padding:0 6px',
    'background:#1c2536', 'border:1px solid #4e6399', 'border-radius:4px',
    'color:#8f9cff', 'text-shadow:1px 1px 0 #000',
    'box-shadow:0 2px 6px rgba(0,0,0,.45)',
    'cursor:pointer', 'font:bold 10px "Microsoft JhengHei UI",sans-serif',
    'white-space:nowrap'
  ].join(';');

  const resetBtn = document.createElement('button');
  resetBtn.id = 'd2-pull-blue-reset-btn';
  resetBtn.type = 'button';
  resetBtn.textContent = '↺';
  resetBtn.title = '歸零清藍累計數量與金幣統計';
  resetBtn.style.cssText = [
    'height:20px', 'padding:0 5px',
    'background:#231b14', 'border:1px solid #6e5832', 'border-radius:4px',
    'color:#d8c69e', 'text-shadow:1px 1px 0 #000',
    'box-shadow:0 2px 6px rgba(0,0,0,.45)',
    'cursor:pointer', 'font:bold 10px "Microsoft JhengHei UI",sans-serif',
    'line-height:1', 'white-space:nowrap'
  ].join(';');

  let tempMsg = '';
  let tempTimer = null;

  function setTempText(msg, ms = 1300) {
    tempMsg = msg;
    clearTimeout(tempTimer);
    renderLabels();
    tempTimer = setTimeout(() => {
      tempMsg = '';
      renderLabels();
    }, ms);
  }

  function applySavedPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return;
      const pos = JSON.parse(raw);
      if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
        const maxLeft = Math.max(0, window.innerWidth - wrap.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - wrap.offsetHeight);
        wrap.style.left = `${Math.min(maxLeft, Math.max(0, pos.left))}px`;
        wrap.style.top = `${Math.min(maxTop, Math.max(0, pos.top))}px`;
        wrap.style.right = 'auto';
      }
    } catch (_) {}
  }

  function savePos() {
    const rect = wrap.getBoundingClientRect();
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
    } catch (_) {}
  }

  function renderLabels() {
    btn.textContent = tempMsg || `吞天 (自動:${state.auto ? '開' : '關'})`;
    blueBtn.textContent = state.cleanBlue ? `清藍:開(${state.cleanedCount})` : '清藍:關';
    blueBtn.style.background = state.cleanBlue ? '#3b528c' : '#1c2536';
    blueBtn.style.color = state.cleanBlue ? '#ffffff' : '#8f9cff';
    blueBtn.style.borderColor = state.cleanBlue ? '#7da0f5' : '#4e6399';
    applySavedPos();
  }

  renderLabels();
  requestAnimationFrame(applySavedPos);
  window.addEventListener('resize', applySavedPos);

  let dragState = null;
  let suppressClick = false;

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = wrap.getBoundingClientRect();
    wrap.style.left = `${rect.left}px`;
    wrap.style.top = `${rect.top}px`;
    wrap.style.right = 'auto';
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
      const maxLeft = Math.max(0, window.innerWidth - wrap.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - wrap.offsetHeight);
      const nextLeft = Math.min(maxLeft, Math.max(0, dragState.originLeft + dx));
      const nextTop = Math.min(maxTop, Math.max(0, dragState.originTop + dy));
      wrap.style.left = `${nextLeft}px`;
      wrap.style.top = `${nextTop}px`;
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
    setTempText(total ? `吞天 ${items}物/${chests}箱` : '吞天 (無)');
  });

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (suppressClick) return;
    state.auto = !state.auto;
    try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (_) {}
    renderLabels();
  });

  blueBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.cleanBlue = !state.cleanBlue;
    try { localStorage.setItem(BLUE_AUTO_KEY, state.cleanBlue ? '1' : '0'); } catch (_) {}
    if (state.cleanBlue) {
      const snap = snapshotInventory();
      setTempText(snap.ok ? `護${snap.count}物 清藍開` : '清藍開(未抓到背包)');
    } else {
      state.protectedIds.clear();
      setTempText('清藍關');
    }
  });

  // 點擊「↺」小按鈕：手動歸零清藍累計數量
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.cleanedCount = 0;
    state.goldAdded = 0;
    setTempText('清藍已歸零', 1000);
  });

  // 右鍵點「清藍」小按鈕：立即清除目前包包裡所有藍裝（含白名單）方便測試
  blueBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const r = cleanBlueItems(false);
    if (!r.ready) {
      setTempText('未抓到背包');
    } else if (r.sold > 0) {
      setTempText(`清${r.sold}藍 +${r.gold}金`, 1400);
    } else {
      setTempText('包內無藍裝', 1100);
    }
  });

  setInterval(() => {
    if (document.body.classList.contains('no-run')) return;
    if (state.auto) pullItemsAndChests();
    if (state.cleanBlue) {
      const r = cleanBlueItems(true);
      if (r.sold > 0) {
        setTempText(`清${r.sold}藍 +${r.gold}金`, 1300);
      }
    }
  }, 1000);

  for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend']) {
    window.addEventListener(type, (e) => {
      if (e.target === btn || e.target === blueBtn || e.target === resetBtn || e.target === wrap) {
        e.stopImmediatePropagation();
      }
    }, true);
  }

  wrap.append(btn, blueBtn, resetBtn);
  document.body.appendChild(wrap);
  window.__D2_PULL_TEST = { state, pullItemsAndChests, cleanBlueItems, snapshotInventory, resolveInventoryContext, resetBlueCount: () => { state.cleanedCount = 0; state.goldAdded = 0; renderLabels(); } };
})();

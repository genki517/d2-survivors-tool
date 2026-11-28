void (function D2MOD_ENDPULL_DUAL() {
  if (window.__D2MOD_ENDPULL_LOADED) return;
  window.__D2MOD_ENDPULL_LOADED = true;

  const AUTO_KEY = 'd2ed:endPull';
  const BLUE_AUTO_KEY = 'd2ed:autoCleanBlue';
  const LEGACY_BLUE_KEY = 'd2pull:autoCleanBlue';
  const POS_KEY = 'd2ed:吞天Pos';
  const SAVE_KEY = 'd2-survivors/save/v1';

  const PROTECT_TYPES = new Set([
    'quest', 'essence',
    'charm', 'smallcharm', 'largecharm', 'grandcharm',
    'jewel', 'jewels'
  ]);
  const PROTECT_BASES = new Set(['cm1', 'cm2', 'cm3', 'charm', 'jew', 'jewel']);

  const host = window.__D2ED || null;
  const hasHostMod = !!(host && host.mod);

  const makeEl = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const k of kids) if (k != null) e.append(k);
    return e;
  };
  const hEl = (typeof host?.el === 'function') ? host.el : makeEl;
  const hRender = (typeof host?.render === 'function') ? host.render : null;
  const hToast = (typeof host?.toast === 'function') ? host.toast : null;
  const hInRun = (typeof host?.inRun === 'function') ? host.inRun : null;
  const hReadSave = (typeof host?.readSave === 'function') ? host.readSave : null;

  const state = {
    world: null,
    game: null,
    auto: true,
    cleanBlue: false,
    protectedIds: new Set(),
    cleanedCount: 0,
    goldAdded: 0
  };

  try { state.auto = localStorage.getItem(AUTO_KEY) !== '0'; } catch (_) {}
  try {
    const v = localStorage.getItem(BLUE_AUTO_KEY);
    state.cleanBlue = v !== null ? v === '1' : localStorage.getItem(LEGACY_BLUE_KEY) === '1';
  } catch (_) {}

  if (!hasHostMod) {
    const rawGet = WeakMap.prototype.get;
    WeakMap.prototype.get = function (key) {
      const v = rawGet.call(this, key);
      if (key && typeof key === 'object') {
        if (Array.isArray(key.pickups) && key.player) state.world = key;
        if (key.save && key.kit && typeof key.kit.id === 'string') state.game = key;
      }
      return v;
    };
  }

  function inRun() {
    if (hInRun) return hInRun();
    const w = getWorld();
    return !!w?.player && !document.body.classList.contains('no-run');
  }

  function getWorld() {
    return state.world || host?.world || window.__foundWorld || null;
  }

  function readSave() {
    if (hReadSave) return hReadSave();
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (_) { return {}; }
  }

  function writeSave(obj) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); return true; } catch (_) { return false; }
  }

  function resolveInvCtx() {
    const w = getWorld();
    const g = state.game || host?.forge?.game?.game || (w && w.game) || null;
    if (g && g.save && g.save.inventoryByClass && g.kit && g.kit.id) {
      const kitId = g.kit.id;
      if (Array.isArray(g.save.inventoryByClass[kitId])) {
        return { source: 'game.save', save: g.save, kitId, inv: g.save.inventoryByClass[kitId], game: g };
      }
    }
    if (w && w.save && w.save.inventoryByClass) {
      const kitId = (w.player && (w.player.cls || w.player.kit?.id)) || Object.keys(w.save.inventoryByClass)[0];
      if (kitId && Array.isArray(w.save.inventoryByClass[kitId])) {
        return { source: 'world.save', save: w.save, kitId, inv: w.save.inventoryByClass[kitId], game: g };
      }
    }
    const lsSave = readSave();
    if (lsSave && lsSave.inventoryByClass && typeof lsSave.inventoryByClass === 'object') {
      const clsGuess = host?.player?.cls || (w?.player && (w.player.cls || w.player.kit?.id)) || lsSave.lastClass || lsSave.activeClass || Object.keys(lsSave.inventoryByClass)[0];
      if (clsGuess && Array.isArray(lsSave.inventoryByClass[clsGuess])) {
        return { source: 'localStorage', save: lsSave, kitId: clsGuess, inv: lsSave.inventoryByClass[clsGuess], game: g };
      }
    }
    return null;
  }

  function snapshotBlue() {
    state.protectedIds.clear();
    const ctx = resolveInvCtx();
    if (!ctx) return 0;
    for (const it of ctx.inv) {
      if (it && it.id) state.protectedIds.add(it.id);
    }
    return state.protectedIds.size;
  }

  function isProtected(it) {
    if (!it || typeof it !== 'object') return false;
    const t = String(it.type || '').trim().toLowerCase();
    const b = String(it.base || '').trim().toLowerCase();
    const n = String(it.name || '').trim().toLowerCase();
    return PROTECT_TYPES.has(t) || PROTECT_BASES.has(b)
      || t.includes('charm') || t.includes('jewel') || it.type === '符咒' || it.type === '珠寶'
      || b.includes('charm') || b.includes('jewel') || it.base === '符咒' || it.base === '珠寶'
      || n.includes('charm') || n.includes('jewel') || it.name.includes('符咒') || it.name.includes('珠寶');
  }

  function calcGold(item, save) {
    const lvl = Math.max(1, Number(item.level) || 1);
    const sellRank = (save && save.ranks && Number(save.ranks.sellPrice)) || 0;
    return Math.round(Math.max(5, Math.round(lvl * 12)) * (1 + sellRank * 0.1));
  }

  function cleanBlue(respectWhitelist = true) {
    const ctx = resolveInvCtx();
    if (!ctx) return { sold: 0, gold: 0, ready: false };
    const { source, save, kitId, inv, game } = ctx;
    let sold = 0;
    let gold = 0;
    const runClean = () => {
      for (let i = inv.length - 1; i >= 0; i--) {
        const it = inv[i];
        if (!it || typeof it !== 'object' || it.rarity !== 'magic' || isProtected(it)) continue;
        if (respectWhitelist && it.id && state.protectedIds.has(it.id)) continue;
        gold += calcGold(it, save);
        inv.splice(i, 1);
        sold++;
      }
      if (sold > 0) {
        const lsSave = readSave();
        const targetSave = save || lsSave;
        if (targetSave && typeof targetSave === 'object') {
          targetSave.gold = (Number(targetSave.gold) || 0) + gold;
          writeSave(targetSave);
        }
        if (lsSave && lsSave !== targetSave && typeof lsSave === 'object') {
          lsSave.gold = (Number(lsSave.gold) || 0) + gold;
          if (lsSave.inventoryByClass && Array.isArray(lsSave.inventoryByClass[kitId])) {
            const ids = new Set(inv.map(x => x && x.id).filter(Boolean));
            lsSave.inventoryByClass[kitId] = lsSave.inventoryByClass[kitId].filter(x => {
              if (!x || x.rarity !== 'magic' || isProtected(x)) return true;
              if (respectWhitelist && x.id && state.protectedIds.has(x.id)) return true;
              return ids.has(x.id);
            });
          }
          writeSave(lsSave);
        }
        const w = getWorld();
        if (w?.player && typeof w.player.gold === 'number') w.player.gold += gold;
      }
    };
    if (game && typeof game.changeGear === 'function' && source === 'game.save') game.changeGear(kitId, runClean);
    else runClean();
    state.cleanedCount += sold;
    state.goldAdded += gold;
    return { sold, gold, ready: true };
  }

  function pullNow() {
    const w = getWorld();
    if (!w?.pickups || !w?.player) return { items: 0, chests: 0, total: 0 };
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
    return { items, chests, total: items + chests };
  }

  function notify(msg) {
    if (hToast) hToast(msg);
    else console.log('[吞天]', msg);
  }

  function refreshUI() {
    if (hasHostMod && hRender) hRender();
    if (!hasHostMod && typeof renderStandalone === 'function') renderStandalone();
  }

  if (state.cleanBlue) setTimeout(snapshotBlue, 800);

  setInterval(() => {
    if (!inRun()) return;
    if (state.auto) pullNow();
    if (state.cleanBlue) {
      const r = cleanBlue(true);
      if (r.sold > 0 && !hasHostMod && typeof setTempText === 'function') {
        setTempText(`清${r.sold}藍 +${r.gold}金`, 1300);
      }
    }
  }, 1000);

  function renderHostSection() {
    const on = state.auto;
    const blueOn = state.cleanBlue;
    const toggle = () => {
      state.auto = !on;
      try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (e) { alert('無法儲存設定：' + e); return; }
      refreshUI();
      notify(state.auto ? '自動吞天已開啟' : '自動吞天已關閉');
    };
    const triggerPull = () => {
      const res = pullNow();
      notify(res.total ? `已吞天 ${res.items} 物 / ${res.chests} 箱` : '目前沒有可吞天的道具或寶箱');
    };
    const toggleBlue = () => {
      state.cleanBlue = !blueOn;
      try { localStorage.setItem(BLUE_AUTO_KEY, state.cleanBlue ? '1' : '0'); } catch (e) { alert('無法儲存設定：' + e); return; }
      if (state.cleanBlue) {
        const kept = snapshotBlue();
        refreshUI();
        notify(`自動清藍裝已開啟（已保護包包原有 ${kept} 件物品與符咒/珠寶）`);
      } else {
        state.protectedIds.clear();
        refreshUI();
        notify('自動清藍裝已關閉');
      }
    };
    return hEl('section', { class: 'd2ed-sec' },
      hEl('h3', {}, '吞天（自動吸物與寶箱）'),
      hEl('p', { class: 'd2ed-note' }, '開啟後每秒自動把地上裝備與未開啟寶箱拉到腳邊；可獨立開啟「自動清藍裝」，開啟瞬間會保護包包原有藍裝與符咒/珠寶，僅將之後新撿到的藍裝自動賣出換成金幣。'),
      hEl('div', { class: 'd2ed-row', style: 'align-items: center; flex-wrap: wrap' },
        hEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉自動吞天' : '開啟自動吞天'),
        hEl('button', { type: 'button', onclick: triggerPull }, '立即吞天'),
        hEl('button', {
          type: 'button',
          style: blueOn
            ? 'padding: 2px 8px; font-size: 12px; background: #3b528c; border-color: #7da0f5; color: #fff;'
            : 'padding: 2px 8px; font-size: 12px; background: #1c2536; border-color: #4e6399; color: #8f9cff;',
          onclick: toggleBlue
        }, blueOn ? '自動清藍：開' : '自動清藍：關'),
        hEl('span', { class: 'd2ed-note', style: 'align-self: center' }, `吞天：${on ? '開' : '關'}`)));
  }

  let tempMsg = '';
  let tempTimer = null;
  let renderStandalone = null;
  let setTempText = null;

  if (hasHostMod) {
    host.mod.registerSection(renderHostSection);
  } else {
    const wrap = document.createElement('div');
    wrap.id = 'd2-pull-wrap';
    wrap.style.cssText = 'position:fixed;top:12px;right:132px;left:auto;z-index:2147483646;display:flex;align-items:center;gap:4px;touch-action:none;user-select:none;-webkit-user-select:none';

    const btn = document.createElement('button');
    btn.id = 'd2-pull-test-btn';
    btn.type = 'button';
    btn.style.cssText = 'height:24px;padding:0 8px;background:linear-gradient(180deg,#3a2e1c,#1a140c);border:1px solid #8f743e;border-radius:4px;color:#e8dcc0;text-shadow:1px 1px 0 #000,-1px 0 #000,0 -1px #000;box-shadow:0 3px 8px rgba(0,0,0,.55);cursor:grab;font:bold 10px "Microsoft JhengHei UI",sans-serif;letter-spacing:0.5px;white-space:nowrap';

    const blueBtn = document.createElement('button');
    blueBtn.id = 'd2-pull-blue-btn';
    blueBtn.type = 'button';
    blueBtn.title = '左鍵：切換自動清藍裝（保護原有藍裝與符咒/珠寶）｜右鍵：立即清現有藍裝（仍保護符咒/珠寶）';
    blueBtn.style.cssText = 'height:20px;padding:0 6px;background:#1c2536;border:1px solid #4e6399;border-radius:4px;color:#8f9cff;text-shadow:1px 1px 0 #000;box-shadow:0 2px 6px rgba(0,0,0,.45);cursor:pointer;font:bold 10px "Microsoft JhengHei UI",sans-serif;white-space:nowrap';

    const resetBtn = document.createElement('button');
    resetBtn.id = 'd2-pull-blue-reset-btn';
    resetBtn.type = 'button';
    resetBtn.textContent = '↺';
    resetBtn.title = '歸零清藍累計數量與金幣統計';
    resetBtn.style.cssText = 'height:20px;padding:0 5px;background:#231b14;border:1px solid #6e5832;border-radius:4px;color:#d8c69e;text-shadow:1px 1px 0 #000;box-shadow:0 2px 6px rgba(0,0,0,.45);cursor:pointer;font:bold 10px "Microsoft JhengHei UI",sans-serif;line-height:1;white-space:nowrap';

    const applySavedPos = () => {
      try {
        const pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
        if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
          const maxLeft = Math.max(0, window.innerWidth - wrap.offsetWidth);
          const maxTop = Math.max(0, window.innerHeight - wrap.offsetHeight);
          wrap.style.left = `${Math.min(maxLeft, Math.max(0, pos.left))}px`;
          wrap.style.top = `${Math.min(maxTop, Math.max(0, pos.top))}px`;
          wrap.style.right = 'auto';
        }
      } catch (_) {}
    };

    renderStandalone = () => {
      btn.textContent = tempMsg || `吞天 (自動:${state.auto ? '開' : '關'})`;
      blueBtn.textContent = state.cleanBlue ? `清藍:開(${state.cleanedCount})` : '清藍:關';
      blueBtn.style.background = state.cleanBlue ? '#3b528c' : '#1c2536';
      blueBtn.style.color = state.cleanBlue ? '#ffffff' : '#8f9cff';
      blueBtn.style.borderColor = state.cleanBlue ? '#7da0f5' : '#4e6399';
      applySavedPos();
    };

    setTempText = (msg, ms = 1300) => {
      tempMsg = msg;
      clearTimeout(tempTimer);
      renderStandalone();
      tempTimer = setTimeout(() => { tempMsg = ''; renderStandalone(); }, ms);
    };

    let dragState = null;
    let suppressClick = false;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const rect = wrap.getBoundingClientRect();
      wrap.style.left = `${rect.left}px`; wrap.style.top = `${rect.top}px`; wrap.style.right = 'auto';
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
        const maxLeft = Math.max(0, window.innerWidth - wrap.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - wrap.offsetHeight);
        wrap.style.left = `${Math.min(maxLeft, Math.max(0, dragState.originLeft + dx))}px`;
        wrap.style.top = `${Math.min(maxTop, Math.max(0, dragState.originTop + dy))}px`;
      }
    }, true);

    const finishDrag = (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      e.preventDefault(); e.stopPropagation();
      btn.style.cursor = 'grab';
      if (dragState.moved) {
        suppressClick = true;
        const rect = wrap.getBoundingClientRect();
        try { localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top })); } catch (_) {}
        setTimeout(() => { suppressClick = false; }, 60);
      }
      try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
      dragState = null;
    };
    btn.addEventListener('pointerup', finishDrag, true);
    btn.addEventListener('pointercancel', finishDrag, true);

    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (suppressClick) return;
      const { items, chests } = pullNow();
      setTempText((items + chests) ? `吞天 ${items}物/${chests}箱` : '吞天 (無)');
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (suppressClick) return;
      state.auto = !state.auto;
      try { localStorage.setItem(AUTO_KEY, state.auto ? '1' : '0'); } catch (_) {}
      renderStandalone();
    });

    blueBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      state.cleanBlue = !state.cleanBlue;
      try { localStorage.setItem(BLUE_AUTO_KEY, state.cleanBlue ? '1' : '0'); } catch (_) {}
      if (state.cleanBlue) {
        const kept = snapshotBlue();
        setTempText(`護${kept}物 清藍開`);
      } else {
        state.protectedIds.clear();
        setTempText('清藍關');
      }
    });

    resetBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      state.cleanedCount = 0; state.goldAdded = 0;
      setTempText('清藍已歸零', 1000);
    });

    blueBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      const r = cleanBlue(false);
      setTempText(!r.ready ? '未抓到背包' : r.sold > 0 ? `清${r.sold}藍 +${r.gold}金` : '包內無藍裝', 1300);
    });

    for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend']) {
      window.addEventListener(type, (e) => {
        if (e.target === btn || e.target === blueBtn || e.target === resetBtn || e.target === wrap) e.stopImmediatePropagation();
      }, true);
    }

    wrap.append(btn, blueBtn, resetBtn);
    document.body.appendChild(wrap);
    renderStandalone();
    requestAnimationFrame(applySavedPos);
    window.addEventListener('resize', applySavedPos);
  }

  window.__D2MOD_ENDPULL = { pull: pullNow, cleanBlue, snapshotBlue, state };
})();

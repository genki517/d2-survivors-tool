void (function D2_AUTO_PULL() {
  if (window.__D2_AUTO_PULL) return;
  window.__D2_AUTO_PULL = true;

  const KEY = 'd2ed:endPull';
  const isOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (_) { return true; } };
  const setOn = v => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (_) {} };

  // 1. 取得遊戲 world 實例（相容主腳本的 __D2ED.world，若單獨執行也能自己攔截）
  let capturedWorld = null;
  const getWorld = () => (window.__D2ED && window.__D2ED.world) || capturedWorld;

  if (!Object.prototype.hasOwnProperty('tristram')) {
    Object.defineProperty(Object.prototype, 'tristram', {
      configurable: true, enumerable: false,
      get() { if (this && Array.isArray(this.pickups) && this.player) capturedWorld = this; return undefined; },
      set(v) { Object.defineProperty(this, 'tristram', { value: v, writable: true, enumerable: true, configurable: true }); }
    });
  }
  const rawGet = WeakMap.prototype.get;
  WeakMap.prototype.get = function (key) {
    if (key && typeof key === 'object' && Array.isArray(key.pickups) && key.player && key.stage) {
      capturedWorld = key;
    }
    return rawGet.apply(this, arguments);
  };

  // 2. 核心吸取邏輯（直接將 kind === 'item' 的掉落物座標移到角色腳邊）
  function pullItemsToPlayer() {
    const w = getWorld();
    if (!w?.pickups || !w?.player) return 0;
    let n = 0;
    for (const p of w.pickups) {
      if (p && p.kind === 'item') {
        p.x = w.player.x + (Math.random() - 0.5) * 16;
        p.y = w.player.y + (Math.random() - 0.5) * 16;
        n++;
      }
    }
    return n;
  }

  // 每秒自動吸取（僅在遊戲局內且開啟時執行）
  setInterval(() => {
    if (isOn() && !document.body.classList.contains('no-run')) {
      pullItemsToPlayer();
    }
  }, 1000);

  // 3. 右上角獨立按鈕（左鍵：立即吸物；右鍵：切換自動吸取開/關）
  const btn = document.createElement('button');
  btn.id = 'd2-standalone-pull-btn';
  btn.type = 'button';
  btn.title = '左鍵：立即吸取地上道具｜右鍵：切換每秒自動吸取';
  btn.style.cssText = `
    position: fixed; top: 12px; right: 148px; z-index: 2147483646;
    height: 36px; padding: 0 12px; cursor: pointer;
    background: linear-gradient(180deg, #3a2e1c, #1a140c);
    border: 1px solid #8f743e; border-radius: 6px;
    color: #e8dcc0; font: bold 14px "Microsoft JhengHei UI", sans-serif;
    text-shadow: 1px 1px 0 #000; box-shadow: 0 4px 12px rgba(0,0,0,.55);
  `;

  const syncLabel = (tempText) => {
    if (tempText) { btn.textContent = tempText; return; }
    btn.textContent = isOn() ? '一鍵吸物 (自動:開)' : '一鍵吸物 (自動:關)';
    btn.style.borderColor = isOn() ? '#8f743e' : '#555';
  };
  syncLabel();

  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const n = pullItemsToPlayer();
    syncLabel(n ? `已吸 ${n} 件` : '無道具');
    setTimeout(() => syncLabel(), 1000);
  });

  btn.addEventListener('contextmenu', e => {
    e.preventDefault(); e.stopPropagation();
    setOn(!isOn());
    syncLabel();
  });

  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
    btn.addEventListener(type, e => e.stopImmediatePropagation(), true);
  }

  document.body.appendChild(btn);
  window.__D2_PULL_NOW = pullItemsToPlayer;
})();

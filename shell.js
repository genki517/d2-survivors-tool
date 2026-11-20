(() => {
  'use strict';

  const SHELL_GLOBAL_KEY = '__D2S_ASSISTANT_SHELL__';
  const ROOT_ID = 'd2s-shell-root';
  const STYLE_ID = 'd2s-shell-style';

  // 若已存在舊主程式實例，先清理避免重複注入
  if (window[SHELL_GLOBAL_KEY] && typeof window[SHELL_GLOBAL_KEY].destroy === 'function') {
    window[SHELL_GLOBAL_KEY].destroy();
  }
  document.getElementById(ROOT_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();

  // =========================================================================
  // 1. 模組清單與載入狀態表（防重複載入 / 防重入）
  // =========================================================================
  const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/';

  const MODULE_DEFS = [
    {
      key: 'tempering',
      title: '淬煉助手',
      url: 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/tempering',
      badge: '未載入',
      preloadOnBoot: false
    },
    {
      key: 'gambling',
      title: '賭博助手',
      url: 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/gambling',
      badge: '未載入',
      preloadOnBoot: false
    },
    {
      key: 'farming',
      title: '刷關助手',
      url: `${DEFAULT_BASE_URL}farming`,
      badge: '未開發',
      preloadOnBoot: false
    },
    {
      key: 'localization',
      title: '中文化助手',
      url: `${DEFAULT_BASE_URL}localization`,
      badge: '預載中',
      preloadOnBoot: true
    }
  ];

  const registry = new Map();
  for (const def of MODULE_DEFS) {
    registry.set(def.key, {
      ...def,
      loaded: false,
      initialized: false,
      loadingPromise: null,
      instance: null,
      mountEl: null
    });
  }

  let baseUrl = DEFAULT_BASE_URL;
  let activeKey = null;
  let isMinimized = false;

  // =========================================================================
  // 2. 樣式（右上角緊湊浮動、可最小化、不佔用左側畫面）
  // =========================================================================
  const css = `
    #${ROOT_ID} {
      --shell-bg: rgba(16, 19, 26, 0.88);
      --shell-surface: rgba(255, 255, 255, 0.05);
      --shell-hover: rgba(255, 255, 255, 0.11);
      --shell-border: rgba(255, 255, 255, 0.14);
      --shell-text: #f3f5f8;
      --shell-muted: #9aa3b2;
      --shell-accent: #e5a93c;
      --shell-accent-bg: rgba(229, 169, 60, 0.18);

      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", Roboto, sans-serif;
      color: var(--shell-text);
      user-select: none;
    }

    #${ROOT_ID} * {
      box-sizing: border-box;
    }

    .d2s-mini-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--shell-border);
      background: var(--shell-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: var(--shell-text);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.36);
    }

    .d2s-mini-pill:hover {
      border-color: rgba(229, 169, 60, 0.5);
    }

    .d2s-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--shell-accent);
      box-shadow: 0 0 8px var(--shell-accent);
    }

    .d2s-window {
      width: 312px;
      border-radius: 12px;
      border: 1px solid var(--shell-border);
      background: var(--shell-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .d2s-window.is-hidden {
      display: none;
    }

    .d2s-mini-pill.is-hidden {
      display: none;
    }

    .d2s-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-bottom: 1px solid var(--shell-border);
      background: rgba(255, 255, 255, 0.03);
    }

    .d2s-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .d2s-top-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .d2s-btn {
      border: 1px solid transparent;
      border-radius: 7px;
      background: var(--shell-surface);
      color: var(--shell-text);
      font-size: 11.5px;
      padding: 4px 8px;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease;
    }

    .d2s-btn:hover {
      background: var(--shell-hover);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .d2s-tabs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      padding: 8px 10px;
      border-bottom: 1px solid var(--shell-border);
      background: rgba(0, 0, 0, 0.18);
    }

    .d2s-tab-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 9px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: var(--shell-surface);
      color: var(--shell-text);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease;
    }

    .d2s-tab-btn:hover {
      background: var(--shell-hover);
    }

    .d2s-tab-btn.is-active {
      background: var(--shell-accent-bg);
      border-color: rgba(229, 169, 60, 0.6);
      color: #ffd57e;
      font-weight: 600;
    }

    .d2s-tag {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--shell-muted);
    }

    .d2s-tab-btn.is-active .d2s-tag {
      background: rgba(229, 169, 60, 0.25);
      color: #ffd57e;
    }

    .d2s-body {
      padding: 10px;
      min-height: 128px;
      max-height: 65vh;
      overflow-y: auto;
    }

    .d2s-module-slot {
      display: none;
    }

    .d2s-module-slot.is-visible {
      display: block;
    }

    .d2s-empty-hint {
      padding: 10px;
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.16);
      font-size: 12px;
      line-height: 1.5;
      color: var(--shell-muted);
    }

    .d2s-footer {
      padding: 6px 10px;
      border-top: 1px solid var(--shell-border);
      background: rgba(0, 0, 0, 0.24);
      font-size: 11px;
      color: var(--shell-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // =========================================================================
  // 3. 建立主程式 DOM
  // =========================================================================
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <button type="button" class="d2s-mini-pill is-hidden" id="d2s-expand-btn" title="展開助手主面板">
      <span class="d2s-dot"></span>
      <span>D2S 助手</span>
    </button>

    <div class="d2s-window" id="d2s-window">
      <div class="d2s-topbar">
        <div class="d2s-brand">
          <span class="d2s-dot"></span>
          <span>D2S 助手主控</span>
        </div>
        <div class="d2s-top-actions">
          <button type="button" class="d2s-btn" id="d2s-min-btn" title="最小化（背景持續運作）">最小化</button>
        </div>
      </div>

      <div class="d2s-tabs" id="d2s-tabs">
        ${MODULE_DEFS.map((m) => `
          <button type="button" class="d2s-tab-btn" data-key="${m.key}">
            <span>${m.title}</span>
            <span class="d2s-tag" data-tag="${m.key}">${m.badge}</span>
          </button>
        `).join('')}
      </div>

      <div class="d2s-body" id="d2s-body">
        ${MODULE_DEFS.map((m) => `
          <div class="d2s-module-slot" data-slot="${m.key}">
            <div class="d2s-empty-hint">
              尚未掛載「${m.title}」模組介面。<br/>
              點擊分頁後將載入來源並準備掛載位。
            </div>
          </div>
        `).join('')}
      </div>

      <div class="d2s-footer" id="d2s-footer">主程式已就緒（切換分頁不中斷背景任務）</div>
    </div>
  `;
  document.body.appendChild(root);

  const expandBtn = root.querySelector('#d2s-expand-btn');
  const winEl = root.querySelector('#d2s-window');
  const minBtn = root.querySelector('#d2s-min-btn');
  const footerEl = root.querySelector('#d2s-footer');
  const tabButtons = Array.from(root.querySelectorAll('.d2s-tab-btn'));

  for (const entry of registry.values()) {
    entry.mountEl = root.querySelector(`[data-slot="${entry.key}"]`);
  }

  // =========================================================================
  // 4. 模組載入、初始化與 show/hide 調度器
  // =========================================================================
  function setStatus(msg) {
    footerEl.textContent = msg;
  }

  function setTag(key, text) {
    const tagEl = root.querySelector(`[data-tag="${key}"]`);
    if (tagEl) tagEl.textContent = text;
  }

  function buildModuleContext(entry) {
    return {
      key: entry.key,
      container: entry.mountEl,
      setStatus,
      setBadge: (text) => setTag(entry.key, text),
      getBaseUrl: () => baseUrl
    };
  }

  function buildScriptUrl(rawUrl) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}t=${Date.now()}`;
  }

  function ensureScriptLoaded(key) {
    const entry = registry.get(key);
    if (!entry) return Promise.reject(new Error(`未知模組: ${key}`));
    if (entry.loaded) return Promise.resolve(entry);
    if (entry.loadingPromise) return entry.loadingPromise;

    setTag(key, '載入中');
    setStatus(`正在載入 ${entry.title}...`);

    entry.loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = buildScriptUrl(entry.url);
      script.async = true;
      script.dataset.d2sModule = key;

      script.onload = () => {
        entry.loaded = true;
        entry.loadingPromise = null;
        if (!entry.initialized) {
          setTag(key, '已載入');
        }
        resolve(entry);
      };

      script.onerror = () => {
        entry.loadingPromise = null;
        setTag(key, '載入失敗');
        setStatus(`${entry.title} 載入失敗，請檢查網址或網路`);
        reject(new Error(`無法載入模組腳本: ${entry.url}`));
      };

      document.head.appendChild(script);
    });

    return entry.loadingPromise;
  }

  function ensureModuleInitialized(key) {
    const entry = registry.get(key);
    if (!entry || entry.initialized || !entry.instance) return;

    entry.initialized = true;
    if (typeof entry.instance.init === 'function') {
      entry.instance.init(buildModuleContext(entry));
    }
    setTag(key, '就緒');
  }

  function registerModule(key, moduleApi) {
    const entry = registry.get(key);
    if (!entry) return false;

    if (entry.initialized && entry.instance) {
      return true;
    }

    entry.loaded = true;
    entry.instance = moduleApi || {};
    ensureModuleInitialized(key);
    return true;
  }

  async function switchTab(key) {
    const entry = registry.get(key);
    if (!entry) return;

    setMinimized(false);
    activeKey = key;

    tabButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.key === key);
    });

    for (const item of registry.values()) {
      const isTarget = item.key === key;
      item.mountEl?.classList.toggle('is-visible', isTarget);

      if (!isTarget && item.initialized && typeof item.instance?.hide === 'function') {
        item.instance.hide();
      }
    }

    try {
      await ensureScriptLoaded(key);
      ensureModuleInitialized(key);

      if (typeof entry.instance?.show === 'function') {
        entry.instance.show(buildModuleContext(entry));
      }
      setStatus(`目前分頁：${entry.title}`);
    } catch (_) {
      // 錯誤訊息已在 ensureScriptLoaded 顯示
    }
  }

  function setMinimized(minimized) {
    isMinimized = Boolean(minimized);
    winEl.classList.toggle('is-hidden', isMinimized);
    expandBtn.classList.toggle('is-hidden', !isMinimized);
    if (isMinimized) {
      setStatus('已最小化（各助手背景任務與狀態保留中）');
    } else if (activeKey && registry.get(activeKey)) {
      setStatus(`目前分頁：${registry.get(activeKey).title}`);
    }
  }

  async function preloadBootModules() {
    for (const entry of registry.values()) {
      if (!entry.preloadOnBoot) continue;
      try {
        await ensureScriptLoaded(entry.key);
        ensureModuleInitialized(entry.key);
        if (typeof entry.instance?.hide === 'function') {
          entry.instance.hide();
        }
      } catch (_) {
        setTag(entry.key, '待上線');
        setStatus('主程式已就緒');
      }
    }
  }

  // =========================================================================
  // 5. 事件綁定與對外 API
  // =========================================================================
  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMinimized(true);
  });

  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMinimized(false);
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchTab(btn.dataset.key);
    });
  });

  const shellApi = {
    registerModule,
    switchTab,
    setMinimized,
    setStatus,
    setBaseUrl(url) {
      if (typeof url === 'string' && url.trim()) {
        baseUrl = url.trim();
      }
    },
    getState: () => ({
      activeKey,
      isMinimized,
      baseUrl,
      modules: Array.from(registry.values()).map(({ key, title, url, loaded, initialized }) => ({
        key,
        title,
        url,
        loaded,
        initialized
      }))
    }),
    destroy() {
      root.remove();
      styleEl.remove();
      delete window[SHELL_GLOBAL_KEY];
    }
  };

  window[SHELL_GLOBAL_KEY] = shellApi;

  preloadBootModules();
})();

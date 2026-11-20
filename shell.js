(function () {
  const HOST_ID = 'd2s-master-host-panel';

  const MODULE_URLS = {
    temper: 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/tempering',
    gamble: 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/gambling',
    localization: 'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/localization'
  };

  const MODULE_META = {
    temper: {
      title: '淬煉助手',
      reloadLabel: '重新載入淬煉助手',
      scriptId: 'd2s-temper-exec'
    },
    gamble: {
      title: '賭博助手',
      reloadLabel: '重新載入賭博助手',
      scriptId: 'd2s-gamble-exec'
    },
    localization: {
      title: '中文化模組',
      reloadLabel: '重新載入中文化',
      scriptId: 'd2s-localization-exec'
    }
  };

  // 避免重複建立主控面板
  const oldHost = document.getElementById(HOST_ID);
  if (oldHost) {
    oldHost.remove();
  }

  // ===== 狀態管理 =====
  const state = {
    activeTab: 'temper', // 'temper' | 'gamble' | 'farm' | 'localization'
    minimized: false,
    modules: {
      temper: { status: 'idle', loadedAt: '', errorMsg: '' },
      gamble: { status: 'idle', loadedAt: '', errorMsg: '' },
      localization: { status: 'idle', loadedAt: '', errorMsg: '' }
    }
  };

  // ===== 從 GitHub 載入並執行腳本 =====
  async function loadModuleFromGitHub(modKey, forceReload = false) {
    const url = MODULE_URLS[modKey];
    const meta = MODULE_META[modKey];
    const modState = state.modules[modKey];
    if (!url || !meta || !modState) return;

    if (!forceReload && (modState.status === 'loaded' || modState.status === 'loading')) {
      return;
    }

    modState.status = 'loading';
    modState.errorMsg = '';
    renderBody();

    try {
      const fetchUrl = forceReload ? `${url}?t=${Date.now()}` : url;
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const codeText = await res.text();
      if (!codeText || !codeText.trim()) {
        throw new Error('回傳內容為空');
      }

      const prevScript = document.getElementById(meta.scriptId);
      if (prevScript) prevScript.remove();

      const scriptEl = document.createElement('script');
      scriptEl.id = meta.scriptId;
      scriptEl.textContent = codeText;
      (document.head || document.documentElement).appendChild(scriptEl);

      modState.status = 'loaded';
      modState.loadedAt = new Date().toLocaleTimeString();
    } catch (err) {
      modState.status = 'error';
      modState.errorMsg = err && err.message ? err.message : String(err);
    }

    renderBody();
  }

  // ===== 建立主控面板 UI =====
  const panel = document.createElement('div');
  panel.id = HOST_ID;
  Object.assign(panel.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    width: '320px',
    background: 'rgba(20, 22, 28, 0.95)',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    zIndex: '999999',
    overflow: 'hidden'
  });

  // 標題列（可拖曳 + 縮小/關閉）
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    cursor: 'move',
    userSelect: 'none'
  });

  const titleEl = document.createElement('span');
  titleEl.textContent = 'D2S 助手主控';
  titleEl.style.fontWeight = '700';

  const winBtns = document.createElement('div');
  winBtns.style.display = 'flex';
  winBtns.style.gap = '6px';

  const minBtn = document.createElement('button');
  minBtn.textContent = '—';
  Object.assign(minBtn.style, {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 7px',
    cursor: 'pointer'
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, {
    background: '#7f1d1d',
    color: '#fecaca',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 7px',
    cursor: 'pointer'
  });

  winBtns.append(minBtn, closeBtn);
  header.append(titleEl, winBtns);

  // 分頁列
  const tabBar = document.createElement('div');
  Object.assign(tabBar.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: '#0f172a',
    borderBottom: '1px solid #334155'
  });

  const tabs = [
    { key: 'temper', label: '淬煉助手' },
    { key: 'gamble', label: '賭博助手' },
    { key: 'farm', label: '刷關助手' },
    { key: 'localization', label: '中文化助手' }
  ];

  const tabButtons = {};
  tabs.forEach((t) => {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    Object.assign(btn.style, {
      padding: '7px 4px',
      border: 'none',
      borderBottom: '2px solid transparent',
      background: 'transparent',
      color: '#94a3b8',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '600'
    });
    btn.addEventListener('click', () => {
      switchTab(t.key);
    });
    tabButtons[t.key] = btn;
    tabBar.appendChild(btn);
  });

  // 內容區
  const bodyEl = document.createElement('div');
  Object.assign(bodyEl.style, {
    padding: '10px',
    minHeight: '90px'
  });

  panel.append(header, tabBar, bodyEl);
  document.body.appendChild(panel);

  // ===== 分頁切換與渲染 =====
  function updateTabStyles() {
    Object.entries(tabButtons).forEach(([key, btn]) => {
      const active = key === state.activeTab;
      btn.style.color = active ? '#38bdf8' : '#94a3b8';
      btn.style.borderBottomColor = active ? '#38bdf8' : 'transparent';
      btn.style.background = active ? 'rgba(56, 189, 248, 0.08)' : 'transparent';
    });
  }

  function switchTab(tabKey) {
    state.activeTab = tabKey;
    updateTabStyles();
    renderBody();

    // A方式：切到對應分頁時，若尚未載入則自動從 GitHub 載入
    if (MODULE_URLS[tabKey] && state.modules[tabKey].status === 'idle') {
      loadModuleFromGitHub(tabKey, false);
    }
  }

  function renderRemoteModuleTab(modKey) {
    const url = MODULE_URLS[modKey];
    const meta = MODULE_META[modKey];
    const mod = state.modules[modKey];

    let statusHtml = '';
    if (mod.status === 'idle') {
      statusHtml = '<span style="color:#94a3b8;">準備載入中...</span>';
    } else if (mod.status === 'loading') {
      statusHtml = '<span style="color:#facc15;">正在從 GitHub 載入中...</span>';
    } else if (mod.status === 'loaded') {
      statusHtml = `<span style="color:#4ade80;">已載入並執行（${mod.loadedAt}）</span>`;
    } else {
      statusHtml = `<span style="color:#f87171;">載入失敗：${mod.errorMsg}</span>`;
    }

    bodyEl.innerHTML = `
      <div style="line-height:1.6;">
        <div style="font-weight:600;margin-bottom:4px;">GitHub ${meta.title}</div>
        <div style="font-size:11px;color:#94a3b8;word-break:break-all;margin-bottom:6px;">
          ${url}
        </div>
        <div style="margin-bottom:10px;">狀態：${statusHtml}</div>
        <button id="d2s-mod-reload-${modKey}" style="
          background:#0284c7;
          color:#fff;
          border:none;
          border-radius:5px;
          padding:5px 12px;
          cursor:pointer;
          font-size:12px;
        " ${mod.status === 'loading' ? 'disabled' : ''}>
          ${mod.status === 'loading' ? '載入中...' : meta.reloadLabel}
        </button>
      </div>
    `;

    const reloadBtn = bodyEl.querySelector(`#d2s-mod-reload-${modKey}`);
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        loadModuleFromGitHub(modKey, true);
      });
    }
  }

  function renderBody() {
    if (state.minimized) {
      tabBar.style.display = 'none';
      bodyEl.style.display = 'none';
      return;
    }
    tabBar.style.display = 'grid';
    bodyEl.style.display = 'block';

    if (MODULE_URLS[state.activeTab]) {
      renderRemoteModuleTab(state.activeTab);
      return;
    }

    // 尚未接上 GitHub 的分頁（目前為刷關助手）
    const tabNames = {
      farm: '刷關助手'
    };
    bodyEl.innerHTML = `
      <div style="color:#cbd5e1;line-height:1.6;">
        <div><b>${tabNames[state.activeTab] || ''}</b></div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
          模組尚未掛載，後續可由此分頁自動從 GitHub 載入對應腳本。
        </div>
      </div>
    `;
  }

  // ===== 拖曳與視窗按鈕事件 =====
  minBtn.addEventListener('click', () => {
    state.minimized = !state.minimized;
    minBtn.textContent = state.minimized ? '＋' : '—';
    renderBody();
  });

  closeBtn.addEventListener('click', () => {
    panel.remove();
  });

  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = `${Math.max(0, e.clientX - dragOffsetX)}px`;
    panel.style.top = `${Math.max(0, e.clientY - dragOffsetY)}px`;
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 初始化預設分頁
  updateTabStyles();
  renderBody();
})();

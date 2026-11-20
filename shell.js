(function () {
  const HOST_ID = 'd2s-master-host-panel';
  const LOCALIZATION_URL =
    'https://raw.githubusercontent.com/genki517/d2-survivors-tool/refs/heads/main/localization';

  // 避免重複建立主控面板
  const oldHost = document.getElementById(HOST_ID);
  if (oldHost) {
    oldHost.remove();
  }

  // ===== 狀態管理 =====
  const state = {
    activeTab: 'temper', // 'temper' | 'gamble' | 'farm' | 'localization'
    minimized: false,
    localization: {
      status: 'idle', // 'idle' | 'loading' | 'loaded' | 'error'
      loadedAt: '',
      errorMsg: ''
    }
  };

  // ===== 從 GitHub 載入並執行中文化腳本（使用 fetch + script 注入，避免 raw text/plain MIME 阻擋） =====
  async function loadLocalizationModule(forceReload = false) {
    if (!forceReload && state.localization.status === 'loaded') {
      return;
    }
    if (!forceReload && state.localization.status === 'loading') {
      return;
    }

    state.localization.status = 'loading';
    state.localization.errorMsg = '';
    renderBody();

    try {
      const fetchUrl = forceReload
        ? `${LOCALIZATION_URL}?t=${Date.now()}`
        : LOCALIZATION_URL;

      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const codeText = await res.text();
      if (!codeText || !codeText.trim()) {
        throw new Error('回傳內容為空');
      }

      // 移除舊的動態中文化 script 節點
      const prevScript = document.getElementById('d2s-localization-exec');
      if (prevScript) prevScript.remove();

      const scriptEl = document.createElement('script');
      scriptEl.id = 'd2s-localization-exec';
      scriptEl.textContent = codeText;
      (document.head || document.documentElement).appendChild(scriptEl);

      state.localization.status = 'loaded';
      state.localization.loadedAt = new Date().toLocaleTimeString();
    } catch (err) {
      state.localization.status = 'error';
      state.localization.errorMsg = err && err.message ? err.message : String(err);
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

    // A方式：切到「中文化助手」分頁時自動從 GitHub 載入
    if (tabKey === 'localization' && state.localization.status === 'idle') {
      loadLocalizationModule(false);
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

    if (state.activeTab === 'localization') {
      const loc = state.localization;
      let statusHtml = '';
      if (loc.status === 'idle') {
        statusHtml = '<span style="color:#94a3b8;">準備載入中...</span>';
      } else if (loc.status === 'loading') {
        statusHtml = '<span style="color:#facc15;">正在從 GitHub 載入中文化...</span>';
      } else if (loc.status === 'loaded') {
        statusHtml = `<span style="color:#4ade80;">已載入並執行（${loc.loadedAt}）</span>`;
      } else {
        statusHtml = `<span style="color:#f87171;">載入失敗：${loc.errorMsg}</span>`;
      }

      bodyEl.innerHTML = `
        <div style="line-height:1.6;">
          <div style="font-weight:600;margin-bottom:4px;">GitHub 中文化模組</div>
          <div style="font-size:11px;color:#94a3b8;word-break:break-all;margin-bottom:6px;">
            ${LOCALIZATION_URL}
          </div>
          <div style="margin-bottom:10px;">狀態：${statusHtml}</div>
          <button id="d2s-loc-reload" style="
            background:#0284c7;
            color:#fff;
            border:none;
            border-radius:5px;
            padding:5px 12px;
            cursor:pointer;
            font-size:12px;
          " ${loc.status === 'loading' ? 'disabled' : ''}>
            ${loc.status === 'loading' ? '載入中...' : '重新載入中文化'}
          </button>
        </div>
      `;

      const reloadBtn = bodyEl.querySelector('#d2s-loc-reload');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
          loadLocalizationModule(true);
        });
      }
      return;
    }

    // 其他分頁占位區（後續接淬煉 / 賭博 / 刷關模組）
    const tabNames = {
      temper: '淬煉助手',
      gamble: '賭博助手',
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

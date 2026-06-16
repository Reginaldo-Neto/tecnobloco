'use strict';

/**
 * Tecnobloco ERP — UI Components
 * Provides shared UI utilities: page initialisation, sidebar/topbar,
 * toast notifications, confirm dialogs and language management.
 */

// ── Feature Flags (carregadas uma vez do backend) ─────────────────────────────
// Objeto com { moduleId: true/false } carregado de GET /api/feature-flags
let _featureFlags = null; // null = ainda não carregou; usa permissive até carregar

async function _loadFeatureFlags() {
  if (_featureFlags !== null) return _featureFlags;
  try {
    const data = await fetch('/api/feature-flags').then(r => r.json());
    if (data && data.data) {
      _featureFlags = {};
      Object.keys(data.data).forEach(k => {
        _featureFlags[k] = data.data[k].enabled !== false;
      });
    }
  } catch { /* silencioso — sem flags = tudo visível */ }
  if (!_featureFlags) _featureFlags = {};
  return _featureFlags;
}

function _isModuleEnabled(moduleId) {
  if (!_featureFlags || !(moduleId in _featureFlags)) return true; // padrão: habilitado
  return _featureFlags[moduleId];
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
/**
 * Escapa caracteres HTML especiais antes de inserir strings de origem
 * externa (API, localStorage) em innerHTML.
 * Previne XSS em dados retornados pelo servidor ou modificados pelo usuário.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── i18n ─────────────────────────────────────────────────────────────────────
const LABELS = {
  pt: {
    dashboard:  'Dashboard',
    manutencao: 'Manutenção',
    admin:      'Administração',
    logout:       'Sair',
    theme_light:  'Tema claro',
    theme_dark:   'Tema escuro',
    loading:      'Carregando...',
    confirm_yes:  'Confirmar',
    confirm_no:   'Cancelar',
    confirm_title: 'Confirmação',
    no_access:    'Sem permissão de acesso.',
  },
  en: {
    dashboard:  'Dashboard',
    manutencao: 'Maintenance',
    admin:      'Administration',
    logout:      'Logout',
    theme_light: 'Light theme',
    theme_dark:  'Dark theme',
    loading: 'Loading...',
    confirm_yes: 'Confirm',
    confirm_no: 'Cancel',
    confirm_title: 'Confirmation',
    no_access: 'Access denied.',
  },
  es: {
    dashboard:  'Panel',
    manutencao: 'Mantenimiento',
    admin:      'Administración',
    logout:       'Salir',
    theme_light:  'Tema claro',
    theme_dark:   'Tema oscuro',
    loading:      'Cargando...',
    confirm_yes:  'Confirmar',
    confirm_no:   'Cancelar',
    confirm_title: 'Confirmación',
    no_access:    'Sin permiso de acceso.',
  },
};

function getLang() {
  return localStorage.getItem('tb_lang') || 'pt';
}

function t(key) {
  const lang = getLang();
  return (LABELS[lang] && LABELS[lang][key]) || (LABELS['pt'][key]) || key;
}

// ── Menu definition ───────────────────────────────────────────────────────────
/**
 * Each item: { id, icon, labelKey, href, minNivel, departamentos }
 *
 * departamentos: null  → item global, visível a todos os autenticados (ex: dashboard)
 * departamentos: [...] → visível apenas aos setores listados
 *
 * Regras de visibilidade (avaliadas em ordem):
 *   1. nivel >= 7 (Admin Master) → vê tudo
 *   2. nivel < minNivel           → oculto
 *   3. departamentos === null      → global, sempre visível
 *   4. nivel >= 6 (Diretor)       → vê todos os módulos
 *   5. departamento do usuário está na lista → visível
 */
const MENU_ITEMS = [
  { id: 'dashboard',  icon: '▦',  labelKey: 'dashboard',  href: '/pages/dashboard.html',        minNivel: 0, departamentos: null },
  { id: 'manutencao', icon: '🔧', labelKey: 'manutencao', href: '/pages/manutencao/index.html', minNivel: 0, departamentos: null },
  { id: 'admin',      icon: '⚙',  labelKey: 'admin',      href: '/pages/admin/index.html',      minNivel: 7, departamentos: null },
];

/**
 * Decides whether a menu item is visible to a user.
 * @param {object} item     Menu item from MENU_ITEMS
 * @param {number} nivel    User's nivel_acesso
 * @param {string} dept     User's departamento name
 * @returns {boolean}
 */
function _canSeeItem(item, nivel, dept) {
  if (!_isModuleEnabled(item.id)) return false;   // feature flag desabilitada
  if (nivel >= 7) return true;                    // Admin Master vê tudo
  if (nivel < item.minNivel) return false;         // nível insuficiente
  if (item.departamentos === null) return true;    // item global
  if (nivel >= 6) return true;                    // Diretor vê todos os setores
  return item.departamentos.includes(dept);        // restrição por setor
}

// ── renderSidebar ─────────────────────────────────────────────────────────────
/**
 * Renders the sidebar into #sidebar-container (or creates it inside .app-layout).
 * Feature flags are applied via _isModuleEnabled() inside _canSeeItem().
 * @param {string} activeMenu  id of the active menu item
 */
function renderSidebar(activeMenu) {
  const user  = API.getUser();
  const nivel = user ? (user.nivel_acesso  || 0) : 0;
  const dept  = user ? (user.departamento  || '') : '';

  const visibleItems = MENU_ITEMS.filter(item => _canSeeItem(item, nivel, dept));

  const itemsHtml = visibleItems.map(item => {
    const isActive = item.id === activeMenu ? ' active' : '';
    return `
      <a href="${item.href}" class="sidebar-item${isActive}" data-menu="${item.id}">
        <span class="sidebar-item-icon">${item.icon}</span>
        <span class="sidebar-item-text">${t(item.labelKey)}</span>
      </a>
    `;
  }).join('');

  const html = `
    <aside class="sidebar" id="app-sidebar">
      <div class="sidebar-logo">
        <img src="/assets/img/logo.png" alt="" class="sidebar-logo-img-icon" />
        <div>
          <img src="/assets/img/tecnobloco.png" alt="Tecnobloco" class="sidebar-logo-img-text" />
          <div class="sidebar-logo-sub">Gestão Industrial</div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-label">Módulos</div>
        <nav class="sidebar-menu">
          ${itemsHtml}
        </nav>
      </div>
      <div class="sidebar-footer">
        <div class="server-status" id="sidebar-server-status">
          <span class="status-dot checking" id="status-dot"></span>
          <span id="status-text">Verificando...</span>
        </div>
      </div>
    </aside>
  `;

  let container = document.getElementById('sidebar-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sidebar-container';
    document.body.insertAdjacentElement('afterbegin', container);
  }
  container.innerHTML = html;
}

// ── renderTopbar ──────────────────────────────────────────────────────────────
/**
 * Renders the topbar into #topbar-container.
 * @param {string}   title      Page title shown in topbar
 * @param {string[]} breadcrumb Array of breadcrumb labels
 */
function renderTopbar(title, breadcrumb) {
  const user = API.getUser();
  // Escapa todos os dados de usuário antes de inserir em innerHTML
  const displayName = escapeHtml(user ? (user.nome || user.email || 'Usuário') : 'Usuário');
  const initials    = displayName.replace(/&\w+;/g, '').trim()
                        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  // user.departamento é o campo correto retornado pela API (user.cargo e user.setor não existem)
  const role = escapeHtml(user ? (user.departamento || '') : '');

  const lang = getLang();
  const isDark = !document.body.classList.contains('theme-light');

  const crumbHtml = (breadcrumb || []).map(b => `<span>${b}</span>`).join('');

  const html = `
    <header class="topbar" id="app-topbar">
      <div class="topbar-left">
        <div class="topbar-title">${title || 'Tecnobloco'}</div>
        ${crumbHtml ? `<div class="topbar-breadcrumb">${crumbHtml}</div>` : ''}
      </div>
      <div class="topbar-actions">
        <select class="lang-select" id="lang-switcher" title="Idioma / Language">
          <option value="pt" ${lang === 'pt' ? 'selected' : ''}>PT</option>
          <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
          <option value="es" ${lang === 'es' ? 'selected' : ''}>ES</option>
        </select>
        <button class="topbar-btn" id="theme-toggle" title="${isDark ? t('theme_light') : t('theme_dark')}">
          ${isDark ? '☀' : '🌙'}
        </button>
        <div class="notif-wrap">
          <button class="topbar-btn notif-btn" id="notif-btn" title="Notificações" style="position:relative;">
            🔔
            <span class="notif-badge" id="notif-count" style="display:none;">0</span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-dropdown-header">Notificações</div>
            <div class="notif-dropdown-list" id="notif-dropdown-list">
              <div class="notif-dropdown-empty">Carregando...</div>
            </div>
          </div>
        </div>
        <button class="topbar-btn" id="sidebar-toggle" title="Menu">☰</button>
        <div class="topbar-user" id="user-menu-toggle" title="${displayName}">
          ${user && user.foto_url
            ? `<img src="${escapeHtml(user.foto_url)}" class="topbar-avatar topbar-avatar-photo" alt="${displayName}" onerror="this.style.display='none';document.getElementById('topbar-avatar-fallback').style.display='flex';" /><div class="topbar-avatar" id="topbar-avatar-fallback" style="display:none;">${initials}</div>`
            : `<div class="topbar-avatar" id="topbar-avatar-fallback">${initials}</div>`}
          <div>
            <div class="topbar-username">${displayName}</div>
            ${role ? `<div class="topbar-role">${role}</div>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="logout-btn" title="${t('logout')}">
          ⏏ ${t('logout')}
        </button>
      </div>
    </header>
  `;

  let container = document.getElementById('topbar-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'topbar-container';
    // Insert after sidebar container or at start of body
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) {
      sidebar.insertAdjacentElement('afterend', container);
    } else {
      document.body.insertAdjacentElement('afterbegin', container);
    }
  }
  container.innerHTML = html;

  // ── Topbar event listeners ──────────────────────────────────
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await API.logout(); // chama o endpoint de logout (auditoria) e redireciona
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('theme-light');
    const isLight = document.body.classList.contains('theme-light');
    localStorage.setItem('tb_theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = isLight ? '🌙' : '☀';
    document.getElementById('theme-toggle').title = isLight ? t('theme_dark') : t('theme_light');
  });

  document.getElementById('lang-switcher').addEventListener('change', (e) => {
    localStorage.setItem('tb_lang', e.target.value);
    window.location.reload();
  });

  // ── Hamburger / sidebar toggle ──────────────────────────────
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      const isMobile = window.innerWidth <= 767;
      if (isMobile) {
        const sidebar  = document.getElementById('app-sidebar');
        const overlay  = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  // ── Notification bell dropdown ───────────────────────────────
  const notifBtn      = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifDropdown.classList.toggle('open');
      if (isOpen) _loadNotifDropdown();
    });
    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('open');
      }
    });
    _pollNotifCount();
  }

  // ── User profile modal ───────────────────────────────────────
  const userToggle = document.getElementById('user-menu-toggle');
  if (userToggle) {
    userToggle.addEventListener('click', _openProfileModal);
  }
}

function _pollNotifCount() {
  async function check() {
    try {
      const data   = await API.get('/dashboard/alerts');
      const alerts = (Array.isArray(data) ? data : (data.items || [])).filter(a => a.tipo !== 'success');
      const badge  = document.getElementById('notif-count');
      if (!badge) return;
      if (alerts.length > 0) {
        badge.textContent = alerts.length > 99 ? '99+' : alerts.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    } catch { /* silent */ }
  }
  check();
  setInterval(check, 30000);
}

// ── Notification dropdown loader ──────────────────────────────────────────────
async function _loadNotifDropdown() {
  const listEl = document.getElementById('notif-dropdown-list');
  if (!listEl) return;
  try {
    const data   = await API.get('/dashboard/alerts');
    const alerts = (Array.isArray(data) ? data : (data.items || data.data || [])).filter(a => a.tipo !== 'success');
    if (!alerts.length) {
      listEl.innerHTML = '<div class="notif-dropdown-empty">Nenhuma notificação pendente</div>';
      return;
    }
    listEl.innerHTML = alerts.slice(0, 10).map(a => `
      <div class="notif-dropdown-item">
        <div style="font-weight:500;color:var(--text-primary);font-size:12px;">${escapeHtml(a.titulo || a.message || a.tipo || 'Alerta')}</div>
        ${(a.descricao || a.detail) ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(a.descricao || a.detail)}</div>` : ''}
      </div>
    `).join('');
  } catch {
    listEl.innerHTML = '<div class="notif-dropdown-empty">Sem notificações</div>';
  }
}

// ── User profile modal ─────────────────────────────────────────────────────────
function _openProfileModal() {
  const user = API.getUser();
  if (!user) return;

  const initials = (user.nome || '?').replace(/&\w+;/g, '').trim()
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const NIVEL_LABEL = ['Menor Aprendiz','Auxiliar','Técnico','Pleno','Sênior','Especialista','Diretor','Admin'];
  const nivelLabel  = NIVEL_LABEL[user.nivel_acesso] || `Nível ${user.nivel_acesso}`;

  const modal = openModal({
    title: 'Meu Perfil',
    size:  'sm',
    body: `
      <div style="text-align:center;margin-bottom:var(--space-5);">
        <div style="position:relative;display:inline-block;margin-bottom:var(--space-3);">
          ${user.foto_url
            ? `<img src="${escapeHtml(user.foto_url)}" id="profile-foto-preview" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--color-primary);display:block;" alt="foto" />`
            : `<div class="topbar-avatar" id="profile-foto-preview" style="width:80px;height:80px;font-size:28px;margin:0;">${initials}</div>`}
          <label for="profile-foto-input" style="position:absolute;bottom:0;right:-4px;background:var(--color-primary);border-radius:50%;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.3);" title="Alterar foto">📷</label>
          <input type="file" id="profile-foto-input" accept="image/jpeg,image/png,image/webp" style="display:none;" />
        </div>
        <div style="font-size:var(--font-size-sm);color:var(--text-muted);">${escapeHtml(user.departamento || '')} — ${nivelLabel}</div>
        <div id="profile-foto-status" style="font-size:11px;color:var(--text-muted);margin-top:4px;"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input type="text" class="form-control" id="profile-nome" value="${escapeHtml(user.nome || '')}" maxlength="100" />
      </div>
      <div class="form-group">
        <label class="form-label">E-mail / CPF</label>
        <input type="text" class="form-control" value="${escapeHtml(user.email || user.cpf || '')}" disabled />
      </div>
      <div style="border-top:1px solid var(--border-color);margin:var(--space-4) 0;padding-top:var(--space-4);">
        <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3);">Alterar senha</div>
        <div class="form-group">
          <label class="form-label">Senha atual</label>
          <input type="password" class="form-control" id="profile-senha-atual" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <div class="form-group">
          <label class="form-label">Nova senha</label>
          <input type="password" class="form-control" id="profile-nova-senha" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
        </div>
      </div>
      <div id="profile-error" style="display:none;" class="alert alert-danger"><span class="alert-icon">⚠</span><span id="profile-error-text"></span></div>
    `,
    footer: `
      <button class="btn btn-secondary" id="profile-cancel-btn">Cancelar</button>
      <button class="btn btn-primary" id="profile-save-btn">Salvar</button>
    `,
  });

  modal.el.querySelector('#profile-cancel-btn').addEventListener('click', modal.close);

  // ── Foto de perfil ──────────────────────────────────────────────
  modal.el.querySelector('#profile-foto-input').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const statusEl = modal.el.querySelector('#profile-foto-status');
    statusEl.textContent = 'Enviando foto...';

    // Preview imediato
    const reader = new FileReader();
    reader.onload = (ev) => {
      const prev = modal.el.querySelector('#profile-foto-preview');
      if (prev.tagName === 'IMG') {
        prev.src = ev.target.result;
      } else {
        const img = document.createElement('img');
        img.id = 'profile-foto-preview';
        img.src = ev.target.result;
        img.style.cssText = 'width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--color-primary);display:block;';
        img.alt = 'foto';
        prev.replaceWith(img);
      }
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('foto', file);
    const token = API.getToken();
    const base  = API.getBase();
    try {
      const res  = await fetch(`${base}/auth/profile/foto`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao enviar foto');

      const stored = API.getUser();
      if (stored) {
        stored.foto_url = data.data.foto_url;
        localStorage.setItem('tb_user', JSON.stringify(stored));
      }
      // Atualiza avatar na topbar sem reload
      const topbarAvatar = document.querySelector('#user-menu-toggle .topbar-avatar, #user-menu-toggle .topbar-avatar-photo');
      if (topbarAvatar) {
        const img = document.createElement('img');
        img.src = data.data.foto_url;
        img.className = 'topbar-avatar topbar-avatar-photo';
        img.style.cssText = 'object-fit:cover;';
        img.alt = '';
        topbarAvatar.replaceWith(img);
      }
      statusEl.textContent = '✓ Foto atualizada';
      showToast('Foto de perfil atualizada!', 'success');
    } catch (err) {
      statusEl.textContent = '⚠ Erro: ' + (err.message || 'falha no upload');
    }
    this.value = '';
  });

  modal.el.querySelector('#profile-save-btn').addEventListener('click', async () => {
    const nome       = (modal.el.querySelector('#profile-nome').value || '').trim();
    const senhaAtual = modal.el.querySelector('#profile-senha-atual').value;
    const novaSenha  = modal.el.querySelector('#profile-nova-senha').value;
    const errorBox   = modal.el.querySelector('#profile-error');
    const errorText  = modal.el.querySelector('#profile-error-text');
    const saveBtn    = modal.el.querySelector('#profile-save-btn');

    function showErr(msg) {
      errorText.textContent = msg;
      errorBox.style.display = 'flex';
    }
    errorBox.style.display = 'none';

    if (!nome) { showErr('Informe o nome.'); return; }

    saveBtn.disabled = true;
    try {
      let changed = false;

      if (nome !== user.nome) {
        const r = await API.put('/auth/profile', { nome });
        if (!r.success) throw new Error(r.message || 'Erro ao salvar nome');
        const stored = API.getUser();
        if (stored) { stored.nome = nome; localStorage.setItem('tb_user', JSON.stringify(stored)); }
        changed = true;
      }

      if (novaSenha) {
        if (!senhaAtual) { showErr('Informe a senha atual para alterar a senha.'); return; }
        const r = await API.put('/auth/alterar-senha', { senhaAtual, novaSenha });
        if (!r.success) throw new Error(r.message || 'Erro ao alterar senha');
        changed = true;
      }

      modal.close();
      if (changed) showToast('Perfil atualizado com sucesso', 'success');

    } catch (err) {
      showErr(err.message || 'Erro ao salvar');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ── initPage ──────────────────────────────────────────────────────────────────
/**
 * Must be called at the top of every protected page.
 * Checks authentication, renders sidebar + topbar, applies saved theme.
 *
 * @param {object} config
 * @param {string}   config.title       Page title
 * @param {string[]} config.breadcrumb  Breadcrumb labels
 * @param {number}   config.requireNivel Minimum nivel_acesso required (default 0)
 * @param {string}   config.activeMenu  Active sidebar menu id
 * @param {Function} config.onReady     Callback after init completes
 */
function initPage(config) {
  config = config || {};

  // Apply saved theme before render to avoid flash
  const savedTheme = localStorage.getItem('tb_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('theme-light');
  }

  // Authentication guard
  if (!API.isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  // nivel_acesso guard
  const minNivel  = typeof config.requireNivel === 'number' ? config.requireNivel : 0;
  const user      = API.getUser();
  const userNivel = user ? (user.nivel_acesso  || 0) : 0;
  const userDept  = user ? (user.departamento  || '') : '';

  if (userNivel < minNivel) {
    _renderAccessDenied();
    return;
  }

  // department guard — omit config.departamentos to skip this check
  if (config.departamentos && Array.isArray(config.departamentos)) {
    if (userNivel < 6 && !config.departamentos.includes(userDept)) {
      _renderAccessDenied('Esta área é restrita ao setor responsável.');
      return;
    }
  }

  // Set document title
  if (config.title) {
    document.title = `${config.title} — Tecnobloco`;
  }

  // Carrega feature flags do backend e só então renderiza a sidebar
  _loadFeatureFlags().then(() => {
    renderSidebar(config.activeMenu || '');
    renderTopbar(config.title || 'Tecnobloco', config.breadcrumb || []);

    // Mobile sidebar overlay
    if (!document.getElementById('sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', () => {
        overlay.classList.remove('open');
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.remove('open');
      });
      document.body.appendChild(overlay);
    }

    // Start server status polling
    _startHealthPoll();

    // Start periodic security challenge (300s interval)
    _startSecurityChallenge();

    if (typeof config.onReady === 'function') {
      config.onReady(user);
    }
  });
}

// ── Access denied screen ──────────────────────────────────────────────────────
function _renderAccessDenied(msg) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                flex-direction:column;gap:16px;color:#94a3b8;padding:24px;text-align:center;">
      <span style="font-size:52px;">🔒</span>
      <h2 style="margin:0;color:#e2e8f0;">${t('no_access')}</h2>
      ${msg ? `<p style="font-size:14px;color:#64748b;margin:0;">${msg}</p>` : ''}
      <a href="/pages/dashboard.html" style="color:#7c3aed;font-size:14px;">← Dashboard</a>
    </div>`;
}

// ── Quick actions (dashboard) ─────────────────────────────────────────────────
/**
 * Renders module shortcut buttons into a container element.
 * Skips 'dashboard' and 'admin' entries (not useful as quick-action cards).
 * @param {string} containerId  ID of the target element
 */
function renderQuickActions(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user  = API.getUser();
  const nivel = user ? (user.nivel_acesso || 0) : 0;
  const dept  = user ? (user.departamento || '') : '';

  const items = MENU_ITEMS.filter(item =>
    item.id !== 'dashboard' &&
    item.id !== 'admin' &&
    _canSeeItem(item, nivel, dept)
  );

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:32px 16px;">
        <span class="empty-state-icon">🔒</span>
        <span class="empty-state-title">Nenhum módulo disponível para o seu setor.</span>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <a href="${item.href}" class="quick-action-btn">
      <span class="quick-action-icon">${item.icon}</span>
      <span>${t(item.labelKey)}</span>
    </a>
  `).join('');
}

// ── Health polling ────────────────────────────────────────────────────────────
let _healthTimer = null;

function _startHealthPoll() {
  async function check() {
    const dot  = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot) return;

    dot.className = 'status-dot checking';
    const ok = await API.health();
    dot.className = `status-dot ${ok ? 'online' : 'offline'}`;
    if (text) text.textContent = ok ? 'Online' : 'Offline';
  }

  check();
  if (_healthTimer) clearInterval(_healthTimer);
  _healthTimer = setInterval(check, 60000);
}

// ── Toast notifications ───────────────────────────────────────────────────────
(function _ensureToastContainer() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ensureToastContainer);
    return;
  }
  if (!document.getElementById('toast-container')) {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
})();

const TOAST_ICONS = {
  success: '✔',
  danger:  '✖',
  error:   '✖',
  warning: '⚠',
  info:    'ℹ',
};

/**
 * Displays a toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'warning'|'info'} type
 * @param {number} duration  Auto-dismiss delay in ms (default 4000)
 */
function showToast(message, type, duration) {
  type = type || 'info';
  if (type === 'error') type = 'danger';
  duration = duration || 4000;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const icon = TOAST_ICONS[type] || 'ℹ';

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg"></span>
    <button class="toast-close" aria-label="Fechar">✕</button>
  `;
  // textContent prevents XSS: message may come from server responses
  toast.querySelector('.toast-msg').textContent = message;

  toast.querySelector('.toast-close').addEventListener('click', () => _dismissToast(toast));

  container.appendChild(toast);

  const timer = setTimeout(() => _dismissToast(toast), duration);
  toast._dismissTimer = timer;
}

function _dismissToast(toast) {
  clearTimeout(toast._dismissTimer);
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(30px)';
  toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  setTimeout(() => toast.remove(), 260);
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
/**
 * Shows a modal confirm dialog.
 * @param {string} message
 * @param {object} [opts]
 * @param {string} [opts.title]
 * @param {string} [opts.confirmLabel]
 * @param {string} [opts.cancelLabel]
 * @param {'danger'|'primary'} [opts.confirmType]
 * @returns {Promise<boolean>}
 */
function showConfirm(message, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop modal-overlay';

    backdrop.innerHTML = `
      <div class="modal modal-sm" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${opts.title || t('confirm_title')}</h3>
          <button class="modal-close" id="confirm-close" aria-label="Fechar">✕</button>
        </div>
        <div class="modal-body confirm-dialog">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-cancel">${opts.cancelLabel || t('confirm_no')}</button>
          <button class="btn btn-${opts.confirmType || 'primary'}" id="confirm-ok">${opts.confirmLabel || t('confirm_yes')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    function close(result) {
      backdrop.remove();
      resolve(result);
    }

    backdrop.querySelector('#confirm-ok').addEventListener('click',     () => close(true));
    backdrop.querySelector('#confirm-cancel').addEventListener('click', () => close(false));
    backdrop.querySelector('#confirm-close').addEventListener('click',  () => close(false));

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(false);
    });

    // Close on Escape
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close(false);
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);

    // Focus confirm button
    setTimeout(() => backdrop.querySelector('#confirm-ok').focus(), 50);
  });
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
/**
 * Opens a generic modal.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.body    HTML content for modal body
 * @param {string} [opts.size]  'sm' | '' | 'lg' | 'xl'
 * @param {string} [opts.footer] HTML for modal footer
 * @returns {{ el: HTMLElement, setFooter: Function, close: Function }}
 */
function openModal(opts) {
  opts = opts || {};
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop modal-overlay';

  const sizeClass = opts.size ? ` modal-${opts.size}` : '';

  backdrop.innerHTML = `
    <div class="modal${sizeClass}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">${opts.title || ''}</h3>
        <button class="modal-close" id="modal-close-btn" aria-label="Fechar">✕</button>
      </div>
      <div class="modal-body">${opts.body || ''}</div>
      <div class="modal-footer"${opts.footer ? '' : ' style="display:none"'}>${opts.footer || ''}</div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const bodyEl   = backdrop.querySelector('.modal-body');
  const footerEl = backdrop.querySelector('.modal-footer');

  // Allow callers to find elements anywhere in the modal (body OR footer)
  // without needing a separate reference to the backdrop.
  bodyEl.querySelector    = sel => backdrop.querySelector(sel);
  bodyEl.querySelectorAll = sel => backdrop.querySelectorAll(sel);

  function close() { backdrop.remove(); }

  function setFooter(html) {
    footerEl.innerHTML = html;
    footerEl.style.display = '';
  }

  backdrop.querySelector('#modal-close-btn').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  return { el: bodyEl, setFooter, close };
}

// ── Security Challenge (silent auto-solve) ────────────────────────────────────
/**
 * A cada 300s, busca um desafio ROT-N do servidor, resolve automaticamente
 * (sem interação do usuário) e envia a resposta. O usuário não vê nada.
 * Falha de conexão → logout forçado por segurança.
 */
const CHALLENGE_INTERVAL_S = 300;

let _challengeTimer  = null;
let _challengeActive = false;

/** Inverte a cifra ROT-N: rotaciona shift posições para trás */
function _rotNDecode(str, shift) {
  return str.split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
    }
    return ch;
  }).join('');
}

function _startSecurityChallenge() {
  if (_challengeTimer) clearInterval(_challengeTimer);
  _challengeActive = false;
  _challengeTimer = setInterval(_triggerChallenge, CHALLENGE_INTERVAL_S * 1000);
}

function _stopSecurityChallenge() {
  if (_challengeTimer) clearInterval(_challengeTimer);
  _challengeTimer = null;
}

async function _triggerChallenge() {
  if (_challengeActive) return;
  _challengeActive = true;
  try {
    const data = await API.getChallenge();
    if (!data?.success || !data.challengeId) { await API.logout(); return; }

    // Resolve o desafio automaticamente — sem modal, sem interação
    const answer = _rotNDecode(data.encoded, data.shift);
    const result = await API.verifyChallenge(data.challengeId, answer);

    if (!result?.success && result?.forceLogout) {
      await API.logout();
      return;
    }
    // Sucesso silencioso — reinicia o ciclo
    _startSecurityChallenge();
  } catch (err) {
    // Só força logout em erro de rede real (TypeError), não em erros de servidor (ex: rate limit)
    if (err && err.name === 'TypeError') {
      _stopSecurityChallenge();
      await API.logout();
    }
    // Erros de servidor (429, 5xx) são ignorados — o ciclo continua
  } finally {
    _challengeActive = false;
  }
}

// ── v4 UI Component Helpers ───────────────────────────────────────────────────

/**
 * initTabNav(containerEl)
 * Activates tab navigation within a given container. Looks for .tab-item
 * buttons and corresponding .tab-pane[data-tab] elements.
 * Can be called after rendering modal content.
 */
function initTabNav(container) {
  const nav = container.querySelector('.tab-nav');
  if (!nav) return;
  const items = nav.querySelectorAll('.tab-item');
  const panes = container.querySelectorAll('.tab-pane');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.tab;
      items.forEach(i => i.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const pane = container.querySelector(`.tab-pane[data-tab="${target}"]`);
      if (pane) pane.classList.add('active');
    });
  });
}

/**
 * initScoreGroup(containerEl)
 * Activates .score-group within a container. Score buttons toggle .active
 * and write the value to a hidden input with the same name.
 */
function initScoreGroup(container) {
  container.querySelectorAll('.score-group').forEach(group => {
    const hidden = group.querySelector('input[type="hidden"]');
    group.querySelectorAll('.score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (hidden) hidden.value = btn.dataset.val || btn.textContent.trim();
      });
    });
  });
}

/**
 * initAccordions(containerEl)
 * Activates .accordion toggle/body behaviour inside a container.
 */
function initAccordions(container) {
  container.querySelectorAll('.accordion-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const acc = toggle.closest('.accordion');
      if (acc) acc.classList.toggle('open');
    });
  });
}

/**
 * initComponents(containerEl)
 * Convenience: initialises all v4 interactive components inside a container.
 * Call once after inserting modal content.
 */
function initComponents(container) {
  if (!container) return;
  initTabNav(container);
  initScoreGroup(container);
  initAccordions(container);
}

// ── Exports (global) ──────────────────────────────────────────────────────────
// All functions are exposed globally so page scripts can call them directly.
window.escapeHtml        = escapeHtml;
window.MENU_ITEMS        = MENU_ITEMS;
window.initPage          = initPage;
window.renderSidebar     = renderSidebar;
window.renderTopbar      = renderTopbar;
window.renderQuickActions = renderQuickActions;
window.showToast         = showToast;
window.showConfirm       = showConfirm;
window.openModal         = openModal;
window.t                 = t;
window.getLang           = getLang;
window.initTabNav        = initTabNav;
window.initScoreGroup    = initScoreGroup;
window.initAccordions    = initAccordions;
window.initComponents    = initComponents;

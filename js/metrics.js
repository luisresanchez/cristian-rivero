/* ============================================================
   METRICS — localStorage storage, admin panel, live update
   ============================================================ */

const METRICS_KEY = 'cr_metrics_v2';
const ADMIN_PASSWORD = 'rattoproduction2025';

const DEFAULT_METRICS = {
  yt_views:    '17.7M',
  yt_subs:     '150K',
  yt_90days:   '3.8M',
  yt_daily:    '42K',

  ig_followers: '16K',
  ig_views:     '371.3K',
  ig_interact:  '7,397',
  ig_nonfol:    '96.3%',

  tk_followers: '100K',
  tk_postviews: '7M',
  tk_likes:     '195K',
  tk_shares:    '7,399',

  fb_followers: '13K',
  fb_reach:     '1.2M',
  fb_interact:  '45K',
  fb_posts:     '120/mes',

  hero_yt_stat: '17.7M vistas',
  hero_tk_stat: '100K seguidores',
};

function loadMetrics() {
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    return stored ? { ...DEFAULT_METRICS, ...JSON.parse(stored) } : { ...DEFAULT_METRICS };
  } catch {
    return { ...DEFAULT_METRICS };
  }
}

function saveMetrics(data) {
  localStorage.setItem(METRICS_KEY, JSON.stringify(data));
}

function renderMetrics(metrics) {
  const fields = Object.keys(DEFAULT_METRICS);
  fields.forEach(key => {
    const els = document.querySelectorAll(`[data-metric="${key}"]`);
    els.forEach(el => {
      el.textContent = metrics[key];
    });
  });
}

/* ── Admin modal logic ── */
let adminUnlocked = false;

function openAdminModal() {
  const overlay = document.getElementById('admin-modal');
  if (!overlay) return;
  overlay.classList.add('open');
  adminUnlocked = false;

  const pwStep  = document.getElementById('admin-pw-step');
  const content = document.getElementById('admin-content');
  if (pwStep)  pwStep.style.display  = 'block';
  if (content) content.style.display = 'none';

  const pwInput = document.getElementById('admin-pw-input');
  if (pwInput) {
    pwInput.value = '';
    setTimeout(() => pwInput.focus(), 120);
  }

  document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
  const overlay = document.getElementById('admin-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function unlockAdmin() {
  const pwInput = document.getElementById('admin-pw-input');
  if (!pwInput) return;

  if (pwInput.value === ADMIN_PASSWORD) {
    adminUnlocked = true;
    populateAdminForm();
    document.getElementById('admin-pw-step').style.display  = 'none';
    document.getElementById('admin-content').style.display  = 'block';
  } else {
    showToast('Contraseña incorrecta', 'error');
    pwInput.value = '';
    pwInput.focus();
    closeAdminModal();
  }
}

function populateAdminForm() {
  const metrics = loadMetrics();
  Object.keys(DEFAULT_METRICS).forEach(key => {
    const input = document.getElementById(`admin-${key}`);
    if (input) input.value = metrics[key] ?? '';
  });
}

function saveAdminForm() {
  const metrics = loadMetrics();
  Object.keys(DEFAULT_METRICS).forEach(key => {
    const input = document.getElementById(`admin-${key}`);
    if (input) metrics[key] = input.value.trim() || metrics[key];
  });
  saveMetrics(metrics);
  renderMetrics(metrics);
  closeAdminModal();
  showToast('Métricas actualizadas ✓', 'success');
}

/* ── Tab switching ── */
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));

  const tab   = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
  const panel = document.getElementById(`panel-${tabName}`);
  if (tab)   tab.classList.add('active');
  if (panel) panel.classList.add('active');
}

/* ── Toast utility ── */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = `toast toast--${type}`;
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── Wire up events after DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  const metrics = loadMetrics();
  renderMetrics(metrics);

  const adminBtn = document.getElementById('admin-trigger');
  if (adminBtn) adminBtn.addEventListener('click', openAdminModal);

  const closeBtn = document.getElementById('admin-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeAdminModal);

  const overlay = document.getElementById('admin-modal');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAdminModal();
    });
  }

  const unlockBtn = document.getElementById('admin-unlock-btn');
  if (unlockBtn) unlockBtn.addEventListener('click', unlockAdmin);

  const pwInput = document.getElementById('admin-pw-input');
  if (pwInput) {
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') unlockAdmin();
    });
  }

  const saveBtn = document.getElementById('admin-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveAdminForm);

  const cancelBtn = document.getElementById('admin-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', closeAdminModal);

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
  });

  const metricsBtns = document.querySelectorAll('[data-action="open-admin"]');
  metricsBtns.forEach(btn => btn.addEventListener('click', openAdminModal));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminModal();
  });
});

window.showToast = showToast;

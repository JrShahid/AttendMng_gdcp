/* ─────────────────────────────────────
   ui.js — UI Helpers (Nav, Tabs, Toast)
   ───────────────────────────────────── */

/* ── Page Navigation ── */
function goPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name)?.classList.add('active');

  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');

  // Lazy-load reports when that page is opened
  if (name === 'reports') loadReports();
}

/* ── Tab switching inside a page ── */
function switchTab(el, targetId) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  ['rAll', 'rRisk', 'rGood'].forEach(id => {
    document.getElementById(id)?.classList.toggle('hidden', id !== targetId);
  });
}

/* ── Toast Notification ── */
function toast(message, type = 'success') {
  const t = document.createElement('div');
  t.className   = `toast toast-${type}`;
  t.textContent = (type === 'success' ? '✓ ' : '✕ ') + message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

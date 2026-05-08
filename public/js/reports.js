/* ─────────────────────────────────────
   reports.js — Attendance Reports
   ───────────────────────────────────── */

/* ── Fetch and render all report tabs ── */
async function loadReports() {
  const { data, error } = await sb.from('attendance_summary').select('*');

  if (error) {
    console.error('loadReports:', error.message);
    ['reportTableWrap','riskTableWrap','goodTableWrap'].forEach(id => {
      document.getElementById(id).innerHTML = '<div class="empty">Failed to load data.</div>';
    });
    return;
  }

  // Aggregate per student (sum across subjects)
  const map = {};
  (data || []).forEach(r => {
    if (!map[r.student_id]) {
      map[r.student_id] = {
        id: r.student_id, name: r.full_name,
        roll: r.roll_number, section: r.section,
        total: 0, present: 0
      };
    }
    map[r.student_id].total   += parseInt(r.total_classes) || 0;
    map[r.student_id].present += parseInt(r.present_count) || 0;
  });

  const rows = Object.values(map)
    .map(s => ({ ...s, pct: s.total ? Math.round(s.present / s.total * 100) : 0 }))
    .sort((a, b) => (a.roll || '').localeCompare(b.roll || ''));

  renderAllTable(rows);
  renderRiskTable(rows.filter(r => r.pct < 75));
  renderGoodTable(rows.filter(r => r.pct >= 85));
}

/* ── All Students Table ── */
function renderAllTable(rows) {
  const el = document.getElementById('reportTableWrap');
  if (!rows.length) { el.innerHTML = '<div class="empty">No attendance data yet.</div>'; return; }

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>Roll No</th><th>Name</th><th>Section</th><th>Classes</th><th>Present</th><th>%</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td style="font-family:monospace;font-size:13px">${r.roll || '—'}</td>
            <td>${r.name}</td>
            <td><span class="badge badge-blue">Sec ${r.section || '—'}</span></td>
            <td>${r.total}</td>
            <td>${r.present}</td>
            <td><strong>${r.pct}%</strong></td>
            <td>
              <span class="badge ${statusBadgeClass(r.pct)}">${statusLabel(r.pct)}</span>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── At-Risk Table ── */
function renderRiskTable(rows) {
  const el = document.getElementById('riskTableWrap');
  if (!rows.length) { el.innerHTML = '<div class="empty">No at-risk students. Great!</div>'; return; }

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>Roll No</th><th>Name</th><th>%</th><th>Classes Missed</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${rows.sort((a, b) => a.pct - b.pct).map(r => `
          <tr>
            <td style="font-family:monospace;font-size:13px">${r.roll || '—'}</td>
            <td>${r.name}</td>
            <td style="color:var(--danger);font-weight:600">${r.pct}%</td>
            <td>${r.total - r.present} classes</td>
            <td>
              <button class="btn btn-outline btn-sm"
                onclick="aiQ('Draft a formal warning letter for ${r.name} (Roll: ${r.roll || 'N/A'}) who has only ${r.pct}% attendance this semester.');goPage('ai',null)">
                Draft Letter ↗
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── Good Standing Table ── */
function renderGoodTable(rows) {
  const el = document.getElementById('goodTableWrap');
  if (!rows.length) { el.innerHTML = '<div class="empty">No students above 85% yet.</div>'; return; }

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>Roll No</th><th>Name</th><th>Section</th><th>%</th><th>Award</th></tr>
      </thead>
      <tbody>
        ${rows.sort((a, b) => b.pct - a.pct).map(r => `
          <tr>
            <td style="font-family:monospace;font-size:13px">${r.roll || '—'}</td>
            <td>${r.name}</td>
            <td><span class="badge badge-blue">Sec ${r.section || '—'}</span></td>
            <td style="color:var(--success);font-weight:600">${r.pct}%</td>
            <td><span class="badge badge-green">${r.pct >= 95 ? '🏆 Perfect' : '⭐ Outstanding'}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── Helpers ── */
function statusBadgeClass(pct) {
  if (pct >= 85) return 'badge-green';
  if (pct >= 75) return 'badge-blue';
  if (pct >= 65) return 'badge-amber';
  return 'badge-red';
}

function statusLabel(pct) {
  if (pct >= 85) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 65) return 'Warning';
  return 'At Risk';
}

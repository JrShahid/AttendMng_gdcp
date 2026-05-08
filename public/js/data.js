/* ─────────────────────────────────────
   data.js — Supabase Data Fetching
   ───────────────────────────────────── */

let allStudents = [];
let subjects    = [];

/* ── Load all subjects ── */
async function loadSubjects() {
  const { data, error } = await sb.from('subjects').select('*').order('name');
  if (error) { console.error('loadSubjects:', error.message); return; }

  subjects = data || [];
  const sel = document.getElementById('subjectSel');
  sel.innerHTML = subjects.length
    ? subjects.map(s => `<option value="${s.id}">${s.name} (Sec ${s.section})</option>`).join('')
    : '<option value="">No subjects found</option>';

  if (subjects.length) updateAttInfo();
}

/* ── Load all students ── */
async function loadStudents() {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('roll_number');

  if (error) { console.error('loadStudents:', error.message); return; }

  allStudents = data || [];
  document.getElementById('studentCount').textContent = `${allStudents.length} enrolled students`;
  document.getElementById('statStudents').textContent  = allStudents.length;
  renderStudentsTable(allStudents);
  loadAttGrid();
}

/* ── Load dashboard stats ── */
async function loadStats() {
  const { data, error } = await sb.from('attendance_summary').select('*');
  if (error || !data?.length) {
    ['statAvg','statRisk','statToday'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    return;
  }

  // Aggregate per student
  const byStudent = {};
  data.forEach(r => {
    if (!byStudent[r.student_id]) byStudent[r.student_id] = { total: 0, present: 0 };
    byStudent[r.student_id].total   += parseInt(r.total_classes)  || 0;
    byStudent[r.student_id].present += parseInt(r.present_count)  || 0;
  });

  const pcts  = Object.values(byStudent).map(s => s.total ? Math.round(s.present / s.total * 100) : 0);
  const avg   = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const risk  = pcts.filter(p => p < 75).length;
  const today = new Date().toLocaleDateString('en', { weekday: 'short' });

  document.getElementById('statAvg').textContent   = avg + '%';
  document.getElementById('statRisk').textContent  = risk;
  document.getElementById('statToday').textContent = today;
}

/* ── Load recent attendance (today) ── */
async function loadRecentAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await sb
    .from('attendance')
    .select('*, profiles!attendance_student_id_fkey(full_name, roll_number), subjects(name)')
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(20);

  const el = document.getElementById('recentTable');
  if (error || !data?.length) {
    el.innerHTML = '<div class="empty">No attendance marked today yet.</div>';
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Student</th><th>Subject</th><th>Status</th></tr></thead>
      <tbody>
        ${data.map(r => `
          <tr>
            <td>
              ${r.profiles?.full_name || '—'}
              <span style="color:var(--muted);font-size:12px"> ${r.profiles?.roll_number || ''}</span>
            </td>
            <td>${r.subjects?.name || '—'}</td>
            <td>
              <span class="badge ${r.status === 'present' ? 'badge-green' : r.status === 'absent' ? 'badge-red' : 'badge-amber'}">
                ${r.status}
              </span>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── Load alert list (low attendance) ── */
async function loadAlerts() {
  const { data } = await sb.from('attendance_summary').select('*');
  if (!data) return;

  const map = {};
  data.forEach(r => {
    if (!map[r.student_id]) map[r.student_id] = { name: r.full_name, roll: r.roll_number, total: 0, present: 0 };
    map[r.student_id].total   += parseInt(r.total_classes)  || 0;
    map[r.student_id].present += parseInt(r.present_count)  || 0;
  });

  const alerts = Object.values(map)
    .map(s => ({ ...s, pct: s.total ? Math.round(s.present / s.total * 100) : 0 }))
    .filter(s => s.pct < 75)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  const el = document.getElementById('alertsList');
  el.innerHTML = alerts.length
    ? alerts.map(s => `
        <div class="alert-item ${s.pct < 65 ? 'danger' : 'warning'}">
          <div>
            <div style="font-size:13px;font-weight:500">${s.name}</div>
            <div style="font-size:11px;color:var(--muted)">${s.roll || ''}</div>
          </div>
          <span style="font-weight:700;color:var(--${s.pct < 65 ? 'danger' : 'warning'})">${s.pct}%</span>
        </div>`).join('')
    : '<div style="color:var(--muted);font-size:13px;padding:.5rem 0">✓ All students above 75%!</div>';
}

/* ── Students table rendering ── */
function renderStudentsTable(list) {
  const el = document.getElementById('studentsTableWrap');
  if (!list.length) { el.innerHTML = '<div class="empty">No students found.</div>'; return; }

  el.innerHTML = `
    <table>
      <thead><tr><th>Roll No</th><th>Name</th><th>Section</th><th>Email</th><th>Action</th></tr></thead>
      <tbody>
        ${list.map(s => `
          <tr>
            <td style="font-family:monospace;font-size:13px">${s.roll_number || '—'}</td>
            <td><strong>${s.full_name}</strong></td>
            <td><span class="badge badge-blue">Sec ${s.section || '—'}</span></td>
            <td style="font-size:13px;color:var(--muted)">${s.email}</td>
            <td>
              <button class="btn btn-outline btn-sm"
                onclick="aiQ('Give a detailed attendance analysis for ${s.full_name} (${s.roll_number || ''})');goPage('ai',null)">
                AI Report ↗
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── Student search filter ── */
function filterStudents() {
  const q = document.getElementById('studentSearch').value.toLowerCase();
  renderStudentsTable(
    allStudents.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q)
    )
  );
}

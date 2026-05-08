/* ─────────────────────────────────────
   attendance.js — Mark & Save Attendance
   ───────────────────────────────────── */

/* ── Update subtitle info strip ── */
function updateAttInfo() {
  const sub  = subjects.find(s => s.id === document.getElementById('subjectSel').value);
  const date = document.getElementById('attDate').value;
  document.getElementById('attSubInfo').textContent = sub ? `${sub.name} · ${date}` : '';
  loadAttGrid();
}

/* ── Render attendance card grid ── */
async function loadAttGrid() {
  const grid  = document.getElementById('attGrid');
  const subId = document.getElementById('subjectSel').value;
  const date  = document.getElementById('attDate').value;

  if (!subId || !date || !allStudents.length) {
    grid.innerHTML = '<div class="empty">Select a subject and date to load students.</div>';
    return;
  }

  // Fetch any already-saved records for this subject + date
  const { data: existing } = await sb
    .from('attendance')
    .select('student_id, status')
    .eq('subject_id', subId)
    .eq('date', date);

  const existMap = {};
  (existing || []).forEach(r => { existMap[r.student_id] = r.status; });

  // Filter students by subject's section
  const sub   = subjects.find(s => s.id === subId);
  const studs = sub
    ? allStudents.filter(s => !s.section || !sub.section || s.section === sub.section)
    : allStudents;

  if (!studs.length) {
    grid.innerHTML = '<div class="empty">No students found for this section.</div>';
    return;
  }

  grid.innerHTML = studs.map(s => {
    const status = existMap[s.id] || 'present';
    return `
      <div class="att-card" data-student="${s.id}">
        <div class="att-card-header">
          <div>
            <div class="att-name">${s.full_name}</div>
            <div class="att-roll">${s.roll_number || ''} · Sec ${s.section || '—'}</div>
          </div>
          <span class="badge badge-blue" style="font-size:11px">Sec ${s.section || '—'}</span>
        </div>
        <div class="att-btns">
          <button class="att-btn att-btn-p ${status === 'present' ? 'sel' : ''}" onclick="setStatus(this)">Present</button>
          <button class="att-btn att-btn-a ${status === 'absent'  ? 'sel' : ''}" onclick="setStatus(this)">Absent</button>
          <button class="att-btn att-btn-l ${status === 'leave'   ? 'sel' : ''}" onclick="setStatus(this)">Leave</button>
        </div>
      </div>`;
  }).join('');
}

/* ── Toggle selected status button ── */
function setStatus(btn) {
  btn.closest('.att-btns').querySelectorAll('.att-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

/* ── Mark all students present / absent ── */
function markAllStudents(status) {
  document.querySelectorAll('.att-btn').forEach(b => b.classList.remove('sel'));
  const cls = status === 'present' ? '.att-btn-p' : status === 'absent' ? '.att-btn-a' : '.att-btn-l';
  document.querySelectorAll(cls).forEach(b => b.classList.add('sel'));
}

/* ── Save attendance to Supabase ── */
async function saveAttendance() {
  const subId = document.getElementById('subjectSel').value;
  const date  = document.getElementById('attDate').value;

  if (!subId || !date) { toast('Please select a subject and date.', 'error'); return; }

  const cards = document.querySelectorAll('.att-card[data-student]');
  if (!cards.length)   { toast('No students to save.', 'error'); return; }

  const btn = document.getElementById('saveAttBtn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled  = true;

  // Build records array
  const records = [];
  cards.forEach(card => {
    const studentId = card.dataset.student;
    const selBtn    = card.querySelector('.att-btn.sel');
    const status    = selBtn?.classList.contains('att-btn-p') ? 'present'
                    : selBtn?.classList.contains('att-btn-a') ? 'absent'
                    : 'leave';
    records.push({ student_id: studentId, subject_id: subId, date, status, marked_by: currentUser.id });
  });

  const { error } = await sb
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,subject_id,date' });

  btn.innerHTML = 'Save Attendance';
  btn.disabled  = false;

  if (error) { toast('Error saving: ' + error.message, 'error'); return; }

  toast(`Saved attendance for ${records.length} students!`, 'success');
  loadRecentAttendance();
  loadStats();
}

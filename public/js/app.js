/* ─────────────────────────────────────
   app.js — App Initialization
   ───────────────────────────────────── */

/* ── Called after successful login ── */
async function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  // Set navbar info
  const name     = currentProfile?.full_name || currentUser.email;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isTeacher = currentProfile?.role !== 'student';

  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('navName').textContent   = name;
  document.getElementById('navRole').textContent   = isTeacher ? 'Teacher' : 'Student';

  // Greeting
  const hour   = new Date().getHours();
  const greet  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first  = name.split(' ')[0];
  document.getElementById('dashGreet').textContent = `${greet}, ${first}!`;
  document.getElementById('dashDate').textContent  = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Set today's date on attendance page
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];

  // Show/hide teacher-only elements
  document.querySelectorAll('.teacher-only').forEach(el => {
    el.classList.toggle('hidden', !isTeacher);
  });

  // Load all data in parallel
  await Promise.all([
    loadSubjects(),
    loadStudents(),
    loadStats(),
    loadRecentAttendance(),
    loadAlerts(),
    loadReports(),
  ]);
}
